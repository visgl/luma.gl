// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import {Buffer} from '@luma.gl/core';

import {
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {getViewElementOffset, validatePackedView} from '@luma.gl/gpgpu/gpu-core';
import {
  POSITION_FORMATS,
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
import {getProjectionShaderSource} from './projection-shader';

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
export class GPUProjection {
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
