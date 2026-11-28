// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Device} from '@luma.gl/core';
import {
  FlowTrajectoryHistory,
  ScientificFlowTracer,
  type ScientificFlowTraceResult
} from '@luma.gl/graph/experimental-simulation';
import {GFS_DURATION, makeGfsField, makeGfsSeeds, measureGfsFrames} from './gfs-data';

/** One controlled variation; all other solver and fixture settings stay fixed. */
export type GfsRunOptions = {
  label: string;
  tolerance: number;
  maximumTimeStep: number;
  stride: number;
  frozen: boolean;
  side?: number;
  captureInterval?: number;
};
/** One-factor-at-a-time accuracy/cost experiments; coarse/frozen cases change the field. */
export const GFS_SWEEP: GfsRunOptions[] = [
  {label: 'Baseline', tolerance: 1, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Tighter tolerance', tolerance: 0.1, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Looser tolerance', tolerance: 10, maximumTimeStep: 300, stride: 1, frozen: false},
  {label: 'Shorter steps', tolerance: 1, maximumTimeStep: 60, stride: 1, frozen: false},
  {label: '2° grid', tolerance: 1, maximumTimeStep: 300, stride: 2, frozen: false},
  {label: '3° grid', tolerance: 1, maximumTimeStep: 300, stride: 3, frozen: false},
  {label: 'Frozen initial wind', tolerance: 1, maximumTimeStep: 300, stride: 1, frozen: true}
];

/** Integrate on the GPU, retaining common horizons; explicit readback occurs once at the end. */
export async function runGfsTrajectories(
  device: Device,
  options: GfsRunOptions,
  onDispatch?: (tracer: ScientificFlowTracer, result: ScientificFlowTraceResult) => void,
  signal?: AbortSignal
) {
  const captureInterval = options.captureInterval ?? 3600;
  const start = performance.now();
  const tracer = new ScientificFlowTracer(device, {
    input: makeGfsField(0, options.stride),
    nextInput: makeGfsField(options.frozen ? 0 : 1, options.stride),
    timeRange: [0, GFS_DURATION],
    positions: makeGfsSeeds(options.side),
    tolerance: options.tolerance,
    maximumTimeStep: options.maximumTimeStep,
    maximumAttempts: 32,
    conservativeMask: true
  });
  const history = new FlowTrajectoryHistory(device, {
    particleCount: tracer.particleCount,
    capacity: GFS_DURATION / captureInterval + 1
  });
  let acceptedSteps = 0;
  let rejectedSteps = 0;
  let dispatches = 0;
  let gpuMilliseconds = 0;
  let timedDispatches = 0;
  let termination: ScientificFlowTraceResult | undefined;
  /** Capture after submission at a completed common horizon. */
  function capture(): void {
    const encoder = device.createCommandEncoder();
    history.record(encoder, tracer.output, tracer.time);
    device.submit(encoder.finish());
  }
  try {
    capture();
    for (let time = captureInterval; time <= GFS_DURATION; time += captureInterval) {
      signal?.throwIfAborted();
      let result = await tracer.advance(captureInterval);
      let continuation = 0;
      while (true) {
        acceptedSteps += result.acceptedSteps;
        rejectedSteps += result.rejectedSteps;
        dispatches++;
        if (result.gpuMilliseconds !== undefined) {
          gpuMilliseconds += result.gpuMilliseconds;
          timedDispatches++;
        }
        onDispatch?.(tracer, result);
        signal?.throwIfAborted();
        if (result.complete) break;
        if (++continuation > 512) throw new Error('GFS integration did not complete');
        result = await tracer.continue();
      }
      termination = result;
      capture();
    }
    const stateBytes = await tracer.diagnostics.readAsync(0, 64);
    const states = new Float32Array(stateBytes.buffer, stateBytes.byteOffset, 16);
    for (let particle = 0; particle < 4; particle++) {
      if (states[particle * 4 + 2] !== 0)
        throw new Error('A qualification release stopped before the final horizon');
    }
    const frames = await history.readFrames();
    return {
      frames,
      report: {
        ...options,
        particleCount: tracer.particleCount,
        maximumErrorMetres: Math.max(...measureGfsFrames(frames)),
        referenceErrorsMetres: measureGfsFrames(frames),
        acceptedSteps,
        rejectedSteps,
        dispatches,
        termination: {
          active: termination?.active,
          outsideDomain: termination?.outsideDomain,
          missingData: termination?.missingData,
          toleranceFailure: termination?.toleranceFailure,
          numericalFailure: termination?.numericalFailure
        },
        gpuMilliseconds: timedDispatches === dispatches ? gpuMilliseconds : null,
        wallMilliseconds: performance.now() - start,
        historyBytes: history.buffer.byteLength
      },
      /** Release the retained resources after graph inspection is no longer needed. */
      destroy(): void {
        history.destroy();
        tracer.destroy();
      }
    };
  } catch (error) {
    history.destroy();
    tracer.destroy();
    throw error;
  }
}
/** Completed run, including explicitly read CPU snapshots and retained inspection resources. */
export type GfsRun = Awaited<ReturnType<typeof runGfsTrajectories>>;
