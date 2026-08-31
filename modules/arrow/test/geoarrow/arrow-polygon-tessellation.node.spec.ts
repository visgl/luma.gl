// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {expect, it} from 'vitest';
import {tesselateAsync, tessellateArrowPolygons} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

type Coordinate = [number, number] | [number, number, number] | [number, number, number, number];
type Color = [number, number, number, number];

it('tessellateArrowPolygons tessellates polygon holes and expands row colors', () => {
  const polygons = makeNestedVector(
    [
      [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 4]
        ],
        [
          [1, 1],
          [1, 3],
          [3, 3],
          [3, 1]
        ]
      ]
    ],
    2,
    'float32'
  );
  const colors = makeRowColorVector([[10, 20, 30, 220]]);

  const result = tessellateArrowPolygons({polygons, colors});

  expect(result.vertexCount, 'keeps source polygon vertices').toBe(8);
  expect(Boolean(result.triangleCount > 0), 'generates triangles').toBe(true);
  expect(
    Boolean(Array.from(result.indices).every(index => index < result.vertexCount)),
    'all triangle indices are in range'
  ).toBe(true);
  expect(
    Boolean(getTriangleCentroids(result).every(([x, y]) => !(x > 1 && x < 3 && y > 1 && y < 3))),
    'triangles do not fill the hole'
  ).toBe(true);
  expect(Array.from(result.colors.slice(0, 8)), 'row color expands to vertex colors').toEqual([
    10, 20, 30, 220, 10, 20, 30, 220
  ]);
  void 0;
});

it('tessellateArrowPolygons preserves one row id across multipolygon primitives', () => {
  const polygons = makeNestedVector(
    [
      [
        [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1]
          ]
        ],
        [
          [
            [2, 0],
            [3, 0],
            [3, 1],
            [2, 1]
          ]
        ]
      ]
    ],
    3,
    'float32'
  );
  const colors = makeRowColorVector([[30, 140, 220, 255]]);

  const result = tessellateArrowPolygons({polygons, colors});

  expect(result.polygonCount, 'counts primitive polygons inside the multipolygon').toBe(2);
  expect(Array.from(result.rowIndices), 'keeps the source row id').toEqual(new Array(8).fill(0));
  expect(
    Array.from(result.colors.slice(0, 4)),
    'applies row color to multipolygon vertices'
  ).toEqual([30, 140, 220, 255]);
  void 0;
});

it('tessellateArrowPolygons accepts GeoArrow DenseUnion polygon rows', () => {
  const polygons = makeDenseUnionGeometryVector(
    [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2]
        ]
      ]
    ],
    [
      [
        [
          [
            [3, 0],
            [4, 0],
            [4, 1],
            [3, 1]
          ]
        ],
        [
          [
            [5, 0],
            [6, 0],
            [6, 1],
            [5, 1]
          ]
        ]
      ]
    ],
    [
      {typeId: 3, valueOffset: 0},
      {typeId: 6, valueOffset: 0}
    ]
  );
  const colors = makeRowColorVector([
    [10, 20, 30, 255],
    [40, 50, 60, 230]
  ]);

  const result = tessellateArrowPolygons({polygons, colors});

  expect(result.rowCount, 'keeps the top-level DenseUnion row count').toBe(2);
  expect(result.polygonCount, 'counts Polygon plus MultiPolygon primitive polygons').toBe(3);
  expect(Array.from(result.rowIndices.slice(0, 4)), 'uses union row 0').toEqual([0, 0, 0, 0]);
  expect(
    Array.from(result.rowIndices.slice(4)),
    'uses union row 1 for all MultiPolygon vertices'
  ).toEqual(new Array(8).fill(1));
  expect(Array.from(result.colors.slice(0, 4)), 'applies the first union row color').toEqual([
    10, 20, 30, 255
  ]);
  expect(
    Array.from(result.colors.slice(16, 20)),
    'applies the second union row color to MultiPolygon vertices'
  ).toEqual([40, 50, 60, 230]);
  void 0;
});

it('tessellateArrowPolygons accepts pre-tessellated flat rows and vertex colors', () => {
  const polygons = makeNestedVector(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
        [1, 1],
        [0, 1]
      ]
    ],
    1,
    'float32'
  );
  const colors = makeNestedColorVector([
    [
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
      [255, 255, 0, 255],
      [0, 255, 255, 255],
      [255, 0, 255, 255]
    ]
  ]);

  const result = tessellateArrowPolygons({polygons, colors}, {tessellated: true});

  expect(Array.from(result.indices), 'uses sequential indices').toEqual([0, 1, 2, 3, 4, 5]);
  expect(result.triangleCount, 'draws two supplied triangles').toBe(2);
  expect(Array.from(result.colors.slice(0, 8)), 'keeps per-vertex colors').toEqual([
    255, 0, 0, 255, 0, 255, 0, 255
  ]);
  void 0;
});

it('tesselateAsync returns tessellated polygon results', async () => {
  const polygons = makeNestedVector(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1]
      ]
    ],
    1,
    'float32'
  );

  const result = await tesselateAsync({polygons}, {tessellated: true});

  expect(Array.from(result.indices), 'returns triangle indices').toEqual([0, 1, 2]);
  expect(result.vertexCount, 'returns generated vertices').toBe(3);
  void 0;
});

it('tessellateArrowPolygons keeps rowIndexOffset separate from batch-local color rows', () => {
  const polygons = makeNestedVector(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1]
      ]
    ],
    1,
    'float32'
  );
  const colors = makeRowColorVector([[90, 100, 110, 220]]);

  const result = tessellateArrowPolygons(
    {polygons, colors},
    {tessellated: true, rowIndexOffset: 1000}
  );

  expect(Array.from(result.rowIndices), 'writes global row ids').toEqual([1000, 1000, 1000]);
  expect(Array.from(result.colors.slice(0, 4)), 'reads colors from the local batch row').toEqual([
    90, 100, 110, 220
  ]);
  void 0;
});

it('tessellateArrowPolygons validates tessellated row vertex counts', () => {
  const polygons = makeNestedVector(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ]
    ],
    1,
    'float32'
  );

  expect(
    () => tessellateArrowPolygons({polygons}, {tessellated: true}),
    'rejects non-triangle flat rows'
  ).toThrow(/multiple of 3/);
  void 0;
});

it('tessellateArrowPolygons normalizes Float64 source coordinates to Float32 positions', () => {
  const polygons = makeNestedVector(
    [
      [
        [
          [0, 0, 1],
          [1, 0, 2],
          [1, 1, 3],
          [0, 1, 4]
        ]
      ]
    ],
    2,
    'float64'
  );

  const result = tessellateArrowPolygons({polygons});

  expect(Boolean(result.positions instanceof Float32Array), 'returns Float32 GPU positions').toBe(
    true
  );
  expect(result.sourceDimension, 'tracks source coordinate dimension').toBe(3);
  expect(
    Array.from(result.positions.slice(0, 8)),
    'pads source XYZ positions to vec4 rows'
  ).toEqual([0, 0, 1, 0, 1, 0, 2, 0]);
  void 0;
});

it('tessellateArrowPolygons normalizes separated GeoArrow polygon fixtures', () => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_polygon.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_polygon_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  expect(separatedResult.sourceDimension, 'tracks the separated XY source dimension').toBe(2);
  expect(Array.from(separatedResult.positions), 'matches interleaved polygon positions').toEqual(
    Array.from(interleavedResult.positions)
  );
  expect(Array.from(separatedResult.indices), 'matches interleaved polygon indices').toEqual(
    Array.from(interleavedResult.indices)
  );
  void 0;
});

it('tessellateArrowPolygons normalizes separated GeoArrow multipolygon fixtures', () => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_multipolygon.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_multipolygon_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  expect(separatedResult.sourceDimension, 'tracks the separated XY source dimension').toBe(2);
  expect(separatedResult.polygonCount, 'matches polygon count').toBe(
    interleavedResult.polygonCount
  );
  expect(
    Array.from(separatedResult.positions),
    'matches interleaved multipolygon positions'
  ).toEqual(Array.from(interleavedResult.positions));
  expect(Array.from(separatedResult.indices), 'matches interleaved multipolygon indices').toEqual(
    Array.from(interleavedResult.indices)
  );
  void 0;
});

it('tessellateArrowPolygons preserves separated GeoArrow ZM coordinates', () => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_polygon-zm.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_polygon-zm_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  expect(separatedResult.sourceDimension, 'tracks separated XYZM source dimensions').toBe(4);
  expect(Array.from(separatedResult.positions), 'matches interleaved ZM polygon positions').toEqual(
    Array.from(interleavedResult.positions)
  );
  void 0;
});

it('tessellateArrowPolygons accepts separated GeoArrow DenseUnion polygon rows', () => {
  const polygons = makeSeparatedDenseUnionGeometryVector(
    [[99, 99]],
    [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2]
        ]
      ]
    ],
    [
      [
        [
          [
            [3, 0],
            [4, 0],
            [4, 1],
            [3, 1]
          ]
        ],
        [
          [
            [5, 0],
            [6, 0],
            [6, 1],
            [5, 1]
          ]
        ]
      ]
    ],
    [
      {typeId: 1, valueOffset: 0},
      {typeId: 3, valueOffset: 0},
      {typeId: 6, valueOffset: 0}
    ]
  );

  const result = tessellateArrowPolygons({polygons});

  expect(result.rowCount, 'keeps the DenseUnion row count').toBe(3);
  expect(result.polygonCount, 'counts only Polygon and MultiPolygon primitive polygons').toBe(3);
  expect(Array.from(result.rowIndices.slice(0, 4)), 'skips point row 0').toEqual([1, 1, 1, 1]);
  expect(
    Array.from(result.rowIndices.slice(4)),
    'uses union row 2 for all MultiPolygon vertices'
  ).toEqual(new Array(8).fill(2));
  void 0;
});

it('tessellateArrowPolygons tessellates large polygons with holes', () => {
  const outerRing = makeCircleRing(10, 96);
  const holeRing = makeCircleRing(3, 32, true);
  const polygons = makeNestedVector([[outerRing, holeRing]], 2, 'float32');

  const result = tessellateArrowPolygons({polygons});

  expect(result.vertexCount, 'keeps all source vertices').toBe(128);
  expect(
    Boolean(result.triangleCount > 96),
    'generates triangles through the indexed earcut path'
  ).toBe(true);
  expect(
    Boolean(Array.from(result.indices).every(index => index < result.vertexCount)),
    'all triangle indices are in range'
  ).toBe(true);
  expect(
    Boolean(getTriangleCentroids(result).every(([x, y]) => Math.hypot(x, y) >= 2.5)),
    'triangles do not fill the circular hole'
  ).toBe(true);
  void 0;
});

function getTriangleCentroids(
  result: ReturnType<typeof tessellateArrowPolygons>
): [number, number][] {
  const centroids: [number, number][] = [];
  for (let index = 0; index < result.indices.length; index += 3) {
    const index0 = result.indices[index] * 4;
    const index1 = result.indices[index + 1] * 4;
    const index2 = result.indices[index + 2] * 4;
    centroids.push([
      (result.positions[index0] + result.positions[index1] + result.positions[index2]) / 3,
      (result.positions[index0 + 1] + result.positions[index1 + 1] + result.positions[index2 + 1]) /
        3
    ]);
  }
  return centroids;
}

function makeCircleRing(radius: number, vertexCount: number, reverse = false): Coordinate[] {
  const coordinates: Coordinate[] = [];
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    const angle = (2 * Math.PI * vertexIndex) / vertexCount;
    coordinates.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return reverse ? coordinates.reverse() : coordinates;
}

function makeNestedVector(
  rows: Coordinate[][] | Coordinate[][][] | Coordinate[][][][],
  nesting: 1 | 2 | 3,
  valueKind: 'float32' | 'float64'
): arrow.Vector<any> {
  const dimension = getFirstCoordinate(rows).length;
  const childType = valueKind === 'float32' ? new arrow.Float32() : new arrow.Float64();
  const coordinates = flattenCoordinates(rows);
  const coordinateValues =
    valueKind === 'float32' ? Float32Array.from(coordinates) : Float64Array.from(coordinates);
  const coordinateData = makeFixedSizeListData(childType, dimension, coordinateValues);

  if (nesting === 1) {
    return new arrow.Vector([
      makeListData(coordinateData, getDepth1Offsets(rows as Coordinate[][]))
    ]);
  }
  if (nesting === 2) {
    const ringOffsets = getDepth2RingOffsets(rows as Coordinate[][][]);
    const polygonOffsets = getDepth2RowOffsets(rows as Coordinate[][][]);
    const ringData = makeListData(coordinateData, ringOffsets);
    return new arrow.Vector([makeListData(ringData, polygonOffsets)]);
  }

  const ringOffsets = getDepth3RingOffsets(rows as Coordinate[][][][]);
  const polygonOffsets = getDepth3PolygonOffsets(rows as Coordinate[][][][]);
  const rowOffsets = getDepth3RowOffsets(rows as Coordinate[][][][]);
  const ringData = makeListData(coordinateData, ringOffsets);
  const polygonData = makeListData(ringData, polygonOffsets);
  return new arrow.Vector([makeListData(polygonData, rowOffsets)]);
}

function makeNestedColorVector(rows: Color[][] | Color[][][] | Color[][][][]): arrow.Vector<any> {
  const nesting = getArrayDepth(rows) - 2;
  const colorValues = Uint8Array.from(flattenNumbers(rows));
  const colorData = makeFixedSizeListData(new arrow.Uint8(), 4, colorValues);

  if (nesting === 1) {
    return new arrow.Vector([makeListData(colorData, getDepth1Offsets(rows as Color[][]))]);
  }
  if (nesting === 2) {
    const ringOffsets = getDepth2RingOffsets(rows as Color[][][]);
    const polygonOffsets = getDepth2RowOffsets(rows as Color[][][]);
    const ringData = makeListData(colorData, ringOffsets);
    return new arrow.Vector([makeListData(ringData, polygonOffsets)]);
  }

  const ringOffsets = getDepth3RingOffsets(rows as Color[][][][]);
  const polygonOffsets = getDepth3PolygonOffsets(rows as Color[][][][]);
  const rowOffsets = getDepth3RowOffsets(rows as Color[][][][]);
  const ringData = makeListData(colorData, ringOffsets);
  const polygonData = makeListData(ringData, polygonOffsets);
  return new arrow.Vector([makeListData(polygonData, rowOffsets)]);
}

function makeDenseUnionGeometryVector(
  polygonRows: Coordinate[][][],
  multiPolygonRows: Coordinate[][][][],
  rows: {typeId: 3 | 6; valueOffset: number}[]
): arrow.Vector<any> {
  const polygonVector = makeNestedVector(polygonRows, 2, 'float32');
  const multiPolygonVector = makeNestedVector(multiPolygonRows, 3, 'float32');
  const unionType = new arrow.DenseUnion(
    [3, 6],
    [
      new arrow.Field('Polygon', polygonVector.type, true),
      new arrow.Field('MultiPolygon', multiPolygonVector.type, true)
    ]
  );
  const unionData = arrow.makeData({
    type: unionType,
    length: rows.length,
    nullCount: 0,
    typeIds: Int8Array.from(rows.map(row => row.typeId)),
    valueOffsets: Int32Array.from(rows.map(row => row.valueOffset)),
    children: [polygonVector.data[0], multiPolygonVector.data[0]]
  });

  return arrow.makeVector(unionData);
}

function makeSeparatedDenseUnionGeometryVector(
  pointRows: Coordinate[],
  polygonRows: Coordinate[][][],
  multiPolygonRows: Coordinate[][][][],
  rows: {typeId: 1 | 3 | 6; valueOffset: number}[]
): arrow.Vector<any> {
  const pointVector = makeSeparatedPointVector(pointRows);
  const polygonVector = makeSeparatedNestedVector(polygonRows, 2);
  const multiPolygonVector = makeSeparatedNestedVector(multiPolygonRows, 3);
  const unionType = new arrow.DenseUnion(
    [1, 3, 6],
    [
      new arrow.Field('Point', pointVector.type, true),
      new arrow.Field('Polygon', polygonVector.type, true),
      new arrow.Field('MultiPolygon', multiPolygonVector.type, true)
    ]
  );
  const unionData = arrow.makeData({
    type: unionType,
    length: rows.length,
    nullCount: 0,
    typeIds: Int8Array.from(rows.map(row => row.typeId)),
    valueOffsets: Int32Array.from(rows.map(row => row.valueOffset)),
    children: [pointVector.data[0], polygonVector.data[0], multiPolygonVector.data[0]]
  });

  return arrow.makeVector(unionData);
}

function makeSeparatedPointVector(rows: Coordinate[]): arrow.Vector<any> {
  const dimension = rows[0].length;
  const coordinateData = makeSeparatedCoordinateData(dimension, flattenCoordinates(rows));
  return new arrow.Vector([coordinateData]);
}

function makeSeparatedNestedVector(
  rows: Coordinate[][][] | Coordinate[][][][],
  nesting: 2 | 3
): arrow.Vector<any> {
  const dimension = getFirstCoordinate(rows).length;
  const coordinateData = makeSeparatedCoordinateData(dimension, flattenCoordinates(rows));

  if (nesting === 2) {
    const ringOffsets = getDepth2RingOffsets(rows as Coordinate[][][]);
    const polygonOffsets = getDepth2RowOffsets(rows as Coordinate[][][]);
    const ringData = makeListData(coordinateData, ringOffsets);
    return new arrow.Vector([makeListData(ringData, polygonOffsets)]);
  }

  const ringOffsets = getDepth3RingOffsets(rows as Coordinate[][][][]);
  const polygonOffsets = getDepth3PolygonOffsets(rows as Coordinate[][][][]);
  const rowOffsets = getDepth3RowOffsets(rows as Coordinate[][][][]);
  const ringData = makeListData(coordinateData, ringOffsets);
  const polygonData = makeListData(ringData, polygonOffsets);
  return new arrow.Vector([makeListData(polygonData, rowOffsets)]);
}

function makeSeparatedCoordinateData(
  dimension: number,
  coordinates: number[]
): arrow.Data<arrow.Struct> {
  const fields = ['x', 'y', 'z', 'm']
    .slice(0, dimension)
    .map(name => new arrow.Field(name, new arrow.Float64(), false));
  const coordinateCount = coordinates.length / dimension;
  const children = fields.map((field, componentIndex) => {
    const values = new Float64Array(coordinateCount);
    for (let coordinateIndex = 0; coordinateIndex < coordinateCount; coordinateIndex++) {
      values[coordinateIndex] = coordinates[coordinateIndex * dimension + componentIndex];
    }
    return new arrow.Data(field.type, 0, coordinateCount, 0, {
      [arrow.BufferType.DATA]: values
    });
  });

  return new arrow.Data(new arrow.Struct(fields), 0, coordinateCount, 0, {}, children);
}

function makeRowColorVector(colors: Color[]): arrow.Vector<any> {
  return new arrow.Vector([
    makeFixedSizeListData(new arrow.Uint8(), 4, Uint8Array.from(colors.flat()))
  ]);
}

function makeFixedSizeListData<T extends arrow.DataType>(
  childType: T,
  listSize: number,
  values: T['TArray']
): arrow.Data<arrow.FixedSizeList<T>> {
  const childData = new arrow.Data(childType, 0, values.length, 0, {
    [arrow.BufferType.DATA]: values
  });
  const listType = new arrow.FixedSizeList(listSize, new arrow.Field('value', childType, false));
  return new arrow.Data(listType, 0, values.length / listSize, 0, {}, [childData]);
}

function makeListData<T extends arrow.DataType>(
  childData: arrow.Data<T>,
  offsets: Int32Array
): arrow.Data<arrow.List<T>> {
  const listType = new arrow.List(new arrow.Field('values', childData.type, false));
  return new arrow.Data(listType, 0, offsets.length - 1, 0, {[arrow.BufferType.OFFSET]: offsets}, [
    childData
  ]);
}

function getDepth1Offsets(rows: {length: number}[]): Int32Array {
  const offsets = new Int32Array(rows.length + 1);
  for (let index = 0; index < rows.length; index++) {
    offsets[index + 1] = offsets[index] + rows[index].length;
  }
  return offsets;
}

function getDepth2RingOffsets(rows: {length: number}[][]): Int32Array {
  const offsets = [0];
  for (const row of rows) {
    for (const ring of row) {
      offsets.push(offsets[offsets.length - 1] + ring.length);
    }
  }
  return Int32Array.from(offsets);
}

function getDepth2RowOffsets(rows: {length: number}[][]): Int32Array {
  const offsets = new Int32Array(rows.length + 1);
  for (let index = 0; index < rows.length; index++) {
    offsets[index + 1] = offsets[index] + rows[index].length;
  }
  return offsets;
}

function getDepth3RingOffsets(rows: {length: number}[][][]): Int32Array {
  const offsets = [0];
  for (const row of rows) {
    for (const polygon of row) {
      for (const ring of polygon) {
        offsets.push(offsets[offsets.length - 1] + ring.length);
      }
    }
  }
  return Int32Array.from(offsets);
}

function getDepth3PolygonOffsets(rows: {length: number}[][][]): Int32Array {
  const offsets = [0];
  for (const row of rows) {
    for (const polygon of row) {
      offsets.push(offsets[offsets.length - 1] + polygon.length);
    }
  }
  return Int32Array.from(offsets);
}

function getDepth3RowOffsets(rows: {length: number}[][][]): Int32Array {
  const offsets = new Int32Array(rows.length + 1);
  for (let index = 0; index < rows.length; index++) {
    offsets[index + 1] = offsets[index] + rows[index].length;
  }
  return offsets;
}

function getFirstCoordinate(rows: any): Coordinate {
  let value = rows;
  while (Array.isArray(value[0])) {
    value = value[0];
  }
  return value;
}

function getArrayDepth(value: unknown): number {
  return Array.isArray(value) ? 1 + getArrayDepth(value[0]) : 0;
}

function flattenCoordinates(rows: unknown): number[] {
  return flattenNumbers(rows);
}

function flattenNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [Number(value)];
  }
  return value.flatMap(item => flattenNumbers(item));
}

function getGeoArrowFixtureGeometry(name: string): arrow.Vector<any> {
  const url = new URL(`../data/geoarrow-data/${name}`, import.meta.url);
  const table = arrow.tableFromIPC(readFileSync(url));
  return table.getChild('geometry')!;
}
