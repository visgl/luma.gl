// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';

export type ArrowFilteringTable = arrow.Table<{
  positions: arrow.FixedSizeList<arrow.Float32>;
  colors: arrow.FixedSizeList<arrow.Uint8>;
  pointSizes: arrow.Float32;
  filterValues: arrow.Float32;
}>;

export function makeArrowFilteringTable(rowCount = 12_000): ArrowFilteringTable {
  const positions = new Float32Array(rowCount * 2);
  const colors = new Uint8Array(rowCount * 4);
  const pointSizes = new Float32Array(rowCount);
  const filterValues = new Float32Array(rowCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const filterValue = rowIndex / Math.max(rowCount - 1, 1);
    const angle = rowIndex * 2.399963229728653;
    const radius = Math.sqrt(filterValue) * 0.9;
    positions[rowIndex * 2] = Math.cos(angle) * radius;
    positions[rowIndex * 2 + 1] = Math.sin(angle) * radius;
    pointSizes[rowIndex] = 0.004 + (rowIndex % 7) * 0.0007;
    filterValues[rowIndex] = filterValue;

    colors[rowIndex * 4] = Math.round(255 * filterValue);
    colors[rowIndex * 4 + 1] = Math.round(220 * (1 - Math.abs(filterValue * 2 - 1)));
    colors[rowIndex * 4 + 2] = Math.round(255 * (1 - filterValue));
    colors[rowIndex * 4 + 3] = 230;
  }

  return new arrow.Table({
    positions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, positions),
    colors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors),
    pointSizes: arrow.makeVector(pointSizes),
    filterValues: arrow.makeVector(filterValues)
  });
}
