// WEBGPU Buffer implementation
import {Buffer, BufferProps} from '@luma.gl/api';
import WebGPUDevice from './webgpu-device';

export default class WebGPUBuffer extends Buffer {
  readonly device: WebGPUDevice;
  readonly handle: GPUBuffer;

  constructor(device: WebGPUDevice, props: BufferProps) {
    super(device, props);

    this.handle = this.props.handle || this.createHandle();
    this.handle.label = this.props.id;

    if (props.data) {
      // this.handle.writeAsync({data: props.data, map: false, unmap: false});
    }

    if (!props.mappedAtCreation) {
      this.handle.unmap();
    }
  }

  protected createHandle(): GPUBuffer {
    return this.device.handle.createBuffer({
      size: this.props.byteLength,
      usage: this.props.usage || (GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC),
      mappedAtCreation: this.props.mappedAtCreation
    });
  }

  destroy(): void {
    this.handle.destroy();
  }

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
