// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dehydrateArrowTable, hydrateArrowTable} from './arrow-table-transport.ts';
import {convertGeoArrowTableToInterleaved} from './geoarrow-interleaving.ts';

self.onmessage = event => {
  const {id, sourceTable: dehydratedSourceTable, options} = event.data;
  try {
    const sourceTable = hydrateArrowTable(dehydratedSourceTable);
    const resultTable = dehydrateArrowTable(
      convertGeoArrowTableToInterleaved(sourceTable, options)
    );
    self.postMessage({id, resultTable});
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
