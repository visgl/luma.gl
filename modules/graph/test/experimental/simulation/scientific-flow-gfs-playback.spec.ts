// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {
  GFS_SWEEP,
  runGfsTrajectories
} from '../../../../../examples/experimental/vector-observatory/gfs-run';
import {makeGfsCsv} from '../../../../../examples/experimental/vector-observatory/gfs-export';

it('retains the visual release at bounded common horizons with qualified reference identities', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const run = await runGfsTrajectories(device, {...GFS_SWEEP[0], side: 32, captureInterval: 300});
  try {
    expect(run.frames.length).toBe(73);
    expect(run.frames[0].time).toBe(0);
    expect(run.frames.at(-1)!.time).toBe(21600);
    expect(run.report.particleCount).toBe(1028);
    expect(run.report.maximumErrorMetres).toBeLessThan(5);
    expect(run.report.dispatches).toBeLessThan(200);
    expect(run.report.historyBytes).toBe(73 * 1028 * 16);
    expect((await makeGfsCsv(run.frames)).trim().split('\n').length).toBe(293);
  } finally {
    run.destroy();
  }
});

it('cancels a requested release without leaving an inspectable run alive', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const controller = new AbortController();
  controller.abort();
  await expect(
    runGfsTrajectories(device, GFS_SWEEP[0], undefined, controller.signal)
  ).rejects.toMatchObject({name: 'AbortError'});
});
