// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Field, Float32, Int32, RecordBatch, Schema, Struct, Table, makeData} from 'apache-arrow';

export const ARROW_TABLES = {
  simpleTable: makeSimpleArrowTable(),
  nestedTable: makeNestedArrowTable('data')
} as const satisfies Record<string, Table>;

export function makeSimpleArrowTable() {
  const structSchema = new Schema([
    new Field('age', new Int32()),
    new Field('height', new Float32())
  ]);

  const ageData = makeData({
    type: new Int32(),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    data: new Int32Array([25, 30, 35])
  });

  const heightData = makeData({
    type: new Float32(),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    data: new Float32Array([25, 30, 35])
  });

  // Step 3: Use makeData to create the Struct data
  const structData = makeData({
    type: new Struct(structSchema.fields),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    children: [ageData, heightData]
  });

  const recordBatch = new RecordBatch(structSchema, structData);
  return new Table([recordBatch]);
}

export function makeNestedArrowTable(fieldName: string) {
  const nestedTable = makeSimpleArrowTable();

  const innerStructData = nestedTable.batches[0].data;

  const structSchema = new Schema([new Field(fieldName, innerStructData.type)]);

  const structData = makeData({
    type: new Struct(structSchema.fields),
    length: 3,
    nullCount: 0,
    nullBitmap: null,
    children: [innerStructData]
  });

  const recordBatch = new RecordBatch(structSchema, structData);
  return new Table([recordBatch]);
}
