// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {
  GPUPairwisePointInPolygon,
  GPU_POINT_IN_POLYGON_CLASSIFICATION
} from '../../src/geospatial/gpu-pairwise-point-in-polygon';

const {outside, inside, boundary, uncertain} = GPU_POINT_IN_POLYGON_CLASSIFICATION;

test('GPUPairwisePointInPolygon classifies f32 polygons and malformed inputs', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const square = makeSquare(0, 0, 10, 10, true);
  const cases: PointInPolygonCase[] = [
    {name: 'shell interior', point: [5, 5], geometry: [[square]]},
    {name: 'shell exterior', point: [15, 5], geometry: [[square]]},
    {name: 'vertical shell boundary', point: [0, 4], geometry: [[square]]},
    {
      name: 'hole interior',
      point: [5, 5],
      geometry: [[square, makeSquare(3, 3, 7, 7)]]
    },
    {
      name: 'multipolygon interior',
      point: [25, 25],
      geometry: [[makeSquare(-10, -10, -8, -8)], [makeSquare(20, 20, 30, 30)]]
    },
    {name: 'non-finite point', point: [Number.NaN, 5], geometry: [[square]]},
    {
      name: 'non-finite vertex',
      point: [5, 5],
      geometry: [
        [
          [
            [0, 0],
            [10, 0],
            [Number.NaN, 10],
            [0, 10]
          ]
        ]
      ]
    },
    {
      name: 'repeated-only ring',
      point: [0.5, 0.25],
      geometry: [
        [
          [
            [0, 0],
            [1, 0],
            [0, 0],
            [0, 0]
          ]
        ]
      ]
    },
    {name: 'empty geometry', point: [0, 0], geometry: []},
    {name: 'empty polygon', point: [0, 0], geometry: [[]]},
    {
      name: 'diagonal boundary',
      point: [1, 1],
      geometry: [
        [
          [
            [0, 0],
            [2, 2],
            [0, 2]
          ]
        ]
      ],
      allowUncertain: true
    },
    {
      name: 'one-ULP diagonal interior',
      point: [0.5, Math.fround(0.5 + 2 ** -24)],
      geometry: [
        [
          [
            [0, 0],
            [1, 1],
            [0, 1]
          ]
        ]
      ],
      allowUncertain: true
    },
    {
      name: 'all-collinear diagonal ring',
      point: [0, 1],
      geometry: [
        [
          [
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3]
          ]
        ]
      ]
    },
    {
      name: 'all-collinear axis-aligned ring',
      point: [1, 0],
      geometry: [
        [
          [
            [0, 0],
            [1, 0],
            [2, 0]
          ]
        ]
      ]
    },
    {
      name: 'shell outside hole',
      point: [1, 1],
      geometry: [[square, makeSquare(3, 3, 7, 7)]]
    },
    {
      name: 'hole boundary',
      point: [3, 5],
      geometry: [[square, makeSquare(3, 3, 7, 7)]]
    },
    {
      name: 'multipolygon gap',
      point: [15, 15],
      geometry: [[makeSquare(0, 0, 10, 10)], [makeSquare(20, 20, 30, 30)]]
    },
    {
      name: 'valid repeated vertex',
      point: [5, 5],
      geometry: [
        [
          [
            [0, 0],
            [10, 0],
            [10, 0],
            [10, 10],
            [0, 10]
          ]
        ]
      ]
    },
    {name: 'implicit closing edge boundary', point: [0, 4], geometry: [[makeSquare(0, 0, 10, 10)]]}
  ];
  const geometries = cases.map(testCase => testCase.geometry);
  const points = cases.map(testCase => testCase.point);
  const hierarchy = flattenGeometries(geometries);
  const buffers = {
    points: createBuffer(device, encodeFloat32Points(points), Buffer.STORAGE),
    positions: createBuffer(device, encodeFloat32Points(hierarchy.positions), Buffer.STORAGE),
    geometryOffsets: createBuffer(device, hierarchy.geometryOffsets, Buffer.STORAGE),
    polygonOffsets: createBuffer(device, hierarchy.polygonOffsets, Buffer.STORAGE),
    ringOffsets: createBuffer(device, hierarchy.ringOffsets, Buffer.STORAGE),
    output: createOutputBuffer(device, points.length * Uint32Array.BYTES_PER_ELEMENT)
  };
  const graph = new GPUCommandGraph(device, {id: 'pairwise-point-in-polygon-f32-test'});
  const pointView = importView(graph, 'points', buffers.points, 'float32x2', points.length);
  const positionView = importView(
    graph,
    'polygon-positions',
    buffers.positions,
    'float32x2',
    hierarchy.positions.length
  );
  const geometryOffsetView = importView(
    graph,
    'geometry-offsets',
    buffers.geometryOffsets,
    'uint32',
    hierarchy.geometryOffsets.length
  );
  const polygonOffsetView = importView(
    graph,
    'polygon-offsets',
    buffers.polygonOffsets,
    'uint32',
    hierarchy.polygonOffsets.length
  );
  const ringOffsetView = importView(
    graph,
    'ring-offsets',
    buffers.ringOffsets,
    'uint32',
    hierarchy.ringOffsets.length
  );
  const outputView = importView(graph, 'output', buffers.output, 'uint32', points.length);

  new GPUPairwisePointInPolygon({
    points: pointView,
    polygonPositions: positionView,
    geometryOffsets: geometryOffsetView,
    polygonOffsets: polygonOffsetView,
    ringOffsets: ringOffsetView,
    output: outputView
  }).addToGraph(graph);

  tapeTest.throws(
    () =>
      new GPUPairwisePointInPolygon({
        points: pointView,
        polygonPositions: positionView,
        geometryOffsets: geometryOffsetView,
        polygonOffsets: polygonOffsetView,
        ringOffsets: ringOffsetView,
        output: importView(graph, 'short-output', buffers.output, 'uint32', points.length - 1)
      }),
    /output.length must equal points.length/
  );
  tapeTest.throws(
    () =>
      new GPUPairwisePointInPolygon({
        points: pointView,
        polygonPositions: positionView,
        geometryOffsets: importView(
          graph,
          'short-geometry-offsets',
          buffers.geometryOffsets,
          'uint32',
          points.length
        ),
        polygonOffsets: polygonOffsetView,
        ringOffsets: ringOffsetView,
        output: outputView
      }),
    /geometryOffsets.length must equal points.length \+ 1/
  );
  tapeTest.throws(
    () =>
      new GPUPairwisePointInPolygon({
        points: pointView,
        polygonPositions: positionView,
        geometryOffsets: geometryOffsetView,
        polygonOffsets: polygonOffsetView,
        ringOffsets: ringOffsetView,
        output: importView(graph, 'aliased-output', buffers.points, 'uint32', points.length)
      }),
    /output and points must not overlap/
  );

  if (isSoftwareBackedDevice(device)) {
    // SwiftShader spends more than 100 seconds compiling integer-fp64, then loses the GPU device.
    tapeTest.comment('Skipping precise f32 point-in-polygon execution on software WebGPU');
    for (const buffer of Object.values(buffers)) buffer.destroy();
    tapeTest.end();
    return;
  }

  const compiled = graph.compile();
  encode(device, compiled);
  const classifications = await readUint32(buffers.output, points.length);
  for (let index = 0; index < cases.length; index++) {
    assertPointInPolygonConformance(tapeTest, classifications[index], cases[index]);
  }

  compiled.destroy();
  for (const buffer of Object.values(buffers)) buffer.destroy();
  tapeTest.end();
});

test('GPUPairwisePointInPolygon preserves raw binary64 deltas and explicit ambiguity', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    tapeTest.comment('Skipping slow integer fp64 point-in-polygon shader on software WebGPU');
    tapeTest.end();
    return;
  }

  const largeOrigin = 1_000_000_000_000;
  const smallOrigin = 20_000_000;
  const smallDelta = 2 ** -20;
  const largeSquare = makeSquare(largeOrigin, largeOrigin, largeOrigin + 1, largeOrigin + 1);
  const cases: PointInPolygonCase[] = [
    {
      name: 'raw large-origin interior',
      point: [largeOrigin + 0.5, largeOrigin + 0.5],
      geometry: [[largeSquare]]
    },
    {
      name: 'raw large-origin exterior',
      point: [largeOrigin + 2, largeOrigin + 0.5],
      geometry: [[largeSquare]]
    },
    {
      name: 'raw large-origin boundary',
      point: [largeOrigin, largeOrigin + 0.5],
      geometry: [[largeSquare]]
    },
    {
      name: 'raw diagonal ambiguity',
      point: [largeOrigin + 0.5, largeOrigin + 0.5],
      geometry: [
        [
          [
            [largeOrigin, largeOrigin],
            [largeOrigin + 1, largeOrigin + 1],
            [largeOrigin, largeOrigin + 1]
          ]
        ]
      ],
      allowUncertain: true
    },
    {
      name: 'raw sub-f32-delta interior',
      point: [smallOrigin + smallDelta * 2, smallOrigin + smallDelta * 2],
      geometry: [
        [
          [
            [smallOrigin, smallOrigin],
            [smallOrigin + smallDelta * 4, smallOrigin],
            [smallOrigin + smallDelta * 4, smallOrigin + smallDelta * 4],
            [smallOrigin, smallOrigin + smallDelta * 4]
          ]
        ]
      ]
    }
  ];
  const geometries = cases.map(testCase => testCase.geometry);
  const points = cases.map(testCase => testCase.point);
  const hierarchy = flattenGeometries(geometries);
  const buffers = {
    points: createBuffer(device, encodeFloat64Points(points), Buffer.STORAGE),
    positions: createBuffer(device, encodeFloat64Points(hierarchy.positions), Buffer.STORAGE),
    geometryOffsets: createBuffer(device, hierarchy.geometryOffsets, Buffer.STORAGE),
    polygonOffsets: createBuffer(device, hierarchy.polygonOffsets, Buffer.STORAGE),
    ringOffsets: createBuffer(device, hierarchy.ringOffsets, Buffer.STORAGE),
    output: createOutputBuffer(device, points.length * Uint32Array.BYTES_PER_ELEMENT)
  };
  const graph = new GPUCommandGraph(device, {id: 'pairwise-point-in-polygon-raw-test'});

  new GPUPairwisePointInPolygon({
    points: importView(graph, 'points', buffers.points, 'uint32x4', points.length),
    polygonPositions: importView(
      graph,
      'polygon-positions',
      buffers.positions,
      'uint32x4',
      hierarchy.positions.length
    ),
    geometryOffsets: importView(
      graph,
      'geometry-offsets',
      buffers.geometryOffsets,
      'uint32',
      hierarchy.geometryOffsets.length
    ),
    polygonOffsets: importView(
      graph,
      'polygon-offsets',
      buffers.polygonOffsets,
      'uint32',
      hierarchy.polygonOffsets.length
    ),
    ringOffsets: importView(
      graph,
      'ring-offsets',
      buffers.ringOffsets,
      'uint32',
      hierarchy.ringOffsets.length
    ),
    output: importView(graph, 'output', buffers.output, 'uint32', points.length)
  }).addToGraph(graph);

  const compiled = graph.compile();
  encode(device, compiled);
  const classifications = await readUint32(buffers.output, points.length);
  for (let index = 0; index < cases.length; index++) {
    assertPointInPolygonConformance(tapeTest, classifications[index], cases[index]);
  }

  compiled.destroy();
  for (const buffer of Object.values(buffers)) buffer.destroy();
  tapeTest.end();
});

type Point = readonly [number, number];
type Ring = readonly Point[];
type Polygon = readonly Ring[];
type Geometry = readonly Polygon[];
type PointInPolygonCase = {
  name: string;
  point: Point;
  geometry: Geometry;
  allowUncertain?: boolean;
};

function assertPointInPolygonConformance(
  tapeTest: {equal: (actual: unknown, expected: unknown, message?: string) => void},
  actual: number,
  testCase: PointInPolygonCase
): void {
  const expected = getPointInPolygonClassification(testCase.point, testCase.geometry);
  if (testCase.allowUncertain && actual === uncertain) {
    tapeTest.equal(actual, uncertain, `${testCase.name} is explicitly classified as ambiguous`);
    return;
  }
  tapeTest.equal(actual, expected, `${testCase.name} matches the deterministic CPU oracle`);
}

function getPointInPolygonClassification(point: Point, geometry: Geometry): number {
  if (!isFinitePoint(point)) return uncertain;
  let geometryInside = false;
  let geometryBoundary = false;
  let geometryUncertain = false;

  for (const polygon of geometry) {
    if (polygon.length === 0) {
      geometryUncertain = true;
      continue;
    }
    let polygonInside = false;
    for (const ring of polygon) {
      const ringClassification = getRingClassification(point, ring);
      if (ringClassification === uncertain) geometryUncertain = true;
      if (ringClassification === boundary) geometryBoundary = true;
      if (ringClassification === inside) polygonInside = !polygonInside;
    }
    geometryInside = geometryInside || polygonInside;
  }

  if (geometryUncertain) return uncertain;
  if (geometryBoundary) return boundary;
  return geometryInside ? inside : outside;
}

function getRingClassification(point: Point, ring: Ring): number {
  if (!ringHasArea(ring)) return uncertain;
  let ringInside = false;
  let previous = ring[ring.length - 1];
  for (const current of ring) {
    if (pointIsOnSegment(point, previous, current)) return boundary;
    const upward = previous[1] <= point[1] && current[1] > point[1];
    const downward = current[1] <= point[1] && previous[1] > point[1];
    const orientation = getOrientation(point, previous, current);
    if ((upward && orientation > 0) || (downward && orientation < 0)) {
      ringInside = !ringInside;
    }
    previous = current;
  }
  return ringInside ? inside : outside;
}

function ringHasArea(ring: Ring): boolean {
  if (ring.length < 3 || ring.some(point => !isFinitePoint(point))) return false;
  const first = ring[0];
  const second = ring.find(point => !pointsEqual(point, first));
  if (!second) return false;
  return ring.some(
    point =>
      !pointsEqual(point, first) &&
      !pointsEqual(point, second) &&
      getOrientation(first, second, point) !== 0
  );
}

function pointIsOnSegment(point: Point, start: Point, end: Point): boolean {
  return (
    getOrientation(point, start, end) === 0 &&
    point[0] >= Math.min(start[0], end[0]) &&
    point[0] <= Math.max(start[0], end[0]) &&
    point[1] >= Math.min(start[1], end[1]) &&
    point[1] <= Math.max(start[1], end[1])
  );
}

function getOrientation(origin: Point, first: Point, second: Point): number {
  const crossProduct =
    (first[0] - origin[0]) * (second[1] - origin[1]) -
    (first[1] - origin[1]) * (second[0] - origin[0]);
  return Math.sign(crossProduct);
}

function isFinitePoint(point: Point): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function pointsEqual(first: Point, second: Point): boolean {
  return first[0] === second[0] && first[1] === second[1];
}

function makeSquare(
  minimumX: number,
  minimumY: number,
  maximumX: number,
  maximumY: number,
  explicitlyClosed: boolean = false
): Ring {
  const ring: Point[] = [
    [minimumX, minimumY],
    [maximumX, minimumY],
    [maximumX, maximumY],
    [minimumX, maximumY]
  ];
  if (explicitlyClosed) ring.push(ring[0]);
  return ring;
}

function flattenGeometries(geometries: readonly Geometry[]): {
  positions: Point[];
  geometryOffsets: Uint32Array;
  polygonOffsets: Uint32Array;
  ringOffsets: Uint32Array;
} {
  const positions: Point[] = [];
  const geometryOffsets = [0];
  const polygonOffsets = [0];
  const ringOffsets = [0];
  let polygonCount = 0;
  let ringCount = 0;
  for (const geometry of geometries) {
    for (const polygon of geometry) {
      for (const ring of polygon) {
        positions.push(...ring);
        ringCount++;
        ringOffsets.push(positions.length);
      }
      polygonCount++;
      polygonOffsets.push(ringCount);
    }
    geometryOffsets.push(polygonCount);
  }
  return {
    positions,
    geometryOffsets: Uint32Array.from(geometryOffsets),
    polygonOffsets: Uint32Array.from(polygonOffsets),
    ringOffsets: Uint32Array.from(ringOffsets)
  };
}

function encodeFloat32Points(points: readonly Point[]): Float32Array {
  return Float32Array.from(points.flatMap(point => point));
}

function encodeFloat64Points(points: readonly Point[]): Uint32Array {
  const values = new Float64Array(points.length * 2);
  for (let index = 0; index < points.length; index++) {
    values[index * 2] = points[index][0];
    values[index * 2 + 1] = points[index][1];
  }
  return new Uint32Array(values.buffer);
}

function createBuffer(device: Device, data: Float32Array | Uint32Array, usage: number): Buffer {
  return device.createBuffer({data, usage: usage | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, byteLength: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(byteLength, Uint32Array.BYTES_PER_ELEMENT),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length});
}

async function readUint32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, length));
}

function encode(device: Device, compiled: ReturnType<GPUCommandGraph<void>['compile']>): void {
  const commandEncoder = device.createCommandEncoder({id: 'point-in-polygon-test-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
