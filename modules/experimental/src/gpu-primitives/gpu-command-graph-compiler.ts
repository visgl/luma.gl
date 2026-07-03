// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Texture, textureFormatDecoder} from '@luma.gl/core';
import type {Device, TextureFormat} from '@luma.gl/core';
import type {
  GPUCommandGraphComputeExecutable,
  GPUCommandGraphCopyExecutable,
  GPUCommandGraphNode,
  GPUCommandGraphRenderExecutable,
  GPUCommandGraphStats,
  GraphBufferHandle,
  GraphBufferUsage,
  GraphBufferUse,
  GraphDataView,
  GraphResourceUse,
  GraphTextureAspect,
  GraphTextureDimension,
  GraphTextureHandle,
  GraphTextureUse,
  GraphTextureUsage,
  GraphTextureView
} from './gpu-command-graph-types';

/** A graph node paired with the reusable executable produced by its compile callback. @internal */
export type CompiledNode<Parameters> = {
  /** Scheduled node definition. */
  node: GPUCommandGraphNode<Parameters>;
  /** Reusable node state and encode callback. */
  executable:
    | GPUCommandGraphComputeExecutable<Parameters>
    | GPUCommandGraphRenderExecutable<Parameters>
    | GPUCommandGraphCopyExecutable<Parameters>;
};

/** One physical buffer allocation shared by logical transients with disjoint lifetimes. @internal */
export type BufferTransientAllocation = {
  /** Maximum capacity required by any assigned handle. */
  byteLength: number;
  /** Union of usage flags required by assigned handles. */
  usage: number;
  /** Last scheduled node index using the most recently assigned handle. */
  lastUse: number;
  /** Logical handles assigned to this allocation in lifetime order. */
  handles: GraphBufferHandle[];
  /** Physical buffer created during compilation. */
  buffer?: Buffer;
};

type TransientTextureDescriptor = {
  id: string;
  format: TextureFormat;
  width: number;
  height: number;
  usage: number;
  dimension: GraphTextureDimension;
  depth: number;
  mipLevels: number;
  samples: number;
};

/** One physical texture allocation shared by compatible transients with disjoint lifetimes. @internal */
export type TextureTransientAllocation = {
  /** Descriptor shared by every assigned handle, with their usage flags combined. */
  descriptor: TransientTextureDescriptor;
  /** Estimated physical allocation size used for statistics. */
  byteLength: number;
  /** Last scheduled node index using the most recently assigned handle. */
  lastUse: number;
  /** Logical handles assigned to this allocation in lifetime order. */
  handles: GraphTextureHandle[];
  /** Physical texture created during compilation. */
  texture?: Texture;
};

/** Complete immutable input for constructing a `CompiledGPUCommandGraph`. @internal */
export type GPUCommandGraphCompilation<Parameters> = {
  /** Device owning compiled resources. */
  device: Device;
  /** Graph identifier. */
  id: string;
  /** Snapshot of logical buffer resources. */
  buffers: Map<string, GraphBufferHandle>;
  /** Snapshot of logical texture resources. */
  textures: Map<string, GraphTextureHandle>;
  /** Nodes and executables in stable topological order. */
  compiledNodes: CompiledNode<Parameters>[];
  /** Logical-to-physical transient buffer mapping. */
  transientBuffers: Map<GraphBufferHandle, Buffer>;
  /** Logical-to-physical transient texture mapping. */
  transientTextures: Map<GraphTextureHandle, Texture>;
  /** Physical buffer allocation plan retained for destruction. */
  bufferTransientAllocations: BufferTransientAllocation[];
  /** Physical texture allocation plan retained for destruction. */
  textureTransientAllocations: TextureTransientAllocation[];
  /** Scheduling and allocation statistics. */
  stats: GPUCommandGraphStats;
};

/**
 * Compiles scheduling, transient allocations, and executable node resources.
 *
 * Compilation proceeds in four phases: infer a stable topological node order, plan allocation
 * reuse from transient lifetimes, create physical resources, then invoke node compile callbacks.
 * If a callback fails, every executable and physical resource created so far is destroyed before
 * the error is rethrown.
 *
 * @internal
 */
export function compileGPUCommandGraph<Parameters>(props: {
  device: Device;
  id: string;
  buffers: Map<string, GraphBufferHandle>;
  textures: Map<string, GraphTextureHandle>;
  nodes: GPUCommandGraphNode<Parameters>[];
}): GPUCommandGraphCompilation<Parameters> {
  const nodeOrder = getNodeOrder(props.nodes);
  const bufferPlan = getBufferTransientAllocationPlan(nodeOrder, props.buffers.values());
  const texturePlan = getTextureTransientAllocationPlan(nodeOrder, props.textures.values());
  const transientBuffers = new Map<GraphBufferHandle, Buffer>();
  const transientTextures = new Map<GraphTextureHandle, Texture>();

  for (const allocation of bufferPlan) {
    allocation.buffer = props.device.createBuffer({
      id: `${props.id}-transient-buffer-${bufferPlan.indexOf(allocation)}`,
      byteLength: allocation.byteLength,
      usage: allocation.usage
    });
    for (const handle of allocation.handles) {
      transientBuffers.set(handle, allocation.buffer);
    }
  }
  for (const allocation of texturePlan) {
    allocation.texture = props.device.createTexture({
      ...allocation.descriptor,
      id: `${props.id}-transient-texture-${texturePlan.indexOf(allocation)}`
    });
    for (const handle of allocation.handles) {
      transientTextures.set(handle, allocation.texture);
    }
  }

  const compiledNodes: CompiledNode<Parameters>[] = [];
  try {
    for (const node of nodeOrder) {
      compiledNodes.push({node, executable: node.compile({device: props.device})});
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

  const logicalTransientBytes = Array.from(props.buffers.values())
    .filter(buffer => buffer.transient)
    .reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const physicalTransientBytes = bufferPlan.reduce(
    (sum, allocation) => sum + allocation.byteLength,
    0
  );
  const reusedTransientBytes = Math.max(0, logicalTransientBytes - physicalTransientBytes);
  const logicalTransientTextureBytes = Array.from(props.textures.values())
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
    logicalTransientBufferCount: Array.from(props.buffers.values()).filter(
      buffer => buffer.transient
    ).length,
    physicalTransientBufferCount: bufferPlan.length,
    logicalTransientBytes,
    physicalTransientBytes,
    reusedTransientBytes,
    reusePercentage:
      logicalTransientBytes > 0 ? (reusedTransientBytes / logicalTransientBytes) * 100 : 0,
    logicalTransientTextureCount: Array.from(props.textures.values()).filter(
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

  return {
    device: props.device,
    id: props.id,
    buffers: new Map(props.buffers),
    textures: new Map(props.textures),
    compiledNodes,
    transientBuffers,
    transientTextures,
    bufferTransientAllocations: bufferPlan,
    textureTransientAllocations: texturePlan,
    stats
  };
}

/** Returns the underlying logical buffer for either a handle or typed data view. @internal */
export function getBufferHandle(buffer: GraphBufferHandle | GraphDataView): GraphBufferHandle {
  return 'buffer' in buffer ? buffer.buffer : buffer;
}

/** Returns the underlying logical texture for either a handle or subresource view. @internal */
export function getTextureHandle(
  texture: GraphTextureHandle | GraphTextureView
): GraphTextureHandle {
  return 'texture' in texture ? texture.texture : texture;
}

/** Narrows a declared resource use to a buffer use. @internal */
export function isGraphBufferUse(resource: GraphResourceUse): resource is GraphBufferUse {
  return 'buffer' in resource;
}

/** Returns whether an access observes existing buffer contents. */
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

/** Returns whether an access changes buffer contents. */
function isBufferWriteUsage(usage: GraphBufferUsage): boolean {
  return (
    usage === 'storage-write' || usage === 'storage-read-write' || usage === 'copy-destination'
  );
}

/** Returns whether an access observes existing texture contents. */
function isTextureReadUsage(usage: GraphTextureUsage): boolean {
  return (
    usage === 'sampled' ||
    usage === 'storage-read' ||
    usage === 'storage-read-write' ||
    usage === 'render-attachment' ||
    usage === 'copy-source'
  );
}

/** Returns whether an access may change texture contents. */
function isTextureWriteUsage(usage: GraphTextureUsage): boolean {
  return (
    usage === 'storage-write' ||
    usage === 'storage-read-write' ||
    usage === 'render-attachment' ||
    usage === 'copy-destination'
  );
}

/**
 * Infers hazards and returns a stable topological node order.
 *
 * Buffer hazards are conservative at whole-handle granularity. Texture hazards use overlapping
 * aspect, mip, and layer ranges. Explicit dependencies and inferred hazards share the same graph;
 * nodes that are otherwise independent retain insertion order.
 */
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

/** Returns whether two uses refer to overlapping subresources of the same logical texture. */
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

/** Normalizes a whole texture or view to the range used for hazard overlap tests. */
function getTextureSubresourceRange(texture: GraphTextureHandle | GraphTextureView): {
  aspect: GraphTextureAspect;
  baseMipLevel: number;
  mipLevelCount: number;
  baseArrayLayer: number;
  arrayLayerCount: number;
} {
  if ('texture' in texture) {
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

/** Returns whether two depth/stencil aspect selections overlap. */
function aspectsOverlap(left: GraphTextureAspect, right: GraphTextureAspect): boolean {
  return left === 'all' || right === 'all' || left === right;
}

/** Returns whether two half-open integer intervals overlap. */
function intervalsOverlap(
  leftStart: number,
  leftCount: number,
  rightStart: number,
  rightCount: number
): boolean {
  return leftStart < rightStart + rightCount && rightStart < leftStart + leftCount;
}

/**
 * Assigns transient buffers to reusable physical allocations.
 *
 * The earliest available allocation is selected by smallest capacity. Capacity grows to the
 * largest assigned handle and usage flags are combined across all assigned handles.
 */
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

/**
 * Assigns transient textures to descriptor-compatible physical allocations with disjoint
 * lifetimes. Unlike buffers, texture extent and sampling properties cannot grow during reuse.
 */
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

/** Returns inclusive first/last scheduled use indices for each referenced transient resource. */
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

/** Copies a logical texture handle into the mutable physical-allocation descriptor. */
function getNormalizedTextureDescriptor(texture: GraphTextureHandle): TransientTextureDescriptor {
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

/** Returns whether a logical texture can reuse an existing physical texture allocation. */
function areTextureDescriptorsCompatible(
  descriptor: TransientTextureDescriptor,
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

/** Estimates all mip and sample storage for texture reuse statistics. */
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
