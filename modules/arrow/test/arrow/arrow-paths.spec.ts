// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {ARROW_TABLES} from '@luma.gl/arrow/test/data/arrow/make-arrow-tables';

import {getArrowPaths, getArrowDataByPath} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

test('getArrowTablePaths', async t => {
  const {simpleTable} = ARROW_TABLES;
  let paths = getArrowPaths(simpleTable);
  t.deepEqual(paths, ['age', 'height'], 'got correct paths from simple table');

  const {nestedTable} = ARROW_TABLES;
  paths = getArrowPaths(nestedTable);
  t.deepEqual(paths, ['data.age', 'data.height'], 'got correct paths from nested table');

  t.end();
});

test('getArrowDataByPath', async t => {
  const {simpleTable} = ARROW_TABLES;
  const ageData = getArrowDataByPath(simpleTable, 'age');
  t.equal(ageData.typeId, arrow.Type.Int, 'extracted age from table struct');

  const {nestedTable} = ARROW_TABLES;
  const heightData = getArrowDataByPath(nestedTable, 'data.height');
  t.equal(heightData.type.typeId, arrow.Type.Float, 'extracted age from nested table struct');

  t.end();
});
