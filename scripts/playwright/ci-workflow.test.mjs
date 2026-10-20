// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {parse} from 'yaml';

const workflow = parse(await readFile(new URL('../../.github/workflows/test.yml', import.meta.url), 'utf8'));

test('presentation remains a required gate without blocking coverage collection', () => {
  assert(workflow.jobs.test.needs.includes('presentation'));
  assert.equal(workflow.jobs.browser_coverage.needs, undefined);
  assert(!workflow.jobs.browser_coverage.steps.some(step => step.run?.includes('test-presentation')));
  assert(workflow.jobs.presentation.steps.some(step => step.run?.includes('test-presentation')));
  const gate = workflow.jobs.test.steps.find(step => step.name === 'Verify all coverage and visual jobs passed');
  assert.equal(gate.env.PRESENTATION_RESULT, '${{ needs.presentation.result }}');
  assert(gate.run.includes('"$PRESENTATION_RESULT" != "success"'));
});

test('package consumers restore one authoritative build from this workflow run', () => {
  assert(workflow.jobs.test.needs.includes('build_packages'));
  const gate = workflow.jobs.test.steps.find(step => step.name === 'Verify all coverage and visual jobs passed');
  assert.equal(gate.env.PACKAGE_BUILD_RESULT, '${{ needs.build_packages.result }}');
  assert(gate.run.includes('"$PACKAGE_BUILD_RESULT" != "success"'));
  const builds = Object.values(workflow.jobs).flatMap(job => job.steps || [])
    .filter(step => /\byarn build\b/.test(step.run || ''));
  assert.equal(builds.length, 1);
  const upload = workflow.jobs.build_packages.steps.find(step => step.name === 'Upload package outputs');
  assert(upload.with['retention-days'] >= 35, 'artifacts must survive the workflow rerun window');
  for (const name of ['examples', 'lighting_examples']) {
    const job = workflow.jobs[name];
    assert.equal(job.needs, 'build_packages');
    const download = job.steps.find(step => step.name === 'Download package outputs');
    const restore = job.steps.find(step => step.name === 'Restore package outputs');
    assert.equal(download.with.name, 'luma-package-build');
    assert(!download.with['run-id'], 'download must use the current run, not a cached branch build');
    assert(restore.run.includes('tar -xf'));
  }
});
