// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {
  CommandEncoder,
  ComputePass,
  Device,
  ExternalTexture,
  Framebuffer,
  QuerySet,
  RenderPass,
  TextureFormat,
  TextureView
} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import {
  type GPUData,
  type GPUVector,
  type GPUVectorFormat,
  getGPUVectorFormatInfo,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from '@luma.gl/tables';
import {
  compileGPUCommandGraph,
  getBufferHandle,
  getTextureHandle,
  isGraphBufferUse,
  isGraphTextureUse,
  type BufferTransientAllocation,
  type CompiledNode,
  type GPUCommandGraphCompilation,
  type TextureTransientAllocation
} from './gpu-command-graph-compiler';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
import type {
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCapabilities,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphNode,
  GPUCommandGraphNodeEncodingStats,
  GPUCommandGraphPreflightReport,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GPUCommandGraphTimingReport,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphExternalTextureBinding,
  GraphExternalTextureDescriptor,
  GraphFrameTextureBinding,
  GraphImportedBuffer,
  GraphImportedTexture,
  GraphRenderPassAttachments,
  GraphTextureDescriptor,
  GraphTextureUsage,
  GraphTextureUse,
  GraphTextureViewProps,
  NormalizedGraphTextureDescriptor
} from './gpu-command-graph-types';

export {
  GraphBufferHandle,
  GraphDataView,
  GraphExternalTextureHandle,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
export type {
  GPUCommandGraphCompileContext,
  GPUCommandGraphCapabilities,
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphNode,
  GPUCommandGraphNodeEncodingStats,
  GPUCommandGraphNodePreflight,
  GPUCommandGraphNodeTiming,
  GPUCommandGraphNodeType,
  GPUCommandGraphNodeWorkloadEstimate,
  GPUCommandGraphPreflightReport,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GPUCommandGraphEncodingStats,
  GPUCommandGraphTimingReport,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphBufferUse,
  GraphExternalTextureBinding,
  GraphExternalTextureDescriptor,
  GraphExternalTextureUse,
  GraphFrameTextureBinding,
  GraphImportedBuffer,
  GraphImportedTexture,
  GraphRenderPassAttachments,
  GraphResourceUse,
  GraphTextureAspect,
  GraphTextureDescriptor,
  GraphTextureDimension,
  GraphTextureUsage,
  GraphTextureUse,
  GraphTextureViewProps
} from './gpu-command-graph-types';

/** A reusable algorithm or workflow that contributes nodes to a command graph. */
export interface GPUCommandGraphContributor {
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void;
}

type CachedTextureView = {
  logicalView: GraphTextureView;
  texture: Texture;
  view: TextureView;
  frameId?: number;
};

type CachedFramebuffer = {
  nodeId: string;
  colorAttachments: TextureView[];
  depthStencilAttachment?: TextureView;
  framebuffer: Framebuffer;
};

type GPUCommandGraphNodeTimestamp = {
  querySet: QuerySet;
  beginIndex: number;
  endIndex: number;
};

type EncodedGPUCommandGraphNode = {
  stats: GPUCommandGraphNodeEncodingStats;
  timestamp?: GPUCommandGraphNodeTimestamp;
};

/**
 * Synchronous encoding statistics plus optional explicit GPU timing readback.
 *
 * Creating this result never maps a buffer, submits commands, or waits for the GPU. Call
 * `readTimings()` only after the caller submits the encoded command buffer.
 */
export class GPUCommandGraphEncoding {
  /** CPU encoding statistics available immediately after `encode()`. */
  readonly stats: GPUCommandGraphEncodingStats;
  /** Whether at least one render or compute node recorded a GPU timestamp pair. */
  readonly canReadGPUTimings: boolean;

  private readonly nodes: EncodedGPUCommandGraphNode[];

  /** @internal */
  constructor(
    nodes: EncodedGPUCommandGraphNode[],
    cpuEncodeTimeMilliseconds: number,
    computePassCount = nodes.filter(node => node.stats.type === 'compute').length
  ) {
    this.nodes = nodes;
    this.canReadGPUTimings = nodes.some(node => node.timestamp !== undefined);
    const computeNodeCount = nodes.filter(node => node.stats.type === 'compute').length;
    this.stats = {
      cpuEncodeTimeMilliseconds,
      nodeCount: nodes.length,
      computePassCount,
      coalescedComputeNodeCount: computeNodeCount - computePassCount,
      timestampedNodeCount: nodes.filter(node => node.timestamp !== undefined).length,
      nodes: nodes.map(node => node.stats)
    };
  }

  /**
   * Explicitly reads available per-pass GPU timestamp pairs after submission.
   *
   * Copy nodes currently report CPU encoding cost only because the portable command-encoder API
   * does not expose standalone timestamp writes.
   */
  async readTimings(): Promise<GPUCommandGraphTimingReport> {
    const nodes = await Promise.all(
      this.nodes.map(async ({stats, timestamp}) => ({
        ...stats,
        ...(timestamp
          ? {
              gpuTimeMilliseconds: await timestamp.querySet.readTimestampDuration(
                timestamp.beginIndex,
                timestamp.endIndex
              )
            }
          : {})
      }))
    );
    const timestampedNodes = nodes.filter(node => node.gpuTimeMilliseconds !== undefined);
    return {
      cpuEncodeTimeMilliseconds: this.stats.cpuEncodeTimeMilliseconds,
      ...(timestampedNodes.length > 0
        ? {
            gpuTimeMilliseconds: timestampedNodes.reduce(
              (total, node) => total + (node.gpuTimeMilliseconds ?? 0),
              0
            )
          }
        : {}),
      nodes
    };
  }
}

/**
 * Declarative WebGPU command graph with explicit resource access and ownership.
 *
 * The graph compiles resource hazards, transient lifetimes, and node resources,
 * but encoding and submission remain controlled by the application.
 */
export class GPUCommandGraph<Parameters = void> {
  /** WebGPU device that owns compilation and transient resources. */
  readonly device: Device;
  /** Identifier used as a prefix for graph-owned GPU resources. */
  readonly id: string;

  private readonly buffers = new Map<string, GraphBufferHandle>();
  private readonly textures = new Map<string, GraphTextureHandle>();
  private readonly externalTextures = new Map<string, GraphExternalTextureHandle>();
  private readonly tableBufferHandles = new Map<Buffer, GraphBufferHandle>();
  private readonly nodes: GPUCommandGraphNode<Parameters>[] = [];
  private readonly nodeIds = new Set<string>();
  private compiled = false;

  /**
   * Creates a mutable graph definition.
   *
   * @param device WebGPU device used to compile and execute the graph.
   * @param props Optional graph identity.
   * @throws If `device` is not a WebGPU device.
   */
  constructor(device: Device, props: {id?: string} = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUCommandGraph requires a WebGPU device');
    }
    assertDeviceAvailable(device, 'construction');
    this.device = device;
    this.id = props.id ?? 'gpu-command-graph';
  }

  /**
   * Declares a caller-owned buffer that can be supplied now or for each encoding.
   *
   * Represent one physical buffer with one logical handle whenever a graph access may write to
   * it. Distinct active imported handles may share a physical buffer only when every graph access
   * is read-only because write hazards are tracked by handle identity.
   *
   * @param descriptor Required capacity and usage.
   * @param defaultBuffer Optional default binding used when an encoding supplies no override.
   * @returns An opaque logical handle used by graph nodes and data views.
   */
  importBuffer(
    descriptor: GraphBufferDescriptor,
    defaultBuffer?: GraphImportedBuffer
  ): GraphBufferHandle {
    this.assertMutable();
    validateGraphBufferDescriptor(descriptor, this.device);
    if (defaultBuffer) {
      validateImportedBuffer(defaultBuffer, descriptor, this.device);
    }
    return this.addBuffer(new GraphBufferHandle(this, descriptor, false, defaultBuffer));
  }

  /**
   * Declares one graph-owned scratch buffer.
   *
   * Compatible transient buffers with disjoint compiled lifetimes may share a physical allocation.
   */
  createTransientBuffer(descriptor: GraphBufferDescriptor): GraphBufferHandle {
    this.assertMutable();
    validateGraphBufferDescriptor(descriptor, this.device);
    return this.addBuffer(new GraphBufferHandle(this, descriptor, true));
  }

  /**
   * Creates one typed range over a graph buffer.
   *
   * The view is non-owning. Its layout is validated against the logical buffer capacity.
   */
  createDataView<T extends GPUVectorFormat>(
    buffer: GraphBufferHandle,
    props: {
      format: T;
      length: number;
      byteOffset?: number;
      byteStride?: number;
      rowByteLength?: number;
    }
  ): GraphDataView<T> {
    this.assertBuffer(buffer);
    const formatInfo = getGPUVectorFormatInfo(props.format);
    const byteOffset = props.byteOffset ?? 0;
    const rowByteLength = props.rowByteLength ?? formatInfo.byteLength;
    const byteStride = props.byteStride ?? rowByteLength;
    validateGraphDataView(buffer, {
      length: props.length,
      byteOffset,
      byteStride,
      rowByteLength
    });
    return new GraphDataView(buffer, {
      format: props.format,
      length: props.length,
      byteOffset,
      byteStride,
      rowByteLength
    });
  }

  /**
   * Imports one borrowed `GPUData` chunk and returns a typed view preserving its layout.
   *
   * The graph never destroys the imported buffer.
   */
  importGPUData<T extends GPUVectorFormat>(id: string, data: GPUData<T>): GraphDataView<T> {
    return this.importGPUDataView(id, data);
  }

  /**
   * Imports all chunks of one fixed-width `GPUVector` without packing them.
   *
   * Shared physical buffers map to one graph handle while each chunk retains its own offset and
   * layout. Interleaved and variable-length vectors are rejected.
   */
  importGPUVector<T extends GPUVectorFormat>(id: string, vector: GPUVector<T>): GraphVectorView<T> {
    if (vector.bufferLayout) {
      throw new Error(`GPUCommandGraph import "${id}" does not accept interleaved GPUVector data`);
    }
    const format = vector.format ?? vector.data[0]?.format;
    if (!format) {
      throw new Error(`GPUCommandGraph import "${id}" requires GPUVector.format`);
    }
    if (isVertexListGPUVectorFormat(format) || isValueListGPUVectorFormat(format)) {
      throw new Error(`GPUCommandGraph import "${id}" requires a fixed-width GPUVector format`);
    }
    const data = vector.data.map((chunk, chunkIndex) => {
      if (chunk.format !== format) {
        throw new Error(`GPUCommandGraph import "${id}" requires matching GPUVector chunk formats`);
      }
      const chunkId = vector.data.length === 1 ? id : `${id}-chunk-${chunkIndex}`;
      return this.importGPUDataView(chunkId, chunk);
    });
    return new GraphVectorView({
      id,
      name: vector.name,
      format,
      length: vector.length,
      valueLength: vector.valueLength,
      stride: vector.stride,
      byteStride: vector.byteStride,
      rowByteLength: vector.rowByteLength,
      data
    });
  }

  /**
   * Declares a caller-owned fixed-size texture supplied now or while encoding.
   *
   * Replacements must exactly match format, dimension, extent, mip count, and sample count.
   */
  importTexture<Format extends TextureFormat>(
    descriptor: GraphTextureDescriptor<Format>,
    defaultTexture?: GraphImportedTexture
  ): GraphTextureHandle<Format> {
    this.assertMutable();
    const normalizedDescriptor = normalizeGraphTextureDescriptor(descriptor, this.device);
    if (defaultTexture) {
      validateImportedTexture(defaultTexture, normalizedDescriptor, this.device);
    }
    return this.addTexture(
      new GraphTextureHandle(this, normalizedDescriptor, false, defaultTexture)
    );
  }

  /**
   * Declares a caller-acquired texture that is valid for exactly one numbered encoding frame.
   *
   * Frame textures have no default and must be supplied through `encode({frameTextures})` with a
   * strictly increasing frame ID. The graph borrows but never acquires, presents, or destroys them.
   */
  importFrameTexture<Format extends TextureFormat>(
    descriptor: GraphTextureDescriptor<Format>
  ): GraphTextureHandle<Format> {
    this.assertMutable();
    const normalizedDescriptor = normalizeGraphTextureDescriptor(descriptor, this.device);
    return this.addTexture(
      new GraphTextureHandle(this, normalizedDescriptor, false, undefined, true)
    );
  }

  /**
   * Declares a sampled external image that must be replaced for every numbered encoding frame.
   *
   * Media scheduling and acquisition remain caller-owned. The graph borrows each fresh binding
   * for one encoding and never destroys it.
   */
  importExternalTexture(descriptor: GraphExternalTextureDescriptor): GraphExternalTextureHandle {
    this.assertMutable();
    validateGraphExternalTextureDescriptor(descriptor, this.device);
    return this.addExternalTexture(new GraphExternalTextureHandle(this, descriptor));
  }

  /**
   * Declares one graph-owned fixed-size transient texture.
   *
   * Descriptor-compatible textures with disjoint compiled lifetimes may share an allocation.
   */
  createTransientTexture<Format extends TextureFormat>(
    descriptor: GraphTextureDescriptor<Format>
  ): GraphTextureHandle<Format> {
    this.assertMutable();
    const normalizedDescriptor = normalizeGraphTextureDescriptor(descriptor, this.device);
    return this.addTexture(new GraphTextureHandle(this, normalizedDescriptor, true));
  }

  /**
   * Creates one logical mip, layer, and aspect range over a graph texture.
   *
   * The normalized range is used for texture hazard inference and concrete view creation.
   */
  createTextureView<Format extends TextureFormat>(
    texture: GraphTextureHandle<Format>,
    props: GraphTextureViewProps = {}
  ): GraphTextureView<Format> {
    this.assertTexture(texture);
    const normalizedProps = normalizeGraphTextureView(texture, props);
    return new GraphTextureView(texture, normalizedProps);
  }

  /**
   * Adds a compute node.
   *
   * The graph opens and closes the compute pass; the compiled executable only records commands.
   * Declared resource uses participate in automatic dependency inference.
   */
  addComputePass(node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'compute'});
  }

  /**
   * Adds a render node.
   *
   * Graph attachments are validated, added to the node's resource uses, and resolved to a cached
   * framebuffer at encode time. The graph opens and closes the render pass.
   */
  addRenderPass(node: Omit<GPUCommandGraphRenderNode<Parameters>, 'type'>): void {
    if (node.attachments) {
      this.validateRenderAttachments(node.id, node.attachments);
    }
    const attachmentUses: GraphTextureUse[] = node.attachments
      ? [
          ...node.attachments.colorAttachments.map(texture => ({
            texture,
            usage: 'render-attachment' as const
          })),
          ...(node.attachments.resolveTargets ?? [])
            .filter((texture): texture is GraphTextureView => texture !== null)
            .map(texture => ({texture, usage: 'render-attachment' as const})),
          ...(node.attachments.depthStencilAttachment
            ? [
                {
                  texture: node.attachments.depthStencilAttachment,
                  usage: 'render-attachment' as const
                }
              ]
            : [])
        ]
      : [];
    this.addNode({
      ...node,
      resources: [...(node.resources ?? []), ...attachmentUses],
      type: 'render'
    });
  }

  /**
   * Adds a copy or pass-independent node.
   *
   * Its executable records directly into the caller-owned command encoder.
   */
  addCopyPass(node: Omit<GPUCommandGraphCopyNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'copy'});
  }

  /**
   * Compiles scheduling, transient allocations, and executable node resources.
   *
   * Compilation freezes this graph. A graph can be compiled only once.
   *
   * @returns An executable graph that owns compiled node state and transient allocations.
   */
  compile(): CompiledGPUCommandGraph<Parameters> {
    this.assertMutable();
    assertDeviceAvailable(this.device, 'compilation');
    this.compiled = true;
    return new CompiledGPUCommandGraph(
      compileGPUCommandGraph({
        device: this.device,
        id: this.id,
        buffers: this.buffers,
        textures: this.textures,
        externalTextures: this.externalTextures,
        nodes: this.nodes
      })
    );
  }

  private addNode(node: GPUCommandGraphNode<Parameters>): void {
    this.assertMutable();
    if (!node.id) {
      throw new Error('GPUCommandGraph node id is required');
    }
    if (this.nodeIds.has(node.id)) {
      throw new Error(`GPUCommandGraph node id "${node.id}" is already in use`);
    }
    for (const [name, value] of Object.entries(node.workload ?? {})) {
      if (
        name !== 'operation' &&
        (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
      ) {
        throw new Error(
          `GPUCommandGraph node "${node.id}" workload ${name} must be a nonnegative safe integer`
        );
      }
    }
    for (const resource of node.resources ?? []) {
      if (isGraphBufferUse(resource)) {
        const buffer = getBufferHandle(resource.buffer);
        this.assertBuffer(buffer);
        validateBufferUseAgainstDescriptor(buffer, resource.usage);
      } else if (isGraphTextureUse(resource)) {
        const texture = getTextureHandle(resource.texture);
        this.assertTexture(texture);
        validateTextureUseAgainstDescriptor(texture, resource.usage);
        validateTextureViewForUsage(resource.texture, resource.usage);
      } else {
        this.assertExternalTexture(resource.externalTexture);
        if (resource.usage !== 'sampled') {
          throw new Error('GPUCommandGraph external textures support sampled access only');
        }
        if (node.type !== 'render') {
          throw new Error('GPUCommandGraph external textures can be sampled only by render nodes');
        }
      }
    }
    this.nodeIds.add(node.id);
    this.nodes.push(node);
  }

  private addBuffer(buffer: GraphBufferHandle): GraphBufferHandle {
    if (
      this.buffers.has(buffer.id) ||
      this.textures.has(buffer.id) ||
      this.externalTextures.has(buffer.id)
    ) {
      throw new Error(`GPUCommandGraph resource id "${buffer.id}" is already in use`);
    }
    this.buffers.set(buffer.id, buffer);
    return buffer;
  }

  private addTexture<Format extends TextureFormat>(
    texture: GraphTextureHandle<Format>
  ): GraphTextureHandle<Format> {
    if (
      this.buffers.has(texture.id) ||
      this.textures.has(texture.id) ||
      this.externalTextures.has(texture.id)
    ) {
      throw new Error(`GPUCommandGraph resource id "${texture.id}" is already in use`);
    }
    this.textures.set(texture.id, texture);
    return texture;
  }

  private addExternalTexture(texture: GraphExternalTextureHandle): GraphExternalTextureHandle {
    if (
      this.buffers.has(texture.id) ||
      this.textures.has(texture.id) ||
      this.externalTextures.has(texture.id)
    ) {
      throw new Error(`GPUCommandGraph resource id "${texture.id}" is already in use`);
    }
    this.externalTextures.set(texture.id, texture);
    return texture;
  }

  private importGPUDataView<T extends GPUVectorFormat>(
    id: string,
    data: GPUData<T>
  ): GraphDataView<T> {
    if (!data.format) {
      throw new Error(`GPUCommandGraph import "${id}" requires GPUData.format`);
    }
    const coreBuffer = getCoreBuffer(data.buffer);
    let handle = this.tableBufferHandles.get(coreBuffer);
    if (!handle) {
      handle = this.importBuffer(
        {id, byteLength: coreBuffer.byteLength, usage: coreBuffer.usage},
        data.buffer
      );
      this.tableBufferHandles.set(coreBuffer, handle);
    }
    return this.createDataView(handle, {
      format: data.format,
      length: data.length,
      byteOffset: data.byteOffset,
      byteStride: data.byteStride,
      rowByteLength: data.rowByteLength
    });
  }

  private assertBuffer(buffer: GraphBufferHandle): void {
    if (buffer.graph !== this || this.buffers.get(buffer.id) !== buffer) {
      throw new Error(`Graph buffer "${buffer.id}" does not belong to ${this.id}`);
    }
  }

  private assertTexture(texture: GraphTextureHandle): void {
    if (texture.graph !== this || this.textures.get(texture.id) !== texture) {
      throw new Error(`Graph texture "${texture.id}" does not belong to ${this.id}`);
    }
  }

  private assertExternalTexture(texture: GraphExternalTextureHandle): void {
    if (texture.graph !== this || this.externalTextures.get(texture.id) !== texture) {
      throw new Error(`Graph external texture "${texture.id}" does not belong to ${this.id}`);
    }
  }

  private assertMutable(): void {
    if (this.compiled) {
      throw new Error(`GPUCommandGraph "${this.id}" has already been compiled`);
    }
  }

  private validateRenderAttachments(id: string, attachments: GraphRenderPassAttachments): void {
    if (attachments.colorAttachments.length === 0 && !attachments.depthStencilAttachment) {
      throw new Error(`GPUCommandGraph render node "${id}" requires at least one attachment`);
    }
    const allAttachments = [
      ...attachments.colorAttachments,
      ...(attachments.depthStencilAttachment ? [attachments.depthStencilAttachment] : [])
    ];
    for (const attachment of allAttachments) {
      this.assertTexture(attachment.texture);
      if (
        attachment.dimension !== '2d' ||
        attachment.mipLevelCount !== 1 ||
        attachment.arrayLayerCount !== 1
      ) {
        throw new Error(
          `GPUCommandGraph render node "${id}" attachments must be single-mip, single-layer 2d views`
        );
      }
    }
    const [first, ...remaining] = allAttachments;
    for (const attachment of remaining) {
      if (
        attachment.width !== first.width ||
        attachment.height !== first.height ||
        attachment.texture.samples !== first.texture.samples
      ) {
        throw new Error(
          `GPUCommandGraph render node "${id}" attachments must have matching extent and samples`
        );
      }
    }
    this.validateResolveTargets(id, attachments);
  }

  private validateResolveTargets(id: string, attachments: GraphRenderPassAttachments): void {
    const resolveTargets = attachments.resolveTargets;
    if (!resolveTargets) {
      return;
    }
    if (this.device.type !== 'webgpu') {
      throw new Error(`GPUCommandGraph render node "${id}" resolve targets require WebGPU`);
    }
    if (resolveTargets.length !== attachments.colorAttachments.length) {
      throw new Error(
        `GPUCommandGraph render node "${id}" requires one resolve entry per color attachment`
      );
    }
    for (let index = 0; index < resolveTargets.length; index++) {
      const target = resolveTargets[index];
      if (!target) {
        continue;
      }
      const source = attachments.colorAttachments[index];
      this.assertTexture(target.texture);
      if (
        source.texture.samples <= 1 ||
        target.texture.samples !== 1 ||
        source.format !== target.format ||
        source.width !== target.width ||
        source.height !== target.height
      ) {
        throw new Error(
          `GPUCommandGraph render node "${id}" resolve target ${index} must match a multisampled source and be single-sampled`
        );
      }
      if (
        target.dimension !== '2d' ||
        target.aspect !== 'all' ||
        target.mipLevelCount !== 1 ||
        target.arrayLayerCount !== 1
      ) {
        throw new Error(
          `GPUCommandGraph render node "${id}" resolve targets must be single-mip, single-layer 2d color views`
        );
      }
    }
  }
}

/**
 * Executable, fixed-capacity command graph.
 *
 * The compiled graph owns transient allocations, compiled node state, and cached views and
 * framebuffers. Imported buffers and textures remain caller-owned.
 */
export class CompiledGPUCommandGraph<Parameters = void> {
  /** WebGPU device that owns the compiled resources. */
  readonly device: Device;
  /** Identifier inherited from the graph definition. */
  readonly id: string;
  /** Scheduling and transient-allocation statistics. */
  readonly stats: GPUCommandGraphStats;
  /** Static resource and workload bounds for application-defined preflight policy. */
  readonly preflight: GPUCommandGraphPreflightReport;
  /** Adapter capabilities and limits relevant to graph execution. */
  readonly capabilities: GPUCommandGraphCapabilities;

  private readonly buffers: Map<string, GraphBufferHandle>;
  private readonly textures: Map<string, GraphTextureHandle>;
  private readonly externalTextures: Map<string, GraphExternalTextureHandle>;
  private readonly compiledNodes: CompiledNode<Parameters>[];
  private readonly activeImportedBufferHandles = new Set<GraphBufferHandle>();
  private readonly writableImportedBufferHandles = new Set<GraphBufferHandle>();
  private readonly activeImportedTextureHandles = new Set<GraphTextureHandle>();
  private readonly writableImportedTextureHandles = new Set<GraphTextureHandle>();
  private readonly transientBuffers: Map<GraphBufferHandle, Buffer>;
  private readonly transientTextures: Map<GraphTextureHandle, Texture>;
  private readonly bufferTransientAllocations: BufferTransientAllocation[];
  private readonly textureTransientAllocations: TextureTransientAllocation[];
  private readonly cachedTextureViews: CachedTextureView[] = [];
  private readonly cachedFramebuffers: CachedFramebuffer[] = [];
  private readonly lastFrameIds = new Map<GraphTextureHandle, number>();
  private readonly lastExternalTextureFrameIds = new Map<GraphExternalTextureHandle, number>();
  private readonly consumedExternalTextures = new WeakSet<ExternalTexture>();
  private destroyed = false;

  /** @internal */
  constructor(props: GPUCommandGraphCompilation<Parameters>) {
    this.device = props.device;
    this.id = props.id;
    this.buffers = props.buffers;
    this.textures = props.textures;
    this.externalTextures = props.externalTextures;
    this.compiledNodes = props.compiledNodes;
    for (const {node} of this.compiledNodes) {
      for (const resource of node.resources ?? []) {
        if (isGraphBufferUse(resource)) {
          const handle = getBufferHandle(resource.buffer);
          if (!handle.transient) {
            this.activeImportedBufferHandles.add(handle);
            if (
              resource.usage === 'storage-write' ||
              resource.usage === 'storage-read-write' ||
              resource.usage === 'copy-destination'
            ) {
              this.writableImportedBufferHandles.add(handle);
            }
          }
        } else if (isGraphTextureUse(resource)) {
          const handle = getTextureHandle(resource.texture);
          if (!handle.transient) {
            this.activeImportedTextureHandles.add(handle);
            if (
              resource.usage === 'storage-write' ||
              resource.usage === 'storage-read-write' ||
              resource.usage === 'render-attachment' ||
              resource.usage === 'copy-destination'
            ) {
              this.writableImportedTextureHandles.add(handle);
            }
          }
        }
      }
    }
    this.transientBuffers = props.transientBuffers;
    this.transientTextures = props.transientTextures;
    this.bufferTransientAllocations = props.bufferTransientAllocations;
    this.textureTransientAllocations = props.textureTransientAllocations;
    this.stats = props.stats;
    this.preflight = props.preflight;
    this.capabilities = getGPUCommandGraphCapabilities(this.device);
  }

  /**
   * Records every graph node into a caller-owned command encoder.
   *
   * Imported resources are resolved from per-encoding overrides first, then from defaults supplied
   * at graph construction. Distinct active buffer or texture handles must not alias one physical
   * resource when either handle is written. This method records only; it does not finish or submit
   * the encoder.
   *
   * @param commandEncoder Encoder that receives all graph commands.
   * @param options Per-encoding parameters and optional imported-resource replacements.
   */
  encode(
    commandEncoder: CommandEncoder,
    options: GPUCommandGraphEncodeOptions<Parameters>
  ): GPUCommandGraphEncoding {
    if (this.destroyed) {
      throw new Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);
    }
    assertDeviceAvailable(this.device, 'encoding');
    if (commandEncoder.device !== this.device) {
      throw new Error('GPUCommandGraph command encoder must belong to the graph device');
    }

    const encodingStartTime = getTimestampMilliseconds();
    const importedBuffers = this.resolveImportedBuffers(options.buffers ?? {});
    validateEncodingFrameId(options.frameTextures ?? {}, options.externalTextures ?? {});
    const importedTextureResult = this.resolveImportedTextures(
      options.textures ?? {},
      options.frameTextures ?? {}
    );
    const externalTextureResult = this.resolveExternalTextures(options.externalTextures ?? {});
    for (const [handle, nextFrameId] of importedTextureResult.frameIds) {
      this.lastFrameIds.set(handle, nextFrameId);
    }
    for (const [handle, nextFrameId] of externalTextureResult.frameIds) {
      this.lastExternalTextureFrameIds.set(handle, nextFrameId);
    }
    for (const texture of externalTextureResult.textures.values()) {
      this.consumedExternalTextures.add(texture);
    }
    const importedTextures = importedTextureResult.textures;
    const getBuffer = (bufferOrView: GraphBufferHandle | GraphDataView): Buffer => {
      const handle = getBufferHandle(bufferOrView);
      const buffer = handle.transient
        ? this.transientBuffers.get(handle)
        : importedBuffers.get(handle);
      if (!buffer) {
        throw new Error(`GPUCommandGraph buffer "${handle.id}" is not bound`);
      }
      return buffer;
    };
    const getTexture = (textureOrView: GraphTextureHandle | GraphTextureView): Texture => {
      const handle = getTextureHandle(textureOrView);
      const texture = handle.transient
        ? this.transientTextures.get(handle)
        : importedTextures.get(handle);
      if (!texture) {
        throw new Error(`GPUCommandGraph texture "${handle.id}" is not bound`);
      }
      return texture;
    };
    const getTextureView = (textureOrView: GraphTextureHandle | GraphTextureView): TextureView => {
      const texture = getTexture(textureOrView);
      if (textureOrView instanceof GraphTextureHandle || isDefaultGraphTextureView(textureOrView)) {
        return texture.view;
      }
      if (textureOrView.texture.frameScoped) {
        const frameId = this.lastFrameIds.get(textureOrView.texture);
        for (let index = this.cachedTextureViews.length - 1; index >= 0; index--) {
          const entry = this.cachedTextureViews[index];
          if (entry.logicalView === textureOrView && entry.frameId !== frameId) {
            this.destroyFramebuffersUsingView(entry.view);
            entry.view.destroy();
            this.cachedTextureViews.splice(index, 1);
          }
        }
      }
      const cached = this.cachedTextureViews.find(
        entry =>
          entry.logicalView === textureOrView &&
          entry.texture === texture &&
          (!textureOrView.texture.frameScoped ||
            entry.frameId === this.lastFrameIds.get(textureOrView.texture))
      );
      if (cached) {
        return cached.view;
      }
      const view = texture.createView({
        format: textureOrView.format,
        dimension: textureOrView.dimension,
        aspect: textureOrView.aspect,
        baseMipLevel: textureOrView.baseMipLevel,
        mipLevelCount: textureOrView.mipLevelCount,
        baseArrayLayer: textureOrView.baseArrayLayer,
        arrayLayerCount: textureOrView.arrayLayerCount
      });
      this.cachedTextureViews.push({
        logicalView: textureOrView,
        texture,
        view,
        ...(textureOrView.texture.frameScoped
          ? {frameId: this.lastFrameIds.get(textureOrView.texture)}
          : {})
      });
      return view;
    };
    const getExternalTexture = (handle: GraphExternalTextureHandle): ExternalTexture => {
      const texture = externalTextureResult.textures.get(handle);
      if (!texture) {
        throw new Error(`GPUCommandGraph external texture "${handle.id}" is not bound`);
      }
      return texture;
    };

    const baseContext: GPUCommandGraphEncodeContext<Parameters> = {
      commandEncoder,
      parameters: options.parameters,
      getBuffer,
      getTexture,
      getTextureView,
      getExternalTexture
    };

    const encodedNodes: EncodedGPUCommandGraphNode[] = [];
    let activeComputePass: ComputePass | undefined;
    let computePassCount = 0;
    let coalesceComputePasses =
      options.coalesceComputePasses !== false && commandEncoder.getTimeProfilingQuerySet() === null;
    const endActiveComputePass = (): void => {
      const computePass = activeComputePass;
      activeComputePass = undefined;
      computePass?.end();
    };

    try {
      for (const {node, executable} of this.compiledNodes) {
        const nodeStartTime = getTimestampMilliseconds();
        let timestamp: GPUCommandGraphNodeTimestamp | undefined;
        switch (node.type) {
          case 'compute': {
            if (!activeComputePass) {
              activeComputePass = commandEncoder.beginComputePass({id: node.id});
              computePassCount++;
            }
            const computePass = activeComputePass;
            timestamp = getPassTimestamp(computePass);
            if (timestamp) {
              coalesceComputePasses = false;
            }
            computePass.pushDebugGroup(node.id);
            try {
              (executable as GPUCommandGraphComputeExecutable<Parameters>).encode({
                ...baseContext,
                computePass
              });
            } finally {
              computePass.popDebugGroup();
            }
            if (!coalesceComputePasses) {
              endActiveComputePass();
            }
            break;
          }
          case 'render': {
            endActiveComputePass();
            const renderExecutable = executable as GPUCommandGraphRenderExecutable<Parameters>;
            const renderPassProps = renderExecutable.getRenderPassProps?.(baseContext) ?? {
              id: node.id
            };
            if (node.attachments && renderPassProps.framebuffer !== undefined) {
              throw new Error(
                `GPUCommandGraph render node "${node.id}" cannot supply framebuffer with graph attachments`
              );
            }
            if (node.attachments?.resolveTargets && renderPassProps.resolveTargets !== undefined) {
              throw new Error(
                `GPUCommandGraph render node "${node.id}" cannot supply resolveTargets with graph attachments`
              );
            }
            const framebuffer = node.attachments
              ? this.getFramebuffer(node.id, node.attachments, getTextureView)
              : undefined;
            const resolveTargets = node.attachments?.resolveTargets?.map(target =>
              target ? getTextureView(target) : null
            );
            const renderPass = commandEncoder.beginRenderPass({
              ...renderPassProps,
              ...(framebuffer ? {framebuffer} : {}),
              ...(resolveTargets ? {resolveTargets} : {})
            });
            timestamp = getPassTimestamp(renderPass);
            renderPass.pushDebugGroup(node.id);
            try {
              renderExecutable.encode({...baseContext, renderPass});
            } finally {
              renderPass.popDebugGroup();
              renderPass.end();
            }
            break;
          }
          case 'copy':
            endActiveComputePass();
            (executable as GPUCommandGraphCopyExecutable<Parameters>).encode(baseContext);
            break;
        }
        encodedNodes.push({
          stats: {
            id: node.id,
            type: node.type,
            cpuEncodeTimeMilliseconds: getTimestampMilliseconds() - nodeStartTime,
            hasGPUTimestamps: timestamp !== undefined
          },
          timestamp
        });
      }
    } finally {
      endActiveComputePass();
    }
    return new GPUCommandGraphEncoding(
      encodedNodes,
      getTimestampMilliseconds() - encodingStartTime,
      computePassCount
    );
  }

  /**
   * Releases compiled node state, cached views and framebuffers, and graph-owned transients.
   *
   * Imported resources are borrowed and are never destroyed. Repeated calls are safe.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    for (const {executable} of this.compiledNodes) {
      executable.destroy?.();
    }
    for (const cached of this.cachedFramebuffers) {
      cached.framebuffer.destroy();
    }
    for (const cached of this.cachedTextureViews) {
      cached.view.destroy();
    }
    for (const allocation of this.bufferTransientAllocations) {
      allocation.buffer?.destroy();
    }
    for (const allocation of this.textureTransientAllocations) {
      allocation.texture?.destroy();
    }
    this.destroyed = true;
  }

  private resolveImportedBuffers(
    overrides: Record<string, GraphImportedBuffer>
  ): Map<GraphBufferHandle, Buffer> {
    const resolved = new Map<GraphBufferHandle, Buffer>();
    const activePhysicalBuffers = new Map<object, GraphBufferHandle>();
    for (const [id, handle] of this.buffers) {
      if (handle.transient) {
        continue;
      }
      const importedBuffer = overrides[id] ?? handle.defaultBuffer;
      if (!importedBuffer) {
        throw new Error(`GPUCommandGraph imported buffer "${id}" is required`);
      }
      validateImportedBuffer(importedBuffer, handle, this.device);
      const coreBuffer = getCoreBuffer(importedBuffer);
      if (this.activeImportedBufferHandles.has(handle)) {
        const physicalHandle = coreBuffer.handle;
        const physicalBuffer =
          (typeof physicalHandle === 'object' && physicalHandle !== null) ||
          typeof physicalHandle === 'function'
            ? physicalHandle
            : coreBuffer;
        const previousHandle = activePhysicalBuffers.get(physicalBuffer);
        if (
          previousHandle &&
          (this.writableImportedBufferHandles.has(previousHandle) ||
            this.writableImportedBufferHandles.has(handle))
        ) {
          throw new Error(
            `GPUCommandGraph imported buffers "${previousHandle.id}" and "${id}" resolve to the same physical buffer`
          );
        }
        if (!previousHandle) {
          activePhysicalBuffers.set(physicalBuffer, handle);
        }
      }
      resolved.set(handle, coreBuffer);
    }
    for (const id of Object.keys(overrides)) {
      const handle = this.buffers.get(id);
      if (!handle || handle.transient) {
        throw new Error(`GPUCommandGraph has no imported buffer named "${id}"`);
      }
    }
    return resolved;
  }

  private resolveImportedTextures(
    overrides: Record<string, GraphImportedTexture>,
    frameBindings: Record<string, GraphFrameTextureBinding>
  ): {
    textures: Map<GraphTextureHandle, Texture>;
    frameIds: Map<GraphTextureHandle, number>;
  } {
    const resolved = new Map<GraphTextureHandle, Texture>();
    const nextFrameIds = new Map<GraphTextureHandle, number>();
    for (const [id, handle] of this.textures) {
      if (handle.transient) {
        continue;
      }
      if (handle.frameScoped) {
        const binding = frameBindings[id];
        if (!binding) {
          throw new Error(`GPUCommandGraph frame texture "${id}" is required`);
        }
        const lastFrameId = this.lastFrameIds.get(handle);
        if (lastFrameId !== undefined && binding.frameId <= lastFrameId) {
          throw new Error(
            `GPUCommandGraph frame texture "${id}" frameId ${binding.frameId} is stale; expected greater than ${lastFrameId}`
          );
        }
        validateImportedTexture(binding.texture, handle, this.device);
        resolved.set(handle, getCoreTexture(binding.texture));
        nextFrameIds.set(handle, binding.frameId);
        continue;
      }
      const importedTexture = overrides[id] ?? handle.defaultTexture;
      if (!importedTexture) {
        throw new Error(`GPUCommandGraph imported texture "${id}" is required`);
      }
      validateImportedTexture(importedTexture, handle, this.device);
      resolved.set(handle, getCoreTexture(importedTexture));
    }
    for (const id of Object.keys(overrides)) {
      const handle = this.textures.get(id);
      if (!handle || handle.transient || handle.frameScoped) {
        throw new Error(`GPUCommandGraph has no imported texture named "${id}"`);
      }
    }
    for (const id of Object.keys(frameBindings)) {
      const handle = this.textures.get(id);
      if (!handle?.frameScoped) {
        throw new Error(`GPUCommandGraph has no frame texture named "${id}"`);
      }
    }
    const activePhysicalTextures = new Map<object, GraphTextureHandle>();
    for (const [handle, texture] of resolved) {
      if (!this.activeImportedTextureHandles.has(handle)) {
        continue;
      }
      const physicalHandle = texture.handle;
      const physicalTexture =
        (typeof physicalHandle === 'object' && physicalHandle !== null) ||
        typeof physicalHandle === 'function'
          ? physicalHandle
          : texture;
      const previousHandle = activePhysicalTextures.get(physicalTexture);
      if (
        previousHandle &&
        (this.writableImportedTextureHandles.has(previousHandle) ||
          this.writableImportedTextureHandles.has(handle))
      ) {
        throw new Error(
          `GPUCommandGraph imported textures "${previousHandle.id}" and "${handle.id}" resolve to the same physical texture`
        );
      }
      if (!previousHandle) {
        activePhysicalTextures.set(physicalTexture, handle);
      }
    }
    return {textures: resolved, frameIds: nextFrameIds};
  }

  private resolveExternalTextures(bindings: Record<string, GraphExternalTextureBinding>): {
    textures: Map<GraphExternalTextureHandle, ExternalTexture>;
    frameIds: Map<GraphExternalTextureHandle, number>;
  } {
    const textures = new Map<GraphExternalTextureHandle, ExternalTexture>();
    const frameIds = new Map<GraphExternalTextureHandle, number>();
    for (const [id, handle] of this.externalTextures) {
      const binding = bindings[id];
      if (!binding) {
        throw new Error(`GPUCommandGraph external texture "${id}" is required`);
      }
      const lastFrameId = this.lastExternalTextureFrameIds.get(handle);
      if (lastFrameId !== undefined && binding.frameId <= lastFrameId) {
        throw new Error(
          `GPUCommandGraph external texture "${id}" frameId ${binding.frameId} is stale; expected greater than ${lastFrameId}`
        );
      }
      if (this.consumedExternalTextures.has(binding.texture)) {
        throw new Error(
          `GPUCommandGraph external texture "${id}" requires a fresh binding for each frame`
        );
      }
      validateImportedExternalTexture(binding.texture, handle, this.device);
      textures.set(handle, binding.texture);
      frameIds.set(handle, binding.frameId);
    }
    for (const id of Object.keys(bindings)) {
      if (!this.externalTextures.has(id)) {
        throw new Error(`GPUCommandGraph has no external texture named "${id}"`);
      }
    }
    return {textures, frameIds};
  }

  private getFramebuffer(
    nodeId: string,
    attachments: GraphRenderPassAttachments,
    getTextureView: (texture: GraphTextureView) => TextureView
  ): Framebuffer {
    const colorAttachments = attachments.colorAttachments.map(getTextureView);
    const depthStencilAttachment = attachments.depthStencilAttachment
      ? getTextureView(attachments.depthStencilAttachment)
      : undefined;
    const cached = this.cachedFramebuffers.find(
      entry =>
        entry.nodeId === nodeId &&
        entry.depthStencilAttachment === depthStencilAttachment &&
        entry.colorAttachments.length === colorAttachments.length &&
        entry.colorAttachments.every((view, index) => view === colorAttachments[index])
    );
    if (cached) {
      return cached.framebuffer;
    }
    const firstLogicalAttachment =
      attachments.colorAttachments[0] ?? attachments.depthStencilAttachment!;
    const framebuffer = this.device.createFramebuffer({
      id: `${this.id}-${nodeId}-framebuffer-${this.cachedFramebuffers.length}`,
      width: firstLogicalAttachment.width,
      height: firstLogicalAttachment.height,
      colorAttachments,
      depthStencilAttachment: depthStencilAttachment ?? null
    });
    this.cachedFramebuffers.push({
      nodeId,
      colorAttachments,
      depthStencilAttachment,
      framebuffer
    });
    return framebuffer;
  }

  private destroyFramebuffersUsingView(view: TextureView): void {
    for (let index = this.cachedFramebuffers.length - 1; index >= 0; index--) {
      const cached = this.cachedFramebuffers[index];
      if (
        cached.depthStencilAttachment === view ||
        cached.colorAttachments.some(attachment => attachment === view)
      ) {
        cached.framebuffer.destroy();
        this.cachedFramebuffers.splice(index, 1);
      }
    }
  }
}

/** Unwraps a dynamic import to the concrete buffer used for validation and encoding. */
function getCoreBuffer(buffer: GraphImportedBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

/** Unwraps a ready dynamic import to the concrete texture used for validation and encoding. */
function getCoreTexture(texture: GraphImportedTexture): Texture {
  if (texture instanceof DynamicTexture) {
    if (!texture.isReady) {
      throw new Error(`GPUCommandGraph dynamic texture "${texture.id}" is not ready`);
    }
    return texture.texture;
  }
  return texture;
}

/** Ensures all ephemeral image imports belong to one explicit application frame. */
function validateEncodingFrameId(
  frameTextures: Record<string, GraphFrameTextureBinding>,
  externalTextures: Record<string, GraphExternalTextureBinding>
): void {
  let encodingFrameId: number | undefined;
  for (const [id, binding] of [
    ...Object.entries(frameTextures),
    ...Object.entries(externalTextures)
  ]) {
    if (!Number.isSafeInteger(binding.frameId) || binding.frameId < 0) {
      throw new Error(`GPUCommandGraph frame resource "${id}" requires a valid frameId`);
    }
    if (encodingFrameId !== undefined && binding.frameId !== encodingFrameId) {
      throw new Error('GPUCommandGraph frame resources must share one frameId per encoding');
    }
    encodingFrameId = binding.frameId;
  }
}

/** Returns a portable timestamp pair recorded by one render or compute pass. */
function getPassTimestamp(
  pass: ComputePass | RenderPass
): GPUCommandGraphNodeTimestamp | undefined {
  const {timestampQuerySet, beginTimestampIndex, endTimestampIndex} = pass.props;
  return timestampQuerySet &&
    Number.isSafeInteger(beginTimestampIndex) &&
    Number.isSafeInteger(endTimestampIndex) &&
    beginTimestampIndex >= 0 &&
    endTimestampIndex > beginTimestampIndex
    ? {querySet: timestampQuerySet, beginIndex: beginTimestampIndex, endIndex: endTimestampIndex}
    : undefined;
}

/** Captures graph-relevant adapter limits without requiring backend-specific handles. */
function getGPUCommandGraphCapabilities(device: Device): GPUCommandGraphCapabilities {
  return Object.freeze({
    timestampQueries: device.features.has('timestamp-query'),
    subgroups: device.features.has('subgroups'),
    subgroupId: device.wgslLanguageFeatures.has('subgroup_id'),
    subgroupMinSize: device.info.subgroupMinSize,
    subgroupMaxSize: device.info.subgroupMaxSize,
    softwareAdapter:
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback),
    maxBufferByteLength: device.limits.maxBufferSize,
    maxStorageBufferBindingByteLength: device.limits.maxStorageBufferBindingSize,
    maxComputeInvocationsPerWorkgroup: device.limits.maxComputeInvocationsPerWorkgroup,
    maxComputeWorkgroupsPerDimension: device.limits.maxComputeWorkgroupsPerDimension
  });
}

/** Rejects graph work after a WebGPU device has been lost. */
function assertDeviceAvailable(device: Device, operation: string): void {
  if (device.isLost) {
    throw new Error(`GPUCommandGraph cannot perform ${operation} after device loss`);
  }
}

/** Returns a monotonic timestamp for synchronous CPU encoding diagnostics. */
function getTimestampMilliseconds(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** Validates graph identity, capacity, and usage fields for a logical buffer. */
function validateGraphBufferDescriptor(descriptor: GraphBufferDescriptor, device: Device): void {
  if (!descriptor.id) {
    throw new Error('GPUCommandGraph buffer id is required');
  }
  if (!Number.isSafeInteger(descriptor.byteLength) || descriptor.byteLength < 0) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" requires a valid byteLength`);
  }
  if (descriptor.byteLength > device.limits.maxBufferSize) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" exceeds the device buffer limit`);
  }
  if (!Number.isSafeInteger(descriptor.usage) || descriptor.usage <= 0) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" requires buffer usage flags`);
  }
}

/** Validates the stable metadata used to check successive external-image snapshots. */
function validateGraphExternalTextureDescriptor(
  descriptor: GraphExternalTextureDescriptor,
  device: Device
): void {
  if (!descriptor.id) {
    throw new Error('GPUCommandGraph external texture id is required');
  }
  for (const [name, value] of Object.entries({
    width: descriptor.width,
    height: descriptor.height
  })) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(
        `GPUCommandGraph external texture "${descriptor.id}" ${name} must be a positive safe integer`
      );
    }
  }
  if (
    descriptor.width > device.limits.maxTextureDimension2D ||
    descriptor.height > device.limits.maxTextureDimension2D
  ) {
    throw new Error(
      `GPUCommandGraph external texture "${descriptor.id}" exceeds device dimension limits`
    );
  }
}

/** Applies texture defaults and validates limits and dimension-specific invariants. */
function normalizeGraphTextureDescriptor<Format extends TextureFormat>(
  descriptor: GraphTextureDescriptor<Format>,
  device: Device
): NormalizedGraphTextureDescriptor<Format> {
  if (!descriptor.id) {
    throw new Error('GPUCommandGraph texture id is required');
  }
  const dimension = descriptor.dimension ?? '2d';
  const depth = dimension === 'cube' ? 6 : (descriptor.depth ?? 1);
  const mipLevels = descriptor.mipLevels ?? 1;
  const samples = descriptor.samples ?? 1;
  for (const [name, value] of Object.entries({
    width: descriptor.width,
    height: descriptor.height,
    depth,
    mipLevels,
    samples
  })) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(
        `GPUCommandGraph texture "${descriptor.id}" ${name} must be a positive safe integer`
      );
    }
  }
  if (!Number.isSafeInteger(descriptor.usage) || descriptor.usage <= 0) {
    throw new Error(`GPUCommandGraph texture "${descriptor.id}" requires texture usage flags`);
  }
  if (!device.isTextureFormatSupported(descriptor.format)) {
    throw new Error(
      `GPUCommandGraph texture "${descriptor.id}" format ${descriptor.format} is unsupported`
    );
  }
  if (dimension === '1d' && (descriptor.height !== 1 || depth !== 1)) {
    throw new Error(`GPUCommandGraph 1d texture "${descriptor.id}" requires height and depth 1`);
  }
  if (dimension === 'cube' && descriptor.width !== descriptor.height) {
    throw new Error(`GPUCommandGraph cube texture "${descriptor.id}" must be square`);
  }
  if (dimension === 'cube-array' && (descriptor.width !== descriptor.height || depth % 6 !== 0)) {
    throw new Error(
      `GPUCommandGraph cube-array texture "${descriptor.id}" must be square with depth divisible by 6`
    );
  }
  if (mipLevels > device.getMipLevelCount(descriptor.width, descriptor.height, depth)) {
    throw new Error(`GPUCommandGraph texture "${descriptor.id}" declares too many mip levels`);
  }
  const maximumWidth =
    dimension === '1d'
      ? device.limits.maxTextureDimension1D
      : dimension === '3d'
        ? device.limits.maxTextureDimension3D
        : device.limits.maxTextureDimension2D;
  const maximumHeight =
    dimension === '3d' ? device.limits.maxTextureDimension3D : device.limits.maxTextureDimension2D;
  const maximumDepth =
    dimension === '3d' ? device.limits.maxTextureDimension3D : device.limits.maxTextureArrayLayers;
  if (
    descriptor.width > maximumWidth ||
    descriptor.height > maximumHeight ||
    depth > maximumDepth
  ) {
    throw new Error(`GPUCommandGraph texture "${descriptor.id}" exceeds device dimension limits`);
  }
  return {
    id: descriptor.id,
    format: descriptor.format,
    width: descriptor.width,
    height: descriptor.height,
    usage: descriptor.usage,
    dimension,
    depth,
    mipLevels,
    samples
  };
}

/** Applies view defaults, validates subresource bounds, and computes the selected extent. */
function normalizeGraphTextureView<Format extends TextureFormat>(
  texture: GraphTextureHandle<Format>,
  props: GraphTextureViewProps
): Required<GraphTextureViewProps> & {width: number; height: number; depth: number} {
  const dimension = props.dimension ?? texture.dimension;
  const aspect = props.aspect ?? 'all';
  const baseMipLevel = props.baseMipLevel ?? 0;
  const mipLevelCount = props.mipLevelCount ?? texture.mipLevels - baseMipLevel;
  const baseArrayLayer = props.baseArrayLayer ?? 0;
  const maximumArrayLayerCount = texture.dimension === '3d' ? 1 : texture.depth;
  const arrayLayerCount = props.arrayLayerCount ?? maximumArrayLayerCount - baseArrayLayer;
  for (const [name, value] of Object.entries({
    baseMipLevel,
    mipLevelCount,
    baseArrayLayer,
    arrayLayerCount
  })) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Graph texture view ${name} must be a non-negative safe integer`);
    }
  }
  if (mipLevelCount === 0 || baseMipLevel + mipLevelCount > texture.mipLevels) {
    throw new Error(`Graph texture view exceeds texture "${texture.id}" mip levels`);
  }
  if (
    arrayLayerCount === 0 ||
    baseArrayLayer + arrayLayerCount > maximumArrayLayerCount ||
    (texture.dimension === '3d' && (baseArrayLayer !== 0 || arrayLayerCount !== 1))
  ) {
    throw new Error(`Graph texture view exceeds texture "${texture.id}" array layers`);
  }
  const width = Math.max(1, texture.width >> baseMipLevel);
  const height = texture.dimension === '1d' ? 1 : Math.max(1, texture.height >> baseMipLevel);
  const depth =
    texture.dimension === '3d' ? Math.max(1, texture.depth >> baseMipLevel) : arrayLayerCount;
  return {
    dimension,
    aspect,
    baseMipLevel,
    mipLevelCount,
    baseArrayLayer,
    arrayLayerCount,
    width,
    height,
    depth
  };
}

/** Validates a strided logical range against its buffer capacity. */
function validateGraphDataView(
  buffer: GraphBufferHandle,
  props: {length: number; byteOffset: number; byteStride: number; rowByteLength: number}
): void {
  for (const [name, value] of Object.entries(props)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Graph data view ${name} must be a non-negative safe integer`);
    }
  }
  if (props.length > 1 && props.byteStride === 0) {
    throw new Error('Graph data view byteStride must be positive for multiple rows');
  }
  if (props.rowByteLength > props.byteStride && props.length > 1) {
    throw new Error('Graph data view rowByteLength cannot exceed byteStride');
  }
  const byteLength =
    props.length === 0 ? 0 : (props.length - 1) * props.byteStride + props.rowByteLength;
  const endByteOffset = props.byteOffset + byteLength;
  if (!Number.isSafeInteger(byteLength) || !Number.isSafeInteger(endByteOffset)) {
    throw new Error('Graph data view byte range exceeds safe integer precision');
  }
  if (endByteOffset > buffer.byteLength) {
    throw new Error(`Graph data view exceeds buffer "${buffer.id}" byte length`);
  }
}

/** Validates an imported buffer's device, capacity, and usage against its logical descriptor. */
function validateImportedBuffer(
  importedBuffer: GraphImportedBuffer,
  descriptor: Pick<GraphBufferDescriptor, 'id' | 'byteLength' | 'usage'>,
  device: Device
): void {
  const buffer = getCoreBuffer(importedBuffer);
  if (buffer.device !== device) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" belongs to another device`);
  }
  if (buffer.byteLength < descriptor.byteLength) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" is smaller than compiled capacity`);
  }
  if ((buffer.usage & descriptor.usage) !== descriptor.usage) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" has incompatible usage flags`);
  }
}

/** Validates an imported texture's exact shape and format plus required usage flags. */
function validateImportedTexture(
  importedTexture: GraphImportedTexture,
  descriptor: NormalizedGraphTextureDescriptor,
  device: Device
): void {
  const texture = getCoreTexture(importedTexture);
  if (texture.device !== device) {
    throw new Error(`GPUCommandGraph texture "${descriptor.id}" belongs to another device`);
  }
  for (const [name, expected, actual] of [
    ['format', descriptor.format, texture.format],
    ['dimension', descriptor.dimension, texture.dimension],
    ['width', descriptor.width, texture.width],
    ['height', descriptor.height, texture.height],
    ['depth', descriptor.depth, texture.depth],
    ['mipLevels', descriptor.mipLevels, texture.mipLevels],
    ['samples', descriptor.samples, texture.samples]
  ] as const) {
    if (actual !== expected) {
      throw new Error(
        `GPUCommandGraph texture "${descriptor.id}" has incompatible ${name} (${actual} !== ${expected})`
      );
    }
  }
  if ((texture.props.usage & descriptor.usage) !== descriptor.usage) {
    throw new Error(`GPUCommandGraph texture "${descriptor.id}" has incompatible usage flags`);
  }
}

/** Validates one opaque, sampled-only external-image snapshot. */
function validateImportedExternalTexture(
  texture: ExternalTexture,
  descriptor: GraphExternalTextureHandle,
  device: Device
): void {
  if (texture.device !== device) {
    throw new Error(
      `GPUCommandGraph external texture "${descriptor.id}" belongs to another device`
    );
  }
  if (texture.destroyed) {
    throw new Error(`GPUCommandGraph external texture "${descriptor.id}" has been destroyed`);
  }
  if (texture.width !== descriptor.width || texture.height !== descriptor.height) {
    throw new Error(
      `GPUCommandGraph external texture "${descriptor.id}" has incompatible dimensions (${texture.width}x${texture.height} !== ${descriptor.width}x${descriptor.height})`
    );
  }
}

/** Checks that a logical buffer descriptor permits a node's declared access mode. */
function validateBufferUseAgainstDescriptor(
  buffer: GraphBufferHandle,
  usage: GraphBufferUsage
): void {
  const requiredUsage = getRequiredBufferUsage(usage);
  if ((buffer.usage & requiredUsage) !== requiredUsage) {
    throw new Error(
      `GPUCommandGraph buffer "${buffer.id}" does not declare usage required by ${usage}`
    );
  }
}

/** Checks that a logical texture descriptor permits a node's declared access mode. */
function validateTextureUseAgainstDescriptor(
  texture: GraphTextureHandle,
  usage: GraphTextureUsage
): void {
  const requiredUsage = getRequiredTextureUsage(usage);
  if ((texture.usage & requiredUsage) !== requiredUsage) {
    throw new Error(
      `GPUCommandGraph texture "${texture.id}" does not declare usage required by ${usage}`
    );
  }
}

/** Validates view restrictions imposed by the declared texture access mode. */
function validateTextureViewForUsage(
  textureOrView: GraphTextureHandle | GraphTextureView,
  usage: GraphTextureUsage
): void {
  if (
    textureOrView instanceof GraphTextureView &&
    usage.startsWith('storage-') &&
    textureOrView.mipLevelCount !== 1
  ) {
    throw new Error('GPUCommandGraph storage texture views must contain exactly one mip level');
  }
}

/** Maps a graph access mode to its required luma.gl buffer usage flag. */
function getRequiredBufferUsage(usage: GraphBufferUsage): number {
  switch (usage) {
    case 'storage-read':
    case 'storage-write':
    case 'storage-read-write':
      return Buffer.STORAGE;
    case 'uniform':
      return Buffer.UNIFORM;
    case 'copy-source':
      return Buffer.COPY_SRC;
    case 'copy-destination':
      return Buffer.COPY_DST;
    case 'indirect':
      return Buffer.INDIRECT;
    case 'vertex':
      return Buffer.VERTEX;
    case 'index':
      return Buffer.INDEX;
  }
}

/** Maps a graph access mode to its required luma.gl texture usage flag. */
function getRequiredTextureUsage(usage: GraphTextureUsage): number {
  switch (usage) {
    case 'sampled':
      return Texture.SAMPLE;
    case 'storage-read':
    case 'storage-write':
    case 'storage-read-write':
      return Texture.STORAGE;
    case 'render-attachment':
      return Texture.RENDER;
    case 'copy-source':
      return Texture.COPY_SRC;
    case 'copy-destination':
      return Texture.COPY_DST;
  }
}

/** Returns whether a logical view is exactly the texture's default full-resource view. */
function isDefaultGraphTextureView(view: GraphTextureView): boolean {
  const texture = view.texture;
  return (
    view.dimension === texture.dimension &&
    view.aspect === 'all' &&
    view.baseMipLevel === 0 &&
    view.mipLevelCount === texture.mipLevels &&
    view.baseArrayLayer === 0 &&
    view.arrayLayerCount === (texture.dimension === '3d' ? 1 : texture.depth)
  );
}
