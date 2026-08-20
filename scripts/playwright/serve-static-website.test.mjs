// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {parseArguments, resolveStaticFilename} from './serve-static-website.mjs';

test('resolveStaticFilename supports Docusaurus pretty URLs and confines requests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'luma-static-website-'));
  try {
    await mkdir(path.join(root, 'nested'));
    await writeFile(path.join(root, 'index.html'), 'root');
    await writeFile(path.join(root, 'pretty.html'), 'pretty');
    await writeFile(path.join(root, 'nested', 'index.html'), 'nested');

    assert.equal(await resolveStaticFilename(root, '/'), path.join(root, 'index.html'));
    assert.equal(await resolveStaticFilename(root, '/pretty'), path.join(root, 'pretty.html'));
    assert.equal(
      await resolveStaticFilename(root, '/nested'),
      path.join(root, 'nested', 'index.html')
    );
    assert.equal(await resolveStaticFilename(root, '/../outside'), null);
    assert.equal(await resolveStaticFilename(root, '/%E0%A4%A'), null);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test('parseArguments requires a root and valid port', () => {
  assert.deepEqual(parseArguments(['--root', 'build', '--port', '8080']), {
    root: 'build',
    host: '127.0.0.1',
    port: 8080
  });
  assert.throws(() => parseArguments(['--root', 'build', '--port', '0']), /valid port/);
  assert.throws(() => parseArguments(['--host', '127.0.0.1']), /root directory/);
});
