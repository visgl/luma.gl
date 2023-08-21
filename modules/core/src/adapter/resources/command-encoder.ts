// luma.gl, MIT license
import {Resource, ResourceProps} from './resource';
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
  destination: Texture;
  mipLevel?: number; //  = 0;
  origin?: [number, number, number] | number[];
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  data: BufferSource;
  // dataLayout;
  offset: number;
  bytesPerRow: number;
  rowsPerImage: number;
  size: [number, number, number] | number[];
}

export type CopyBufferToBufferOptions = {
  source: Buffer;
  sourceOffset?: number;
  destination: Buffer;
  destinationOffset?: number;
  size: number;
};

export type CopyBufferToTextureOptions = {
  source: Buffer;
  byteOffset?: number;
  destination: Texture;
  mipLevel?: number //  = 0;
  origin?: [number, number, number] | number[];
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  bytesPerRow: number;
  rowsPerImage: number;
  size: [number, number, number] | number[];
};

export type CopyTextureToBufferOptions = {
  /** Texture to copy to/from. */
  source: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  mipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to/from.
   * Together with `copySize`, defines the full copy sub-region.
   */
  /** Defines which aspects of the texture to copy to/from. */
  aspect?: 'all' | 'stencil-only' | 'depth-only';

  /** Width to copy */
  width?: number;
  height?: number;
  depthOrArrayLayers?: number;
  origin?: number[];

  /** Destination buffer */
  destination: Buffer;
  /** Offset, in bytes, from the beginning of the buffer to the start of the image data (default 0) */
  byteOffset?: number;
  /**
   * The stride, in bytes, between the beginning of each block row and the subsequent block row.
   * Required if there are multiple block rows (i.e. the copy height or depth is more than one block).
   */
  bytesPerRow?: number;
  /**
   * Number of block rows per single image of the texture.
   * rowsPerImage &times; bytesPerRow is the stride, in bytes, between the beginning of each image of data and the subsequent image.
   * Required if there are multiple images (i.e. the copy depth is more than one).
   */
  rowsPerImage?: number;
};

export type CopyTextureToTextureOptions = {
  /** Texture to copy to/from. */
  source: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  mipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy from. */
  /** Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from. */
  aspect?: 'all' | 'stencil-only' | 'depth-only';

  /** Texture to copy to/from. */
  destination: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  destinationMipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to. */
  destinationOrigin?: number[];
  /** Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from. */
  destinationAspect?: 'all' | 'stencil-only' | 'depth-only';

  origin?: number[];
  /** Width to copy */
  width?: number;
  height?: number;
  depthOrArrayLayers?: number;
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

/**
 * Encodes commands to queue that can be executed later
 */
export abstract class CommandEncoder extends Resource<CommandEncoderProps> {
  static override defaultProps: Required<CommandEncoderProps> = {
    ...Resource.defaultProps,
    measureExecutionTime: undefined
  };
  
  override get [Symbol.toStringTag](): string {
    return 'CommandEncoder';
  }

  constructor(props: CommandEncoderProps) {
    // @ts-expect-error
    super(props, DEFAULT_COMMAND_ENCODER_PROPS);
  }
  
  abstract finish(): void; // TODO - return the CommandBuffer?

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
