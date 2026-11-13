// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Bounded desktop qualification, not a claim about unmeasured devices or scenes. */
export const RIGID_BODY_QUALIFICATION_BUDGETS = Object.freeze({
  minimumSamples: 60,
  minimumWarmup: 120,
  maximumCompletionP95Milliseconds: 16.667,
  maximumEncodeP95Milliseconds: 4,
  maximumBufferBytes: 128 * 1024 * 1024,
  maximumPositionError: 0.12,
  maximumStackEnergy: 0.02
});

/** Evaluate retained raw measurements; execution success alone never qualifies a run. */
export function qualifyRigidBodyReport(report) {
  const budgets = RIGID_BODY_QUALIFICATION_BUDGETS;
  const reasons = [];
  const require = (condition, message) => {
    if (!condition) reasons.push(message);
  };
  const bounded = (value, maximum) => Number.isFinite(value) && value >= 0 && value <= maximum;
  const counts = {deep: 9, massRatio: 5, impact: 2, continuous: 3};
  require(report.stage === 'full-rigid-body-step' &&
    counts[report.fixture] === report.objectCount, 'recognized workload and object count');
  require(report.adapter?.fallback === false &&
    report.softwareGpuRequested === false &&
    Boolean(report.browserVersion), 'identified hardware browser');
  require(report.executionComplete === true &&
    report.finiteState === true &&
    report.diagnostics?.complete === true, 'complete finite simulation');
  require(report.sampleCount >= budgets.minimumSamples &&
    report.warmupCount >= budgets.minimumWarmup, 'minimum observation window');
  require(report.maximumPendingSteps === 1, 'one outstanding step');
  require(report.settings?.solver === 'parallel' &&
    report.settings?.sleepAfter === 0 &&
    report.settings?.timeStep === 1 / 120, 'declared solver timestep and awake workload');
  require(report.diagnostics?.steps ===
    report.sampleCount + report.warmupCount, 'all steps completed');
  require(bounded(
    report.perStepMilliseconds?.completionWithDiagnostics?.p95,
    budgets.maximumCompletionP95Milliseconds
  ), 'completion latency budget');
  require(bounded(
    report.perStepMilliseconds?.cpuEncode?.p95,
    budgets.maximumEncodeP95Milliseconds
  ), 'CPU encoding budget');
  require(bounded(report.graphBufferBytes, budgets.maximumBufferBytes), 'logical buffer budget');
  const states = report.finalState;
  require(Array.isArray(states) &&
    states.length === counts[report.fixture], 'complete state evidence');
  let maximumPositionError = null;
  let kineticEnergy = null;
  const validStates =
    Array.isArray(states) &&
    states.length === counts[report.fixture] &&
    states.every(
      state =>
        state &&
        ['position', 'orientation', 'velocity', 'angularVelocity'].every(
          key =>
            Array.isArray(state[key]) &&
            state[key].length === (key === 'orientation' ? 4 : 3) &&
            state[key].every(Number.isFinite)
        )
    );
  require(validStates, 'finite state components');
  if (validStates) {
    if (report.fixture === 'deep' || report.fixture === 'massRatio') {
      maximumPositionError = 0;
      kineticEnergy = 0;
      for (let index = 1; index < states.length; index++) {
        const state = states[index];
        const mass = report.fixture === 'massRatio' && index === states.length - 1 ? 10 : 1;
        maximumPositionError = Math.max(
          maximumPositionError,
          Math.hypot(state.position[0], state.position[1]),
          Math.abs(state.position[2] - (index - 0.5))
        );
        kineticEnergy +=
          (mass / 2) *
          (state.velocity.reduce((sum, value) => sum + value ** 2, 0) +
            state.angularVelocity.reduce((sum, value) => sum + value ** 2, 0) / 6);
        require(state.sleeping === false, 'stack remains awake during measurement');
      }
      require(bounded(
        maximumPositionError,
        budgets.maximumPositionError
      ), 'stack displacement budget');
      require(bounded(kineticEnergy, budgets.maximumStackEnergy), 'stack residual energy budget');
    } else if (report.fixture === 'impact') {
      require(Math.abs(states[0].velocity[0] + 1) < 0.02 &&
        Math.abs(states[1].velocity[0] - 2) < 0.02, 'analytic unequal-mass elastic response');
    } else if (report.fixture === 'continuous') {
      const length = 9.54;
      const travel = 1.77 + (180 * (report.sampleCount + report.warmupCount)) / 120;
      const phase = travel % (2 * length);
      const expectedPosition = -4.77 + (phase <= length ? phase : 2 * length - phase);
      maximumPositionError = Math.abs(states[0].position[0] - expectedPosition);
      require(bounded(maximumPositionError, 0.03), 'analytic repeated CCD rebound position');
      require(Math.abs(states[0].velocity[0] - (phase < length ? 180 : -180)) <
        0.02, 'analytic CCD rebound velocity');
    }
  }
  return {
    ...report,
    stage: 'qualified-rigid-body-step',
    budgets,
    quality: {maximumPositionError, kineticEnergy},
    qualified: reasons.length === 0,
    failures: reasons
  };
}
