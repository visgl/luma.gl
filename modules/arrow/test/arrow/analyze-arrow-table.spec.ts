// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {ARROW_TABLES} from '@luma.gl/arrow/test/data/arrow/make-arrow-tables';
import {analyzeArrowTable} from '@luma.gl/arrow';

test('getArrowDataByPath', async t => {
  const {simpleTable} = ARROW_TABLES;
  let tableColumns = analyzeArrowTable(simpleTable);
  t.ok(tableColumns, 'extracted info from simple table');
  t.comment(JSON.stringify(tableColumns));

  const {nestedTable} = ARROW_TABLES;
  tableColumns = analyzeArrowTable(nestedTable);
  t.ok(tableColumns, 'extracted info from nested table');
  t.comment(JSON.stringify(tableColumns));

  t.end();
});
