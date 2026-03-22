import {expect, test} from 'vitest';
import { ARROW_TABLES } from '@luma.gl/arrow/test/data/arrow/make-arrow-tables';
import { getArrowPaths, getArrowDataByPath } from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
test('getArrowTablePaths', async () => {
  const {
    simpleTable
  } = ARROW_TABLES;
  let paths = getArrowPaths(simpleTable);
  expect(paths, 'got correct paths from simple table').toEqual(['age', 'height']);
  const {
    nestedTable
  } = ARROW_TABLES;
  paths = getArrowPaths(nestedTable);
  expect(paths, 'got correct paths from nested table').toEqual(['data.age', 'data.height']);
});
test('getArrowDataByPath', async () => {
  const {
    simpleTable
  } = ARROW_TABLES;
  const ageData = getArrowDataByPath(simpleTable, 'age');
  expect(ageData.typeId, 'extracted age from table struct').toBe(arrow.Type.Int);
  const {
    nestedTable
  } = ARROW_TABLES;
  const heightData = getArrowDataByPath(nestedTable, 'data.height');
  expect(heightData.type.typeId, 'extracted age from nested table struct').toBe(arrow.Type.Float);
});
