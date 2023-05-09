import {CommandEncoder, CommandEncoderProps, Buffer, Texture, cast} from '@luma.gl/api';
import {WebGPUDevice} from '../webgpu-device';
import WEBGPUBuffer from './webgpu-buffer';
import WebGPUTexture from './webgpu-texture';

export default class WebGPUCommandEncoder extends CommandEncoder {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandEncoder;

  constructor(device: WebGPUDevice, props: CommandEncoderProps) {
    super(props);
    this.device = device;
    this.handle = props.handle || this.device.handle.createCommandEncoder({
      // TODO was this removed in standard?
      // measureExecutionTime: this.props.measureExecutionTime
    });
    this.handle.label = this.props.id;
  }

  override destroy(): void {}

  finish(options?: {id?: string}): GPUCommandBuffer {
    return this.finish(options);
  }

  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;

  copyBufferToBuffer(options: {
    source: Buffer,
    sourceOffset?: number,
    destination: Buffer,
    destinationOffset?: number,
    size?: number
  }): void {
    this.handle.copyBufferToBuffer(
      cast<WEBGPUBuffer>(options.source).handle,
      options.sourceOffset ?? 0,
      cast<WEBGPUBuffer>(options.destination).handle,
      options.destinationOffset ?? 0,
      options.size ?? 0
    );
  }

  copyBufferToTexture(options: {
    source: Buffer,
    offset?: number,
    bytesPerRow: number,
    rowsPerImage: number,

    destination: Texture,
    mipLevel?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only',

    origin?: number[] | [number, number, number],
    extent?: number[] | [number, number, number]
  }): void {
    this.handle.copyBufferToTexture(
      {
        buffer: cast<WEBGPUBuffer>(options.source).handle,
        offset: options.offset ?? 0,
        bytesPerRow: options.bytesPerRow,
        rowsPerImage: options.rowsPerImage,
      },
      {
        texture: cast<WebGPUTexture>(options.destination).handle,
        mipLevel: options.mipLevel ?? 0,
        origin: options.origin ?? {},
        // aspect: options.aspect
      },
      {
        // TODO exclamation mark hack
        width: options.extent[0],
        height: options.extent[1],
        depthOrArrayLayers: options.extent[2]
      }
    );
  }

  copyTextureToBuffer(options: {
    source: GPUImageCopyTexture,
    destination: GPUImageCopyBuffer,
    copySize: GPUExtent3D
  }): void {}

  copyTextureToTexture(options: {
    source: GPUImageCopyTexture ,
    destination: GPUImageCopyTexture,
    copySize: GPUExtent3D
  }): void {}

  override pushDebugGroup(groupLabel: string): void {
    this.handle.pushDebugGroup(groupLabel);
  }

  override popDebugGroup(): void {
    this.handle.popDebugGroup();
  }

  override insertDebugMarker(markerLabel: string): void {
    this.handle.insertDebugMarker(markerLabel);
  }

  // writeTimestamp(querySet: Query, queryIndex: number): void {}

  // resolveQuerySet(options: {
  //   querySet: GPUQuerySet,
  //   firstQuery: number,
  //   queryCount: number,
  //   destination: Buffer,
  //   destinationOffset?: number;
  // }): void;
}