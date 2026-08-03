// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';

import {
  type GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-primitives/gpu-command-graph';
import {getViewElementOffset, validatePackedView} from '../gpu-primitives/graph-data-view-utils';
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
import type {GPUFloat32Positions, GPUGeospatialPositions} from '../geospatial/types';
import {packProjectionPlan, PROJECTION_PATCH_WORD_LENGTH} from './projection-plan';
import type {ProjectionPlan} from './types';

/** Optional per-row plan-patch IDs, preserving the source vector's ordered chunk topology. */
export type GPUProjectionPatchIds = GraphDataView<'uint32'> | GraphVectorView<'uint32'>;

/** Input, destination, and optional caller-owned plan storage for a GPU projection contributor. */
export type GPUProjectionProps = {
  /** Prefix used for generated graph-node and internally owned plan-buffer identifiers. */
  id?: string;
  /** Packed float32 positions or raw binary64 positions stored as uint32x4 rows. */
  positions: GPUGeospatialPositions;
  /** Caller-owned float32 results relative to `plan.destinationOrigin`. */
  output: GPUFloat32Positions;
  /** Provider-independent adaptive projection program compiled on the CPU. */
  plan: ProjectionPlan;
  /** Optional explicit patch index per position; omission performs source-domain lookup. */
  patchIds?: GPUProjectionPatchIds;
  /** Optional initialized packed patch storage created with {@link packProjectionPlan}. */
  planBuffer?: GraphDataView<'uint32'>;
};

/**
 * Adds a provider-independent, precision-aware projection stage to a WebGPU command graph.
 *
 * Raw binary64 inputs are translated relative to their patch origin using integer-backed binary64
 * subtraction before conversion to float32. Destination rows stay relative to the shared binary64
 * `plan.destinationOrigin`; adding that origin back into a float32 shader would lose the recovered
 * precision. Existing source chunks, empty chunks, and physical-buffer ownership are preserved.
 * Non-finite positions, positions outside the plan, and invalid patch IDs produce `[0, 0]`.
 *
 * Plans live in storage buffers instead of generated shader constants. {@link updatePlan} can
 * replace an equally sized plan without recompiling the surrounding command graph.
 */
export class GPUProjection implements GPUCommandGraphContributor {
  /** Prefix used for generated graph nodes and privately owned plan storage. */
  readonly id: string;
  /** Source rows, potentially containing raw binary64 coordinates. */
  readonly positions: GPUGeospatialPositions;
  /** Local destination rows relative to {@link plan}.destinationOrigin. */
  readonly output: GPUFloat32Positions;
  /** Optional per-row explicit patch IDs. */
  readonly patchIds?: GPUProjectionPatchIds;
  /** Optional initialized caller-owned packed projection plan. */
  readonly planBuffer?: GraphDataView<'uint32'>;

  private projectionPlan: ProjectionPlan;
  private ownedPlanBuffer?: Buffer;
  private ownedBoundsBuffer?: Buffer;
  private hasRegisteredGraph = false;
  private destroyed = false;

  /** Validates views and metadata without recording or submitting GPU work. */
  constructor(props: GPUProjectionProps) {
    this.id = props.id ?? 'gpu-projection';
    this.positions = props.positions;
    this.output = props.output;
    this.projectionPlan = props.plan;
    this.patchIds = props.patchIds;
    this.planBuffer = props.planBuffer;

    validateProjectionPlan(props.plan, this.id);
    validateRowView(this.positions, POSITION_FORMATS, `${this.id} positions`);
    validateRowView(this.output, ['float32x2'], `${this.id} output`);
    validateMatchingRows(this.positions, this.output, `${this.id} positions and output`);

    const inputs: Array<readonly [string, GPUGeospatialPositions | GPUProjectionPatchIds]> = [
      ['positions', this.positions]
    ];
    if (this.patchIds) {
      validateRowView(this.patchIds, ['uint32'], `${this.id} patch IDs`);
      validateMatchingRows(this.positions, this.patchIds, `${this.id} positions and patch IDs`);
      inputs.push(['patch IDs', this.patchIds]);
    }

    if (this.planBuffer) {
      validatePackedView(this.planBuffer, ['uint32'], `${this.id} plan buffer`);
      if (this.planBuffer.length < props.plan.patches.length * PROJECTION_PATCH_WORD_LENGTH) {
        throw new Error(`${this.id} plan buffer is smaller than its packed projection plan`);
      }
      inputs.push(['plan buffer', this.planBuffer]);
    }
    validateDisjointGeospatialViews(this.id, inputs, [['output', this.output]]);
  }

  /** Current plan; GPU output rows are relative to its binary64 destination origin. */
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
    this.ownedBoundsBuffer?.write(packProjectionBounds(plan));
    this.projectionPlan = plan;
  }

  /** Adds one compute node for each nonempty input chunk without packing or copying source rows. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    this.assertAvailable();
    if (this.hasRegisteredGraph) {
      throw new Error(`${this.id} projection contributor has already been added to a graph`);
    }
    const views: Array<GPUGeospatialPositions | GPUFloat32Positions | GPUProjectionPatchIds> = [
      this.positions,
      this.output
    ];
    if (this.patchIds) {
      views.push(this.patchIds);
    }
    assertGraphOwnership(graph, views, this.id);
    if (this.planBuffer && this.planBuffer.buffer.graph !== graph) {
      throw new Error(`${this.id} projection plan buffer must belong to the target graph`);
    }

    const planView = this.planBuffer ?? this.createOwnedPlanView(graph);
    const boundsView = this.createOwnedBoundsView(graph);
    const inputChunks = getRowChunks(this.positions);
    const outputChunks = getRowChunks(this.output);
    const patchIdChunks = this.patchIds ? getRowChunks(this.patchIds) : undefined;

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
        plan: planView,
        bounds: boundsView
      });
    }

    this.hasRegisteredGraph = true;
  }

  /** Releases privately allocated plan and bounds storage; caller-owned resources remain intact. */
  destroy(): void {
    if (!this.destroyed) {
      this.ownedPlanBuffer?.destroy();
      this.ownedPlanBuffer = undefined;
      this.ownedBoundsBuffer?.destroy();
      this.ownedBoundsBuffer = undefined;
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

  private createOwnedBoundsView<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): GraphDataView<'uint32'> {
    const words = packProjectionBounds(this.projectionPlan);
    const id = `${this.id}-projection-bounds`;
    const buffer = graph.device.createBuffer({
      id,
      data: words,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.ownedBoundsBuffer = buffer;
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
      output: GraphDataView<'float32x2'>;
      patchIds?: GraphDataView<'uint32'>;
      plan: GraphDataView<'uint32'>;
      bounds: GraphDataView<'uint32'>;
    }
  ): void {
    const {chunkIndex, input, output, patchIds, plan, bounds} = options;
    const inputSource = getPositionReadSource('positions', input);
    const dispatchLayout = getGeospatialDispatchLayout(
      input.length,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const resources: GraphBufferUse[] = [
      {buffer: input, usage: 'storage-read'},
      {buffer: plan, usage: 'storage-read'},
      {buffer: bounds, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ];
    const bindings: Record<string, GraphDataView> = {
      positions: input,
      projectionPlans: plan,
      projectionBounds: bounds,
      outputPositions: output
    };
    if (patchIds) {
      resources.push({buffer: patchIds, usage: 'storage-read'});
      bindings['projectionPatchIds'] = patchIds;
    }

    const source = getProjectionShaderSource({
      precise: inputSource.precise,
      inputDeclaration: inputSource.declaration,
      readPosition: inputSource.read('index'),
      elementCount: input.length,
      patchCount: this.projectionPlan.patches.length,
      outputOffset: getViewElementOffset(output) / 2,
      planOffset: getViewElementOffset(plan),
      patchIdOffset: patchIds ? getViewElementOffset(patchIds) : undefined,
      invocationIndexSource: getGeospatialInvocationIndexSource(dispatchLayout)
    });

    addGeospatialPass(graph, {
      id: isGraphVectorView(this.positions) ? `${this.id}-chunk-${chunkIndex}` : this.id,
      source,
      resources,
      bindings,
      dispatchLayout,
      precise: inputSource.precise
    });
  }

  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error(`${this.id} projection contributor has been destroyed`);
    }
  }
}

function packProjectionBounds(plan: ProjectionPlan): Uint32Array {
  const words = new Uint32Array(8);
  const dataView = new DataView(words.buffer);
  for (let coordinateIndex = 0; coordinateIndex < plan.bounds.length; coordinateIndex++) {
    dataView.setFloat64(
      coordinateIndex * Float64Array.BYTES_PER_ELEMENT,
      plan.bounds[coordinateIndex],
      true
    );
  }
  return words;
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
    plan.patches.some(
      (patch, patchIndex) =>
        patch.id !== patchIndex ||
        !patch.sourceOrigin.every(Number.isFinite) ||
        !patch.destinationOrigin.every(Number.isFinite) ||
        !patch.sourceScale.every(
          (scale: number) =>
            scale > 0 && Number.isFinite(Math.fround(scale)) && Math.fround(scale) > 0
        )
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
  inputDeclaration: string;
  readPosition: string;
  elementCount: number;
  patchCount: number;
  outputOffset: number;
  planOffset: number;
  patchIdOffset?: number;
  invocationIndexSource: string;
}): string {
  const {
    precise,
    inputDeclaration,
    readPosition,
    elementCount,
    patchCount,
    outputOffset,
    planOffset,
    patchIdOffset,
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
  const rawBoundsCoordinates = precise
    ? `let coordinateX = position.x;
  let coordinateY = position.y;`
    : `let coordinateX = projectionFloat32ToRaw(position.x);
  let coordinateY = projectionFloat32ToRaw(position.y);`;
  const float32Conversion = precise
    ? ''
    : `fn projectionFloat32ToRaw(value: f32) -> vec2u {
  let bits = bitcast<u32>(value);
  let sign = bits & 0x80000000u;
  let exponent = (bits >> 23u) & 0xffu;
  let fraction = bits & 0x007fffffu;

  if (exponent == 0u) {
    if (fraction == 0u) {
      return vec2u(sign, 0u);
    }
    let leading = 31u - countLeadingZeros(fraction);
    let normalizedFraction = (fraction << (23u - leading)) & 0x007fffffu;
    let binary64Exponent = leading + 874u;
    return vec2u(
      sign | (binary64Exponent << 20u) | (normalizedFraction >> 3u),
      normalizedFraction << 29u
    );
  }

  let binary64Exponent = exponent + 896u;
  return vec2u(sign | (binary64Exponent << 20u) | (fraction >> 3u), fraction << 29u);
}`;
  const patchIdDeclaration =
    patchIdOffset === undefined
      ? ''
      : `const PATCH_ID_OFFSET: u32 = ${patchIdOffset}u;
@group(0) @binding(auto) var<storage, read> projectionPatchIds: array<u32>;`;
  const selectedPatch =
    patchIdOffset === undefined
      ? 'findProjectionPatch(position)'
      : 'projectionPatchIds[PATCH_ID_OFFSET + index]';

  return /* wgsl */ `
${precise ? RAW_POINT_WGSL : ''}
const ELEMENT_COUNT: u32 = ${elementCount}u;
const PATCH_COUNT: u32 = ${patchCount}u;
const PATCH_WORD_LENGTH: u32 = ${PROJECTION_PATCH_WORD_LENGTH}u;
const PLAN_OFFSET: u32 = ${planOffset}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
const INVALID_PATCH: u32 = 0xffffffffu;

${inputDeclaration}
@group(0) @binding(auto) var<storage, read> projectionPlans: array<u32>;
@group(0) @binding(auto) var<storage, read> projectionBounds: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputPositions: array<vec2f>;
${patchIdDeclaration}

${float32Conversion}

fn projectionRawLess(first: vec2u, second: vec2u) -> bool {
  let firstMagnitude = first.x & 0x7fffffffu;
  let secondMagnitude = second.x & 0x7fffffffu;
  if ((firstMagnitude | first.y | secondMagnitude | second.y) == 0u) {
    return false;
  }

  let firstNegative = (first.x & 0x80000000u) != 0u;
  let secondNegative = (second.x & 0x80000000u) != 0u;
  if (firstNegative != secondNegative) {
    return firstNegative;
  }
  // Boolean-valued select expressions crash Chromium's Metal compiler; branch explicitly.
  if (first.x != second.x) {
    if (firstNegative) {
      return first.x > second.x;
    }
    return first.x < second.x;
  }
  if (firstNegative) {
    return first.y > second.y;
  }
  return first.y < second.y;
}

fn projectionBoundsContains(position: ${positionType}) -> bool {
  ${rawBoundsCoordinates}
  let minimumX = vec2u(projectionBounds[1u], projectionBounds[0u]);
  let minimumY = vec2u(projectionBounds[3u], projectionBounds[2u]);
  let maximumX = vec2u(projectionBounds[5u], projectionBounds[4u]);
  let maximumY = vec2u(projectionBounds[7u], projectionBounds[6u]);
  return !projectionRawLess(coordinateX, minimumX) &&
    !projectionRawLess(maximumX, coordinateX) &&
    !projectionRawLess(coordinateY, minimumY) &&
    !projectionRawLess(maximumY, coordinateY);
}

fn projectionPlanWord(patchIndex: u32, wordIndex: u32) -> u32 {
  return projectionPlans[PLAN_OFFSET + patchIndex * PATCH_WORD_LENGTH + wordIndex];
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

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${invocationIndexSource}
  if (index >= ELEMENT_COUNT) { return; }
  let position = ${readPosition};
  if (!(${finitePosition}) || !projectionBoundsContains(position)) {
    outputPositions[OUTPUT_OFFSET + index] = vec2f(0.0);
    return;
  }
  let patchIndex = ${selectedPatch};
  if (patchIndex >= PATCH_COUNT || !projectionPatchContains(position, patchIndex)) {
    outputPositions[OUTPUT_OFFSET + index] = vec2f(0.0);
    return;
  }
  let normalized = normalizeProjectionPosition(position, patchIndex);
  let destinationOffset = vec2f(
    bitcast<f32>(projectionPlanWord(patchIndex, 6u)),
    bitcast<f32>(projectionPlanWord(patchIndex, 7u))
  );
  outputPositions[OUTPUT_OFFSET + index] = destinationOffset + vec2f(
    evaluateProjectionPolynomial(patchIndex, 20u, normalized),
    evaluateProjectionPolynomial(patchIndex, 30u, normalized)
  );
}`;
}
