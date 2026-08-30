// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {fromHalfFloat, toHalfFloat} from '@luma.gl/shadertools';
import {makeHDRScreenshotCapture} from '../../website/src/react-luma/utils/hdr-screenshot-capture';

describe('generic HDR screenshot capture', () => {
  test('packs padded rows, derives the peak, and makes an aligned SDR plane', () => {
    const width = 2;
    const height = 2;
    const sourceBytesPerRow = 24;
    const sourceData = new Uint8Array(sourceBytesPerRow * height);
    writePixel(sourceData, 0, [0, 1, 0.5, 0.5]);
    writePixel(sourceData, 8, [5.5, -1, 2, 1]);
    writePixel(sourceData, sourceBytesPerRow, [1, 0.25, 0, 1]);
    writePixel(sourceData, sourceBytesPerRow + 8, [0, 0, 0, 1]);

    const capture = makeHDRScreenshotCapture({
      exampleId: 'experimental/test-example',
      width,
      height,
      sourceData,
      sourceBytesPerRow
    });

    const expectedHighDynamicRangeData = new Uint8Array(width * height * 8);
    expectedHighDynamicRangeData.set(sourceData.subarray(0, 16), 0);
    expectedHighDynamicRangeData.set(
      sourceData.subarray(sourceBytesPerRow, sourceBytesPerRow + 16),
      16
    );
    expect(capture).toMatchObject({
      exampleId: 'experimental/test-example',
      targetPeakNits: 1117,
      width,
      height,
      hdr: {bytesPerRow: 16},
      sdr: {bytesPerRow: 8}
    });
    expect(capture.hdr.data).toEqual(expectedHighDynamicRangeData);
    expect(capture.sdr.data.subarray(0, 8)).toEqual(
      new Uint8Array([0, 255, 188, 128, 255, 0, 255, 255])
    );
  });

  test('rejects non-finite RGB and peaks outside the supported metadata range', () => {
    const nonFiniteSourceData = new Uint8Array(8);
    writePixel(nonFiniteSourceData, 0, [0, 0, 0, 1]);
    new DataView(nonFiniteSourceData.buffer).setUint16(0, 0x7c00, true);
    expect(() =>
      makeHDRScreenshotCapture({
        exampleId: 'experimental/test-example',
        width: 1,
        height: 1,
        sourceData: nonFiniteSourceData,
        sourceBytesPerRow: 8
      })
    ).toThrow(/non-finite RGB/);
    expect(makeSinglePixelCapture(0.5).targetPeakNits).toBe(203);
    expect(() => makeSinglePixelCapture(64)).toThrow(/targetPeakNits 12992/);
  });

  test('aligns gallery HDR headroom without changing its SDR base exposure', () => {
    const sourceData = new Uint8Array(16);
    writePixel(sourceData, 0, [0.5, 0.25, 0, 1]);
    writePixel(sourceData, 8, [2, 1, 0.5, 1]);

    const capture = makeHDRScreenshotCapture({
      exampleId: 'experimental/gallery-example',
      width: 2,
      height: 1,
      sourceData,
      sourceBytesPerRow: 16,
      targetPeakNits: 1000
    });
    const highDynamicRangeDataView = new DataView(
      capture.hdr.data.buffer,
      capture.hdr.data.byteOffset,
      capture.hdr.data.byteLength
    );

    expect(capture.targetPeakNits).toBe(1000);
    expect(fromHalfFloat(highDynamicRangeDataView.getUint16(8, true))).toBeCloseTo(1000 / 203, 2);
    expect(capture.sdr.data).toEqual(new Uint8Array([188, 137, 0, 255, 255, 255, 188, 255]));
  });
});

function makeSinglePixelCapture(red: number) {
  const sourceData = new Uint8Array(8);
  writePixel(sourceData, 0, [red, 0, 0, 1]);
  return makeHDRScreenshotCapture({
    exampleId: 'experimental/test-example',
    width: 1,
    height: 1,
    sourceData,
    sourceBytesPerRow: 8
  });
}

function writePixel(
  data: Uint8Array,
  byteOffset: number,
  values: readonly [number, number, number, number]
): void {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let channelIndex = 0; channelIndex < values.length; channelIndex++) {
    dataView.setUint16(
      byteOffset + channelIndex * Uint16Array.BYTES_PER_ELEMENT,
      toHalfFloat(values[channelIndex]),
      true
    );
  }
}
