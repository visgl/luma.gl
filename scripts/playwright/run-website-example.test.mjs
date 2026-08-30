// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {writeFailureArtifacts} from './run-website-example.mjs';

test('writeFailureArtifacts retains the original capture failure and diagnostics', async context => {
  const artifactDirectory = await mkdtemp(path.join(os.tmpdir(), 'luma-playwright-failure-'));
  context.after(() => rm(artifactDirectory, {recursive: true, force: true}));
  const error = new Error('reference frame timed out');
  const diagnostics = {consoleMessages: [], pageErrors: [], requestFailures: []};
  const pageState = {
    gltfReferenceError: null,
    gltfReferenceProgress: {stage: 'drawing-model:test-model', updatedAt: '2026-08-20T00:00:00.000Z'}
  };
  const page = {evaluate: async () => pageState};
  const targetUrl = 'http://127.0.0.1:3000/example';

  await writeFailureArtifacts({artifactDir: artifactDirectory, diagnostics, error, page, targetUrl});

  const captureError = JSON.parse(
    await readFile(path.join(artifactDirectory, 'capture-error.json'), 'utf8')
  );
  assert.equal(captureError.message, error.message);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(artifactDirectory, 'page-diagnostics.json'), 'utf8')),
    diagnostics
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(artifactDirectory, 'page-state.json'), 'utf8')),
    pageState
  );
  assert.equal(await readFile(path.join(artifactDirectory, 'last-url.txt'), 'utf8'), `${targetUrl}\n`);
});
