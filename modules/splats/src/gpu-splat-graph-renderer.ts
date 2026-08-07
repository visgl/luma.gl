// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type CommandEncoder, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUCommandGraphEncoding,
  GPUSort,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphStats,
  type GraphBufferHandle,
  type GraphDataView,
  type GraphImportedBuffer
} from '@luma.gl/experimental';
import {GPUSplatData} from './splat-data';
import {
  GPU_SPLAT_FEATURE_SHADER,
  GPU_SPLAT_FEATURE_SHADER_LAYOUT,
  GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_INVALID_DEPTH_KEY,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
  GPU_SPLAT_PROJECTION_SHADER,
  GPU_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_SPLAT_RENDER_SHADER,
  GPU_SPLAT_RENDER_SHADER_LAYOUT
} from './gpu-splat-graph-shaders';
import type {SplatRendererProps, SplatRendererStats} from './splat-renderer';
import type {SplatSemanticFilter, SplatSemanticSelection} from './splat-filter';
import {
  getSplatSphericalHarmonicCoefficientCount,
  type SplatSphericalHarmonicsDegree
} from './splat-spherical-harmonics';
import type {SplatSortMode} from './splat-sort';

/** Camera, styling, borrowed data, and canvas clearing for graph-native Gaussian rendering. */
export type GPUSplatGraphRendererProps = Omit<
  SplatRendererProps,
  'depthCompare' | 'depthWriteEnabled'
> & {
  /** Color used when the graph opens its single default-framebuffer render pass. */
  clearColor?: [number, number, number, number];
  /** Optional final row count used to reserve one persistent progressively populated graph. */
  expectedSplatCount?: number;
  /** Optional final Arrow batch count used to reserve immutable borrowed-source binding slots. */
  expectedBatchCount?: number;
};

type ResolvedGPUSplatGraphRendererProps = {
  modelViewProjectionMatrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];
  viewportSize: [number, number];
  cameraPosition: [number, number, number];
  sphericalHarmonicsDegree: SplatSphericalHarmonicsDegree;
  semanticFilter?: SplatSemanticFilter;
  sortMode: SplatSortMode;
  alphaCutoff: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
  kernel2DSize: number;
  maxScreenSpaceSplatSize: number;
  radiusScale: number;
  alphaScale: number;
  exposure: number;
  toneMapping: 'none' | 'reinhard';
};

const INITIALIZE_SHADER_LAYOUT = {
  attributes: [],
  bindings: [
    {name: 'sortValues', type: 'storage', group: 0, location: 0},
    {name: 'drawCommands', type: 'storage', group: 0, location: 1},
    {name: 'depthKeys', type: 'storage', group: 0, location: 2}
  ]
} satisfies ShaderLayout;

const SOURCE_SLOT_COLUMNS = [
  {name: 'positions', minimumByteLength: 12},
  {name: 'scales', minimumByteLength: 12},
  {name: 'rotations', minimumByteLength: 16},
  {name: 'colors', minimumByteLength: 4},
  {name: 'opacities', minimumByteLength: 4}
] as const;

const FEATURE_SOURCE_SLOT_COLUMNS = [
  {name: 'sphericalHarmonics', minimumByteLength: 4},
  {name: 'semanticIds', minimumByteLength: 4}
] as const;

const MINIMUM_SEMANTIC_SELECTION_CAPACITY = 64;

type SourceSlotColumnName =
  | (typeof SOURCE_SLOT_COLUMNS)[number]['name']
  | (typeof FEATURE_SOURCE_SLOT_COLUMNS)[number]['name'];

/**
 * WebGPU-only Gaussian renderer composed entirely from reusable GPU command-graph nodes.
 *
 * Source record batches remain borrowed and separately allocated. Projection, culling, global
 * radix sorting, and the visible-row indirect draw all execute on the GPU without CPU row walks,
 * GPU readback, or intermediate submissions.
 */
export class GPUSplatGraphRenderer {
  /** WebGPU device owning renderer allocations and compiled graph resources. */
  readonly device: Device;
  /** Caller-owned source batches retained in stream order and never repacked or destroyed. */
  readonly batches: GPUSplatData[] = [];
  /** GPU-written indirect draw command; its instance count is the current visible row count. */
  readonly drawCommands: DrawCommandBuffer;
  /** Resolved camera, visibility, and styling properties shared with the legacy renderer. */
  readonly props: ResolvedGPUSplatGraphRendererProps;
  /** Compiled graph, available after the first successful encoding. */
  compiledGraph?: CompiledGPUCommandGraph;
  /** Immediate CPU/node diagnostics from the most recent graph encoding. */
  lastEncoding?: GPUCommandGraphEncoding;

  private readonly clearColor: [number, number, number, number];
  private readonly expectedSplatCount?: number;
  private readonly expectedBatchCount?: number;
  private readonly ownedBuffers: Buffer[] = [];
  private readonly batchUniforms: Buffer[] = [];
  private readonly batchFeatureUniforms: Buffer[] = [];
  private readonly cachedBatchRevisions: number[] = [];
  private model?: Model;
  private projectedRecordsBuffer?: Buffer;
  private sortedValuesBuffer?: Buffer;
  private semanticSelectionBuffer?: Buffer;
  private semanticSelectionValues = new Uint32Array(0);
  private semanticIncludeCount = 0;
  private semanticExcludeCount = 0;
  private semanticSelectionCapacity = 0;
  private requiresGraphRebuild = true;
  private requiresEncoding = true;
  private allocatedSplatCapacity = 0;
  private allocatedBatchCapacity = 0;
  private hasExplicitToneMapping: boolean;
  private hasPresentedContent = false;
  private isDestroyed = false;

  /** Retains supplied batches lazily; graph compilation waits until the first `encode()`. */
  constructor(device: Device, props: GPUSplatGraphRendererProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUSplatGraphRenderer requires a WebGPU device');
    }
    // Expected stream capacities must be positive safe integers.
    assert(
      props.expectedSplatCount === undefined ||
        (Number.isSafeInteger(props.expectedSplatCount) && props.expectedSplatCount > 0)
    );
    assert(
      props.expectedBatchCount === undefined ||
        (Number.isSafeInteger(props.expectedBatchCount) && props.expectedBatchCount > 0)
    );

    this.device = device;
    this.expectedSplatCount = props.expectedSplatCount;
    this.expectedBatchCount = props.expectedBatchCount;
    this.clearColor = [...(props.clearColor ?? [0, 0, 0, 0])];
    this.props = {
      modelViewProjectionMatrix: toSplatGraphMatrix(props.modelViewProjectionMatrix),
      viewportSize: [...(props.viewportSize ?? [1, 1])],
      cameraPosition: [...(props.cameraPosition ?? [0, 0, 0])],
      sphericalHarmonicsDegree: props.sphericalHarmonicsDegree ?? 3,
      ...(props.semanticFilter ? {semanticFilter: props.semanticFilter} : {}),
      sortMode: 'global',
      alphaCutoff: props.alphaCutoff ?? props.opacityThreshold ?? 1 / 255,
      screenSizeCutoffPixels: props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: props.gaussianSupportRadius ?? 3,
      kernel2DSize: props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize ?? 1024,
      radiusScale: props.radiusScale ?? props.pointSize ?? 1,
      alphaScale: props.alphaScale ?? 1,
      exposure: props.exposure ?? 1,
      toneMapping: props.toneMapping ?? 'none'
    };
    this.hasExplicitToneMapping = props.toneMapping !== undefined;
    this.updateSemanticSelections(props.semanticFilter);
    this.drawCommands = new DrawCommandBuffer(device, {
      id: 'gaussian-splat-graph-draw-command',
      type: 'draw',
      commands: [{vertexCount: 4, instanceCount: 0}]
    });
    for (const batch of normalizeSplatGraphBatches(props.data)) {
      this.appendData(batch);
    }
  }

  /** Scheduling, resource-hazard, and transient-allocation diagnostics for the compiled graph. */
  get graphStats(): GPUCommandGraphStats | undefined {
    return this.compiledGraph?.stats;
  }

  /** Current immutable graph capacities; only overflow requires rebuilding its slots or rows. */
  get capacity(): {splatCount: number; batchCount: number} {
    return {splatCount: this.allocatedSplatCapacity, batchCount: this.allocatedBatchCapacity};
  }

  /** GPU-produced globally sorted projected-record indices, available after compilation. */
  get sortedIndexBuffer(): Buffer | undefined {
    return this.sortedValuesBuffer;
  }

  /** Renderer-owned projected Gaussian records reused by graph-native picking and composition. */
  get projectedRecordBuffer(): Buffer | undefined {
    return this.projectedRecordsBuffer;
  }

  /** First immutable graph uniform binding shared by projected-record consumer passes. */
  get uniformBuffer(): Buffer | undefined {
    return this.batchUniforms[0];
  }

  /** Source and renderer allocation diagnostics without forcing GPU readback or CPU sorting. */
  get stats(): SplatRendererStats {
    return this.getStats();
  }

  /** Whether this borrowing renderer has already released its owned graph resources. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Borrows one source batch while preserving its original GPU column allocations. */
  appendData(batch: GPUSplatData): void {
    if (this.isDestroyed || batch.destroyed || batch.device !== this.device) {
      throw new Error('GPUSplatGraphRenderer requires live data prepared on its own device');
    }
    this.batches.push(batch);
    this.cachedBatchRevisions.push(batch.revision);
    if (
      !this.hasExplicitToneMapping &&
      batch.colors.format === 'float32x4' &&
      !hasHighDynamicRangeSplatPresentation(this.device)
    ) {
      this.props.toneMapping = 'reinhard';
    }
    if (
      !this.compiledGraph ||
      this.getRowCount() > this.allocatedSplatCapacity ||
      this.batches.length > this.allocatedBatchCapacity
    ) {
      this.requiresGraphRebuild = true;
    }
    this.requiresEncoding = true;
  }

  /** Updates camera or styling uniforms in O(batch count), never O(splat count). */
  setProps(props: Partial<GPUSplatGraphRendererProps>): void {
    if (props.data !== undefined) {
      const replacementBatches = normalizeSplatGraphBatches(props.data);
      const matchesRetainedBatches =
        replacementBatches.length === this.batches.length &&
        replacementBatches.every((batch, batchIndex) => batch === this.batches[batchIndex]);
      if (!matchesRetainedBatches) {
        for (const batch of replacementBatches) {
          if (batch.destroyed || batch.device !== this.device) {
            throw new Error('GPUSplatGraphRenderer requires live data prepared on its own device');
          }
        }
        const replacementSplatCount = replacementBatches.reduce(
          (totalSplatCount, batch) => totalSplatCount + batch.length,
          0
        );
        const canReuseGraph =
          this.compiledGraph !== undefined &&
          replacementBatches.length <= this.allocatedBatchCapacity &&
          replacementSplatCount <= this.allocatedSplatCapacity;
        if (!canReuseGraph) {
          this.releaseCompiledGraph();
        }
        this.batches.length = 0;
        this.cachedBatchRevisions.length = 0;
        for (const batch of replacementBatches) {
          this.appendData(batch);
        }
        this.requiresEncoding = true;
      }
    }

    if (
      props.modelViewProjectionMatrix &&
      !areSplatGraphValuesEqual(
        this.props.modelViewProjectionMatrix,
        props.modelViewProjectionMatrix
      )
    ) {
      this.props.modelViewProjectionMatrix = toSplatGraphMatrix(props.modelViewProjectionMatrix);
      this.requiresEncoding = true;
    }
    if (
      props.viewportSize &&
      !areSplatGraphValuesEqual(this.props.viewportSize, props.viewportSize)
    ) {
      this.props.viewportSize = [...props.viewportSize];
      this.requiresEncoding = true;
    }
    if (
      props.cameraPosition &&
      !areSplatGraphValuesEqual(this.props.cameraPosition, props.cameraPosition)
    ) {
      this.props.cameraPosition = [...props.cameraPosition];
      this.requiresEncoding = true;
    }
    if (
      props.sphericalHarmonicsDegree !== undefined &&
      this.props.sphericalHarmonicsDegree !== props.sphericalHarmonicsDegree
    ) {
      this.props.sphericalHarmonicsDegree = props.sphericalHarmonicsDegree;
      this.requiresEncoding = true;
    }
    if ('semanticFilter' in props && !Object.is(this.props.semanticFilter, props.semanticFilter)) {
      this.updateSemanticSelections(props.semanticFilter);
      this.props.semanticFilter = props.semanticFilter;
      this.requiresEncoding = true;
    }

    const updates: Partial<ResolvedGPUSplatGraphRendererProps> = {
      ...(props.alphaCutoff !== undefined || props.opacityThreshold !== undefined
        ? {alphaCutoff: props.alphaCutoff ?? props.opacityThreshold}
        : {}),
      ...(props.radiusScale !== undefined || props.pointSize !== undefined
        ? {radiusScale: props.radiusScale ?? props.pointSize}
        : {}),
      ...(props.screenSizeCutoffPixels !== undefined
        ? {screenSizeCutoffPixels: props.screenSizeCutoffPixels}
        : {}),
      ...(props.gaussianSupportRadius !== undefined
        ? {gaussianSupportRadius: props.gaussianSupportRadius}
        : {}),
      ...(props.kernel2DSize !== undefined ? {kernel2DSize: props.kernel2DSize} : {}),
      ...(props.maxScreenSpaceSplatSize !== undefined
        ? {maxScreenSpaceSplatSize: props.maxScreenSpaceSplatSize}
        : {}),
      ...(props.alphaScale !== undefined ? {alphaScale: props.alphaScale} : {}),
      ...(props.exposure !== undefined ? {exposure: props.exposure} : {}),
      ...(props.toneMapping !== undefined ? {toneMapping: props.toneMapping} : {})
    };
    if (props.toneMapping !== undefined) {
      this.hasExplicitToneMapping = true;
    }
    for (const [propertyName, value] of Object.entries(updates)) {
      if (this.props[propertyName as keyof ResolvedGPUSplatGraphRendererProps] !== value) {
        Object.assign(this.props, {[propertyName]: value});
        this.requiresEncoding = true;
      }
    }
  }

  /**
   * Encodes projection, global sorting, and exactly one indirect canvas draw.
   *
   * The caller still owns command submission. An unchanged scene or an initially empty source
   * returns `undefined`; transitioning from presented content to an empty frontier clears once.
   */
  encode(commandEncoder: CommandEncoder): GPUCommandGraphEncoding | undefined {
    if (this.isDestroyed) {
      return undefined;
    }
    if (this.getRowCount() === 0) {
      if (!this.requiresEncoding || !this.hasPresentedContent) {
        return undefined;
      }
      this.drawCommands.buffer.write(
        new Uint32Array([0]),
        this.drawCommands.getInstanceCountByteOffset(0)
      );
      const renderPass = commandEncoder.beginRenderPass({
        id: 'gaussian-splat-graph-clear-pass',
        clearColor: this.clearColor,
        clearDepth: 1,
        clearStencil: false
      });
      renderPass.end();
      this.lastEncoding = new GPUCommandGraphEncoding(
        [
          {
            stats: {
              id: 'gaussian-splat-clear',
              type: 'render',
              cpuEncodeTimeMilliseconds: 0,
              hasGPUTimestamps: false
            }
          }
        ],
        0
      );
      this.hasPresentedContent = false;
      this.requiresEncoding = false;
      return this.lastEncoding;
    }
    for (let batchIndex = 0; batchIndex < this.batches.length; batchIndex++) {
      const revision = this.batches[batchIndex].revision;
      if (revision !== this.cachedBatchRevisions[batchIndex]) {
        this.cachedBatchRevisions[batchIndex] = revision;
        this.requiresEncoding = true;
      }
    }
    if (!this.requiresEncoding) {
      return undefined;
    }
    if (this.requiresGraphRebuild) {
      this.rebuildGraph();
    }
    if (!this.compiledGraph) {
      return undefined;
    }

    this.writeBatchUniforms();
    this.lastEncoding = this.compiledGraph.encode(commandEncoder, {
      parameters: undefined,
      buffers: this.getSourceBufferOverrides()
    });
    this.hasPresentedContent = true;
    this.requiresEncoding = false;
    return this.lastEncoding;
  }

  /** Returns source counts and allocation diagnostics without CPU projection or GPU readback. */
  getStats(): SplatRendererStats {
    const splatCount = this.getRowCount();
    const sourceGpuByteLength = this.batches.reduce(
      (totalByteLength, batch) => totalByteLength + batch.byteLength,
      0
    );
    const rendererGpuByteLength =
      this.drawCommands.buffer.byteLength +
      this.ownedBuffers.reduce(
        (totalByteLength, buffer) => totalByteLength + buffer.byteLength,
        0
      ) +
      this.batchUniforms.reduce(
        (totalByteLength, buffer) => totalByteLength + buffer.byteLength,
        0
      ) +
      this.batchFeatureUniforms.reduce(
        (totalByteLength, buffer) => totalByteLength + buffer.byteLength,
        0
      ) +
      (this.compiledGraph?.stats.physicalTransientBytes ?? 0);
    return {
      splatCount,
      rowCount: splatCount,
      // The exact culled count remains GPU-resident in drawCommands; avoid a synchronous readback.
      visibleSplatCount: splatCount,
      batchCount: this.batches.length,
      sortMode: 'global',
      sourceGpuByteLength,
      rendererGpuByteLength,
      gpuByteLength: sourceGpuByteLength + rendererGpuByteLength,
      drawCallCount: splatCount > 0 ? 1 : 0
    };
  }

  /** Releases graph/model/scratch resources without touching caller-owned source allocations. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.releaseCompiledGraph();
    this.drawCommands.destroy();
    this.cachedBatchRevisions.length = 0;
    this.isDestroyed = true;
  }

  private rebuildGraph(): void {
    this.releaseCompiledGraph();
    const rowCount = this.getRowCount();
    if (rowCount === 0) {
      this.requiresGraphRebuild = false;
      return;
    }

    this.allocatedSplatCapacity = this.resolveSplatCapacity(rowCount);
    this.allocatedBatchCapacity = this.resolveBatchCapacity(this.batches.length);
    const projectedByteLength =
      this.allocatedSplatCapacity * GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH;
    if (
      this.device.limits.maxStorageBufferBindingSize > 0 &&
      projectedByteLength > this.device.limits.maxStorageBufferBindingSize
    ) {
      throw new Error('Gaussian splat projected records exceed the device storage binding limit');
    }

    const graph = new GPUCommandGraph(this.device, {id: 'gaussian-splat-render-graph'});
    const projectedRecordsBuffer = this.createOwnedBuffer(
      'gaussian-splat-projected-records',
      projectedByteLength
    );
    this.projectedRecordsBuffer = projectedRecordsBuffer;
    const depthKeysBuffer = this.createOwnedBuffer(
      'gaussian-splat-depth-keys',
      this.allocatedSplatCapacity * Uint32Array.BYTES_PER_ELEMENT
    );
    const sourceIndicesBuffer = this.createOwnedBuffer(
      'gaussian-splat-source-indices',
      this.allocatedSplatCapacity * Uint32Array.BYTES_PER_ELEMENT
    );
    const sortedKeysBuffer = this.createOwnedBuffer(
      'gaussian-splat-sorted-keys',
      this.allocatedSplatCapacity * Uint32Array.BYTES_PER_ELEMENT
    );
    this.sortedValuesBuffer = this.createOwnedBuffer(
      'gaussian-splat-sorted-indices',
      this.allocatedSplatCapacity * Uint32Array.BYTES_PER_ELEMENT
    );
    this.semanticSelectionCapacity = Math.max(
      MINIMUM_SEMANTIC_SELECTION_CAPACITY,
      this.semanticSelectionValues.length
    );
    this.semanticSelectionBuffer = this.createOwnedBuffer(
      'gaussian-splat-semantic-selection',
      this.semanticSelectionCapacity * Uint32Array.BYTES_PER_ELEMENT
    );

    const projectedRecords = this.importOwnedBuffer(graph, projectedRecordsBuffer);
    const semanticSelections = this.importOwnedBuffer(graph, this.semanticSelectionBuffer);
    const depthKeys = this.importUint32Buffer(graph, depthKeysBuffer, this.allocatedSplatCapacity);
    const sourceIndices = this.importUint32Buffer(
      graph,
      sourceIndicesBuffer,
      this.allocatedSplatCapacity
    );
    const sortedKeys = this.importUint32Buffer(
      graph,
      sortedKeysBuffer,
      this.allocatedSplatCapacity
    );
    const sortedIndices = this.importUint32Buffer(
      graph,
      this.sortedValuesBuffer,
      this.allocatedSplatCapacity
    );
    const drawCommandViews = this.drawCommands.importToGraph(graph);

    this.addInitializationPass(
      graph,
      sourceIndices,
      depthKeys,
      drawCommandViews.buffer,
      this.allocatedSplatCapacity
    );

    let firstUniform: GraphBufferHandle | undefined;
    for (let batchIndex = 0; batchIndex < this.allocatedBatchCapacity; batchIndex++) {
      const uniformBuffer = this.device.createBuffer({
        id: `gaussian-splat-graph-uniforms-${batchIndex}`,
        byteLength: GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      this.batchUniforms.push(uniformBuffer);
      const uniforms = graph.importBuffer(
        {id: uniformBuffer.id, byteLength: uniformBuffer.byteLength, usage: uniformBuffer.usage},
        uniformBuffer
      );
      const featureUniformBuffer = this.device.createBuffer({
        id: `gaussian-splat-feature-uniforms-${batchIndex}`,
        byteLength: GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      this.batchFeatureUniforms.push(featureUniformBuffer);
      const featureUniforms = graph.importBuffer(
        {
          id: featureUniformBuffer.id,
          byteLength: featureUniformBuffer.byteLength,
          usage: featureUniformBuffer.usage
        },
        featureUniformBuffer
      );
      firstUniform ??= uniforms;
      const positions = this.addProjectionPass(graph, {
        batchIndex,
        projectedRecords,
        depthKeys,
        drawCommands: drawCommandViews.buffer,
        uniforms
      });
      this.addFeaturePass(graph, {
        batchIndex,
        positions,
        projectedRecords,
        depthKeys,
        drawCommands: drawCommandViews.buffer,
        semanticSelections,
        uniforms,
        featureUniforms
      });
    }

    new GPUSort({
      id: 'gaussian-splat-global-depth-sort',
      keys: depthKeys,
      values: sourceIndices,
      outputKeys: sortedKeys,
      outputValues: sortedIndices,
      algorithm: 'radix',
      direction: 'ascending',
      keyBits: 16
    }).addToGraph(graph);

    const firstUniformBuffer = this.batchUniforms[0];
    if (!firstUniform) {
      return;
    }
    this.model = new Model(this.device, {
      id: 'gaussian-splat-graph-render-model',
      source: GPU_SPLAT_RENDER_SHADER,
      shaderLayout: GPU_SPLAT_RENDER_SHADER_LAYOUT,
      isInstanced: true,
      instanceCount: this.allocatedSplatCapacity,
      vertexCount: 4,
      topology: 'triangle-strip',
      bindings: {
        graphUniforms: firstUniformBuffer,
        projectedRecords: projectedRecordsBuffer,
        sortedIds: this.sortedValuesBuffer
      },
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'less-equal',
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });

    graph.addRenderPass({
      id: 'gaussian-splat-indirect-render',
      resources: [
        {buffer: projectedRecords, usage: 'storage-read'},
        {buffer: sortedIndices, usage: 'storage-read'},
        {buffer: firstUniform, usage: 'uniform'},
        {buffer: drawCommandViews.buffer, usage: 'indirect'}
      ],
      compile: () => ({
        getRenderPassProps: () => ({
          id: 'gaussian-splat-graph-render-pass',
          clearColor: this.clearColor,
          clearDepth: 1,
          clearStencil: false
        }),
        encode: ({renderPass, getBuffer}) => {
          if (!this.model) {
            return;
          }
          renderPass.setPipeline(this.model.pipeline);
          renderPass.setVertexArray(this.model.vertexArray);
          renderPass.setBindings({
            graphUniforms: getBuffer(firstUniform),
            projectedRecords: getBuffer(projectedRecords),
            sortedIds: getBuffer(sortedIndices)
          });
          this.drawCommands.draw(renderPass, 0);
        }
      })
    });

    this.compiledGraph = graph.compile();
    this.requiresGraphRebuild = false;
  }

  private addInitializationPass(
    graph: GPUCommandGraph,
    sourceIndices: GraphDataView<'uint32'>,
    depthKeys: GraphDataView<'uint32'>,
    drawCommands: GraphBufferHandle,
    rowCount: number
  ): void {
    const shader = /* wgsl */ `
const ROW_COUNT: u32 = ${rowCount}u;
const INVALID_DEPTH_KEY: u32 = ${GPU_SPLAT_INVALID_DEPTH_KEY}u;
@group(0) @binding(0) var<storage, read_write> sortValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> drawCommands: array<atomic<u32>>;
@group(0) @binding(2) var<storage, read_write> depthKeys: array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x < ROW_COUNT) {
    sortValues[invocation.x] = invocation.x;
    depthKeys[invocation.x] = INVALID_DEPTH_KEY;
  }
  if (invocation.x == 0u) {
    atomicStore(&drawCommands[1], 0u);
  }
}`;
    graph.addComputePass({
      id: 'gaussian-splat-initialize',
      resources: [
        {buffer: sourceIndices, usage: 'storage-write'},
        {buffer: drawCommands, usage: 'storage-write'},
        {buffer: depthKeys, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'gaussian-splat-initialize',
          source: shader,
          shaderLayout: INITIALIZE_SHADER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              sortValues: getBuffer(sourceIndices),
              drawCommands: getBuffer(drawCommands),
              depthKeys: getBuffer(depthKeys)
            });
            computation.dispatch(computePass, Math.ceil(rowCount / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private addProjectionPass(
    graph: GPUCommandGraph,
    props: {
      batchIndex: number;
      projectedRecords: GraphBufferHandle;
      depthKeys: GraphDataView<'uint32'>;
      drawCommands: GraphBufferHandle;
      uniforms: GraphBufferHandle;
    }
  ): GraphBufferHandle {
    const {batchIndex, projectedRecords, depthKeys, drawCommands, uniforms} = props;
    const positions = this.importSourceSlotBuffer(graph, batchIndex, 'positions', 12);
    const scales = this.importSourceSlotBuffer(graph, batchIndex, 'scales', 12);
    const rotations = this.importSourceSlotBuffer(graph, batchIndex, 'rotations', 16);
    const colors = this.importSourceSlotBuffer(graph, batchIndex, 'colors', 4);
    const opacities = this.importSourceSlotBuffer(graph, batchIndex, 'opacities', 4);

    graph.addComputePass({
      id: `gaussian-splat-project-batch-${batchIndex}`,
      resources: [
        {buffer: positions, usage: 'storage-read'},
        {buffer: scales, usage: 'storage-read'},
        {buffer: rotations, usage: 'storage-read'},
        {buffer: colors, usage: 'storage-read'},
        {buffer: opacities, usage: 'storage-read'},
        {buffer: projectedRecords, usage: 'storage-write'},
        {buffer: depthKeys, usage: 'storage-write'},
        {buffer: drawCommands, usage: 'storage-read-write'},
        {buffer: uniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `gaussian-splat-project-batch-${batchIndex}`,
          source: GPU_SPLAT_PROJECTION_SHADER,
          shaderLayout: GPU_SPLAT_PROJECTION_SHADER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const batch = this.batches[batchIndex];
            if (!batch || batch.length === 0) {
              return;
            }
            computation.setBindings({
              positions: getBuffer(positions),
              scales: getBuffer(scales),
              rotations: getBuffer(rotations),
              colors: getBuffer(colors),
              opacities: getBuffer(opacities),
              projectedRecords: getBuffer(projectedRecords),
              depthKeys: getBuffer(depthKeys),
              drawCommands: getBuffer(drawCommands),
              graphUniforms: getBuffer(uniforms)
            });
            computation.dispatch(computePass, Math.ceil(batch.length / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });
    return positions;
  }

  private addFeaturePass(
    graph: GPUCommandGraph,
    props: {
      batchIndex: number;
      positions: GraphBufferHandle;
      projectedRecords: GraphBufferHandle;
      depthKeys: GraphDataView<'uint32'>;
      drawCommands: GraphBufferHandle;
      semanticSelections: GraphBufferHandle;
      uniforms: GraphBufferHandle;
      featureUniforms: GraphBufferHandle;
    }
  ): void {
    const {
      batchIndex,
      positions,
      projectedRecords,
      depthKeys,
      drawCommands,
      semanticSelections,
      uniforms,
      featureUniforms
    } = props;
    const sphericalHarmonics = this.importSourceSlotBuffer(
      graph,
      batchIndex,
      'sphericalHarmonics',
      4
    );
    const semanticIds = this.importSourceSlotBuffer(graph, batchIndex, 'semanticIds', 4);

    graph.addComputePass({
      id: `gaussian-splat-features-batch-${batchIndex}`,
      resources: [
        {buffer: positions, usage: 'storage-read'},
        {buffer: sphericalHarmonics, usage: 'storage-read'},
        {buffer: semanticIds, usage: 'storage-read'},
        {buffer: semanticSelections, usage: 'storage-read'},
        {buffer: projectedRecords, usage: 'storage-read-write'},
        {buffer: depthKeys, usage: 'storage-read-write'},
        {buffer: drawCommands, usage: 'storage-read-write'},
        {buffer: uniforms, usage: 'uniform'},
        {buffer: featureUniforms, usage: 'uniform'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: `gaussian-splat-features-batch-${batchIndex}`,
          source: GPU_SPLAT_FEATURE_SHADER,
          shaderLayout: GPU_SPLAT_FEATURE_SHADER_LAYOUT
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const batch = this.batches[batchIndex];
            if (
              !batch ||
              batch.length === 0 ||
              (!this.props.semanticFilter &&
                (!batch.sphericalHarmonics || this.props.sphericalHarmonicsDegree === 0))
            ) {
              return;
            }
            computation.setBindings({
              positions: getBuffer(positions),
              sphericalHarmonics: getBuffer(sphericalHarmonics),
              semanticIds: getBuffer(semanticIds),
              semanticSelections: getBuffer(semanticSelections),
              projectedRecords: getBuffer(projectedRecords),
              depthKeys: getBuffer(depthKeys),
              drawCommands: getBuffer(drawCommands),
              graphUniforms: getBuffer(uniforms),
              featureUniforms: getBuffer(featureUniforms)
            });
            computation.dispatch(computePass, Math.ceil(batch.length / 256));
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private writeBatchUniforms(): void {
    if (this.semanticSelectionValues.length > 0) {
      this.semanticSelectionBuffer?.write(this.semanticSelectionValues);
    }
    let batchOffset = 0;
    for (let batchIndex = 0; batchIndex < this.allocatedBatchCapacity; batchIndex++) {
      const batch = this.batches[batchIndex];
      const uniformData = new ArrayBuffer(GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH);
      const floatValues = new Float32Array(uniformData);
      const integerValues = new Uint32Array(uniformData);
      floatValues.set(this.props.modelViewProjectionMatrix, 0);
      floatValues.set(this.props.viewportSize, 16);
      floatValues[18] = this.props.radiusScale;
      floatValues[19] = this.props.alphaScale;
      floatValues[20] = this.props.alphaCutoff;
      floatValues[21] = this.props.screenSizeCutoffPixels;
      floatValues[22] = this.props.gaussianSupportRadius;
      floatValues[23] = this.props.kernel2DSize;
      floatValues[24] = this.props.maxScreenSpaceSplatSize;
      floatValues[25] = this.props.exposure;
      integerValues[26] = this.props.toneMapping === 'reinhard' ? 1 : 0;
      integerValues[27] = batchOffset;
      integerValues[28] = batch?.length ?? 0;
      integerValues[29] = batch?.colors.format === 'float32x4' ? 1 : 0;
      this.batchUniforms[batchIndex].write(new Uint8Array(uniformData));

      const featureData = new ArrayBuffer(GPU_SPLAT_GRAPH_FEATURE_UNIFORM_BYTE_LENGTH);
      const featureFloatValues = new Float32Array(featureData);
      const featureIntegerValues = new Uint32Array(featureData);
      const degree =
        batch?.sphericalHarmonics && this.props.sphericalHarmonicsDegree > 0
          ? Math.min(batch.sphericalHarmonicsDegree, this.props.sphericalHarmonicsDegree)
          : 0;
      featureFloatValues.set(this.props.cameraPosition, 0);
      featureIntegerValues[3] = degree;
      featureIntegerValues[4] = batch
        ? getSplatSphericalHarmonicCoefficientCount(batch.sphericalHarmonicsDegree)
        : 0;
      featureIntegerValues[5] = batch?.semanticIds ? 1 : 0;
      featureIntegerValues[6] = this.semanticIncludeCount;
      featureIntegerValues[7] = this.semanticExcludeCount;
      featureIntegerValues[8] = this.props.semanticFilter?.include ? 1 : 0;
      featureIntegerValues[9] =
        (this.props.semanticFilter?.includeUnlabeled ?? !this.props.semanticFilter?.include)
          ? 1
          : 0;
      featureIntegerValues[10] = this.props.semanticFilter ? 1 : 0;
      this.batchFeatureUniforms[batchIndex].write(new Uint8Array(featureData));
      batchOffset += batch?.length ?? 0;
    }
  }

  private getSourceBufferOverrides(): Record<string, GraphImportedBuffer> {
    const overrides: Record<string, GraphImportedBuffer> = {};
    for (const [batchIndex, batch] of this.batches.entries()) {
      if (batch.length === 0) {
        continue;
      }
      for (const {name} of SOURCE_SLOT_COLUMNS) {
        overrides[getSourceSlotBufferId(batchIndex, name)] = batch[name].data[0].buffer;
      }
      for (const {name} of FEATURE_SOURCE_SLOT_COLUMNS) {
        const vector = batch[name];
        if (vector) {
          overrides[getSourceSlotBufferId(batchIndex, name)] = vector.data[0].buffer;
        }
      }
    }
    return overrides;
  }

  private updateSemanticSelections(filter: SplatSemanticFilter | undefined): void {
    if (filter?.predicate) {
      throw new Error('GPU Gaussian semantic filters cannot evaluate JavaScript predicates');
    }
    const includedIds = getSplatSemanticSelectionValues(filter?.include);
    const excludedIds = getSplatSemanticSelectionValues(filter?.exclude);
    this.semanticIncludeCount = includedIds.length;
    this.semanticExcludeCount = excludedIds.length;
    this.semanticSelectionValues = Uint32Array.from([...includedIds, ...excludedIds]);
    if (
      this.compiledGraph &&
      this.semanticSelectionValues.length > this.semanticSelectionCapacity
    ) {
      this.requiresGraphRebuild = true;
    }
  }

  private importSourceSlotBuffer(
    graph: GPUCommandGraph,
    batchIndex: number,
    columnName: SourceSlotColumnName,
    minimumByteLength: number
  ): GraphBufferHandle {
    const sourceId = getSourceSlotBufferId(batchIndex, columnName);
    const placeholder = this.createOwnedBuffer(`${sourceId}-placeholder`, minimumByteLength);
    return graph.importBuffer(
      {id: sourceId, byteLength: minimumByteLength, usage: Buffer.STORAGE},
      placeholder
    );
  }

  private resolveSplatCapacity(rowCount: number): number {
    const maximumStorageByteLength = this.device.limits.maxStorageBufferBindingSize;
    const maximumRowCapacity =
      maximumStorageByteLength > 0
        ? Math.floor(maximumStorageByteLength / GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH)
        : Number.MAX_SAFE_INTEGER;
    if (rowCount > maximumRowCapacity || (this.expectedSplatCount ?? 0) > maximumRowCapacity) {
      throw new Error('Gaussian splat projected records exceed the device storage binding limit');
    }

    if (this.allocatedSplatCapacity === 0) {
      if (this.expectedSplatCount !== undefined) {
        this.allocatedSplatCapacity = this.expectedSplatCount;
      } else {
        const firstNonemptyBatchLength = this.batches.find(batch => batch.length > 0)?.length ?? 1;
        this.allocatedSplatCapacity = Math.min(
          maximumRowCapacity,
          Math.max(rowCount, firstNonemptyBatchLength * 4)
        );
      }
    }
    while (this.allocatedSplatCapacity < rowCount) {
      this.allocatedSplatCapacity = Math.min(maximumRowCapacity, this.allocatedSplatCapacity * 2);
    }
    return this.allocatedSplatCapacity;
  }

  private resolveBatchCapacity(batchCount: number): number {
    if (this.allocatedBatchCapacity === 0) {
      this.allocatedBatchCapacity = this.expectedBatchCount ?? Math.max(batchCount, 4);
    }
    while (this.allocatedBatchCapacity < batchCount) {
      this.allocatedBatchCapacity *= 2;
    }
    return this.allocatedBatchCapacity;
  }

  private createOwnedBuffer(id: string, byteLength: number): Buffer {
    const buffer = this.device.createBuffer({
      id,
      byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    this.ownedBuffers.push(buffer);
    return buffer;
  }

  private importOwnedBuffer(graph: GPUCommandGraph, buffer: Buffer): GraphBufferHandle {
    return graph.importBuffer(
      {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
  }

  private importUint32Buffer(
    graph: GPUCommandGraph,
    buffer: Buffer,
    length: number
  ): GraphDataView<'uint32'> {
    return graph.createDataView(this.importOwnedBuffer(graph, buffer), {format: 'uint32', length});
  }

  private getRowCount(): number {
    return this.batches.reduce((totalRowCount, batch) => totalRowCount + batch.length, 0);
  }

  private releaseCompiledGraph(): void {
    this.compiledGraph?.destroy();
    this.compiledGraph = undefined;
    this.lastEncoding = undefined;
    this.model?.destroy();
    this.model = undefined;
    for (const buffer of this.ownedBuffers) {
      buffer.destroy();
    }
    this.ownedBuffers.length = 0;
    for (const uniforms of this.batchUniforms) {
      uniforms.destroy();
    }
    this.batchUniforms.length = 0;
    for (const uniforms of this.batchFeatureUniforms) {
      uniforms.destroy();
    }
    this.batchFeatureUniforms.length = 0;
    this.projectedRecordsBuffer = undefined;
    this.sortedValuesBuffer = undefined;
    this.semanticSelectionBuffer = undefined;
    this.semanticSelectionCapacity = 0;
    this.requiresGraphRebuild = true;
  }
}

function getSplatSemanticSelectionValues(selection: SplatSemanticSelection | undefined): number[] {
  if (!selection) {
    return [];
  }
  const values = Array.from(selection);
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
      throw new RangeError('GPU Gaussian semantic IDs must fit unsigned 32-bit integers');
    }
  }
  return values;
}

function getSourceSlotBufferId(batchIndex: number, columnName: SourceSlotColumnName): string {
  return `gaussian-splat-batch-${batchIndex}-${columnName}`;
}

function normalizeSplatGraphBatches(
  data: GPUSplatData | readonly GPUSplatData[] | undefined
): readonly GPUSplatData[] {
  if (!data) {
    return [];
  }
  return data instanceof GPUSplatData ? [data] : data;
}

function hasHighDynamicRangeSplatPresentation(device: Device): boolean {
  return (
    device.preferredColorFormat === 'rgba16float' &&
    device.canvasContext?.props.toneMapping === 'extended'
  );
}

function areSplatGraphValuesEqual(left: ArrayLike<number>, right: ArrayLike<number>): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let valueIndex = 0; valueIndex < left.length; valueIndex++) {
    if (!Object.is(left[valueIndex], right[valueIndex])) {
      return false;
    }
  }
  return true;
}

function toSplatGraphMatrix(
  matrix: ArrayLike<number> | undefined
): ResolvedGPUSplatGraphRendererProps['modelViewProjectionMatrix'] {
  if (!matrix) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }
  if (matrix.length !== 16) {
    throw new Error('GPUSplatGraphRenderer requires a 16-element camera matrix');
  }
  return [
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[3],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[7],
    matrix[8],
    matrix[9],
    matrix[10],
    matrix[11],
    matrix[12],
    matrix[13],
    matrix[14],
    matrix[15]
  ];
}
