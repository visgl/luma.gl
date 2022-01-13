import {CommandEncoder, CommandEncoderProps} from '@luma.gl/api';
import type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
} from '@luma.gl/api';

import CommandBuffer from './webgl-command-buffer';
import WebGLDevice from '../webgl-device';

export default class WEBGLCommandEncoder extends CommandEncoder {
  readonly device: WebGLDevice;

  readonly commandBuffer = new CommandBuffer();

  constructor(device: WebGLDevice, props: CommandEncoderProps) {
    super(props);
    this.device = device;
  }

  destroy() {}

  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
  // finish(options?: {id?: string}): GPUCommandBuffer;

  copyBufferToBuffer(options: CopyBufferToBufferOptions): void {
    this.commandBuffer.commands.push({name: 'copy-buffer-to-buffer', options});
  }

  copyBufferToTexture(options: CopyBufferToTextureOptions) {
    this.commandBuffer.commands.push({name: 'copy-buffer-to-texture', options});
  }

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {
    this.commandBuffer.commands.push({name: 'copy-texture-to-buffer', options});
  }

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {
    this.commandBuffer.commands.push({name: 'copy-texture-to-texture', options});
  }

  pushDebugGroup(groupLabel: string): void {}
  popDebugGroup() {}

  insertDebugMarker(markerLabel: string): void {}

  // writeTimestamp(querySet: Query, queryIndex: number): void {}

  // resolveQuerySet(options: {
  //   querySet: GPUQuerySet,
  //   firstQuery: number,
  //   queryCount: number,
  //   destination: Buffer,
  //   destinationOffset?: number;
  // }): void;
};
