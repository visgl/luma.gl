// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {parse} from 'yaml';
import {expect, test} from 'vitest';
import {
  BROWSER_TEST_GROUPS,
  getBrowserTestGroup,
  getReleaseQualificationExcludes,
  PHYSICS_QUALIFICATION_TEST_PATTERNS
} from '../utils/browser-test-groups';

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
  expect(getBrowserTestGroup('release')).toBe('release');
  for (const group of BROWSER_TEST_GROUPS) expect(getBrowserTestGroup(group)).toBe(group);
  expect(() => getBrowserTestGroup('unknown')).toThrow();
});

test('release selection keeps simulation qualification in the ordinary physics suites', () => {
  expect(getReleaseQualificationExcludes('release')).toEqual(PHYSICS_QUALIFICATION_TEST_PATTERNS);
  expect(getReleaseQualificationExcludes('release')).toContain(
    'modules/graph/test/gpu-physics/domino-spiral.spec.ts'
  );
  for (const group of ['all', ...BROWSER_TEST_GROUPS] as const) {
    expect(getReleaseQualificationExcludes(group)).toEqual([]);
  }
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/release.yml', import.meta.url), 'utf8')
  );
  const step = workflow.jobs.browser_tests.steps.find(
    (entry: {name?: string}) => entry.name === 'Run headless tests'
  );
  expect(step.env.LUMA_TEST_BROWSER_GROUP).toBe('release');
  expect(step.run).toContain('yarn test-headless --shard=${{ matrix.shard }}/6');
  expect(workflow.jobs.release.needs).toEqual(
    expect.arrayContaining(['node_tests', 'browser_tests'])
  );
});

test('bare test-utils imports preserve adapter registration', async () => {
  const result = await build({
    absWorkingDir: root,
    stdin: {contents: "import '@luma.gl/core/test-utils';", resolveDir: root},
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    logLevel: 'silent'
  });
  expect(result.outputFiles[0].text).toContain('registerAdapters');
  expect(result.warnings.filter(warning => warning.id === 'ignored-bare-import')).toEqual([]);
});
