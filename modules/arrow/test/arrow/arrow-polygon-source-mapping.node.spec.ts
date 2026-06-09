// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowFixedSizeListVector, resolveArrowPolygonSourceVectors} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

type PolygonArrowType = arrow.List<arrow.FixedSizeList<arrow.Float32>>;

test('resolveArrowPolygonSourceVectors maps same-name Table and RecordBatch columns', t => {
  const sourceVectors = makeArrowPolygonSourceVectors();
  const table = new arrow.Table(sourceVectors);
  const resolvedFromTable = resolveArrowPolygonSourceVectors({data: table});
  const resolvedFromRecordBatch = resolveArrowPolygonSourceVectors({data: table.batches[0]!});

  assertPolygonVectorEqual(t, resolvedFromTable.polygons, sourceVectors.polygons, 'Table polygons');
  assertPolygonVectorEqual(
    t,
    resolvedFromRecordBatch.polygons,
    sourceVectors.polygons,
    'RecordBatch polygons'
  );
  t.deepEqual(
    Array.from(getColorValues(resolvedFromTable.colors!)),
    Array.from(getColorValues(sourceVectors.colors)),
    'same-name colors resolve from Table'
  );
  t.end();
});

test('resolveArrowPolygonSourceVectors maps nested string selectors', t => {
  const sourceVectors = makeArrowPolygonSourceVectors();
  const table = makeNestedArrowPolygonTable('source', sourceVectors);
  const resolved = resolveArrowPolygonSourceVectors({
    data: table,
    selectors: {polygons: 'source.polygons', colors: 'source.colors'}
  });

  assertPolygonVectorEqual(t, resolved.polygons, sourceVectors.polygons, 'nested polygons');
  t.equal(resolved.colors?.length, sourceVectors.colors.length, 'nested colors resolve');
  t.end();
});

test('resolveArrowPolygonSourceVectors supports direct vectors and optional disable', t => {
  const sourceVectors = makeArrowPolygonSourceVectors();
  const resolved = resolveArrowPolygonSourceVectors({
    selectors: {polygons: sourceVectors.polygons, colors: null}
  });

  t.equal(resolved.polygons, sourceVectors.polygons, 'direct polygons do not require a Table');
  t.equal(resolved.colors, undefined, 'null disables optional colors');
  t.end();
});

test('resolveArrowPolygonSourceVectors skips missing optional colors and requires polygons', t => {
  const sourceVectors = makeArrowPolygonSourceVectors();
  const resolved = resolveArrowPolygonSourceVectors({
    data: new arrow.Table({polygons: sourceVectors.polygons})
  });

  t.equal(resolved.colors, undefined, 'missing optional colors are skipped');
  t.throws(
    () => resolveArrowPolygonSourceVectors({data: new arrow.Table({colors: sourceVectors.colors})}),
    /source column "polygons" for "polygons" is missing/,
    'missing required polygons throw'
  );
  t.end();
});

function makeArrowPolygonSourceVectors() {
  return {
    polygons: makePolygonVector(
      new Int32Array([0, 3, 7]),
      new Float32Array([0, 0, 1, 0, 0, 1, 2, 0, 3, 0, 3, 1, 2, 1])
    ),
    colors: makeArrowFixedSizeListVector(
      new arrow.Uint8(),
      4,
      new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255])
    )
  };
}

function makeNestedArrowPolygonTable(
  fieldName: string,
  sourceVectors: ReturnType<typeof makeArrowPolygonSourceVectors>
): arrow.Table {
  const table = new arrow.Table(sourceVectors);
  const innerStructData = table.batches[0]!.data;
  const schema = new arrow.Schema([new arrow.Field(fieldName, innerStructData.type)]);
  const structData = arrow.makeData({
    type: new arrow.Struct(schema.fields),
    length: table.numRows,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });
  return new arrow.Table([new arrow.RecordBatch(schema, structData)]);
}

function makePolygonVector(
  valueOffsets: Int32Array,
  values: Float32Array
): arrow.Vector<PolygonArrowType> {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('values', new arrow.Float32(), false)
  );
  const polygonType = new arrow.List(
    new arrow.Field('coordinates', coordinateType, false)
  ) as PolygonArrowType;
  const coordinateValueData = new arrow.Data<arrow.Float32>(
    new arrow.Float32(),
    0,
    values.length,
    0,
    {
      [arrow.BufferType.DATA]: values
    }
  );
  const coordinateData = new arrow.Data<arrow.FixedSizeList<arrow.Float32>>(
    coordinateType,
    0,
    values.length / 2,
    0,
    {},
    [coordinateValueData]
  );
  const polygonData = new arrow.Data<PolygonArrowType>(
    polygonType,
    0,
    valueOffsets.length - 1,
    0,
    {[arrow.BufferType.OFFSET]: valueOffsets},
    [coordinateData]
  );
  return new arrow.Vector<PolygonArrowType>([polygonData]);
}

function assertPolygonVectorEqual(
  t: {
    deepEqual: (actual: unknown, expected: unknown, message?: string) => void;
  },
  actual: arrow.Vector,
  expected: arrow.Vector<PolygonArrowType>,
  label: string
): void {
  const actualPolygons = actual as arrow.Vector<PolygonArrowType>;
  t.deepEqual(
    Array.from(actualPolygons.data[0]!.valueOffsets as Int32Array),
    Array.from(expected.data[0]!.valueOffsets as Int32Array),
    `${label} offsets match`
  );
  t.deepEqual(
    Array.from(getPolygonValues(actualPolygons)),
    Array.from(getPolygonValues(expected)),
    `${label} values match`
  );
}

function getPolygonValues(vector: arrow.Vector<PolygonArrowType>): Float32Array {
  const coordinateData = vector.data[0]!.children[0] as arrow.Data<
    arrow.FixedSizeList<arrow.Float32>
  >;
  return coordinateData.children[0]!.values as Float32Array;
}

function getColorValues(vector: arrow.Vector<arrow.FixedSizeList<arrow.Uint8>>): Uint8Array {
  return vector.data[0]!.children[0]!.values as Uint8Array;
}
