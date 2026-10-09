// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {makeVisualizationFixture} from './projection-visualization-fixtures';
import {runProjectionRoutingBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  compileProjectionPartition,
  compileProjectionPlan,
  compileProjectionProgram,
  evaluateProjectionProgram,
  GPUProjection,
  GPUProjectionProgram,
  indexProjectionPlan,
  type ProjectionCoordinates,
  type ProjectionInputFormat,
  type ProjectionPlan
} from '@luma.gl/experimental/gpu-project';
import {executeGPUProjectionBenchmark} from '../../src/gpu-project/gpu-projection-benchmark';
import {getProjectionShaderFunctions} from '../../src/gpu-project/projection-shader';
import {
  addGeospatialPass,
  getGeospatialDispatchLayout
} from '../../src/geospatial/geospatial-utils';
import {
  packProjectionPlan,
  PROJECTION_PATCH_WORD_LENGTH,
  PROJECTION_PLAN_BOUNDS_WORD_LENGTH
} from '../../src/gpu-project/projection-plan';

it('rejects malformed borrowed index leaf ranges with raw binary64 inputs on hardware', async context => {
  const device = await getWebGPUTestDevice();
  // SwiftShader overflows SPIR-V IDs while compiling this full raw-binary64/DS evaluator.
  // The smaller lookup-only regression below still exercises the same range guards in CI.
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    context.skip();
  const fitted = compileProjectionPlan({
    projection: position => position,
    bounds: [-1, -1, 1, 1],
    precision: 'double-single',
    tolerance: 1e-6
  });
  const plan = indexProjectionPlan({
    ...fitted,
    patches: Array.from({length: 8}, (_value, id) => ({...fitted.patches[0], id}))
  });
  const offset =
    plan.patches.length * PROJECTION_PATCH_WORD_LENGTH + PROJECTION_PLAN_BOUNDS_WORD_LENGTH;
  for (const [firstPatch, patchEnd] of [
    [8, 0xffffffff],
    [1, 0],
    [0, 9],
    [0, 5]
  ]) {
    const words = packProjectionPlan(plan);
    words[offset + 5] = firstPatch;
    words[offset + 6] = patchEnd;
    const result = await project(device, plan, [[0, 0]], 'uint32x4', true, words);
    expect([...result.validity]).toEqual([0]);
    expect([...result.output]).toEqual([0, 0, 0, 0]);
  }
}, 30000);

it('bounds malformed borrowed leaf scans in the portable lookup-only shader', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) context.skip();
  const fitted = compileProjectionPlan({
    projection: position => position,
    bounds: [-1, -1, 1, 1],
    tolerance: 1e-6
  });
  const plan = indexProjectionPlan({
    ...fitted,
    patches: Array.from({length: 8}, (_value, id) => ({...fitted.patches[0], id}))
  });
  const words = packProjectionPlan(plan);
  const graph = new GPUCommandGraph(device);
  const storage = device.createBuffer({
    byteLength: 256 + words.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const result = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE | Buffer.COPY_SRC});
  const projectionPlans = graph.createDataView(
    graph.importBuffer({id: 'plan', byteLength: storage.byteLength, usage: storage.usage}, storage),
    {format: 'uint32', length: words.length, byteOffset: 256}
  );
  const output = graph.createDataView(
    graph.importBuffer({id: 'output', byteLength: result.byteLength, usage: result.usage}, result),
    {format: 'uint32', length: 1}
  );
  let compiled: ReturnType<typeof graph.compile> | undefined;
  try {
    addGeospatialPass(graph, {
      id: 'borrowed-routing-guards',
      precise: false,
      dispatchLayout: getGeospatialDispatchLayout(
        1,
        device.limits.maxComputeWorkgroupsPerDimension
      ),
      bindings: {projectionPlans, output},
      resources: [
        {buffer: projectionPlans, usage: 'storage-read'},
        {buffer: output, usage: 'storage-write'}
      ],
      source: `${getProjectionShaderFunctions({precise: false, doubleSingle: false, patchCount: 8, planOffset: 0, routingNodeCount: plan.routingIndex!.length})}
@group(0) @binding(auto) var<storage, read_write> output: array<u32>;
@compute @workgroup_size(1) fn main() { output[0] = findProjectionPatch(vec2f(0.0)); }`
    });
    compiled = await graph.compileAsync();
    const offset = 8 * PROJECTION_PATCH_WORD_LENGTH + PROJECTION_PLAN_BOUNDS_WORD_LENGTH;
    // Include valid internal/leaf ranges to ensure a shader that always rejects cannot pass.
    for (const [firstPatch, patchEnd, expected] of [
      [0, 0, 0],
      [0, 4, 0],
      [8, 0xffffffff, 0xffffffff],
      [1, 0, 0xffffffff],
      [0, 9, 0xffffffff],
      [0, 5, 0xffffffff]
    ]) {
      words[offset + 5] = firstPatch;
      words[offset + 6] = patchEnd;
      storage.write(words, 256);
      await executeGPUProjectionBenchmark(device, compiled, 'borrowed-routing-guards');
      const bytes = await result.readAsync();
      expect(new Uint32Array(bytes.buffer, bytes.byteOffset, 1)[0]).toBe(expected);
    }
  } finally {
    compiled?.destroy();
    storage.destroy();
    result.destroy();
  }
}, 30000);

it('bounds lookup-only traversal for multi-workgroup inputs and matches every scan ID', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    context.skip();
  const projection = (position: number[]) => [Math.sin(position[0]), Math.cos(position[1])];
  const plan = compileProjectionPlan({
    projection,
    bounds: [-2, -2, 2, 2],
    precision: 'double-single',
    degree: 2,
    tolerance: 0.0001
  });
  const coordinates: ProjectionCoordinates[] = Array.from({length: 4096}, (_value, index) => [
    -2 + (4 * (index + 0.5)) / 4096,
    -2 + 4 * ((index * 0.6180339887498949) % 1)
  ]);
  coordinates.push([NaN, 0], [3, 0]);
  const report = await runProjectionRoutingBenchmark(device, {
    plan,
    coordinates,
    maximumError: 0.0001,
    oracle: position => ({
      position: [Math.sin(position[0]), Math.cos(position[1])],
      valid: position.every(value => Number.isFinite(value) && value >= -2 && value <= 2)
    }),
    gpuTiming: false,
    warmupIterations: 0,
    measuredIterations: 1
  });
  expect(report.patchCount).toBeGreaterThan(4);
  expect(report.routing.map(path => path.strategy)).toEqual(['scan', 'indexed']);
}, 30000);

for (const inputFormat of ['float32x2', 'float32x4', 'uint32x4'] as const) {
  for (const origin of [0, 1e8]) {
    it(`keeps scan/index bit-identical with rejected seams (${inputFormat}, origin ${origin})`, async context => {
      const device = await getWebGPUTestDevice();
      if (
        !device ||
        device.info.gpu === 'software' ||
        device.info.gpuType === 'cpu' ||
        device.info.fallback
      )
        context.skip();
      const plan = compileProjectionPartition({
        branches: Array.from({length: 8}, (_value, index) => ({
          id: `branch-${index}`,
          bounds: [origin + index * 4, -2, origin + index * 4 + 2, 2] as const,
          projection: position => [position[0] + 10_000_000 + index, position[1] * 2]
        })),
        tolerance: 1e-6
      }).plan;
      const coordinates: ProjectionCoordinates[] = [
        [NaN, 0],
        [Infinity, 0],
        [origin - 1, 0]
      ];
      for (const patch of plan.patches)
        for (const offset of [-1e-7, 0, 1e-7, 1, 2, 2 + 1e-7, 3])
          coordinates.push([patch.bounds[0] + offset, 0]);
      const scan = await project(device, plan, coordinates, inputFormat);
      const indexed = await project(device, indexProjectionPlan(plan), coordinates, inputFormat);
      expect(indexed).toEqual(scan);
      if (inputFormat !== 'float32x4') {
        const legacy = await project(
          device,
          indexProjectionPlan(plan),
          coordinates,
          inputFormat,
          true
        );
        expect(legacy).toEqual(scan);
      }
      const program = {
        precision: 'double-single' as const,
        operations: [{type: 'adaptive' as const, plan}]
      };
      for (const [row, coordinate] of coordinates.entries()) {
        const represented: ProjectionCoordinates =
          inputFormat === 'float32x2'
            ? [Math.fround(coordinate[0]), Math.fround(coordinate[1])]
            : inputFormat === 'float32x4'
              ? [
                  Math.fround(coordinate[0]) +
                    Math.fround(coordinate[0] - Math.fround(coordinate[0])),
                  Math.fround(coordinate[1]) +
                    Math.fround(coordinate[1] - Math.fround(coordinate[1]))
                ]
              : coordinate;
        const expected = evaluateProjectionProgram(program, represented);
        expect(scan.validity[row]).toBe(Number(expected.valid));
        const actual = new Float32Array(scan.output.buffer, row * 16, 4);
        if (expected.valid)
          expect(
            Math.hypot(
              actual[0] + actual[1] - expected.position[0],
              actual[2] + actual[3] - expected.position[1]
            )
          ).toBeLessThan(1e-6);
        else expect([...actual]).toEqual([0, 0, 0, 0]);
      }
    });
  }
}

it('rejects unresolved disk boundaries on GPU and retains accepted interior cells', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    context.skip();
  const plan = compileProjectionPartition({
    branches: [
      {
        id: 'disk',
        projection: position => position,
        bounds: [-1, -1, 1, 1],
        disk: {center: [0, 0], radius: 1}
      }
    ],
    domainDepth: 3,
    tolerance: 1e-8
  }).plan;
  const coordinates: ProjectionCoordinates[] = [
    [0, 0],
    [0.25, 0.25],
    [1, 0],
    [0.99, 0],
    [0.9, 0.9],
    [NaN, 0]
  ];
  const result = await project(device, indexProjectionPlan(plan), coordinates, 'uint32x4');
  expect([...result.validity]).toEqual([1, 1, 0, 0, 0, 0]);
});

it('qualifies a curved orthographic inverse partition against an independent spherical oracle', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    context.skip();
  const fixture = makeVisualizationFixture('ortho', true);
  const provider = projectionEngine.createProjection({from: fixture.from, to: fixture.to});
  // A bounded interior disk, not a claim to cover the entire singular horizon footprint.
  const plan = compileProjectionPartition({
    branches: [
      {
        id: 'orthographic-inverse',
        bounds: fixture.bounds,
        disk: {center: [0, 0], radius: 1_000_000},
        projection: provider
      }
    ],
    domainDepth: 3,
    tolerance: 1e-8
  }).plan;
  const coordinates: ProjectionCoordinates[] = [
    [0, 0],
    [250000, 250000],
    [-500000, 250000],
    [1_000_000, 0],
    [900000, 900000]
  ];
  const result = await project(device, indexProjectionPlan(plan), coordinates, 'uint32x4');
  expect([...result.validity]).toEqual([1, 1, 1, 0, 0]);
  for (let row = 0; row < 3; row++) {
    const expected = fixture.project(coordinates[row]);
    const values = new Float32Array(result.output.buffer, row * 16, 4);
    expect(
      Math.hypot(values[0] + values[1] - expected[0], values[2] + values[3] - expected[1])
    ).toBeLessThan(2e-8);
  }
});

async function project(
  device: Device,
  plan: ProjectionPlan,
  coordinates: ProjectionCoordinates[],
  inputFormat: ProjectionInputFormat,
  legacy = false,
  planWords?: Uint32Array
): Promise<{output: Uint32Array; validity: Uint32Array}> {
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  const makeView = <Format extends GPUVectorFormat>(
    id: string,
    format: Format,
    data: Uint32Array | Float32Array,
    length = coordinates.length
  ): GraphDataView<Format> => {
    const buffer = device.createBuffer({
      byteLength: 256 + data.byteLength,
      usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
    });
    buffer.write(data, 256);
    buffers.push(buffer);
    return graph.createDataView(
      graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer),
      {format, length, byteOffset: 256}
    );
  };
  const raw = new Float64Array(coordinates.flat());
  const limbs = new Float32Array(coordinates.length * 4);
  coordinates.forEach((position, row) =>
    position.forEach((value, axis) => {
      limbs[row * 4 + axis * 2] = Math.fround(value);
      limbs[row * 4 + axis * 2 + 1] = Number.isFinite(value)
        ? Math.fround(value - Math.fround(value))
        : 0;
    })
  );
  const positions = makeView(
    'positions',
    inputFormat,
    inputFormat === 'uint32x4'
      ? new Uint32Array(raw.buffer)
      : inputFormat === 'float32x4'
        ? limbs
        : Float32Array.from(raw)
  );
  const output = makeView('output', 'float32x4', new Float32Array(coordinates.length * 4));
  const validity = makeView('validity', 'uint32', new Uint32Array(coordinates.length));
  const planBuffer = planWords
    ? makeView('plan', 'uint32', planWords, planWords.length)
    : undefined;
  const contributor =
    legacy && positions.format !== 'float32x4'
      ? new GPUProjection({
          positions: positions as GraphDataView<'float32x2' | 'uint32x4'>,
          plan,
          planBuffer,
          output,
          validity,
          precision: 'double-single'
        })
      : new GPUProjectionProgram({
          positions,
          output,
          validity,
          projection: compileProjectionProgram(
            {precision: 'double-single', operations: [{type: 'adaptive', plan}]},
            {inputFormat}
          )
        });
  let compiled: ReturnType<typeof graph.compile> | undefined;
  try {
    contributor.addToGraph(graph);
    compiled = await graph.compileAsync();
    await executeGPUProjectionBenchmark(device, compiled, 'routing-test');
    const outputBytes = await buffers[1].readAsync(256, coordinates.length * 16);
    const validityBytes = await buffers[2].readAsync(256, coordinates.length * 4);
    return {
      output: new Uint32Array(
        outputBytes.buffer,
        outputBytes.byteOffset,
        coordinates.length * 4
      ).slice(),
      validity: new Uint32Array(
        validityBytes.buffer,
        validityBytes.byteOffset,
        coordinates.length
      ).slice()
    };
  } finally {
    compiled?.destroy();
    contributor.destroy();
    for (const buffer of buffers) buffer.destroy();
  }
}
