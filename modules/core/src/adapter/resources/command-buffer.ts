// luma.gl, MIT license
import {Resource, ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

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

export type CommandBufferProps = ResourceProps & {
};

const DEFAULT_COMMAND_ENCODER_PROPS = {
  ...DEFAULT_RESOURCE_PROPS
};

/**
 * Encodes commands to queue that can be executed later
 */
export abstract class CommandBuffer extends Resource<CommandBufferProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandBuffer';
  }

  constructor(props: CommandBufferProps) {
    // @ts-expect-error
    super(props, DEFAULT_COMMAND_ENCODER_PROPS);
  }
}
