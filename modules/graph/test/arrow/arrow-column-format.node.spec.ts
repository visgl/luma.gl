// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {getArrowConversionFormat} from '@luma.gl/graph/arrow';

const list = (size: number, type: arrow.DataType = new arrow.Float32()) =>
  new arrow.FixedSizeList(size, new arrow.Field('value', type));

test('Arrow schema infers formats and checks conversion widths without reading rows', () => {
  expect(getArrowConversionFormat(new arrow.Int32(), {semantic: 'scalar'})).toBe('float32');
  expect(getArrowConversionFormat(list(2), {semantic: 'position'})).toBe('float32x2');
  expect(getArrowConversionFormat(list(3), {format: 'unorm8x4'})).toBe('unorm8x4');
  expect(getArrowConversionFormat(list(2), {format: 'float32x3'})).toBe('float32x3');
  expect(() => getArrowConversionFormat(list(4), {semantic: 'position'})).toThrow(
    'Arrow positions'
  );
  expect(() => getArrowConversionFormat(list(3, new arrow.Utf8()))).toThrow('numeric values');
  expect(() => getArrowConversionFormat(list(3), {format: 'float32x2'})).toThrow('width');
  expect(() => getArrowConversionFormat(list(2), {semantic: 'color'})).toThrow('width');
});
