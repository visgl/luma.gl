// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  BufferAttribute,
  InstancedBufferAttribute,
  REVISION,
  StaticDrawUsage,
  type WebGPURenderer
} from 'three/webgpu';

// Three 0.185.1 has no public borrowed-buffer API. Keep its private contract here.
type AttributeBackend = {
  borrowedBufferBridge?: ThreeBufferBridge;
  isWebGPUBackend: boolean;
  device: unknown;
  get(attribute: BufferAttribute): {buffer?: GPUBuffer};
  delete(attribute: BufferAttribute): unknown;
  createAttribute(attribute: BufferAttribute): void;
  createIndexAttribute(attribute: BufferAttribute): void;
  updateAttribute(attribute: BufferAttribute): void;
  destroyAttribute(attribute: BufferAttribute): void;
};

/** Probe before attaching; this does not initialize or mutate either renderer. */
export function getThreeBufferBridgeSupport(
  device: Device,
  renderer: WebGPURenderer
): {supported: true} | {supported: false; reason: string} {
  const backend = renderer.backend as unknown as Partial<AttributeBackend>;
  if (REVISION !== '185') return {supported: false, reason: 'Requires Three revision 185'};
  if (device.type !== 'webgpu' || !backend?.isWebGPUBackend)
    return {supported: false, reason: 'Requires a WebGPU device and renderer'};
  if (!backend.device)
    return {supported: false, reason: 'Initialize the Three renderer before attaching'};
  if (backend.device !== device.handle)
    return {supported: false, reason: 'Requires the same WebGPU device'};
  for (const method of [
    'get',
    'delete',
    'createAttribute',
    'createIndexAttribute',
    'updateAttribute',
    'destroyAttribute'
  ] as const) {
    if (typeof backend[method] !== 'function')
      return {supported: false, reason: 'Unsupported Three attribute backend'};
  }
  if (backend.borrowedBufferBridge)
    return {supported: false, reason: 'A ThreeBufferBridge is already attached to this renderer'};
  return {supported: true};
}

/** Borrows luma vertex and index buffers into an initialized upstream Three renderer. */
export class ThreeBufferBridge {
  private readonly backend: AttributeBackend;
  private readonly attributes = new WeakMap<BufferAttribute, Buffer>();
  private readonly renderedAttributes = new Set<BufferAttribute>();
  private readonly originalCreateAttribute: AttributeBackend['createAttribute'];
  private readonly originalCreateIndexAttribute: AttributeBackend['createIndexAttribute'];
  private readonly originalUpdateAttribute: AttributeBackend['updateAttribute'];
  private readonly originalDestroyAttribute: AttributeBackend['destroyAttribute'];
  private disposed = false;

  constructor(
    private readonly device: Device,
    renderer: WebGPURenderer
  ) {
    const support = getThreeBufferBridgeSupport(device, renderer);
    if (!support.supported) throw new Error(support.reason);
    const backend = renderer.backend as unknown as AttributeBackend;
    backend.borrowedBufferBridge = this;
    this.backend = backend;
    this.originalCreateAttribute = backend.createAttribute;
    this.originalCreateIndexAttribute = backend.createIndexAttribute;
    this.originalUpdateAttribute = backend.updateAttribute;
    this.originalDestroyAttribute = backend.destroyAttribute;
    backend.createAttribute = attribute => {
      if (!this.bindAttribute(attribute, Buffer.VERTEX))
        this.originalCreateAttribute.call(backend, attribute);
    };
    backend.createIndexAttribute = attribute => {
      if (!this.bindAttribute(attribute, Buffer.INDEX))
        this.originalCreateIndexAttribute.call(backend, attribute);
    };
    backend.updateAttribute = attribute => {
      if (this.attributes.has(attribute))
        throw new Error('Update borrowed attributes through luma; CPU needsUpdate is unsupported');
      this.originalUpdateAttribute.call(backend, attribute);
    };
    backend.destroyAttribute = attribute => {
      if (this.attributes.has(attribute)) {
        backend.delete(attribute);
        this.renderedAttributes.delete(attribute);
      } else this.originalDestroyAttribute.call(backend, attribute);
    };
  }

  /** Float32 metadata only: this array is never uploaded; luma owns the GPU bytes. */
  createAttribute(buffer: Buffer, itemSize: 1 | 2 | 3 | 4, count: number): BufferAttribute {
    this.validateBuffer(buffer, Buffer.VERTEX, count * itemSize * 4, count);
    const attribute = new BufferAttribute(new Float32Array(count * itemSize), itemSize);
    attribute.setUsage(StaticDrawUsage);
    this.attributes.set(attribute, buffer);
    return attribute;
  }

  /** Packed Float32 instance data; one element is consumed per instance. */
  createInstancedAttribute(
    buffer: Buffer,
    itemSize: 1 | 2 | 3 | 4,
    count: number
  ): InstancedBufferAttribute {
    this.validateBuffer(buffer, Buffer.VERTEX, count * itemSize * 4, count);
    const attribute = new InstancedBufferAttribute(new Float32Array(count * itemSize), itemSize);
    attribute.setUsage(StaticDrawUsage);
    this.attributes.set(attribute, buffer);
    return attribute;
  }

  /** Metadata only. Uses the luma buffer's indexType without converting GPU bytes. */
  createIndexAttribute(buffer: Buffer, count: number): BufferAttribute {
    // Match luma's canonical index metadata without converting the borrowed bytes.
    if (buffer.indexType !== 'uint16' && buffer.indexType !== 'uint32')
      throw new Error('Expected uint16 or uint32 index metadata');
    const ArrayType = buffer.indexType === 'uint16' ? Uint16Array : Uint32Array;
    this.validateBuffer(buffer, Buffer.INDEX, count * ArrayType.BYTES_PER_ELEMENT, count);
    const attribute = new BufferAttribute(new ArrayType(count), 1);
    attribute.setUsage(StaticDrawUsage);
    this.attributes.set(attribute, buffer);
    return attribute;
  }

  private validateBuffer(buffer: Buffer, usage: number, byteLength: number, count: number): void {
    if (this.disposed || buffer.destroyed || buffer.device !== this.device)
      throw new Error('Expected a live buffer owned by the bridge device');
    // The borrowed buffer must cover the packed attribute and support its binding role.
    if (
      !(buffer.usage & usage) ||
      !Number.isInteger(count) ||
      count < 1 ||
      buffer.byteLength < byteLength
    )
      throw new Error('Expected buffer usage and byte length covering the requested attribute');
  }

  private bindAttribute(attribute: BufferAttribute, usage: number): boolean {
    const buffer = this.attributes.get(attribute);
    if (!buffer) return false;
    this.validateBuffer(buffer, usage, attribute.array.byteLength, attribute.count);
    this.backend.get(attribute).buffer = buffer.handle as GPUBuffer;
    this.renderedAttributes.add(attribute);
    return true;
  }

  /** Dispose geometries first so Three can forget its borrowed attribute caches. */
  dispose(): void {
    if (this.disposed) return;
    if (this.renderedAttributes.size)
      throw new Error('Dispose rendered geometries before disposing ThreeBufferBridge');
    this.backend.createAttribute = this.originalCreateAttribute;
    this.backend.createIndexAttribute = this.originalCreateIndexAttribute;
    this.backend.updateAttribute = this.originalUpdateAttribute;
    this.backend.destroyAttribute = this.originalDestroyAttribute;
    delete this.backend.borrowedBufferBridge;
    this.disposed = true;
  }
}
