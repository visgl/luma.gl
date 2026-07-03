// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import type {CommandEncoder, Device, Framebuffer, TextureFormat, TextureView} from '@luma.gl/core';
import {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import {
  GPUData,
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
  type BufferTransientAllocation,
  type CompiledNode,
  type GPUCommandGraphCompilation,
  type TextureTransientAllocation
} from './gpu-command-graph-compiler';
import {
  GraphBufferHandle,
  GraphDataView,
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
import type {
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphNode,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GraphBufferDescriptor,
  GraphBufferUsage,
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
  GraphTextureHandle,
  GraphTextureView,
  GraphVectorView
} from './gpu-command-graph-types';
export type {
  GPUCommandGraphCompileContext,
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphComputeNode,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphCopyNode,
  GPUCommandGraphEncodeContext,
  GPUCommandGraphEncodeOptions,
  GPUCommandGraphNode,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphRenderNode,
  GPUCommandGraphStats,
  GraphBufferDescriptor,
  GraphBufferUsage,
  GraphBufferUse,
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
  /** WebGPU device that owns compilation and transient resources. */
  readonly device: Device;
  /** Identifier used as a prefix for graph-owned GPU resources. */
  readonly id: string;

  private readonly buffers = new Map<string, GraphBufferHandle>();
  private readonly textures = new Map<string, GraphTextureHandle>();
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
    this.device = device;
    this.id = props.id ?? 'gpu-command-graph';
  }

  /**
   * Declares a caller-owned buffer that can be supplied now or for each encoding.
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
    validateGraphBufferDescriptor(descriptor);
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
    validateGraphBufferDescriptor(descriptor);
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
    this.compiled = true;
    return new CompiledGPUCommandGraph(
      compileGPUCommandGraph({
        device: this.device,
        id: this.id,
        buffers: this.buffers,
        textures: this.textures,
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
  constructor(props: GPUCommandGraphCompilation<Parameters>) {
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

  /**
   * Records every graph node into a caller-owned command encoder.
   *
   * Imported resources are resolved from per-encoding overrides first, then from defaults supplied
   * at graph construction. This method records only; it does not finish or submit the encoder.
   *
   * @param commandEncoder Encoder that receives all graph commands.
   * @param options Per-encoding parameters and optional imported-resource replacements.
   */
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

/** Validates graph identity, capacity, and usage fields for a logical buffer. */
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
  if (props.byteOffset + byteLength > buffer.byteLength) {
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
