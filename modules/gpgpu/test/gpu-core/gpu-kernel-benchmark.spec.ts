// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation, Kernel} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  summarizeGPUWorkgroupScanBenchmarkSamples as summarizeSamples
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

const DISPATCH_COUNT = 64;
const WARMUP_ITERATIONS = 3;
const MEASURED_ITERATIONS = 9;
const source = /* WGSL */ `
@group(0) @binding(0) var<storage, read_write> values: array<u32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  values[invocation.x] += 1u;
}`;
type ExecutionPath = 'computation' | 'kernel';

// Opt-in evidence, with no timing threshold: shared CI machines cannot establish a speedup.
test('Kernel baseline compares warm compilation and dispatch against Computation', async ({
  annotate,
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) skip('WebGPU is unavailable');
  const timestampQueries = device.features.has('timestamp-query');
  const paths = (['computation', 'kernel'] as const).map(kind => {
    const output = device.createBuffer({
      data: new Uint32Array(64),
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    return {
      kind,
      output,
      compiled: makeGraph(device, kind, output).compile(),
      compileSamples: [] as number[],
      encodeSamples: [] as number[],
      gpuSamples: [] as number[]
    };
  });
  try {
    for (let iteration = 0; iteration < WARMUP_ITERATIONS + MEASURED_ITERATIONS; iteration++) {
      // Alternate order to avoid consistently giving either path the first sample.
      for (const path of iteration % 2 ? [...paths].reverse() : paths) {
        // The retained executable holds a pipeline-cache reference for each measured clone.
        const graph = makeGraph(device, path.kind, path.output);
        const compileStart = performance.now();
        const compiled = graph.compile();
        const compileTime = performance.now() - compileStart;
        compiled.destroy();
        const querySet = timestampQueries
          ? device.createQuerySet({type: 'timestamp', count: 2})
          : undefined;
        try {
          const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
          const encoding = path.compiled.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const timing = await encoding.readTimings();
          const bytes = await path.output.readAsync();
          const values = new Uint32Array(bytes.buffer, bytes.byteOffset, 64);
          expect(Array.from(values)).toEqual(Array(64).fill((iteration + 1) * DISPATCH_COUNT));
          if (iteration >= WARMUP_ITERATIONS) {
            path.compileSamples.push(compileTime / DISPATCH_COUNT);
            path.encodeSamples.push(timing.cpuEncodeTimeMilliseconds / DISPATCH_COUNT);
            if (timing.gpuTimeMilliseconds !== undefined) {
              path.gpuSamples.push(timing.gpuTimeMilliseconds / DISPATCH_COUNT);
            }
          }
        } finally {
          querySet?.destroy();
        }
      }
    }
    await annotate(
      JSON.stringify({
        benchmark: 'GPU_KERNEL_BASELINE',
        device: device.info,
        dispatchCount: DISPATCH_COUNT,
        warmupIterations: WARMUP_ITERATIONS,
        measuredIterations: MEASURED_ITERATIONS,
        timestampQueries,
        paths: paths.map(path => ({
          kind: path.kind,
          warmCompileMillisecondsPerNode: summarizeSamples(path.compileSamples),
          cpuEncodeMillisecondsPerDispatch: summarizeSamples(path.encodeSamples),
          ...(path.gpuSamples.length
            ? {
                gpuMillisecondsPerDispatch: summarizeSamples(path.gpuSamples)
              }
            : {})
        }))
      }),
      'benchmark'
    );
  } finally {
    for (const path of paths) {
      path.compiled.destroy();
      path.output.destroy();
    }
  }
}, 60_000);

function makeGraph(device: Device, kind: ExecutionPath, output: Buffer): GPUCommandGraph {
  const graph = new GPUCommandGraph(device);
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: output.byteLength, usage: Buffer.STORAGE | Buffer.COPY_SRC},
    output
  );
  for (let index = 0; index < DISPATCH_COUNT; index++) {
    graph.addComputePass({
      id: `increment-${index}`,
      resources: [{buffer: outputHandle, usage: 'storage-read-write'}],
      compile: ({device: compileDevice}) => {
        const props = {
          source,
          shaderLayout: {
            bindings: [{name: 'values', type: 'storage' as const, group: 0, location: 0}]
          }
        };
        if (kind === 'kernel') {
          const kernel = new Kernel(compileDevice, props);
          return {
            encode: ({computePass, getBuffer}) =>
              kernel.dispatch(computePass, {
                bindings: {values: getBuffer(outputHandle)},
                x: 1
              }),
            destroy: () => kernel.destroy()
          };
        }
        const computation = new Computation(compileDevice, props);
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({values: getBuffer(outputHandle)});
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }
  return graph;
}
