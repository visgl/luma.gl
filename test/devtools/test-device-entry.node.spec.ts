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
  RENDER_CONFORMANCE_TEST_PATTERNS,
  getBrowserTestGroup,
  getReleaseQualificationExcludes,
  PHYSICS_ENDURANCE_TEST_PATTERNS
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

test.each([
  'pull_request',
  'push',
  'merge_group'
])('CI browser shards cover the matrix range for %s', eventName => {
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/test.yml', import.meta.url), 'utf8')
  );
  const job: {
    strategy: {matrix: {include: string}};
    steps: {name: string; run?: string}[];
  } = workflow.jobs.browser_coverage;
  // Match the supported expression shape so an unrecognized routing change fails closed.
  const expression = job.strategy.matrix.include.match(
    /^\$\{\{\s*fromJSON\(github\.event_name == 'merge_group' &&\s*'([^']+)' \|\|\s*'([^']+)'\)\s*\}\}$/
  );
  expect(expression).not.toBeNull();
  const entries: {group: string; runner: string; shard: string}[] = JSON.parse(
    expression![eventName === 'merge_group' ? 1 : 2]
  );
  const expectedGroups = BROWSER_TEST_GROUPS.filter(
    group => eventName !== 'merge_group' || group !== 'physics'
  );
  expect([...new Set(entries.map(entry => entry.group))]).toEqual(expectedGroups);
  for (const group of expectedGroups) {
    const shards = entries.filter(entry => entry.group === group).map(entry => entry.shard);
    expect(shards.map(shard => shard.split('/').map(Number))).toEqual(
      Array.from({length: shards.length}, (_, index) => [index + 1, shards.length])
    );
  }
  const command = job.steps.find(
    step => step.name === 'Run headless tests and generate coverage'
  )?.run;
  expect(command).toContain('--shard=${{ matrix.shard }}');
  expect(workflow.on.merge_group.types).toEqual(['checks_requested']);
  expect(workflow.jobs.test.needs).toContain('browser_coverage');
});

test('browser group selection fails closed on unknown values', () => {
  expect(getBrowserTestGroup(undefined)).toBe('all');
  expect(getBrowserTestGroup('all')).toBe('all');
  expect(getBrowserTestGroup('release')).toBe('release');
  for (const group of BROWSER_TEST_GROUPS) expect(getBrowserTestGroup(group)).toBe(group);
  expect(() => getBrowserTestGroup('unknown')).toThrow();
});

test('release selection keeps simulation qualification in the endurance suite', () => {
  expect(getReleaseQualificationExcludes('release')).toEqual(PHYSICS_ENDURANCE_TEST_PATTERNS);
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

test('full material conformance remains scheduled and cannot silently omit a case', () => {
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/render-conformance.yml', import.meta.url), 'utf8')
  );
  expect(workflow.on.schedule).toHaveLength(1);
  expect(workflow.on).toHaveProperty('workflow_dispatch');
  expect(workflow.on.pull_request.paths).toEqual(
    expect.arrayContaining([
      'vitest.config.ts',
      'test/utils/**',
      'modules/anari/src/**',
      'modules/anari/test/engine/ray-material*',
      'modules/shaders/src/**',
      'modules/core/src/**'
    ])
  );
  const steps = workflow.jobs.conformance.steps;
  expect(
    steps.find((step: {name: string}) => step.name === 'Require WebGPU and WebGL presentation')
  ).toBeDefined();
  expect(
    steps.find((step: {name: string}) => step.name === 'Require WebGPU and WebGL presentation').run
  ).toBe('xvfb-run -a yarn test-presentation');
  const command = steps.find(
    (step: {name: string}) => step.name === 'Run full material matrix'
  ).run;
  expect(command).toContain('LUMA_TEST_BROWSER_GROUP=render-conformance');
  expect(command).toContain('yarn test-headless');
  const verification = steps.find(
    (step: {name: string}) => step.name === 'Verify the entire matrix executed'
  ).run;
  expect(verification).toContain(`tests="${RENDER_CONFORMANCE_TEST_PATTERNS.length + 3}"`);
  expect(verification).toContain('<skipped');
  for (const path of RENDER_CONFORMANCE_TEST_PATTERNS) {
    const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
    if (
      path.endsWith('ray-secondary-emitter-mis.spec.ts') ||
      path.endsWith('ray-environment-lighting.spec.ts')
    ) {
      expect(source.match(/^it\.each\(/gm), path).toHaveLength(1);
      expect(source.match(/^it\(/gm) ?? [], path).toHaveLength(
        path.endsWith('ray-environment-lighting.spec.ts') ? 1 : 0
      );
    } else {
      expect(source.match(/^it\(/gm), path).toHaveLength(1);
    }
  }
  expect(getBrowserTestGroup('render-conformance')).toBe('render-conformance');
});
