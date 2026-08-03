// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {GPUPairwisePointLinestringNearest} from '../../src/geospatial/gpu-pairwise-point-linestring-nearest';

const NO_INDEX = 0xffffffff;

test('GPUPairwisePointLinestringNearest covers multipart f32 topology and optional outputs', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  const pointValues = Float32Array.from([1, 1, 3, 4, 1, 1, 1.5, 1, 1, 0, 1, 0, 0, 0, 1, 1, 5, 1]);
  const linestringValues = Float32Array.from([
    0,
    0,
    2,
    1,
    2,
    1,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    1,
    0,
    1,
    0,
    1,
    1,
    0,
    0,
    Number.NaN,
    0,
    2,
    0,
    2,
    2,
    Number.NaN,
    0,
    1,
    0,
    0,
    0,
    0,
    2,
    4,
    0,
    4,
    2
  ]);
  const geometryOffsetValues = Uint32Array.from([0, 0, 1, 2, 3, 5, 6, 7, 8, 10]);
  const linestringOffsetValues = Uint32Array.from([0, 1, 3, 6, 8, 10, 14, 16, 16, 18, 20]);
  const pointBuffer = createInputBuffer(device, pointValues);
  const linestringBuffer = createInputBuffer(device, linestringValues);
  const geometryOffsetsBuffer = createInputBuffer(device, geometryOffsetValues);
  const linestringOffsetsBuffer = createInputBuffer(device, linestringOffsetValues);
  const distanceBuffer = createOutputBuffer(device, pointValues.length / 2, 4);
  const nearestPointBuffer = createOutputBuffer(device, pointValues.length / 2, 8);
  const linestringIndexBuffer = createOutputBuffer(device, pointValues.length / 2, 4);
  const segmentIndexBuffer = createOutputBuffer(device, pointValues.length / 2, 4);
  const graph = new GPUCommandGraph(device, {id: 'pairwise-linestring-nearest-f32'});
  const points = importView(graph, 'points', pointBuffer, 'float32x2', pointValues.length / 2);
  const linestringPositions = importView(
    graph,
    'linestring-positions',
    linestringBuffer,
    'float32x2',
    linestringValues.length / 2
  );
  const geometryOffsets = importView(
    graph,
    'geometry-offsets',
    geometryOffsetsBuffer,
    'uint32',
    geometryOffsetValues.length
  );
  const linestringOffsets = importView(
    graph,
    'linestring-offsets',
    linestringOffsetsBuffer,
    'uint32',
    linestringOffsetValues.length
  );
  const output = importView(graph, 'distances', distanceBuffer, 'float32', pointValues.length / 2);
  const nearestPoints = importView(
    graph,
    'nearest-points',
    nearestPointBuffer,
    'float32x2',
    pointValues.length / 2
  );
  const linestringIndices = importView(
    graph,
    'linestring-indices',
    linestringIndexBuffer,
    'uint32',
    pointValues.length / 2
  );
  const segmentIndices = importView(
    graph,
    'segment-indices',
    segmentIndexBuffer,
    'uint32',
    pointValues.length / 2
  );

  tapeTest.throws(
    () =>
      new GPUPairwisePointLinestringNearest({
        points,
        linestringPositions,
        geometryOffsets: importView(
          graph,
          'short-geometry-offsets',
          geometryOffsetsBuffer,
          'uint32',
          geometryOffsetValues.length - 1
        ),
        linestringOffsets,
        output
      }),
    /one more row than points/,
    'one geometry interval is required per point row'
  );
  tapeTest.throws(
    () =>
      new GPUPairwisePointLinestringNearest({
        points,
        linestringPositions,
        geometryOffsets,
        linestringOffsets,
        output: importView(
          graph,
          'physical-alias-output',
          pointBuffer,
          'float32',
          pointValues.length / 2
        )
      }),
    /output output and points must not overlap/,
    'distinct handles backed by one core buffer cannot alias'
  );
  tapeTest.throws(
    () =>
      new GPUPairwisePointLinestringNearest({
        points,
        linestringPositions,
        geometryOffsets,
        linestringOffsets,
        output,
        nearestPoints,
        linestringIndices: importView(
          graph,
          'physical-alias-linestring-indices',
          nearestPointBuffer,
          'uint32',
          pointValues.length / 2
        )
      }),
    /output linestringIndices and output nearestPoints must not overlap/,
    'optional outputs cannot alias through distinct handles'
  );

  new GPUPairwisePointLinestringNearest({
    points,
    linestringPositions,
    geometryOffsets,
    linestringOffsets,
    output,
    nearestPoints,
    linestringIndices,
    segmentIndices
  }).addToGraph(graph);
  const compiled = graph.compile();
  encode(device, compiled);

  const distances = await readFloat32(distanceBuffer, pointValues.length / 2);
  const expectedDistances = [
    Number.NaN,
    Number.NaN,
    1,
    0.5,
    0,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    1
  ];
  for (let index = 0; index < expectedDistances.length; index++) {
    if (Number.isNaN(expectedDistances[index])) {
      tapeTest.ok(Number.isNaN(distances[index]), `distance ${index} is invalid`);
    } else {
      tapeTest.equal(distances[index], expectedDistances[index], `distance ${index}`);
    }
  }

  const nearest = await readFloat32(nearestPointBuffer, pointValues.length);
  const expectedNearest = [
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    2,
    1,
    2,
    1,
    1,
    0,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    Number.NaN,
    4,
    1
  ];
  for (let index = 0; index < expectedNearest.length; index++) {
    if (Number.isNaN(expectedNearest[index])) {
      tapeTest.ok(Number.isNaN(nearest[index]), `nearest component ${index} is invalid`);
    } else {
      tapeTest.equal(nearest[index], expectedNearest[index], `nearest component ${index}`);
    }
  }
  tapeTest.deepEqual(await readUint32(linestringIndexBuffer, pointValues.length / 2), [
    NO_INDEX,
    NO_INDEX,
    0,
    0,
    0,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX,
    1
  ]);
  tapeTest.deepEqual(await readUint32(segmentIndexBuffer, pointValues.length / 2), [
    NO_INDEX,
    NO_INDEX,
    0,
    1,
    0,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX,
    0
  ]);

  compiled.destroy();
  for (const buffer of [
    pointBuffer,
    linestringBuffer,
    geometryOffsetsBuffer,
    linestringOffsetsBuffer,
    distanceBuffer,
    nearestPointBuffer,
    linestringIndexBuffer,
    segmentIndexBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUPairwisePointLinestringNearest invalidates malformed offset rows', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const pointValues = Float32Array.from([0, 1, 0, 1, 0, 1, 0, 1, 0, 1]);
  const linestringValues = Float32Array.from([0, 0, 2, 0, 0, 0, 2, 0]);
  const geometryOffsetValues = Uint32Array.from([0, 1, 0, 2, 3, 4]);
  const linestringOffsetValues = Uint32Array.from([0, 2, 1, 5, 4]);
  const pointBuffer = createInputBuffer(device, pointValues);
  const linestringBuffer = createInputBuffer(device, linestringValues);
  const geometryOffsetsBuffer = createInputBuffer(device, geometryOffsetValues);
  const linestringOffsetsBuffer = createInputBuffer(device, linestringOffsetValues);
  const distanceBuffer = createOutputBuffer(device, 5, 4);
  const linestringIndexBuffer = createOutputBuffer(device, 5, 4);
  const segmentIndexBuffer = createOutputBuffer(device, 5, 4);
  const graph = new GPUCommandGraph(device, {id: 'pairwise-linestring-nearest-malformed'});

  new GPUPairwisePointLinestringNearest({
    points: importView(graph, 'points', pointBuffer, 'float32x2', 5),
    linestringPositions: importView(
      graph,
      'linestring-positions',
      linestringBuffer,
      'float32x2',
      4
    ),
    geometryOffsets: importView(graph, 'geometry-offsets', geometryOffsetsBuffer, 'uint32', 6),
    linestringOffsets: importView(
      graph,
      'linestring-offsets',
      linestringOffsetsBuffer,
      'uint32',
      5
    ),
    output: importView(graph, 'distances', distanceBuffer, 'float32', 5),
    linestringIndices: importView(graph, 'linestring-indices', linestringIndexBuffer, 'uint32', 5),
    segmentIndices: importView(graph, 'segment-indices', segmentIndexBuffer, 'uint32', 5)
  }).addToGraph(graph);
  const compiled = graph.compile();
  encode(device, compiled);

  const distances = await readFloat32(distanceBuffer, 5);
  tapeTest.equal(distances[0], 1, 'the well-formed row remains queryable');
  for (let index = 1; index < distances.length; index++) {
    tapeTest.ok(Number.isNaN(distances[index]), `malformed row ${index} is invalid`);
  }
  tapeTest.deepEqual(await readUint32(linestringIndexBuffer, 5), [
    0,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX
  ]);
  tapeTest.deepEqual(await readUint32(segmentIndexBuffer, 5), [
    0,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX,
    NO_INDEX
  ]);

  geometryOffsetsBuffer.write(Uint32Array.from([1, 1, 1, 2, 3, 4]));
  encode(device, compiled);
  for (const [index, distance] of (await readFloat32(distanceBuffer, 5)).entries()) {
    tapeTest.ok(Number.isNaN(distance), `nonzero global geometry start invalidates row ${index}`);
  }

  geometryOffsetsBuffer.write(geometryOffsetValues);
  linestringOffsetsBuffer.write(Uint32Array.from([0, 2, 1, 5, 3]));
  encode(device, compiled);
  for (const [index, distance] of (await readFloat32(distanceBuffer, 5)).entries()) {
    tapeTest.ok(Number.isNaN(distance), `wrong global vertex terminal invalidates row ${index}`);
  }

  compiled.destroy();
  for (const buffer of [
    pointBuffer,
    linestringBuffer,
    geometryOffsetsBuffer,
    linestringOffsetsBuffer,
    distanceBuffer,
    linestringIndexBuffer,
    segmentIndexBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUPairwisePointLinestringNearest keeps extreme finite f32 rows finite', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const pointValues = Float32Array.from([3e38, 1e38, -3e38, -1e38, 0.5, 1e30, 1e38, 1e38, 1, 1]);
  const linestringValues = Float32Array.from([
    2e38, 0, 3e38, 0, -2e38, 0, -3e38, 0, 0, 0, 1, 0, 0, 0, 3e38, 3e38, 0, 0, 3e38, 0
  ]);
  const geometryOffsetValues = Uint32Array.from([0, 1, 2, 3, 4, 5]);
  const linestringOffsetValues = Uint32Array.from([0, 2, 4, 6, 8, 10]);
  const pointBuffer = createInputBuffer(device, pointValues);
  const linestringBuffer = createInputBuffer(device, linestringValues);
  const geometryOffsetsBuffer = createInputBuffer(device, geometryOffsetValues);
  const linestringOffsetsBuffer = createInputBuffer(device, linestringOffsetValues);
  const distanceBuffer = createOutputBuffer(device, 5, 4);
  const nearestPointBuffer = createOutputBuffer(device, 5, 8);
  const graph = new GPUCommandGraph(device, {id: 'pairwise-linestring-nearest-extreme'});

  new GPUPairwisePointLinestringNearest({
    points: importView(graph, 'points', pointBuffer, 'float32x2', 5),
    linestringPositions: importView(
      graph,
      'linestring-positions',
      linestringBuffer,
      'float32x2',
      10
    ),
    geometryOffsets: importView(graph, 'geometry-offsets', geometryOffsetsBuffer, 'uint32', 6),
    linestringOffsets: importView(
      graph,
      'linestring-offsets',
      linestringOffsetsBuffer,
      'uint32',
      6
    ),
    output: importView(graph, 'distances', distanceBuffer, 'float32', 5),
    nearestPoints: importView(graph, 'nearest-points', nearestPointBuffer, 'float32x2', 5)
  }).addToGraph(graph);
  const compiled = graph.compile();
  encode(device, compiled);

  const distances = await readFloat32(distanceBuffer, 5);
  for (const [index, distance] of distances.slice(0, 2).entries()) {
    assertRelativeClose(tapeTest, distance, 1e38, 2e-6, `extreme distance ${index}`);
  }
  assertRelativeClose(tapeTest, distances[2], 1e30, 2e-6, 'far perpendicular distance');
  tapeTest.ok(distances[3] <= 2e32, 'long-diagonal projection remains near the point');
  tapeTest.equal(distances[4], 1, 'tiny fraction retains its perpendicular distance');
  const nearestPoints = await readFloat32(nearestPointBuffer, 10);
  assertRelativeClose(tapeTest, nearestPoints[0], 3e38, 2e-6, 'extreme positive nearest x');
  tapeTest.equal(nearestPoints[1], 0, 'extreme positive nearest y');
  assertRelativeClose(tapeTest, nearestPoints[2], -3e38, 2e-6, 'extreme negative nearest x');
  tapeTest.equal(nearestPoints[3], 0, 'extreme negative nearest y');
  tapeTest.equal(nearestPoints[4], 0.5, 'far point retains the short-segment projection');
  tapeTest.equal(nearestPoints[5], 0, 'far point projects onto the short segment');
  assertRelativeClose(tapeTest, nearestPoints[6], 1e38, 2e-6, 'long-diagonal nearest x');
  assertRelativeClose(tapeTest, nearestPoints[7], 1e38, 2e-6, 'long-diagonal nearest y');
  tapeTest.equal(nearestPoints[8], 1, 'tiny fraction retains its projected displacement');
  tapeTest.equal(nearestPoints[9], 0, 'tiny fraction projects onto the huge segment');

  compiled.destroy();
  for (const buffer of [
    pointBuffer,
    linestringBuffer,
    geometryOffsetsBuffer,
    linestringOffsetsBuffer,
    distanceBuffer,
    nearestPointBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUPairwisePointLinestringNearest compiles independent optional outputs at nonzero offsets', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const byteOffset = 16;
  const configurations = [
    {id: 'distance-only'},
    {id: 'nearest-point', nearestPoint: true},
    {id: 'linestring-index', linestringIndex: true},
    {id: 'segment-index', segmentIndex: true}
  ];
  for (const configuration of configurations) {
    const pointBuffer = createInputBuffer(device, Float32Array.from([0, 0, 0, 0, 1, 1]));
    const linestringBuffer = createInputBuffer(device, Float32Array.from([0, 0, 0, 0, 0, 0, 2, 0]));
    const geometryOffsetsBuffer = createInputBuffer(device, Uint32Array.from([0, 0, 0, 0, 0, 1]));
    const linestringOffsetsBuffer = createInputBuffer(device, Uint32Array.from([0, 0, 0, 0, 0, 2]));
    const distanceBuffer = createOutputBuffer(device, 1, 4, byteOffset);
    const nearestPointBuffer = createOutputBuffer(device, 1, 8, byteOffset);
    const linestringIndexBuffer = createOutputBuffer(device, 1, 4, byteOffset);
    const segmentIndexBuffer = createOutputBuffer(device, 1, 4, byteOffset);
    const graph = new GPUCommandGraph(device, {id: configuration.id});
    const nearestPoints = configuration.nearestPoint
      ? importView(graph, 'nearest-point', nearestPointBuffer, 'float32x2', 1, byteOffset)
      : undefined;
    const linestringIndices = configuration.linestringIndex
      ? importView(graph, 'linestring-index', linestringIndexBuffer, 'uint32', 1, byteOffset)
      : undefined;
    const segmentIndices = configuration.segmentIndex
      ? importView(graph, 'segment-index', segmentIndexBuffer, 'uint32', 1, byteOffset)
      : undefined;

    new GPUPairwisePointLinestringNearest({
      points: importView(graph, 'points', pointBuffer, 'float32x2', 1, byteOffset),
      linestringPositions: importView(
        graph,
        'linestring-positions',
        linestringBuffer,
        'float32x2',
        2,
        byteOffset
      ),
      geometryOffsets: importView(
        graph,
        'geometry-offsets',
        geometryOffsetsBuffer,
        'uint32',
        2,
        byteOffset
      ),
      linestringOffsets: importView(
        graph,
        'linestring-offsets',
        linestringOffsetsBuffer,
        'uint32',
        2,
        byteOffset
      ),
      output: importView(graph, 'distance', distanceBuffer, 'float32', 1, byteOffset),
      nearestPoints,
      linestringIndices,
      segmentIndices
    }).addToGraph(graph);
    const compiled = graph.compile();
    encode(device, compiled);

    tapeTest.equal(
      (await readFloat32(distanceBuffer, 1, byteOffset))[0],
      1,
      `${configuration.id} distance`
    );
    if (configuration.nearestPoint) {
      tapeTest.deepEqual(await readFloat32(nearestPointBuffer, 2, byteOffset), [1, 0]);
    }
    if (configuration.linestringIndex) {
      tapeTest.deepEqual(await readUint32(linestringIndexBuffer, 1, byteOffset), [0]);
    }
    if (configuration.segmentIndex) {
      tapeTest.deepEqual(await readUint32(segmentIndexBuffer, 1, byteOffset), [0]);
    }

    compiled.destroy();
    for (const buffer of [
      pointBuffer,
      linestringBuffer,
      geometryOffsetsBuffer,
      linestringOffsetsBuffer,
      distanceBuffer,
      nearestPointBuffer,
      linestringIndexBuffer,
      segmentIndexBuffer
    ]) {
      buffer.destroy();
    }
  }
  tapeTest.end();
});

test('GPUPairwisePointLinestringNearest preserves raw-binary64 projection deltas', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    tapeTest.comment('Skipping slow integer fp64 nearest-linestring shader on software WebGPU');
    tapeTest.end();
    return;
  }

  const x = 12_345_678.125;
  const y = -7_654_321.5;
  const points: Point[] = [
    [x + 1e-7, y + 3e-7],
    [x + 2e-7, y + 3e-7],
    [x, y],
    [0.5, 1e30],
    [1e-30, 1]
  ];
  const linestringPositions: Point[] = [
    [x, y + 1e-6],
    [x + 2e-7, y + 1e-6],
    [x, y],
    [x + 2e-7, y],
    [x, y],
    [x, y],
    [Number.NaN, y],
    [x, y],
    [0, 0],
    [1, 0],
    [0, 0],
    [3e38, 0]
  ];
  const geometryOffsetValues = Uint32Array.from([0, 2, 3, 4, 5, 6]);
  const linestringOffsetValues = Uint32Array.from([0, 2, 4, 6, 8, 10, 12]);
  const pointBuffer = createInputBuffer(device, encodeFloat64Points(points));
  const linestringBuffer = createInputBuffer(device, encodeFloat64Points(linestringPositions));
  const geometryOffsetsBuffer = createInputBuffer(device, geometryOffsetValues);
  const linestringOffsetsBuffer = createInputBuffer(device, linestringOffsetValues);
  const distanceBuffer = createOutputBuffer(device, points.length, 8);
  const nearestPointBuffer = createOutputBuffer(device, points.length, 16);
  const linestringIndexBuffer = createOutputBuffer(device, points.length, 4);
  const segmentIndexBuffer = createOutputBuffer(device, points.length, 4);
  const graph = new GPUCommandGraph(device, {id: 'pairwise-linestring-nearest-raw'});

  new GPUPairwisePointLinestringNearest({
    points: importView(graph, 'raw-points', pointBuffer, 'uint32x4', points.length),
    linestringPositions: importView(
      graph,
      'raw-linestring-positions',
      linestringBuffer,
      'uint32x4',
      linestringPositions.length
    ),
    geometryOffsets: importView(
      graph,
      'raw-geometry-offsets',
      geometryOffsetsBuffer,
      'uint32',
      geometryOffsetValues.length
    ),
    linestringOffsets: importView(
      graph,
      'raw-linestring-offsets',
      linestringOffsetsBuffer,
      'uint32',
      linestringOffsetValues.length
    ),
    output: importView(graph, 'raw-distances', distanceBuffer, 'float32x2', points.length),
    nearestPoints: importView(
      graph,
      'raw-nearest-points',
      nearestPointBuffer,
      'float32x4',
      points.length
    ),
    linestringIndices: importView(
      graph,
      'raw-linestring-indices',
      linestringIndexBuffer,
      'uint32',
      points.length
    ),
    segmentIndices: importView(
      graph,
      'raw-segment-indices',
      segmentIndexBuffer,
      'uint32',
      points.length
    )
  }).addToGraph(graph);
  const compiled = graph.compile();
  encode(device, compiled);

  const distanceLimbs = await readFloat32(distanceBuffer, points.length * 2);
  const expectedDistances = [
    Math.abs(points[0][1] - y),
    Math.hypot(points[1][0] - x, points[1][1] - y),
    Number.NaN,
    1e30,
    1
  ];
  for (let index = 0; index < expectedDistances.length; index++) {
    const distance = distanceLimbs[index * 2] + distanceLimbs[index * 2 + 1];
    if (Number.isNaN(expectedDistances[index])) {
      tapeTest.ok(Number.isNaN(distance), `raw distance ${index} is invalid`);
    } else {
      assertRelativeClose(
        tapeTest,
        distance,
        expectedDistances[index],
        2e-6,
        `raw distance ${index}`
      );
    }
  }

  const nearestLimbs = await readFloat32(nearestPointBuffer, points.length * 4);
  const expectedNearest: Point[] = [
    [points[0][0], y],
    [x, y],
    [Number.NaN, Number.NaN],
    [0.5, 0],
    [1e-30, 0]
  ];
  for (let index = 0; index < expectedNearest.length; index++) {
    const nearestX = nearestLimbs[index * 4] + nearestLimbs[index * 4 + 1];
    const nearestY = nearestLimbs[index * 4 + 2] + nearestLimbs[index * 4 + 3];
    if (Number.isNaN(expectedNearest[index][0])) {
      tapeTest.ok(Number.isNaN(nearestX) && Number.isNaN(nearestY));
    } else {
      assertClose(tapeTest, nearestX, expectedNearest[index][0], 2e-7, `raw nearest x ${index}`);
      assertClose(tapeTest, nearestY, expectedNearest[index][1], 2e-7, `raw nearest y ${index}`);
    }
  }
  assertClose(
    tapeTest,
    nearestLimbs[16] + nearestLimbs[17],
    1e-30,
    2e-36,
    'raw tiny fraction retains its projected displacement'
  );
  tapeTest.deepEqual(await readUint32(linestringIndexBuffer, points.length), [
    1,
    0,
    NO_INDEX,
    0,
    0
  ]);
  tapeTest.deepEqual(await readUint32(segmentIndexBuffer, points.length), [0, 0, NO_INDEX, 0, 0]);

  compiled.destroy();
  for (const buffer of [
    pointBuffer,
    linestringBuffer,
    geometryOffsetsBuffer,
    linestringOffsetsBuffer,
    distanceBuffer,
    nearestPointBuffer,
    linestringIndexBuffer,
    segmentIndexBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

type Point = readonly [number, number];

function createInputBuffer(device: Device, data: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function createOutputBuffer(
  device: Device,
  length: number,
  rowByteLength: number,
  byteOffset = 0
): Buffer {
  return device.createBuffer({
    byteLength: byteOffset + Math.max(length, 1) * rowByteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number,
  byteOffset = 0
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function encodeFloat64Points(points: readonly Point[]): Uint32Array {
  const values = new Float64Array(points.length * 2);
  for (let index = 0; index < points.length; index++) {
    values[index * 2] = points[index][0];
    values[index * 2 + 1] = points[index][1];
  }
  return new Uint32Array(values.buffer);
}

async function readFloat32(buffer: Buffer, length: number, byteOffset = 0): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset + byteOffset, length));
}

async function readUint32(buffer: Buffer, length: number, byteOffset = 0): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset + byteOffset, length));
}

function encode(device: Device, compiled: ReturnType<GPUCommandGraph['compile']>): void {
  const commandEncoder = device.createCommandEncoder({id: 'pairwise-linestring-nearest-test'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
}

function assertRelativeClose(
  tapeTest: {ok: (value: unknown, message?: string) => void},
  actual: number,
  expected: number,
  relativeTolerance: number,
  message: string
): void {
  assertClose(
    tapeTest,
    actual,
    expected,
    Math.max(1e-12, Math.abs(expected) * relativeTolerance),
    message
  );
}

function assertClose(
  tapeTest: {ok: (value: unknown, message?: string) => void},
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  tapeTest.ok(Math.abs(actual - expected) <= tolerance, message);
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
