// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type CommandEncoder, type Device, type ShaderLayout} from '@luma.gl/core';
import {Computation, Model} from '@luma.gl/engine';
import {
  DrawCommandBuffer,
  GPUCommandGraph,
  GPUSort,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphEncoding,
  type GPUCommandGraphStats,
  type GraphBufferHandle,
  type GraphDataView
} from '@luma.gl/experimental';
import {GPUSplatData} from './splat-data';
import {
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
  GPU_SPLAT_PROJECTION_SHADER,
  GPU_SPLAT_PROJECTION_SHADER_LAYOUT,
  GPU_SPLAT_RENDER_SHADER,
  GPU_SPLAT_RENDER_SHADER_LAYOUT
} from './gpu-splat-graph-shaders';
import type {SplatRendererProps, SplatRendererStats} from './splat-renderer';
import type {SplatSortMode} from './splat-sort';

/** Camera, styling, borrowed data, and canvas clearing for graph-native Gaussian rendering. */
export type GPUSplatGraphRendererProps = SplatRendererProps & {
  /** Color used when the graph opens its single default-framebuffer render pass. */
  clearColor?: [number, number, number, number];
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
    {name: 'drawCommands', type: 'storage', group: 0, location: 1}
  ]
} satisfies ShaderLayout;

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
  private readonly ownedBuffers: Buffer[] = [];
  private readonly batchUniforms: Buffer[] = [];
  private model?: Model;
  private sortedValuesBuffer?: Buffer;
  private requiresGraphRebuild = true;
  private requiresEncoding = true;
  private hasExplicitToneMapping: boolean;
  private isDestroyed = false;

  /** Retains supplied batches lazily; graph compilation waits until the first `encode()`. */
  constructor(device: Device, props: GPUSplatGraphRendererProps = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUSplatGraphRenderer requires a WebGPU device');
    }

    this.device = device;
    this.clearColor = [...(props.clearColor ?? [0, 0, 0, 0])];
    this.props = {
      modelViewProjectionMatrix: toSplatGraphMatrix(props.modelViewProjectionMatrix),
      viewportSize: [...(props.viewportSize ?? [1, 1])],
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

  /** GPU-produced globally sorted projected-record indices, available after compilation. */
  get sortedIndexBuffer(): Buffer | undefined {
    return this.sortedValuesBuffer;
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
    if (
      !this.hasExplicitToneMapping &&
      batch.colors.format === 'float32x4' &&
      !hasHighDynamicRangeSplatPresentation(this.device)
    ) {
      this.props.toneMapping = 'reinhard';
    }
    this.requiresGraphRebuild = true;
    this.requiresEncoding = true;
  }

  /** Updates camera or styling uniforms in O(batch count), never O(splat count). */
  setProps(props: Partial<SplatRendererProps>): void {
    if (props.data !== undefined) {
      const replacementBatches = normalizeSplatGraphBatches(props.data);
      const matchesRetainedBatches =
        replacementBatches.length === this.batches.length &&
        replacementBatches.every((batch, batchIndex) => batch === this.batches[batchIndex]);
      if (!matchesRetainedBatches) {
        this.releaseCompiledGraph();
        this.batches.length = 0;
        for (const batch of replacementBatches) {
          this.appendData(batch);
        }
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
   * The caller still owns command submission. An unchanged scene or an empty source returns
   * `undefined`, ensuring a stationary camera never repeatedly projects or sorts every source row.
   */
  encode(commandEncoder: CommandEncoder): GPUCommandGraphEncoding | undefined {
    if (this.isDestroyed || !this.requiresEncoding || this.getRowCount() === 0) {
      return undefined;
    }
    if (this.requiresGraphRebuild) {
      this.rebuildGraph();
    }
    if (!this.compiledGraph) {
      return undefined;
    }

    this.writeBatchUniforms();
    this.lastEncoding = this.compiledGraph.encode(commandEncoder, {parameters: undefined});
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
    this.isDestroyed = true;
  }

  private rebuildGraph(): void {
    this.releaseCompiledGraph();
    const rowCount = this.getRowCount();
    if (rowCount === 0) {
      this.requiresGraphRebuild = false;
      return;
    }

    const projectedByteLength = rowCount * GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH;
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
    const depthKeysBuffer = this.createOwnedBuffer(
      'gaussian-splat-depth-keys',
      rowCount * Uint32Array.BYTES_PER_ELEMENT
    );
    const sourceIndicesBuffer = this.createOwnedBuffer(
      'gaussian-splat-source-indices',
      rowCount * Uint32Array.BYTES_PER_ELEMENT
    );
    const sortedKeysBuffer = this.createOwnedBuffer(
      'gaussian-splat-sorted-keys',
      rowCount * Uint32Array.BYTES_PER_ELEMENT
    );
    this.sortedValuesBuffer = this.createOwnedBuffer(
      'gaussian-splat-sorted-indices',
      rowCount * Uint32Array.BYTES_PER_ELEMENT
    );

    const projectedRecords = this.importOwnedBuffer(graph, projectedRecordsBuffer);
    const depthKeys = this.importUint32Buffer(graph, depthKeysBuffer, rowCount);
    const sourceIndices = this.importUint32Buffer(graph, sourceIndicesBuffer, rowCount);
    const sortedKeys = this.importUint32Buffer(graph, sortedKeysBuffer, rowCount);
    const sortedIndices = this.importUint32Buffer(graph, this.sortedValuesBuffer, rowCount);
    const drawCommandViews = this.drawCommands.importToGraph(graph);

    this.addInitializationPass(graph, sourceIndices, drawCommandViews.buffer, rowCount);

    let firstUniform: GraphBufferHandle | undefined;
    for (const [batchIndex, batch] of this.batches.entries()) {
      if (batch.length === 0) {
        continue;
      }
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
      firstUniform ??= uniforms;
      this.addProjectionPass(graph, {
        batch,
        batchIndex,
        projectedRecords,
        depthKeys,
        drawCommands: drawCommandViews.buffer,
        uniforms
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
      instanceCount: rowCount,
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
    drawCommands: GraphBufferHandle,
    rowCount: number
  ): void {
    const shader = /* wgsl */ `
const ROW_COUNT: u32 = ${rowCount}u;
@group(0) @binding(0) var<storage, read_write> sortValues: array<u32>;
@group(0) @binding(1) var<storage, read_write> drawCommands: array<atomic<u32>>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  if (invocation.x < ROW_COUNT) {
    sortValues[invocation.x] = invocation.x;
  }
  if (invocation.x == 0u) {
    atomicStore(&drawCommands[1], 0u);
  }
}`;
    graph.addComputePass({
      id: 'gaussian-splat-initialize',
      resources: [
        {buffer: sourceIndices, usage: 'storage-write'},
        {buffer: drawCommands, usage: 'storage-write'}
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
              drawCommands: getBuffer(drawCommands)
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
      batch: GPUSplatData;
      batchIndex: number;
      projectedRecords: GraphBufferHandle;
      depthKeys: GraphDataView<'uint32'>;
      drawCommands: GraphBufferHandle;
      uniforms: GraphBufferHandle;
    }
  ): void {
    const {batch, batchIndex, projectedRecords, depthKeys, drawCommands, uniforms} = props;
    const positions = graph.importGPUData(
      `gaussian-splat-batch-${batchIndex}-positions`,
      batch.positions.data[0]
    );
    const scales = graph.importGPUData(
      `gaussian-splat-batch-${batchIndex}-scales`,
      batch.scales.data[0]
    );
    const rotations = graph.importGPUData(
      `gaussian-splat-batch-${batchIndex}-rotations`,
      batch.rotations.data[0]
    );
    const colors = graph.importGPUData(
      `gaussian-splat-batch-${batchIndex}-colors`,
      batch.colors.data[0]
    );
    const opacities = graph.importGPUData(
      `gaussian-splat-batch-${batchIndex}-opacities`,
      batch.opacities.data[0]
    );

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
  }

  private writeBatchUniforms(): void {
    let batchOffset = 0;
    let uniformIndex = 0;
    for (const batch of this.batches) {
      if (batch.length === 0) {
        continue;
      }
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
      integerValues[28] = batch.length;
      integerValues[29] = batch.colors.format === 'float32x4' ? 1 : 0;
      this.batchUniforms[uniformIndex].write(new Uint8Array(uniformData));
      batchOffset += batch.length;
      uniformIndex++;
    }
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
    this.sortedValuesBuffer = undefined;
    this.requiresGraphRebuild = true;
  }
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
