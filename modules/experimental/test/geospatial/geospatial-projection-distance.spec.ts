// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {
  GPUHaversineDistance,
  GPUPairwisePointDistance,
  GPUPairwisePointSegmentDistance,
  GPUSinusoidalProjection
} from '../../src/geospatial';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource
} from '../../src/geospatial/geospatial-utils';

test('geospatial dispatch crosses the one-dimensional WebGPU limit without allocating rows', tapeTest => {
  const maximum = 65_535;
  const oneDimensionalRowCapacity = maximum * GEOSPATIAL_WORKGROUP_SIZE;

  tapeTest.deepEqual(getGeospatialDispatchLayout(0, maximum), {x: 1, y: 1, z: 1});
  tapeTest.deepEqual(getGeospatialDispatchLayout(oneDimensionalRowCapacity, maximum), {
    x: maximum,
    y: 1,
    z: 1
  });
  tapeTest.deepEqual(getGeospatialDispatchLayout(oneDimensionalRowCapacity + 1, maximum), {
    x: maximum,
    y: 2,
    z: 1
  });
  tapeTest.deepEqual(
    getGeospatialDispatchLayout(9 * GEOSPATIAL_WORKGROUP_SIZE + 1, 3),
    {x: 3, y: 3, z: 2},
    'a small synthetic limit exercises the third dispatch dimension'
  );
  tapeTest.throws(
    () => getGeospatialDispatchLayout(27 * GEOSPATIAL_WORKGROUP_SIZE + 1, 3),
    /exceeding the 3D dispatch limit/
  );

  const source = getGeospatialInvocationIndexSource({x: 3, y: 2, z: 2});
  tapeTest.match(source, /workgroupId\.z \* 2u \+ workgroupId\.y/);
  tapeTest.match(source, /\* 3u \+ workgroupId\.x/);
  tapeTest.match(
    source,
    /workgroupIndex >= 16777216u/,
    'padded workgroups cannot wrap the uint32 invocation index'
  );
  tapeTest.match(source, /workgroupIndex \* 256u \+ localId\.x/);
  tapeTest.end();
});

test('GPUSinusoidalProjection matches cuSpatial sign, midpoint, and circumference', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const localValues = Float32Array.from([1, 0, -1, 0, 1, 60, 0, 0]);
  const circumferenceValues = Float32Array.from([180, 0]);
  const rawOrigin: Point = [120, 45];
  const rawPoint: Point = [rawOrigin[0] + 2 ** -30, rawOrigin[1]];
  const localBuffer = createBuffer(device, localValues, Buffer.STORAGE);
  const circumferenceBuffer = createBuffer(device, circumferenceValues, Buffer.STORAGE);
  const rawBuffer = createBuffer(device, encodeFloat64Points([rawPoint]), Buffer.STORAGE);
  const localOutputBuffer = createOutputBuffer(device, localValues.byteLength);
  const circumferenceOutputBuffer = createOutputBuffer(device, circumferenceValues.byteLength);
  const rawOutputBuffer = createOutputBuffer(device, 8);
  const graph = new GPUCommandGraph(device, {id: 'sinusoidal-cuspatial-test'});
  const localPositions = importView(graph, 'local-positions', localBuffer, 'float32x2', 4);
  const localOutput = importView(graph, 'local-output', localOutputBuffer, 'float32x2', 4);
  const circumferencePositions = importView(
    graph,
    'circumference-positions',
    circumferenceBuffer,
    'float32x2',
    1
  );
  const circumferenceOutput = importView(
    graph,
    'circumference-output',
    circumferenceOutputBuffer,
    'float32x2',
    1
  );
  const rawPositions = importView(graph, 'raw-positions', rawBuffer, 'uint32x4', 1);
  const rawOutput = importView(graph, 'raw-output', rawOutputBuffer, 'float32x2', 1);

  new GPUSinusoidalProjection({
    id: 'local-projection',
    positions: localPositions,
    output: localOutput
  }).addToGraph(graph);
  new GPUSinusoidalProjection({
    id: 'circumference-projection',
    positions: circumferencePositions,
    output: circumferenceOutput,
    origin: [-180, 0]
  }).addToGraph(graph);
  new GPUSinusoidalProjection({
    id: 'raw-projection',
    positions: rawPositions,
    output: rawOutput,
    origin: rawOrigin
  }).addToGraph(graph);

  for (const origin of [
    [180 + Number.EPSILON * 180, 0],
    [-181, 0],
    [0, 91],
    [0, Number.NaN]
  ] as const) {
    tapeTest.throws(
      () => new GPUSinusoidalProjection({positions: localPositions, output: localOutput, origin}),
      /valid longitude\/latitude degrees/
    );
  }

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'sinusoidal-cuspatial-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const kilometresPerDegree = 40_000 / 360;
  const local = await readFloat32(localOutputBuffer, 8);
  assertClose(tapeTest, local[0], -kilometresPerDegree, 0.02, 'east is negative x');
  assertClose(tapeTest, local[2], kilometresPerDegree, 0.02, 'west is positive x');
  assertClose(
    tapeTest,
    local[4],
    -kilometresPerDegree * Math.cos((30 * Math.PI) / 180),
    0.02,
    'x scale uses the midpoint latitude rather than the point latitude'
  );
  assertClose(tapeTest, local[5], -60 * kilometresPerDegree, 0.02, 'north is negative y');
  tapeTest.ok(
    local[6] === 0 && local[7] === 0,
    'the projection origin maps to numerical zero regardless of its IEEE sign bit'
  );
  assertClose(
    tapeTest,
    (await readFloat32(circumferenceOutputBuffer, 2))[0],
    -40_000,
    0.02,
    '360 degrees uses cuSpatial’s fixed 40,000 km circumference'
  );

  const raw = await readFloat32(rawOutputBuffer, 2);
  const rawExpected = getSinusoidalProjection(rawPoint, rawOrigin);
  assertClose(
    tapeTest,
    raw[0],
    rawExpected[0],
    Math.abs(rawExpected[0]) * 1e-4 + 1e-12,
    'raw binary64 subtraction preserves a delta smaller than one f32 ULP at the origin'
  );
  tapeTest.notEqual(raw[0], 0);

  compiled.destroy();
  for (const buffer of [
    localBuffer,
    circumferenceBuffer,
    rawBuffer,
    localOutputBuffer,
    circumferenceOutputBuffer,
    rawOutputBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUHaversineDistance covers f32 antimeridian, polar, and radius cases', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const leftValues = Float32Array.from([179.999, 0, 0, 89.999, -45, -80, 12, 34, 120, 0]);
  const rightValues = Float32Array.from([
    -179.999,
    0,
    120,
    89.999,
    135,
    80,
    12,
    34,
    120 + 2 ** -17,
    0
  ]);
  const radiusLeft = Float32Array.from([0, 0]);
  const radiusRight = Float32Array.from([90, 0]);
  const inputBuffers = [
    createBuffer(device, leftValues, Buffer.STORAGE),
    createBuffer(device, rightValues, Buffer.STORAGE),
    createBuffer(device, radiusLeft, Buffer.STORAGE),
    createBuffer(device, radiusRight, Buffer.STORAGE)
  ];
  const outputBuffer = createOutputBuffer(device, 20);
  const radiusOutputBuffer = createOutputBuffer(device, 4);
  const graph = new GPUCommandGraph(device, {id: 'haversine-f32-envelope-test'});
  const left = importView(graph, 'left', inputBuffers[0], 'float32x2', 5);
  const right = importView(graph, 'right', inputBuffers[1], 'float32x2', 5);
  const output = importView(graph, 'output', outputBuffer, 'float32', 5);
  new GPUHaversineDistance({id: 'f32-haversine', left, right, output}).addToGraph(graph);
  new GPUHaversineDistance({
    id: 'custom-radius-haversine',
    left: importView(graph, 'radius-left', inputBuffers[2], 'float32x2', 1),
    right: importView(graph, 'radius-right', inputBuffers[3], 'float32x2', 1),
    output: importView(graph, 'radius-output', radiusOutputBuffer, 'float32', 1),
    radius: 1
  }).addToGraph(graph);

  tapeTest.throws(
    () => new GPUHaversineDistance({left, right, output, radius: 0}),
    /positive and representable as float32/
  );
  tapeTest.throws(
    () => new GPUHaversineDistance({left, right, output, radius: Number.MAX_VALUE}),
    /positive and representable as float32/
  );

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'haversine-f32-envelope-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const actual = await readFloat32(outputBuffer, 5);
  for (let index = 0; index < actual.length; index++) {
    const leftPoint: Point = [leftValues[index * 2], leftValues[index * 2 + 1]];
    const rightPoint: Point = [rightValues[index * 2], rightValues[index * 2 + 1]];
    const expected = getHaversineDistance(leftPoint, rightPoint);
    assertClose(
      tapeTest,
      actual[index],
      expected,
      2,
      `difficult f32 case ${index} stays inside the documented 2 km envelope`
    );
  }
  tapeTest.ok(actual[0] < 0.25, 'the antimeridian case follows the short arc');
  tapeTest.ok(actual[1] < 0.25, 'near-polar longitudes converge');
  tapeTest.ok(actual[4] > 0, 'adjacent f32 longitude values do not collapse after conversion');
  assertClose(
    tapeTest,
    (await readFloat32(radiusOutputBuffer, 1))[0],
    Math.PI / 2,
    2e-6,
    'a custom radius scales the central angle'
  );

  compiled.destroy();
  for (const buffer of [...inputBuffers, outputBuffer, radiusOutputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUHaversineDistance preserves raw binary64 coordinate deltas', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const rawLeft: Point[] = [
    [120, 45],
    [120, 45]
  ];
  const rawRight: Point[] = [
    [120 + 2 ** -30, 45],
    [120, 45 + 2 ** -30]
  ];
  const leftBuffer = createBuffer(device, encodeFloat64Points(rawLeft), Buffer.STORAGE);
  const rightBuffer = createBuffer(device, encodeFloat64Points(rawRight), Buffer.STORAGE);
  const outputBuffer = createOutputBuffer(device, 8);
  const graph = new GPUCommandGraph(device, {id: 'haversine-raw-delta-test'});
  new GPUHaversineDistance({
    left: importView(graph, 'raw-left', leftBuffer, 'uint32x4', 2),
    right: importView(graph, 'raw-right', rightBuffer, 'uint32x4', 2),
    output: importView(graph, 'raw-output', outputBuffer, 'float32', 2)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'haversine-raw-delta-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const actual = await readFloat32(outputBuffer, 2);
  for (let index = 0; index < actual.length; index++) {
    const expected = getHaversineDistance(rawLeft[index], rawRight[index]);
    assertClose(
      tapeTest,
      actual[index],
      expected,
      expected * 1e-4 + 1e-12,
      `raw binary64 input preserves sub-f32 ${index === 0 ? 'longitude' : 'latitude'} delta`
    );
    tapeTest.notEqual(actual[index], 0);
  }

  compiled.destroy();
  for (const buffer of [leftBuffer, rightBuffer, outputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('point and point-to-segment f32 distances match CPU oracles', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const floatPoints = Float32Array.from([3, 4, 1, 2, Number.NaN, 0]);
  const floatOtherPoints = Float32Array.from([0, 0, 1, 2, 0, 0]);
  const floatStarts = Float32Array.from([0, 0, 0, 0, 0, 0]);
  const floatEnds = Float32Array.from([0, 2, 2, 0, 2, 0]);
  const inputBuffers = [
    createBuffer(device, floatPoints, Buffer.STORAGE),
    createBuffer(device, floatOtherPoints, Buffer.STORAGE),
    createBuffer(device, floatStarts, Buffer.STORAGE),
    createBuffer(device, floatEnds, Buffer.STORAGE)
  ];
  const floatPointOutputBuffer = createOutputBuffer(device, 12);
  const floatSegmentOutputBuffer = createOutputBuffer(device, 12);
  const graph = new GPUCommandGraph(device, {id: 'f32-point-distance-oracle-test'});
  const floatPointView = importView(graph, 'float-points', inputBuffers[0], 'float32x2', 3);

  new GPUPairwisePointDistance({
    id: 'f32-point-distance',
    left: floatPointView,
    right: importView(graph, 'float-other', inputBuffers[1], 'float32x2', 3),
    output: importView(graph, 'float-point-output', floatPointOutputBuffer, 'float32', 3)
  }).addToGraph(graph);
  new GPUPairwisePointSegmentDistance({
    id: 'f32-segment-distance',
    points: floatPointView,
    segmentStarts: importView(graph, 'float-starts', inputBuffers[2], 'float32x2', 3),
    segmentEnds: importView(graph, 'float-ends', inputBuffers[3], 'float32x2', 3),
    output: importView(graph, 'float-segment-output', floatSegmentOutputBuffer, 'float32', 3)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'f32-point-distance-oracle-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const floatPointDistances = await readFloat32(floatPointOutputBuffer, 3);
  const floatSegmentDistances = await readFloat32(floatSegmentOutputBuffer, 3);
  assertClose(tapeTest, floatPointDistances[0], 5, 1e-6, 'f32 point distance matches 3-4-5');
  tapeTest.equal(floatPointDistances[1], 0);
  tapeTest.ok(
    !Number.isFinite(floatPointDistances[2]),
    'non-finite point distance stays non-finite'
  );
  assertClose(
    tapeTest,
    floatSegmentDistances[0],
    Math.sqrt(13),
    1e-6,
    'projection clamps to the segment endpoint'
  );
  tapeTest.equal(floatSegmentDistances[1], 2, 'orthogonal projection lands inside the segment');
  tapeTest.ok(
    !Number.isFinite(floatSegmentDistances[2]),
    'non-finite point-to-segment distance stays non-finite'
  );

  compiled.destroy();
  for (const buffer of [...inputBuffers, floatPointOutputBuffer, floatSegmentOutputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('point and point-to-segment raw binary64 distances match CPU oracles', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    tapeTest.comment('Skipping slow integer fp64 planar distance shaders on software WebGPU');
    tapeTest.end();
    return;
  }

  const origin: Point = [20_000_000, 30_000_000];
  const rawPoints: Point[] = [
    [origin[0] + 0.5, origin[1] + 2 ** -20],
    [origin[0] + 1.25, origin[1] + 0.5],
    [origin[0] + 2 ** -22, origin[1] + 2 ** -20]
  ];
  const rawOtherPoints: Point[] = [origin, origin, origin];
  const rawStarts: Point[] = [origin, origin, origin];
  const rawEnds: Point[] = [[origin[0] + 1, origin[1]], [origin[0] + 1, origin[1]], origin];
  const inputBuffers = [
    createBuffer(device, encodeFloat64Points(rawPoints), Buffer.STORAGE),
    createBuffer(device, encodeFloat64Points(rawOtherPoints), Buffer.STORAGE),
    createBuffer(device, encodeFloat64Points(rawStarts), Buffer.STORAGE),
    createBuffer(device, encodeFloat64Points(rawEnds), Buffer.STORAGE)
  ];
  const rawPointOutputBuffer = createOutputBuffer(device, rawPoints.length * 8);
  const rawSegmentOutputBuffer = createOutputBuffer(device, rawPoints.length * 8);
  const graph = new GPUCommandGraph(device, {id: 'raw-point-distance-oracle-test'});
  const rawPointView = importView(graph, 'raw-points', inputBuffers[0], 'uint32x4', 3);

  new GPUPairwisePointDistance({
    id: 'raw-point-distance',
    left: rawPointView,
    right: importView(graph, 'raw-other', inputBuffers[1], 'uint32x4', 3),
    output: importView(graph, 'raw-point-output', rawPointOutputBuffer, 'float32x2', 3)
  }).addToGraph(graph);
  new GPUPairwisePointSegmentDistance({
    id: 'raw-segment-distance',
    points: rawPointView,
    segmentStarts: importView(graph, 'raw-starts', inputBuffers[2], 'uint32x4', 3),
    segmentEnds: importView(graph, 'raw-ends', inputBuffers[3], 'uint32x4', 3),
    output: importView(graph, 'raw-segment-output', rawSegmentOutputBuffer, 'float32x2', 3)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'raw-point-distance-oracle-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const rawPointDistances = await readFloat32(rawPointOutputBuffer, rawPoints.length * 2);
  const rawSegmentDistances = await readFloat32(rawSegmentOutputBuffer, rawPoints.length * 2);
  for (let index = 0; index < rawPoints.length; index++) {
    const actualPoint = rawPointDistances[index * 2] + rawPointDistances[index * 2 + 1];
    const expectedPoint = Math.hypot(
      rawPoints[index][0] - rawOtherPoints[index][0],
      rawPoints[index][1] - rawOtherPoints[index][1]
    );
    assertRelativeClose(tapeTest, actualPoint, expectedPoint, 2e-6, `raw point case ${index}`);
    const actualSegment = rawSegmentDistances[index * 2] + rawSegmentDistances[index * 2 + 1];
    const expectedSegment = getPointSegmentDistance(
      rawPoints[index],
      rawStarts[index],
      rawEnds[index]
    );
    assertRelativeClose(
      tapeTest,
      actualSegment,
      expectedSegment,
      2e-6,
      `raw segment case ${index}`
    );
  }
  tapeTest.notEqual(rawPointDistances[1], 0, 'precise point output retains a low limb');
  tapeTest.notEqual(rawSegmentDistances[3], 0, 'precise segment output retains a low limb');

  compiled.destroy();
  for (const buffer of [...inputBuffers, rawPointOutputBuffer, rawSegmentOutputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('precise planar distances scale extreme intermediate products', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    tapeTest.comment('Skipping slow integer fp64 planar distance shaders on software WebGPU');
    tapeTest.end();
    return;
  }

  const largePower = 2 ** 100;
  const smallPower = 2 ** -100;
  const pointLeft: Point[] = [
    [1e20, 0],
    [largePower, 0],
    [smallPower, 0]
  ];
  const pointRight: Point[] = pointLeft.map(() => [0, 0]);
  const segmentPoints: Point[] = [
    [5e19, 0],
    [5e19, 3],
    [smallPower, smallPower]
  ];
  const segmentStarts: Point[] = segmentPoints.map(() => [0, 0]);
  const segmentEnds: Point[] = [
    [1e20, 0],
    [1e20, 0],
    [largePower, 0]
  ];
  const pointLeftBuffer = createBuffer(device, encodeFloat64Points(pointLeft), Buffer.STORAGE);
  const pointRightBuffer = createBuffer(device, encodeFloat64Points(pointRight), Buffer.STORAGE);
  const segmentPointBuffer = createBuffer(
    device,
    encodeFloat64Points(segmentPoints),
    Buffer.STORAGE
  );
  const segmentStartBuffer = createBuffer(
    device,
    encodeFloat64Points(segmentStarts),
    Buffer.STORAGE
  );
  const segmentEndBuffer = createBuffer(device, encodeFloat64Points(segmentEnds), Buffer.STORAGE);
  const pointOutputBuffer = createOutputBuffer(device, pointLeft.length * 8);
  const segmentOutputBuffer = createOutputBuffer(device, segmentPoints.length * 8);
  const graph = new GPUCommandGraph(device, {id: 'precise-distance-scaling-test'});

  new GPUPairwisePointDistance({
    left: importView(graph, 'scaling-point-left', pointLeftBuffer, 'uint32x4', pointLeft.length),
    right: importView(
      graph,
      'scaling-point-right',
      pointRightBuffer,
      'uint32x4',
      pointRight.length
    ),
    output: importView(
      graph,
      'scaling-point-output',
      pointOutputBuffer,
      'float32x2',
      pointLeft.length
    )
  }).addToGraph(graph);
  new GPUPairwisePointSegmentDistance({
    points: importView(
      graph,
      'scaling-segment-points',
      segmentPointBuffer,
      'uint32x4',
      segmentPoints.length
    ),
    segmentStarts: importView(
      graph,
      'scaling-segment-starts',
      segmentStartBuffer,
      'uint32x4',
      segmentStarts.length
    ),
    segmentEnds: importView(
      graph,
      'scaling-segment-ends',
      segmentEndBuffer,
      'uint32x4',
      segmentEnds.length
    ),
    output: importView(
      graph,
      'scaling-segment-output',
      segmentOutputBuffer,
      'float32x2',
      segmentPoints.length
    )
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'precise-distance-scaling-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const pointOutput = await readFloat32(pointOutputBuffer, pointLeft.length * 2);
  const pointDistances = pointLeft.map(
    (_, index) => pointOutput[index * 2] + pointOutput[index * 2 + 1]
  );
  assertRelativeClose(
    tapeTest,
    pointDistances[0],
    1e20,
    2e-6,
    'a finite 1e20 distance does not overflow while squaring'
  );
  assertRelativeClose(
    tapeTest,
    pointDistances[1],
    largePower,
    2e-6,
    'a large power-of-two distance remains finite'
  );
  assertClose(
    tapeTest,
    pointDistances[2] / smallPower,
    1,
    2e-6,
    'a small power-of-two distance does not underflow while squaring'
  );

  const segmentOutput = await readFloat32(segmentOutputBuffer, segmentPoints.length * 2);
  const segmentDistances = segmentPoints.map(
    (_, index) => segmentOutput[index * 2] + segmentOutput[index * 2 + 1]
  );
  tapeTest.equal(segmentDistances[0], 0, 'the midpoint of a 1e20 segment has zero distance');
  assertClose(
    tapeTest,
    segmentDistances[1],
    3,
    2e-6,
    'a finite off-axis distance survives overflowing projection products'
  );
  assertClose(
    tapeTest,
    segmentDistances[2] / smallPower,
    1,
    2e-6,
    'an unrepresentably small projection fraction still produces the correct distance'
  );
  compiled.destroy();
  for (const buffer of [
    pointLeftBuffer,
    pointRightBuffer,
    segmentPointBuffer,
    segmentStartBuffer,
    segmentEndBuffer,
    pointOutputBuffer,
    segmentOutputBuffer
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('fixed kernels preserve vector chunks, empty chunks, and non-finite rows', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'geospatial-chunk-topology-test'});
  const positions = importVector(graph, device, 'positions', 'float32x2', 2, [
    Float32Array.from([0, 0]),
    new Float32Array(0),
    Float32Array.from([1, 0, 3, 4, Number.NaN, 0])
  ]);
  const otherPositions = importVector(graph, device, 'other-positions', 'float32x2', 2, [
    Float32Array.from([3, 4]),
    new Float32Array(0),
    Float32Array.from([1, 0, 0, 0, 0, 0])
  ]);
  const segmentStarts = importVector(graph, device, 'segment-starts', 'float32x2', 2, [
    Float32Array.from([0, 0]),
    new Float32Array(0),
    Float32Array.from([0, 0, 0, 0, 0, 0])
  ]);
  const segmentEnds = importVector(graph, device, 'segment-ends', 'float32x2', 2, [
    Float32Array.from([0, 2]),
    new Float32Array(0),
    Float32Array.from([2, 0, 0, 0, 2, 0])
  ]);
  const projection = importOutputVector(graph, device, 'projection', 'float32x2', 2, [1, 0, 3]);
  const haversine = importOutputVector(graph, device, 'haversine', 'float32', 1, [1, 0, 3]);
  const pointDistances = importOutputVector(
    graph,
    device,
    'point-distances',
    'float32',
    1,
    [1, 0, 3]
  );
  const segmentDistances = importOutputVector(
    graph,
    device,
    'segment-distances',
    'float32',
    1,
    [1, 0, 3]
  );

  new GPUSinusoidalProjection({positions: positions.view, output: projection.view}).addToGraph(
    graph
  );
  new GPUHaversineDistance({
    left: positions.view,
    right: otherPositions.view,
    output: haversine.view
  }).addToGraph(graph);
  new GPUPairwisePointDistance({
    id: 'offset-f32-point-distance',
    left: positions.view,
    right: otherPositions.view,
    output: pointDistances.view
  }).addToGraph(graph);
  new GPUPairwisePointSegmentDistance({
    points: positions.view,
    segmentStarts: segmentStarts.view,
    segmentEnds: segmentEnds.view,
    output: segmentDistances.view
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'geospatial-chunk-topology-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  for (const view of [
    positions.view,
    projection.view,
    haversine.view,
    pointDistances.view,
    segmentDistances.view
  ]) {
    tapeTest.deepEqual(
      view.data.map(chunk => chunk.length),
      [1, 0, 3],
      `${view.id} retains source chunk boundaries`
    );
  }
  const projectionTail = await readFloat32(projection.buffers[2], 6);
  assertClose(tapeTest, projectionTail[0], -(40_000 / 360), 0.02);
  tapeTest.ok(!Number.isFinite(projectionTail[4]) || !Number.isFinite(projectionTail[5]));
  tapeTest.deepEqual(await readFloat32(pointDistances.buffers[0], 1), [5]);
  const pointTail = await readFloat32(pointDistances.buffers[2], 3);
  tapeTest.deepEqual(pointTail.slice(0, 2), [0, 5]);
  tapeTest.ok(!Number.isFinite(pointTail[2]));
  const segmentTail = await readFloat32(segmentDistances.buffers[2], 3);
  tapeTest.deepEqual(segmentTail.slice(0, 2), [0, 5]);
  tapeTest.ok(!Number.isFinite(segmentTail[2]));
  const haversineTail = await readFloat32(haversine.buffers[2], 3);
  tapeTest.equal(haversineTail[0], 0);
  tapeTest.ok(haversineTail[1] > 0);
  tapeTest.ok(!Number.isFinite(haversineTail[2]));

  compiled.destroy();
  for (const buffer of [
    ...positions.buffers,
    ...otherPositions.buffers,
    ...segmentStarts.buffers,
    ...segmentEnds.buffers,
    ...projection.buffers,
    ...haversine.buffers,
    ...pointDistances.buffers,
    ...segmentDistances.buffers
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('f32 point distance honors naturally aligned input and output offsets', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const floatInputOffset = 264;
  const floatOutputOffset = 260;
  const floatLeftBuffer = device.createBuffer({
    byteLength: 288,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const floatRightBuffer = device.createBuffer({
    byteLength: 288,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  floatLeftBuffer.write(Float32Array.from([3, 4]), floatInputOffset);
  floatRightBuffer.write(Float32Array.from([0, 0]), floatInputOffset);
  const floatOutputBuffer = createOutputBuffer(device, floatOutputOffset + 4);
  const graph = new GPUCommandGraph(device, {id: 'geospatial-f32-aligned-offset-test'});

  new GPUPairwisePointDistance({
    id: 'offset-f32-point-distance',
    left: importView(graph, 'float-left', floatLeftBuffer, 'float32x2', 1, floatInputOffset),
    right: importView(graph, 'float-right', floatRightBuffer, 'float32x2', 1, floatInputOffset),
    output: importView(graph, 'float-output', floatOutputBuffer, 'float32', 1, floatOutputOffset)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'geospatial-f32-offset-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const floatBytes = await floatOutputBuffer.readAsync(floatOutputOffset, 4);
  tapeTest.equal(new Float32Array(floatBytes.buffer, floatBytes.byteOffset, 1)[0], 5);

  compiled.destroy();
  for (const buffer of [floatLeftBuffer, floatRightBuffer, floatOutputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('raw point distance honors naturally aligned input and output offsets', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    tapeTest.comment('Skipping slow integer fp64 planar distance shaders on software WebGPU');
    tapeTest.end();
    return;
  }

  const rawInputOffset = 272;
  const rawOutputOffset = 264;
  const rawLeft: Point = [12_345_678.1250001, -7_654_321.5];
  const rawRight: Point = [12_345_678.125, -7_654_321.5];
  const rawLeftValues = new Uint32Array(rawInputOffset / 4 + 4);
  const rawRightValues = new Uint32Array(rawInputOffset / 4 + 4);
  rawLeftValues.set(encodeFloat64Points([rawLeft]), rawInputOffset / 4);
  rawRightValues.set(encodeFloat64Points([rawRight]), rawInputOffset / 4);
  const rawLeftBuffer = createBuffer(device, rawLeftValues, Buffer.STORAGE);
  const rawRightBuffer = createBuffer(device, rawRightValues, Buffer.STORAGE);
  const rawOutputBuffer = createOutputBuffer(device, rawOutputOffset + 8);
  const graph = new GPUCommandGraph(device, {id: 'geospatial-raw-aligned-offset-test'});

  new GPUPairwisePointDistance({
    id: 'offset-raw-point-distance',
    left: importView(graph, 'raw-left', rawLeftBuffer, 'uint32x4', 1, rawInputOffset),
    right: importView(graph, 'raw-right', rawRightBuffer, 'uint32x4', 1, rawInputOffset),
    output: importView(graph, 'raw-output', rawOutputBuffer, 'float32x2', 1, rawOutputOffset)
  }).addToGraph(graph);

  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'geospatial-raw-offset-encoding'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const rawBytes = await rawOutputBuffer.readAsync(rawOutputOffset, 8);
  const rawDistance = new Float32Array(rawBytes.buffer, rawBytes.byteOffset, 2);
  assertRelativeClose(
    tapeTest,
    rawDistance[0] + rawDistance[1],
    Math.abs(rawLeft[0] - rawRight[0]),
    1e-6,
    'raw input and output prefixes are addressed from their aligned bindings'
  );

  compiled.destroy();
  for (const buffer of [rawLeftBuffer, rawRightBuffer, rawOutputBuffer]) {
    buffer.destroy();
  }
  tapeTest.end();
});

type Point = readonly [number, number];

function createBuffer(device: Device, data: Float32Array | Uint32Array, usage: number): Buffer {
  return device.createBuffer({data, usage: usage | Buffer.COPY_DST});
}

function createOutputBuffer(device: Device, byteLength: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(byteLength, 4),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  id: string,
  buffer: Buffer,
  format: T,
  length: number,
  byteOffset: number = 0
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function importVector<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  device: Device,
  id: string,
  format: T,
  stride: number,
  chunks: readonly (Float32Array | Uint32Array)[]
): {view: GraphVectorView<T>; buffers: Buffer[]} {
  const buffers: Buffer[] = [];
  const data = chunks.map((values, chunkIndex) => {
    const buffer =
      values.length > 0
        ? createBuffer(device, values, Buffer.STORAGE)
        : device.createBuffer({
            byteLength: stride * Uint32Array.BYTES_PER_ELEMENT,
            usage: Buffer.STORAGE | Buffer.COPY_DST
          });
    buffers.push(buffer);
    return importView(graph, `${id}-${chunkIndex}`, buffer, format, values.length / stride);
  });
  const length = data.reduce((sum, chunk) => sum + chunk.length, 0);
  const rowByteLength = stride * Uint32Array.BYTES_PER_ELEMENT;
  return {
    view: new GraphVectorView({
      id,
      name: id,
      format,
      length,
      valueLength: length * stride,
      stride,
      byteStride: rowByteLength,
      rowByteLength,
      data
    }),
    buffers
  };
}

function importOutputVector<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  device: Device,
  id: string,
  format: T,
  stride: number,
  chunkLengths: readonly number[]
): {view: GraphVectorView<T>; buffers: Buffer[]} {
  const rowByteLength = stride * Uint32Array.BYTES_PER_ELEMENT;
  const buffers = chunkLengths.map(length => createOutputBuffer(device, length * rowByteLength));
  const data = buffers.map((buffer, chunkIndex) =>
    importView(graph, `${id}-${chunkIndex}`, buffer, format, chunkLengths[chunkIndex])
  );
  const length = chunkLengths.reduce((sum, chunkLength) => sum + chunkLength, 0);
  return {
    view: new GraphVectorView({
      id,
      name: id,
      format,
      length,
      valueLength: length * stride,
      stride,
      byteStride: rowByteLength,
      rowByteLength,
      data
    }),
    buffers
  };
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync();
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

function encodeFloat64Points(points: readonly Point[]): Uint32Array {
  const float64Values = new Float64Array(points.length * 2);
  for (let index = 0; index < points.length; index++) {
    float64Values[index * 2] = points[index][0];
    float64Values[index * 2 + 1] = points[index][1];
  }
  return new Uint32Array(float64Values.buffer);
}

function getSinusoidalProjection(point: Point, origin: Point): Point {
  const kilometresPerDegree = 40_000 / 360;
  const midpointLatitudeRadians = (((point[1] + origin[1]) * 0.5) / 180) * Math.PI;
  return [
    (origin[0] - point[0]) * kilometresPerDegree * Math.cos(midpointLatitudeRadians),
    (origin[1] - point[1]) * kilometresPerDegree
  ];
}

function getHaversineDistance(left: Point, right: Point, radius: number = 6371): number {
  const radians = Math.PI / 180;
  const leftLongitude = left[0] * radians;
  const leftLatitude = left[1] * radians;
  const rightLongitude = right[0] * radians;
  const rightLatitude = right[1] * radians;
  const longitudeSine = Math.sin((rightLongitude - leftLongitude) * 0.5);
  const latitudeSine = Math.sin((rightLatitude - leftLatitude) * 0.5);
  const haversine =
    latitudeSine * latitudeSine +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * longitudeSine * longitudeSine;
  return radius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
}

function getPointSegmentDistance(point: Point, start: Point, end: Point): number {
  const segmentX = end[0] - start[0];
  const segmentY = end[1] - start[1];
  const denominator = segmentX * segmentX + segmentY * segmentY;
  const fraction =
    denominator === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point[0] - start[0]) * segmentX + (point[1] - start[1]) * segmentY) / denominator
          )
        );
  return Math.hypot(
    point[0] - (start[0] + fraction * segmentX),
    point[1] - (start[1] + fraction * segmentY)
  );
}

function assertClose(
  tapeTest: {ok(value: unknown, message?: string): void},
  actual: number,
  expected: number,
  tolerance: number,
  message?: string
): void {
  tapeTest.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message ?? 'values are close'}: ${actual} versus ${expected}`
  );
}

function assertRelativeClose(
  tapeTest: {ok(value: unknown, message?: string): void},
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

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}
