// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  getGpuUtf8MapShaderBindings,
  getGpuUtf8MapShaderSource
} from '../../src/text-2d/experimental';

test('getGpuUtf8MapShaderBindings reserves generic read-only storage inputs', t => {
  const bindings = getGpuUtf8MapShaderBindings({
    rowByteRanges: 'rowRanges',
    utf8Bytes: 'bytes',
    mapStorage: 'mapEntries',
    group: 2,
    firstLocation: 4
  });

  t.deepEqual(
    bindings,
    [
      {name: 'rowRanges', type: 'read-only-storage', group: 2, location: 4},
      {name: 'bytes', type: 'read-only-storage', group: 2, location: 5},
      {name: 'mapEntries', type: 'read-only-storage', group: 2, location: 6}
    ],
    'caller-selected binding names and offsets stay aligned'
  );
  t.end();
});

test('getGpuUtf8MapShaderSource exposes sparse UTF-8 decode and lookup helpers', t => {
  const source = getGpuUtf8MapShaderSource({
    rowByteRanges: 'rowRanges',
    utf8Bytes: 'bytes',
    mapStorage: 'mapEntries',
    mapEntryCountExpression: 'lookupConfig[3]'
  });

  t.ok(
    source.includes('return rowRanges[rowIndex];'),
    'row byte ranges are exposed to caller iteration'
  );
  t.ok(
    source.includes('bytes[byteIndex >> 2u]'),
    'packed UTF-8 bytes are addressed by sparse byte slot'
  );
  t.ok(
    source.includes('return (firstByte & 0xc0u) != 0x80u;'),
    'continuation-byte filtering stays reusable'
  );
  t.ok(
    source.includes('(firstByte & 0x80u) == 0u') &&
      source.includes('(firstByte & 0xe0u) == 0xc0u') &&
      source.includes('(firstByte & 0xf0u) == 0xe0u') &&
      source.includes('(firstByte & 0xf8u) == 0xf0u'),
    'ASCII and multibyte UTF-8 branches are emitted'
  );
  t.ok(
    source.includes('let mapEntryCount = lookupConfig[3];') &&
      source.includes('let mapEntry = mapEntries[mapEntryIndex];'),
    'lookup count and storage names are caller-composable'
  );
  t.ok(
    source.includes('if (mapEntry.x == codePoint)') &&
      source.includes('return mapEntry.y;') &&
      source.includes('return 0u;'),
    'lookup hits return mapped ids and misses retain zero fallback'
  );
  t.end();
});
