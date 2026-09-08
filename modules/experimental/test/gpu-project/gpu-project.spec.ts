// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {expect, it} from 'vitest';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  compileProjectionPlan,
  evaluateProjectionPlan,
  findProjectionPatch,
  GPUProjection,
  packProjectionPlan,
  PROJECTION_PLAN_BOUNDS_WORD_LENGTH,
  PROJECTION_PATCH_WORD_LENGTH
} from '@luma.gl/experimental/gpu-project';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type Coordinates = readonly [number, number];

it('packProjectionPlan rounds subnormal float32 bounds inward', () => {
  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds: [0, 0, 1, 1],
    degree: 1,
    tolerance: 1e-5
  });
  const minimumPositive = Number.MIN_VALUE;
  const subnormalPlan = {
    ...plan,
    bounds: [minimumPositive, -minimumPositive * 2, minimumPositive * 2, -minimumPositive] as const
  };
  const packedPlan = packProjectionPlan(subnormalPlan);
  const boundsWordOffset =
    plan.patches.length * PROJECTION_PATCH_WORD_LENGTH + PROJECTION_PLAN_BOUNDS_WORD_LENGTH - 4;

  expect(
    packedPlan[boundsWordOffset],
    'a positive minimum rounds up to the least positive float32'
  ).toBe(1);
  expect(
    packedPlan[boundsWordOffset + 3],
    'a negative maximum rounds down to the least negative float32'
  ).toBe(0x80000001);
  void 0;
});

it('GPUProjection writes origin-relative f32 positions and honors nonzero view offsets', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const projection = (coordinates: number[]): number[] => {
    const horizontal = coordinates[0] - 120;
    const vertical = coordinates[1] - 45;
    return [
      1_000_000 + horizontal * 0.75 + vertical * 0.15 + horizontal * vertical * 0.002,
      4_000_000 + vertical * 1.25 - horizontal * 0.2 + horizontal * horizontal * 0.003
    ];
  };
  const plan = compileProjectionPlan({
    projection,
    bounds: [119, 44, 121, 46],
    degree: 2,
    tolerance: 0.001
  });
  const positions = Float32Array.from([119.5, 44.25, 120, 45, 120.75, 45.5]);
  const viewOffset = 264;
  const inputBuffer = device.createBuffer({
    byteLength: viewOffset + positions.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  inputBuffer.write(positions, viewOffset);
  const outputBuffer = device.createBuffer({
    byteLength: viewOffset + positions.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-float32-offsets'});
  const input = importView(graph, 'positions', inputBuffer, 'float32x2', 3, viewOffset);
  const output = importView(graph, 'projected', outputBuffer, 'float32x2', 3, viewOffset);

  const contributor = new GPUProjection({id: 'float32-projection', positions: input, output, plan});
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-float32-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, positions.length, viewOffset);
  for (let pointIndex = 0; pointIndex < positions.length / 2; pointIndex++) {
    const coordinate = [positions[pointIndex * 2], positions[pointIndex * 2 + 1]] as const;
    const expected = evaluateProjectionPlan(plan, coordinate);
    assertClose(
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      2e-5,
      `point ${pointIndex} retains a local x coordinate`
    );
    assertClose(
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      2e-5,
      `point ${pointIndex} retains a local y coordinate`
    );
  }
  expect(
    Boolean(actual.every(value => Math.abs(value) < 10)),
    'million-meter destination origins are not rounded back into Float32 output'
  ).toBe(true);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection preserves Float32 positions around fractional binary64 source origins', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const projection = (coordinates: number[]): number[] => [
    coordinates[0] - 4_000_000,
    coordinates[1] - 4_000_000
  ];
  const sourceOrigin: Coordinates = [4_100_000.1, 4_050_000.1];
  const plan = compileProjectionPlan({
    projection,
    bounds: [
      sourceOrigin[0] - 0.2,
      sourceOrigin[1] - 0.2,
      sourceOrigin[0] + 0.2,
      sourceOrigin[1] + 0.2
    ],
    degree: 1,
    tolerance: 1e-5
  });
  const position: Coordinates = [4_100_000.25, 4_050_000.25];
  const inputBuffer = createBuffer(device, Float32Array.from(position));
  const outputBuffer = createOutputBuffer(device, 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-float32-fractional-source-origins'});

  expect(plan.patches[0].sourceOrigin[0], 'x origin retains binary64 precision').toBe(
    sourceOrigin[0]
  );
  expect(plan.patches[0].sourceOrigin[1], 'y origin retains binary64 precision').toBe(
    sourceOrigin[1]
  );
  expect(findProjectionPatch(plan, position), 'representable Float32 position is in bounds').toBe(
    0
  );

  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', 1),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', 1),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({
    id: 'gpu-project-float32-fractional-origin-encoding'
  });
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, 2);
  const expected = evaluateProjectionPlan(plan, position);
  assertClose(
    actual[0],
    expected[0] - plan.destinationOrigin[0],
    1e-6,
    'x position subtracts both Float32 source-origin limbs'
  );
  assertClose(
    actual[1],
    expected[1] - plan.destinationOrigin[1],
    1e-6,
    'y position subtracts both Float32 source-origin limbs'
  );
  assertClose(actual[0], 0.15, 1e-6, 'valid x position is not rejected at the patch edge');
  assertClose(actual[1], 0.15, 1e-6, 'valid y position is not rejected at the patch edge');

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection subtracts raw binary64 origins before converting local offsets to f32', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const sourceOrigin: Coordinates = [20_000_000.125, 30_000_000.375];
  const projection = (coordinates: number[]): number[] => [
    coordinates[0] - 7_000_000,
    coordinates[1] + 3_000_000
  ];
  const plan = compileProjectionPlan({
    projection,
    bounds: [sourceOrigin[0] - 2, sourceOrigin[1] - 2, sourceOrigin[0] + 2, sourceOrigin[1] + 2],
    degree: 1,
    tolerance: 1e-6
  });
  const points: Coordinates[] = [
    [sourceOrigin[0] + 2 ** -20, sourceOrigin[1] - 2 ** -18],
    [sourceOrigin[0] - 0.375, sourceOrigin[1] + 0.625],
    sourceOrigin
  ];
  const inputBuffer = createBuffer(device, encodeFloat64Points(points));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-raw-binary64'});

  const contributor = new GPUProjection({
    positions: importView(graph, 'raw-positions', inputBuffer, 'uint32x4', points.length),
    output: importView(graph, 'local-output', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-raw-binary64-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      1e-8,
      `binary64 point ${pointIndex} preserves its local x offset`
    );
    assertClose(
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      1e-8,
      `binary64 point ${pointIndex} preserves its local y offset`
    );
  }
  expect(actual[0], 'a sub-f32-ULP easting offset survives projection').not.toBe(0);
  expect(actual[1], 'a sub-f32-ULP northing offset survives projection').not.toBe(0);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection accepts inclusive binary64 patch endpoints after Float32 normalization', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const minimum = 4_189_890.0279418225;
  const maximum = 4_189_891.498858749;
  const projection = (coordinates: number[]): number[] => [
    coordinates[0] - 4_000_000,
    coordinates[1] - 4_000_000
  ];
  const plan = compileProjectionPlan({
    projection,
    bounds: [minimum, minimum, maximum, maximum],
    degree: 1,
    tolerance: 1e-5
  });
  const points: Coordinates[] = [
    [minimum, minimum],
    [maximum, maximum]
  ];
  const inputBuffer = createBuffer(device, encodeFloat64Points(points));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-inclusive-binary64-endpoints'});

  expect(findProjectionPatch(plan, points[0]), 'minimum source endpoint belongs to the patch').toBe(
    0
  );
  expect(findProjectionPatch(plan, points[1]), 'maximum source endpoint belongs to the patch').toBe(
    0
  );

  const contributor = new GPUProjection({
    positions: importView(graph, 'raw-positions', inputBuffer, 'uint32x4', points.length),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({
    id: 'gpu-project-inclusive-binary64-endpoint-encoding'
  });
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      1e-6,
      `inclusive binary64 endpoint ${pointIndex} retains its x coordinate`
    );
    assertClose(
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      1e-6,
      `inclusive binary64 endpoint ${pointIndex} retains its y coordinate`
    );
    expect(actual[pointIndex * 2], `inclusive endpoint ${pointIndex} is not rejected`).not.toBe(0);
  }

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection rejects outer-domain positions without removing patch seam tolerance', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  const softwareBackedDevice = isSoftwareBackedDevice(device);
  if (softwareBackedDevice) {
    void 0;
  }

  const minimum = -500_000_000;
  const maximum = 500_000_000;
  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      coordinates[0] / 1_000_000_000,
      coordinates[1] / 1_000_000_000
    ],
    bounds: [minimum, minimum, maximum, maximum],
    degree: 1,
    tolerance: 1e-6
  });
  const points: Coordinates[] = [
    [minimum, 250_000_000],
    [maximum, -250_000_000],
    [250_000_000, minimum],
    [-250_000_000, maximum],
    [minimum - 100, 250_000_000],
    [maximum + 100, -250_000_000],
    [250_000_000, minimum - 100],
    [-250_000_000, maximum + 100],
    [Number.NaN, 250_000_000],
    [250_000_000, Number.POSITIVE_INFINITY]
  ];
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-exact-outer-bounds'});
  const rawInputBuffer = createBuffer(device, encodeFloat64Points(points));
  const float32InputBuffer = createBuffer(device, Float32Array.from(points.flat()));
  const patchIdBuffer = createBuffer(device, new Uint32Array(points.length));
  const rawPositions = importView(
    graph,
    'raw-positions',
    rawInputBuffer,
    'uint32x4',
    points.length
  );
  const float32Positions = importView(
    graph,
    'float32-positions',
    float32InputBuffer,
    'float32x2',
    points.length
  );
  const patchIds = importView(graph, 'patch-ids', patchIdBuffer, 'uint32', points.length);
  const cases: Array<{
    name: string;
    positions: typeof rawPositions | typeof float32Positions;
    explicitPatchIds: boolean;
    outputBuffer: Buffer;
  }> = [
    {
      name: 'raw-automatic',
      positions: rawPositions,
      explicitPatchIds: false,
      outputBuffer: createOutputBuffer(device, points.length * 2)
    },
    {
      name: 'raw-explicit',
      positions: rawPositions,
      explicitPatchIds: true,
      outputBuffer: createOutputBuffer(device, points.length * 2)
    },
    {
      name: 'float32-automatic',
      positions: float32Positions,
      explicitPatchIds: false,
      outputBuffer: createOutputBuffer(device, points.length * 2)
    },
    {
      name: 'float32-explicit',
      positions: float32Positions,
      explicitPatchIds: true,
      outputBuffer: createOutputBuffer(device, points.length * 2)
    }
  ].filter(testCase => !softwareBackedDevice || testCase.positions === float32Positions);
  const contributors = cases.map(({name, positions, explicitPatchIds, outputBuffer}) => {
    const contributor = new GPUProjection({
      id: name,
      positions,
      output: importView(graph, `${name}-output`, outputBuffer, 'float32x2', points.length),
      patchIds: explicitPatchIds ? patchIds : undefined,
      plan
    });
    contributor.addToGraph(graph);
    return contributor;
  });

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-exact-outer-boundary-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  for (const {name, outputBuffer} of cases) {
    const actual = await readFloat32(outputBuffer, points.length * 2);
    for (let pointIndex = 0; pointIndex < 4; pointIndex++) {
      const expected = evaluateProjectionPlan(plan, points[pointIndex]);
      assertClose(
        actual[pointIndex * 2],
        expected[0] - plan.destinationOrigin[0],
        1e-6,
        `${name} accepts inclusive x endpoint ${pointIndex}`
      );
      assertClose(
        actual[pointIndex * 2 + 1],
        expected[1] - plan.destinationOrigin[1],
        1e-6,
        `${name} accepts inclusive y endpoint ${pointIndex}`
      );
    }
    expect(
      actual.slice(8),
      `${name} rejects coordinates beyond exact exterior bounds and non-finite inputs`
    ).toEqual(new Array((points.length - 4) * 2).fill(0));
  }

  compiled.destroy();
  for (const contributor of contributors) {
    contributor.destroy();
  }
  for (const buffer of [
    rawInputBuffer,
    float32InputBuffer,
    patchIdBuffer,
    ...cases.map(({outputBuffer}) => outputBuffer)
  ]) {
    buffer.destroy();
  }
  void 0;
});

it('GPUProjection compares Float32 positions against exact fractional binary64 bounds', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds: [0, 0.1, 1, 1.1],
    degree: 1,
    tolerance: 1e-6
  });
  const points: Coordinates[] = [
    [-0, Math.fround(0.1)],
    [1, Math.fround(1.1 - 1e-7)],
    [-0, Math.fround(0.1 - 1e-8)],
    [0, Math.fround(1.1)]
  ];
  const inputBuffer = createBuffer(device, Float32Array.from(points.flat()));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-float32-fractional-bounds'});
  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', points.length),
    output: importView(graph, 'output', outputBuffer, 'float32x2', points.length),
    plan
  });

  contributor.addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({
    id: 'gpu-project-float32-fractional-boundary-encoding'
  });
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  assertProjectedPoints(plan, points.slice(0, 2), actual.slice(0, 4));
  expect(actual[0], 'negative zero equals the positive-zero lower boundary').not.toBe(0);
  expect(
    actual.slice(4),
    'Float32 values immediately outside unrounded binary64 bounds produce zero rows'
  ).toEqual([0, 0, 0, 0]);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection automatically selects different adaptive patches for mixed rows', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = makeCurvedProjectionPlan();
  const points: Coordinates[] = [
    [0.25, 0.25],
    [1.75, 0.25],
    [0.25, 1.75],
    [1.75, 1.75]
  ];
  const inputBuffer = createBuffer(device, Float32Array.from(points.flat()));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-automatic-patch-selection'});

  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', points.length),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-automatic-patch-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  expect(
    Boolean(new Set(points.map(point => findProjectionPatch(plan, point))).size > 1),
    'the source rows span multiple polynomial patches'
  ).toBe(true);
  assertProjectedPoints(plan, points, actual);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection preserves empty vector chunks and honors explicit mixed patch IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = makeCurvedProjectionPlan();
  const points: Coordinates[] = [
    [0.25, 0.25],
    [1.75, 0.25],
    [0.25, 1.75]
  ];
  const patchIds = points.map(point => findProjectionPatch(plan, point));
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-chunked-explicit-patches'});
  const positionVector = importVector(graph, device, 'positions', 'float32x2', 2, [
    Float32Array.from(points[0]),
    new Float32Array(0),
    Float32Array.from([...points[1], ...points[2]])
  ]);
  const patchIdVector = importVector(graph, device, 'patch-ids', 'uint32', 1, [
    Uint32Array.from([patchIds[0]]),
    new Uint32Array(0),
    Uint32Array.from([patchIds[1], patchIds[2]])
  ]);
  const outputVector = importOutputVector(graph, device, 'projected', 'float32x2', 2, [1, 0, 2]);

  const contributor = new GPUProjection({
    id: 'chunked-projection',
    positions: positionVector.view,
    output: outputVector.view,
    patchIds: patchIdVector.view,
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-chunked-explicit-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  expect(
    positionVector.view.data.map(chunk => chunk.length),
    'source chunk topology remains intact'
  ).toEqual([1, 0, 2]);
  expect(
    patchIdVector.view.data.map(chunk => chunk.length),
    'patch IDs preserve source-aligned chunks'
  ).toEqual([1, 0, 2]);
  expect(
    outputVector.view.data.map(chunk => chunk.length),
    'output chunks preserve the empty source batch'
  ).toEqual([1, 0, 2]);
  expect(
    compiled.stats.nodeOrder.filter(nodeId => nodeId.startsWith('chunked-projection')).length,
    'only nonempty input chunks contribute compute passes'
  ).toBe(2);
  expect(Boolean(new Set(patchIds).size > 1), 'explicit IDs select different local patches').toBe(
    true
  );

  const actual = [
    ...(await readFloat32(outputVector.buffers[0], 2)),
    ...(await readFloat32(outputVector.buffers[2], 4))
  ];
  assertProjectedPoints(plan, points, actual);

  compiled.destroy();
  contributor.destroy();
  for (const buffer of [
    ...positionVector.buffers,
    ...patchIdVector.buffers,
    ...outputVector.buffers
  ]) {
    buffer.destroy();
  }
  void 0;
});

it('GPUProjection writes deterministic zero rows for invalid coordinates and patch IDs', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = makeCurvedProjectionPlan();
  const validCoordinate = [0.25, 0.25] as const;
  const otherCoordinate = [1.75, 0.25] as const;
  const validPatchId = findProjectionPatch(plan, validCoordinate);
  const automaticCoordinates = Float32Array.from([
    ...validCoordinate,
    3,
    0.5,
    Number.NaN,
    0.5,
    0.5,
    Number.POSITIVE_INFINITY
  ]);
  const explicitCoordinates = Float32Array.from([
    ...validCoordinate,
    ...otherCoordinate,
    0.25,
    1.75,
    3,
    0.5
  ]);
  const automaticInputBuffer = createBuffer(device, automaticCoordinates);
  const explicitInputBuffer = createBuffer(device, explicitCoordinates);
  const patchIdBuffer = createBuffer(
    device,
    Uint32Array.from([validPatchId, validPatchId, 0xffffffff, validPatchId])
  );
  const automaticOutputBuffer = createOutputBuffer(device, 8);
  const explicitOutputBuffer = createOutputBuffer(device, 8);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-invalid-projection-inputs'});
  const automaticContributor = new GPUProjection({
    id: 'automatic-invalid-rows',
    positions: importView(graph, 'automatic-input', automaticInputBuffer, 'float32x2', 4),
    output: importView(graph, 'automatic-output', automaticOutputBuffer, 'float32x2', 4),
    plan
  });
  const explicitContributor = new GPUProjection({
    id: 'explicit-invalid-rows',
    positions: importView(graph, 'explicit-input', explicitInputBuffer, 'float32x2', 4),
    output: importView(graph, 'explicit-output', explicitOutputBuffer, 'float32x2', 4),
    patchIds: importView(graph, 'explicit-patch-ids', patchIdBuffer, 'uint32', 4),
    plan
  });

  automaticContributor.addToGraph(graph);
  explicitContributor.addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-invalid-projection-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const automaticOutput = await readFloat32(automaticOutputBuffer, 8);
  const explicitOutput = await readFloat32(explicitOutputBuffer, 8);
  assertProjectedPoints(plan, [validCoordinate], automaticOutput.slice(0, 2));
  assertProjectedPoints(plan, [validCoordinate], explicitOutput.slice(0, 2));
  expect(
    automaticOutput.slice(2),
    'out-of-domain, NaN, and infinite coordinates produce zero rows'
  ).toEqual([0, 0, 0, 0, 0, 0]);
  expect(
    explicitOutput.slice(2),
    'mismatched IDs, out-of-range IDs, and out-of-domain coordinates produce zero rows'
  ).toEqual([0, 0, 0, 0, 0, 0]);

  compiled.destroy();
  automaticContributor.destroy();
  explicitContributor.destroy();
  for (const buffer of [
    automaticInputBuffer,
    explicitInputBuffer,
    patchIdBuffer,
    automaticOutputBuffer,
    explicitOutputBuffer
  ]) {
    buffer.destroy();
  }
  void 0;
});

it('GPUProjection rejects source and output handles sharing physical storage', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds: [0, 0, 1, 1],
    degree: 1,
    tolerance: 1e-5
  });
  const sharedBuffer = device.createBuffer({
    byteLength: 512,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-physically-aliased-source'});
  const positions = importView(graph, 'position-handle', sharedBuffer, 'float32x2', 1);
  const output = importView(graph, 'output-handle', sharedBuffer, 'float32x2', 1, 256);

  expect(positions.buffer, 'source and output use distinct graph handles').not.toBe(output.buffer);
  expect(
    () => new GPUProjection({positions, output, plan}),
    'source and output cannot share a physical buffer behind distinct graph handles'
  ).toThrow(/output.*positions.*overlap/);

  sharedBuffer.destroy();
  void 0;
});

it('GPUProjection rejects legacy packed plans without the bounds trailer', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds: [0, 0, 1, 1],
    degree: 1,
    tolerance: 1e-5
  });
  const positionBuffer = createBuffer(device, Float32Array.from([0.5, 0.5]));
  const outputBuffer = createOutputBuffer(device, 2);
  const legacyPlanWordLength = plan.patches.length * PROJECTION_PATCH_WORD_LENGTH;
  const legacyPlanBuffer = device.createBuffer({
    byteLength: legacyPlanWordLength * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE
  });
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-legacy-packed-plan'});
  const positions = importView(graph, 'positions', positionBuffer, 'float32x2', 1);
  const output = importView(graph, 'output', outputBuffer, 'float32x2', 1);
  const planBuffer = importView(
    graph,
    'legacy-plan',
    legacyPlanBuffer,
    'uint32',
    legacyPlanWordLength
  );

  expect(
    () => new GPUProjection({positions, output, plan, planBuffer}),
    'legacy patch-only storage must be repacked with the source-bounds trailer'
  ).toThrow(/plan buffer is smaller than its packed projection plan/);

  positionBuffer.destroy();
  outputBuffer.destroy();
  legacyPlanBuffer.destroy();
  void 0;
});

it('GPUProjection rejects caller-owned plan and output handles sharing physical storage', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds: [0, 0, 1, 1],
    degree: 1,
    tolerance: 1e-5
  });
  const packedPlan = packProjectionPlan(plan);
  const sharedBuffer = device.createBuffer({
    byteLength: 512,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  sharedBuffer.write(packedPlan);
  const positionBuffer = createBuffer(device, Float32Array.from([0.5, 0.5]));
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-physically-aliased-plan'});
  const positions = importView(graph, 'positions', positionBuffer, 'float32x2', 1);
  const planBuffer = importView(graph, 'plan-handle', sharedBuffer, 'uint32', packedPlan.length);
  const output = importView(graph, 'output-handle', sharedBuffer, 'float32x2', 1, 256);

  expect(planBuffer.buffer, 'plan and output use distinct graph handles').not.toBe(output.buffer);
  expect(
    () => new GPUProjection({positions, output, plan, planBuffer}),
    'caller-owned plan and output cannot share a physical buffer behind distinct graph handles'
  ).toThrow(/output.*plan.*overlap/);

  positionBuffer.destroy();
  sharedBuffer.destroy();
  void 0;
});

it('GPUProjection rejects updates to caller-owned plans without COPY_DST usage', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const bounds = [0, 0, 1, 1] as const;
  const initialPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [...coordinates],
    bounds,
    degree: 1,
    tolerance: 1e-5
  });
  const updatedPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [coordinates[0] * 2, coordinates[1] * 2],
    bounds,
    degree: 1,
    tolerance: 1e-5
  });
  const packedPlan = packProjectionPlan(initialPlan);
  const readOnlyPlanBuffer = device.createBuffer({data: packedPlan, usage: Buffer.STORAGE});
  const positionBuffer = createBuffer(device, Float32Array.from([0.75, 0.5]));
  const outputBuffer = createOutputBuffer(device, 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-read-only-plan-update'});
  const positions = importView(graph, 'positions', positionBuffer, 'float32x2', 1);
  const output = importView(graph, 'output', outputBuffer, 'float32x2', 1);
  const contributor = new GPUProjection({
    positions,
    output,
    plan: initialPlan,
    planBuffer: importView(graph, 'read-only-plan', readOnlyPlanBuffer, 'uint32', packedPlan.length)
  });

  contributor.addToGraph(graph);
  expect(
    () => contributor.updatePlan(updatedPlan),
    'caller-owned plan updates require writable GPU storage'
  ).toThrow(/COPY_DST/);
  expect(contributor.plan, 'a rejected update preserves the current CPU plan').toBe(initialPlan);

  const invalidBounds = [
    [0, 0, Number.POSITIVE_INFINITY, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ] as const;
  for (const bounds of invalidBounds) {
    const invalidPlan = {...updatedPlan, bounds};
    expect(
      () => contributor.updatePlan(invalidPlan),
      'plan updates reject non-finite or unordered source bounds'
    ).toThrow(/finite, increasing source bounds/);
    expect(
      () => new GPUProjection({positions, output, plan: invalidPlan}),
      'construction rejects non-finite or unordered source bounds'
    ).toThrow(/finite, increasing source bounds/);
  }
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-rejected-plan-update-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());
  const actual = await readFloat32(outputBuffer, 2);
  assertClose(
    actual[0],
    0.25,
    1e-6,
    'rejected updates preserve the packed projection plan and exact x bounds'
  );
  assertClose(
    actual[1],
    0,
    1e-6,
    'rejected updates preserve the packed projection plan and exact y bounds'
  );

  compiled.destroy();
  contributor.destroy();
  readOnlyPlanBuffer.destroy();
  positionBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection updates caller-owned packed plans without rebuilding its graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const bounds = [99, 199, 101, 201] as const;
  const initialPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      1_000 + (coordinates[0] - 100) * 2,
      2_000 + (coordinates[1] - 200) * 3
    ],
    bounds,
    degree: 1,
    tolerance: 1e-5
  });
  const updatedPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      5_000 + (coordinates[0] - 100) * 4,
      6_000 - (coordinates[1] - 200) * 2
    ],
    bounds,
    degree: 1,
    tolerance: 1e-5
  });
  const points: Coordinates[] = [
    [99.5, 199.75],
    [100.25, 200.5]
  ];
  const packedPlan = packProjectionPlan(initialPlan);
  const planByteOffset = 4;
  const planBuffer = device.createBuffer({
    byteLength: planByteOffset + packedPlan.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
  });
  planBuffer.write(packedPlan, planByteOffset);
  const inputBuffer = createBuffer(device, Float32Array.from(points.flat()));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-reusable-plan'});
  const contributor = new GPUProjection({
    id: 'reusable-projection',
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', points.length),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', points.length),
    plan: initialPlan,
    planBuffer: importView(
      graph,
      'caller-owned-plan',
      planBuffer,
      'uint32',
      packedPlan.length,
      planByteOffset
    )
  });

  contributor.addToGraph(graph);
  const compiled = graph.compile();
  const initialNodeOrder = [...compiled.stats.nodeOrder];
  const firstEncoder = device.createCommandEncoder({id: 'gpu-project-initial-plan-encoding'});
  compiled.encode(firstEncoder, {parameters: undefined});
  device.submit(firstEncoder.finish());
  assertProjectedPoints(initialPlan, points, await readFloat32(outputBuffer, points.length * 2));

  contributor.updatePlan(updatedPlan);
  expect(contributor.plan, 'the contributor exposes the updated CPU plan').toBe(updatedPlan);
  const secondEncoder = device.createCommandEncoder({id: 'gpu-project-updated-plan-encoding'});
  compiled.encode(secondEncoder, {parameters: undefined});
  device.submit(secondEncoder.finish());
  assertProjectedPoints(updatedPlan, points, await readFloat32(outputBuffer, points.length * 2));
  expect(
    compiled.stats.nodeOrder,
    'plan updates reuse the existing command graph topology'
  ).toEqual(initialNodeOrder);

  compiled.destroy();
  contributor.destroy();
  contributor.destroy();
  expect(planBuffer.destroyed, 'caller-owned packed plan remains allocated').toBe(false);
  expect(inputBuffer.destroyed, 'caller-owned source remains allocated').toBe(false);
  expect(outputBuffer.destroyed, 'caller-owned destination remains allocated').toBe(false);
  expect(() => contributor.updatePlan(initialPlan), '').toThrow(/destroyed/);

  planBuffer.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection updates exact global bounds without rebuilding its graph', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const projection = (coordinates: number[]): number[] => [...coordinates];
  const initialPlan = compileProjectionPlan({
    projection,
    bounds: [-2, -2, -0, -0],
    degree: 1,
    tolerance: 1e-5
  });
  const updatedPlan = compileProjectionPlan({
    projection,
    bounds: [0, 0, 2, 2],
    degree: 1,
    tolerance: 1e-5
  });
  const points: Coordinates[] = [
    [-1.5, -0.5],
    [-0, 0],
    [0, -0],
    [1.5, 0.5]
  ];
  const packedPlan = packProjectionPlan(initialPlan);
  const planBuffer = device.createBuffer({
    data: packedPlan,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const inputBuffer = createBuffer(device, encodeFloat64Points(points));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-shifted-global-bounds'});
  const contributor = new GPUProjection({
    id: 'mutable-global-bounds',
    positions: importView(graph, 'positions', inputBuffer, 'uint32x4', points.length),
    output: importView(graph, 'output', outputBuffer, 'float32x2', points.length),
    plan: initialPlan,
    planBuffer: importView(graph, 'caller-owned-plan', planBuffer, 'uint32', packedPlan.length)
  });

  contributor.addToGraph(graph);
  const compiled = graph.compile();
  const nodeOrder = [...compiled.stats.nodeOrder];
  const initialEncoder = device.createCommandEncoder({id: 'gpu-project-initial-global-bounds'});
  compiled.encode(initialEncoder, {parameters: undefined});
  device.submit(initialEncoder.finish());
  expect(
    await readFloat32(outputBuffer, points.length * 2),
    'initial bounds accept both signed zeros and reject coordinates outside their upper edges'
  ).toEqual([-0.5, 0.5, 1, 1, 1, 1, 0, 0]);

  contributor.updatePlan(updatedPlan);
  const updatedEncoder = device.createCommandEncoder({id: 'gpu-project-updated-global-bounds'});
  compiled.encode(updatedEncoder, {parameters: undefined});
  device.submit(updatedEncoder.finish());
  expect(
    await readFloat32(outputBuffer, points.length * 2),
    'shifted bounds reject old coordinates while still accepting both signed zeros'
  ).toEqual([0, 0, -1, -1, -1, -1, 0.5, -0.5]);
  expect(compiled.stats.nodeOrder, 'shifted bounds reuse the compiled graph').toEqual(nodeOrder);

  compiled.destroy();
  contributor.destroy();
  expect(planBuffer.destroyed, 'caller-owned plan survives contributor destruction').toBe(false);
  planBuffer.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection retains tolerant raw-binary64 assignment at internal patch seams', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }
  if (isSoftwareBackedDevice(device)) {
    void 0;
    void 0;
    return;
  }

  const minimum = 4_189_890.0279418225;
  const maximum = 4_189_891.498858749;
  const midpoint = minimum + (maximum - minimum) / 2;
  const plan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => {
      const horizontal = coordinates[0] - midpoint;
      const vertical = coordinates[1] - midpoint;
      return [horizontal + horizontal * horizontal * 0.1, vertical + vertical * vertical * 0.1];
    },
    bounds: [minimum, minimum, maximum, maximum],
    degree: 1,
    tolerance: 0.01,
    maxDepth: 1
  });
  const point: Coordinates = [midpoint, minimum + (midpoint - minimum) / 2];
  const patchId = findProjectionPatch(plan, point);
  const inputBuffer = createBuffer(device, encodeFloat64Points([point]));
  const patchIdBuffer = createBuffer(device, Uint32Array.from([patchId]));
  const outputBuffer = createOutputBuffer(device, 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-internal-seam'});
  const contributor = new GPUProjection({
    positions: importView(graph, 'raw-position', inputBuffer, 'uint32x4', 1),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', 1),
    patchIds: importView(graph, 'patch-id', patchIdBuffer, 'uint32', 1),
    plan
  });

  expect(plan.patches.length, 'the curved plan subdivides into four patches').toBe(4);
  expect(patchId, 'the inclusive CPU lookup selects the lower-left seam patch').toBe(0);
  contributor.addToGraph(graph);
  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'gpu-project-internal-seam-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, 2);
  assertProjectedPoints(plan, [point], actual);
  expect(actual[1], 'the accepted seam row is distinct from the zero sentinel').not.toBe(0);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  patchIdBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

it('GPUProjection keeps strict bounds coupled to per-encoding plan overrides', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const initialPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      1_000 + coordinates[0] * 2,
      2_000 + coordinates[1] * 3
    ],
    bounds: [0, 0, 1, 1],
    degree: 1,
    tolerance: 1e-5
  });
  const shiftedPlan = compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      5_000 + (coordinates[0] - 100) * 4,
      6_000 - (coordinates[1] - 200) * 2
    ],
    bounds: [100, 200, 101, 201],
    degree: 1,
    tolerance: 1e-5
  });
  const initialPackedPlan = packProjectionPlan(initialPlan);
  const shiftedPackedPlan = packProjectionPlan(shiftedPlan);
  const initialPlanBuffer = device.createBuffer({data: initialPackedPlan, usage: Buffer.STORAGE});
  const shiftedPlanBuffer = device.createBuffer({data: shiftedPackedPlan, usage: Buffer.STORAGE});
  const points: Coordinates[] = [
    [0.25, 0.75],
    [100.25, 200.75]
  ];
  const inputBuffer = createBuffer(device, Float32Array.from(points.flat()));
  const outputBuffer = createOutputBuffer(device, points.length * 2);
  const graph = new GPUCommandGraph(device, {id: 'gpu-project-overrideable-plan'});
  const planHandle = graph.importBuffer({
    id: 'dynamic-plan',
    byteLength: initialPackedPlan.byteLength,
    usage: Buffer.STORAGE
  });
  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', points.length),
    output: importView(graph, 'output', outputBuffer, 'float32x2', points.length),
    plan: initialPlan,
    planBuffer: graph.createDataView(planHandle, {
      format: 'uint32',
      length: initialPackedPlan.length
    })
  });

  contributor.addToGraph(graph);
  const compiled = graph.compile();
  const initialEncoder = device.createCommandEncoder({id: 'gpu-project-initial-override-encoding'});
  compiled.encode(initialEncoder, {
    parameters: undefined,
    buffers: {'dynamic-plan': initialPlanBuffer}
  });
  device.submit(initialEncoder.finish());
  const initialOutput = await readFloat32(outputBuffer, points.length * 2);
  assertProjectedPoints(initialPlan, [points[0]], initialOutput.slice(0, 2));
  expect(initialOutput.slice(2), 'initial override rejects shifted rows').toEqual([0, 0]);

  const shiftedEncoder = device.createCommandEncoder({id: 'gpu-project-shifted-override-encoding'});
  compiled.encode(shiftedEncoder, {
    parameters: undefined,
    buffers: {'dynamic-plan': shiftedPlanBuffer}
  });
  device.submit(shiftedEncoder.finish());
  const shiftedOutput = await readFloat32(outputBuffer, points.length * 2);
  expect(shiftedOutput.slice(0, 2), 'shifted override rejects initial rows').toEqual([0, 0]);
  assertProjectedPoints(shiftedPlan, [points[1]], shiftedOutput.slice(2));

  compiled.destroy();
  contributor.destroy();
  initialPlanBuffer.destroy();
  shiftedPlanBuffer.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  void 0;
});

function makeCurvedProjectionPlan(): ReturnType<typeof compileProjectionPlan> {
  return compileProjectionPlan({
    projection: (coordinates: number[]): number[] => [
      1_000 + coordinates[0] + coordinates[0] * coordinates[0] * 0.2,
      2_000 + coordinates[1] + coordinates[1] * coordinates[1] * 0.15
    ],
    bounds: [0, 0, 2, 2],
    degree: 1,
    tolerance: 0.06,
    maxDepth: 5
  });
}

function assertProjectedPoints(
  plan: ReturnType<typeof compileProjectionPlan>,
  points: readonly Coordinates[],
  actual: readonly number[]
): void {
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      plan.tolerance + 1e-5,
      `mixed patch point ${pointIndex} matches its local x projection`
    );
    assertClose(
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      plan.tolerance + 1e-5,
      `mixed patch point ${pointIndex} matches its local y projection`
    );
  }
}

function createBuffer(device: Device, values: Float32Array | Uint32Array): Buffer {
  return device.createBuffer({data: values, usage: Buffer.STORAGE | Buffer.COPY_DST});
}

function isSoftwareBackedDevice(device: Device): boolean {
  return (
    device.info.gpu === 'software' || device.info.gpuType === 'cpu' || Boolean(device.info.fallback)
  );
}

function createOutputBuffer(device: Device, elementCount: number): Buffer {
  return device.createBuffer({
    byteLength: Math.max(elementCount * Float32Array.BYTES_PER_ELEMENT, 4),
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function importView<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  identifier: string,
  buffer: Buffer,
  format: T,
  length: number,
  byteOffset: number = 0
): GraphDataView<T> {
  const handle = graph.importBuffer(
    {id: identifier, byteLength: buffer.byteLength, usage: buffer.usage},
    buffer
  );
  return graph.createDataView(handle, {format, length, byteOffset});
}

function importVector<T extends GPUVectorFormat>(
  graph: GPUCommandGraph,
  device: Device,
  identifier: string,
  format: T,
  stride: number,
  chunks: readonly (Float32Array | Uint32Array)[]
): {view: GraphVectorView<T>; buffers: Buffer[]} {
  const buffers: Buffer[] = [];
  const data = chunks.map((values, chunkIndex) => {
    const buffer =
      values.length > 0
        ? createBuffer(device, values)
        : device.createBuffer({
            byteLength: stride * Uint32Array.BYTES_PER_ELEMENT,
            usage: Buffer.STORAGE | Buffer.COPY_DST
          });
    buffers.push(buffer);
    return importView(graph, `${identifier}-${chunkIndex}`, buffer, format, values.length / stride);
  });
  const length = data.reduce((total, chunk) => total + chunk.length, 0);
  const rowByteLength = stride * Uint32Array.BYTES_PER_ELEMENT;
  return {
    view: new GraphVectorView({
      id: identifier,
      name: identifier,
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
  identifier: string,
  format: T,
  stride: number,
  chunkLengths: readonly number[]
): {view: GraphVectorView<T>; buffers: Buffer[]} {
  const rowByteLength = stride * Uint32Array.BYTES_PER_ELEMENT;
  const buffers = chunkLengths.map(length => createOutputBuffer(device, length * stride));
  const data = buffers.map((buffer, chunkIndex) =>
    importView(graph, `${identifier}-${chunkIndex}`, buffer, format, chunkLengths[chunkIndex])
  );
  const length = chunkLengths.reduce((total, chunkLength) => total + chunkLength, 0);
  return {
    view: new GraphVectorView({
      id: identifier,
      name: identifier,
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

async function readFloat32(
  buffer: Buffer,
  length: number,
  byteOffset: number = 0
): Promise<number[]> {
  const bytes = await buffer.readAsync(byteOffset, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

function encodeFloat64Points(points: readonly Coordinates[]): Uint32Array {
  const values = new Float64Array(points.length * 2);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    values[pointIndex * 2] = points[pointIndex][0];
    values[pointIndex * 2 + 1] = points[pointIndex][1];
  }
  return new Uint32Array(values.buffer);
}

function assertClose(actual: number, expected: number, tolerance: number, message: string): void {
  expect(
    Boolean(Math.abs(actual - expected) <= tolerance),
    `${message}: ${actual} versus ${expected}`
  ).toBe(true);
}
