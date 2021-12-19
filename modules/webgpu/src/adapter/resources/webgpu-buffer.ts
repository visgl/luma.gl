// WEBGPU Buffer implementation
import {Buffer, BufferProps, assert} from '@luma.gl/api';
import type WebGPUDevice from '../webgpu-device';

function getByteLength(props: BufferProps): number {
  return props.byteLength >= 0 ? props.byteLength : props.data.byteLength;
}

export default class WebGPUBuffer extends Buffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUBuffer;
  readonly byteLength: number;

  constructor(device: WebGPUDevice, props: BufferProps) {
    super(device, props);
    this.device = device;

    this.byteLength = getByteLength(props);
    const mapBuffer = Boolean(props.data);

    this.handle = this.props.handle || this.createHandle(mapBuffer);
    this.handle.label = this.props.id;

    if (props.data) {
      this._writeMapped(props.data);
      // this.handle.writeAsync({data: props.data, map: false, unmap: false});
    }

    if (mapBuffer && !props.mappedAtCreation) {
      this.handle.unmap();
    }
  }

  protected createHandle(mapBuffer: boolean): GPUBuffer {
    return this.device.handle.createBuffer({
      size: this.byteLength,
      // usage defaults to vertex
      usage: this.props.usage || (GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST),
      mappedAtCreation: this.props.mappedAtCreation || mapBuffer
    });
  }

  destroy(): void {
    this.handle.destroy();
  }

  // WebGPU provides multiple ways to write a buffer...
  write(data: ArrayBufferView, byteOffset = 0) {
    this.device.handle.queue.writeBuffer(
      this.handle,
      byteOffset,
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }

  _writeMapped<TypedArray>(typedArray: TypedArray): void {
    const arrayBuffer = this.handle.getMappedRange();
    // @ts-expect-error
    new typedArray.constructor(arrayBuffer).set(typedArray);
  }

  // WEBGPU API

  mapAsync(mode: number, offset: number = 0, size?: number): Promise<void> {
    return this.handle.mapAsync(mode, offset, size);
  }

  getMappedRange(offset: number = 0, size?: number): ArrayBuffer {
    return this.handle.getMappedRange(offset, size);
  }

  unmap(): void {
    this.handle.unmap();
  }
}
