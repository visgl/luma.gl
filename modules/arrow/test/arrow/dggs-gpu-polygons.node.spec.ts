// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
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

test('arrow#dggs-gpu-polygons packs Uint64 DGGS keys', t => {
  t.equal(packDggsGeohashKey('s'), 0x1000000000000018n, 'packs geohash length and base32 code');
  t.equal(packDggsGeohashKey('S0'), 0x2000000000000300n, 'normalizes geohash case');
  t.equal(packDggsQuadkeyKey('123'), 0x0c0000000000001bn, 'packs quadkey length and digits');

  const s2CellKey = packDggsS2CellKey(3, [1, 2]);
  t.equal(s2CellKey, 0x6d00000000000000n, 'packs native S2 CellId bits');
  t.equal(
    getS2IndexFromToken(getS2TokenFromIndex(s2CellKey)),
    s2CellKey,
    'matches math.gl S2 tokens'
  );
  t.deepEqual(getDggsUint64Words(s2CellKey), [0, 0x6d000000], 'returns little-endian words');

  const a5CellKey = 0x1a38000000000000n;
  t.equal(packDggsA5CellKey(a5CellKey), a5CellKey, 'passes native A5 Uint64 ids through');
  t.equal(packDggsA5CellKey('1a38000000000000'), a5CellKey, 'parses A5 hex ids');
  t.equal(
    packDggsA5CellKey('0x1A38000000000000'),
    a5CellKey,
    'parses prefixed uppercase A5 hex ids'
  );
  t.equal(hexToU64(u64ToHex(a5CellKey)), a5CellKey, 'matches a5-js hex round trip');
  t.throws(() => packDggsA5CellKey(''), /1-16 hexadecimal/, 'rejects empty A5 ids');
  t.throws(() => packDggsA5CellKey('xyz'), /Invalid A5 cell id/, 'rejects non-hex A5 ids');
  t.throws(
    () => packDggsA5CellKey('10000000000000000'),
    /1-16 hexadecimal/,
    'rejects A5 ids longer than 64 bits'
  );

  const h3CellKey = 0x8428309ffffffffn;
  t.equal(packDggsH3CellKey(h3CellKey), h3CellKey, 'passes native H3 Uint64 ids through');
  t.equal(packDggsH3CellKey('8428309ffffffff'), h3CellKey, 'parses H3 hex ids');
  t.equal(
    packDggsH3CellKey('0x8428309FFFFFFFF'),
    h3CellKey,
    'parses prefixed uppercase H3 hex ids'
  );
  t.deepEqual(
    getDggsUint64Words(h3CellKey),
    h3IndexToSplitLong('8428309ffffffff'),
    'matches h3-js split long words'
  );
  t.equal(
    splitLongToH3Index(...getDggsUint64Words(h3CellKey)),
    '8428309ffffffff',
    'round trips through h3-js split long conversion'
  );
  t.throws(() => packDggsH3CellKey(''), /1-16 hexadecimal/, 'rejects empty H3 ids');
  t.throws(() => packDggsH3CellKey('xyz'), /Invalid H3 cell id/, 'rejects non-hex H3 ids');
  t.throws(
    () => packDggsH3CellKey('10000000000000000'),
    /1-16 hexadecimal/,
    'rejects H3 ids longer than 64 bits'
  );
  t.end();
});
