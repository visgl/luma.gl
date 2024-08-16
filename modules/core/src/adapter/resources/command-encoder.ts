// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {TypedArray} from '@math.gl/types';
import {Device} from '../device';
import {Resource, ResourceProps} from './resource';
import {Buffer} from './buffer';
import {Texture} from './texture';
import {QuerySet} from './query-set';

// WEBGPU COMMAND ENCODER OPERATIONS

export type CopyBufferToBufferOptions = {
  sourceBuffer: Buffer;
  sourceOffset?: number;
  destinationBuffer: Buffer;
  destinationOffset?: number;
  size: number;
};

export type CopyBufferToTextureOptions = {
  sourceBuffer: Buffer;
  byteOffset?: number;
  destinationTexture: Texture;
  mipLevel?: number; //  = 0;
  origin?: [number, number, number] | number[];
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  bytesPerRow: number;
  rowsPerImage: number;
  size: [number, number, number] | number[];
};

export type CopyTextureToBufferOptions = {
  /** Texture to copy to/from. */
  sourceTexture: Texture;
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
  destinationBuffer: Buffer;
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
  sourceTexture: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  mipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy from. */
  origin?: number[];
  /** Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from. */
  aspect?: 'all' | 'stencil-only' | 'depth-only';

  /** Texture to copy to/from. */
  destinationTexture: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  destinationMipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to. */
  destinationOrigin?: number[];
  /** Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from. */
  destinationAspect?: 'all' | 'stencil-only' | 'depth-only';

  /** Width to copy */
  width?: number;
  height?: number;
  depthOrArrayLayers?: number;
};

// ADDITIONAL COMMAND ENCODER OPERATIONS DEFINED BY LUMA.GL

/** Options for clearing a texture mip level */
export type ClearTextureOptions = {
  /** Texture to Clear. */
  texture: Texture;
  /**  Mip-map level of the texture clear. (Default 0) */
  mipLevel?: number;
  /** Defines which aspects of the Texture to clear. */
  aspect?: 'all' | 'stencil-only' | 'depth-only';
};

// export type WriteBufferOptions = {
//   buffer: Buffer;
//   bufferOffset?: number;
//   data: BufferSource;
//   dataOffset?: number;
//   size?: number;
// };

// export type WriteTextureOptions = {
//   destination: Texture;
//   mipLevel?: number; //  = 0;
//   origin?: [number, number, number] | number[];
//   aspect?: 'all' | 'stencil-only' | 'depth-only';
//   data: BufferSource;
//   // dataLayout;
//   offset: number;
//   bytesPerRow: number;
//   rowsPerImage: number;
//   size: [number, number, number] | number[];
// };

export type CommandEncoderProps = ResourceProps & {
  measureExecutionTime?: boolean;
};

/**
 * Encodes commands to queue that can be executed later
 */
export abstract class CommandEncoder extends Resource<CommandEncoderProps> {
  static override defaultProps: Required<CommandEncoderProps> = {
    ...Resource.defaultProps,
    measureExecutionTime: undefined!
  };

  override get [Symbol.toStringTag](): string {
    return 'CommandEncoder';
  }

  constructor(device: Device, props: CommandEncoderProps) {
    super(device, props, CommandEncoder.defaultProps);
  }

  /** Completes recording of the commands sequence */
  abstract finish(): void; // TODO - return the CommandBuffer?

  /** Add a command that that copies data from a sub-region of a Buffer to a sub-region of another Buffer. */
  abstract copyBufferToBuffer(options: CopyBufferToBufferOptions): void;

  /** Add a command that copies data from a sub-region of a GPUBuffer to a sub-region of one or multiple continuous texture subresources. */
  abstract copyBufferToTexture(options: CopyBufferToTextureOptions): void;

  /** Add a command that copies data from a sub-region of one or multiple continuous texture subresources to a sub-region of a Buffer. */
  abstract copyTextureToBuffer(options: CopyTextureToBufferOptions): void;

  /** Add a command that copies data from a sub-region of one or multiple contiguous texture subresources to another sub-region of one or multiple continuous texture subresources. */
  abstract copyTextureToTexture(options: CopyTextureToTextureOptions): void;

  /** Add a command that clears a texture mip level. */
  // abstract clearTexture(options: ClearTextureOptions): void;

  // abstract readTexture(options: ReadTextureOptions): Promise<TypedArray>;

  /** Reads results from a query set into a GPU buffer. Values are 64 bits so byteLength must be querySet.props.count * 8 */
  abstract resolveQuerySet(
    querySet: QuerySet,
    destination: Buffer,
    options?: {
      firstQuery?: number;
      queryCount?: number;
      destinationOffset?: number;
    }
  ): void;

  /** Begins a labeled debug group containing subsequent commands */
  abstract pushDebugGroup(groupLabel: string): void;
  /** Ends the labeled debug group most recently started by pushDebugGroup() */
  abstract popDebugGroup(): void;
  /** Marks a point in a stream of commands with a label */
  abstract insertDebugMarker(markerLabel: string): void;

  // TODO - luma.gl has these on the device, should we align with WebGPU API?
  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;
}
