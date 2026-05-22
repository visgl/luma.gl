// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Test} from '@luma.gl/devtools-extensions/tape-test-utils';
import {
  packDggsA5CellKey,
  packDggsGeohashKey,
  packDggsH3CellKey,
  packDggsQuadkeyKey,
  packDggsS2CellKey,
  prepareDggsCellKeyGPUVector,
  prepareDggsCellPathGPUVector,
  readArrowGPUVectorAsync,
  type DggsCellEncoding
} from '@luma.gl/arrow';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {getGeohashBoundary} from '@math.gl/dggs-geohash';
import {getQuadkeyBoundary} from '@math.gl/dggs-quadkey';
import {getS2BoundaryFlat, getS2TokenFromIndex} from '@math.gl/dggs-s2';
import {cellToBoundary} from 'a5-js';
import * as arrow from 'apache-arrow';
import {cellToBoundary as getH3CellBoundary} from 'h3-js';

type DggsCellPathCoordinateType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

const STRING_KEY_TEST_CASES: Record<
  DggsCellEncoding,
  {
    strings: string[];
    expectedKeys: bigint[];
  }
> = {
  geohash: {
    strings: ['s', 'S0', '9q8yyk'],
    expectedKeys: [packDggsGeohashKey('s'), packDggsGeohashKey('S0'), packDggsGeohashKey('9q8yyk')]
  },
  quadkey: {
    strings: ['0', '123', '0313102'],
    expectedKeys: [
      packDggsQuadkeyKey('0'),
      packDggsQuadkeyKey('123'),
      packDggsQuadkeyKey('0313102')
    ]
  },
  s2: {
    strings: ['X', '6d', '6d00000000000000'],
    expectedKeys: [0n, 0x6d00000000000000n, 0x6d00000000000000n]
  },
  a5: {
    strings: ['0', '1a38000000000000', '0x1A38000000000000', 'invalid'],
    expectedKeys: [0n, 0x1a38000000000000n, 0x1a38000000000000n, 0n]
  },
  h3: {
    strings: ['0', '8428309ffffffff', '0x8428309FFFFFFFF', 'invalid'],
    expectedKeys: [0n, 0x8428309ffffffffn, 0x8428309ffffffffn, 0n]
  }
};

const A5_PATH_TEST_KEYS = [
  0x1a38000000000000n,
  0x1978000000000000n,
  0x2618000000000000n,
  0x2628000000000000n,
  0x6368000000000000n,
  0x0c28000000000000n,
  0x8168000000000000n,
  0x8fc8000000000000n,
  0x3228000000000000n,
  0x3778000000000000n,
  0x4678000000000000n,
  0x75c8000000000000n,
  0xe458000000000000n
] as const;

const H3_PATH_TEST_KEYS = [
  0x8428309ffffffffn,
  0x842a101ffffffffn,
  0x84194adffffffffn,
  0x842f5a3ffffffffn
] as const;

const H3_UNSUPPORTED_PATH_TEST_KEYS = [
  0n,
  0x81083ffffffffffn,
  0x8409993ffffffffn,
  0x83f004fffffffffn
] as const;

test('arrow#prepareDggsCellKeyGPUVector parses Utf8 DGGS keys on the GPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const [encoding, testCase] of Object.entries(STRING_KEY_TEST_CASES)) {
    const strings = arrow.vectorFromArray(testCase.strings, new arrow.Utf8());
    const preparedKeys = prepareDggsCellKeyGPUVector(device, strings, {
      id: `dggs-${encoding}-string-parser-test`,
      encoding: encoding as DggsCellEncoding
    });
    try {
      const keyVector = await readArrowGPUVectorAsync(preparedKeys.keys);
      t.deepEqual(
        Array.from(keyVector.data[0]!.values as BigUint64Array),
        testCase.expectedKeys,
        `parses ${encoding} strings into Uint64 keys`
      );
    } finally {
      preparedKeys.destroy();
    }
  }

  t.end();
});

test('arrow#prepareDggsCellKeyGPUVector parses sliced Utf8 DGGS keys on the GPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const strings = arrow
    .vectorFromArray(['skip', 's', 'S0', '9q8yyk'], new arrow.Utf8())
    .slice(1) as arrow.Vector<arrow.Utf8>;
  const preparedKeys = prepareDggsCellKeyGPUVector(device, strings, {
    id: 'dggs-geohash-sliced-string-parser-test',
    encoding: 'geohash'
  });
  try {
    const keyVector = await readArrowGPUVectorAsync(preparedKeys.keys);
    t.deepEqual(
      Array.from(keyVector.data[0]!.values as BigUint64Array),
      STRING_KEY_TEST_CASES.geohash.expectedKeys,
      'parses the sliced Utf8 logical rows'
    );
  } finally {
    preparedKeys.destroy();
  }

  t.end();
});

test('arrow#prepareDggsCellPathGPUVector extracts DGGS boundary paths on the GPU', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const s2CellKey = packDggsS2CellKey(0, []);
  const pathTestCases: Array<{
    encoding: DggsCellEncoding;
    keys: bigint[];
    pointCount: number;
    expectedCoordinates: number[];
    tolerance: number;
  }> = [
    {
      encoding: 'geohash',
      keys: [packDggsGeohashKey('9q')],
      pointCount: 5,
      expectedCoordinates: reorderMathGlClosedSquareBoundary(getGeohashBoundary('9q')),
      tolerance: 1e-5
    },
    {
      encoding: 'quadkey',
      keys: [packDggsQuadkeyKey('031310')],
      pointCount: 5,
      expectedCoordinates: reorderMathGlClosedSquareBoundary(getQuadkeyBoundary('031310')),
      tolerance: 0.1
    },
    {
      encoding: 's2',
      keys: [s2CellKey],
      pointCount: 5,
      expectedCoordinates: getS2CornerBoundary(s2CellKey),
      tolerance: 1e-4
    },
    {
      encoding: 'a5',
      keys: A5_PATH_TEST_KEYS.map(packDggsA5CellKey),
      pointCount: 6,
      expectedCoordinates: A5_PATH_TEST_KEYS.flatMap(cellKey =>
        flattenBoundary(cellToBoundary(cellKey, {segments: 1, closedRing: true}))
      ),
      tolerance: 1e-2
    },
    {
      encoding: 'h3',
      keys: [
        ...H3_PATH_TEST_KEYS.map(packDggsH3CellKey),
        ...H3_UNSUPPORTED_PATH_TEST_KEYS.map(packDggsH3CellKey)
      ],
      pointCount: 7,
      expectedCoordinates: [
        ...H3_PATH_TEST_KEYS.flatMap(cellKey => getH3BoundaryCoordinates(cellKey)),
        ...makeZeroPathCoordinates(H3_UNSUPPORTED_PATH_TEST_KEYS.length, 7)
      ],
      tolerance: 1e-4
    }
  ];

  for (const testCase of pathTestCases) {
    const preparedPaths = prepareDggsCellPathGPUVector(device, makeUint64Vector(testCase.keys), {
      id: `dggs-${testCase.encoding}-path-extraction-test`,
      encoding: testCase.encoding
    });
    try {
      const pathVector = await readArrowGPUVectorAsync(preparedPaths.paths);
      t.equal(
        preparedPaths.pointCount,
        testCase.pointCount,
        `${testCase.encoding} uses expected fixed path point count`
      );
      t.deepEqual(
        Array.from(getPathOffsets(pathVector)),
        makeExpectedOffsets(testCase.keys.length, testCase.pointCount),
        `${testCase.encoding} path offsets use the fixed point count`
      );
      assertCoordinateArrayClose(
        t,
        Array.from(getPathValues(pathVector)),
        testCase.expectedCoordinates,
        testCase.tolerance,
        `${testCase.encoding} boundary coordinates match CPU reference`
      );
    } finally {
      preparedPaths.destroy();
    }
  }

  t.end();
});

function makeUint64Vector(values: readonly bigint[]): arrow.Vector<arrow.Uint64> {
  const typedValues = new BigUint64Array(values.length);
  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    typedValues[valueIndex] = BigInt.asUintN(64, values[valueIndex] ?? 0n);
  }
  const uint64Type = new arrow.Uint64();
  const uint64Data = new arrow.Data(uint64Type, 0, typedValues.length, 0, {
    [arrow.BufferType.DATA]: typedValues
  });
  return new arrow.Vector([uint64Data]) as arrow.Vector<arrow.Uint64>;
}

function getPathOffsets(vector: arrow.Vector<DggsCellPathCoordinateType>): Int32Array {
  return vector.data[0]!.valueOffsets as Int32Array;
}

function getPathValues(vector: arrow.Vector<DggsCellPathCoordinateType>): Float32Array {
  const coordinateData = vector.data[0]!.children[0]!;
  const valueData = coordinateData.children[0] as arrow.Data<arrow.Float32>;
  return valueData.values as Float32Array;
}

function makeExpectedOffsets(rowCount: number, pointCount: number): number[] {
  const offsets: number[] = [];
  for (let rowIndex = 0; rowIndex <= rowCount; rowIndex++) {
    offsets.push(rowIndex * pointCount);
  }
  return offsets;
}

function reorderMathGlClosedSquareBoundary(boundary: number[][]): number[] {
  return flattenBoundary([boundary[3]!, boundary[0]!, boundary[1]!, boundary[2]!, boundary[3]!]);
}

function getS2CornerBoundary(cellKey: bigint): number[] {
  const boundary = getS2BoundaryFlat(getS2TokenFromIndex(cellKey));
  const resolution = (boundary.length / 2 - 1) / 4;
  const cornerIndices = [
    4 * resolution - 1,
    resolution - 1,
    2 * resolution - 1,
    3 * resolution - 1,
    4 * resolution - 1
  ];
  const coordinates: number[] = [];
  for (const cornerIndex of cornerIndices) {
    coordinates.push(boundary[2 * cornerIndex]!, boundary[2 * cornerIndex + 1]!);
  }
  return coordinates;
}

function flattenBoundary(boundary: readonly (readonly number[])[]): number[] {
  const coordinates: number[] = [];
  for (const point of boundary) {
    coordinates.push(point[0] ?? 0, point[1] ?? 0);
  }
  return coordinates;
}

function getH3BoundaryCoordinates(cellKey: bigint): number[] {
  return flattenBoundary(getH3CellBoundary(cellKey.toString(16), true));
}

function makeZeroPathCoordinates(rowCount: number, pointCount: number): number[] {
  return new Array(rowCount * pointCount * 2).fill(0);
}

function assertCoordinateArrayClose(
  t: Test,
  actual: number[],
  expected: number[],
  tolerance: number,
  message: string
): void {
  t.equal(actual.length, expected.length, `${message}: coordinate count`);
  for (
    let coordinateIndex = 0;
    coordinateIndex < Math.min(actual.length, expected.length);
    coordinateIndex++
  ) {
    t.ok(
      Math.abs(actual[coordinateIndex]! - expected[coordinateIndex]!) <= tolerance,
      `${message}: coordinate ${coordinateIndex} (${actual[coordinateIndex]} ~= ${expected[coordinateIndex]})`
    );
  }
}
