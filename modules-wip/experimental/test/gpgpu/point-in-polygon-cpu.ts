import booleanWithin from '@turf/boolean-within';
import {point as turfPoint, polygon as turfPolygon} from '@turf/helpers';

export function cpuPointInPolygon({polygons, points}) {
  const turfPolygons = new Array(polygons.length);
  for (let i = 0; i < polygons.length; i++) {
    // convert to required turf polygon format.
    const polygon = Number.isFinite(polygons[i][0][0]) ? [polygons[i]] : polygons[i];
    turfPolygons[i] = turfPolygon(polygon);
  }
  const pointCount = points.length;
  const filterValues = new Float32Array(pointCount);
  for (let i = 0; i < pointCount; i++) {
    let polygonId = -1;
    for (let j = 0; j < turfPolygons.length; j++) {
      if (booleanWithin(turfPoint(points[i]), turfPolygons[j])) {
        polygonId = j;
      }
    }
    filterValues[i] = polygonId;
  }
  return filterValues;
}
