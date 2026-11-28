// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {
  GFS_SWEEP,
  runGfsTrajectories,
  type GfsRun
} from '../../../../../examples/experimental/vector-observatory/gfs-run';

it('reports archived-wind accuracy and cost under controlled field and solver variations', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const samples: GfsRun['report'][] = [];
  const warmup = await runGfsTrajectories(device, GFS_SWEEP[0]);
  warmup.destroy();
  for (let repetition = 0; repetition < 2; repetition++) {
    for (const variant of repetition === 0 ? GFS_SWEEP : [...GFS_SWEEP].reverse()) {
      const run = await runGfsTrajectories(device, variant);
      try {
        expect(run.report.termination.active).toBe(4);
        expect(Number.isFinite(run.report.maximumErrorMetres)).toBe(true);
        if (variant.label === 'Baseline') expect(run.report.maximumErrorMetres).toBeLessThan(5);
        samples.push(run.report);
      } finally {
        run.destroy();
      }
    }
  }
  const report = {
    benchmark: 'GFS_ACCURACY_COST',
    device: device.info,
    durationSeconds: 21600,
    samples
  };
  console.info(JSON.stringify(report));
  await context.annotate(JSON.stringify(report), 'gfs-accuracy-cost');
}, 120000);
