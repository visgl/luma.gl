// luma.gl, MIT license
// TODO - use math.gl/polygon
import earcut from 'earcut';

// For Web Mercator projection
const PI_4 = Math.PI / 4;
const DEGREES_TO_RADIANS_HALF = Math.PI / 360;

// 4 data formats are supported:
// Simple Polygon: an array of points
// Complex Polygon: an array of array of points (array of rings)
//   with the first ring representing the outer hull and other rings representing holes
// Simple Flat: an array of numbers (flattened "simple polygon")
// Complex Flat: {position: array<number>, holeIndices: array<number>}
//   (flattened "complex polygon")

/**
 * Counts the number of vertices in any polygon representation.
 * @param {Array|Object} polygon
 * @param positionSize - size of a position, 2 (xy) or 3 (xyz)
 * @returns vertex count
 */
export function getVertexCount(
  polygon: any,
  positionSize: number,
  normalization: boolean = true
): number {
  if (!normalization) {
    polygon = polygon.positions || polygon;
    return polygon.length / positionSize;
  }

  validate(polygon);

  if (polygon.positions) {
    // complex flat
    const {positions, holeIndices} = polygon;

    if (holeIndices) {
      let vertexCount = 0;
      // split the positions array into `holeIndices.length + 1` rings
      // holeIndices[-1] falls back to 0
      // holeIndices[holeIndices.length] falls back to positions.length
      for (let i = 0; i <= holeIndices.length; i++) {
        vertexCount += getFlatVertexCount(
          polygon.positions,
          positionSize,
          holeIndices[i - 1],
          holeIndices[i]
        );
      }
      return vertexCount;
    }
    polygon = positions;
  }
  if (Number.isFinite(polygon[0])) {
    // simple flat
    return getFlatVertexCount(polygon, positionSize);
  }
  if (!isSimple(polygon)) {
    // complex polygon
    let vertexCount = 0;
    for (const simplePolygon of polygon) {
      vertexCount += getNestedVertexCount(simplePolygon);
    }
    return vertexCount;
  }
  // simple polygon
  return getNestedVertexCount(polygon);
}

/**
 * Normalize any polygon representation into the "complex flat" format
 * @param {Array|Object} polygon
 * @param positionSize - size of a position, 2 (xy) or 3 (xyz)
 * @param [vertexCount] - pre-computed vertex count in the polygon.
 *   If provided, will skip counting.
 * @return {Object} - {positions: <Float64Array>, holeIndices: <Array|null>}
 */
/* eslint-disable max-statements */
export function normalize(polygon, positionSize: number, vertexCount?: number): Float64Array | {positions: Float64Array, holeIndices } 
{
  validate(polygon);

  vertexCount = vertexCount || getVertexCount(polygon, positionSize);

  const positions = new Float64Array(vertexCount * positionSize);
  const holeIndices = [];

  if (polygon.positions) {
    // complex flat
    const {positions: srcPositions, holeIndices: srcHoleIndices} = polygon;

    if (srcHoleIndices) {
      let targetIndex = 0;
      // split the positions array into `holeIndices.length + 1` rings
      // holeIndices[-1] falls back to 0
      // holeIndices[holeIndices.length] falls back to positions.length
      for (let i = 0; i <= srcHoleIndices.length; i++) {
        targetIndex = copyFlatRing(
          positions,
          targetIndex,
          srcPositions,
          positionSize,
          srcHoleIndices[i - 1],
          srcHoleIndices[i]
        );
        holeIndices.push(targetIndex);
      }
      // The last one is not a starting index of a hole, remove
      holeIndices.pop();

      return {positions, holeIndices};
    }
    polygon = srcPositions;
  }
  if (Number.isFinite(polygon[0])) {
    // simple flat
    copyFlatRing(positions, 0, polygon, positionSize);
    return positions;
  }
  if (!isSimple(polygon)) {
    // complex polygon
    let targetIndex = 0;

    for (const simplePolygon of polygon) {
      targetIndex = copyNestedRing(positions, targetIndex, simplePolygon, positionSize);
      holeIndices.push(targetIndex);
    }
    // The last one is not a starting index of a hole, remove
    holeIndices.pop();
    // last index points to the end of the array, remove it
    return {positions, holeIndices};
  }
  // simple polygon
  copyNestedRing(positions, 0, polygon, positionSize);
  return positions;
}

/*
 * Get vertex indices for drawing polygon mesh
 * @param {Object} normalizedPolygon - {positions, holeIndices}
 * @param positionSize - size of a position, 2 (xy) or 3 (xyz)
 * @returns {Array} array of indices
 */
export function getSurfaceIndices(normalizedPolygon, positionSize: number, preproject?: boolean) {
  let holeIndices = null;

  if (normalizedPolygon.holeIndices) {
    holeIndices = normalizedPolygon.holeIndices.map(
      (positionIndex) => positionIndex / positionSize
    );
  }
  let positions = normalizedPolygon.positions || normalizedPolygon;

  // TODO - handle other coordinate systems and projection modes
  if (preproject) {
    // When tesselating lnglat coordinates, project them to the Web Mercator plane for accuracy
    const n = positions.length;
    // Clone the array
    positions = positions.slice();
    for (let i = 0; i < n; i += positionSize) {
      // project points to a scaled version of the web-mercator plane
      // It doesn't matter if x and y are scaled/translated, but the relationship must be linear
      const y = positions[i + 1];
      positions[i + 1] = Math.log(Math.tan(PI_4 + y * DEGREES_TO_RADIANS_HALF));
    }
  }

  // Let earcut triangulate the polygon
  return earcut(positions, holeIndices, positionSize);
}

/**
 * Ensure a polygon is valid format
 * @param {Array|Object} polygon
 */
function validate(polygon): void {
  polygon = (polygon && polygon.positions) || polygon;
  if (!Array.isArray(polygon) && !ArrayBuffer.isView(polygon)) {
    throw new Error('invalid polygon');
  }
}

/**
 * Check if a polygon is simple or complex
 * @param {Array} polygon - either a complex or simple polygon
 * @return - true if the polygon is a simple polygon (i.e. not an array of polygons)
 */
function isSimple(polygon): boolean {
  return polygon.length >= 1 && polygon[0].length >= 2 && Number.isFinite(polygon[0][0]);
}

/**
 * Check if a simple polygon is a closed ring
 * @param {Array} simplePolygon - array of points
 * @return - true if the simple polygon is a closed ring
 */
function isNestedRingClosed(simplePolygon): boolean {
  // check if first and last vertex are the same
  const p0 = simplePolygon[0];
  const p1 = simplePolygon[simplePolygon.length - 1];

  return p0[0] === p1[0] && p0[1] === p1[1] && p0[2] === p1[2];
}

/**
 * Check if a simple flat array is a closed ring
 * @param {Array} positions - array of numbers
 * @param size - size of a position, 2 (xy) or 3 (xyz)
 * @param startIndex - start index of the path in the positions array
 * @param endIndex - end index of the path in the positions array
 * @return  - true if the simple flat array is a closed ring
 */
function isFlatRingClosed(positions, size: number, startIndex: number, endIndex: number): boolean {
  for (let i = 0; i < size; i++) {
    if (positions[startIndex + i] !== positions[endIndex - size + i]) {
      return false;
    }
  }
  return true;
}

/**
 * Copy a simple polygon coordinates into a flat array, closes the ring if needed.
 * @param starget - destination
 * @param targetStartIndex - index in the destination to start copying into
 * @param {Array} simplePolygon - array of points
 * @param size - size of a position, 2 (xy) or 3 (xyz)
 * @returns - the index of the write head in the destination
 */
function copyNestedRing(target: Float64Array, targetStartIndex: number, simplePolygon, size: number): number {
  let targetIndex = targetStartIndex;
  const len = simplePolygon.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[i][j] || 0;
    }
  }

  if (!isNestedRingClosed(simplePolygon)) {
    for (let j = 0; j < size; j++) {
      target[targetIndex++] = simplePolygon[0][j] || 0;
    }
  }
  return targetIndex;
}

/**
 * Copy a simple flat array into another flat array, closes the ring if needed.
 * @param target - destination
 * @param targetStartIndex - index in the destination to start copying into
 * @param {Array} positions - array of numbers
 * @param size - size of a position, 2 (xy) or 3 (xyz)
 * @param [srcStartIndex] - start index of the path in the positions array
 * @param [srcEndIndex] - end index of the path in the positions array
 * @returns - the index of the write head in the destination
 */
// eslint-disable-next-line max-params
function copyFlatRing(
  target: Float64Array,
  targetStartIndex: number,
  positions,
  size: number,
  srcStartIndex: number = 0,
  srcEndIndex?: number
): number {
  srcEndIndex = srcEndIndex || positions.length;
  const srcLength = srcEndIndex - srcStartIndex;
  if (srcLength <= 0) {
    return targetStartIndex;
  }
  let targetIndex = targetStartIndex;

  for (let i = 0; i < srcLength; i++) {
    target[targetIndex++] = positions[srcStartIndex + i];
  }

  if (!isFlatRingClosed(positions, size, srcStartIndex, srcEndIndex)) {
    for (let i = 0; i < size; i++) {
      target[targetIndex++] = positions[srcStartIndex + i];
    }
  }
  return targetIndex;
}

/**
 * Counts the number of vertices in a simple polygon, closes the polygon if needed.
 * @param {Array} simplePolygon - array of points
 * @returns vertex count
 */
function getNestedVertexCount(simplePolygon): number {
  return (isNestedRingClosed(simplePolygon) ? 0 : 1) + simplePolygon.length;
}

/**
 * Counts the number of vertices in a simple flat array, closes the polygon if needed.
 * @param {Array} positions - array of numbers
 * @param size - size of a position, 2 (xy) or 3 (xyz)
 * @param [startIndex] - start index of the path in the positions array
 * @param [endIndex] - end index of the path in the positions array
 * @returns vertex count
 */
function getFlatVertexCount(
  positions,
  size: number,
  startIndex: number = 0,
  endIndex?: number
): number {
  endIndex = endIndex || positions.length;
  if (startIndex >= endIndex) {
    return 0;
  }
  return (
    (isFlatRingClosed(positions, size, startIndex, endIndex) ? 0 : 1) +
    (endIndex - startIndex) / size
  );
}
