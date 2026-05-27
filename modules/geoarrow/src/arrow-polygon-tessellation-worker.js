// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {hydrateArrowTable} from './arrow-table-transport.ts';
import {tessellateArrowPolygons} from './arrow-polygon-tessellation.ts';

self.onmessage = event => {
  const {id, sourceTable: dehydratedSourceTable, hasColors, options} = event.data;
  try {
    const sourceTable = hydrateArrowTable(dehydratedSourceTable);
    const polygons = sourceTable.getChild('polygons');
    const colors = hasColors ? sourceTable.getChild('colors') : undefined;
    const result = tessellateArrowPolygons(
      {
        polygons,
        ...(colors ? {colors} : {})
      },
      options
    );
    self.postMessage({id, result}, [
      result.positions.buffer,
      result.colors.buffer,
      result.rowIndices.buffer,
      result.indices.buffer
    ]);
  } catch (error) {
    self.postMessage({
      id,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
  }
};
