// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import type {AnimationLoop, AnimationProps} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';

const HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL = 8;
const STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL = 4;
const STANDARD_DYNAMIC_RANGE_WHITE_NITS = 203;
const MAXIMUM_TARGET_PEAK_NITS = 10_000;

/** Raw same-frame planes used to encode a gain-map JPEG outside the browser. */
export type HDRScreenshotCapture = {
  exampleId: string;
  targetPeakNits: number;
  width: number;
  height: number;
  hdr: {
    format: 'rgba16float';
    colorSpace: 'display-p3';
    transfer: 'linear';
    bytesPerRow: number;
    data: Uint8Array;
  };
  sdr: {
    format: 'rgba8unorm-srgb';
    colorSpace: 'display-p3';
    transfer: 'srgb';
    bytesPerRow: number;
    data: Uint8Array;
  };
};

type HDRCanvasContext = CanvasContext & {
  colorFormat?: string;
  colorSpace?: string;
  toneMapping?: string;
};

type CaptureRequest = {
  promise: Promise<HDRScreenshotCapture>;
  resolve: (capture: HDRScreenshotCapture) => void;
  reject: (reason?: unknown) => void;
  encoded: boolean;
};

/** Captures the next rendered frame from an actual HDR WebGPU canvas. */
export class HDRCanvasCaptureController {
  private captureRequest: CaptureRequest | null = null;
  private finalized = false;

  constructor(
    private readonly exampleId: string,
    private readonly device: Device,
    private readonly canvasContext: CanvasContext
  ) {}

  capture(animationLoop: AnimationLoop): Promise<HDRScreenshotCapture> {
    if (this.captureRequest) {
      return this.captureRequest.promise;
    }
    if (this.finalized) {
      return Promise.reject(
        new Error(`HDR screenshot capture for ${this.exampleId} was finalized.`)
      );
    }

    try {
      assertHighDynamicRangeCanvas(this.device, this.canvasContext);
    } catch (error) {
      return Promise.reject(error);
    }

    let resolveCapture!: (capture: HDRScreenshotCapture) => void;
    let rejectCapture!: (reason?: unknown) => void;
    const promise = new Promise<HDRScreenshotCapture>((resolve, reject) => {
      resolveCapture = resolve;
      rejectCapture = reject;
    });
    this.captureRequest = {
      promise,
      resolve: resolveCapture,
      reject: rejectCapture,
      encoded: false
    };
    animationLoop.setNeedsRedraw('HDR canvas screenshot capture');
    return promise;
  }

  /** Called after example rendering and while the frame command encoder is still open. */
  onAfterRender(animationProps: AnimationProps): void {
    const captureRequest = this.captureRequest;
    if (!captureRequest || captureRequest.encoded) {
      return;
    }

    let readbackBuffer: Buffer | null = null;
    try {
      assertHighDynamicRangeCanvas(animationProps.device, animationProps.canvasContext);
      const framebuffer = animationProps.canvasContext.getCurrentFramebuffer({
        depthStencilFormat: false
      });
      const texture = framebuffer.colorAttachments[0]?.texture;
      if (!texture || texture.format !== 'rgba16float') {
        throw new Error(
          `Generic HDR screenshot capture requires an rgba16float canvas texture; received ${texture?.format || 'no color attachment'}.`
        );
      }

      const width = texture.width;
      const height = texture.height;
      const layout = texture.computeMemoryLayout({width, height});
      readbackBuffer = animationProps.device.createBuffer({
        id: `${this.exampleId}-hdr-canvas-readback`,
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      animationProps.device.commandEncoder.copyTextureToBuffer({
        sourceTexture: texture,
        destinationBuffer: readbackBuffer,
        width,
        height,
        depthOrArrayLayers: 1,
        bytesPerRow: layout.bytesPerRow,
        rowsPerImage: layout.rowsPerImage
      });
      captureRequest.encoded = true;

      const capturedReadbackBuffer = readbackBuffer;
      queueMicrotask(() => {
        void this.readCapture(
          captureRequest,
          capturedReadbackBuffer,
          width,
          height,
          layout.byteLength,
          layout.bytesPerRow
        );
      });
    } catch (error) {
      readbackBuffer?.destroy();
      this.rejectCaptureRequest(captureRequest, error);
    }
  }

  finalize(): void {
    this.finalized = true;
    this.rejectCaptureRequest(
      this.captureRequest,
      new Error(`HDR screenshot capture for ${this.exampleId} was finalized.`)
    );
  }

  private async readCapture(
    captureRequest: CaptureRequest,
    readbackBuffer: Buffer,
    width: number,
    height: number,
    byteLength: number,
    bytesPerRow: number
  ): Promise<void> {
    try {
      const sourceData = await readbackBuffer.readAsync(0, byteLength);
      const capture = makeHDRScreenshotCapture({
        exampleId: this.exampleId,
        width,
        height,
        sourceData,
        sourceBytesPerRow: bytesPerRow
      });
      if (this.captureRequest === captureRequest) {
        this.captureRequest = null;
        captureRequest.resolve(capture);
      }
    } catch (error) {
      this.rejectCaptureRequest(captureRequest, error);
    } finally {
      readbackBuffer.destroy();
    }
  }

  private rejectCaptureRequest(captureRequest: CaptureRequest | null, reason: unknown): void {
    if (captureRequest && this.captureRequest === captureRequest) {
      this.captureRequest = null;
      captureRequest.reject(reason);
    }
  }
}

/** Packs and validates an rgba16float frame, then derives its aligned SDR base plane. */
export function makeHDRScreenshotCapture(options: {
  exampleId: string;
  width: number;
  height: number;
  sourceData: Uint8Array;
  sourceBytesPerRow: number;
}): HDRScreenshotCapture {
  const {exampleId, width, height, sourceData, sourceBytesPerRow} = options;
  validateCaptureDimensions(exampleId, width, height, sourceData, sourceBytesPerRow);

  const highDynamicRangeBytesPerRow = width * HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL;
  const highDynamicRangeData = new Uint8Array(highDynamicRangeBytesPerRow * height);
  for (let rowIndex = 0; rowIndex < height; rowIndex++) {
    const sourceOffset = rowIndex * sourceBytesPerRow;
    const destinationOffset = rowIndex * highDynamicRangeBytesPerRow;
    highDynamicRangeData.set(
      sourceData.subarray(sourceOffset, sourceOffset + highDynamicRangeBytesPerRow),
      destinationOffset
    );
  }

  const highDynamicRangeDataView = new DataView(
    highDynamicRangeData.buffer,
    highDynamicRangeData.byteOffset,
    highDynamicRangeData.byteLength
  );
  const standardDynamicRangeData = new Uint8Array(
    width * height * STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL
  );
  let maximumRgb = Number.NEGATIVE_INFINITY;

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    const highDynamicRangePixelOffset = pixelIndex * HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL;
    const standardDynamicRangePixelOffset = pixelIndex * STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL;
    for (
      let channelIndex = 0;
      channelIndex < STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL;
      channelIndex++
    ) {
      const linearValue = fromHalfFloat(
        highDynamicRangeDataView.getUint16(
          highDynamicRangePixelOffset + channelIndex * Uint16Array.BYTES_PER_ELEMENT,
          true
        )
      );
      if (channelIndex < 3) {
        if (!Number.isFinite(linearValue)) {
          throw new Error(
            `HDR screenshot capture for ${exampleId} contains a non-finite RGB value at pixel ${pixelIndex}.`
          );
        }
        maximumRgb = Math.max(maximumRgb, linearValue);
      }
      const encodedValue =
        channelIndex === 3 ? clampUnitInterval(linearValue) : encodeSrgbTransfer(linearValue);
      standardDynamicRangeData[standardDynamicRangePixelOffset + channelIndex] = Math.round(
        encodedValue * 255
      );
    }
  }

  const targetPeakNits = Math.ceil(Math.max(1, maximumRgb) * STANDARD_DYNAMIC_RANGE_WHITE_NITS);
  if (
    !Number.isFinite(targetPeakNits) ||
    targetPeakNits < STANDARD_DYNAMIC_RANGE_WHITE_NITS ||
    targetPeakNits > MAXIMUM_TARGET_PEAK_NITS
  ) {
    throw new Error(
      `HDR screenshot capture for ${exampleId} has invalid targetPeakNits ${targetPeakNits}; expected ${STANDARD_DYNAMIC_RANGE_WHITE_NITS}-${MAXIMUM_TARGET_PEAK_NITS}.`
    );
  }

  return {
    exampleId,
    targetPeakNits,
    width,
    height,
    hdr: {
      format: 'rgba16float',
      colorSpace: 'display-p3',
      transfer: 'linear',
      bytesPerRow: highDynamicRangeBytesPerRow,
      data: highDynamicRangeData
    },
    sdr: {
      format: 'rgba8unorm-srgb',
      colorSpace: 'display-p3',
      transfer: 'srgb',
      bytesPerRow: width * STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL,
      data: standardDynamicRangeData
    }
  };
}

function assertHighDynamicRangeCanvas(device: Device, canvasContext: CanvasContext): void {
  const highDynamicRangeCanvasContext = canvasContext as HDRCanvasContext;
  if (
    device.type !== 'webgpu' ||
    highDynamicRangeCanvasContext.colorFormat !== 'rgba16float' ||
    highDynamicRangeCanvasContext.colorSpace !== 'display-p3' ||
    highDynamicRangeCanvasContext.toneMapping !== 'extended'
  ) {
    throw new Error(
      'Generic HDR screenshot capture requires an actual WebGPU rgba16float Display-P3 canvas with extended tone mapping; ' +
        `received device=${device.type}, format=${highDynamicRangeCanvasContext.colorFormat || 'unknown'}, ` +
        `colorSpace=${highDynamicRangeCanvasContext.colorSpace || 'unknown'}, toneMapping=${highDynamicRangeCanvasContext.toneMapping || 'unknown'}.`
    );
  }
}

function validateCaptureDimensions(
  exampleId: string,
  width: number,
  height: number,
  sourceData: Uint8Array,
  sourceBytesPerRow: number
): void {
  if (!exampleId) {
    throw new Error('HDR screenshot capture requires a non-empty exampleId.');
  }
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`HDR screenshot capture has invalid dimensions ${width}x${height}.`);
  }

  const packedBytesPerRow = width * HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL;
  if (!Number.isSafeInteger(sourceBytesPerRow) || sourceBytesPerRow < packedBytesPerRow) {
    throw new Error(
      `HDR screenshot capture has invalid sourceBytesPerRow ${sourceBytesPerRow}; expected at least ${packedBytesPerRow}.`
    );
  }
  const requiredByteLength = sourceBytesPerRow * height;
  if (sourceData.byteLength < requiredByteLength) {
    throw new Error(
      `HDR screenshot capture source is ${sourceData.byteLength} bytes; expected at least ${requiredByteLength}.`
    );
  }
}

function encodeSrgbTransfer(linearValue: number): number {
  const clampedValue = clampUnitInterval(linearValue);
  return clampedValue <= 0.0031308
    ? clampedValue * 12.92
    : 1.055 * clampedValue ** (1 / 2.4) - 0.055;
}

function clampUnitInterval(value: number): number {
  return Number.isNaN(value) ? 0 : Math.min(Math.max(value, 0), 1);
}
