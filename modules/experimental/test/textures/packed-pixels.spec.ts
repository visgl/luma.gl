// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {RGBADecoder, TEXTURE_FORMAT_PIXEL_DECODERS} from '@luma.gl/experimental';

const rgbaDecoder = new RGBADecoder({tables: [TEXTURE_FORMAT_PIXEL_DECODERS]});

describe('packed texture pixels', () => {
  it.each([
    ['rgba4unorm-webgl', [0.2, 0.5, 0.8, 1]],
    ['rgb565unorm-webgl', [0.2, 0.5, 0.8, 1]],
    ['rgb5a1unorm-webgl', [0.2, 0.5, 0.8, 1]],
    ['rgb10a2unorm', [0.2, 0.5, 0.8, 1]]
  ] as const)('round-trips %s within its channel precision', (format, values) => {
    const decoded = rgbaDecoder.decodeRGBA(rgbaDecoder.encodeRGBA([...values], format), format);

    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
      expect(decoded[channelIndex]).toBeCloseTo(values[channelIndex], 1);
    }
  });

  it('round-trips integer channels without normalizing them', () => {
    const values: [number, number, number, number] = [100, 500, 800, 3];
    const decoded = rgbaDecoder.decodeRGBA(
      rgbaDecoder.encodeRGBA(values, 'rgb10a2uint'),
      'rgb10a2uint'
    );

    expect(decoded).toEqual(values);
  });

  it.each([
    ['rgb565unorm-webgl', 0xf81f, [1, 0, 1, 1]],
    ['rgba4unorm-webgl', 0xf00f, [1, 0, 0, 1]],
    ['rgb5a1unorm-webgl', 0xf801, [1, 0, 0, 1]],
    ['rgb10a2unorm', 0xffc00003, [1, 0, 0, 1]],
    ['rgb10a2uint', 0xffc00003, [1023, 0, 0, 3]]
  ] as const)('decodes a known %s word', (format, bits, expected) => {
    expect(rgbaDecoder.decodeRGBA(bits, format)).toEqual(expected);
  });

  it.each(['rgb9e5ufloat', 'rg11b10ufloat'] as const)('round-trips finite %s samples', format => {
    const samples: [number, number, number, number][] = [
      [0.1, 0.2, 0.3, 1],
      [1, 2, 3, 1],
      [0, 0, 0, 1],
      [0.5, 0.5, 0.5, 1]
    ];

    for (const sample of samples) {
      const decoded = rgbaDecoder.decodeRGBA(rgbaDecoder.encodeRGBA(sample, format), format);
      expect(decoded[0]).toBeCloseTo(sample[0], 2);
      expect(decoded[1]).toBeCloseTo(sample[1], 2);
      expect(decoded[2]).toBeCloseTo(sample[2], 2);
      expect(decoded[3]).toBe(1);
    }
  });

  it('decodes known shared-exponent and unsigned-float words', () => {
    expect(rgbaDecoder.decodeRGBA(0, 'rgb9e5ufloat')).toEqual([0, 0, 0, 1]);
    expect(rgbaDecoder.decodeRGBA(0, 'rg11b10ufloat')).toEqual([0, 0, 0, 1]);

    const sharedExponentBits = (16 << 27) | 256;
    expect(rgbaDecoder.decodeRGBA(sharedExponentBits, 'rgb9e5ufloat')).toEqual([1, 0, 0, 1]);

    const redRaw = 15 << 6;
    const greenRaw = 15 << 6;
    const blueRaw = 15 << 5;
    const unsignedFloatBits = (blueRaw << 22) | (greenRaw << 11) | redRaw;
    expect(rgbaDecoder.decodeRGBA(unsignedFloatBits, 'rg11b10ufloat')).toEqual([1, 1, 1, 1]);
  });

  it('handles unsigned-float subnormal and non-finite values', () => {
    const subnormal = Math.pow(2, -20);
    const subnormalDecoded = rgbaDecoder.decodeRGBA(
      rgbaDecoder.encodeRGBA([subnormal, subnormal, subnormal, 1], 'rg11b10ufloat'),
      'rg11b10ufloat'
    );
    expect(subnormalDecoded[0]).toBeCloseTo(subnormal, 8);

    const nonFiniteDecoded = rgbaDecoder.decodeRGBA(
      rgbaDecoder.encodeRGBA([Infinity, Number.NaN, -1, 1], 'rg11b10ufloat'),
      'rg11b10ufloat'
    );
    expect(nonFiniteDecoded[0]).toBe(Infinity);
    expect(nonFiniteDecoded[1]).toBeNaN();
    expect(nonFiniteDecoded[2]).toBe(0);
  });

  it('saturates positive infinity in shared-exponent encoding', () => {
    const decoded = rgbaDecoder.decodeRGBA(
      rgbaDecoder.encodeRGBA([Infinity, Number.NaN, -1, 1], 'rgb9e5ufloat'),
      'rgb9e5ufloat'
    );

    expect(decoded).toEqual([65408, 0, 0, 1]);
  });

  it('rounds subnormals across the minimum-normal boundary', () => {
    const redAndGreenValue = 63.75 * Math.pow(2, -20);
    const blueValue = 31.75 * Math.pow(2, -19);
    const decoded = rgbaDecoder.decodeRGBA(
      rgbaDecoder.encodeRGBA([redAndGreenValue, redAndGreenValue, blueValue, 1], 'rg11b10ufloat'),
      'rg11b10ufloat'
    );

    expect(decoded).toEqual([Math.pow(2, -14), Math.pow(2, -14), Math.pow(2, -14), 1]);
  });

  it('deduplicates tables and reports missing codecs', () => {
    const decoder = new RGBADecoder();
    decoder.addTable(TEXTURE_FORMAT_PIXEL_DECODERS);
    decoder.addTable(TEXTURE_FORMAT_PIXEL_DECODERS);

    expect(decoder.tables).toHaveLength(1);
    expect(() => new RGBADecoder().decodeRGBA(0, 'rgba4unorm-webgl')).toThrow(
      'No decoder for format rgba4unorm-webgl'
    );
    expect(() => new RGBADecoder().encodeRGBA([0, 0, 0, 0], 'rgba4unorm-webgl')).toThrow(
      'No encoder for format rgba4unorm-webgl'
    );
  });
});
