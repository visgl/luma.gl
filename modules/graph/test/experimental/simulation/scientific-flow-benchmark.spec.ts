// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {ScientificFlowGraph, ScientificFlowTracer} from '@luma.gl/graph/experimental/simulation';
import {getTestDevice} from '@luma.gl/core/test-utils';

// Opt-in comparison at matched trajectory accuracy, not a hardware-independent speed claim.
it('scientific advection compares RK4 and RK45 at matched rotation accuracy', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const particleCount = 65536;
  const input = {
    dimensions: ['y', 'x'] as const,
    shape: [2, 2] as const,
    eastward: new Float32Array([2, 2, -2, -2]),
    northward: new Float32Array([-2, 2, -2, 2]),
    valid: new Uint8Array(4).fill(1)
  };
  const positions = new Float32Array(particleCount * 2);
  const initial = new Float32Array(particleCount * 4);
  for (let index = 0; index < particleCount; index++) {
    positions.set([0.75, 0.5], index * 2);
    initial.set([0.75, 0.5, 0, 1], index * 4);
  }
  const reports: {
    integrator: string;
    error: number;
    acceptedSteps: number;
    rejectedSteps: number;
    gpuMilliseconds?: number;
  }[] = [];
  for (let iteration = 0; iteration < 4; iteration++) {
    // Alternate order and discard the first pair as warmup.
    for (const integrator of iteration % 2 ? ['rk45', 'rk4'] : ['rk4', 'rk45']) {
      const graph = new ScientificFlowGraph(device, {
        input,
        bounds: [0, 0, 1, 1],
        particleCount,
        lifetime: 10
      });
      const tracer = new ScientificFlowTracer(device, {
        input,
        bounds: [0, 0, 1, 1],
        positions,
        tolerance: 1e-6,
        maximumTimeStep: 1,
        maximumAttempts: 64
      });
      const query = device.features.has('timestamp-query')
        ? device.createQuerySet({type: 'timestamp', count: 2})
        : undefined;
      try {
        let gpuMilliseconds: number | undefined;
        let acceptedSteps = 60 * particleCount;
        let rejectedSteps = 0;
        if (integrator === 'rk4') {
          graph.output.write(initial);
          const encoder = device.createCommandEncoder();
          const pass = encoder.beginComputePass(
            query ? {timestampQuerySet: query, beginTimestampIndex: 0, endTimestampIndex: 1} : {}
          );
          graph.simulation.encode(pass, 1 / 30, 60);
          pass.end();
          device.submit(encoder.finish());
          if (query) gpuMilliseconds = await query.readTimestampDuration(0, 1);
        } else {
          const result = await tracer.advance(2);
          expect(result.complete).toBe(true);
          expect(result.active).toBe(particleCount);
          gpuMilliseconds = result.gpuMilliseconds;
          acceptedSteps = result.acceptedSteps;
          rejectedSteps = result.rejectedSteps;
        }
        const bytes = await (integrator === 'rk4' ? graph.output : tracer.output).readAsync();
        const state = new Float32Array(bytes.buffer, bytes.byteOffset, 4);
        const error = Math.hypot(
          state[0] - (0.5 + 0.25 * Math.cos(8)),
          state[1] - (0.5 + 0.25 * Math.sin(8))
        );
        expect(error).toBeLessThan(1e-5);
        if (iteration > 0)
          reports.push({
            integrator,
            error,
            acceptedSteps,
            rejectedSteps,
            ...(gpuMilliseconds === undefined ? {} : {gpuMilliseconds})
          });
      } finally {
        graph.destroy();
        tracer.destroy();
        query?.destroy();
      }
    }
  }
  const report = {
    benchmark: 'SCIENTIFIC_FLOW_ACCURACY_COST',
    device: device.info,
    particleCount,
    durationSeconds: 2,
    maximumPositionError: 1e-5,
    timestampQueries: device.features.has('timestamp-query'),
    samples: reports
  };
  console.info(JSON.stringify(report));
  await context.annotate(JSON.stringify(report), 'scientific-flow-benchmark');
});
