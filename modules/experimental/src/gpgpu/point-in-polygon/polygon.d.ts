/**
 * Counts the number of vertices in any polygon representation.
 * @param {Array|Object} polygon
 * @param {Number} positionSize - size of a position, 2 (xy) or 3 (xyz)
 * @returns {Number} vertex count
 */
export function getVertexCount(polygon: any, positionSize: any, normalization?: boolean): any;

/**
 * Normalize any polygon representation into the "complex flat" format
 * @param {Array|Object} polygon
 * @param {Number} positionSize - size of a position, 2 (xy) or 3 (xyz)
 * @param {Number} [vertexCount] - pre-computed vertex count in the polygon.
 *   If provided, will skip counting.
 * @return {Object} - {positions: <Float64Array>, holeIndices: <Array|null>}
 */
export function normalize(
  polygon: any,
  positionSize: any,
  vertexCount: any
):
  | Float64Array
  | {
      positions: Float64Array;
      holeIndices: any[];
    };

export function getSurfaceIndices(normalizedPolygon: any, positionSize: any, preproject: any): any;
