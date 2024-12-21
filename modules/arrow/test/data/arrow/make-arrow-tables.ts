// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

export const ARROW_TABLES = {
  simpleTable: makeSimpleArrowTable(),
  nestedTable: makeNestedArrowTable('data')
} as const satisfies Record<string, arrow.Table>;

export function makeSimpleArrowTable() {
  const structSchema = new arrow.Schema([
    new arrow.Field('age', new arrow.Int32()),
    new arrow.Field('height', new arrow.Float32())
  ]);

  const ageData = arrow.makeData({
    type: new arrow.Int32(),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    data: new Int32Array([25, 30, 35])
  });

  const heightData = arrow.makeData({
    type: new arrow.Float32(),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    data: new Float32Array([25, 30, 35])
  });

  // Step 3: Use makeData to create the Struct data
  const structData = arrow.makeData({
    type: new arrow.Struct(structSchema.fields),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    children: [ageData, heightData]
  });

  const recordBatch = new arrow.RecordBatch(structSchema, structData);
  return new arrow.Table([recordBatch]);
}

export function makeNestedArrowTable(fieldName: string) {
  const nestedTable = makeSimpleArrowTable();

  const innerStructData = nestedTable.batches[0].data;

  const structSchema = new arrow.Schema([new arrow.Field(fieldName, innerStructData.type)]);

  const structData = arrow.makeData({
    type: new arrow.Struct(structSchema.fields),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });

  const recordBatch = new arrow.RecordBatch(structSchema, structData);
  return new arrow.Table([recordBatch]);
}
