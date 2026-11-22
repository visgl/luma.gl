// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  Buffer,
  CommandEncoder,
  CompareFunction,
  Device,
  RenderPass,
  ShaderLayout,
  TextureFormatColor,
  TextureFormatDepthStencil
} from '@luma.gl/core';
import {Model, PickingManager, type PickInfo, type PickingShouldPickOptions} from '@luma.gl/engine';
import type {GPUSplatData} from './splat-data';
import type {SplatPickingInfo, SplatPickingProps} from './splat-picking';
import type {SplatMixedRenderOptions} from './splat-renderer';
import {GPUSplatGraphRenderer} from './gpu-splat-graph-renderer';
import {GPU_SPLAT_RENDER_SHADER, GPU_SPLAT_RENDER_SHADER_LAYOUT} from './gpu-splat-graph-shaders';

const EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO: SplatPickingInfo = {
  batchIndex: null,
  rowIndex: null,
  batchRowIndex: null,
  semanticId: null
};

const GPU_SPLAT_GRAPH_PICKING_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'graphUniforms', type: 'uniform', group: 0, location: 0},
    {name: 'projectedRecords', type: 'read-only-storage', group: 0, location: 1},
    {name: 'sortedIds', type: 'read-only-storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

/** GPU-native picking shader consuming already projected, globally sorted Gaussian records. */
export const GPU_SPLAT_GRAPH_PICKING_SHADER = /* wgsl */ `\
struct GraphSplatUniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  radiusScale: f32,
  alphaScale: f32,
  alphaCutoff: f32,
  screenSizeCutoffPixels: f32,
  gaussianSupportRadius: f32,
  kernel2DSize: f32,
  maxScreenSpaceSplatSize: f32,
  exposure: f32,
  toneMapping: u32,
  batchOffset: u32,
  rowCount: u32,
  isFloatColor: u32,
};

struct ProjectedSplat {
  clipCenter: vec4<f32>,
  axis0: vec2<f32>,
  axis1: vec2<f32>,
  color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> graphUniforms: GraphSplatUniforms;
@group(0) @binding(1) var<storage, read> projectedRecords: array<ProjectedSplat>;
@group(0) @binding(2) var<storage, read> sortedIds: array<u32>;

struct GraphSplatPickingFragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) gaussianCoordinate: vec2<f32>,
  @location(1) alpha: f32,
  @location(2) @interpolate(flat) projectedRowIndex: u32,
};

struct GraphSplatPickingFragmentOutputs {
  @location(0) color: vec4<f32>,
  @location(1) pickingIndices: vec2<i32>,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> GraphSplatPickingFragmentInputs {
  let corners = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
  );
  let corner = corners[vertexIndex];
  let projectedRowIndex = sortedIds[instanceIndex];
  let projected = projectedRecords[projectedRowIndex];
  let screenOffset = corner.x * projected.axis0 + corner.y * projected.axis1;
  let clipOffset = vec2<f32>(
    screenOffset.x * 2.0 / max(graphUniforms.viewportSize.x, 1.0),
    -screenOffset.y * 2.0 / max(graphUniforms.viewportSize.y, 1.0)
  ) * projected.clipCenter.w;

  var output: GraphSplatPickingFragmentInputs;
  output.position = vec4<f32>(
    projected.clipCenter.xy + clipOffset,
    projected.clipCenter.z,
    projected.clipCenter.w
  );
  output.gaussianCoordinate = corner * graphUniforms.gaussianSupportRadius;
  output.alpha = projected.color.a;
  output.projectedRowIndex = projectedRowIndex;
  return output;
}

@fragment
fn fragmentMain(input: GraphSplatPickingFragmentInputs) -> GraphSplatPickingFragmentOutputs {
  let gaussianWeight = exp(-0.5 * dot(input.gaussianCoordinate, input.gaussianCoordinate));
  let alpha = input.alpha * gaussianWeight;
  if (alpha <= 0.0 || alpha < graphUniforms.alphaCutoff) {
    discard;
  }

  var output: GraphSplatPickingFragmentOutputs;
  output.color = vec4<f32>(0.0);
  output.pickingIndices = vec2<i32>(i32(input.projectedRowIndex), 0);
  return output;
}
`;

/** Resolves a packed projected-row pick into its untouched, independently prepared source batch. */
export function resolveGPUSplatGraphPickInfo(
  pickInfo: PickInfo | null | undefined,
  batches: readonly GPUSplatData[]
): SplatPickingInfo {
  if (
    !pickInfo ||
    pickInfo.batchIndex !== 0 ||
    pickInfo.objectIndex === null ||
    !Number.isSafeInteger(pickInfo.objectIndex) ||
    pickInfo.objectIndex < 0
  ) {
    return {...EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO};
  }

  let batchOffset = 0;
  for (const batch of batches) {
    const batchRowIndex = pickInfo.objectIndex - batchOffset;
    if (batchRowIndex < batch.rowCount) {
      if (batch.destroyed) {
        return {...EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO};
      }
      return {
        batchIndex: batch.sourceBatchIndex,
        rowIndex: batch.rowIndexBase + batchRowIndex,
        batchRowIndex,
        semanticId: batch.source.semanticIds?.[batchRowIndex] ?? null
      };
    }
    batchOffset += batch.rowCount;
  }

  return {...EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO};
}

/** Attachment formats and shared mesh-depth policy for projected Gaussian graph composition. */
export type GPUSplatGraphMixedRendererProps = {
  /** Existing render-pass color format; defaults to the WebGPU presentation format. */
  colorAttachmentFormat?: TextureFormatColor;
  /** Existing shared render-pass depth format; defaults to the device depth format. */
  depthStencilAttachmentFormat?: TextureFormatDepthStencil;
  /** Depth comparison against opaque meshes already drawn into the same render pass. */
  depthCompare?: CompareFunction;
  /** Whether transparent Gaussian fragments should update shared scene depth. */
  depthWriteEnabled?: boolean;
};

/**
 * Composites graph-projected Gaussians between opaque and transparent meshes in one shared pass.
 *
 * Call `predraw(commandEncoder)` before opening the external render pass. Graph projection must
 * already exist or will be encoded first; the current graph also records its normal presentation
 * pass during that preparation. The mixed pass then reuses the original projected records, global
 * sort, and GPU-visible indirect command without CPU projection or source-buffer uploads.
 */
export class GPUSplatGraphMixedRenderer {
  /** WebGPU device shared by the borrowing graph renderer and mixed scene. */
  readonly device: Device;
  /** Graph renderer retaining caller-owned independently prepared source batches. */
  readonly renderer: GPUSplatGraphRenderer;
  /** Caller-selected render-pass attachment formats and Gaussian depth behavior. */
  readonly props: Required<GPUSplatGraphMixedRendererProps>;
  /** Reusable display model borrowing graph-owned projected rows, sort indices, and uniforms. */
  model?: Model;

  private projectedRecordBuffer?: Buffer;
  private sortedIndexBuffer?: Buffer;
  private uniformBuffer?: Buffer;
  private isDestroyed = false;

  /** Borrows one live graph renderer without compiling a graph or allocating a display model. */
  constructor(renderer: GPUSplatGraphRenderer, props: GPUSplatGraphMixedRendererProps = {}) {
    if (renderer.destroyed) {
      throw new Error('GPUSplatGraphMixedRenderer requires a live Gaussian splat graph renderer');
    }

    this.renderer = renderer;
    this.device = renderer.device;
    this.props = {
      colorAttachmentFormat: props.colorAttachmentFormat ?? this.device.preferredColorFormat,
      depthStencilAttachmentFormat:
        props.depthStencilAttachmentFormat ??
        (this.device.preferredDepthFormat === 'depth16'
          ? 'depth24plus'
          : this.device.preferredDepthFormat),
      depthCompare: props.depthCompare ?? 'less-equal',
      depthWriteEnabled: props.depthWriteEnabled ?? false
    };
  }

  /** Whether this compositor has already released its independently owned display model. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Refreshes graph projection and prepares the mixed-scene model before the caller opens a pass.
   *
   * Caller-owned command submission is preserved. The current graph also records its standard
   * presentation draw while updating projection; the actual mixed composition remains one pass.
   */
  predraw(commandEncoder: CommandEncoder): boolean {
    if (this.isDestroyed || this.renderer.destroyed || this.renderer.batches.length === 0) {
      return false;
    }
    this.renderer.encode(commandEncoder);
    const model = this.getMixedModel();
    if (!model || model.pipeline.isErrored) {
      return false;
    }
    model.predraw(commandEncoder);
    return true;
  }

  /** Draws opaque meshes, one visible-row Gaussian indirect command, then transparent meshes. */
  draw(renderPass: RenderPass, options: SplatMixedRenderOptions = {}): boolean {
    if (this.isDestroyed || this.renderer.destroyed) {
      return false;
    }

    let recordedDraw = false;
    let drawSuccess = true;
    for (const mesh of options.opaqueMeshes ?? []) {
      drawSuccess = mesh.draw(renderPass) !== false && drawSuccess;
      recordedDraw = true;
    }

    const model = this.getMixedModel();
    if (
      model &&
      !model.pipeline.isErrored &&
      this.renderer.batches.length > 0 &&
      this.projectedRecordBuffer &&
      this.sortedIndexBuffer &&
      this.uniformBuffer
    ) {
      renderPass.setPipeline(model.pipeline);
      renderPass.setVertexArray(model.vertexArray);
      renderPass.setBindings({
        graphUniforms: this.uniformBuffer,
        projectedRecords: this.projectedRecordBuffer,
        sortedIds: this.sortedIndexBuffer
      });
      this.renderer.drawCommands.draw(renderPass, 0);
      recordedDraw = true;
    }

    for (const mesh of options.transparentMeshes ?? []) {
      drawSuccess = mesh.draw(renderPass) !== false && drawSuccess;
      recordedDraw = true;
    }
    return recordedDraw && drawSuccess;
  }

  /** Releases the mixed-scene model while preserving borrowed graph and caller-owned sources. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.model?.destroy();
    this.model = undefined;
    this.projectedRecordBuffer = undefined;
    this.sortedIndexBuffer = undefined;
    this.uniformBuffer = undefined;
    this.isDestroyed = true;
  }

  private getMixedModel(): Model | undefined {
    const projectedRecordBuffer = this.renderer.projectedRecordBuffer;
    const sortedIndexBuffer = this.renderer.sortedIndexBuffer;
    const uniformBuffer = this.renderer.uniformBuffer;
    if (!projectedRecordBuffer || !sortedIndexBuffer || !uniformBuffer) {
      return undefined;
    }
    if (
      this.model &&
      this.projectedRecordBuffer === projectedRecordBuffer &&
      this.sortedIndexBuffer === sortedIndexBuffer &&
      this.uniformBuffer === uniformBuffer
    ) {
      return this.model;
    }

    this.model?.destroy();
    this.projectedRecordBuffer = projectedRecordBuffer;
    this.sortedIndexBuffer = sortedIndexBuffer;
    this.uniformBuffer = uniformBuffer;
    this.model = new Model(this.device, {
      id: 'gaussian-splat-graph-mixed-renderer',
      source: GPU_SPLAT_RENDER_SHADER,
      shaderLayout: GPU_SPLAT_RENDER_SHADER_LAYOUT,
      bindings: {
        graphUniforms: uniformBuffer,
        projectedRecords: projectedRecordBuffer,
        sortedIds: sortedIndexBuffer
      },
      colorAttachmentFormats: [this.props.colorAttachmentFormat],
      depthStencilAttachmentFormat: this.props.depthStencilAttachmentFormat,
      isInstanced: true,
      instanceCount: this.renderer.capacity.splatCount,
      vertexCount: 4,
      topology: 'triangle-strip',
      parameters: {
        depthWriteEnabled: this.props.depthWriteEnabled,
        depthCompare: this.props.depthCompare,
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    return this.model;
  }
}

/**
 * WebGPU picking that reuses one graph's projected records, global sort, and indirect draw.
 *
 * Original source batches remain borrowed and unchanged. Every pick draws only the graph's
 * GPU-counted visible rows, reads one integer pixel asynchronously, and resolves original source
 * row, batch, and semantic identity without CPU projection, source uploads, or graph rebuilding.
 */
export class GPUSplatGraphPicker {
  /** WebGPU device shared with the graph renderer and its caller-owned source batches. */
  readonly device: Device;
  /** Renderer supplying GPU-projected source rows, global ordering, and visible indirect counts. */
  readonly renderer: GPUSplatGraphRenderer;
  /** Integer picking attachments, pointer tracking, and asynchronous single-pixel GPU readback. */
  readonly manager: PickingManager;
  /** Application-owned source-row callback and optional tooltip provider. */
  props: SplatPickingProps;
  /** Dedicated integer-picking model borrowing graph-owned buffers. */
  model?: Model;
  /** Latest resolved original source batch, global row, batch-local row, and semantic identity. */
  pickInfo: SplatPickingInfo = {...EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO};

  private projectedRecordBuffer?: Buffer;
  private sortedIndexBuffer?: Buffer;
  private uniformBuffer?: Buffer;
  private pickingBatches: readonly GPUSplatData[] = [];
  private pendingPickingRequest: Promise<void> = Promise.resolve();
  private pickingGeneration = 0;
  private activePickingGeneration = -1;
  private isDestroyed = false;

  /** Creates an integer picking target while leaving graph compilation and GPU drawing lazy. */
  constructor(renderer: GPUSplatGraphRenderer, props: SplatPickingProps = {}) {
    if (renderer.destroyed) {
      throw new Error('GPUSplatGraphPicker requires a live Gaussian splat graph renderer');
    }
    if (props.mode === 'color') {
      throw new Error('GPUSplatGraphPicker requires integer WebGPU picking');
    }

    this.renderer = renderer;
    this.device = renderer.device;
    this.props = props;
    this.manager = new PickingManager(this.device, {
      mode: 'index',
      onObjectPicked: this.handleObjectPicked,
      getTooltip: pickInfo =>
        this.activePickingGeneration === this.pickingGeneration
          ? (this.props.getTooltip?.(resolveGPUSplatGraphPickInfo(pickInfo, this.pickingBatches)) ??
            null)
          : null
    });
  }

  /** Graph-native Gaussian picking always uses exact signed integer WebGPU attachments. */
  get mode(): 'index' {
    return 'index';
  }

  /** Whether this picker has already released its owned framebuffer and model. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /**
   * Draws the current graph-visible rows and reads one stable source-row identity asynchronously.
   *
   * An unchanged cursor reuses its last result unless `force` is supplied for updated source
   * visibility, camera properties, or streamed/resident source batches.
   */
  pick(
    mousePosition: readonly [number, number] | number[] | null | undefined,
    options: PickingShouldPickOptions = {}
  ): Promise<SplatPickingInfo | null> {
    if (this.isDestroyed || this.renderer.destroyed) {
      return Promise.resolve(null);
    }
    if (!mousePosition) {
      this.clear();
      return Promise.resolve(this.pickInfo);
    }

    const requestedPosition: [number, number] = [mousePosition[0], mousePosition[1]];
    const requestedOptions = {...options};
    const requestedGeneration = this.pickingGeneration;
    const requestedPick = this.pendingPickingRequest.then(() =>
      this.pickCurrent(requestedPosition, requestedOptions, requestedGeneration)
    );
    this.pendingPickingRequest = requestedPick.then(
      () => undefined,
      () => undefined
    );
    return requestedPick;
  }

  private async pickCurrent(
    mousePosition: [number, number],
    options: PickingShouldPickOptions,
    requestedGeneration: number
  ): Promise<SplatPickingInfo | null> {
    if (this.isDestroyed || this.renderer.destroyed) {
      return null;
    }
    if (requestedGeneration !== this.pickingGeneration) {
      return this.pickInfo;
    }

    if (!this.manager.shouldPick(mousePosition, options)) {
      return this.pickInfo;
    }
    if (this.renderer.batches.length === 0) {
      this.clear();
      return this.pickInfo;
    }

    this.renderer.encode(this.device.commandEncoder);
    const model = this.getPickingModel();
    if (!model || model.pipeline.isErrored) {
      this.clear();
      return this.pickInfo;
    }

    this.activePickingGeneration = requestedGeneration;
    this.pickingBatches = [...this.renderer.batches];
    model.predraw(this.device.commandEncoder);
    const renderPass = this.manager.beginRenderPass();
    try {
      this.draw(renderPass, model);
    } finally {
      renderPass.end();
    }

    this.device.submit();
    const pickInfo = await this.manager.updatePickInfo(mousePosition);
    if (this.isDestroyed || this.renderer.destroyed) {
      return null;
    }
    if (requestedGeneration !== this.pickingGeneration) {
      this.manager.clearPickState();
      this.manager.pickInfo = {batchIndex: null, objectIndex: null};
      return this.pickInfo;
    }
    if (!pickInfo) {
      return null;
    }
    return this.updatePickingResult(pickInfo);
  }

  /** Clears a previously selected graph-projected source row and notifies its caller once. */
  clear(): void {
    this.pickingGeneration++;
    this.activePickingGeneration = -1;
    const hadSelection = this.pickInfo.rowIndex !== null;
    this.manager.clearPickState();
    this.manager.pickInfo = {batchIndex: null, objectIndex: null};
    this.pickInfo = {...EMPTY_GPU_SPLAT_GRAPH_PICKING_INFO};
    this.pickingBatches = [];
    if (hadSelection) {
      this.props.onPick?.(this.pickInfo);
    }
  }

  /** Destroys owned picking resources without touching the graph or original source allocations. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.pickingGeneration++;
    this.activePickingGeneration = -1;
    this.model?.destroy();
    this.model = undefined;
    this.manager.destroy();
    this.pickingBatches = [];
    this.projectedRecordBuffer = undefined;
    this.sortedIndexBuffer = undefined;
    this.uniformBuffer = undefined;
    this.isDestroyed = true;
  }

  private readonly handleObjectPicked = (pickInfo: PickInfo): void => {
    if (
      !this.isDestroyed &&
      !this.renderer.destroyed &&
      this.activePickingGeneration === this.pickingGeneration
    ) {
      this.updatePickingResult(pickInfo);
    }
  };

  private updatePickingResult(pickInfo: PickInfo): SplatPickingInfo {
    const resolved = resolveGPUSplatGraphPickInfo(pickInfo, this.pickingBatches);
    if (
      resolved.batchIndex !== this.pickInfo.batchIndex ||
      resolved.rowIndex !== this.pickInfo.rowIndex ||
      resolved.batchRowIndex !== this.pickInfo.batchRowIndex ||
      resolved.semanticId !== this.pickInfo.semanticId
    ) {
      this.pickInfo = resolved;
      this.props.onPick?.(resolved);
    }
    return this.pickInfo;
  }

  private getPickingModel(): Model | undefined {
    const projectedRecordBuffer = this.renderer.projectedRecordBuffer;
    const sortedIndexBuffer = this.renderer.sortedIndexBuffer;
    const uniformBuffer = this.renderer.uniformBuffer;
    if (!projectedRecordBuffer || !sortedIndexBuffer || !uniformBuffer) {
      return undefined;
    }
    if (
      this.model &&
      this.projectedRecordBuffer === projectedRecordBuffer &&
      this.sortedIndexBuffer === sortedIndexBuffer &&
      this.uniformBuffer === uniformBuffer
    ) {
      return this.model;
    }

    this.model?.destroy();
    this.projectedRecordBuffer = projectedRecordBuffer;
    this.sortedIndexBuffer = sortedIndexBuffer;
    this.uniformBuffer = uniformBuffer;
    this.model = new Model(this.device, {
      id: 'gaussian-splat-graph-index-picking',
      source: GPU_SPLAT_GRAPH_PICKING_SHADER,
      shaderLayout: GPU_SPLAT_GRAPH_PICKING_SHADER_LAYOUT,
      bindings: {
        graphUniforms: uniformBuffer,
        projectedRecords: projectedRecordBuffer,
        sortedIds: sortedIndexBuffer
      },
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      isInstanced: true,
      instanceCount: this.renderer.capacity.splatCount,
      vertexCount: 4,
      topology: 'triangle-strip',
      parameters: {depthWriteEnabled: true, depthCompare: 'less-equal', blend: false}
    });
    return this.model;
  }

  private draw(renderPass: RenderPass, model: Model): void {
    if (!this.projectedRecordBuffer || !this.sortedIndexBuffer || !this.uniformBuffer) {
      return;
    }
    renderPass.setPipeline(model.pipeline);
    renderPass.setVertexArray(model.vertexArray);
    renderPass.setBindings({
      graphUniforms: this.uniformBuffer,
      projectedRecords: this.projectedRecordBuffer,
      sortedIds: this.sortedIndexBuffer
    });
    this.renderer.drawCommands.draw(renderPass, 0);
  }
}
