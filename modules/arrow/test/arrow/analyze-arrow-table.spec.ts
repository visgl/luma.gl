// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {ARROW_TABLES} from '@luma.gl/arrow/test/data/arrow/make-arrow-tables';
import {analyzeArrowTable} from '@luma.gl/arrow';

it('getArrowDataByPath', async () => {
  const {simpleTable} = ARROW_TABLES;
  let tableColumns = analyzeArrowTable(simpleTable);
  expect(Boolean(tableColumns), 'extracted info from simple table').toBe(true);
  void 0;

  const {nestedTable} = ARROW_TABLES;
  tableColumns = analyzeArrowTable(nestedTable);
  expect(Boolean(tableColumns), 'extracted info from nested table').toBe(true);
  void 0;

  void 0;
});
