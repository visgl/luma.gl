// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {
  ScientificFlowGraph,
  ScientificFlowTracer,
  SphericalFlowTracer
} from '@luma.gl/graph/experimental-simulation';
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

it('scientific C-grid batching reports sparse and dense accuracy versus synchronization cost', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const particleCount = 4096;
  const input = {
    layout: 'c-grid' as const,
    shape: [1, 1] as const,
    eastward: new Float32Array([0.1, 0.1]),
    northward: new Float32Array([0, 0]),
    eastwardValid: new Uint8Array([1, 1]),
    northwardValid: new Uint8Array([1, 1])
  };
  const samples: Record<string, number | string | undefined>[] = [];
  for (const activeFraction of [1, 1 / 64]) {
    const activeCount = particleCount * activeFraction;
    const positions = new Float32Array(particleCount * 2);
    for (let index = 0; index < particleCount; index++)
      positions.set([index < activeCount ? 0.25 : -1, 0.5], index * 2);
    for (let iteration = 0; iteration < 3; iteration++) {
      for (const dispatchesPerReadback of iteration % 2 ? [16, 4, 1] : [1, 4, 16]) {
        const tracer = new ScientificFlowTracer(device, {
          input,
          bounds: [0, 0, 1, 1],
          positions,
          tolerance: 1e-5,
          maximumTimeStep: 0.01,
          maximumAttempts: 1,
          dispatchesPerReadback
        });
        try {
          const started = performance.now();
          let result = await tracer.advance(0.64);
          let calls = 1;
          let acceptedSteps = result.acceptedSteps;
          let gpuMilliseconds = result.gpuMilliseconds;
          while (!result.complete) {
            result = await tracer.continue();
            calls++;
            acceptedSteps += result.acceptedSteps;
            if (gpuMilliseconds !== undefined && result.gpuMilliseconds !== undefined)
              gpuMilliseconds += result.gpuMilliseconds;
          }
          const wallMilliseconds = performance.now() - started;
          const bytes = await tracer.output.readAsync();
          const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
          const error = Math.abs(values[0] - 0.314);
          expect(error).toBeLessThan(1e-5);
          expect(result.active).toBe(activeCount);
          expect(result.outsideDomain).toBe(particleCount - activeCount);
          if (iteration > 0)
            samples.push({
              activeFraction,
              dispatchesPerReadback,
              calls,
              dispatches: result.dispatchIndex,
              counterReadbackBytes: calls * result.counterReadbackBytes,
              acceptedSteps,
              error,
              gpuMilliseconds,
              wallMilliseconds,
              particleStateBytes: particleCount * 48,
              batchUniformAndCounterBytes: dispatchesPerReadback * 100
            });
        } finally {
          tracer.destroy();
        }
      }
    }
  }
  const report = {
    benchmark: 'SCIENTIFIC_CGRID_BATCH_COST',
    device: device.info,
    particleCount,
    durationSeconds: 0.64,
    gridCells: [1, 1],
    tolerance: 1e-5,
    maximumTimeStep: 0.01,
    wallTimeIncludes:
      'encoding, submission, counter synchronization and optional timing readback; excludes allocation, final particle readback and rendering',
    memoryExcludes: 'shared field, kernel and timing snapshots',
    samples
  };
  console.info(JSON.stringify(report));
  await context.annotate(JSON.stringify(report), 'scientific-cgrid-batch-benchmark');
});

it('persistent scheduling reports matched-error sparse/dense end-to-end costs', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const particleCount = 65536;
  const samples: Record<string, number | string | undefined>[] = [];
  for (const activeFraction of [1, 1 / 64]) {
    const activeCount = particleCount * activeFraction;
    const positions = new Float32Array(particleCount * 2);
    for (let index = 0; index < particleCount; index++)
      positions.set([index < activeCount ? 0.25 : -1, 0.5], index * 2);
    for (let iteration = 0; iteration < 6; iteration++) {
      for (const scheduling of (iteration % 2
        ? ['persistent', 'active', 'dense']
        : ['dense', 'active', 'persistent']) as ('dense' | 'active')[]) {
        for (const dispatchesPerReadback of iteration % 2 ? [16, 1] : [1, 16]) {
          const tracer = new ScientificFlowTracer(device, {
            input: {
              layout: 'c-grid',
              shape: [1, 1],
              eastward: new Float32Array([0.1, 0.1]),
              northward: new Float32Array(2),
              eastwardValid: new Uint8Array([1, 1]),
              northwardValid: new Uint8Array([1, 1])
            },
            bounds: [0, 0, 1, 1],
            positions,
            tolerance: 1e-5,
            maximumTimeStep: 0.01,
            maximumAttempts: 1,
            scheduling,
            dispatchesPerReadback
          });
          try {
            const started = performance.now();
            let result = await tracer.advance(0.64);
            let calls = 1;
            let acceptedSteps = result.acceptedSteps;
            let rejectedSteps = result.rejectedSteps;
            let scheduledParticles = result.scheduledParticles;
            let integrationWorkgroups = result.integrationWorkgroups;
            let gpuMilliseconds = result.gpuMilliseconds;
            while (!result.complete && calls < 100) {
              result = await tracer.continue();
              calls++;
              acceptedSteps += result.acceptedSteps;
              rejectedSteps += result.rejectedSteps;
              scheduledParticles += result.scheduledParticles;
              integrationWorkgroups += result.integrationWorkgroups;
              if (gpuMilliseconds !== undefined && result.gpuMilliseconds !== undefined)
                gpuMilliseconds += result.gpuMilliseconds;
            }
            const wallMilliseconds = performance.now() - started;
            expect(result.complete).toBe(true);
            expect(result.active).toBe(activeCount);
            expect(result.outsideDomain).toBe(particleCount - activeCount);
            const bytes = await tracer.output.readAsync();
            const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
            let maximumError = 0;
            for (let index = 0; index < activeCount; index++)
              maximumError = Math.max(maximumError, Math.abs(values[index * 4] - 0.314));
            expect(maximumError).toBeLessThan(1e-5);
            if (iteration > 0)
              samples.push({
                activeFraction,
                scheduling,
                dispatchesPerReadback,
                calls,
                dispatches: result.dispatchIndex,
                acceptedSteps,
                rejectedSteps,
                maximumError,
                scheduledParticles,
                integrationWorkgroups,
                gpuMilliseconds,
                wallMilliseconds,
                counterReadbackBytes: calls * result.counterReadbackBytes,
                particleStateBytes: particleCount * 48,
                queueAndCommandBytes:
                  scheduling === 'persistent'
                    ? 2 * (particleCount + 1) * 4 + 36
                    : scheduling === 'active'
                      ? (particleCount + 1) * 4 + 24
                      : 0,
                batchUniformAndCounterBytes:
                  dispatchesPerReadback * (scheduling !== 'dense' ? 108 : 100)
              });
          } finally {
            tracer.destroy();
          }
        }
      }
    }
  }
  const report = {
    benchmark: 'SCIENTIFIC_SURVIVOR_SCHEDULING_COST',
    device: device.info,
    particleCount,
    durationSeconds: 0.64,
    gridCells: [1, 1],
    tolerance: 1e-5,
    maximumTimeStep: 0.01,
    wallTimeIncludes:
      'queue reset, initial or repeated full-slot scans, survivor maintenance, previous-state copies, integration, encoding, submission, counter and optional timing readback; excludes allocation, final particle readback and rendering',
    gpuTimeIncludes:
      'compaction and integration compute passes; excludes reset copies, readback and rendering',
    memoryExcludes:
      'shared fields, kernels, fixed 72-byte statistics/reset storage and timing snapshots',
    samples
  };
  console.info(JSON.stringify(report));
  await context.annotate(JSON.stringify(report), 'scientific-survivor-scheduling-benchmark');
});

it('adaptive spherical tracing separates local tolerance from measured trajectory error and cost', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const particleCount = 4096;
  const positions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index++) positions[index * 3] = 1;
  const velocity = new Float32Array(27);
  for (let index = 0; index < 9; index++) velocity[index * 3 + 2] = 1;
  const samples: Record<string, number | undefined>[] = [];
  for (let iteration = 0; iteration < 4; iteration++) {
    for (const tolerance of iteration % 2 ? [1e-7, 1e-5, 1e-3] : [1e-3, 1e-5, 1e-7]) {
      const tracer = new SphericalFlowTracer(device, {
        input: {shape: [3, 3], velocity},
        positions,
        radius: 1,
        tolerance,
        maximumTimeStep: 1,
        minimumTimeStep: 1e-5,
        maximumAttempts: 4
      });
      try {
        const started = performance.now();
        let result = await tracer.advance(2);
        let calls = 1;
        let acceptedSteps = result.acceptedSteps;
        let rejectedSteps = result.rejectedSteps;
        let gpuMilliseconds = result.gpuMilliseconds;
        while (!result.complete && calls < 100) {
          result = await tracer.continue();
          calls++;
          acceptedSteps += result.acceptedSteps;
          rejectedSteps += result.rejectedSteps;
          if (gpuMilliseconds !== undefined && result.gpuMilliseconds !== undefined)
            gpuMilliseconds += result.gpuMilliseconds;
        }
        const wallMilliseconds = performance.now() - started;
        expect(result.complete).toBe(true);
        expect(result.active).toBe(particleCount);
        const bytes = await tracer.output.readAsync();
        const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
        let maximumError = 0;
        for (let index = 0; index < particleCount; index++)
          maximumError = Math.max(
            maximumError,
            Math.hypot(
              values[index * 4] - 1 / Math.cosh(2),
              values[index * 4 + 1],
              values[index * 4 + 2] - Math.tanh(2)
            )
          );
        expect(maximumError).toBeLessThan(tolerance === 1e-3 ? 0.001 : 1e-5);
        if (iteration > 0)
          samples.push({
            tolerance,
            calls,
            acceptedSteps,
            rejectedSteps,
            maximumError,
            gpuMilliseconds,
            wallMilliseconds,
            counterReadbackBytes: calls * 36,
            particleStateBytes: particleCount * 48
          });
      } finally {
        tracer.destroy();
      }
    }
  }
  const report = {
    benchmark: 'SPHERICAL_RK45_ACCURACY_COST',
    device: device.info,
    particleCount,
    durationSeconds: 2,
    radius: 1,
    grid: [3, 3],
    field: 'constant world velocity (0,0,1), projected into tangent plane',
    reference: 'x=sech(t), y=0, z=tanh(t); no spatial interpolation error',
    wallTimeIncludes:
      'encoding, submission, counters and optional timing readback; excludes allocation, final particle readback and rendering',
    samples
  };
  console.info(JSON.stringify(report));
  await context.annotate(JSON.stringify(report), 'spherical-rk45-benchmark');
});
