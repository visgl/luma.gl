// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { getArrowPaths } from './arrow-paths';
import { getArrowColumnInfo } from './arrow-column-info';
export function analyzeArrowTable(arrowTable) {
    const paths = getArrowPaths(arrowTable);
    const columnInfos = {};
    for (const path of paths) {
        const columnInfo = getArrowColumnInfo(arrowTable, path);
        if (columnInfo) {
            columnInfos[path] = columnInfo;
        }
    }
    return columnInfos;
}
