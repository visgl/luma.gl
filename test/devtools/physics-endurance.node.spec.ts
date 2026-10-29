// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';
import {parse} from 'yaml';
import {getBrowserTestGroup, PHYSICS_ENDURANCE_TEST_PATTERNS} from '../utils/browser-test-groups';
import {STACK_QUALIFICATION_SCENARIOS} from '../../modules/graph/test/gpu-physics/rigid-body-stack-scenarios';

test('nightly physics selects every full stack qualification entry', () => {
  expect(getBrowserTestGroup('physics-endurance')).toBe('physics-endurance');
  expect(PHYSICS_ENDURANCE_TEST_PATTERNS).toHaveLength(3);
  for (const filename of PHYSICS_ENDURANCE_TEST_PATTERNS) {
    expect(existsSync(fileURLToPath(new URL(`../../${filename}`, import.meta.url)))).toBe(true);
  }
  expect(Object.values(STACK_QUALIFICATION_SCENARIOS).map(scenario => scenario.name)).toEqual([
    'eight-box stack',
    '10:1 heavy-on-light stack',
    'offset-center-of-mass stack'
  ]);
});

test('nightly physics is scheduled, manually runnable, and fails on test failures', () => {
  const workflow = parse(
    readFileSync(new URL('../../.github/workflows/physics-endurance.yml', import.meta.url), 'utf8')
  );
  expect(workflow.on.schedule).toEqual([{cron: '17 7 * * *'}]);
  expect(workflow.on).toHaveProperty('workflow_dispatch');
  const step = workflow.jobs.endurance.steps.find(
    (entry: {name?: string}) => entry.name === 'Run full endurance matrix'
  );
  expect(step.shell).toBe('bash');
  expect(step.run).toContain('yarn test-physics-endurance');
  const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  expect(manifest.scripts['test-physics-endurance']).toContain(
    'LUMA_TEST_BROWSER_GROUP=physics-endurance'
  );
  expect(manifest.scripts['test-physics-endurance']).toContain('--no-coverage');
});
