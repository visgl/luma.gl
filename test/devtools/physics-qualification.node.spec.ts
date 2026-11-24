// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {qualifyRigidBodyReport} from '../../scripts/physics/qualify-rigid-body-report.mjs';
import {
  loadQualificationProfile,
  makeQualificationReport
} from '../../scripts/physics/qualification-report.mjs';

function fixture() {
  return {
    stage: 'full-rigid-body-step',
    fixture: 'deep',
    objectCount: 9,
    adapter: {fallback: false},
    softwareGpuRequested: false,
    browserVersion: 'test',
    executionComplete: true,
    finiteState: true,
    diagnostics: {complete: true, steps: 180},
    sampleCount: 60,
    warmupCount: 120,
    maximumPendingSteps: 1,
    settings: {solver: 'parallel', sleepAfter: 0, timeStep: 1 / 120},
    perStepMilliseconds: {completionWithDiagnostics: {p95: 8}, cpuEncode: {p95: 1}},
    graphBufferBytes: 1024,
    finalState: Array.from({length: 9}, (_, index) => ({
      position: [0, 0, index - 0.5],
      orientation: [0, 0, 0, 1],
      velocity: [0, 0, 0],
      angularVelocity: [0, 0, 0],
      sleeping: false
    }))
  };
}

test('physics qualification rejects fast but inaccurate, asleep, incomplete or software runs', () => {
  expect(qualifyRigidBodyReport(fixture()).qualified).toBe(true);
  const changes = [
    (report: ReturnType<typeof fixture>) => {
      report.finalState[1].position[2] = -1;
    },
    (report: ReturnType<typeof fixture>) => {
      report.finalState[1].velocity[0] = 1;
    },
    (report: ReturnType<typeof fixture>) => {
      report.finalState[1].sleeping = true;
    },
    (report: ReturnType<typeof fixture>) => {
      report.adapter.fallback = true;
    },
    (report: ReturnType<typeof fixture>) => {
      report.diagnostics.steps--;
    },
    (report: ReturnType<typeof fixture>) => {
      report.maximumPendingSteps = 2;
    },
    (report: ReturnType<typeof fixture>) => {
      report.perStepMilliseconds.completionWithDiagnostics.p95 = 20;
    },
    (report: ReturnType<typeof fixture>) => {
      report.perStepMilliseconds.cpuEncode.p95 = Number.NaN;
    },
    (report: ReturnType<typeof fixture>) => {
      report.finalState[1].orientation = [];
    },
    (report: ReturnType<typeof fixture>) => {
      report.graphBufferBytes = 200 * 1024 * 1024;
    }
  ];
  for (const change of changes) {
    const report = fixture();
    change(report);
    expect(qualifyRigidBodyReport(report).qualified).toBe(false);
  }
});

test('every G2 G3 and G7 required stage has evidence selectors without implying a pass', async () => {
  const profile = await loadQualificationProfile();
  for (const feature of profile.features.filter(feature =>
    ['G2', 'G3', 'G7'].includes(feature.tranche)
  )) {
    for (const stage of feature.requiredChecks)
      expect(feature.checks[stage]?.length).toBeGreaterThan(0);
  }
  const result = makeQualificationReport(profile, [], ['G2', 'G3', 'G7']);
  expect(result.requestedComplete).toBe(false);
  expect(result.summary.passed).toBe(0);
});

test('impact qualification requires a contact solve in every timed sample', () => {
  const report = {
    ...fixture(),
    fixture: 'impact',
    objectCount: 2,
    replayImpact: true,
    completedSteps: 180,
    measuredContactSteps: 60,
    diagnostics: {complete: true, steps: 1},
    finalState: fixture().finalState.slice(0, 2)
  };
  report.finalState[0].velocity[0] = -1;
  report.finalState[1].velocity[0] = 2;
  expect(qualifyRigidBodyReport(report).qualified).toBe(true);
  expect(qualifyRigidBodyReport({...report, measuredContactSteps: 59}).qualified).toBe(false);
});
