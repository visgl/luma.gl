// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {parse} from 'yaml';
import {expect, test} from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('device-only helpers do not load engine or graph modules', async () => {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['modules/test-utils/src/device.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    write: false,
    logLevel: 'silent'
  });
  const heavyweightInputs = Object.keys(result.metafile.inputs).filter(path =>
    /^modules\/(engine|graph)\//.test(path)
  );
  expect(heavyweightInputs).toEqual([]);
});

test('CI browser shards cover the matrix range using its actual job count', () => {
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/test.yml', import.meta.url), 'utf8')
  );
  const job = workflow.jobs.browser_coverage;
  const shards = job.strategy.matrix.shard;
  expect(shards).toEqual(Array.from({length: shards.length}, (_, index) => index + 1));
  const command = job.steps.find(
    step => step.name === 'Run headless tests and generate coverage'
  ).run;
  expect(command).toContain('--shard=${{ matrix.shard }}/${{ strategy.job-total }}');
});
