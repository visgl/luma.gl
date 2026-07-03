// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture, textureFormatDecoder} from '@luma.gl/core';
import type {
  CommandEncoder,
  ComputePass,
  Device,
  Framebuffer,
  RenderPass,
  RenderPassProps,
  TextureFormat,
  TextureView
} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import {
  GPUData,
  type GPUVector,
  type GPUVectorFormat,
  getGPUVectorFormatInfo
} from '@luma.gl/tables';

/** GPU buffer use declared by one graph node. */
export type GraphBufferUsage =
  | 'storage-read'
  | 'storage-write'
  | 'storage-read-write'
  | 'uniform'
  | 'copy-source'
  | 'copy-destination'
  | 'indirect'
  | 'vertex'
  | 'index';

/** GPU texture use declared by one graph node. */
export type GraphTextureUsage =
  | 'sampled'
  | 'storage-read'
  | 'storage-write'
  | 'storage-read-write'
  | 'render-attachment'
  | 'copy-source'
  | 'copy-destination';

/** Buffer accepted as a fixed or per-encoding graph import. */
export type GraphImportedBuffer = Buffer | DynamicBuffer;

/** Texture accepted as a fixed or per-encoding graph import. */
export type GraphImportedTexture = Texture | DynamicTexture;

/** Descriptor for one imported or transient graph buffer. */
export type GraphBufferDescriptor = {
  id: string;
  byteLength: number;
  usage: number;
};

export type GraphTextureDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
export type GraphTextureAspect = 'all' | 'stencil-only' | 'depth-only';

/** Descriptor for one fixed-size imported or transient graph texture. */
export type GraphTextureDescriptor<Format extends TextureFormat = TextureFormat> = {
  id: string;
  format: Format;
  width: number;
  height: number;
  usage: number;
  dimension?: GraphTextureDimension;
  depth?: number;
  mipLevels?: number;
  samples?: number;
};

type NormalizedGraphTextureDescriptor<Format extends TextureFormat = TextureFormat> = {
  id: string;
  format: Format;
  width: number;
  height: number;
  usage: number;
  dimension: GraphTextureDimension;
  depth: number;
  mipLevels: number;
  samples: number;
};

/** Opaque logical buffer tracked by a {@link GPUCommandGraph}. */
export class GraphBufferHandle {
  readonly id: string;
  readonly byteLength: number;
  readonly usage: number;
  readonly transient: boolean;
  /** @internal */
  readonly graph: GPUCommandGraph<any>;
  /** @internal */
  readonly defaultBuffer?: GraphImportedBuffer;

  /** @internal */
  constructor(
    graph: GPUCommandGraph<any>,
    descriptor: GraphBufferDescriptor,
    transient: boolean,
    defaultBuffer?: GraphImportedBuffer
  ) {
    this.graph = graph;
    this.id = descriptor.id;
    this.byteLength = descriptor.byteLength;
    this.usage = descriptor.usage;
    this.transient = transient;
    this.defaultBuffer = defaultBuffer;
  }
}

/** Typed logical range within one graph buffer. */
export class GraphDataView<T extends GPUVectorFormat = GPUVectorFormat> {
  readonly buffer: GraphBufferHandle;
  readonly format: T;
  readonly length: number;
  readonly byteOffset: number;
  readonly byteStride: number;
  readonly rowByteLength: number;

  /** @internal */
  constructor(
    buffer: GraphBufferHandle,
    props: {
      format: T;
      length: number;
      byteOffset: number;
      byteStride: number;
      rowByteLength: number;
    }
  ) {
    this.buffer = buffer;
    this.format = props.format;
    this.length = props.length;
    this.byteOffset = props.byteOffset;
    this.byteStride = props.byteStride;
    this.rowByteLength = props.rowByteLength;
  }
}

/** Opaque logical texture tracked by a {@link GPUCommandGraph}. */
export class GraphTextureHandle<Format extends TextureFormat = TextureFormat> {
  readonly id: string;
  readonly format: Format;
  readonly width: number;
  readonly height: number;
  readonly usage: number;
  readonly dimension: GraphTextureDimension;
  readonly depth: number;
  readonly mipLevels: number;
  readonly samples: number;
  readonly transient: boolean;
  /** @internal */
  readonly graph: GPUCommandGraph<any>;
  /** @internal */
  readonly defaultTexture?: GraphImportedTexture;

  /** @internal */
  constructor(
    graph: GPUCommandGraph<any>,
    descriptor: NormalizedGraphTextureDescriptor<Format>,
    transient: boolean,
    defaultTexture?: GraphImportedTexture
  ) {
    this.graph = graph;
    this.id = descriptor.id;
    this.format = descriptor.format;
    this.width = descriptor.width;
    this.height = descriptor.height;
    this.usage = descriptor.usage;
    this.dimension = descriptor.dimension;
    this.depth = descriptor.depth;
    this.mipLevels = descriptor.mipLevels;
    this.samples = descriptor.samples;
    this.transient = transient;
    this.defaultTexture = defaultTexture;
  }
}

export type GraphTextureViewProps = {
  dimension?: GraphTextureDimension;
  aspect?: GraphTextureAspect;
  baseMipLevel?: number;
  mipLevelCount?: number;
  baseArrayLayer?: number;
  arrayLayerCount?: number;
};

/** Logical mip, layer, and aspect range within one graph texture. */
export class GraphTextureView<Format extends TextureFormat = TextureFormat> {
  readonly texture: GraphTextureHandle<Format>;
  readonly format: Format;
  readonly dimension: GraphTextureDimension;
  readonly aspect: GraphTextureAspect;
  readonly baseMipLevel: number;
  readonly mipLevelCount: number;
  readonly baseArrayLayer: number;
  readonly arrayLayerCount: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;

  /** @internal */
  constructor(
    texture: GraphTextureHandle<Format>,
    props: Required<GraphTextureViewProps> & {width: number; height: number; depth: number}
  ) {
    this.texture = texture;
    this.format = texture.format;
    this.dimension = props.dimension;
    this.aspect = props.aspect;
    this.baseMipLevel = props.baseMipLevel;
    this.mipLevelCount = props.mipLevelCount;
    this.baseArrayLayer = props.baseArrayLayer;
    this.arrayLayerCount = props.arrayLayerCount;
    this.width = props.width;
    this.height = props.height;
    this.depth = props.depth;
  }
}

/** One buffer use declared by a graph node. */
export type GraphBufferUse = {
  buffer: GraphBufferHandle | GraphDataView;
  usage: GraphBufferUsage;
};

/** One texture or texture-view use declared by a graph node. */
export type GraphTextureUse = {
  texture: GraphTextureHandle | GraphTextureView;
  usage: GraphTextureUsage;
};

/** One resource use declared by a graph node. */
export type GraphResourceUse = GraphBufferUse | GraphTextureUse;

/** Graph-owned texture attachments resolved into a framebuffer for a render node. */
export type GraphRenderPassAttachments = {
  colorAttachments: GraphTextureView[];
  depthStencilAttachment?: GraphTextureView;
};

/** Context available while compiling one graph node. */
export type GPUCommandGraphCompileContext = {
  device: Device;
};

/** Context shared by every executable graph node. */
export type GPUCommandGraphEncodeContext<Parameters> = {
  commandEncoder: CommandEncoder;
  parameters: Parameters;
  getBuffer: (buffer: GraphBufferHandle | GraphDataView) => Buffer;
  getTexture: (texture: GraphTextureHandle | GraphTextureView) => Texture;
  getTextureView: (texture: GraphTextureHandle | GraphTextureView) => TextureView;
};

/** Compiled compute-pass callback. */
export type GPUCommandGraphComputeExecutable<Parameters> = {
  encode: (context: GPUCommandGraphEncodeContext<Parameters> & {computePass: ComputePass}) => void;
  destroy?: () => void;
};

/** Compiled render-pass callback. */
export type GPUCommandGraphRenderExecutable<Parameters> = {
  getRenderPassProps?: (context: GPUCommandGraphEncodeContext<Parameters>) => RenderPassProps;
  encode: (context: GPUCommandGraphEncodeContext<Parameters> & {renderPass: RenderPass}) => void;
  destroy?: () => void;
};

/** Compiled command-encoder callback used for copies and other pass-independent commands. */
export type GPUCommandGraphCopyExecutable<Parameters> = {
  encode: (context: GPUCommandGraphEncodeContext<Parameters>) => void;
  destroy?: () => void;
};

type GPUCommandGraphNodeBase = {
  id: string;
  resources?: GraphResourceUse[];
  dependsOn?: string[];
};

export type GPUCommandGraphComputeNode<Parameters> = GPUCommandGraphNodeBase & {
  type: 'compute';
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphComputeExecutable<Parameters>;
};

export type GPUCommandGraphRenderNode<Parameters> = GPUCommandGraphNodeBase & {
  type: 'render';
  attachments?: GraphRenderPassAttachments;
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphRenderExecutable<Parameters>;
};

export type GPUCommandGraphCopyNode<Parameters> = GPUCommandGraphNodeBase & {
  type: 'copy';
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphCopyExecutable<Parameters>;
};

export type GPUCommandGraphNode<Parameters> =
  | GPUCommandGraphComputeNode<Parameters>
  | GPUCommandGraphRenderNode<Parameters>
  | GPUCommandGraphCopyNode<Parameters>;

/** Resource-allocation and scheduling statistics for one compiled graph. */
export type GPUCommandGraphStats = {
  nodeOrder: string[];
  logicalTransientBufferCount: number;
  physicalTransientBufferCount: number;
  logicalTransientBytes: number;
  physicalTransientBytes: number;
  reusedTransientBytes: number;
  reusePercentage: number;
  logicalTransientTextureCount: number;
  physicalTransientTextureCount: number;
  logicalTransientTextureBytes: number;
  physicalTransientTextureBytes: number;
  reusedTransientTextureBytes: number;
  textureReusePercentage: number;
};

/** Options supplied while encoding one compiled graph. */
export type GPUCommandGraphEncodeOptions<Parameters> = {
  parameters: Parameters;
  buffers?: Record<string, GraphImportedBuffer>;
  textures?: Record<string, GraphImportedTexture>;
};

type CompiledNode<Parameters> = {
  node: GPUCommandGraphNode<Parameters>;
  executable:
    | GPUCommandGraphComputeExecutable<Parameters>
    | GPUCommandGraphRenderExecutable<Parameters>
    | GPUCommandGraphCopyExecutable<Parameters>;
};

type BufferTransientAllocation = {
  byteLength: number;
  usage: number;
  lastUse: number;
  handles: GraphBufferHandle[];
  buffer?: Buffer;
};

type TextureTransientAllocation = {
  descriptor: NormalizedGraphTextureDescriptor;
  byteLength: number;
  lastUse: number;
  handles: GraphTextureHandle[];
  texture?: Texture;
};

type CachedTextureView = {
  logicalView: GraphTextureView;
  texture: Texture;
  view: TextureView;
};

type CachedFramebuffer = {
  nodeId: string;
  colorAttachments: TextureView[];
  depthStencilAttachment?: TextureView;
  framebuffer: Framebuffer;
};

/**
 * Declarative WebGPU command graph with explicit resource access and ownership.
 *
 * The graph compiles resource hazards, transient lifetimes, and node resources,
 * but encoding and submission remain controlled by the application.
 */
export class GPUCommandGraph<Parameters = void> {
  readonly device: Device;
  readonly id: string;

  private readonly buffers = new Map<string, GraphBufferHandle>();
  private readonly textures = new Map<string, GraphTextureHandle>();
  private readonly nodes: GPUCommandGraphNode<Parameters>[] = [];
  private readonly nodeIds = new Set<string>();
  private compiled = false;

  constructor(device: Device, props: {id?: string} = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('GPUCommandGraph requires a WebGPU device');
    }
    this.device = device;
    this.id = props.id ?? 'gpu-command-graph';
  }

  /** Declares a caller-owned buffer that can be supplied now or for each encoding. */
  importBuffer(
    descriptor: GraphBufferDescriptor,
    defaultBuffer?: GraphImportedBuffer
  ): GraphBufferHandle {
    this.assertMutable();
    validateGraphBufferDescriptor(descriptor);
    if (defaultBuffer) {
      validateImportedBuffer(defaultBuffer, descriptor, this.device);
    }
    return this.addBuffer(new GraphBufferHandle(this, descriptor, false, defaultBuffer));
  }

  /** Declares one graph-owned scratch buffer. */
  createTransientBuffer(descriptor: GraphBufferDescriptor): GraphBufferHandle {
    this.assertMutable();
    validateGraphBufferDescriptor(descriptor);
    return this.addBuffer(new GraphBufferHandle(this, descriptor, true));
  }

  /** Creates one typed range over a graph buffer. */
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

  /** Imports one borrowed GPUData range and returns its typed graph view. */
  importGPUData<T extends GPUVectorFormat>(id: string, data: GPUData<T>): GraphDataView<T> {
    if (!data.format) {
      throw new Error(`GPUCommandGraph import "${id}" requires GPUData.format`);
    }
    const coreBuffer = getCoreBuffer(data.buffer);
    const handle = this.importBuffer(
      {id, byteLength: coreBuffer.byteLength, usage: coreBuffer.usage},
      data.buffer
    );
    return this.createDataView(handle, {
      format: data.format,
      length: data.length,
      byteOffset: data.byteOffset,
      byteStride: data.byteStride,
      rowByteLength: data.rowByteLength
    });
  }

  /** Imports one packed, single-chunk GPUVector. */
  importGPUVector<T extends GPUVectorFormat>(id: string, vector: GPUVector<T>): GraphDataView<T> {
    const [data, ...remainingData] = vector.data;
    if (!data || remainingData.length > 0) {
      throw new Error(`GPUCommandGraph import "${id}" requires exactly one GPUVector chunk`);
    }
    if (vector.bufferLayout) {
      throw new Error(`GPUCommandGraph import "${id}" does not accept interleaved GPUVector data`);
    }
    return this.importGPUData(id, data);
  }

  /** Declares a caller-owned fixed-size texture that can be supplied now or while encoding. */
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

  /** Declares one graph-owned fixed-size transient texture. */
  createTransientTexture<Format extends TextureFormat>(
    descriptor: GraphTextureDescriptor<Format>
  ): GraphTextureHandle<Format> {
    this.assertMutable();
    const normalizedDescriptor = normalizeGraphTextureDescriptor(descriptor, this.device);
    return this.addTexture(new GraphTextureHandle(this, normalizedDescriptor, true));
  }

  /** Creates one logical mip, layer, and aspect range over a graph texture. */
  createTextureView<Format extends TextureFormat>(
    texture: GraphTextureHandle<Format>,
    props: GraphTextureViewProps = {}
  ): GraphTextureView<Format> {
    this.assertTexture(texture);
    const normalizedProps = normalizeGraphTextureView(texture, props);
    return new GraphTextureView(texture, normalizedProps);
  }

  addComputePass(node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'compute'});
  }

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

  addCopyPass(node: Omit<GPUCommandGraphCopyNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'copy'});
  }

  /** Compiles scheduling, transient allocations, and executable node resources. */
  compile(): CompiledGPUCommandGraph<Parameters> {
    this.assertMutable();
    this.compiled = true;
    const nodeOrder = getNodeOrder(this.nodes);
    const bufferPlan = getBufferTransientAllocationPlan(nodeOrder, this.buffers.values());
    const texturePlan = getTextureTransientAllocationPlan(nodeOrder, this.textures.values());
    const transientBuffers = new Map<GraphBufferHandle, Buffer>();
    const transientTextures = new Map<GraphTextureHandle, Texture>();

    for (const allocation of bufferPlan) {
      allocation.buffer = this.device.createBuffer({
        id: `${this.id}-transient-buffer-${bufferPlan.indexOf(allocation)}`,
        byteLength: allocation.byteLength,
        usage: allocation.usage
      });
      for (const handle of allocation.handles) {
        transientBuffers.set(handle, allocation.buffer);
      }
    }
    for (const allocation of texturePlan) {
      allocation.texture = this.device.createTexture({
        ...allocation.descriptor,
        id: `${this.id}-transient-texture-${texturePlan.indexOf(allocation)}`
      });
      for (const handle of allocation.handles) {
        transientTextures.set(handle, allocation.texture);
      }
    }

    const compiledNodes: CompiledNode<Parameters>[] = [];
    try {
      for (const node of nodeOrder) {
        compiledNodes.push({node, executable: node.compile({device: this.device})});
      }
    } catch (error) {
      for (const compiledNode of compiledNodes) {
        compiledNode.executable.destroy?.();
      }
      for (const allocation of bufferPlan) {
        allocation.buffer?.destroy();
      }
      for (const allocation of texturePlan) {
        allocation.texture?.destroy();
      }
      throw error;
    }

    const logicalTransientBytes = Array.from(this.buffers.values())
      .filter(buffer => buffer.transient)
      .reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const physicalTransientBytes = bufferPlan.reduce(
      (sum, allocation) => sum + allocation.byteLength,
      0
    );
    const reusedTransientBytes = Math.max(0, logicalTransientBytes - physicalTransientBytes);
    const logicalTransientTextureBytes = Array.from(this.textures.values())
      .filter(texture => texture.transient)
      .reduce((sum, texture) => sum + getTextureByteLength(texture), 0);
    const physicalTransientTextureBytes = texturePlan.reduce(
      (sum, allocation) => sum + allocation.byteLength,
      0
    );
    const reusedTransientTextureBytes = Math.max(
      0,
      logicalTransientTextureBytes - physicalTransientTextureBytes
    );
    const stats: GPUCommandGraphStats = {
      nodeOrder: nodeOrder.map(node => node.id),
      logicalTransientBufferCount: Array.from(this.buffers.values()).filter(
        buffer => buffer.transient
      ).length,
      physicalTransientBufferCount: bufferPlan.length,
      logicalTransientBytes,
      physicalTransientBytes,
      reusedTransientBytes,
      reusePercentage:
        logicalTransientBytes > 0 ? (reusedTransientBytes / logicalTransientBytes) * 100 : 0,
      logicalTransientTextureCount: Array.from(this.textures.values()).filter(
        texture => texture.transient
      ).length,
      physicalTransientTextureCount: texturePlan.length,
      logicalTransientTextureBytes,
      physicalTransientTextureBytes,
      reusedTransientTextureBytes,
      textureReusePercentage:
        logicalTransientTextureBytes > 0
          ? (reusedTransientTextureBytes / logicalTransientTextureBytes) * 100
          : 0
    };

    return new CompiledGPUCommandGraph({
      device: this.device,
      id: this.id,
      buffers: new Map(this.buffers),
      textures: new Map(this.textures),
      compiledNodes,
      transientBuffers,
      transientTextures,
      bufferTransientAllocations: bufferPlan,
      textureTransientAllocations: texturePlan,
      stats
    });
  }

  private addNode(node: GPUCommandGraphNode<Parameters>): void {
    this.assertMutable();
    if (!node.id) {
      throw new Error('GPUCommandGraph node id is required');
    }
    if (this.nodeIds.has(node.id)) {
      throw new Error(`GPUCommandGraph node id "${node.id}" is already in use`);
    }
    for (const resource of node.resources ?? []) {
      if (isGraphBufferUse(resource)) {
        const buffer = getBufferHandle(resource.buffer);
        this.assertBuffer(buffer);
        validateBufferUseAgainstDescriptor(buffer, resource.usage);
      } else {
        const texture = getTextureHandle(resource.texture);
        this.assertTexture(texture);
        validateTextureUseAgainstDescriptor(texture, resource.usage);
        validateTextureViewForUsage(resource.texture, resource.usage);
      }
    }
    this.nodeIds.add(node.id);
    this.nodes.push(node);
  }

  private addBuffer(buffer: GraphBufferHandle): GraphBufferHandle {
    if (this.buffers.has(buffer.id) || this.textures.has(buffer.id)) {
      throw new Error(`GPUCommandGraph resource id "${buffer.id}" is already in use`);
    }
    this.buffers.set(buffer.id, buffer);
    return buffer;
  }

  private addTexture<Format extends TextureFormat>(
    texture: GraphTextureHandle<Format>
  ): GraphTextureHandle<Format> {
    if (this.buffers.has(texture.id) || this.textures.has(texture.id)) {
      throw new Error(`GPUCommandGraph resource id "${texture.id}" is already in use`);
    }
    this.textures.set(texture.id, texture);
    return texture;
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
  }
}

/** Executable, fixed-capacity command graph. */
export class CompiledGPUCommandGraph<Parameters = void> {
  readonly device: Device;
  readonly id: string;
  readonly stats: GPUCommandGraphStats;

  private readonly buffers: Map<string, GraphBufferHandle>;
  private readonly textures: Map<string, GraphTextureHandle>;
  private readonly compiledNodes: CompiledNode<Parameters>[];
  private readonly transientBuffers: Map<GraphBufferHandle, Buffer>;
  private readonly transientTextures: Map<GraphTextureHandle, Texture>;
  private readonly bufferTransientAllocations: BufferTransientAllocation[];
  private readonly textureTransientAllocations: TextureTransientAllocation[];
  private readonly cachedTextureViews: CachedTextureView[] = [];
  private readonly cachedFramebuffers: CachedFramebuffer[] = [];
  private destroyed = false;

  /** @internal */
  constructor(props: {
    device: Device;
    id: string;
    buffers: Map<string, GraphBufferHandle>;
    textures: Map<string, GraphTextureHandle>;
    compiledNodes: CompiledNode<Parameters>[];
    transientBuffers: Map<GraphBufferHandle, Buffer>;
    transientTextures: Map<GraphTextureHandle, Texture>;
    bufferTransientAllocations: BufferTransientAllocation[];
    textureTransientAllocations: TextureTransientAllocation[];
    stats: GPUCommandGraphStats;
  }) {
    this.device = props.device;
    this.id = props.id;
    this.buffers = props.buffers;
    this.textures = props.textures;
    this.compiledNodes = props.compiledNodes;
    this.transientBuffers = props.transientBuffers;
    this.transientTextures = props.transientTextures;
    this.bufferTransientAllocations = props.bufferTransientAllocations;
    this.textureTransientAllocations = props.textureTransientAllocations;
    this.stats = props.stats;
  }

  /** Records every graph node into a caller-owned command encoder. */
  encode(commandEncoder: CommandEncoder, options: GPUCommandGraphEncodeOptions<Parameters>): void {
    if (this.destroyed) {
      throw new Error(`CompiledGPUCommandGraph "${this.id}" has been destroyed`);
    }
    if (commandEncoder.device !== this.device) {
      throw new Error('GPUCommandGraph command encoder must belong to the graph device');
    }

    const importedBuffers = this.resolveImportedBuffers(options.buffers ?? {});
    const importedTextures = this.resolveImportedTextures(options.textures ?? {});
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
      const cached = this.cachedTextureViews.find(
        entry => entry.logicalView === textureOrView && entry.texture === texture
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
      this.cachedTextureViews.push({logicalView: textureOrView, texture, view});
      return view;
    };

    const baseContext: GPUCommandGraphEncodeContext<Parameters> = {
      commandEncoder,
      parameters: options.parameters,
      getBuffer,
      getTexture,
      getTextureView
    };

    for (const {node, executable} of this.compiledNodes) {
      switch (node.type) {
        case 'compute': {
          const computePass = commandEncoder.beginComputePass({id: node.id});
          computePass.pushDebugGroup(node.id);
          try {
            (executable as GPUCommandGraphComputeExecutable<Parameters>).encode({
              ...baseContext,
              computePass
            });
          } finally {
            computePass.popDebugGroup();
            computePass.end();
          }
          break;
        }
        case 'render': {
          const renderExecutable = executable as GPUCommandGraphRenderExecutable<Parameters>;
          const renderPassProps = renderExecutable.getRenderPassProps?.(baseContext) ?? {
            id: node.id
          };
          if (node.attachments && renderPassProps.framebuffer !== undefined) {
            throw new Error(
              `GPUCommandGraph render node "${node.id}" cannot supply framebuffer with graph attachments`
            );
          }
          const framebuffer = node.attachments
            ? this.getFramebuffer(node.id, node.attachments, getTextureView)
            : undefined;
          const renderPass = commandEncoder.beginRenderPass({
            ...renderPassProps,
            ...(framebuffer ? {framebuffer} : {})
          });
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
          (executable as GPUCommandGraphCopyExecutable<Parameters>).encode(baseContext);
          break;
      }
    }
  }

  /** Releases compiled node resources and graph-owned transient resources. */
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
    for (const [id, handle] of this.buffers) {
      if (handle.transient) {
        continue;
      }
      const importedBuffer = overrides[id] ?? handle.defaultBuffer;
      if (!importedBuffer) {
        throw new Error(`GPUCommandGraph imported buffer "${id}" is required`);
      }
      validateImportedBuffer(importedBuffer, handle, this.device);
      resolved.set(handle, getCoreBuffer(importedBuffer));
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
    overrides: Record<string, GraphImportedTexture>
  ): Map<GraphTextureHandle, Texture> {
    const resolved = new Map<GraphTextureHandle, Texture>();
    for (const [id, handle] of this.textures) {
      if (handle.transient) {
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
      if (!handle || handle.transient) {
        throw new Error(`GPUCommandGraph has no imported texture named "${id}"`);
      }
    }
    return resolved;
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
}

function getBufferHandle(buffer: GraphBufferHandle | GraphDataView): GraphBufferHandle {
  return buffer instanceof GraphDataView ? buffer.buffer : buffer;
}

function getTextureHandle(texture: GraphTextureHandle | GraphTextureView): GraphTextureHandle {
  return texture instanceof GraphTextureView ? texture.texture : texture;
}

function getCoreBuffer(buffer: GraphImportedBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getCoreTexture(texture: GraphImportedTexture): Texture {
  if (texture instanceof DynamicTexture) {
    if (!texture.isReady) {
      throw new Error(`GPUCommandGraph dynamic texture "${texture.id}" is not ready`);
    }
    return texture.texture;
  }
  return texture;
}

function isGraphBufferUse(resource: GraphResourceUse): resource is GraphBufferUse {
  return 'buffer' in resource;
}

function validateGraphBufferDescriptor(descriptor: GraphBufferDescriptor): void {
  if (!descriptor.id) {
    throw new Error('GPUCommandGraph buffer id is required');
  }
  if (!Number.isSafeInteger(descriptor.byteLength) || descriptor.byteLength < 0) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" requires a valid byteLength`);
  }
  if (!Number.isSafeInteger(descriptor.usage) || descriptor.usage <= 0) {
    throw new Error(`GPUCommandGraph buffer "${descriptor.id}" requires buffer usage flags`);
  }
}

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
  if (props.byteOffset + byteLength > buffer.byteLength) {
    throw new Error(`Graph data view exceeds buffer "${buffer.id}" byte length`);
  }
}

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

function isBufferReadUsage(usage: GraphBufferUsage): boolean {
  return (
    usage === 'storage-read' ||
    usage === 'storage-read-write' ||
    usage === 'uniform' ||
    usage === 'copy-source' ||
    usage === 'indirect' ||
    usage === 'vertex' ||
    usage === 'index'
  );
}

function isBufferWriteUsage(usage: GraphBufferUsage): boolean {
  return (
    usage === 'storage-write' || usage === 'storage-read-write' || usage === 'copy-destination'
  );
}

function isTextureReadUsage(usage: GraphTextureUsage): boolean {
  return (
    usage === 'sampled' ||
    usage === 'storage-read' ||
    usage === 'storage-read-write' ||
    usage === 'render-attachment' ||
    usage === 'copy-source'
  );
}

function isTextureWriteUsage(usage: GraphTextureUsage): boolean {
  return (
    usage === 'storage-write' ||
    usage === 'storage-read-write' ||
    usage === 'render-attachment' ||
    usage === 'copy-destination'
  );
}

function getNodeOrder<Parameters>(
  nodes: GPUCommandGraphNode<Parameters>[]
): GPUCommandGraphNode<Parameters>[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const dependencies = new Map<string, Set<string>>();
  const lastBufferWriter = new Map<GraphBufferHandle, string>();
  const activeBufferReaders = new Map<GraphBufferHandle, Set<string>>();
  const textureHistory = new Map<
    GraphTextureHandle,
    {nodeId: string; resource: GraphTextureUse}[]
  >();

  for (const node of nodes) {
    const nodeDependencies = new Set(node.dependsOn ?? []);
    for (const dependency of nodeDependencies) {
      if (!nodeById.has(dependency)) {
        throw new Error(
          `GPUCommandGraph node "${node.id}" depends on missing node "${dependency}"`
        );
      }
    }
    for (const resource of node.resources ?? []) {
      if (isGraphBufferUse(resource)) {
        const handle = getBufferHandle(resource.buffer);
        if (isBufferReadUsage(resource.usage)) {
          const writer = lastBufferWriter.get(handle);
          if (writer) {
            nodeDependencies.add(writer);
          }
          const readers = activeBufferReaders.get(handle) ?? new Set<string>();
          readers.add(node.id);
          activeBufferReaders.set(handle, readers);
        }
        if (isBufferWriteUsage(resource.usage)) {
          const writer = lastBufferWriter.get(handle);
          if (writer) {
            nodeDependencies.add(writer);
          }
          for (const reader of activeBufferReaders.get(handle) ?? []) {
            if (reader !== node.id) {
              nodeDependencies.add(reader);
            }
          }
          activeBufferReaders.set(handle, new Set());
          lastBufferWriter.set(handle, node.id);
        }
      } else {
        const handle = getTextureHandle(resource.texture);
        const history = textureHistory.get(handle) ?? [];
        for (const previous of history) {
          if (
            previous.nodeId !== node.id &&
            textureUsesOverlap(previous.resource, resource) &&
            ((isTextureReadUsage(resource.usage) && isTextureWriteUsage(previous.resource.usage)) ||
              (isTextureWriteUsage(resource.usage) &&
                (isTextureReadUsage(previous.resource.usage) ||
                  isTextureWriteUsage(previous.resource.usage))))
          ) {
            nodeDependencies.add(previous.nodeId);
          }
        }
        history.push({nodeId: node.id, resource});
        textureHistory.set(handle, history);
      }
    }
    nodeDependencies.delete(node.id);
    dependencies.set(node.id, nodeDependencies);
  }

  const insertionIndex = new Map(nodes.map((node, index) => [node.id, index]));
  const remaining = new Map(
    Array.from(dependencies, ([id, values]) => [id, new Set(values)] as const)
  );
  const ordered: GPUCommandGraphNode<Parameters>[] = [];
  while (remaining.size > 0) {
    const ready = Array.from(remaining)
      .filter(([, values]) => values.size === 0)
      .map(([id]) => id)
      .sort((left, right) => insertionIndex.get(left)! - insertionIndex.get(right)!);
    if (ready.length === 0) {
      throw new Error('GPUCommandGraph contains a dependency cycle');
    }
    for (const id of ready) {
      ordered.push(nodeById.get(id)!);
      remaining.delete(id);
      for (const values of remaining.values()) {
        values.delete(id);
      }
    }
  }
  return ordered;
}

function textureUsesOverlap(left: GraphTextureUse, right: GraphTextureUse): boolean {
  const leftHandle = getTextureHandle(left.texture);
  const rightHandle = getTextureHandle(right.texture);
  if (leftHandle !== rightHandle) {
    return false;
  }
  const leftRange = getTextureSubresourceRange(left.texture);
  const rightRange = getTextureSubresourceRange(right.texture);
  return (
    aspectsOverlap(leftRange.aspect, rightRange.aspect) &&
    intervalsOverlap(
      leftRange.baseMipLevel,
      leftRange.mipLevelCount,
      rightRange.baseMipLevel,
      rightRange.mipLevelCount
    ) &&
    intervalsOverlap(
      leftRange.baseArrayLayer,
      leftRange.arrayLayerCount,
      rightRange.baseArrayLayer,
      rightRange.arrayLayerCount
    )
  );
}

function getTextureSubresourceRange(texture: GraphTextureHandle | GraphTextureView): {
  aspect: GraphTextureAspect;
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
} {
  if (texture instanceof GraphTextureView) {
    return texture;
  }
  return {
    aspect: 'all',
    baseMipLevel: 0,
    mipLevelCount: texture.mipLevels,
    baseArrayLayer: 0,
    arrayLayerCount: texture.dimension === '3d' ? 1 : texture.depth
  };
}

function aspectsOverlap(left: GraphTextureAspect, right: GraphTextureAspect): boolean {
  return left === 'all' || right === 'all' || left === right;
}

function intervalsOverlap(
  leftStart: number,
  leftCount: number,
  rightStart: number,
  rightCount: number
): boolean {
  return leftStart < rightStart + rightCount && rightStart < leftStart + leftCount;
}

function getBufferTransientAllocationPlan<Parameters>(
  nodes: GPUCommandGraphNode<Parameters>[],
  buffers: Iterable<GraphBufferHandle>
): BufferTransientAllocation[] {
  const lifetimes = getResourceLifetimes(nodes, resource =>
    isGraphBufferUse(resource) ? getBufferHandle(resource.buffer) : null
  );
  const allocations: BufferTransientAllocation[] = [];
  const transientBuffers = Array.from(buffers)
    .filter(buffer => buffer.transient)
    .map(buffer => ({buffer, lifetime: lifetimes.get(buffer)}))
    .sort(
      (left, right) =>
        (left.lifetime?.firstUse ?? Number.MAX_SAFE_INTEGER) -
        (right.lifetime?.firstUse ?? Number.MAX_SAFE_INTEGER)
    );

  for (const {buffer, lifetime} of transientBuffers) {
    if (!lifetime) {
      continue;
    }
    let allocation = allocations
      .filter(candidate => candidate.lastUse < lifetime.firstUse)
      .sort((left, right) => left.byteLength - right.byteLength)[0];
    if (!allocation) {
      allocation = {byteLength: 0, usage: 0, lastUse: -1, handles: []};
      allocations.push(allocation);
    }
    allocation.byteLength = Math.max(allocation.byteLength, buffer.byteLength);
    allocation.usage |= buffer.usage;
    allocation.lastUse = lifetime.lastUse;
    allocation.handles.push(buffer);
  }
  return allocations;
}

function getTextureTransientAllocationPlan<Parameters>(
  nodes: GPUCommandGraphNode<Parameters>[],
  textures: Iterable<GraphTextureHandle>
): TextureTransientAllocation[] {
  const lifetimes = getResourceLifetimes(nodes, resource =>
    isGraphBufferUse(resource) ? null : getTextureHandle(resource.texture)
  );
  const allocations: TextureTransientAllocation[] = [];
  const transientTextures = Array.from(textures)
    .filter(texture => texture.transient)
    .map(texture => ({texture, lifetime: lifetimes.get(texture)}))
    .sort(
      (left, right) =>
        (left.lifetime?.firstUse ?? Number.MAX_SAFE_INTEGER) -
        (right.lifetime?.firstUse ?? Number.MAX_SAFE_INTEGER)
    );

  for (const {texture, lifetime} of transientTextures) {
    if (!lifetime) {
      continue;
    }
    let allocation = allocations.find(
      candidate =>
        candidate.lastUse < lifetime.firstUse &&
        areTextureDescriptorsCompatible(candidate.descriptor, texture)
    );
    if (!allocation) {
      const descriptor = getNormalizedTextureDescriptor(texture);
      allocation = {
        descriptor,
        byteLength: getTextureByteLength(texture),
        lastUse: -1,
        handles: []
      };
      allocations.push(allocation);
    }
    allocation.descriptor.usage |= texture.usage;
    allocation.lastUse = lifetime.lastUse;
    allocation.handles.push(texture);
  }
  return allocations;
}

function getResourceLifetimes<Parameters, Resource extends object>(
  nodes: GPUCommandGraphNode<Parameters>[],
  getResource: (resource: GraphResourceUse) => Resource | null
): Map<Resource, {firstUse: number; lastUse: number}> {
  const lifetimes = new Map<Resource, {firstUse: number; lastUse: number}>();
  nodes.forEach((node, nodeIndex) => {
    for (const resourceUse of node.resources ?? []) {
      const resource = getResource(resourceUse);
      if (!resource || !('transient' in resource) || !resource.transient) {
        continue;
      }
      const lifetime = lifetimes.get(resource);
      if (lifetime) {
        lifetime.lastUse = nodeIndex;
      } else {
        lifetimes.set(resource, {firstUse: nodeIndex, lastUse: nodeIndex});
      }
    }
  });
  return lifetimes;
}

function getNormalizedTextureDescriptor(
  texture: GraphTextureHandle
): NormalizedGraphTextureDescriptor {
  return {
    id: texture.id,
    format: texture.format,
    width: texture.width,
    height: texture.height,
    usage: texture.usage,
    dimension: texture.dimension,
    depth: texture.depth,
    mipLevels: texture.mipLevels,
    samples: texture.samples
  };
}

function areTextureDescriptorsCompatible(
  descriptor: NormalizedGraphTextureDescriptor,
  texture: GraphTextureHandle
): boolean {
  return (
    descriptor.format === texture.format &&
    descriptor.width === texture.width &&
    descriptor.height === texture.height &&
    descriptor.dimension === texture.dimension &&
    descriptor.depth === texture.depth &&
    descriptor.mipLevels === texture.mipLevels &&
    descriptor.samples === texture.samples
  );
}

function getTextureByteLength(texture: GraphTextureHandle): number {
  let byteLength = 0;
  for (let mipLevel = 0; mipLevel < texture.mipLevels; mipLevel++) {
    byteLength += textureFormatDecoder.computeMemoryLayout({
      format: texture.format,
      width: Math.max(1, texture.width >> mipLevel),
      height: texture.dimension === '1d' ? 1 : Math.max(1, texture.height >> mipLevel),
      depth: texture.dimension === '3d' ? Math.max(1, texture.depth >> mipLevel) : texture.depth,
      byteAlignment: 1
    }).byteLength;
  }
  return byteLength * texture.samples;
}

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
