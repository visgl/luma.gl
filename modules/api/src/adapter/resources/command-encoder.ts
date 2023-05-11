// luma.gl, MIT license
import {Resource, ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import {Buffer} from './buffer';
import {Texture} from './texture';

export type WriteBufferOptions = {
  buffer: Buffer,
  bufferOffset?: number,
  data: BufferSource,
  dataOffset?: number,
  size?: number
};

export type WriteTextureOptions = {
  destination: Texture,
  mipLevel?: number //  = 0;
  origin?: [number, number, number] | number[],
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  data: BufferSource,
  // dataLayout,
  offset: number,
  bytesPerRow: number,
  rowsPerImage: number,
  size: [number, number, number] | number[],
}

export type CopyBufferToBufferOptions = {
  source: Buffer,
  sourceOffset?: number,
  destination: Buffer,
  destinationOffset?: number,
  size: number
};

export type CopyBufferToTextureOptions = {
  destination: Texture,
  mipLevel?: number //  = 0;
  origin?: [number, number, number] | number[],
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  source: Buffer,
  offset: number,
  bytesPerRow: number,
  rowsPerImage: number,
  size: [number, number, number] | number[],
};

export type CopyTextureToBufferOptions = {
  // source: GPUImageCopyTexture,
  // destination: GPUImageCopyBuffer,
  // copySize: GPUExtent3D
};

export type CopyTextureToTextureOptions = {
  // source: GPUImageCopyTexture ,
  // destination: GPUImageCopyTexture,
  // copySize: GPUExtent3D
};

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

export type CommandEncoderProps = ResourceProps & {
  measureExecutionTime?: boolean;
};

const DEFAULT_COMMAND_ENCODER_PROPS = {
  ...DEFAULT_RESOURCE_PROPS
};

/**
 * Encodes commands to queue that can be executed later
 */
export abstract class CommandEncoder extends Resource<CommandEncoderProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandEncoder';
  }

  constructor(props: CommandEncoderProps) {
    // @ts-expect-error
    super(props, DEFAULT_COMMAND_ENCODER_PROPS);
  }

  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
  // finish(options?: {id?: string}): GPUCommandBuffer;

  abstract copyBufferToBuffer(options: CopyBufferToBufferOptions): void;

  abstract copyBufferToTexture(options: CopyBufferToTextureOptions): void;

  abstract copyTextureToBuffer(options: CopyTextureToBufferOptions): void;

  abstract copyTextureToTexture(options: CopyTextureToTextureOptions): void;

  pushDebugGroup(groupLabel: string): void {}

  popDebugGroup() {}

  insertDebugMarker(markerLabel: string): void {}

  // writeTimestamp(querySet: Query, queryIndex: number): void;

  // resolveQuerySet(options: {
  //   querySet: GPUQuerySet,
  //   firstQuery: number,
  //   queryCount: number,
  //   destination: Buffer,
  //   destinationOffset?: number;
  // }): void;
}
