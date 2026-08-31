// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  getGpuUtf8MapShaderBindings,
  getGpuUtf8MapShaderSource
} from '../../src/text-2d/experimental';

it('getGpuUtf8MapShaderBindings reserves generic read-only storage inputs', () => {
  const bindings = getGpuUtf8MapShaderBindings({
    rowByteRanges: 'rowRanges',
    utf8Bytes: 'bytes',
    mapStorage: 'mapEntries',
    group: 2,
    firstLocation: 4
  });

  expect(bindings, 'caller-selected binding names and offsets stay aligned').toEqual([
    {name: 'rowRanges', type: 'read-only-storage', group: 2, location: 4},
    {name: 'bytes', type: 'read-only-storage', group: 2, location: 5},
    {name: 'mapEntries', type: 'read-only-storage', group: 2, location: 6}
  ]);
  void 0;
});

it('getGpuUtf8MapShaderSource exposes sparse UTF-8 decode and lookup helpers', () => {
  const source = getGpuUtf8MapShaderSource({
    rowByteRanges: 'rowRanges',
    utf8Bytes: 'bytes',
    mapStorage: 'mapEntries',
    mapEntryCountExpression: 'lookupConfig[3]'
  });

  expect(
    Boolean(source.includes('return rowRanges[rowIndex];')),
    'row byte ranges are exposed to caller iteration'
  ).toBe(true);
  expect(
    Boolean(source.includes('bytes[byteIndex >> 2u]')),
    'packed UTF-8 bytes are addressed by sparse byte slot'
  ).toBe(true);
  expect(
    Boolean(source.includes('return (firstByte & 0xc0u) != 0x80u;')),
    'continuation-byte filtering stays reusable'
  ).toBe(true);
  expect(
    Boolean(
      source.includes('(firstByte & 0x80u) == 0u') &&
        source.includes('(firstByte & 0xe0u) == 0xc0u') &&
        source.includes('(firstByte & 0xf0u) == 0xe0u') &&
        source.includes('(firstByte & 0xf8u) == 0xf0u')
    ),
    'ASCII and multibyte UTF-8 branches are emitted'
  ).toBe(true);
  expect(
    Boolean(
      source.includes('let mapEntryCount = lookupConfig[3];') &&
        source.includes('let mapEntry = mapEntries[mapEntryIndex];')
    ),
    'lookup count and storage names are caller-composable'
  ).toBe(true);
  expect(
    Boolean(
      source.includes('if (mapEntry.x == codePoint)') &&
        source.includes('return mapEntry.y;') &&
        source.includes('return 0u;')
    ),
    'lookup hits return mapped ids and misses retain zero fallback'
  ).toBe(true);
  void 0;
});
