// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {ArrowMultiLineString, ArrowPolygon, ArrowMultiPolygon} from './geoarrow-types';
import {getMultiLineStringChild, getPolygonChild, getMultiPolygonChild} from './geoarrow';

export function getMultiLineStringResolvedOffsets(
  data: arrow.Data<ArrowMultiLineString>
): Int32Array {
  const geomOffsets = data.valueOffsets;
  const lineStringData = getMultiLineStringChild(data);
  const ringOffsets = lineStringData.valueOffsets;

  const resolvedRingOffsets = new Int32Array(geomOffsets.length);
  for (let i = 0; i < resolvedRingOffsets.length; ++i) {
    // Perform the lookup into the ringIndices array using the geomOffsets
    // array
    resolvedRingOffsets[i] = ringOffsets[geomOffsets[i]];
  }

  return resolvedRingOffsets;
}

export function getPolygonResolvedOffsets(data: arrow.Data<ArrowPolygon>): Int32Array {
  const geomOffsets = data.valueOffsets;
  const ringData = getPolygonChild(data);
  const ringOffsets = ringData.valueOffsets;

  const resolvedRingOffsets = new Int32Array(geomOffsets.length);
  for (let i = 0; i < resolvedRingOffsets.length; ++i) {
    // Perform the lookup into the ringIndices array using the geomOffsets
    // array
    resolvedRingOffsets[i] = ringOffsets[geomOffsets[i]];
  }

  return resolvedRingOffsets;
}

export function getMultiPolygonResolvedOffsets(data: arrow.Data<ArrowMultiPolygon>): Int32Array {
  const polygonData = getMultiPolygonChild(data);
  const ringData = getPolygonChild(polygonData);

  const geomOffsets = data.valueOffsets;
  const polygonOffsets = polygonData.valueOffsets;
  const ringOffsets = ringData.valueOffsets;

  const resolvedRingOffsets = new Int32Array(geomOffsets.length);
  for (let i = 0; i < resolvedRingOffsets.length; ++i) {
    resolvedRingOffsets[i] = ringOffsets[polygonOffsets[geomOffsets[i]]];
  }

  return resolvedRingOffsets;
}
