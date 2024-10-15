// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {earcut} from '@math.gl/polygon';
import {PolygonData} from './geoarrow-types';
import {getLineStringChild, getPointChild, getPolygonChild} from './geoarrow';

export function earcutPolygonArray(data: PolygonData): Uint32Array {
  const trianglesResults: number[][] = [];
  let outputSize = 0;
  for (let geomIndex = 0; geomIndex < data.length; geomIndex++) {
    const triangles = earcutSinglePolygon(data, geomIndex);
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

function earcutSinglePolygon(data: PolygonData, geomIndex: number): number[] {
  const geomOffsets = data.valueOffsets;
  const rings = getPolygonChild(data);
  const ringOffsets = rings.valueOffsets;

  const coords = getLineStringChild(rings);
  const dim = coords.type.listSize;
  const flatCoords = getPointChild(coords);

  const ringBegin = geomOffsets[geomIndex];
  const ringEnd = geomOffsets[geomIndex + 1];

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
