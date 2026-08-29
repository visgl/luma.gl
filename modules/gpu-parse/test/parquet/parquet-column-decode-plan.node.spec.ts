// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getParquetPhysicalTypeByteWidth, planParquetColumnDecode} from '@luma.gl/gpu-parse';
import test from 'test/utils/vitest-tape';

test('planParquetColumnDecode recognizes zero-copy PLAIN physical payloads', testCase => {
  testCase.deepEqual(
    planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'FLOAT', valueCount: 7}),
    {
      encoding: 'PLAIN',
      physicalType: 'FLOAT',
      strategy: 'zero-copy',
      valueCount: 7,
      byteWidth: 4,
      encodedByteLength: 28,
      decodedByteLength: 28
    }
  );
  testCase.deepEqual(
    planParquetColumnDecode({
      encoding: 'PLAIN',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      typeLength: 16,
      valueCount: 3
    }),
    {
      encoding: 'PLAIN',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      strategy: 'zero-copy',
      valueCount: 3,
      byteWidth: 16,
      encodedByteLength: 48,
      decodedByteLength: 48
    }
  );
  testCase.equal(getParquetPhysicalTypeByteWidth('INT96'), 12);
  testCase.ok(
    Object.isFrozen(
      planParquetColumnDecode({
        encoding: 'PLAIN',
        physicalType: 'INT32',
        valueCount: 1
      })
    )
  );
  testCase.end();
});

test('planParquetColumnDecode plans supported BYTE_STREAM_SPLIT types', testCase => {
  testCase.deepEqual(
    planParquetColumnDecode({
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'DOUBLE',
      valueCount: 513
    }),
    {
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'DOUBLE',
      strategy: 'gpu-byte-stream-split',
      valueCount: 513,
      byteWidth: 8,
      encodedByteLength: 4104,
      decodedByteLength: 4104
    }
  );
  testCase.equal(
    planParquetColumnDecode({
      encoding: 'BYTE_STREAM_SPLIT',
      physicalType: 'FIXED_LEN_BYTE_ARRAY',
      typeLength: 3,
      valueCount: 5
    }).byteWidth,
    3
  );
  testCase.end();
});

test('planParquetColumnDecode rejects unsupported or invalid payloads', testCase => {
  testCase.throws(
    () => planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'BOOLEAN', valueCount: 1}),
    /not a fixed-width byte payload/
  );
  testCase.throws(
    () => planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'BYTE_ARRAY', valueCount: 1}),
    /not a fixed-width byte payload/
  );
  testCase.throws(
    () =>
      planParquetColumnDecode({
        encoding: 'BYTE_STREAM_SPLIT',
        physicalType: 'INT96',
        valueCount: 1
      }),
    /does not support.*INT96/
  );
  testCase.throws(
    () =>
      planParquetColumnDecode({
        encoding: 'PLAIN',
        physicalType: 'FIXED_LEN_BYTE_ARRAY',
        valueCount: 1
      }),
    /positive integer typeLength/
  );
  testCase.throws(
    () => planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'INT32', valueCount: -1}),
    /non-negative uint32/
  );
  testCase.throws(
    () =>
      planParquetColumnDecode({encoding: 'PLAIN', physicalType: 'INT64', valueCount: 0x40000000}),
    /decoded byte length.*uint32/
  );
  testCase.end();
});
