// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

import {
  type GPUCommandGraph,
  type GraphDataView,
  type GPUCommandGraphContributor
} from '../gpu-core/gpu-command-graph';
import {getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  RAW_POINT_WGSL,
  addGeospatialPass,
  assertGraphOwnership,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getPositionReadSource,
  validateDisjointGeospatialViews,
  validateRowView
} from './geospatial-utils';

const PRECISE_PREDICATE_WGSL = /* wgsl */ `
// Predicate arithmetic produces normalized high/low pairs. Keep these helpers
// on that narrower contract so software backends do not repeatedly compile the
// generic arbitrary-limb normalizer into every sign and finite check.
fn geospatial_max_abs_fp64(first: vec2f, second: vec2f) -> f32 {
  return max(abs(first.x), abs(second.x));
}

fn geospatial_div_fp64_f32(value: vec2f, divisor: f32) -> vec2f {
  return twoSum(value.x / divisor, value.y / divisor);
}

fn geospatial_is_finite_normalized_fp64(value: vec2f) -> bool {
  let highMagnitude = bitcast<u32>(value.x) & 0x7fffffffu;
  let lowMagnitude = bitcast<u32>(value.y) & 0x7fffffffu;
  return highMagnitude < 0x7f800000u && lowMagnitude < 0x7f800000u;
}

fn geospatial_sign_normalized_fp64(value: vec2f) -> i32 {
  let highBits = bitcast<u32>(value.x);
  let lowBits = bitcast<u32>(value.y);
  let highMagnitude = highBits & 0x7fffffffu;
  let lowMagnitude = lowBits & 0x7fffffffu;
  if (highMagnitude > 0x7f800000u || lowMagnitude > 0x7f800000u) { return 0; }
  if (highMagnitude != 0u) { return select(1, -1, (highBits >> 31u) == 1u); }
  if (lowMagnitude != 0u) { return select(1, -1, (lowBits >> 31u) == 1u); }
  return 0;
}
`;

/** Numeric values written by {@link GPUPairwisePointInPolygon}. */
export const GPU_POINT_IN_POLYGON_CLASSIFICATION = {
  outside: 0,
  inside: 1,
  boundary: 2,
  uncertain: 3
} as const;

/** Point-in-polygon classification written to one `uint32` output row. */
export type GPUPointInPolygonClassification =
  (typeof GPU_POINT_IN_POLYGON_CLASSIFICATION)[keyof typeof GPU_POINT_IN_POLYGON_CLASSIFICATION];

type GPUPairwisePointInPolygonBaseProps = {
  /** Prefix for generated graph-node IDs. */
  id?: string;
  /**
   * Row-to-polygon offsets with `points.length + 1` entries.
   *
   * Each point row is paired with one polygon or multipolygon geometry.
   */
  geometryOffsets: GraphDataView<'uint32'>;
  /** Polygon-to-ring offsets with one terminal entry. */
  polygonOffsets: GraphDataView<'uint32'>;
  /** Ring-to-vertex offsets with one terminal entry. Rings close implicitly. */
  ringOffsets: GraphDataView<'uint32'>;
  /** Caller-owned classification rows aligned one-to-one with `points`. */
  output: GraphDataView<'uint32'>;
};

/** Properties for pairwise point-in-polygon classification over aligned geometry rows. */
export type GPUPairwisePointInPolygonProps = GPUPairwisePointInPolygonBaseProps &
  (
    | {
        /** Local f32 point rows. */
        points: GraphDataView<'float32x2'>;
        /** Flattened local f32 polygon vertices. */
        polygonPositions: GraphDataView<'float32x2'>;
      }
    | {
        /** Raw binary64 point rows in browser `Float64Array` word order. */
        points: GraphDataView<'uint32x4'>;
        /** Flattened raw binary64 polygon vertices in browser `Float64Array` word order. */
        polygonPositions: GraphDataView<'uint32x4'>;
      }
  );

/**
 * Classifies one point against one polygon or multipolygon per row.
 *
 * `geometryOffsets` maps point rows to polygons, `polygonOffsets` maps polygons to rings, and
 * `ringOffsets` maps rings to flattened vertices. Rings close implicitly. Rings within one polygon
 * use even/odd fill semantics, while polygons within one multipolygon are unioned. Non-finite
 * coordinates, malformed offsets, invalid rings, and predicates that exceed the double-single
 * arithmetic envelope return `uncertain` rather than a silent inside/outside classification.
 */
export class GPUPairwisePointInPolygon implements GPUCommandGraphContributor {
  readonly id: string;
  readonly points: GraphDataView<'float32x2'> | GraphDataView<'uint32x4'>;
  readonly polygonPositions: GraphDataView<'float32x2'> | GraphDataView<'uint32x4'>;
  readonly geometryOffsets: GraphDataView<'uint32'>;
  readonly polygonOffsets: GraphDataView<'uint32'>;
  readonly ringOffsets: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'uint32'>;

  /** Creates a predicate contributor without compiling or submitting GPU work. */
  constructor(props: GPUPairwisePointInPolygonProps) {
    this.id = props.id ?? 'gpu-pairwise-point-in-polygon';
    this.points = props.points;
    this.polygonPositions = props.polygonPositions;
    this.geometryOffsets = props.geometryOffsets;
    this.polygonOffsets = props.polygonOffsets;
    this.ringOffsets = props.ringOffsets;
    this.output = props.output;

    validateRowView(this.points, ['float32x2', 'uint32x4'], `${this.id} points`);
    validateRowView(
      this.polygonPositions,
      ['float32x2', 'uint32x4'],
      `${this.id} polygonPositions`
    );
    if (this.points.format !== this.polygonPositions.format) {
      throw new Error(`${this.id} point and polygon position formats must match`);
    }
    for (const [name, offsets] of [
      ['geometryOffsets', this.geometryOffsets],
      ['polygonOffsets', this.polygonOffsets],
      ['ringOffsets', this.ringOffsets]
    ] as const) {
      validateRowView(offsets, ['uint32'], `${this.id} ${name}`);
    }
    if (this.geometryOffsets.length !== this.points.length + 1) {
      throw new Error(`${this.id} geometryOffsets.length must equal points.length + 1`);
    }
    if (this.polygonOffsets.length < 1 || this.ringOffsets.length < 1) {
      throw new Error(`${this.id} polygonOffsets and ringOffsets require a terminal entry`);
    }
    validateRowView(this.output, ['uint32'], `${this.id} output`);
    if (this.output.length !== this.points.length) {
      throw new Error(`${this.id} output.length must equal points.length`);
    }
    validateDisjointGeospatialViews(
      this.id,
      [
        ['points', this.points],
        ['polygonPositions', this.polygonPositions],
        ['geometryOffsets', this.geometryOffsets],
        ['polygonOffsets', this.polygonOffsets],
        ['ringOffsets', this.ringOffsets]
      ],
      [['output', this.output]]
    );
  }

  /** Adds one predicate node to the target graph when at least one point row is present. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    assertGraphOwnership(
      graph,
      [
        this.points,
        this.polygonPositions,
        this.geometryOffsets,
        this.polygonOffsets,
        this.ringOffsets,
        this.output
      ],
      this.id
    );
    if (this.points.length === 0) return;
    this.addPass(graph);
  }

  private addPass<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const pointSource = getPositionReadSource('points', this.points);
    const polygonSource = getPositionReadSource('polygonPositions', this.polygonPositions);
    const dispatchLayout = getGeospatialDispatchLayout(
      this.points.length,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const raw = this.points.format === 'uint32x4';
    const source = /* wgsl */ `
${raw ? RAW_POINT_WGSL : ''}
${PRECISE_PREDICATE_WGSL}
const OUTSIDE: u32 = ${GPU_POINT_IN_POLYGON_CLASSIFICATION.outside}u;
const INSIDE: u32 = ${GPU_POINT_IN_POLYGON_CLASSIFICATION.inside}u;
const BOUNDARY: u32 = ${GPU_POINT_IN_POLYGON_CLASSIFICATION.boundary}u;
const UNCERTAIN: u32 = ${GPU_POINT_IN_POLYGON_CLASSIFICATION.uncertain}u;
const ELEMENT_COUNT: u32 = ${this.points.length}u;
const POLYGON_COUNT: u32 = ${this.polygonOffsets.length - 1}u;
const RING_COUNT: u32 = ${this.ringOffsets.length - 1}u;
const VERTEX_COUNT: u32 = ${this.polygonPositions.length}u;
const GEOMETRY_OFFSETS_OFFSET: u32 = ${getViewElementOffset(this.geometryOffsets)}u;
const POLYGON_OFFSETS_OFFSET: u32 = ${getViewElementOffset(this.polygonOffsets)}u;
const RING_OFFSETS_OFFSET: u32 = ${getViewElementOffset(this.ringOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
${pointSource.declaration}
${polygonSource.declaration}
@group(0) @binding(auto) var<storage, read> geometryOffsets: array<u32>;
@group(0) @binding(auto) var<storage, read> polygonOffsets: array<u32>;
@group(0) @binding(auto) var<storage, read> ringOffsets: array<u32>;
@group(0) @binding(auto) var<storage, read_write> classifications: array<u32>;

${makePredicateHelpers(polygonSource, raw)}

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  let point = ${pointSource.read('index')};
  classifications[OUTPUT_OFFSET + index] = classifyGeometry(point, index);
}`;
    addGeospatialPass(graph, {
      id: this.id,
      source,
      resources: [
        {buffer: this.points, usage: 'storage-read'},
        {buffer: this.polygonPositions, usage: 'storage-read'},
        {buffer: this.geometryOffsets, usage: 'storage-read'},
        {buffer: this.polygonOffsets, usage: 'storage-read'},
        {buffer: this.ringOffsets, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      bindings: {
        points: this.points,
        polygonPositions: this.polygonPositions,
        geometryOffsets: this.geometryOffsets,
        polygonOffsets: this.polygonOffsets,
        ringOffsets: this.ringOffsets,
        classifications: this.output
      },
      dispatchLayout,
      precise: true,
      fp64Profile: raw ? 'predicate-raw' : 'predicate-f32'
    });
  }
}

function makePredicateHelpers(
  polygonSource: ReturnType<typeof getPositionReadSource>,
  raw: boolean
): string {
  const pointType = raw ? 'RawPoint' : 'vec2f';
  const finitePoint = raw
    ? 'return rawPointIsFinite(point);'
    : 'return finiteF32(point.x) && finiteF32(point.y);';
  const relativePoint = raw
    ? `let exactZeroX = rawScalarEqual(vertex.x, point.x);
  let exactZeroY = rawScalarEqual(vertex.y, point.y);
  let deltaX = sub_fp64u32_to_fp64(vertex.x, point.x);
  let deltaY = sub_fp64u32_to_fp64(vertex.y, point.y);`
    : `let exactZeroX = vertex.x == point.x;
  let exactZeroY = vertex.y == point.y;
  let deltaX = twoSub(vertex.x, point.x);
  let deltaY = twoSub(vertex.y, point.y);`;
  const rawHelpers = raw
    ? `fn rawScalarEqual(first: vec2u, second: vec2u) -> bool {
  let firstDecoded = fp64_decode_bits(first);
  let secondDecoded = fp64_decode_bits(second);
  if (firstDecoded.isNan || secondDecoded.isNan) { return false; }
  if (firstDecoded.isZero && secondDecoded.isZero) { return true; }
  return all(first == second);
}

fn sourcePointsEqual(first: RawPoint, second: RawPoint) -> bool {
  return rawScalarEqual(first.x, second.x) && rawScalarEqual(first.y, second.y);
}`
    : `fn sourcePointsEqual(first: vec2f, second: vec2f) -> bool {
  return all(first == second);
}`;
  const ambiguousZeroOrientation = `if (withinSegment) {
      let exactAxisBoundary =
        (start.exactZeroX && end.exactZeroX) ||
        (start.exactZeroY && end.exactZeroY);
      return EdgeClassification(false, exactAxisBoundary, !exactAxisBoundary);
    }
    return EdgeClassification(false, false, straddlesY);`;
  return /* wgsl */ `
struct RelativePoint {
  x: vec2f,
  y: vec2f,
  finite: bool,
  exactZeroX: bool,
  exactZeroY: bool,
  underresolved: bool,
}

struct Orientation {
  sign: i32,
  uncertain: bool,
}

struct EdgeClassification {
  crossing: bool,
  boundary: bool,
  uncertain: bool,
}

fn finiteF32(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

${rawHelpers}

fn pointIsFinite(point: ${pointType}) -> bool {
  ${finitePoint}
}

fn makeRelativePoint(vertex: ${pointType}, point: ${pointType}) -> RelativePoint {
  ${relativePoint}
  let finite =
    geospatial_is_finite_normalized_fp64(deltaX) &&
    geospatial_is_finite_normalized_fp64(deltaY);
  let underresolved =
    (!exactZeroX && geospatial_sign_normalized_fp64(deltaX) == 0) ||
    (!exactZeroY && geospatial_sign_normalized_fp64(deltaY) == 0);
  return RelativePoint(deltaX, deltaY, finite, exactZeroX, exactZeroY, underresolved);
}

fn readPolygonPoint(vertexIndex: u32) -> ${pointType} {
  return ${polygonSource.read('vertexIndex')};
}

fn readRelativePoint(vertexIndex: u32, point: ${pointType}) -> RelativePoint {
  return makeRelativePoint(readPolygonPoint(vertexIndex), point);
}

fn bracketsZero(first: vec2f, second: vec2f) -> bool {
  let firstSign = geospatial_sign_normalized_fp64(first);
  let secondSign = geospatial_sign_normalized_fp64(second);
  return firstSign == 0 || secondSign == 0 || firstSign != secondSign;
}

fn getOrientation(start: RelativePoint, end: RelativePoint) -> Orientation {
  if (!start.finite || !end.finite || start.underresolved || end.underresolved) {
    return Orientation(0, true);
  }
  let scale = max(
    geospatial_max_abs_fp64(start.x, start.y),
    geospatial_max_abs_fp64(end.x, end.y)
  );
  if (scale == 0.0) { return Orientation(0, false); }
  let startX = geospatial_div_fp64_f32(start.x, scale);
  let startY = geospatial_div_fp64_f32(start.y, scale);
  let endX = geospatial_div_fp64_f32(end.x, scale);
  let endY = geospatial_div_fp64_f32(end.y, scale);
  let firstProduct = mul_fp64(startX, endY);
  let secondProduct = mul_fp64(startY, endX);
  let crossProduct = sub_fp64(firstProduct, secondProduct);
  let approximateFirst = (startX.x + startX.y) * (endY.x + endY.y);
  let approximateSecond = (startY.x + startY.y) * (endX.x + endX.y);
  let approximateCross = approximateFirst - approximateSecond;
  let errorBound =
    (abs(approximateFirst) + abs(approximateSecond)) * 9.5367431640625e-7;
  let orientationSign = geospatial_sign_normalized_fp64(crossProduct);
  let nearErrorBound = orientationSign != 0 && abs(approximateCross) <= errorBound;
  let underresolved =
    (geospatial_sign_normalized_fp64(start.x) != 0 &&
      geospatial_sign_normalized_fp64(startX) == 0) ||
    (geospatial_sign_normalized_fp64(start.y) != 0 &&
      geospatial_sign_normalized_fp64(startY) == 0) ||
    (geospatial_sign_normalized_fp64(end.x) != 0 &&
      geospatial_sign_normalized_fp64(endX) == 0) ||
    (geospatial_sign_normalized_fp64(end.y) != 0 &&
      geospatial_sign_normalized_fp64(endY) == 0) ||
    (geospatial_sign_normalized_fp64(startX) != 0 &&
      geospatial_sign_normalized_fp64(endY) != 0 &&
      geospatial_sign_normalized_fp64(firstProduct) == 0) ||
    (geospatial_sign_normalized_fp64(startY) != 0 &&
      geospatial_sign_normalized_fp64(endX) != 0 &&
      geospatial_sign_normalized_fp64(secondProduct) == 0);
  return Orientation(
    orientationSign,
    underresolved ||
      nearErrorBound ||
      !geospatial_is_finite_normalized_fp64(firstProduct) ||
      !geospatial_is_finite_normalized_fp64(secondProduct) ||
      !geospatial_is_finite_normalized_fp64(crossProduct)
  );
}

fn ringHasProvableArea(ringStart: u32, ringEnd: u32) -> bool {
  if (ringEnd - ringStart < 3u) { return false; }
  let first = readPolygonPoint(ringStart);
  var second = first;
  var secondFound = false;
  for (var vertexIndex = ringStart + 1u; vertexIndex < ringEnd; vertexIndex++) {
    let candidate = readPolygonPoint(vertexIndex);
    if (!sourcePointsEqual(candidate, first)) {
      second = candidate;
      secondFound = true;
      break;
    }
  }
  if (!secondFound) { return false; }
  let relativeSecond = makeRelativePoint(second, first);
  for (var vertexIndex = ringStart; vertexIndex < ringEnd; vertexIndex++) {
    let candidate = readPolygonPoint(vertexIndex);
    if (sourcePointsEqual(candidate, first) || sourcePointsEqual(candidate, second)) {
      continue;
    }
    let relativeCandidate = makeRelativePoint(candidate, first);
    let orientation = getOrientation(relativeSecond, relativeCandidate);
    if (!orientation.uncertain && orientation.sign != 0) { return true; }
  }
  return false;
}

fn classifyEdge(start: RelativePoint, end: RelativePoint) -> EdgeClassification {
  if (!start.finite || !end.finite || start.underresolved || end.underresolved) {
    return EdgeClassification(false, false, true);
  }
  let startIsPoint = start.exactZeroX && start.exactZeroY;
  let endIsPoint = end.exactZeroX && end.exactZeroY;
  if (startIsPoint || endIsPoint) {
    return EdgeClassification(false, true, false);
  }
  let startYSign = geospatial_sign_normalized_fp64(start.y);
  let endYSign = geospatial_sign_normalized_fp64(end.y);
  let upward = startYSign <= 0 && endYSign > 0;
  let downward = endYSign <= 0 && startYSign > 0;
  let straddlesY = upward || downward;
  let orientation = getOrientation(start, end);
  if (orientation.uncertain) {
    return EdgeClassification(false, false, true);
  }
  if (orientation.sign == 0) {
    let withinSegment = bracketsZero(start.x, end.x) && bracketsZero(start.y, end.y);
    ${ambiguousZeroOrientation}
  }
  let crossing = (upward && orientation.sign > 0) || (downward && orientation.sign < 0);
  return EdgeClassification(crossing, false, false);
}

fn offsetsAreGloballyValid() -> bool {
  return
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET] == 0u &&
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET + ELEMENT_COUNT] == POLYGON_COUNT &&
    polygonOffsets[POLYGON_OFFSETS_OFFSET] == 0u &&
    polygonOffsets[POLYGON_OFFSETS_OFFSET + POLYGON_COUNT] == RING_COUNT &&
    ringOffsets[RING_OFFSETS_OFFSET] == 0u &&
    ringOffsets[RING_OFFSETS_OFFSET + RING_COUNT] == VERTEX_COUNT;
}

fn classifyGeometry(point: ${pointType}, geometryIndex: u32) -> u32 {
  if (!pointIsFinite(point) || !offsetsAreGloballyValid()) { return UNCERTAIN; }
  let geometryStart = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + geometryIndex];
  let geometryEnd = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + geometryIndex + 1u];
  if (geometryStart > geometryEnd || geometryEnd > POLYGON_COUNT) { return UNCERTAIN; }

  var geometryInside = false;
  var boundary = false;
  var uncertain = false;
  for (var polygonIndex = geometryStart; polygonIndex < geometryEnd; polygonIndex++) {
    let polygonStart = polygonOffsets[POLYGON_OFFSETS_OFFSET + polygonIndex];
    let polygonEnd = polygonOffsets[POLYGON_OFFSETS_OFFSET + polygonIndex + 1u];
    if (polygonStart >= polygonEnd || polygonEnd > RING_COUNT) {
      uncertain = true;
      continue;
    }
    var polygonInside = false;
    for (var ringIndex = polygonStart; ringIndex < polygonEnd; ringIndex++) {
      let ringStart = ringOffsets[RING_OFFSETS_OFFSET + ringIndex];
      let ringEnd = ringOffsets[RING_OFFSETS_OFFSET + ringIndex + 1u];
      if (ringStart > ringEnd || ringEnd > VERTEX_COUNT) {
        uncertain = true;
        continue;
      }
      if (!ringHasProvableArea(ringStart, ringEnd)) {
        uncertain = true;
        continue;
      }
      var previous = readRelativePoint(ringEnd - 1u, point);
      for (var vertexIndex = ringStart; vertexIndex < ringEnd; vertexIndex++) {
        let current = readRelativePoint(vertexIndex, point);
        let edge = classifyEdge(previous, current);
        boundary = boundary || edge.boundary;
        uncertain = uncertain || edge.uncertain;
        if (edge.crossing) { polygonInside = !polygonInside; }
        previous = current;
      }
    }
    geometryInside = geometryInside || polygonInside;
  }
  if (uncertain) { return UNCERTAIN; }
  if (boundary) { return BOUNDARY; }
  return select(OUTSIDE, INSIDE, geometryInside);
}`;
}
