// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  RenderPassProps,
  ComputePassProps,
  CopyBufferToTextureOptions,
  CopyTextureToTextureOptions,
  CopyTextureToBufferOptions
} from '../../../index';
import {CommandEncoder, CommandEncoderProps, Buffer} from '../../../index';
import {WebGPUDevice} from '../webgpu-device';
import {WebGPUCommandBuffer} from './webgpu-command-buffer';
import {WebGPUBuffer} from './webgpu-buffer';
import {WebGPURenderPass} from './webgpu-render-pass';
import {WebGPUComputePass} from './webgpu-compute-pass';
import {WebGPUTexture} from './webgpu-texture';
import {WebGPUQuerySet} from './webgpu-query-set';
import {WebGPUTimestampSnapshot} from './webgpu-timestamp-snapshot';

export class WebGPUCommandEncoder extends CommandEncoder {
  readonly device: WebGPUDevice;
  readonly handle: GPUCommandEncoder;
  private _timestampSnapshotsTransferred = false;
  private _timestampSnapshots = new Map<WebGPUQuerySet, WebGPUTimestampSnapshot>();
  private _transientUploadBuffers: WebGPUBuffer[] = [];

  constructor(device: WebGPUDevice, props: CommandEncoderProps = {}) {
    super(device, props);
    this.device = device;
    const suppliedHandle = props.handle as GPUCommandEncoder | undefined;
    this.handle =
      suppliedHandle ||
      this.device.handle.createCommandEncoder({
        label: this.props.id
        // TODO was this removed in standard?
        // measureExecutionTime: this.props.measureExecutionTime
      });
    this.handle.label = this.props.id;
  }

  override destroy(): void {
    for (const uploadBuffer of this._transientUploadBuffers) {
      uploadBuffer.destroy();
    }
    this._transientUploadBuffers = [];
    if (!this._timestampSnapshotsTransferred) {
      for (const snapshot of this._timestampSnapshots.values()) snapshot.destroy();
    }
    this.destroyResource();
  }

  finish(): WebGPUCommandBuffer {
    this.device.pushErrorScope('validation');
    for (const snapshot of this._timestampSnapshots.values()) snapshot.encodeResolve(this.handle);
    const commandBuffer = new WebGPUCommandBuffer(this, {
      id: this.id,
      userData: this.userData
    });
    this.device.popErrorScope((error: GPUError) => {
      const message = `${this} command encoding: ${error.message}. Maybe add depthWriteEnabled to your Model?`;
      this.device.reportError(new Error(message), this)();
      this.device.debug();
    });
    this.destroy();
    return commandBuffer;
  }

  /** Retains staging uploads until the finished command buffer has been submitted. */
  trackTransientUploadBuffer(buffer: WebGPUBuffer): void {
    this._transientUploadBuffers.push(buffer);
  }

  /** Transfers staging-upload ownership to the finished command buffer. */
  takeTransientUploadBuffers(): WebGPUBuffer[] {
    const transientUploadBuffers = this._transientUploadBuffers;
    this._transientUploadBuffers = [];
    return transientUploadBuffers;
  }

  /**
   * Allows a render pass to begin against a canvas context
   * @todo need to support a "Framebuffer" equivalent (aka preconfigured RenderPassDescriptors?).
   */
  beginRenderPass(props: RenderPassProps = {}): WebGPURenderPass {
    const pass = new WebGPURenderPass(
      this.device,
      this._applyTimeProfilingToPassProps(props),
      this.handle
    );
    this.trackTimestampPass(pass.props);
    return pass;
  }

  beginComputePass(props: ComputePassProps = {}): WebGPUComputePass {
    const pass = new WebGPUComputePass(
      this.device,
      this._applyTimeProfilingToPassProps(props),
      this.handle
    );
    this.trackTimestampPass(pass.props);
    return pass;
  }

  override captureTimestampQuerySet(querySet: WebGPUQuerySet): WebGPUTimestampSnapshot {
    let snapshot = this._timestampSnapshots.get(querySet);
    if (!snapshot) {
      snapshot = new WebGPUTimestampSnapshot(this.device, querySet);
      this._timestampSnapshots.set(querySet, snapshot);
    }
    return snapshot;
  }

  /** Transfer ownership to the command buffer; keep references for profiler reads. */
  takeTimestampSnapshots(): WebGPUTimestampSnapshot[] {
    const snapshots = Array.from(this._timestampSnapshots.values());
    // finish() destroys the encoder, but readback consumers retain the snapshots themselves.
    this._timestampSnapshotsTransferred = true;
    return snapshots;
  }

  private trackTimestampPass(props: RenderPassProps | ComputePassProps): void {
    if (
      props.timestampQuerySet &&
      props.beginTimestampIndex !== undefined &&
      props.endTimestampIndex !== undefined
    ) {
      const snapshot = this.captureTimestampQuerySet(props.timestampQuerySet as WebGPUQuerySet);
      snapshot.addPair(props.beginTimestampIndex, props.endTimestampIndex);
      if (props.timestampQuerySet === this.getTimeProfilingQuerySet())
        this._profilingSnapshot = snapshot;
    }
  }

  private _profilingSnapshot: WebGPUTimestampSnapshot | undefined;

  override async resolveTimeProfilingQuerySet(): Promise<void> {
    if (!this._profilingSnapshot) return;
    const results = await this._profilingSnapshot.readResults();
    let duration = 0n;
    for (let index = 0; index < this.getTimeProfilingSlotCount(); index += 2) {
      duration += results[index + 1] - results[index];
    }
    this._gpuTimeMs = Number(duration) / 1e6;
  }

  // beginRenderPass(GPURenderPassDescriptor descriptor): GPURenderPassEncoder;
  // beginComputePass(optional GPUComputePassDescriptor descriptor = {}): GPUComputePassEncoder;

  copyBufferToBuffer(options: {
    sourceBuffer: Buffer;
    sourceOffset?: number;
    destinationBuffer: Buffer;
    destinationOffset?: number;
    size?: number;
  }): void {
    const webgpuSourceBuffer = options.sourceBuffer as WebGPUBuffer;
    const webgpuDestinationBuffer = options.destinationBuffer as WebGPUBuffer;
    this.handle.copyBufferToBuffer(
      webgpuSourceBuffer.handle,
      options.sourceOffset ?? 0,
      webgpuDestinationBuffer.handle,
      options.destinationOffset ?? 0,
      options.size ?? 0
    );
  }

  copyBufferToTexture(options: CopyBufferToTextureOptions): void {
    const webgpuSourceBuffer = options.sourceBuffer as WebGPUBuffer;
    const webgpuDestinationTexture = options.destinationTexture as WebGPUTexture;
    const copyOrigin = options.origin ?? [0, 0, 0];
    const copySize = options.size;
    this.handle.copyBufferToTexture(
      {
        buffer: webgpuSourceBuffer.handle,
        offset: options.byteOffset ?? 0,
        bytesPerRow: options.bytesPerRow,
        rowsPerImage: options.rowsPerImage
      },
      {
        texture: webgpuDestinationTexture.handle,
        mipLevel: options.mipLevel ?? 0,
        origin: {
          x: copyOrigin[0] ?? 0,
          y: copyOrigin[1] ?? 0,
          z: copyOrigin[2] ?? 0
        },
        aspect: options.aspect
      },
      {
        width: copySize[0],
        height: copySize[1],
        depthOrArrayLayers: copySize[2]
      }
    );
  }

  copyTextureToBuffer(options: CopyTextureToBufferOptions): void {
    const {
      sourceTexture,
      destinationBuffer,
      origin = [0, 0, 0],
      byteOffset = 0,
      width,
      height,
      depthOrArrayLayers,
      mipLevel,
      aspect
    } = options;
    const webgpuSourceTexture = sourceTexture as WebGPUTexture;
    webgpuSourceTexture.copyToBuffer(
      this.handle,
      {
        x: origin[0] ?? 0,
        y: origin[1] ?? 0,
        z: origin[2] ?? 0,
        width,
        height,
        depthOrArrayLayers,
        mipLevel,
        aspect,
        byteOffset,
        bytesPerRow: options.bytesPerRow,
        rowsPerImage: options.rowsPerImage
      },
      destinationBuffer
    );
  }

  copyTextureToTexture(options: CopyTextureToTextureOptions): void {
    const webgpuSourceTexture = options.sourceTexture as WebGPUTexture;
    const webgpuDestinationTexture = options.destinationTexture as WebGPUTexture;
    const sourceRegion = webgpuSourceTexture._normalizeTextureReadOptions({
      x: options.origin?.[0] ?? 0,
      y: options.origin?.[1] ?? 0,
      z: options.origin?.[2] ?? 0,
      width: options.width,
      height: options.height,
      depthOrArrayLayers: options.depthOrArrayLayers,
      mipLevel: options.mipLevel ?? 0,
      aspect: options.aspect ?? 'all'
    });

    this.handle.copyTextureToTexture(
      {
        texture: webgpuSourceTexture.handle,
        mipLevel: sourceRegion.mipLevel,
        origin: {
          x: sourceRegion.x,
          y: sourceRegion.y,
          z: sourceRegion.z
        },
        aspect: sourceRegion.aspect
      },
      {
        texture: webgpuDestinationTexture.handle,
        mipLevel: options.destinationMipLevel ?? 0,
        origin: {
          x: options.destinationOrigin?.[0] ?? 0,
          y: options.destinationOrigin?.[1] ?? 0,
          z: options.destinationOrigin?.[2] ?? 0
        },
        aspect: options.destinationAspect ?? sourceRegion.aspect
      },
      {
        width: sourceRegion.width,
        height: sourceRegion.height,
        depthOrArrayLayers: sourceRegion.depthOrArrayLayers
      }
    );
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

  writeTimestamp(querySet: WebGPUQuerySet, queryIndex: number): void {
    querySet._invalidateResults();
    const writeTimestamp = (
      this.handle as GPUCommandEncoder & {
        writeTimestamp?: (querySet: GPUQuerySet, queryIndex: number) => void;
      }
    ).writeTimestamp;

    if (writeTimestamp) {
      writeTimestamp.call(this.handle, querySet.handle, queryIndex);
      return;
    }

    const computePass = this.handle.beginComputePass({
      timestampWrites: {
        querySet: querySet.handle,
        beginningOfPassWriteIndex: queryIndex
      }
    });
    computePass.end();
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
