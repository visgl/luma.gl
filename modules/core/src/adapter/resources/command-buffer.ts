// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '../device';
import {Resource, ResourceProps} from './resource';

// interface Queue {
//   submit(commandBuffers);

//   // onSubmittedWorkDone(): Promise<undefined>;

//   writeBuffer(options: WriteBufferOptions): void;
//   writeTexture(options: WriteTextureOptions): void;

//   // copyExternalImageToTexture(
//   //   GPUImageCopyExternalImage source,
//   //   GPUImageCopyTextureTagged destination,
//   //   GPUExtent3D copySize
//   // ): void;
// }

export type CommandBufferProps = ResourceProps & {};

/**
 * Encodes commands to queue that can be executed later
 */
export abstract class CommandBuffer extends Resource<CommandBufferProps> {
  static override defaultProps: Required<CommandBufferProps> = {
    ...Resource.defaultProps
  };

  override get [Symbol.toStringTag](): string {
    return 'CommandBuffer';
  }

  constructor(device: Device, props: CommandBufferProps) {
    super(device, props, CommandBuffer.defaultProps);
  }
}
