import {expect, test} from 'vitest';
import { ARROW_TABLES } from '@luma.gl/arrow/test/data/arrow/make-arrow-tables';
import { analyzeArrowTable } from '@luma.gl/arrow';
test('getArrowDataByPath', async () => {
  const {
    simpleTable
  } = ARROW_TABLES;
  let tableColumns = analyzeArrowTable(simpleTable);
  expect(tableColumns, 'extracted info from simple table').toBeTruthy();
  const {
    nestedTable
  } = ARROW_TABLES;
  tableColumns = analyzeArrowTable(nestedTable);
  expect(tableColumns, 'extracted info from nested table').toBeTruthy();
});
