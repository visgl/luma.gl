// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Buffer,
  CommandEncoder,
  ComputePass,
  Device,
  RenderPass,
  RenderPassProps,
  Texture,
  TextureFormat,
  TextureView
} from '@luma.gl/core';
import type {DynamicBuffer, DynamicTexture} from '@luma.gl/engine';
import type {GPUVectorFormat} from '@luma.gl/tables';

/** Internal identity shared by graph-owned handles without importing the graph implementation. */
export type GPUCommandGraphOwner = {
  readonly id: string;
};

/**
 * Access mode for a buffer used by a command-graph node.
 *
 * The compiler uses this declaration to infer read-after-write, write-after-read, and
 * write-after-write dependencies. It also validates that the physical buffer has the required
 * WebGPU usage flag.
 */
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

/**
 * Access mode for a texture or texture view used by a command-graph node.
 *
 * Texture hazards are inferred only when the declared mip, layer, and aspect ranges overlap.
 */
export type GraphTextureUsage =
  | 'sampled'
  | 'storage-read'
  | 'storage-write'
  | 'storage-read-write'
  | 'render-attachment'
  | 'copy-source'
  | 'copy-destination';

/** Caller-owned buffer accepted as a fixed or per-encoding graph import. */
export type GraphImportedBuffer = Buffer | DynamicBuffer;

/** Caller-owned texture accepted as a fixed or per-encoding graph import. */
export type GraphImportedTexture = Texture | DynamicTexture;

/** Descriptor for one imported or transient graph buffer. */
export type GraphBufferDescriptor = {
  /** Graph-wide resource identifier. */
  id: string;
  /** Required capacity in bytes. */
  byteLength: number;
  /** Bitwise union of the required luma.gl buffer usage flags. */
  usage: number;
};

/** Logical texture dimension supported by the command graph. */
export type GraphTextureDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';

/** Depth/stencil aspect selected by a {@link GraphTextureView}. */
export type GraphTextureAspect = 'all' | 'stencil-only' | 'depth-only';

/** Descriptor for one fixed-size imported or transient graph texture. */
export type GraphTextureDescriptor<Format extends TextureFormat = TextureFormat> = {
  /** Graph-wide resource identifier. */
  id: string;
  /** Physical texel format. */
  format: Format;
  /** Width of mip level zero. */
  width: number;
  /** Height of mip level zero. */
  height: number;
  /** Bitwise union of the required luma.gl texture usage flags. */
  usage: number;
  /** Texture dimension. Defaults to `'2d'`. */
  dimension?: GraphTextureDimension;
  /** Array-layer count or depth for a 3D texture. Defaults to `1`. */
  depth?: number;
  /** Number of mip levels. Defaults to `1`. */
  mipLevels?: number;
  /** Multisample count. Defaults to `1`. */
  samples?: number;
};

/** Fully defaulted texture descriptor used by graph internals. @internal */
export type NormalizedGraphTextureDescriptor<Format extends TextureFormat = TextureFormat> = {
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

/**
 * Opaque logical buffer tracked by a `GPUCommandGraph`.
 *
 * A handle describes capacity, usage, and ownership but does not expose a concrete buffer. The
 * concrete buffer is resolved while encoding a {@link CompiledGPUCommandGraph}.
 */
export class GraphBufferHandle {
  /** Graph-wide resource identifier. */
  readonly id: string;
  /** Required capacity in bytes. */
  readonly byteLength: number;
  /** Required luma.gl buffer usage flags. */
  readonly usage: number;
  /** Whether the graph owns and may alias the physical allocation. */
  readonly transient: boolean;
  /** @internal */
  readonly graph: GPUCommandGraphOwner;
  /** @internal */
  readonly defaultBuffer?: GraphImportedBuffer;

  /** @internal */
  constructor(
    graph: GPUCommandGraphOwner,
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

/**
 * Typed logical range within one {@link GraphBufferHandle}.
 *
 * A data view mirrors one fixed-width `GPUData` chunk: it carries layout metadata but does not own
 * the underlying buffer. Hazards remain buffer-granular, so two views of the same handle alias.
 */
export class GraphDataView<T extends GPUVectorFormat = GPUVectorFormat> {
  /** Logical buffer containing the range. */
  readonly buffer: GraphBufferHandle;
  /** Stored GPU value format. */
  readonly format: T;
  /** Number of logical rows. */
  readonly length: number;
  /** Byte offset of the first row in the logical buffer. */
  readonly byteOffset: number;
  /** Byte distance between consecutive rows. */
  readonly byteStride: number;
  /** Number of bytes occupied by one row. */
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

/**
 * Ordered graph data views that preserve one fixed-width `GPUVector`'s chunk boundaries.
 *
 * A vector view is metadata and an ordered list only. Nodes declare uses of individual
 * {@link GraphDataView} chunks so that the compiler continues to track physical buffer hazards.
 */
export class GraphVectorView<T extends GPUVectorFormat = GPUVectorFormat> {
  /** Identifier supplied to `GPUCommandGraph.importGPUVector`. */
  readonly id: string;
  /** Source vector name. */
  readonly name: string;
  /** Canonical format shared by every chunk. */
  readonly format: T;
  /** Total logical row count across all chunks. */
  readonly length: number;
  /** Total flattened value count across all chunks. */
  readonly valueLength: number;
  /** Source vector stride in format components. */
  readonly stride: number;
  /** Source vector byte stride. */
  readonly byteStride: number;
  /** Source vector bytes occupied by one row. */
  readonly rowByteLength: number;
  /** Imported chunks in source order. */
  readonly data: readonly GraphDataView<T>[];

  /** @internal */
  constructor(props: {
    id: string;
    name: string;
    format: T;
    length: number;
    valueLength: number;
    stride: number;
    byteStride: number;
    rowByteLength: number;
    data: readonly GraphDataView<T>[];
  }) {
    this.id = props.id;
    this.name = props.name;
    this.format = props.format;
    this.length = props.length;
    this.valueLength = props.valueLength;
    this.stride = props.stride;
    this.byteStride = props.byteStride;
    this.rowByteLength = props.rowByteLength;
    this.data = props.data;
  }
}

/**
 * Opaque logical texture tracked by a `GPUCommandGraph`.
 *
 * The descriptor is fixed at graph construction. Imported textures must match it exactly at each
 * encoding; transient textures are created and owned by the compiled graph.
 */
export class GraphTextureHandle<Format extends TextureFormat = TextureFormat> {
  /** Graph-wide resource identifier. */
  readonly id: string;
  /** Physical texel format. */
  readonly format: Format;
  /** Width of mip level zero. */
  readonly width: number;
  /** Height of mip level zero. */
  readonly height: number;
  /** Required luma.gl texture usage flags. */
  readonly usage: number;
  /** Logical texture dimension. */
  readonly dimension: GraphTextureDimension;
  /** Array-layer count or depth for a 3D texture. */
  readonly depth: number;
  /** Number of mip levels. */
  readonly mipLevels: number;
  /** Multisample count. */
  readonly samples: number;
  /** Whether the graph owns and may alias the physical allocation. */
  readonly transient: boolean;
  /** @internal */
  readonly graph: GPUCommandGraphOwner;
  /** @internal */
  readonly defaultTexture?: GraphImportedTexture;

  /** @internal */
  constructor(
    graph: GPUCommandGraphOwner,
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

/** Subresource range selected by `GPUCommandGraph.createTextureView`. */
export type GraphTextureViewProps = {
  /** View dimension. Defaults to the dimension implied by the texture. */
  dimension?: GraphTextureDimension;
  /** Depth/stencil aspect. Defaults to `'all'`. */
  aspect?: GraphTextureAspect;
  /** First visible mip level. Defaults to `0`. */
  baseMipLevel?: number;
  /** Number of visible mip levels. Defaults to all remaining levels. */
  mipLevelCount?: number;
  /** First visible array layer. Defaults to `0`. */
  baseArrayLayer?: number;
  /** Number of visible array layers. Defaults to all remaining layers. */
  arrayLayerCount?: number;
};

/** Logical mip, layer, and aspect range within one graph texture. */
export class GraphTextureView<Format extends TextureFormat = TextureFormat> {
  /** Logical texture containing the selected range. */
  readonly texture: GraphTextureHandle<Format>;
  /** Physical texel format inherited from the texture. */
  readonly format: Format;
  /** View dimension. */
  readonly dimension: GraphTextureDimension;
  /** Selected depth/stencil aspect. */
  readonly aspect: GraphTextureAspect;
  /** First selected mip level. */
  readonly baseMipLevel: number;
  /** Number of selected mip levels. */
  readonly mipLevelCount: number;
  /** First selected array layer. */
  readonly baseArrayLayer: number;
  /** Number of selected array layers. */
  readonly arrayLayerCount: number;
  /** Width of the first selected mip. */
  readonly width: number;
  /** Height of the first selected mip. */
  readonly height: number;
  /** Depth or layer count of the selected range. */
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
  /** Whole logical buffer or typed range whose physical buffer is used. */
  buffer: GraphBufferHandle | GraphDataView;
  /** Access performed by the node. */
  usage: GraphBufferUsage;
};

/** One texture or texture-view use declared by a graph node. */
export type GraphTextureUse = {
  /** Whole logical texture or selected subresource range used by the node. */
  texture: GraphTextureHandle | GraphTextureView;
  /** Access performed by the node. */
  usage: GraphTextureUsage;
};

/** One resource use declared by a graph node. */
export type GraphResourceUse = GraphBufferUse | GraphTextureUse;

/** Graph-owned texture attachments resolved into a framebuffer for a render node. */
export type GraphRenderPassAttachments = {
  /** Color attachment views in render-target order. */
  colorAttachments: GraphTextureView[];
  /** Optional depth/stencil attachment view. */
  depthStencilAttachment?: GraphTextureView;
};

/** Context available while compiling one graph node. */
export type GPUCommandGraphCompileContext = {
  /** WebGPU device that owns the graph. */
  device: Device;
};

/** Context shared by every executable graph node. */
export type GPUCommandGraphEncodeContext<Parameters> = {
  /** Caller-owned encoder receiving the graph's commands. */
  commandEncoder: CommandEncoder;
  /** Per-encoding application parameters. */
  parameters: Parameters;
  /** Resolves a logical buffer or data view to its concrete buffer. */
  getBuffer: (buffer: GraphBufferHandle | GraphDataView) => Buffer;
  /** Resolves a logical texture or view to its concrete texture. */
  getTexture: (texture: GraphTextureHandle | GraphTextureView) => Texture;
  /** Resolves and caches the concrete texture view for a logical texture or view. */
  getTextureView: (texture: GraphTextureHandle | GraphTextureView) => TextureView;
};

/** Compiled compute-pass callback. */
export type GPUCommandGraphComputeExecutable<Parameters> = {
  /** Records commands into the compute pass opened by the graph. */
  encode: (context: GPUCommandGraphEncodeContext<Parameters> & {computePass: ComputePass}) => void;
  /** Releases node-owned compiled resources. */
  destroy?: () => void;
};

/** Compiled render-pass callback. */
export type GPUCommandGraphRenderExecutable<Parameters> = {
  /** Returns per-encoding render-pass options other than graph-declared attachments. */
  getRenderPassProps?: (context: GPUCommandGraphEncodeContext<Parameters>) => RenderPassProps;
  /** Records commands into the render pass opened by the graph. */
  encode: (context: GPUCommandGraphEncodeContext<Parameters> & {renderPass: RenderPass}) => void;
  /** Releases node-owned compiled resources. */
  destroy?: () => void;
};

/** Compiled command-encoder callback used for copies and other pass-independent commands. */
export type GPUCommandGraphCopyExecutable<Parameters> = {
  /** Records commands directly into the caller-owned encoder. */
  encode: (context: GPUCommandGraphEncodeContext<Parameters>) => void;
  /** Releases node-owned compiled resources. */
  destroy?: () => void;
};

type GPUCommandGraphNodeBase = {
  /** Graph-wide node identifier. */
  id: string;
  /** Resources read or written by the node, used for validation and hazard inference. */
  resources?: GraphResourceUse[];
  /** Explicit predecessor node identifiers in addition to inferred resource dependencies. */
  dependsOn?: string[];
};

/** Compute node compiled once and encoded into a graph-owned compute pass. */
export type GPUCommandGraphComputeNode<Parameters> = GPUCommandGraphNodeBase & {
  /** Node discriminator. */
  type: 'compute';
  /** Creates reusable node resources and the encode callback. */
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphComputeExecutable<Parameters>;
};

/** Render node compiled once and encoded into a graph-owned render pass. */
export type GPUCommandGraphRenderNode<Parameters> = GPUCommandGraphNodeBase & {
  /** Node discriminator. */
  type: 'render';
  /** Optional graph-managed render attachments. */
  attachments?: GraphRenderPassAttachments;
  /** Creates reusable node resources and the encode callback. */
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphRenderExecutable<Parameters>;
};

/** Copy or pass-independent node compiled once and encoded directly on the command encoder. */
export type GPUCommandGraphCopyNode<Parameters> = GPUCommandGraphNodeBase & {
  /** Node discriminator. */
  type: 'copy';
  /** Creates reusable node resources and the encode callback. */
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphCopyExecutable<Parameters>;
};

/** Any node accepted by a `GPUCommandGraph`. */
export type GPUCommandGraphNode<Parameters> =
  | GPUCommandGraphComputeNode<Parameters>
  | GPUCommandGraphRenderNode<Parameters>
  | GPUCommandGraphCopyNode<Parameters>;

/** Resource-allocation and scheduling statistics for one compiled graph. */
export type GPUCommandGraphStats = {
  /** Stable topological node order used for encoding. */
  nodeOrder: string[];
  /** Number of logical transient buffer handles used by nodes. */
  logicalTransientBufferCount: number;
  /** Number of physical transient buffers allocated after lifetime reuse. */
  physicalTransientBufferCount: number;
  /** Sum of the capacities of logical transient buffers. */
  logicalTransientBytes: number;
  /** Sum of physical transient buffer allocation capacities. */
  physicalTransientBytes: number;
  /** Logical buffer bytes avoided through allocation reuse. */
  reusedTransientBytes: number;
  /** Percentage of logical buffer bytes avoided through reuse. */
  reusePercentage: number;
  /** Number of logical transient texture handles used by nodes. */
  logicalTransientTextureCount: number;
  /** Number of physical transient textures allocated after lifetime reuse. */
  physicalTransientTextureCount: number;
  /** Estimated bytes across all logical transient textures. */
  logicalTransientTextureBytes: number;
  /** Estimated bytes across physical transient texture allocations. */
  physicalTransientTextureBytes: number;
  /** Estimated logical texture bytes avoided through allocation reuse. */
  reusedTransientTextureBytes: number;
  /** Percentage of estimated logical texture bytes avoided through reuse. */
  textureReusePercentage: number;
};

/** Options supplied while encoding one compiled graph. */
export type GPUCommandGraphEncodeOptions<Parameters> = {
  /** Application data forwarded to every node encode callback. */
  parameters: Parameters;
  /** Per-encoding imported-buffer replacements keyed by graph resource ID. */
  buffers?: Record<string, GraphImportedBuffer>;
  /** Per-encoding imported-texture replacements keyed by graph resource ID. */
  textures?: Record<string, GraphImportedTexture>;
};
