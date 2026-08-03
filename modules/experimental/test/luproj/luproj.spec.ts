// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from '@luma.gl/experimental';
import {
  compileProjectionPlan,
  evaluateProjectionPlan,
  findProjectionPatch,
  GPUProjection,
  packProjectionPlan
} from '@luma.gl/experimental/luproj';
import type {GPUVectorFormat} from '@luma.gl/tables';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

type Coordinates = readonly [number, number];

test('GPUProjection writes origin-relative f32 positions and honors nonzero view offsets', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-float32-offsets'});
  const input = importView(graph, 'positions', inputBuffer, 'float32x2', 3, viewOffset);
  const output = importView(graph, 'projected', outputBuffer, 'float32x2', 3, viewOffset);

  const contributor = new GPUProjection({id: 'float32-projection', positions: input, output, plan});
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'luproj-float32-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, positions.length, viewOffset);
  for (let pointIndex = 0; pointIndex < positions.length / 2; pointIndex++) {
    const coordinate = [positions[pointIndex * 2], positions[pointIndex * 2 + 1]] as const;
    const expected = evaluateProjectionPlan(plan, coordinate);
    assertClose(
      tapeTest,
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      2e-5,
      `point ${pointIndex} retains a local x coordinate`
    );
    assertClose(
      tapeTest,
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      2e-5,
      `point ${pointIndex} retains a local y coordinate`
    );
  }
  tapeTest.ok(
    actual.every(value => Math.abs(value) < 10),
    'million-meter destination origins are not rounded back into Float32 output'
  );

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection preserves Float32 positions around fractional binary64 source origins', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-float32-fractional-source-origins'});

  tapeTest.equal(
    plan.patches[0].sourceOrigin[0],
    sourceOrigin[0],
    'x origin retains binary64 precision'
  );
  tapeTest.equal(
    plan.patches[0].sourceOrigin[1],
    sourceOrigin[1],
    'y origin retains binary64 precision'
  );
  tapeTest.equal(
    findProjectionPatch(plan, position),
    0,
    'representable Float32 position is in bounds'
  );

  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', 1),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', 1),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'luproj-float32-fractional-origin-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, 2);
  const expected = evaluateProjectionPlan(plan, position);
  assertClose(
    tapeTest,
    actual[0],
    expected[0] - plan.destinationOrigin[0],
    1e-6,
    'x position subtracts both Float32 source-origin limbs'
  );
  assertClose(
    tapeTest,
    actual[1],
    expected[1] - plan.destinationOrigin[1],
    1e-6,
    'y position subtracts both Float32 source-origin limbs'
  );
  assertClose(
    tapeTest,
    actual[0],
    0.15,
    1e-6,
    'valid x position is not rejected at the patch edge'
  );
  assertClose(
    tapeTest,
    actual[1],
    0.15,
    1e-6,
    'valid y position is not rejected at the patch edge'
  );

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection subtracts raw binary64 origins before converting local offsets to f32', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-raw-binary64'});

  const contributor = new GPUProjection({
    positions: importView(graph, 'raw-positions', inputBuffer, 'uint32x4', points.length),
    output: importView(graph, 'local-output', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'luproj-raw-binary64-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      tapeTest,
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      1e-8,
      `binary64 point ${pointIndex} preserves its local x offset`
    );
    assertClose(
      tapeTest,
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      1e-8,
      `binary64 point ${pointIndex} preserves its local y offset`
    );
  }
  tapeTest.notEqual(actual[0], 0, 'a sub-f32-ULP easting offset survives projection');
  tapeTest.notEqual(actual[1], 0, 'a sub-f32-ULP northing offset survives projection');

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection accepts inclusive binary64 patch endpoints after Float32 normalization', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-inclusive-binary64-endpoints'});

  tapeTest.equal(
    findProjectionPatch(plan, points[0]),
    0,
    'minimum source endpoint belongs to the patch'
  );
  tapeTest.equal(
    findProjectionPatch(plan, points[1]),
    0,
    'maximum source endpoint belongs to the patch'
  );

  const contributor = new GPUProjection({
    positions: importView(graph, 'raw-positions', inputBuffer, 'uint32x4', points.length),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'luproj-inclusive-binary64-endpoint-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      tapeTest,
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      1e-6,
      `inclusive binary64 endpoint ${pointIndex} retains its x coordinate`
    );
    assertClose(
      tapeTest,
      actual[pointIndex * 2 + 1],
      expected[1] - plan.destinationOrigin[1],
      1e-6,
      `inclusive binary64 endpoint ${pointIndex} retains its y coordinate`
    );
    tapeTest.notEqual(
      actual[pointIndex * 2],
      0,
      `inclusive endpoint ${pointIndex} is not rejected`
    );
  }

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection automatically selects different adaptive patches for mixed rows', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-automatic-patch-selection'});

  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', inputBuffer, 'float32x2', points.length),
    output: importView(graph, 'projected', outputBuffer, 'float32x2', points.length),
    plan
  });
  contributor.addToGraph(graph);

  const compiled = graph.compile();
  const encoder = device.createCommandEncoder({id: 'luproj-automatic-patch-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const actual = await readFloat32(outputBuffer, points.length * 2);
  tapeTest.ok(
    new Set(points.map(point => findProjectionPatch(plan, point))).size > 1,
    'the source rows span multiple polynomial patches'
  );
  assertProjectedPoints(tapeTest, plan, points, actual);

  compiled.destroy();
  contributor.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection preserves empty vector chunks and honors explicit mixed patch IDs', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
    return;
  }

  const plan = makeCurvedProjectionPlan();
  const points: Coordinates[] = [
    [0.25, 0.25],
    [1.75, 0.25],
    [0.25, 1.75]
  ];
  const patchIds = points.map(point => findProjectionPatch(plan, point));
  const graph = new GPUCommandGraph(device, {id: 'luproj-chunked-explicit-patches'});
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
  const encoder = device.createCommandEncoder({id: 'luproj-chunked-explicit-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  tapeTest.deepEqual(
    positionVector.view.data.map(chunk => chunk.length),
    [1, 0, 2],
    'source chunk topology remains intact'
  );
  tapeTest.deepEqual(
    patchIdVector.view.data.map(chunk => chunk.length),
    [1, 0, 2],
    'patch IDs preserve source-aligned chunks'
  );
  tapeTest.deepEqual(
    outputVector.view.data.map(chunk => chunk.length),
    [1, 0, 2],
    'output chunks preserve the empty source batch'
  );
  tapeTest.equal(
    compiled.stats.nodeOrder.filter(nodeId => nodeId.startsWith('chunked-projection')).length,
    2,
    'only nonempty input chunks contribute compute passes'
  );
  tapeTest.ok(new Set(patchIds).size > 1, 'explicit IDs select different local patches');

  const actual = [
    ...(await readFloat32(outputVector.buffers[0], 2)),
    ...(await readFloat32(outputVector.buffers[2], 4))
  ];
  assertProjectedPoints(tapeTest, plan, points, actual);

  compiled.destroy();
  contributor.destroy();
  for (const buffer of [
    ...positionVector.buffers,
    ...patchIdVector.buffers,
    ...outputVector.buffers
  ]) {
    buffer.destroy();
  }
  tapeTest.end();
});

test('GPUProjection writes deterministic zero rows for invalid coordinates and patch IDs', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-invalid-projection-inputs'});
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
  const encoder = device.createCommandEncoder({id: 'luproj-invalid-projection-encoding'});
  compiled.encode(encoder, {parameters: undefined});
  device.submit(encoder.finish());

  const automaticOutput = await readFloat32(automaticOutputBuffer, 8);
  const explicitOutput = await readFloat32(explicitOutputBuffer, 8);
  assertProjectedPoints(tapeTest, plan, [validCoordinate], automaticOutput.slice(0, 2));
  assertProjectedPoints(tapeTest, plan, [validCoordinate], explicitOutput.slice(0, 2));
  tapeTest.deepEqual(
    automaticOutput.slice(2),
    [0, 0, 0, 0, 0, 0],
    'out-of-domain, NaN, and infinite coordinates produce zero rows'
  );
  tapeTest.deepEqual(
    explicitOutput.slice(2),
    [0, 0, 0, 0, 0, 0],
    'mismatched IDs, out-of-range IDs, and out-of-domain coordinates produce zero rows'
  );

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
  tapeTest.end();
});

test('GPUProjection rejects source and output handles sharing physical storage', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-physically-aliased-source'});
  const positions = importView(graph, 'position-handle', sharedBuffer, 'float32x2', 1);
  const output = importView(graph, 'output-handle', sharedBuffer, 'float32x2', 1, 256);

  tapeTest.notEqual(
    positions.buffer,
    output.buffer,
    'source and output use distinct graph handles'
  );
  tapeTest.throws(
    () => new GPUProjection({positions, output, plan}),
    /output.*positions.*overlap/,
    'source and output cannot share a physical buffer behind distinct graph handles'
  );

  sharedBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection rejects caller-owned plan and output handles sharing physical storage', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-physically-aliased-plan'});
  const positions = importView(graph, 'positions', positionBuffer, 'float32x2', 1);
  const planBuffer = importView(graph, 'plan-handle', sharedBuffer, 'uint32', packedPlan.length);
  const output = importView(graph, 'output-handle', sharedBuffer, 'float32x2', 1, 256);

  tapeTest.notEqual(planBuffer.buffer, output.buffer, 'plan and output use distinct graph handles');
  tapeTest.throws(
    () => new GPUProjection({positions, output, plan, planBuffer}),
    /output.*plan.*overlap/,
    'caller-owned plan and output cannot share a physical buffer behind distinct graph handles'
  );

  positionBuffer.destroy();
  sharedBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection rejects updates to caller-owned plans without COPY_DST usage', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const positionBuffer = createBuffer(device, Float32Array.from([0.5, 0.5]));
  const outputBuffer = createOutputBuffer(device, 2);
  const graph = new GPUCommandGraph(device, {id: 'luproj-read-only-plan-update'});
  const contributor = new GPUProjection({
    positions: importView(graph, 'positions', positionBuffer, 'float32x2', 1),
    output: importView(graph, 'output', outputBuffer, 'float32x2', 1),
    plan: initialPlan,
    planBuffer: importView(graph, 'read-only-plan', readOnlyPlanBuffer, 'uint32', packedPlan.length)
  });

  tapeTest.throws(
    () => contributor.updatePlan(updatedPlan),
    /COPY_DST/,
    'caller-owned plan updates require writable GPU storage'
  );
  tapeTest.equal(contributor.plan, initialPlan, 'a rejected update preserves the current CPU plan');

  contributor.destroy();
  readOnlyPlanBuffer.destroy();
  positionBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
});

test('GPUProjection updates caller-owned packed plans without rebuilding its graph', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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
  const graph = new GPUCommandGraph(device, {id: 'luproj-reusable-plan'});
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
  const firstEncoder = device.createCommandEncoder({id: 'luproj-initial-plan-encoding'});
  compiled.encode(firstEncoder, {parameters: undefined});
  device.submit(firstEncoder.finish());
  assertProjectedPoints(
    tapeTest,
    initialPlan,
    points,
    await readFloat32(outputBuffer, points.length * 2)
  );

  contributor.updatePlan(updatedPlan);
  tapeTest.equal(contributor.plan, updatedPlan, 'the contributor exposes the updated CPU plan');
  const secondEncoder = device.createCommandEncoder({id: 'luproj-updated-plan-encoding'});
  compiled.encode(secondEncoder, {parameters: undefined});
  device.submit(secondEncoder.finish());
  assertProjectedPoints(
    tapeTest,
    updatedPlan,
    points,
    await readFloat32(outputBuffer, points.length * 2)
  );
  tapeTest.deepEqual(
    compiled.stats.nodeOrder,
    initialNodeOrder,
    'plan updates reuse the existing command graph topology'
  );

  compiled.destroy();
  contributor.destroy();
  contributor.destroy();
  tapeTest.equal(planBuffer.destroyed, false, 'caller-owned packed plan remains allocated');
  tapeTest.equal(inputBuffer.destroyed, false, 'caller-owned source remains allocated');
  tapeTest.equal(outputBuffer.destroyed, false, 'caller-owned destination remains allocated');
  tapeTest.throws(() => contributor.updatePlan(initialPlan), /destroyed/);

  planBuffer.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  tapeTest.end();
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
  tapeTest: {ok(value: unknown, message?: string): void},
  plan: ReturnType<typeof compileProjectionPlan>,
  points: readonly Coordinates[],
  actual: readonly number[]
): void {
  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    const expected = evaluateProjectionPlan(plan, points[pointIndex]);
    assertClose(
      tapeTest,
      actual[pointIndex * 2],
      expected[0] - plan.destinationOrigin[0],
      plan.tolerance + 1e-5,
      `mixed patch point ${pointIndex} matches its local x projection`
    );
    assertClose(
      tapeTest,
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

function assertClose(
  tapeTest: {ok(value: unknown, message?: string): void},
  actual: number,
  expected: number,
  tolerance: number,
  message: string
): void {
  tapeTest.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} versus ${expected}`);
}
