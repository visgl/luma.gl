import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getParquetPhysicalTypeByteWidth, planParquetColumnDecode} from '@luma.gl/gpgpu/gpu-parse';

it('planParquetColumnDecode recognizes zero-copy PLAIN physical payloads', () => {
  expect(
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'FLOAT', valueCount: 7})
  ).toEqual({
    encoding: 'PLAIN',
    physicalType: 'FLOAT',
    strategy: 'zero-copy',
    valueCount: 7,
    byteWidth: 4,
    encodedByteLength: 28,
    decodedByteLength: 28
  });
  expect(
    planParquetColumnDecode({
      encoding: 'PLAIN',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      typeLength: 16,
      valueCount: 3
    })
  ).toEqual({
    encoding: 'PLAIN',
    physicalType: 'FIXED_LEN_BYTE_ARRAY',
    strategy: 'zero-copy',
    valueCount: 3,
    byteWidth: 16,
    encodedByteLength: 48,
    decodedByteLength: 48
  });
  expect(getParquetPhysicalTypeByteWidth('INT96')).toBe(12);
  expect(
    Boolean(
      Object.isFrozen(
        planParquetColumnDecode({
          encoding: 'PLAIN',
          physicalType: 'INT32',
          valueCount: 1
        })
      )
    )
  ).toBe(true);
});

it('planParquetColumnDecode plans supported BYTE_STREAM_SPLIT types', () => {
  expect(
    planParquetColumnDecode({
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'DOUBLE',
      valueCount: 513
    })
  ).toEqual({
    encoding: 'BYTE_STREAM_SPLIT',
    physicalType: 'DOUBLE',
    strategy: 'gpu-byte-stream-split',
    valueCount: 513,
    byteWidth: 8,
    encodedByteLength: 4104,
    decodedByteLength: 4104
  });
  expect(
    planParquetColumnDecode({
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      typeLength: 3,
      valueCount: 5
    }).byteWidth
  ).toBe(3);
});

it('planParquetColumnDecode rejects unsupported or invalid payloads', () => {
  expect(() =>
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'BOOLEAN', valueCount: 1})
  ).toThrow(/not a fixed-width byte payload/);
  expect(() =>
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'BYTE_ARRAY', valueCount: 1})
  ).toThrow(/not a fixed-width byte payload/);
  expect(() =>
    planParquetColumnDecode({
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'INT96',
      valueCount: 1
    })
  ).toThrow(/does not support.*INT96/);
  expect(() =>
    planParquetColumnDecode({
      encoding: 'PLAIN',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      valueCount: 1
    })
  ).toThrow(/positive integer typeLength/);
  expect(() =>
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'INT32', valueCount: -1})
  ).toThrow(/non-negative uint32/);
  expect(() =>
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'INT64', valueCount: 0x40000000})
  ).toThrow(/decoded byte length.*uint32/);
});
