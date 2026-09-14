// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer} from '@luma.gl/core';

import {
  type GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {getViewElementOffset, validatePackedView} from '@luma.gl/gpgpu/gpu-core';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  POSITION_FORMATS,
  RAW_POINT_WGSL,
  addGeospatialPass,
  assertGraphOwnership,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getPositionReadSource,
  getRowChunks,
  isGraphVectorView,
  validateDisjointGeospatialViews,
  validateMatchingRows,
  validateRowView
} from '../geospatial/geospatial-utils';
import type {
  GPUDoubleSinglePositions,
  GPUFloat32Positions,
  GPUGeospatialPositions
} from '../geospatial/types';
import {
  packProjectionPlan,
  PROJECTION_PATCH_WORD_LENGTH,
  PROJECTION_PLAN_BOUNDS_WORD_LENGTH
} from './projection-plan';
import type {ProjectionPlan, ProjectionPrecision} from './types';

/** Optional per-row plan-patch IDs, preserving the source vector's ordered chunk topology. */
export type GPUProjectionPatchIds = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Optional per-row validity values: one for projected rows and zero for rejected rows. */
export type GPUProjectionValidity = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

type GPUProjectionBaseProps = {
  /** Prefix used for generated graph-node and internally owned plan-buffer identifiers. */
  id?: string;
  /** Packed float32 positions or raw binary64 positions stored as uint32x4 rows. */
  positions: GPUGeospatialPositions;
  /** Provider-independent adaptive projection program compiled on the CPU. */
  plan: ProjectionPlan;
  /** Optional explicit patch index per position; omission performs source-domain lookup. */
  patchIds?: GPUProjectionPatchIds;
  /** Optional caller-owned validity rows: one for projected rows and zero for rejected rows. */
  validity?: GPUProjectionValidity;
  /** Optional initialized packed projection-plan storage created with {@link packProjectionPlan}. */
  planBuffer?: GraphDataView<'uint32'>;
};

/** Origin-relative Float32 projection output. */
export type GPUProjectionLocalFloat32Props = GPUProjectionBaseProps & {
  precision?: 'local-f32';
  /** Caller-owned Float32 results relative to `plan.destinationOrigin`. */
  output: GPUFloat32Positions;
};

/** Absolute double-single projection output backed by the fp64 arithmetic shader module. */
export type GPUProjectionDoubleSingleProps = GPUProjectionBaseProps & {
  precision: 'double-single';
  /** Caller-owned `[xHigh, xLow, yHigh, yLow]` double-single results. */
  output: GPUDoubleSinglePositions;
};

/** Input, precision-specific output, and optional plan storage for a projection contributor. */
export type GPUProjectionProps = GPUProjectionLocalFloat32Props | GPUProjectionDoubleSingleProps;

/**
 * Adds a provider-independent, precision-aware projection stage to a WebGPU command graph.
 *
 * `local-f32` results stay relative to the shared binary64 `plan.destinationOrigin`.
 * `double-single` uses the optimizer-resistant fp64 arithmetic module for source normalization,
 * polynomial evaluation, and absolute `[xHigh, xLow, yHigh, yLow]` results. Existing source chunks,
 * empty chunks, and physical-buffer ownership are preserved. Rejected rows produce zero output and
 * write zero to an optional validity column.
 *
 * Plans live in storage buffers instead of generated shader constants. {@link updatePlan} can
 * replace an equally sized plan without recompiling the surrounding command graph.
 */
export class GPUProjection implements GPUCommandGraphContributor {
  /** Prefix used for generated graph nodes and privately owned plan storage. */
  readonly id: string;
  /** Source rows, potentially containing raw binary64 coordinates. */
  readonly positions: GPUGeospatialPositions;
  /** Arithmetic and output precision used by this contributor. */
  readonly precision: ProjectionPrecision;
  /** Precision-specific caller-owned destination rows. */
  readonly output: GPUFloat32Positions | GPUDoubleSinglePositions;
  /** Optional per-row explicit patch IDs. */
  readonly patchIds?: GPUProjectionPatchIds;
  /** Optional per-row validity output. */
  readonly validity?: GPUProjectionValidity;
  /** Optional initialized caller-owned packed projection plan. */
  readonly planBuffer?: GraphDataView<'uint32'>;

  private projectionPlan: ProjectionPlan;
  private ownedPlanBuffer?: Buffer;
  private hasRegisteredGraph = false;
  private destroyed = false;

  /** Validates views and metadata without recording or submitting GPU work. */
  constructor(props: GPUProjectionProps) {
    this.id = props.id ?? 'gpu-projection';
    this.positions = props.positions;
    this.precision = props.precision ?? 'local-f32';
    this.output = props.output;
    this.projectionPlan = props.plan;
    this.patchIds = props.patchIds;
    this.validity = props.validity;
    this.planBuffer = props.planBuffer;

    validateProjectionPlan(props.plan, this.id);
    if (props.plan.precision !== this.precision) {
      throw new Error(`${this.id} precision must match its compiled projection plan`);
    }
    validateRowView(this.positions, POSITION_FORMATS, `${this.id} positions`);
    validateRowView(
      this.output,
      [this.precision === 'double-single' ? 'float32x4' : 'float32x2'],
      `${this.id} output`
    );
    validateMatchingRows(this.positions, this.output, `${this.id} positions and output`);

    const inputs: Array<readonly [string, GPUGeospatialPositions | GPUProjectionPatchIds]> = [
      ['positions', this.positions]
    ];
    if (this.patchIds) {
      validateRowView(this.patchIds, ['uint32'], `${this.id} patch IDs`);
      validateMatchingRows(this.positions, this.patchIds, `${this.id} positions and patch IDs`);
      inputs.push(['patch IDs', this.patchIds]);
    }
    if (this.validity) {
      validateRowView(this.validity, ['uint32'], `${this.id} validity`);
      validateMatchingRows(this.positions, this.validity, `${this.id} positions and validity`);
    }

    if (this.planBuffer) {
      validatePackedView(this.planBuffer, ['uint32'], `${this.id} plan buffer`);
      if (
        this.planBuffer.length <
        props.plan.patches.length * PROJECTION_PATCH_WORD_LENGTH +
          PROJECTION_PLAN_BOUNDS_WORD_LENGTH
      ) {
        throw new Error(`${this.id} plan buffer is smaller than its packed projection plan`);
      }
      inputs.push(['plan buffer', this.planBuffer]);
    }
    validateDisjointGeospatialViews(this.id, inputs, [
      ['output', this.output],
      ...(this.validity ? ([['validity', this.validity]] as const) : [])
    ]);
  }

  /** Current plan; local Float32 output rows are relative to its binary64 destination origin. */
  get plan(): ProjectionPlan {
    return this.projectionPlan;
  }

  /**
   * Updates existing packed plan storage while retaining the compiled shader and graph topology.
   *
   * Imported plan views must expose a default buffer; imports replaced dynamically by the caller
   * should instead be updated explicitly using {@link packProjectionPlan}.
   */
  updatePlan(plan: ProjectionPlan): void {
    this.assertAvailable();
    validateProjectionPlan(plan, this.id);
    if (plan.precision !== this.precision) {
      throw new Error(`${this.id} updated projection plan must retain its precision`);
    }
    if (plan.patches.length !== this.projectionPlan.patches.length) {
      throw new Error(`${this.id} updated projection plan must retain the same patch count`);
    }

    const packedPlan = packProjectionPlan(plan);
    if (this.ownedPlanBuffer) {
      this.ownedPlanBuffer.write(packedPlan);
    } else if (this.planBuffer) {
      const externalBuffer = this.planBuffer.buffer.defaultBuffer;
      if (!externalBuffer) {
        throw new Error(`${this.id} caller-owned projection plan must be updated by its owner`);
      }
      if ((this.planBuffer.buffer.usage & Buffer.COPY_DST) === 0) {
        throw new Error(`${this.id} caller-owned projection plan updates require COPY_DST usage`);
      }
      externalBuffer.write(packedPlan, this.planBuffer.byteOffset);
    }
    this.projectionPlan = plan;
  }

  /** Adds one compute node for each nonempty input chunk without packing or copying source rows. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    this.assertAvailable();
    if (this.hasRegisteredGraph) {
      throw new Error(`${this.id} projection contributor has already been added to a graph`);
    }
    const views: Array<
      | GPUGeospatialPositions
      | GPUFloat32Positions
      | GPUDoubleSinglePositions
      | GPUProjectionPatchIds
    > = [this.positions, this.output];
    if (this.patchIds) {
      views.push(this.patchIds);
    }
    if (this.validity) {
      views.push(this.validity);
    }
    assertGraphOwnership(graph, views, this.id);
    if (this.planBuffer && this.planBuffer.buffer.graph !== graph) {
      throw new Error(`${this.id} projection plan buffer must belong to the target graph`);
    }

    const planView = this.planBuffer ?? this.createOwnedPlanView(graph);
    const inputChunks = getRowChunks(this.positions);
    const outputChunks = getRowChunks(this.output);
    const patchIdChunks = this.patchIds ? getRowChunks(this.patchIds) : undefined;
    const validityChunks = this.validity ? getRowChunks(this.validity) : undefined;

    for (let chunkIndex = 0; chunkIndex < inputChunks.length; chunkIndex++) {
      const input = inputChunks[chunkIndex];
      if (input.length === 0) {
        continue;
      }
      this.addProjectionPass(graph, {
        chunkIndex,
        input,
        output: outputChunks[chunkIndex],
        patchIds: patchIdChunks?.[chunkIndex],
        validity: validityChunks?.[chunkIndex],
        plan: planView
      });
    }

    this.hasRegisteredGraph = true;
  }

  /** Releases privately allocated plan storage; caller-owned input, output, and plan remain intact. */
  destroy(): void {
    if (!this.destroyed) {
      this.ownedPlanBuffer?.destroy();
      this.ownedPlanBuffer = undefined;
      this.destroyed = true;
    }
  }

  private createOwnedPlanView<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): GraphDataView<'uint32'> {
    const words = packProjectionPlan(this.projectionPlan);
    const id = `${this.id}-projection-plan`;
    const buffer = graph.device.createBuffer({
      id,
      data: words,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.ownedPlanBuffer = buffer;
    const handle = graph.importBuffer(
      {id, byteLength: words.byteLength, usage: buffer.usage},
      buffer
    );
    return graph.createDataView(handle, {format: 'uint32', length: words.length});
  }

  private addProjectionPass<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    options: {
      chunkIndex: number;
      input: GraphDataView<'float32x2' | 'uint32x4'>;
      output: GraphDataView<'float32x2' | 'float32x4'>;
      patchIds?: GraphDataView<'uint32'>;
      validity?: GraphDataView<'uint32'>;
      plan: GraphDataView<'uint32'>;
    }
  ): void {
    const {chunkIndex, input, output, patchIds, validity, plan} = options;
    const inputSource = getPositionReadSource('positions', input);
    const dispatchLayout = getGeospatialDispatchLayout(
      input.length,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const resources: GraphBufferUse[] = [
      {buffer: input, usage: 'storage-read'},
      {buffer: plan, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ];
    const bindings: Record<string, GraphDataView> = {
      positions: input,
      projectionPlans: plan,
      outputPositions: output
    };
    if (patchIds) {
      resources.push({buffer: patchIds, usage: 'storage-read'});
      bindings['projectionPatchIds'] = patchIds;
    }
    if (validity) {
      resources.push({buffer: validity, usage: 'storage-write'});
      bindings['projectionValidity'] = validity;
    }

    const source = getProjectionShaderSource({
      precise: inputSource.precise,
      doubleSingle: this.precision === 'double-single',
      inputDeclaration: inputSource.declaration,
      readPosition: inputSource.read('index'),
      elementCount: input.length,
      patchCount: this.projectionPlan.patches.length,
      outputOffset: getViewElementOffset(output) / (this.precision === 'double-single' ? 4 : 2),
      planOffset: getViewElementOffset(plan),
      patchIdOffset: patchIds ? getViewElementOffset(patchIds) : undefined,
      validityOffset: validity ? getViewElementOffset(validity) : undefined,
      invocationIndexSource: getGeospatialInvocationIndexSource(dispatchLayout)
    });

    addGeospatialPass(graph, {
      id: isGraphVectorView(this.positions) ? `${this.id}-chunk-${chunkIndex}` : this.id,
      source,
      resources,
      bindings,
      dispatchLayout,
      precise: inputSource.precise || this.precision === 'double-single'
    });
  }

  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error(`${this.id} projection contributor has been destroyed`);
    }
  }
}

function validateProjectionPlan(plan: ProjectionPlan, id: string): void {
  if (!plan || !Array.isArray(plan.patches) || plan.patches.length === 0) {
    throw new Error(`${id} projection plan must contain at least one patch`);
  }
  if (
    !Array.isArray(plan.bounds) ||
    plan.bounds.length !== 4 ||
    !plan.bounds.every(Number.isFinite) ||
    plan.bounds[0] >= plan.bounds[2] ||
    plan.bounds[1] >= plan.bounds[3]
  ) {
    throw new Error(`${id} projection plan must contain finite, increasing source bounds`);
  }
  if (
    (plan.precision !== 'local-f32' && plan.precision !== 'double-single') ||
    plan.patches.some(
      (patch, patchIndex) =>
        patch.id !== patchIndex ||
        !patch.sourceOrigin.every(Number.isFinite) ||
        !patch.destinationOrigin.every(Number.isFinite) ||
        !patch.sourceScale.every(
          (scale: number) =>
            scale > 0 && Number.isFinite(Math.fround(scale)) && Math.fround(scale) > 0
        ) ||
        !(patch.doubleSingleCoefficientsX instanceof Float64Array) ||
        !(patch.doubleSingleCoefficientsY instanceof Float64Array) ||
        !patch.doubleSingleCoefficientsX.every(Number.isFinite) ||
        !patch.doubleSingleCoefficientsY.every(Number.isFinite)
    )
  ) {
    throw new Error(`${id} projection plan must contain finite, consecutively numbered patches`);
  }
  if (!plan.destinationOrigin.every(Number.isFinite)) {
    throw new Error(`${id} projection destination origin must contain finite coordinates`);
  }
}

function getProjectionShaderSource(options: {
  precise: boolean;
  doubleSingle: boolean;
  inputDeclaration: string;
  readPosition: string;
  elementCount: number;
  patchCount: number;
  outputOffset: number;
  planOffset: number;
  patchIdOffset?: number;
  validityOffset?: number;
  invocationIndexSource: string;
}): string {
  const {
    precise,
    doubleSingle,
    inputDeclaration,
    readPosition,
    elementCount,
    patchCount,
    outputOffset,
    planOffset,
    patchIdOffset,
    validityOffset,
    invocationIndexSource
  } = options;
  const positionType = precise ? 'RawPoint' : 'vec2f';
  const sourceOffset = precise
    ? `let originX = vec2u(projectionPlanWord(patchIndex, 1u), projectionPlanWord(patchIndex, 0u));
  let originY = vec2u(projectionPlanWord(patchIndex, 3u), projectionPlanWord(patchIndex, 2u));
  return vec2f(
    sub_fp64u32_to_f32(position.x, originX),
    sub_fp64u32_to_f32(position.y, originY)
  );`
    : `let sourceOriginHigh = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 13u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 14u))
  );
  let sourceOriginLow = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 10u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 11u))
  );
  // Route the rounded high-limb subtraction through an opaque runtime-zero integer operation.
  // Metal otherwise reassociates these subtractions and silently drops the low origin limb.
  let highOffsetBits = bitcast<vec2u>(position - sourceOriginHigh) ^
    vec2u(projectionPlanWord(patchIndex, 15u));
  let highOffset = bitcast<vec2f>(highOffsetBits);
  return highOffset - sourceOriginLow;`;
  const finitePosition = precise
    ? 'rawPointIsFinite(position)'
    : `all((bitcast<vec2u>(position) & vec2u(0x7f800000u)) != vec2u(0x7f800000u))`;
  const planContains = precise
    ? `let minimumX = projectionPlanRawBound(0u);
  let minimumY = projectionPlanRawBound(1u);
  let maximumX = projectionPlanRawBound(2u);
  let maximumY = projectionPlanRawBound(3u);
  return compareFiniteBinary64(position.x, minimumX) >= 0 &&
    compareFiniteBinary64(position.y, minimumY) >= 0 &&
    compareFiniteBinary64(position.x, maximumX) <= 0 &&
    compareFiniteBinary64(position.y, maximumY) <= 0;`
    : `let minimum = vec2f(
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 8u]),
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 9u])
  );
  let maximum = vec2f(
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 10u]),
    bitcast<f32>(projectionPlans[PLAN_BOUNDS_OFFSET + 11u])
  );
  return all(position >= minimum) && all(position <= maximum);`;
  const precisePlanBoundsFunctions = precise
    ? `fn projectionPlanRawBound(boundIndex: u32) -> vec2u {
  let wordOffset = PLAN_BOUNDS_OFFSET + boundIndex * 2u;
  return vec2u(
    projectionPlans[wordOffset + 1u],
    projectionPlans[wordOffset]
  );
}

fn compareFiniteBinary64(firstBits: vec2u, secondBits: vec2u) -> i32 {
  let first = fp64_decode_bits(firstBits);
  let second = fp64_decode_bits(secondBits);
  if (first.isZero && second.isZero) {
    return 0;
  }
  if (first.sign != second.sign) {
    return select(1, -1, first.sign == 1u);
  }
  let magnitudeComparison = fp64_finite_magnitude_compare(first, second);
  return select(magnitudeComparison, -magnitudeComparison, first.sign == 1u);
}`
    : '';
  const patchIdDeclaration =
    patchIdOffset === undefined
      ? ''
      : `const PATCH_ID_OFFSET: u32 = ${patchIdOffset}u;
@group(0) @binding(auto) var<storage, read> projectionPatchIds: array<u32>;`;
  const selectedPatch =
    patchIdOffset === undefined
      ? 'findProjectionPatch(position)'
      : 'projectionPatchIds[PATCH_ID_OFFSET + index]';
  const validityDeclaration =
    validityOffset === undefined
      ? ''
      : `const VALIDITY_OFFSET: u32 = ${validityOffset}u;
@group(0) @binding(auto) var<storage, read_write> projectionValidity: array<u32>;`;
  const writeInvalid = `outputPositions[OUTPUT_OFFSET + index] = ${
    doubleSingle ? 'vec4f(0.0)' : 'vec2f(0.0)'
  };${
    validityOffset === undefined ? '' : '\n    projectionValidity[VALIDITY_OFFSET + index] = 0u;'
  }`;
  const writeValidity =
    validityOffset === undefined ? '' : 'projectionValidity[VALIDITY_OFFSET + index] = 1u;';
  const doubleSingleSourceOffset = precise
    ? `let originX = vec2u(projectionPlanWord(patchIndex, 1u), projectionPlanWord(patchIndex, 0u));
  let originY = vec2u(projectionPlanWord(patchIndex, 3u), projectionPlanWord(patchIndex, 2u));
  return ProjectionPointFP64(
    sub_fp64u32_to_fp64(position.x, originX),
    sub_fp64u32_to_fp64(position.y, originY)
  );`
    : `let sourceOriginX = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 13u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 10u))
  );
  let sourceOriginY = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 14u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 11u))
  );
  return ProjectionPointFP64(
    sub_fp64(vec2f(position.x, 0.0), sourceOriginX),
    sub_fp64(vec2f(position.y, 0.0), sourceOriginY)
  );`;
  const doubleSingleFunctions = doubleSingle
    ? `struct ProjectionPointFP64 { x: vec2f, y: vec2f }

fn projectionSourceOffsetFP64(
  position: ${positionType},
  patchIndex: u32
) -> ProjectionPointFP64 {
  ${doubleSingleSourceOffset}
}

fn normalizeProjectionPositionFP64(
  position: ${positionType},
  patchIndex: u32
) -> ProjectionPointFP64 {
  let sourceOffset = projectionSourceOffsetFP64(position, patchIndex);
  let sourceScaleX = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 4u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 60u))
  );
  let sourceScaleY = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 5u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 61u))
  );
  return ProjectionPointFP64(
    div_fp64(sourceOffset.x, sourceScaleX),
    div_fp64(sourceOffset.y, sourceScaleY)
  );
}

fn projectionCoefficientFP64(
  patchIndex: u32,
  highOffset: u32,
  lowOffset: u32,
  coefficientIndex: u32
) -> vec2f {
  return vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, highOffset + coefficientIndex)),
    bitcast<f32>(projectionPlanWord(patchIndex, lowOffset + coefficientIndex))
  );
}

fn projectionMultiplyAddFP64(multiplier: vec2f, multiplicand: vec2f, addend: vec2f) -> vec2f {
  return sum_fp64(addend, mul_fp64(multiplier, multiplicand));
}

fn evaluateProjectionPolynomialFP64(
  patchIndex: u32,
  highOffset: u32,
  lowOffset: u32,
  normalized: ProjectionPointFP64
) -> vec2f {
  let coefficient0 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 0u);
  let coefficient1 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 1u);
  let coefficient2 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 2u);
  let coefficient3 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 3u);
  let coefficient4 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 4u);
  let coefficient5 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 5u);
  let coefficient6 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 6u);
  let coefficient7 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 7u);
  let coefficient8 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 8u);
  let coefficient9 = projectionCoefficientFP64(patchIndex, highOffset, lowOffset, 9u);

  let xQuadratic = projectionMultiplyAddFP64(normalized.x, coefficient6, coefficient3);
  let xLinear = projectionMultiplyAddFP64(normalized.x, xQuadratic, coefficient1);
  let mixedLinear = projectionMultiplyAddFP64(normalized.x, coefficient7, coefficient4);
  let yQuadraticX = projectionMultiplyAddFP64(normalized.x, coefficient8, coefficient5);
  let yQuadratic = projectionMultiplyAddFP64(normalized.y, coefficient9, yQuadraticX);
  let yLinearX = projectionMultiplyAddFP64(normalized.x, mixedLinear, coefficient2);
  let yLinear = projectionMultiplyAddFP64(normalized.y, yQuadratic, yLinearX);
  let xContribution = projectionMultiplyAddFP64(normalized.x, xLinear, coefficient0);
  return projectionMultiplyAddFP64(normalized.y, yLinear, xContribution);
}

fn projectionDestinationOriginFP64(patchIndex: u32, wordOffset: u32) -> vec2f {
  let value = vec2u(
    projectionPlanWord(patchIndex, wordOffset + 1u),
    projectionPlanWord(patchIndex, wordOffset)
  );
  return sub_fp64u32_to_fp64(value, vec2u(0u));
}`
    : '';
  const writeResult = doubleSingle
    ? `let normalizedFP64 = normalizeProjectionPositionFP64(position, patchIndex);
  let projectedX = sum_fp64(
    projectionDestinationOriginFP64(patchIndex, 16u),
    evaluateProjectionPolynomialFP64(patchIndex, 20u, 40u, normalizedFP64)
  );
  let projectedY = sum_fp64(
    projectionDestinationOriginFP64(patchIndex, 18u),
    evaluateProjectionPolynomialFP64(patchIndex, 30u, 50u, normalizedFP64)
  );
  outputPositions[OUTPUT_OFFSET + index] = vec4f(
    projectedX.x,
    projectedX.y,
    projectedY.x,
    projectedY.y
  );`
    : `let normalized = normalizeProjectionPosition(position, patchIndex);
  let destinationOffset = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 6u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 7u))
  );
  outputPositions[OUTPUT_OFFSET + index] = destinationOffset + vec2f(
    evaluateProjectionPolynomial(patchIndex, 20u, normalized),
    evaluateProjectionPolynomial(patchIndex, 30u, normalized)
  );`;

  return /* wgsl */ `
${precise ? RAW_POINT_WGSL : ''}
const ELEMENT_COUNT: u32 = ${elementCount}u;
const PATCH_COUNT: u32 = ${patchCount}u;
const PATCH_WORD_LENGTH: u32 = ${PROJECTION_PATCH_WORD_LENGTH}u;
const PLAN_OFFSET: u32 = ${planOffset}u;
const PLAN_BOUNDS_OFFSET: u32 = PLAN_OFFSET + PATCH_COUNT * PATCH_WORD_LENGTH;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
const INVALID_PATCH: u32 = 0xffffffffu;

${inputDeclaration}
@group(0) @binding(auto) var<storage, read> projectionPlans: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputPositions: array<${
    doubleSingle ? 'vec4f' : 'vec2f'
  }>;
${patchIdDeclaration}
${validityDeclaration}

fn projectionPlanWord(patchIndex: u32, wordIndex: u32) -> u32 {
  return projectionPlans[PLAN_OFFSET + patchIndex * PATCH_WORD_LENGTH + wordIndex];
}

${precisePlanBoundsFunctions}

fn projectionPlanContains(position: ${positionType}) -> bool {
  ${planContains}
}

fn projectionSourceOffset(position: ${positionType}, patchIndex: u32) -> vec2f {
  ${sourceOffset}
}

fn normalizeProjectionPosition(position: ${positionType}, patchIndex: u32) -> vec2f {
  let sourceScale = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 4u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 5u))
  );
  return projectionSourceOffset(position, patchIndex) / sourceScale;
}

fn projectionPatchContains(position: ${positionType}, patchIndex: u32) -> bool {
  let normalized = normalizeProjectionPosition(position, patchIndex);
  let minimum = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 8u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 9u))
  );
  // Source scales are half-extents, so the opposite boundary is exactly two normalized units
  // away. Two float32 ULPs keep legitimate binary64 endpoints from falling through a seam.
  let maximum = minimum + vec2f(2.0);
  let boundaryTolerance = vec2f(2.384185791015625e-7);
  return all(normalized >= minimum - boundaryTolerance) &&
    all(normalized <= maximum + boundaryTolerance);
}

fn findProjectionPatch(position: ${positionType}) -> u32 {
  for (var patchIndex: u32 = 0u; patchIndex < PATCH_COUNT; patchIndex += 1u) {
    if (projectionPatchContains(position, patchIndex)) {
      return patchIndex;
    }
  }
  return INVALID_PATCH;
}

fn evaluateProjectionPolynomial(
  patchIndex: u32,
  coefficientOffset: u32,
  normalized: vec2f
) -> f32 {
  // Lower-degree records are zero-padded, so one branch-free Horner expression handles every
  // supported degree without dynamically indexed temporary arrays or nested shader loops.
  let coefficient0 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 0u));
  let coefficient1 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 1u));
  let coefficient2 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 2u));
  let coefficient3 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 3u));
  let coefficient4 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 4u));
  let coefficient5 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 5u));
  let coefficient6 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 6u));
  let coefficient7 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 7u));
  let coefficient8 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 8u));
  let coefficient9 = bitcast<f32>(projectionPlanWord(patchIndex, coefficientOffset + 9u));

  let xQuadratic = coefficient3 + normalized.x * coefficient6;
  let xLinear = coefficient1 + normalized.x * xQuadratic;
  let mixedLinear = coefficient4 + normalized.x * coefficient7;
  let yQuadraticX = coefficient5 + normalized.x * coefficient8;
  let yQuadratic = yQuadraticX + normalized.y * coefficient9;
  let yLinearX = coefficient2 + normalized.x * mixedLinear;
  let yLinear = yLinearX + normalized.y * yQuadratic;
  let xContribution = coefficient0 + normalized.x * xLinear;
  return xContribution + normalized.y * yLinear;
}

${doubleSingleFunctions}

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${invocationIndexSource}
  if (index >= ELEMENT_COUNT) { return; }
  let position = ${readPosition};
  if (!(${finitePosition})) {
    ${writeInvalid}
    return;
  }
  if (!projectionPlanContains(position)) {
    ${writeInvalid}
    return;
  }
  let patchIndex = ${selectedPatch};
  if (patchIndex >= PATCH_COUNT || !projectionPatchContains(position, patchIndex)) {
    ${writeInvalid}
    return;
  }
  ${writeResult}
  ${writeValidity}
}`;
}
