// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '../device';
import {Resource, ResourceProps} from './resource';

// interface Queue {
//   submit(commandBuffers);

//   // onSubmittedWorkDone(): Promise<undefined>;

//   writeBuffer(options: WriteBufferOptions): void;
//   writeTexture(options: TextureWriteOptions): void;

//   // copyExternalImageToTexture(
//   //   GPUImageCopyExternalImage source,
//   //   GPUImageCopyTextureTagged destination,
//   //   GPUExtent3D copySize
//   // ): void;
// }

export type CommandBufferProps = ResourceProps & {};

/**
 * Represents the finished contents of exactly one CommandEncoder. Backends may store native
 * command buffers or replayable command lists internally.
 *
 * On WebGPU, a `CommandBuffer` contains deferred work that becomes visible when submitted.
 * On WebGL, command encoding is immediate, so a `CommandBuffer` mainly acts as a compatibility
 * object for `finish()` / `submit()` call sites and default encoder lifecycle management.
 */
export abstract class CommandBuffer extends Resource<CommandBufferProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandBuffer';
  }

  constructor(device: Device, props: CommandBufferProps) {
    super(device, props, CommandBuffer.defaultProps);
  }

  static override defaultProps: Required<CommandBufferProps> = {
    ...Resource.defaultProps
  };
}
