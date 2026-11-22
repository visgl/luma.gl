// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {ARROW_TABLES} from './data/arrow/make-arrow-tables';

import {getArrowPaths, getArrowDataByPath} from '@luma.gl/graph/arrow';
import * as arrow from 'apache-arrow';

it('getArrowTablePaths', async () => {
  const {simpleTable} = ARROW_TABLES;
  let paths = getArrowPaths(simpleTable);
  expect(paths, 'got correct paths from simple table').toEqual(['age', 'height']);

  const {nestedTable} = ARROW_TABLES;
  paths = getArrowPaths(nestedTable);
  expect(paths, 'got correct paths from nested table').toEqual(['data.age', 'data.height']);

  void 0;
});

it('getArrowDataByPath', async () => {
  const {simpleTable} = ARROW_TABLES;
  const ageData = getArrowDataByPath(simpleTable, 'age');
  expect(ageData.typeId, 'extracted age from table struct').toBe(arrow.Type.Int);

  const {nestedTable} = ARROW_TABLES;
  const heightData = getArrowDataByPath(nestedTable, 'data.height');
  expect(heightData.type.typeId, 'extracted age from nested table struct').toBe(arrow.Type.Float);

  void 0;
});

// Structural wrappers model Arrow objects from another package instance without sharing prototypes.
it('resolves paths from cross-instance Arrow tables and record batches', () => {
  const {nestedTable} = ARROW_TABLES;
  const recordBatch = nestedTable.batches[0];
  const foreignTable = {
    schema: nestedTable.schema,
    numRows: nestedTable.numRows,
    batches: nestedTable.batches,
    data: nestedTable.data,
    get: nestedTable.get.bind(nestedTable),
    getChild: nestedTable.getChild.bind(nestedTable)
  };
  const foreignBatch = {
    schema: recordBatch.schema,
    numRows: recordBatch.numRows,
    data: recordBatch.data,
    get: recordBatch.get.bind(recordBatch),
    getChild: recordBatch.getChild.bind(recordBatch)
  };
  for (const source of [foreignTable, foreignBatch]) {
    expect(getArrowPaths(source as arrow.Table | arrow.RecordBatch)).toEqual([
      'data.age',
      'data.height'
    ]);
    expect(getArrowDataByPath(source as arrow.Table | arrow.RecordBatch, 'data.height')).toBe(
      getArrowDataByPath(nestedTable, 'data.height')
    );
  }
});
