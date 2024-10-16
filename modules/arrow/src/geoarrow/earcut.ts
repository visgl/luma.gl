// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {earcut} from '@math.gl/polygon';
import * as arrow from 'apache-arrow';
import {ArrowPolygon} from './geoarrow-types';
import {getLineStringChild, getPointChild, getPolygonChild} from './geoarrow';

export function earcutPolygonArray(data: arrow.Data<ArrowPolygon>): Uint32Array {
  const trianglesResults: number[][] = [];
  let outputSize = 0;
  for (let geometryIndex = 0; geometryIndex < data.length; geometryIndex++) {
    const triangles = earcutSinglePolygon(data, geometryIndex);
    trianglesResults.push(triangles);
    outputSize += triangles.length;
  }

  const outputArray = new Uint32Array(outputSize);
  let idx = 0;
  for (const triangles of trianglesResults) {
    for (const value of triangles) {
      outputArray[idx] = value;
      idx += 1;
    }
  }

  return outputArray;
}

function earcutSinglePolygon(data: arrow.Data<ArrowPolygon>, geometryIndex: number): number[] {
  const geometryOffsets = data.valueOffsets;
  const rings = getPolygonChild(data);
  const ringOffsets = rings.valueOffsets;

  const coords = getLineStringChild(rings);
  const dim = coords.type.listSize;
  const flatCoords = getPointChild(coords);

  const ringBegin = geometryOffsets[geometryIndex];
  const ringEnd = geometryOffsets[geometryIndex + 1];

  const coordsBegin = ringOffsets[ringBegin];
  const coordsEnd = ringOffsets[ringEnd];

  const slicedFlatCoords = flatCoords.values.subarray(coordsBegin * dim, coordsEnd * dim);

  const initialCoordIndex = ringOffsets[ringBegin];
  const holeIndices = [];
  for (let holeRingIdx = ringBegin + 1; holeRingIdx < ringEnd; holeRingIdx++) {
    holeIndices.push(ringOffsets[holeRingIdx] - initialCoordIndex);
  }
  const triangles = earcut(slicedFlatCoords, holeIndices, dim);

  for (let i = 0; i < triangles.length; i++) {
    triangles[i] += initialCoordIndex;
  }

  return triangles;
}
