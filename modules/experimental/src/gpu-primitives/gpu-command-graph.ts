// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import type {CommandEncoder, ComputePass, Device, RenderPass, RenderPassProps} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
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

/** Buffer accepted as a fixed or per-encoding graph import. */
export type GraphImportedBuffer = Buffer | DynamicBuffer;

/** Descriptor for one imported or transient graph buffer. */
export type GraphBufferDescriptor = {
  id: string;
  byteLength: number;
  usage: number;
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
export class GraphBufferView<T extends GPUVectorFormat = GPUVectorFormat> {
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

/** One resource use declared by a graph node. */
export type GraphBufferUse = {
  buffer: GraphBufferHandle | GraphBufferView;
  usage: GraphBufferUsage;
};

/** Context available while compiling one graph node. */
export type GPUCommandGraphCompileContext = {
  device: Device;
};

/** Context shared by every executable graph node. */
export type GPUCommandGraphEncodeContext<Parameters> = {
  commandEncoder: CommandEncoder;
  parameters: Parameters;
  getBuffer: (buffer: GraphBufferHandle | GraphBufferView) => Buffer;
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
  resources?: GraphBufferUse[];
  dependsOn?: string[];
};

export type GPUCommandGraphComputeNode<Parameters> = GPUCommandGraphNodeBase & {
  type: 'compute';
  compile: (context: GPUCommandGraphCompileContext) => GPUCommandGraphComputeExecutable<Parameters>;
};

export type GPUCommandGraphRenderNode<Parameters> = GPUCommandGraphNodeBase & {
  type: 'render';
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
};

/** Options supplied while encoding one compiled graph. */
export type GPUCommandGraphEncodeOptions<Parameters> = {
  parameters: Parameters;
  buffers?: Record<string, GraphImportedBuffer>;
};

type CompiledNode<Parameters> = {
  node: GPUCommandGraphNode<Parameters>;
  executable:
    | GPUCommandGraphComputeExecutable<Parameters>
    | GPUCommandGraphRenderExecutable<Parameters>
    | GPUCommandGraphCopyExecutable<Parameters>;
};

type TransientAllocation = {
  byteLength: number;
  usage: number;
  lastUse: number;
  handles: GraphBufferHandle[];
  buffer?: Buffer;
};

/**
 * Declarative WebGPU command graph with explicit buffer access and ownership.
 *
 * The graph compiles resource hazards, transient lifetimes, and node resources,
 * but encoding and submission remain controlled by the application.
 */
export class GPUCommandGraph<Parameters = void> {
  readonly device: Device;
  readonly id: string;

  private readonly buffers = new Map<string, GraphBufferHandle>();
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
  createBufferView<T extends GPUVectorFormat>(
    buffer: GraphBufferHandle,
    props: {
      format: T;
      length: number;
      byteOffset?: number;
      byteStride?: number;
      rowByteLength?: number;
    }
  ): GraphBufferView<T> {
    this.assertBuffer(buffer);
    const formatInfo = getGPUVectorFormatInfo(props.format);
    const byteOffset = props.byteOffset ?? 0;
    const rowByteLength = props.rowByteLength ?? formatInfo.byteLength;
    const byteStride = props.byteStride ?? rowByteLength;
    validateGraphBufferView(buffer, {
      length: props.length,
      byteOffset,
      byteStride,
      rowByteLength
    });
    return new GraphBufferView(buffer, {
      format: props.format,
      length: props.length,
      byteOffset,
      byteStride,
      rowByteLength
    });
  }

  /** Imports one borrowed GPUData range and returns its typed graph view. */
  importGPUData<T extends GPUVectorFormat>(id: string, data: GPUData<T>): GraphBufferView<T> {
    if (!data.format) {
      throw new Error(`GPUCommandGraph import "${id}" requires GPUData.format`);
    }
    const coreBuffer = getCoreBuffer(data.buffer);
    const handle = this.importBuffer(
      {id, byteLength: coreBuffer.byteLength, usage: coreBuffer.usage},
      data.buffer
    );
    return this.createBufferView(handle, {
      format: data.format,
      length: data.length,
      byteOffset: data.byteOffset,
      byteStride: data.byteStride,
      rowByteLength: data.rowByteLength
    });
  }

  /** Imports one packed, single-chunk GPUVector. */
  importGPUVector<T extends GPUVectorFormat>(id: string, vector: GPUVector<T>): GraphBufferView<T> {
    const [data, ...remainingData] = vector.data;
    if (!data || remainingData.length > 0) {
      throw new Error(`GPUCommandGraph import "${id}" requires exactly one GPUVector chunk`);
    }
    if (vector.bufferLayout) {
      throw new Error(`GPUCommandGraph import "${id}" does not accept interleaved GPUVector data`);
    }
    return this.importGPUData(id, data);
  }

  addComputePass(node: Omit<GPUCommandGraphComputeNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'compute'});
  }

  addRenderPass(node: Omit<GPUCommandGraphRenderNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'render'});
  }

  addCopyPass(node: Omit<GPUCommandGraphCopyNode<Parameters>, 'type'>): void {
    this.addNode({...node, type: 'copy'});
  }

  /** Compiles scheduling, transient allocations, and executable node resources. */
  compile(): CompiledGPUCommandGraph<Parameters> {
    this.assertMutable();
    this.compiled = true;
    const nodeOrder = getNodeOrder(this.nodes);
    const transientPlan = getTransientAllocationPlan(nodeOrder, this.buffers.values());
    const transientBuffers = new Map<GraphBufferHandle, Buffer>();
    for (const allocation of transientPlan) {
      allocation.buffer = this.device.createBuffer({
        id: `${this.id}-transient-${transientPlan.indexOf(allocation)}`,
        byteLength: allocation.byteLength,
        usage: allocation.usage
      });
      for (const handle of allocation.handles) {
        transientBuffers.set(handle, allocation.buffer);
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
      for (const allocation of transientPlan) {
        allocation.buffer?.destroy();
      }
      throw error;
    }

    const logicalTransientBytes = Array.from(this.buffers.values())
      .filter(buffer => buffer.transient)
      .reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const physicalTransientBytes = transientPlan.reduce(
      (sum, allocation) => sum + allocation.byteLength,
      0
    );
    const reusedTransientBytes = Math.max(0, logicalTransientBytes - physicalTransientBytes);
    const stats: GPUCommandGraphStats = {
      nodeOrder: nodeOrder.map(node => node.id),
      logicalTransientBufferCount: Array.from(this.buffers.values()).filter(
        buffer => buffer.transient
      ).length,
      physicalTransientBufferCount: transientPlan.length,
      logicalTransientBytes,
      physicalTransientBytes,
      reusedTransientBytes,
      reusePercentage:
        logicalTransientBytes > 0 ? (reusedTransientBytes / logicalTransientBytes) * 100 : 0
    };

    return new CompiledGPUCommandGraph({
      device: this.device,
      id: this.id,
      buffers: new Map(this.buffers),
      compiledNodes,
      transientBuffers,
      transientAllocations: transientPlan,
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
      const buffer = getHandle(resource.buffer);
      this.assertBuffer(buffer);
      validateUseAgainstDescriptor(buffer, resource.usage);
    }
    this.nodeIds.add(node.id);
    this.nodes.push(node);
  }

  private addBuffer(buffer: GraphBufferHandle): GraphBufferHandle {
    if (this.buffers.has(buffer.id)) {
      throw new Error(`GPUCommandGraph buffer id "${buffer.id}" is already in use`);
    }
    this.buffers.set(buffer.id, buffer);
    return buffer;
  }

  private assertBuffer(buffer: GraphBufferHandle): void {
    if (buffer.graph !== this || this.buffers.get(buffer.id) !== buffer) {
      throw new Error(`Graph buffer "${buffer.id}" does not belong to ${this.id}`);
    }
  }

  private assertMutable(): void {
    if (this.compiled) {
      throw new Error(`GPUCommandGraph "${this.id}" has already been compiled`);
    }
  }
}

/** Executable, fixed-capacity command graph. */
export class CompiledGPUCommandGraph<Parameters = void> {
  readonly device: Device;
  readonly id: string;
  readonly stats: GPUCommandGraphStats;

  private readonly buffers: Map<string, GraphBufferHandle>;
  private readonly compiledNodes: CompiledNode<Parameters>[];
  private readonly transientBuffers: Map<GraphBufferHandle, Buffer>;
  private readonly transientAllocations: TransientAllocation[];
  private destroyed = false;

  /** @internal */
  constructor(props: {
    device: Device;
    id: string;
    buffers: Map<string, GraphBufferHandle>;
    compiledNodes: CompiledNode<Parameters>[];
    transientBuffers: Map<GraphBufferHandle, Buffer>;
    transientAllocations: TransientAllocation[];
    stats: GPUCommandGraphStats;
  }) {
    this.device = props.device;
    this.id = props.id;
    this.buffers = props.buffers;
    this.compiledNodes = props.compiledNodes;
    this.transientBuffers = props.transientBuffers;
    this.transientAllocations = props.transientAllocations;
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
    const getBuffer = (bufferOrView: GraphBufferHandle | GraphBufferView): Buffer => {
      const handle = getHandle(bufferOrView);
      const buffer = handle.transient
        ? this.transientBuffers.get(handle)
        : importedBuffers.get(handle);
      if (!buffer) {
        throw new Error(`GPUCommandGraph buffer "${handle.id}" is not bound`);
      }
      return buffer;
    };

    const baseContext: GPUCommandGraphEncodeContext<Parameters> = {
      commandEncoder,
      parameters: options.parameters,
      getBuffer
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
          const renderPass = commandEncoder.beginRenderPass(
            renderExecutable.getRenderPassProps?.(baseContext) ?? {id: node.id}
          );
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

  /** Releases compiled node resources and graph-owned transient buffers. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    for (const {executable} of this.compiledNodes) {
      executable.destroy?.();
    }
    for (const allocation of this.transientAllocations) {
      allocation.buffer?.destroy();
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
}

function getHandle(buffer: GraphBufferHandle | GraphBufferView): GraphBufferHandle {
  return buffer instanceof GraphBufferView ? buffer.buffer : buffer;
}

function getCoreBuffer(buffer: GraphImportedBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
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

function validateGraphBufferView(
  buffer: GraphBufferHandle,
  props: {length: number; byteOffset: number; byteStride: number; rowByteLength: number}
): void {
  for (const [name, value] of Object.entries(props)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Graph buffer view ${name} must be a non-negative safe integer`);
    }
  }
  if (props.length > 1 && props.byteStride === 0) {
    throw new Error('Graph buffer view byteStride must be positive for multiple rows');
  }
  if (props.rowByteLength > props.byteStride && props.length > 1) {
    throw new Error('Graph buffer view rowByteLength cannot exceed byteStride');
  }
  const byteLength =
    props.length === 0 ? 0 : (props.length - 1) * props.byteStride + props.rowByteLength;
  if (props.byteOffset + byteLength > buffer.byteLength) {
    throw new Error(`Graph buffer view exceeds buffer "${buffer.id}" byte length`);
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

function validateUseAgainstDescriptor(buffer: GraphBufferHandle, usage: GraphBufferUsage): void {
  const requiredUsage = getRequiredBufferUsage(usage);
  if ((buffer.usage & requiredUsage) !== requiredUsage) {
    throw new Error(
      `GPUCommandGraph buffer "${buffer.id}" does not declare usage required by ${usage}`
    );
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

function isReadUsage(usage: GraphBufferUsage): boolean {
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

function isWriteUsage(usage: GraphBufferUsage): boolean {
  return (
    usage === 'storage-write' || usage === 'storage-read-write' || usage === 'copy-destination'
  );
}

function getNodeOrder<Parameters>(
  nodes: GPUCommandGraphNode<Parameters>[]
): GPUCommandGraphNode<Parameters>[] {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const dependencies = new Map<string, Set<string>>();
  const lastWriter = new Map<GraphBufferHandle, string>();
  const activeReaders = new Map<GraphBufferHandle, Set<string>>();

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
      const handle = getHandle(resource.buffer);
      if (isReadUsage(resource.usage)) {
        const writer = lastWriter.get(handle);
        if (writer) {
          nodeDependencies.add(writer);
        }
        const readers = activeReaders.get(handle) ?? new Set<string>();
        readers.add(node.id);
        activeReaders.set(handle, readers);
      }
      if (isWriteUsage(resource.usage)) {
        const writer = lastWriter.get(handle);
        if (writer) {
          nodeDependencies.add(writer);
        }
        for (const reader of activeReaders.get(handle) ?? []) {
          if (reader !== node.id) {
            nodeDependencies.add(reader);
          }
        }
        activeReaders.set(handle, new Set());
        lastWriter.set(handle, node.id);
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

function getTransientAllocationPlan<Parameters>(
  nodes: GPUCommandGraphNode<Parameters>[],
  buffers: Iterable<GraphBufferHandle>
): TransientAllocation[] {
  const lifetimes = new Map<GraphBufferHandle, {firstUse: number; lastUse: number}>();
  nodes.forEach((node, nodeIndex) => {
    for (const resource of node.resources ?? []) {
      const handle = getHandle(resource.buffer);
      if (!handle.transient) {
        continue;
      }
      const lifetime = lifetimes.get(handle);
      if (lifetime) {
        lifetime.lastUse = nodeIndex;
      } else {
        lifetimes.set(handle, {firstUse: nodeIndex, lastUse: nodeIndex});
      }
    }
  });

  const allocations: TransientAllocation[] = [];
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
