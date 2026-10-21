// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadQualificationProfile, makeQualificationReport} from './qualification-report.mjs';

const profile = {
  profile: {revision: 'pinned'},
  features: [
    {
      id: 'shape',
      tranche: 'G2',
      fields: ['shape'],
      requiredChecks: ['import', 'behavior'],
      checks: {
        import: [{file: 'import.spec.ts', testPattern: 'imports shape'}],
        behavior: [{file: 'gpu.spec.ts', testPattern: 'collides shape'}]
      }
    }
  ]
};
const report = (file, status, fullName) => ({
  testResults: [{name: `/repo/${file}`, assertionResults: [{status, fullName}]}]
});

test('import success and skipped GPU work cannot imply physical conformance', () => {
  const result = makeQualificationReport(
    profile,
    [
      report('import.spec.ts', 'passed', 'imports shape'),
      report('gpu.spec.ts', 'pending', 'collides shape')
    ],
    ['G2']
  );
  assert.equal(result.requestedComplete, false);
  assert.equal(result.features[0].checks.import.status, 'passed');
  assert.equal(result.features[0].checks.behavior.status, 'missing');
});
test('failed runs override a passing retry instead of silently hiding failures', () => {
  const result = makeQualificationReport(
    profile,
    [
      report('import.spec.ts', 'passed', 'imports shape'),
      report('gpu.spec.ts', 'passed', 'collides shape'),
      report('gpu.spec.ts', 'failed', 'collides shape')
    ],
    ['G2']
  );
  assert.equal(result.features[0].status, 'failed');
  assert.equal(result.requestedComplete, false);
});
test('complete evidence qualifies only the explicitly requested feature profile', () => {
  const result = makeQualificationReport(
    profile,
    [
      report('import.spec.ts', 'passed', 'imports shape'),
      report('gpu.spec.ts', 'passed', 'collides shape')
    ],
    ['G2']
  );
  assert.equal(result.requestedComplete, true);
  assert.throws(() => makeQualificationReport(profile, [], ['G99']));
});
test('the qualification target pins the same draft revisions as the importer', async () => {
  const target = await loadQualificationProfile();
  const source = await readFile(
    new URL('../../modules/gltf/src/physics/parse-gltf-physics.ts', import.meta.url),
    'utf8'
  );
  for (const field of ['rigidBodies', 'implicitShapes'])
    assert.ok(source.includes(`${field}: '${target.profile[field]}'`));
  assert.equal(new Set(target.features.map(feature => feature.id)).size, target.features.length);
  assert.ok(target.features.every(feature => feature.requiredChecks.length > 0));
});

test('failed benchmark evidence cannot be hidden by a successful retry', () => {
  const benchmarkProfile = {
    profile: {revision: 'pinned'},
    features: [{id: 'discovery', tranche: 'G1', fields: [], requiredChecks: ['performance'], checks: {performance: [{benchmark: {stage: 'discovery', fixture: 'mixed', minimumObjectCount: 10000, hardware: true}}]}}]
  };
  const passed = {stage: 'discovery', fixture: 'mixed', objectCount: 10000, adapter: {fallback: false}, qualified: true};
  for (const reports of [[passed, {...passed, qualified: false}], [{...passed, qualified: false}, passed]]) {
    const result = makeQualificationReport(benchmarkProfile, reports, ['G1']);
    assert.equal(result.features[0].status, 'failed');
    assert.equal(result.requestedComplete, false);
  }
  assert.equal(makeQualificationReport(benchmarkProfile, [{...passed, adapter: {fallback: true}}], ['G1']).features[0].status, 'missing');
});
