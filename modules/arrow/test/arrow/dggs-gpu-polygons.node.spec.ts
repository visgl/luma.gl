// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getDggsUint64Words,
  packDggsA5CellKey,
  packDggsGeohashKey,
  packDggsH3CellKey,
  packDggsQuadkeyKey,
  packDggsS2CellKey
} from '@luma.gl/arrow';
import {getS2IndexFromToken, getS2TokenFromIndex} from '@math.gl/dggs-s2';
import {hexToU64, u64ToHex} from 'a5-js';
import {h3IndexToSplitLong, splitLongToH3Index} from 'h3-js';

it('arrow#dggs-gpu-polygons packs Uint64 DGGS keys', () => {
  expect(packDggsGeohashKey('s'), 'packs geohash length and base32 code').toBe(0x1000000000000018n);
  expect(packDggsGeohashKey('S0'), 'normalizes geohash case').toBe(0x2000000000000300n);
  expect(packDggsQuadkeyKey('123'), 'packs quadkey length and digits').toBe(0x0c0000000000001bn);

  const s2CellKey = packDggsS2CellKey(3, [1, 2]);
  expect(s2CellKey, 'packs native S2 CellId bits').toBe(0x6d00000000000000n);
  expect(getS2IndexFromToken(getS2TokenFromIndex(s2CellKey)), 'matches math.gl S2 tokens').toBe(
    s2CellKey
  );
  expect(getDggsUint64Words(s2CellKey), 'returns little-endian words').toEqual([0, 0x6d000000]);

  const a5CellKey = 0x1a38000000000000n;
  expect(packDggsA5CellKey(a5CellKey), 'passes native A5 Uint64 ids through').toBe(a5CellKey);
  expect(packDggsA5CellKey('1a38000000000000'), 'parses A5 hex ids').toBe(a5CellKey);
  expect(packDggsA5CellKey('0x1A38000000000000'), 'parses prefixed uppercase A5 hex ids').toBe(
    a5CellKey
  );
  expect(hexToU64(u64ToHex(a5CellKey)), 'matches a5-js hex round trip').toBe(a5CellKey);
  expect(() => packDggsA5CellKey(''), 'rejects empty A5 ids').toThrow(/1-16 hexadecimal/);
  expect(() => packDggsA5CellKey('xyz'), 'rejects non-hex A5 ids').toThrow(/Invalid A5 cell id/);
  expect(
    () => packDggsA5CellKey('10000000000000000'),
    'rejects A5 ids longer than 64 bits'
  ).toThrow(/1-16 hexadecimal/);

  const h3CellKey = 0x8428309ffffffffn;
  expect(packDggsH3CellKey(h3CellKey), 'passes native H3 Uint64 ids through').toBe(h3CellKey);
  expect(packDggsH3CellKey('8428309ffffffff'), 'parses H3 hex ids').toBe(h3CellKey);
  expect(packDggsH3CellKey('0x8428309FFFFFFFF'), 'parses prefixed uppercase H3 hex ids').toBe(
    h3CellKey
  );
  expect(getDggsUint64Words(h3CellKey), 'matches h3-js split long words').toEqual(
    h3IndexToSplitLong('8428309ffffffff')
  );
  expect(
    splitLongToH3Index(...getDggsUint64Words(h3CellKey)),
    'round trips through h3-js split long conversion'
  ).toBe('8428309ffffffff');
  expect(() => packDggsH3CellKey(''), 'rejects empty H3 ids').toThrow(/1-16 hexadecimal/);
  expect(() => packDggsH3CellKey('xyz'), 'rejects non-hex H3 ids').toThrow(/Invalid H3 cell id/);
  expect(
    () => packDggsH3CellKey('10000000000000000'),
    'rejects H3 ids longer than 64 bits'
  ).toThrow(/1-16 hexadecimal/);
  void 0;
});
