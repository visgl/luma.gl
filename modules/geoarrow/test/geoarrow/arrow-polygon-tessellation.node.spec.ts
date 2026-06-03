// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {tesselateAsync, tessellateArrowPolygons} from '@math.gl/geoarrow';
import * as arrow from 'apache-arrow';
import {dehydrateArrowTable, hydrateArrowTable} from '../../src/arrow-table-transport';

type Coordinate = [number, number] | [number, number, number] | [number, number, number, number];
type Color = [number, number, number, number];

test('tessellateArrowPolygons tessellates polygon holes and expands row colors', t => {
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

  t.equal(result.vertexCount, 8, 'keeps source polygon vertices');
  t.ok(result.triangleCount > 0, 'generates triangles');
  t.ok(
    Array.from(result.indices).every(index => index < result.vertexCount),
    'all triangle indices are in range'
  );
  t.ok(
    getTriangleCentroids(result).every(([x, y]) => !(x > 1 && x < 3 && y > 1 && y < 3)),
    'triangles do not fill the hole'
  );
  t.deepEqual(
    Array.from(result.colors.slice(0, 8)),
    [10, 20, 30, 220, 10, 20, 30, 220],
    'row color expands to vertex colors'
  );
  t.end();
});

test('tessellateArrowPolygons preserves one row id across multipolygon primitives', t => {
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

  t.equal(result.polygonCount, 2, 'counts primitive polygons inside the multipolygon');
  t.deepEqual(Array.from(result.rowIndices), new Array(8).fill(0), 'keeps the source row id');
  t.deepEqual(
    Array.from(result.colors.slice(0, 4)),
    [30, 140, 220, 255],
    'applies row color to multipolygon vertices'
  );
  t.end();
});

test('tessellateArrowPolygons accepts GeoArrow DenseUnion polygon rows', t => {
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

  t.equal(result.rowCount, 2, 'keeps the top-level DenseUnion row count');
  t.equal(result.polygonCount, 3, 'counts Polygon plus MultiPolygon primitive polygons');
  t.deepEqual(Array.from(result.rowIndices.slice(0, 4)), [0, 0, 0, 0], 'uses union row 0');
  t.deepEqual(
    Array.from(result.rowIndices.slice(4)),
    new Array(8).fill(1),
    'uses union row 1 for all MultiPolygon vertices'
  );
  t.deepEqual(
    Array.from(result.colors.slice(0, 4)),
    [10, 20, 30, 255],
    'applies the first union row color'
  );
  t.deepEqual(
    Array.from(result.colors.slice(16, 20)),
    [40, 50, 60, 230],
    'applies the second union row color to MultiPolygon vertices'
  );
  t.end();
});

test('tessellateArrowPolygons accepts pre-tessellated flat rows and vertex colors', t => {
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

  t.deepEqual(Array.from(result.indices), [0, 1, 2, 3, 4, 5], 'uses sequential indices');
  t.equal(result.triangleCount, 2, 'draws two supplied triangles');
  t.deepEqual(
    Array.from(result.colors.slice(0, 8)),
    [255, 0, 0, 255, 0, 255, 0, 255],
    'keeps per-vertex colors'
  );
  t.end();
});

test('Arrow polygon worker transport hydrates row and vertex colors without IPC', t => {
  const rowColorPolygons = makeNestedVector(
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
    2,
    'float32'
  );
  const rowColors = makeRowColorVector([[12, 34, 210, 255]]);
  const rowColorTable = hydrateArrowTable(
    structuredClone(
      dehydrateArrowTable(new arrow.Table({polygons: rowColorPolygons, colors: rowColors}))
    )
  );
  const rowColorType = rowColorTable.getChild('colors')?.type as arrow.FixedSizeList;

  t.ok(
    rowColorType.children[0].type instanceof arrow.Uint8,
    'hydrates row color child type as Uint8'
  );

  const rowColorResult = tessellateArrowPolygons({
    polygons: rowColorTable.getChild('polygons')!,
    colors: rowColorTable.getChild('colors')!
  });

  t.deepEqual(
    Array.from(rowColorResult.colors.slice(0, 4)),
    [12, 34, 210, 255],
    'accepts FixedSizeList<Uint8, 4> row colors after worker hydration'
  );

  const vertexColorPolygons = makeNestedVector(
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
  const vertexColors = makeNestedColorVector([
    [
      [255, 0, 0, 255],
      [0, 128, 255, 255],
      [180, 0, 255, 255]
    ]
  ]);
  const vertexColorTable = hydrateArrowTable(
    structuredClone(
      dehydrateArrowTable(new arrow.Table({polygons: vertexColorPolygons, colors: vertexColors}))
    )
  );
  const vertexColorResult = tessellateArrowPolygons(
    {
      polygons: vertexColorTable.getChild('polygons')!,
      colors: vertexColorTable.getChild('colors')!
    },
    {tessellated: true}
  );

  t.deepEqual(
    Array.from(vertexColorResult.colors.slice(0, 8)),
    [255, 0, 0, 255, 0, 128, 255, 255],
    'accepts nested FixedSizeList<Uint8, 4> vertex colors after worker hydration'
  );
  t.end();
});

test('tesselateAsync returns tessellated polygon results', async t => {
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

  t.deepEqual(Array.from(result.indices), [0, 1, 2], 'returns triangle indices');
  t.equal(result.vertexCount, 3, 'returns generated vertices');
  t.end();
});

test('tessellateArrowPolygons keeps rowIndexOffset separate from batch-local color rows', t => {
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

  t.deepEqual(Array.from(result.rowIndices), [1000, 1000, 1000], 'writes global row ids');
  t.deepEqual(
    Array.from(result.colors.slice(0, 4)),
    [90, 100, 110, 220],
    'reads colors from the local batch row'
  );
  t.end();
});

test('tessellateArrowPolygons validates tessellated row vertex counts', t => {
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

  t.throws(
    () => tessellateArrowPolygons({polygons}, {tessellated: true}),
    /multiple of 3/,
    'rejects non-triangle flat rows'
  );
  t.end();
});

test('tessellateArrowPolygons normalizes Float64 source coordinates to Float32 positions', t => {
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

  t.ok(result.positions instanceof Float32Array, 'returns Float32 GPU positions');
  t.equal(result.sourceDimension, 3, 'tracks source coordinate dimension');
  t.deepEqual(
    Array.from(result.positions.slice(0, 8)),
    [0, 0, 1, 0, 1, 0, 2, 0],
    'pads source XYZ positions to vec4 rows'
  );
  t.end();
});

test('tessellateArrowPolygons normalizes separated GeoArrow polygon fixtures', t => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_polygon.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_polygon_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  t.equal(separatedResult.sourceDimension, 2, 'tracks the separated XY source dimension');
  t.deepEqual(
    Array.from(separatedResult.positions),
    Array.from(interleavedResult.positions),
    'matches interleaved polygon positions'
  );
  t.deepEqual(
    Array.from(separatedResult.indices),
    Array.from(interleavedResult.indices),
    'matches interleaved polygon indices'
  );
  t.end();
});

test('tessellateArrowPolygons normalizes separated GeoArrow multipolygon fixtures', t => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_multipolygon.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_multipolygon_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  t.equal(separatedResult.sourceDimension, 2, 'tracks the separated XY source dimension');
  t.equal(separatedResult.polygonCount, interleavedResult.polygonCount, 'matches polygon count');
  t.deepEqual(
    Array.from(separatedResult.positions),
    Array.from(interleavedResult.positions),
    'matches interleaved multipolygon positions'
  );
  t.deepEqual(
    Array.from(separatedResult.indices),
    Array.from(interleavedResult.indices),
    'matches interleaved multipolygon indices'
  );
  t.end();
});

test('tessellateArrowPolygons preserves separated GeoArrow ZM coordinates', t => {
  const separatedPolygons = getGeoArrowFixtureGeometry('example_polygon-zm.arrows');
  const interleavedPolygons = getGeoArrowFixtureGeometry('example_polygon-zm_interleaved.arrows');

  const separatedResult = tessellateArrowPolygons({polygons: separatedPolygons});
  const interleavedResult = tessellateArrowPolygons({polygons: interleavedPolygons});

  t.equal(separatedResult.sourceDimension, 4, 'tracks separated XYZM source dimensions');
  t.deepEqual(
    Array.from(separatedResult.positions),
    Array.from(interleavedResult.positions),
    'matches interleaved ZM polygon positions'
  );
  t.end();
});

test('tessellateArrowPolygons accepts separated GeoArrow DenseUnion polygon rows', t => {
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

  t.equal(result.rowCount, 3, 'keeps the DenseUnion row count');
  t.equal(result.polygonCount, 3, 'counts only Polygon and MultiPolygon primitive polygons');
  t.deepEqual(Array.from(result.rowIndices.slice(0, 4)), [1, 1, 1, 1], 'skips point row 0');
  t.deepEqual(
    Array.from(result.rowIndices.slice(4)),
    new Array(8).fill(2),
    'uses union row 2 for all MultiPolygon vertices'
  );
  t.end();
});

test('tessellateArrowPolygons tessellates large polygons with holes', t => {
  const outerRing = makeCircleRing(10, 96);
  const holeRing = makeCircleRing(3, 32, true);
  const polygons = makeNestedVector([[outerRing, holeRing]], 2, 'float32');

  const result = tessellateArrowPolygons({polygons});

  t.equal(result.vertexCount, 128, 'keeps all source vertices');
  t.ok(result.triangleCount > 96, 'generates triangles through the indexed earcut path');
  t.ok(
    Array.from(result.indices).every(index => index < result.vertexCount),
    'all triangle indices are in range'
  );
  t.ok(
    getTriangleCentroids(result).every(([x, y]) => Math.hypot(x, y) >= 2.5),
    'triangles do not fill the circular hole'
  );
  t.end();
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
