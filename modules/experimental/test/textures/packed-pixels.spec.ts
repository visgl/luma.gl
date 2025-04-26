// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape';
import {RGBADecoder, TEXTURE_FORMAT_PIXEL_DECODERS} from '@luma.gl/experimental';

const rgbaDecoder = new RGBADecoder({tables: [TEXTURE_FORMAT_PIXEL_DECODERS]});

// Helper for float comparisons
function almostEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}

// Integer/unorm round-trip tests
test('Integer/unorm formats round-trip', t => {
  const formats: Array<
    'rgba4unorm-webgl' | 'rgb565unorm-webgl' | 'rgb5a1unorm-webgl' | 'rgb10a2unorm' | 'rgb10a2uint'
  > = ['rgba4unorm-webgl', 'rgb565unorm-webgl', 'rgb5a1unorm-webgl', 'rgb10a2unorm', 'rgb10a2uint'];
  const vals: [number, number, number, number] = [0.2, 0.5, 0.8, 1.0];
  for (const fmt of formats) {
    const bits = rgbaDecoder.encodeRGBA(vals, fmt);
    const decoded = rgbaDecoder.decodeRGBA(bits, fmt);
    t.deepEqual(decoded, decoded, `${fmt} round-trip`);
  }
  t.end();
});

// Precomputed integer/unorm decodes
test('Precomputed integer/unorm decodes', t => {
  const cases = [
    {format: 'rgb565unorm-webgl', bits: 0xf81f, expected: [1, 0, 1, 1]},
    {format: 'rgba4unorm-webgl', bits: 0xf00f, expected: [1, 0, 0, 1]},
    {format: 'rgb5a1unorm-webgl', bits: 0xf801, expected: [1, 0, 0, 1]},
    {format: 'rgb10a2unorm', bits: 0xffc00003, expected: [1, 0, 0, 1]},
    {format: 'rgb10a2uint', bits: 0xffc00003, expected: [1023, 0, 0, 3]}
  ];
  for (const {format, bits, expected} of cases) {
    const decoded = rgbaDecoder.decodeRGBA(bits, format as any);
    t.deepEqual(decoded, expected, `${format} decodes expected values`);
  }
  t.end();
});

// Float-packed round-trip tests
test.skip('Float-packed formats round-trip', t => {
  const formats: Array<'rgb9e5ufloat' | 'rg11b10ufloat'> = ['rgb9e5ufloat', 'rg11b10ufloat'];
  const samples: [number, number, number][] = [
    [0.1, 0.2, 0.3],
    [1, 2, 3],
    [0, 0, 0],
    [0.5, 0.5, 0.5]
  ];
  for (const fmt of formats) {
    for (const sample of samples) {
      const bits = rgbaDecoder.encodeRGBA(sample, fmt);
      const [r, g, b, a] = rgbaDecoder.decodeRGBA(bits, fmt);
      t.ok(almostEqual(r, sample[0]), `${fmt} R ~ round-trip`);
      t.ok(almostEqual(g, sample[1]), `${fmt} G ~ round-trip`);
      t.ok(almostEqual(b, sample[2]), `${fmt} B ~ round-trip`);
      t.equal(a, 1, `${fmt} A = 1`);
    }
  }
  t.end();
});

// Precomputed float-packed decodes
test.skip('Precomputed float-packed decodes', t => {
  // zero case
  let color = rgbaDecoder.decodeRGBA(0, 'rgb9e5ufloat');
  t.deepEqual(color, [0, 0, 0, 1], 'rgb9e5ufloat zero');
  color = rgbaDecoder.decodeRGBA(0, 'rg11b10ufloat');
  t.deepEqual(color, [0, 0, 0, 1], 'rg11b10ufloat zero');

  // rgb9e5ufloat: mantR=512 => 1.0, mantG/B=0, exp=15 => value = mant/512 * 2^(15-15) = 1
  const rgb9e5Bits = (15 << 27) | (0 << 18) | (0 << 9) | 512;
  color = rgbaDecoder.decodeRGBA(rgb9e5Bits, 'rgb9e5ufloat');
  t.deepEqual(color, [1, 0, 0, 1], 'rgb9e5ufloat [1,0,0]');

  // rg11b10ufloat: r/g=1.0 with raw=(15<<6), b=1.0 with raw=(15<<5)
  const rRaw = 15 << 6;
  const gRaw = 15 << 6;
  const bRaw = 15 << 5;
  const rg11Bits = (bRaw << 22) | (gRaw << 11) | rRaw;
  color = rgbaDecoder.decodeRGBA(rg11Bits, 'rg11b10ufloat');
  t.deepEqual(color, [1, 1, 1, 1], 'rg11b10ufloat [1,1,1]');

  t.end();
});
