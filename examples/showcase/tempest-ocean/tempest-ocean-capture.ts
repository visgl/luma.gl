// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fromHalfFloat} from '@luma.gl/shadertools';

const HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL = 8;
const STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL = 4;
const TEMPEST_OCEAN_EXAMPLE_ID = 'showcase/tempest-ocean';
const TEMPEST_OCEAN_TARGET_PEAK_NITS = 1117;

/** Raw same-frame planes used to encode a gain-map JPEG outside the browser. */
export type TempestOceanHDRScreenshot = {
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

/** Removes WebGPU row padding while preserving its top-down texture row order. */
export function packTempestOceanFloatRows(
  sourceData: Uint8Array,
  width: number,
  height: number,
  sourceBytesPerRow: number
): Uint8Array {
  const bytesPerRow = width * HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL;
  const packedData = new Uint8Array(bytesPerRow * height);
  for (let rowIndex = 0; rowIndex < height; rowIndex++) {
    const sourceOffset = rowIndex * sourceBytesPerRow;
    const destinationOffset = rowIndex * bytesPerRow;
    packedData.set(
      sourceData.subarray(sourceOffset, sourceOffset + bytesPerRow),
      destinationOffset
    );
  }
  return packedData;
}

/** Encodes linear Display-P3 half floats as Display-P3 RGBA8888 with the sRGB transfer curve. */
export function convertLinearDisplayP3ToSrgbBytes(linearData: Uint8Array): Uint8Array {
  const linearDataView = new DataView(
    linearData.buffer,
    linearData.byteOffset,
    linearData.byteLength
  );
  const encodedData = new Uint8Array(linearData.byteLength / Uint16Array.BYTES_PER_ELEMENT);
  for (
    let linearByteOffset = 0;
    linearByteOffset < linearData.byteLength;
    linearByteOffset += Uint16Array.BYTES_PER_ELEMENT
  ) {
    const channelIndex = linearByteOffset / Uint16Array.BYTES_PER_ELEMENT;
    const linearValue = fromHalfFloat(linearDataView.getUint16(linearByteOffset, true));
    const encodedValue =
      channelIndex % STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL === 3
        ? clampUnitInterval(linearValue)
        : encodeSrgbTransfer(linearValue);
    encodedData[channelIndex] = Math.round(encodedValue * 255);
  }
  return encodedData;
}

export function makeTempestOceanHDRScreenshot(options: {
  width: number;
  height: number;
  highDynamicRangeSourceData: Uint8Array;
  highDynamicRangeSourceBytesPerRow: number;
  standardDynamicRangeSourceData: Uint8Array;
  standardDynamicRangeSourceBytesPerRow: number;
}): TempestOceanHDRScreenshot {
  const {
    width,
    height,
    highDynamicRangeSourceData,
    highDynamicRangeSourceBytesPerRow,
    standardDynamicRangeSourceData,
    standardDynamicRangeSourceBytesPerRow
  } = options;
  const highDynamicRangeData = packTempestOceanFloatRows(
    highDynamicRangeSourceData,
    width,
    height,
    highDynamicRangeSourceBytesPerRow
  );
  const standardDynamicRangeLinearData = packTempestOceanFloatRows(
    standardDynamicRangeSourceData,
    width,
    height,
    standardDynamicRangeSourceBytesPerRow
  );

  return {
    exampleId: TEMPEST_OCEAN_EXAMPLE_ID,
    targetPeakNits: TEMPEST_OCEAN_TARGET_PEAK_NITS,
    width,
    height,
    hdr: {
      format: 'rgba16float',
      colorSpace: 'display-p3',
      transfer: 'linear',
      bytesPerRow: width * HIGH_DYNAMIC_RANGE_BYTES_PER_PIXEL,
      data: highDynamicRangeData
    },
    sdr: {
      format: 'rgba8unorm-srgb',
      colorSpace: 'display-p3',
      transfer: 'srgb',
      bytesPerRow: width * STANDARD_DYNAMIC_RANGE_BYTES_PER_PIXEL,
      data: convertLinearDisplayP3ToSrgbBytes(standardDynamicRangeLinearData)
    }
  };
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
