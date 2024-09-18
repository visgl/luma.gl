// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CommandEncoder, CommandEncoderProps, Buffer, Texture} from '@luma.gl/core';
import type {CopyTextureToTextureOptions, CopyTextureToBufferOptions} from '@luma.gl/core';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPUTexture} from './webgpu-texture';
import {WebGPUQuerySet} from './webgpu-query-set';

export class WebGPUCommandEncoder extends CommandEncoder {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandEncoder;

  constructor(device: WebGPUDevice, props: CommandEncoderProps) {
    super(device, props);
    this.device = device;
    this.handle =
      props.handle ||
      this.device.handle.createCommandEncoder({
        label: this.props.id
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

  copyBufferToBuffer(options: // CopyBufferToBufferOptions
  {
    sourceBuffer: Buffer;
    sourceOffset?: number;
    destinationBuffer: Buffer;
    destinationOffset?: number;
    size?: number;
  }): void {
    const webgpuSourceBuffer = options.sourceBuffer as WebGPUBuffer;
    const WebGPUDestinationBuffer = options.destinationBuffer as WebGPUBuffer;
    this.handle.copyBufferToBuffer(
      webgpuSourceBuffer.handle,
      options.sourceOffset ?? 0,
      WebGPUDestinationBuffer.handle,
      options.destinationOffset ?? 0,
      options.size ?? 0
    );
  }

  copyBufferToTexture(options: // CopyBufferToTextureOptions
  {
    sourceBuffer: Buffer;
    offset?: number;
    bytesPerRow: number;
    rowsPerImage: number;

    destinationTexture: Texture;
    mipLevel?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only';

    origin?: number[] | [number, number, number];
    extent?: number[] | [number, number, number];
  }): void {
    const webgpuSourceBuffer = options.sourceBuffer as WebGPUBuffer;
    const WebGPUDestinationTexture = options.destinationTexture as WebGPUTexture;
    this.handle.copyBufferToTexture(
      {
        buffer: webgpuSourceBuffer.handle,
        offset: options.offset ?? 0,
        bytesPerRow: options.bytesPerRow,
        rowsPerImage: options.rowsPerImage
      },
      {
        texture: WebGPUDestinationTexture.handle,
        mipLevel: options.mipLevel ?? 0,
        origin: options.origin ?? {}
        // aspect: options.aspect
      },
      {
        // @ts-ignore
        width: options.extent?.[0],
        height: options.extent?.[1],
        depthOrArrayLayers: options.extent?.[2]
      }
    );
  }

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {
    // this.handle.copyTextureToBuffer(
    //   // source
    //   {},
    //   // destination
    //   {},
    //   // copySize
    //   {}
    // );
  }

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {
    // this.handle.copyTextureToTexture(
    //   // source
    //   {},
    //   // destination
    //   {},
    //   // copySize
    //   {}
    // );
  }

  override pushDebugGroup(groupLabel: string): void {
    this.handle.pushDebugGroup(groupLabel);
  }

  override popDebugGroup(): void {
    this.handle.popDebugGroup();
  }

  override insertDebugMarker(markerLabel: string): void {
    this.handle.insertDebugMarker(markerLabel);
  }

  override resolveQuerySet(
    querySet: WebGPUQuerySet,
    destination: Buffer,
    options?: {
      firstQuery?: number;
      queryCount?: number;
      destinationOffset?: number;
    }
  ): void {
    const webgpuQuerySet = querySet;
    const webgpuBuffer = destination as WebGPUBuffer;
    this.handle.resolveQuerySet(
      webgpuQuerySet.handle,
      options?.firstQuery || 0,
      options?.queryCount || querySet.props.count - (options?.firstQuery || 0),
      webgpuBuffer.handle,
      options?.destinationOffset || 0
    );
  }
}

/*
  // setDataFromTypedArray(data): this {
  //   const textureDataBuffer = this.device.handle.createBuffer({
  //     size: data.byteLength,
  //     usage: Buffer.COPY_DST | Buffer.COPY_SRC,
  //     mappedAtCreation: true
  //   });
  //   new Uint8Array(textureDataBuffer.getMappedRange()).set(data);
  //   textureDataBuffer.unmap();

  //   this.setBuffer(textureDataBuffer);

  //   textureDataBuffer.destroy();
  //   return this;
  // }

 */
