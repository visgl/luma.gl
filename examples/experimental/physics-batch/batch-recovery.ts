// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUPhysicsEnsemble} from '@luma.gl/graph/gpu-physics';
import type {GPUGraphDiagnostics} from '../../gpu-graph-diagnostics';

/** Result of one attempted step for one world in the stress scenario. */
export type RecoveryStep = 'accepted' | 'rejected' | 'held' | 'recovered';

/** Progress reported for a submitted and sampled fused step. */
type RecoveryProgress = {
  /** One-based simulated step. */
  step: number;
  /** Step at which the selected instance overflowed, if it has occurred. */
  failedAt: number | undefined;
  /** Number of steps accepted by every healthy instance during the quarantine. */
  healthyStepsWhileHeld: number;
  /** Most recent step outcomes, in instance order. */
  outcomes: readonly RecoveryStep[];
};

/** Run a real contact-cache overflow and reset with no graph rebuild. */
export async function runEnsembleRecoveryStress(
  device: Device,
  worlds: number,
  frames: number,
  progress: (frame: RecoveryProgress) => void,
  diagnostics: GPUGraphDiagnostics
) {
  if (
    !Number.isSafeInteger(worlds) ||
    worlds < 2 ||
    worlds > 4096 ||
    !Number.isSafeInteger(frames) ||
    frames < 20 ||
    frames > 2000
  )
    throw new Error('Recovery requires 2–4,096 worlds and 20–2,000 frames');

  const subject = 1;
  const resetAt = Math.floor(frames / 2);
  const ensemble = await GPUPhysicsEnsemble.create(device, {
    instances: worlds,
    maximumPairs: Math.max(64, 2 ** Math.ceil(Math.log2(worlds * 16))),
    maximumPairsPerInstance: 2,
    maximumResidentBytes: 512 * 1024 * 1024,
    template: {
      gravity: [0, 0, 0],
      sleepAfter: 0,
      iterations: 8,
      bodies: [-2, -1.5, 3, 5].map(east => ({
        position: [east, 0, 0],
        velocity: [0, 1, 0],
        shape: {type: 'sphere', radius: 0.35},
        restitution: 0
      }))
    }
  });

  let failedAt: number | undefined;
  let healthyStepsWhileHeld = 0;
  let complete = true;
  const timeline: RecoveryStep[][] = [];
  try {
    const initial = ensemble.getStats().residentBytes;
    const graph = ensemble.inspect().graph;
    for (let step = 1; step <= frames; step++) {
      if (step === 3) {
        // Cause more candidate pairs than this instance's cache can hold.
        ensemble.world.setColliderShapes(
          [0, 1, 2, 3].map(collider => ({
            collider: ensemble.getColliderIndex(subject, collider),
            shape: {type: 'sphere', radius: 4}
          }))
        );
      }
      if (step === resetAt) await ensemble.reset(subject);
      const encoder = device.createCommandEncoder();
      ensemble.encode(encoder);
      device.submit(encoder.finish());
      const sampled = await ensemble.readStatus();
      const subjectStatus = sampled.instances[subject];
      if (subjectStatus.failure && failedAt === undefined) failedAt = step;
      const siblingsAdvanced = sampled.instances.every(
        (instance, index) =>
          index === subject ||
          (!instance.failure && !instance.sharedFailure && instance.acceptedSteps === step)
      );
      if (siblingsAdvanced && subjectStatus.failure && !subjectStatus.active)
        healthyStepsWhileHeld++;
      complete &&= siblingsAdvanced && !subjectStatus.sharedFailure;
      const outcomes = sampled.instances.map<RecoveryStep>((instance, index) =>
        instance.failure
          ? instance.active
            ? 'rejected'
            : 'held'
          : index === subject && step >= resetAt
            ? 'recovered'
            : 'accepted'
      );
      timeline.push(outcomes);
      progress({step, failedAt, healthyStepsWhileHeld, outcomes});
    }
    const status = await ensemble.readStatus();
    const recoveredSteps = status.instances[subject].acceptedSteps;
    const {encoding} = ensemble.inspect();
    if (encoding) diagnostics.record(graph, encoding);
    const fixedAllocation =
      ensemble.getStats().residentBytes === initial && ensemble.inspect().graph === graph;
    complete &&=
      failedAt === 3 &&
      healthyStepsWhileHeld === resetAt - 4 &&
      recoveredSteps === frames - resetAt + 1 &&
      fixedAllocation &&
      (await ensemble.world.readSimulationDiagnostics()).complete;
    return {
      complete,
      worlds,
      subject,
      failedAt,
      resetAt,
      healthyStepsWhileHeld,
      recoveredSteps,
      fixedAllocation,
      timeline
    };
  } finally {
    ensemble.destroy();
  }
}
