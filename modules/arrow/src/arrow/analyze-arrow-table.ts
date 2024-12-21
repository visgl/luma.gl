// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {getArrowPaths} from './arrow-paths';
import {ArrowColumnInfo} from './arrow-types';
import {getArrowColumnInfo} from './arrow-column-info';

export function analyzeArrowTable(arrowTable: arrow.Table): Record<string, ArrowColumnInfo> {
  const paths = getArrowPaths(arrowTable);
  const columnInfos: Record<string, ArrowColumnInfo> = {};

  for (const path of paths) {
    const columnInfo = getArrowColumnInfo(arrowTable, path);
    if (columnInfo) {
      columnInfos[path] = columnInfo;
    }
  }

  return columnInfos;
}
