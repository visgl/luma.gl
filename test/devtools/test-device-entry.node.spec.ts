// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {parse} from 'yaml';
import {expect, test} from 'vitest';
import {BROWSER_TEST_GROUPS, getBrowserTestGroup} from '../utils/browser-test-groups';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('device-only helpers do not load engine, graph, or eager legacy devices', async () => {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['modules/core/src/test-utils/index.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    metafile: true,
    write: false,
    logLevel: 'silent'
  });
  const heavyweightInputs = Object.keys(result.metafile.inputs).filter(
    path =>
      /^modules\/(engine|graph)\//.test(path) ||
      path.startsWith('modules/core/src/test-utils/deprecated/')
  );
  expect(heavyweightInputs).toEqual([]);
});

test('CI browser shards cover the matrix range using its actual job count', () => {
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/test.yml', import.meta.url), 'utf8')
  );
  const job: {
    strategy: {matrix: {include: {group: string; runner: string; shard: string}[]}};
    steps: {name: string; run?: string}[];
  } = workflow.jobs.browser_coverage;
  const entries = job.strategy.matrix.include;
  expect([...new Set(entries.map(entry => entry.group))]).toEqual([...BROWSER_TEST_GROUPS]);
  for (const group of BROWSER_TEST_GROUPS) {
    const shards = entries.filter(entry => entry.group === group).map(entry => entry.shard);
    expect(shards.map(shard => shard.split('/').map(Number))).toEqual(
      Array.from({length: shards.length}, (_, index) => [index + 1, shards.length])
    );
  }
  const command = job.steps.find(
    step => step.name === 'Run headless tests and generate coverage'
  )?.run;
  expect(command).toContain('--shard=${{ matrix.shard }}');
});

test('browser group selection fails closed on unknown values', () => {
  expect(getBrowserTestGroup(undefined)).toBe('all');
  expect(getBrowserTestGroup('all')).toBe('all');
  for (const group of BROWSER_TEST_GROUPS) expect(getBrowserTestGroup(group)).toBe(group);
  expect(() => getBrowserTestGroup('unknown')).toThrow();
});
