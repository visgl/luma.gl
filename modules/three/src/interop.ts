// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {BufferAttribute, StaticDrawUsage, type WebGPURenderer} from 'three/webgpu';

// Three 0.185.1 has no public borrowed-buffer API. Keep its private contract here.
type AttributeBackend = {
  borrowedBufferBridge?: ThreeBufferBridge;
  isWebGPUBackend: boolean;
  device: unknown;
  get(attribute: BufferAttribute): {buffer?: GPUBuffer};
  delete(attribute: BufferAttribute): unknown;
  createAttribute(attribute: BufferAttribute): void;
  updateAttribute(attribute: BufferAttribute): void;
  destroyAttribute(attribute: BufferAttribute): void;
};

/** Borrows luma vertex buffers into an initialized upstream Three WebGPU renderer. */
export class ThreeBufferBridge {
  private readonly backend: AttributeBackend;
  private readonly attributes = new WeakMap<BufferAttribute, Buffer>();
  private readonly renderedAttributes = new Set<BufferAttribute>();
  private readonly originalCreateAttribute: AttributeBackend['createAttribute'];
  private readonly originalUpdateAttribute: AttributeBackend['updateAttribute'];
  private readonly originalDestroyAttribute: AttributeBackend['destroyAttribute'];
  private disposed = false;

  constructor(
    private readonly device: Device,
    renderer: WebGPURenderer
  ) {
    const backend = renderer.backend as unknown as AttributeBackend;
    if (device.type !== 'webgpu' || !backend.isWebGPUBackend || backend.device !== device.handle)
      throw new Error(
        'ThreeBufferBridge requires an initialized renderer on the same WebGPU device'
      );
    if (backend.borrowedBufferBridge)
      throw new Error('A ThreeBufferBridge is already attached to this renderer');
    backend.borrowedBufferBridge = this;
    this.backend = backend;
    this.originalCreateAttribute = backend.createAttribute;
    this.originalUpdateAttribute = backend.updateAttribute;
    this.originalDestroyAttribute = backend.destroyAttribute;
    backend.createAttribute = attribute => {
      const buffer = this.attributes.get(attribute);
      if (buffer) {
        if (buffer.destroyed) throw new Error('Borrowed vertex buffer was destroyed');
        backend.get(attribute).buffer = buffer.handle as GPUBuffer;
        this.renderedAttributes.add(attribute);
      } else this.originalCreateAttribute.call(backend, attribute);
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
    if (this.disposed || buffer.destroyed || buffer.device !== this.device)
      throw new Error('Expected a live buffer owned by the bridge device');
    if (
      !(buffer.usage & Buffer.VERTEX) ||
      count < 1 ||
      !Number.isInteger(count) ||
      buffer.byteLength < count * itemSize * 4
    )
      throw new Error('Expected a Float32 vertex buffer covering the requested attribute');
    const attribute = new BufferAttribute(new Float32Array(count * itemSize), itemSize);
    attribute.setUsage(StaticDrawUsage);
    this.attributes.set(attribute, buffer);
    return attribute;
  }

  /** Dispose geometries first so Three can forget its borrowed attribute caches. */
  dispose(): void {
    if (this.disposed) return;
    if (this.renderedAttributes.size)
      throw new Error('Dispose rendered geometries before disposing ThreeBufferBridge');
    this.backend.createAttribute = this.originalCreateAttribute;
    this.backend.updateAttribute = this.originalUpdateAttribute;
    this.backend.destroyAttribute = this.originalDestroyAttribute;
    delete this.backend.borrowedBufferBridge;
    this.disposed = true;
  }
}
