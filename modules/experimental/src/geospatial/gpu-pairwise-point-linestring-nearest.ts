// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphBufferUse,
  GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {getViewElementOffset} from '../gpu-primitives/graph-data-view-utils';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  POSITION_FORMATS,
  PRECISE_DISTANCE_WGSL,
  RAW_POINT_WGSL,
  addGeospatialPass,
  assertGraphOwnership,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getPositionReadSource,
  validateDisjointGeospatialViews,
  validateMatchingRows,
  validateRowView
} from './geospatial-utils';

const NO_INDEX = 0xffffffff;

type GPUPairwisePointLinestringNearestBaseProps = {
  /** Prefix for generated graph-node IDs. */
  id?: string;
  /** Part offsets with one more row than `points`. */
  geometryOffsets: GraphDataView<'uint32'>;
  /** Flattened-vertex offsets with one more row than the total linestring-part count. */
  linestringOffsets: GraphDataView<'uint32'>;
  /** Optional local linestring-part ordinal per result row. */
  linestringIndices?: GraphDataView<'uint32'>;
  /** Optional local segment ordinal within the selected linestring part. */
  segmentIndices?: GraphDataView<'uint32'>;
};

/** Properties for nearest queries over aligned local-f32 point and multipart-linestring rows. */
export type GPUFloat32PairwisePointLinestringNearestProps =
  GPUPairwisePointLinestringNearestBaseProps & {
    /** One local f32 point per geometry row. */
    points: GraphDataView<'float32x2'>;
    /** Flattened local f32 linestring vertices. */
    linestringPositions: GraphDataView<'float32x2'>;
    /** Caller-owned f32 distance rows. */
    output: GraphDataView<'float32'>;
    /** Optional caller-owned nearest f32 position rows. */
    nearestPoints?: GraphDataView<'float32x2'>;
  };

/** Properties for nearest queries over aligned raw-binary64 point and multipart-linestring rows. */
export type GPUFloat64PairwisePointLinestringNearestProps =
  GPUPairwisePointLinestringNearestBaseProps & {
    /** One raw binary64 point per geometry row. */
    points: GraphDataView<'uint32x4'>;
    /** Flattened raw binary64 linestring vertices. */
    linestringPositions: GraphDataView<'uint32x4'>;
    /** Caller-owned `[high, low]` double-single distance rows. */
    output: GraphDataView<'float32x2'>;
    /** Optional absolute `[xHigh, xLow, yHigh, yLow]` double-single nearest positions. */
    nearestPoints?: GraphDataView<'float32x4'>;
  };

/** Properties for one aligned point-to-multipart-linestring nearest query. */
export type GPUPairwisePointLinestringNearestProps =
  | GPUFloat32PairwisePointLinestringNearestProps
  | GPUFloat64PairwisePointLinestringNearestProps;

/**
 * Finds the nearest point on one paired multipart linestring for every input point row.
 *
 * `geometryOffsets[i]` and `geometryOffsets[i + 1]` delimit the linestring parts paired with point
 * row `i`. Each part uses `linestringOffsets` to delimit its flattened vertices. Empty and
 * singleton parts contain no segment, parts are never connected implicitly, and rings are never
 * closed implicitly. Malformed offsets or non-finite reachable positions invalidate the whole row.
 * If no segment remains, outputs are NaN and optional indices are `0xffffffff`. Equal-distance
 * ties retain the first part and segment.
 */
export class GPUPairwisePointLinestringNearest implements GPUCommandGraphContributor {
  readonly id: string;
  readonly points: GraphDataView<'float32x2'> | GraphDataView<'uint32x4'>;
  readonly linestringPositions: GraphDataView<'float32x2'> | GraphDataView<'uint32x4'>;
  readonly geometryOffsets: GraphDataView<'uint32'>;
  readonly linestringOffsets: GraphDataView<'uint32'>;
  readonly output: GraphDataView<'float32'> | GraphDataView<'float32x2'>;
  readonly nearestPoints?: GraphDataView<'float32x2'> | GraphDataView<'float32x4'>;
  readonly linestringIndices?: GraphDataView<'uint32'>;
  readonly segmentIndices?: GraphDataView<'uint32'>;

  /** Creates a nearest-linestring contributor without compiling or submitting GPU work. */
  constructor(props: GPUPairwisePointLinestringNearestProps) {
    this.id = props.id ?? 'gpu-pairwise-point-linestring-nearest';
    this.points = props.points;
    this.linestringPositions = props.linestringPositions;
    this.geometryOffsets = props.geometryOffsets;
    this.linestringOffsets = props.linestringOffsets;
    this.output = props.output;
    this.nearestPoints = props.nearestPoints;
    this.linestringIndices = props.linestringIndices;
    this.segmentIndices = props.segmentIndices;

    validateRowView(this.points, POSITION_FORMATS, `${this.id} points`);
    validateRowView(this.linestringPositions, POSITION_FORMATS, `${this.id} linestringPositions`);
    if (this.linestringPositions.format !== this.points.format) {
      throw new Error(`${this.id} position formats must match`);
    }
    validateRowView(this.geometryOffsets, ['uint32'], `${this.id} geometryOffsets`);
    if (this.geometryOffsets.length !== this.points.length + 1) {
      throw new Error(`${this.id} geometryOffsets must contain one more row than points`);
    }
    validateRowView(this.linestringOffsets, ['uint32'], `${this.id} linestringOffsets`);
    if (this.linestringOffsets.length < 1) {
      throw new Error(`${this.id} linestringOffsets must contain a terminal offset`);
    }

    const precise = this.points.format === 'uint32x4';
    validateRowView(this.output, [precise ? 'float32x2' : 'float32'], `${this.id} output`);
    validateMatchingRows(this.points, this.output, `${this.id} points and output`);
    if (this.nearestPoints) {
      validateRowView(
        this.nearestPoints,
        [precise ? 'float32x4' : 'float32x2'],
        `${this.id} nearestPoints`
      );
      validateMatchingRows(this.points, this.nearestPoints, `${this.id} points and nearestPoints`);
    }
    for (const [name, indices] of [
      ['linestringIndices', this.linestringIndices],
      ['segmentIndices', this.segmentIndices]
    ] as const) {
      if (indices) {
        validateRowView(indices, ['uint32'], `${this.id} ${name}`);
        validateMatchingRows(this.points, indices, `${this.id} points and ${name}`);
      }
    }

    validateDisjointGeospatialViews(
      this.id,
      [
        ['points', this.points],
        ['linestringPositions', this.linestringPositions],
        ['geometryOffsets', this.geometryOffsets],
        ['linestringOffsets', this.linestringOffsets]
      ],
      [
        ['output', this.output],
        ...(this.nearestPoints ? ([['nearestPoints', this.nearestPoints]] as const) : []),
        ...(this.linestringIndices
          ? ([['linestringIndices', this.linestringIndices]] as const)
          : []),
        ...(this.segmentIndices ? ([['segmentIndices', this.segmentIndices]] as const) : [])
      ]
    );
  }

  /** Adds the nearest-linestring work to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.points,
      this.linestringPositions,
      this.geometryOffsets,
      this.linestringOffsets,
      this.output,
      ...(this.nearestPoints ? [this.nearestPoints] : []),
      ...(this.linestringIndices ? [this.linestringIndices] : []),
      ...(this.segmentIndices ? [this.segmentIndices] : [])
    ];
    assertGraphOwnership(graph, views, this.id);
    if (this.points.length === 0) return;

    const pointSource = getPositionReadSource('points', this.points);
    const linestringSource = getPositionReadSource('linestringPositions', this.linestringPositions);
    const precise = pointSource.precise;
    const dispatchLayout = getGeospatialDispatchLayout(
      this.points.length,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const outputOffset = getViewElementOffset(this.output) / (precise ? 2 : 1);
    const nearestPointsOffset = this.nearestPoints
      ? getViewElementOffset(this.nearestPoints) / (precise ? 4 : 2)
      : 0;
    const nearestPointDeclaration = this.nearestPoints
      ? `@group(0) @binding(auto) var<storage, read_write> outputNearestPoints: array<${precise ? 'vec4f' : 'vec2f'}>;`
      : '';
    const nearestPointWrite = this.nearestPoints
      ? `outputNearestPoints[${nearestPointsOffset}u + index] = nearestPoint;`
      : '';
    const linestringIndexDeclaration = this.linestringIndices
      ? '@group(0) @binding(auto) var<storage, read_write> outputLinestringIndices: array<u32>;'
      : '';
    const linestringIndexWrite = this.linestringIndices
      ? `outputLinestringIndices[${getViewElementOffset(this.linestringIndices)}u + index] = nearestLinestringIndex;`
      : '';
    const segmentIndexDeclaration = this.segmentIndices
      ? '@group(0) @binding(auto) var<storage, read_write> outputSegmentIndices: array<u32>;'
      : '';
    const segmentIndexWrite = this.segmentIndices
      ? `outputSegmentIndices[${getViewElementOffset(this.segmentIndices)}u + index] = nearestSegmentIndex;`
      : '';
    const expression = precise
      ? getPreciseNearestExpression(
          pointSource,
          linestringSource,
          nearestPointWrite,
          linestringIndexWrite,
          segmentIndexWrite
        )
      : getFloat32NearestExpression(
          pointSource,
          linestringSource,
          nearestPointWrite,
          linestringIndexWrite,
          segmentIndexWrite
        );
    const source = /* wgsl */ `
${precise ? `${RAW_POINT_WGSL}\n${PRECISE_DISTANCE_WGSL}\n${PRECISE_NEAREST_SEGMENT_WGSL}` : FLOAT32_FINITE_WGSL}
const ELEMENT_COUNT: u32 = ${this.points.length}u;
const LINESTRING_COUNT: u32 = ${this.linestringOffsets.length - 1}u;
const LINESTRING_POSITION_COUNT: u32 = ${this.linestringPositions.length}u;
const GEOMETRY_OFFSETS_OFFSET: u32 = ${getViewElementOffset(this.geometryOffsets)}u;
const LINESTRING_OFFSETS_OFFSET: u32 = ${getViewElementOffset(this.linestringOffsets)}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
${pointSource.declaration}
${linestringSource.declaration}
@group(0) @binding(auto) var<storage, read> geometryOffsets: array<u32>;
@group(0) @binding(auto) var<storage, read> linestringOffsets: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputDistances: array<${precise ? 'vec2f' : 'f32'}>;
${nearestPointDeclaration}
${linestringIndexDeclaration}
${segmentIndexDeclaration}

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  ${expression}
}`;
    const resources: GraphBufferUse[] = [
      {buffer: this.points, usage: 'storage-read'},
      {buffer: this.linestringPositions, usage: 'storage-read'},
      {buffer: this.geometryOffsets, usage: 'storage-read'},
      {buffer: this.linestringOffsets, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'}
    ];
    const bindings: Record<string, GraphDataView> = {
      points: this.points,
      linestringPositions: this.linestringPositions,
      geometryOffsets: this.geometryOffsets,
      linestringOffsets: this.linestringOffsets,
      outputDistances: this.output
    };
    if (this.nearestPoints) {
      resources.push({buffer: this.nearestPoints, usage: 'storage-write'});
      bindings['outputNearestPoints'] = this.nearestPoints;
    }
    if (this.linestringIndices) {
      resources.push({buffer: this.linestringIndices, usage: 'storage-write'});
      bindings['outputLinestringIndices'] = this.linestringIndices;
    }
    if (this.segmentIndices) {
      resources.push({buffer: this.segmentIndices, usage: 'storage-write'});
      bindings['outputSegmentIndices'] = this.segmentIndices;
    }
    if (!precise) {
      const initializeSource = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${this.points.length}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
@group(0) @binding(auto) var<storage, read_write> outputDistances: array<f32>;
${nearestPointDeclaration}
${linestringIndexDeclaration}
${segmentIndexDeclaration}

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  // Keep the payload invocation-dependent so WGSL compilers do not try to represent NaN as a
  // constant f32 while folding the bitcast.
  let nan = bitcast<f32>(0x7fc00000u | (index & 0x003fffffu));
  let nearestPoint = vec2f(nan);
  let nearestLinestringIndex = ${NO_INDEX}u;
  let nearestSegmentIndex = ${NO_INDEX}u;
  outputDistances[OUTPUT_OFFSET + index] = nan;
  ${nearestPointWrite}
  ${linestringIndexWrite}
  ${segmentIndexWrite}
}`;
      const initializeResources: GraphBufferUse[] = [
        {buffer: this.output, usage: 'storage-write'},
        ...(this.nearestPoints
          ? [{buffer: this.nearestPoints, usage: 'storage-write'} as const]
          : []),
        ...(this.linestringIndices
          ? [{buffer: this.linestringIndices, usage: 'storage-write'} as const]
          : []),
        ...(this.segmentIndices
          ? [{buffer: this.segmentIndices, usage: 'storage-write'} as const]
          : [])
      ];
      const initializeBindings: Record<string, GraphDataView> = {
        outputDistances: this.output,
        ...(this.nearestPoints ? {outputNearestPoints: this.nearestPoints} : {}),
        ...(this.linestringIndices ? {outputLinestringIndices: this.linestringIndices} : {}),
        ...(this.segmentIndices ? {outputSegmentIndices: this.segmentIndices} : {})
      };
      addGeospatialPass(graph, {
        id: `${this.id}-initialize`,
        source: initializeSource,
        resources: initializeResources,
        bindings: initializeBindings,
        dispatchLayout
      });
    }
    addGeospatialPass(graph, {
      id: this.id,
      source,
      resources,
      bindings,
      dispatchLayout,
      precise
    });
  }
}

function getFloat32NearestExpression(
  pointSource: ReturnType<typeof getPositionReadSource>,
  linestringSource: ReturnType<typeof getPositionReadSource>,
  nearestPointWrite: string,
  linestringIndexWrite: string,
  segmentIndexWrite: string
): string {
  return `let point = ${pointSource.read('index')};
  var rowValid =
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET] == 0u &&
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET + ELEMENT_COUNT] == LINESTRING_COUNT &&
    linestringOffsets[LINESTRING_OFFSETS_OFFSET] == 0u &&
    linestringOffsets[LINESTRING_OFFSETS_OFFSET + LINESTRING_COUNT] ==
      LINESTRING_POSITION_COUNT &&
    geospatial_is_finite_vec2_f32(point);
  var firstLinestring = 0u;
  var endLinestring = 0u;
  if (rowValid) {
    firstLinestring = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + index];
    endLinestring = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + index + 1u];
    rowValid = firstLinestring <= endLinestring && endLinestring <= LINESTRING_COUNT;
  }
  var hasNearest = false;
  var distanceAccumulator = 0.0;
  var nearestPointAccumulator = vec2f(0.0);
  var nearestLinestringIndexAccumulator = 0u;
  var nearestSegmentIndexAccumulator = 0u;
  if (rowValid) {
    var linestringIndex = firstLinestring;
    var firstVertex = 0u;
    var endVertex = 0u;
    var vertexIndex = 0u;
    var scanningLinestring = false;
    for (
      var traversalIndex = 0u;
      traversalIndex < LINESTRING_COUNT + LINESTRING_POSITION_COUNT;
      traversalIndex++
    ) {
      if (!rowValid || linestringIndex >= endLinestring) {
        break;
      }
      if (!scanningLinestring) {
        firstVertex = linestringOffsets[LINESTRING_OFFSETS_OFFSET + linestringIndex];
        endVertex = linestringOffsets[LINESTRING_OFFSETS_OFFSET + linestringIndex + 1u];
        if (firstVertex > endVertex || endVertex > LINESTRING_POSITION_COUNT) {
          rowValid = false;
          continue;
        }
        if (endVertex == firstVertex) {
          linestringIndex++;
          continue;
        }
        if (endVertex == firstVertex + 1u) {
          rowValid = geospatial_is_finite_vec2_f32(
            ${linestringSource.read('firstVertex')}
          );
          linestringIndex++;
          continue;
        }
        vertexIndex = firstVertex;
        scanningLinestring = true;
      }

      let start = ${linestringSource.read('vertexIndex')};
      let end = ${linestringSource.read('vertexIndex + 1u')};
      if (
        !geospatial_is_finite_vec2_f32(start) ||
        !geospatial_is_finite_vec2_f32(end)
      ) {
        rowValid = false;
        continue;
      }
      let directSegment = end - start;
      let directProjection = geospatial_project_onto_segment_f32(
        directSegment,
        point - start
      );
      let coordinateScale = max(
        1.0,
        max(
          max(max(abs(point.x), abs(point.y)), max(abs(start.x), abs(start.y))),
          max(abs(end.x), abs(end.y))
        )
      );
      // A reciprocal of an extreme finite coordinate can be subnormal and flush to zero. Scaling
      // by the coordinate exponent keeps both normalization and reconstruction in the normal path.
      let coordinateExponent = frexp(coordinateScale).exp;
      let normalizedPoint = ldexp(point, vec2i(-coordinateExponent));
      let normalizedStart = ldexp(start, vec2i(-coordinateExponent));
      let normalizedEnd = ldexp(end, vec2i(-coordinateExponent));
      let normalizedSegment = normalizedEnd - normalizedStart;
      let normalizedProjection = geospatial_project_onto_segment_f32(
        normalizedSegment,
        normalizedPoint - normalizedStart
      );
      var projectedDelta = directProjection.projectedDelta;
      var candidatePoint = start;
      if (!directProjection.valid) {
        projectedDelta = normalizedProjection.projectedDelta;
        rowValid = normalizedProjection.valid;
      }
      if (!rowValid) {
        continue;
      }
      if (directProjection.valid) {
        candidatePoint = start + projectedDelta;
      } else {
        candidatePoint = ldexp(
          normalizedStart + projectedDelta,
          vec2i(coordinateExponent)
        );
      }
      let delta = point - candidatePoint;
      let deltaIsFinite = geospatial_is_finite_vec2_f32(delta);
      let deltaScale = max(abs(delta.x), abs(delta.y));
      var candidateDistance = 0.0;
      if (deltaIsFinite && deltaScale > 0.0) {
        let deltaExponent = frexp(deltaScale).exp;
        let normalizedDelta = ldexp(delta, vec2i(-deltaExponent));
        candidateDistance = ldexp(length(normalizedDelta), deltaExponent);
      }
      if (
        !deltaIsFinite ||
        !geospatial_is_finite_vec2_f32(candidatePoint) ||
        !geospatial_is_finite_f32(candidateDistance)
      ) {
        rowValid = false;
        continue;
      }
      var replaceNearest = false;
      if (!hasNearest) {
        replaceNearest = true;
      } else if (candidateDistance < distanceAccumulator) {
        replaceNearest = true;
      }
      if (replaceNearest) {
        hasNearest = true;
        distanceAccumulator = candidateDistance;
        nearestPointAccumulator = candidatePoint;
        nearestLinestringIndexAccumulator = linestringIndex - firstLinestring;
        nearestSegmentIndexAccumulator = vertexIndex - firstVertex;
      }
      vertexIndex++;
      if (vertexIndex >= endVertex - 1u) {
        linestringIndex++;
        scanningLinestring = false;
      }
    }
  }
  if (rowValid && hasNearest) {
    let distance = distanceAccumulator;
    let nearestPoint = nearestPointAccumulator;
    let nearestLinestringIndex = nearestLinestringIndexAccumulator;
    let nearestSegmentIndex = nearestSegmentIndexAccumulator;
    outputDistances[OUTPUT_OFFSET + index] = distance;
    ${nearestPointWrite}
    ${linestringIndexWrite}
    ${segmentIndexWrite}
  }`;
}

function getPreciseNearestExpression(
  pointSource: ReturnType<typeof getPositionReadSource>,
  linestringSource: ReturnType<typeof getPositionReadSource>,
  nearestPointWrite: string,
  linestringIndexWrite: string,
  segmentIndexWrite: string
): string {
  return `let nan = fp64_nan(0.0);
  let point = ${pointSource.read('index')};
  var rowValid =
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET] == 0u &&
    geometryOffsets[GEOMETRY_OFFSETS_OFFSET + ELEMENT_COUNT] == LINESTRING_COUNT &&
    linestringOffsets[LINESTRING_OFFSETS_OFFSET] == 0u &&
    linestringOffsets[LINESTRING_OFFSETS_OFFSET + LINESTRING_COUNT] ==
      LINESTRING_POSITION_COUNT &&
    rawPointIsFinite(point);
  var firstLinestring = 0u;
  var endLinestring = 0u;
  if (rowValid) {
    firstLinestring = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + index];
    endLinestring = geometryOffsets[GEOMETRY_OFFSETS_OFFSET + index + 1u];
    rowValid = firstLinestring <= endLinestring && endLinestring <= LINESTRING_COUNT;
  }
  var hasNearest = false;
  var distance = vec2f(nan, 0.0);
  var nearestPoint = vec4f(nan, 0.0, nan, 0.0);
  var nearestLinestringIndex = ${NO_INDEX}u;
  var nearestSegmentIndex = ${NO_INDEX}u;
  if (rowValid) {
    for (
      var linestringIndex = firstLinestring;
      linestringIndex < endLinestring && rowValid;
      linestringIndex++
    ) {
      let firstVertex = linestringOffsets[LINESTRING_OFFSETS_OFFSET + linestringIndex];
      let endVertex = linestringOffsets[LINESTRING_OFFSETS_OFFSET + linestringIndex + 1u];
      if (firstVertex > endVertex || endVertex > LINESTRING_POSITION_COUNT) {
        rowValid = false;
      } else if (endVertex == firstVertex + 1u) {
        rowValid = rawPointIsFinite(${linestringSource.read('firstVertex')});
      } else if (endVertex > firstVertex) {
        for (
          var vertexIndex = firstVertex;
          vertexIndex < endVertex - 1u;
          vertexIndex++
        ) {
          let candidate = geospatial_nearest_segment(
            point,
            ${linestringSource.read('vertexIndex')},
            ${linestringSource.read('vertexIndex + 1u')}
          );
          if (candidate.valid == 0u) {
            rowValid = false;
            break;
          }
          if (!hasNearest || compare_fp64(candidate.distance, distance) < 0) {
            hasNearest = true;
            distance = candidate.distance;
            nearestPoint = vec4f(
              candidate.nearestX.x,
              candidate.nearestX.y,
              candidate.nearestY.x,
              candidate.nearestY.y
            );
            nearestLinestringIndex = linestringIndex - firstLinestring;
            nearestSegmentIndex = vertexIndex - firstVertex;
          }
        }
      }
    }
  }
  if (!rowValid || !hasNearest) {
    distance = vec2f(nan, 0.0);
    nearestPoint = vec4f(nan, 0.0, nan, 0.0);
    nearestLinestringIndex = ${NO_INDEX}u;
    nearestSegmentIndex = ${NO_INDEX}u;
  }
  outputDistances[OUTPUT_OFFSET + index] = distance;
  ${nearestPointWrite}
  ${linestringIndexWrite}
  ${segmentIndexWrite}`;
}

const FLOAT32_FINITE_WGSL = /* wgsl */ `
struct GeospatialSegmentProjectionF32 {
  projectedDelta: vec2f,
  valid: bool
}

fn geospatial_is_finite_f32(value: f32) -> bool {
  return (bitcast<u32>(value) & 0x7f800000u) != 0x7f800000u;
}

fn geospatial_is_finite_vec2_f32(value: vec2f) -> bool {
  return geospatial_is_finite_f32(value.x) && geospatial_is_finite_f32(value.y);
}

fn geospatial_project_onto_segment_f32(
  segment: vec2f,
  pointFromStart: vec2f
) -> GeospatialSegmentProjectionF32 {
  if (
    !geospatial_is_finite_vec2_f32(segment) ||
    !geospatial_is_finite_vec2_f32(pointFromStart)
  ) {
    return GeospatialSegmentProjectionF32(vec2f(0.0), false);
  }
  let segmentScale = max(abs(segment.x), abs(segment.y));
  if (segmentScale == 0.0) {
    return GeospatialSegmentProjectionF32(vec2f(0.0), true);
  }
  let pointScale = max(abs(pointFromStart.x), abs(pointFromStart.y));
  if (pointScale == 0.0) {
    return GeospatialSegmentProjectionF32(vec2f(0.0), true);
  }
  let segmentExponent = frexp(segmentScale).exp;
  let normalizedSegment = ldexp(segment, vec2i(-segmentExponent));
  var startProjection = dot(pointFromStart, normalizedSegment);
  let denominator = dot(normalizedSegment, normalizedSegment);
  var projectionExponent = 0;
  var endThreshold = ldexp(denominator, segmentExponent);
  if (!geospatial_is_finite_f32(startProjection)) {
    let pointExponent = frexp(pointScale).exp;
    let normalizedPoint = ldexp(pointFromStart, vec2i(-pointExponent));
    startProjection = dot(normalizedPoint, normalizedSegment);
    projectionExponent = pointExponent;
    endThreshold = ldexp(denominator, segmentExponent - pointExponent);
  }
  if (
    !geospatial_is_finite_f32(startProjection) ||
    !geospatial_is_finite_f32(denominator) ||
    denominator <= 0.0
  ) {
    return GeospatialSegmentProjectionF32(vec2f(0.0), false);
  }
  if (startProjection <= 0.0) {
    return GeospatialSegmentProjectionF32(vec2f(0.0), true);
  }
  if (geospatial_is_finite_f32(endThreshold) && startProjection >= endThreshold) {
    return GeospatialSegmentProjectionF32(segment, true);
  }
  // Construct the displacement before restoring scale. A true segment fraction can underflow
  // even when its displacement remains representable, while the scalar projection can overflow
  // before multiplication by a normalized diagonal component brings it back into range.
  let projectedDelta = ldexp(
    (normalizedSegment * startProjection) / denominator,
    vec2i(projectionExponent)
  );
  return GeospatialSegmentProjectionF32(
    projectedDelta,
    geospatial_is_finite_vec2_f32(projectedDelta)
  );
}

`;

const PRECISE_NEAREST_SEGMENT_WGSL = /* wgsl */ `
struct GeospatialNearestSegment {
  distance: vec2f,
  nearestX: vec2f,
  nearestY: vec2f,
  valid: u32
}

fn geospatial_invalid_nearest_segment(seed: f32) -> GeospatialNearestSegment {
  let nan = fp64_nan(seed);
  return GeospatialNearestSegment(
    vec2f(nan, 0.0),
    vec2f(nan, 0.0),
    vec2f(nan, 0.0),
    0u
  );
}

fn geospatial_raw_scalar_to_fp64(value: vec2u) -> vec2f {
  return sub_fp64u32_to_fp64(value, vec2u(0u, 0u));
}

fn geospatial_nearest_segment(
  point: RawPoint,
  start: RawPoint,
  end: RawPoint
) -> GeospatialNearestSegment {
  if (!rawPointIsFinite(point) || !rawPointIsFinite(start) || !rawPointIsFinite(end)) {
    return geospatial_invalid_nearest_segment(0.0);
  }
  let segmentX = sub_fp64u32_to_fp64(end.x, start.x);
  let segmentY = sub_fp64u32_to_fp64(end.y, start.y);
  let pointX = sub_fp64u32_to_fp64(point.x, start.x);
  let pointY = sub_fp64u32_to_fp64(point.y, start.y);
  if (
    !is_finite_fp64(segmentX) || !is_finite_fp64(segmentY) ||
    !is_finite_fp64(pointX) || !is_finite_fp64(pointY)
  ) {
    return geospatial_invalid_nearest_segment(pointX.x + pointY.x);
  }

  let startX = geospatial_raw_scalar_to_fp64(start.x);
  let startY = geospatial_raw_scalar_to_fp64(start.y);
  let endX = geospatial_raw_scalar_to_fp64(end.x);
  let endY = geospatial_raw_scalar_to_fp64(end.y);
  let segmentScale = geospatial_max_abs_fp64(segmentX, segmentY);
  let pointScale = geospatial_max_abs_fp64(pointX, pointY);
  if (segmentScale == 0.0) {
    let distance = geospatial_hypot_fp64(pointX, pointY);
    return GeospatialNearestSegment(
      distance,
      startX,
      startY,
      select(0u, 1u, is_finite_fp64(distance))
    );
  }
  if (pointScale == 0.0) {
    return GeospatialNearestSegment(vec2f(0.0, 0.0), startX, startY, 1u);
  }
  let segmentExponent = frexp(segmentScale).exp;
  let normalizedSegmentX = fp64_scale_fp64_integer(segmentX, -segmentExponent);
  let normalizedSegmentY = fp64_scale_fp64_integer(segmentY, -segmentExponent);
  let directStartProjection = sum_fp64(
    mul_fp64(pointX, normalizedSegmentX),
    mul_fp64(pointY, normalizedSegmentY)
  );
  let denominator = sum_fp64(
    mul_fp64(normalizedSegmentX, normalizedSegmentX),
    mul_fp64(normalizedSegmentY, normalizedSegmentY)
  );
  var startProjection = directStartProjection;
  var projectionExponent = 0;
  var endThreshold = fp64_scale_fp64_integer(denominator, segmentExponent);
  if (!is_finite_fp64(startProjection)) {
    let pointExponent = frexp(pointScale).exp;
    let normalizedPointX = fp64_scale_fp64_integer(pointX, -pointExponent);
    let normalizedPointY = fp64_scale_fp64_integer(pointY, -pointExponent);
    startProjection = sum_fp64(
      mul_fp64(normalizedPointX, normalizedSegmentX),
      mul_fp64(normalizedPointY, normalizedSegmentY)
    );
    projectionExponent = pointExponent;
    endThreshold = fp64_scale_fp64_integer(
      denominator,
      segmentExponent - pointExponent
    );
  }
  if (
    !is_finite_fp64(startProjection) ||
    !is_finite_fp64(denominator) ||
    compare_fp64(denominator, vec2f(0.0, 0.0)) <= 0
  ) {
    return geospatial_invalid_nearest_segment(startProjection.x + denominator.x);
  }

  var projectionX = vec2f(0.0, 0.0);
  var projectionY = vec2f(0.0, 0.0);
  var nearestX = startX;
  var nearestY = startY;
  if (compare_fp64(startProjection, vec2f(0.0, 0.0)) <= 0) {
    // Keep the segment start.
  } else if (
    is_finite_fp64(endThreshold) &&
    compare_fp64(startProjection, endThreshold) >= 0
  ) {
    projectionX = segmentX;
    projectionY = segmentY;
    nearestX = endX;
    nearestY = endY;
  } else {
    // Multiply each normalized segment component before division. This avoids both a tiny true
    // fraction and an overflowing scalar projection when each displacement remains representable.
    projectionX = fp64_scale_fp64_integer(
      div_fp64(mul_fp64(normalizedSegmentX, startProjection), denominator),
      projectionExponent
    );
    projectionY = fp64_scale_fp64_integer(
      div_fp64(mul_fp64(normalizedSegmentY, startProjection), denominator),
      projectionExponent
    );
    if (!is_finite_fp64(projectionX) || !is_finite_fp64(projectionY)) {
      return geospatial_invalid_nearest_segment(projectionX.x + projectionY.x);
    }
    nearestX = sum_fp64(startX, projectionX);
    nearestY = sum_fp64(startY, projectionY);
  }
  let distance = geospatial_hypot_fp64(
    sub_fp64(pointX, projectionX),
    sub_fp64(pointY, projectionY)
  );
  return GeospatialNearestSegment(
    distance,
    nearestX,
    nearestY,
    select(0u, 1u, is_finite_fp64(distance))
  );
}
`;
