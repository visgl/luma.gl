// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {TypedArray} from '@math.gl/types';
import {Device} from '../device';
import {Resource, ResourceProps} from './resource';
import {QuerySet} from './query-set';
import {Buffer} from './buffer';
import {Texture} from './texture';
import type {RenderPass, RenderPassProps} from './render-pass';
import type {ComputePass, ComputePassProps} from './compute-pass';
import type {CommandBuffer, CommandBufferProps} from './command-buffer';

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
  origin?: [number, number, number];
  aspect?: 'all' | 'stencil-only' | 'depth-only';
  bytesPerRow: number;
  rowsPerImage: number;
  size: [number, number, number];
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
  origin?: [number, number, number];

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
  origin?: [number, number, number];
  /** Defines which aspects of the {@link GPUImageCopyTexture#texture} to copy to/from. */
  aspect?: 'all' | 'stencil-only' | 'depth-only';

  /** Texture to copy to/from. */
  destinationTexture: Texture;
  /**  Mip-map level of the texture to copy to/from. (Default 0) */
  destinationMipLevel?: number;
  /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to. */
  destinationOrigin?: [number, number, number];
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

// export type TextureWriteOptions = {
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
  timeProfilingQuerySet?: QuerySet | null;
};

type PassWithTimestamps = {
  timestampQuerySet?: QuerySet;
  beginTimestampIndex?: number;
  endTimestampIndex?: number;
};

/**
 * Records commands onto a single backend command encoder and can finish them into one command
 * buffer.
 *
 * On WebGPU, this is a true deferred recording surface: commands are collected until
 * {@link CommandEncoder.finish} and do not execute until {@link Device.submit}.
 *
 * On WebGL, this is an immediate-mode compatibility surface: commands execute as they are encoded,
 * and {@link Device.submit} only finalizes frame bookkeeping and the default encoder lifecycle.
 *
 * Resource helpers invoked through a `CommandEncoder` must record onto that encoder rather than
 * allocating hidden encoders or submitting work eagerly.
 */
export abstract class CommandEncoder extends Resource<CommandEncoderProps> {
  override get [Symbol.toStringTag](): string {
    return 'CommandEncoder';
  }

  protected _timeProfilingQuerySet: QuerySet | null = null;
  protected _timeProfilingSlotCount: number = 0;
  _gpuTimeMs?: number;

  constructor(device: Device, props: CommandEncoderProps) {
    super(device, props, CommandEncoder.defaultProps);
    this._timeProfilingQuerySet = props.timeProfilingQuerySet ?? null;
    this._timeProfilingSlotCount = 0;
    this._gpuTimeMs = undefined;
  }

  /**
   * Completes recording of the command sequence and returns a {@link CommandBuffer}.
   *
   * On WebGPU, the returned command buffer owns deferred work that will execute on
   * {@link Device.submit}. On WebGL, the returned command buffer primarily represents already
   * executed work and is kept for cross-backend API compatibility.
   */
  abstract finish(props?: CommandBufferProps): CommandBuffer;

  /**
   * Creates a {@link RenderPass} on this encoder.
   *
   * On WebGPU, pass commands are deferred until the finished command buffer is submitted. On
   * WebGL, the pass executes immediately as draw calls are encoded.
   */
  abstract beginRenderPass(props?: RenderPassProps): RenderPass;

  /**
   * Creates a {@link ComputePass} on this encoder.
   *
   * On WebGPU, compute commands are deferred until the finished command buffer is submitted.
   * WebGL does not support compute passes.
   */
  abstract beginComputePass(props?: ComputePassProps): ComputePass;

  /**
   * Copies data from a sub-region of a buffer to a sub-region of another buffer.
   *
   * On WebGPU, the copy is deferred until {@link Device.submit}. On WebGL, it executes
   * immediately when encoded.
   */
  abstract copyBufferToBuffer(options: CopyBufferToBufferOptions): void;

  /**
   * Copies data from a sub-region of a buffer to one or more continuous texture subresources.
   *
   * On WebGPU, the copy is deferred until {@link Device.submit}. On WebGL, it executes
   * immediately when encoded.
   */
  abstract copyBufferToTexture(options: CopyBufferToTextureOptions): void;

  /**
   * Copies data from one or more continuous texture subresources into a buffer.
   *
   * On WebGPU, the copy is deferred until {@link Device.submit}. On WebGL, it executes
   * immediately when encoded.
   */
  abstract copyTextureToBuffer(options: CopyTextureToBufferOptions): void;

  /**
   * Copies data between texture subresources.
   *
   * On WebGPU, the copy is deferred until {@link Device.submit}. On WebGL, it executes
   * immediately when encoded.
   */
  abstract copyTextureToTexture(options: CopyTextureToTextureOptions): void;

  /** Add a command that clears a texture mip level. */
  // abstract clearTexture(options: ClearTextureOptions): void;

  // abstract readTexture(options: TextureReadOptions): Promise<TypedArray>;

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

  /**
   * Reads all resolved timestamp pairs on the current profiler query set and caches the sum
   * as milliseconds on this encoder.
   */
  async resolveTimeProfilingQuerySet(): Promise<void> {
    this._gpuTimeMs = undefined;

    if (!this._timeProfilingQuerySet) {
      return;
    }

    const pairCount = Math.floor(this._timeProfilingSlotCount / 2);
    if (pairCount <= 0) {
      return;
    }

    const queryCount = pairCount * 2;
    const results = await this._timeProfilingQuerySet.readResults({
      firstQuery: 0,
      queryCount
    });

    let totalDurationNanoseconds = 0n;
    for (let queryIndex = 0; queryIndex < queryCount; queryIndex += 2) {
      totalDurationNanoseconds += results[queryIndex + 1] - results[queryIndex];
    }

    this._gpuTimeMs = Number(totalDurationNanoseconds) / 1e6;
  }

  /** Returns the number of query slots consumed by automatic pass profiling on this encoder. */
  getTimeProfilingSlotCount(): number {
    return this._timeProfilingSlotCount;
  }

  getTimeProfilingQuerySet(): QuerySet | null {
    return this._timeProfilingQuerySet;
  }

  /** Internal helper for auto-assigning timestamp slots to render/compute passes on this encoder. */
  protected _applyTimeProfilingToPassProps<P extends PassWithTimestamps>(props?: P): P {
    const passProps = (props || {}) as P;

    if (!this._supportsTimestampQueries() || !this._timeProfilingQuerySet) {
      return passProps;
    }

    if (
      passProps.timestampQuerySet !== undefined ||
      passProps.beginTimestampIndex !== undefined ||
      passProps.endTimestampIndex !== undefined
    ) {
      return passProps;
    }

    const beginTimestampIndex = this._timeProfilingSlotCount;
    if (beginTimestampIndex + 1 >= this._timeProfilingQuerySet.props.count) {
      return passProps;
    }

    this._timeProfilingSlotCount += 2;

    return {
      ...passProps,
      timestampQuerySet: this._timeProfilingQuerySet,
      beginTimestampIndex,
      endTimestampIndex: beginTimestampIndex + 1
    };
  }

  protected _supportsTimestampQueries(): boolean {
    return this.device.features.has('timestamp-query');
  }

  /** Begins a labeled debug group containing subsequent commands */
  abstract pushDebugGroup(groupLabel: string): void;
  /** Ends the labeled debug group most recently started by pushDebugGroup() */
  abstract popDebugGroup(): void;
  /** Marks a point in a stream of commands with a label */
  abstract insertDebugMarker(markerLabel: string): void;

  // TODO - luma.gl has these on the device, should we align with WebGPU API?
  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;

  static override defaultProps: Required<CommandEncoderProps> = {
    ...Resource.defaultProps,
    measureExecutionTime: undefined!,
    timeProfilingQuerySet: undefined!
  };
}
