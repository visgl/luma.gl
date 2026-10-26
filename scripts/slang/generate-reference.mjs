// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LANGUAGE_SHADER, UNIFORM_SHADER, MATRIX_SHADER} from '../../modules/slang/test/fixtures.ts';

import {EVERYDAY_SHADER} from '../../modules/slang/test/everyday-fixtures.ts';

// Upstream WGSL currently leaves bools in uniform buffers (not host-shareable).
// Use the same numeric layout with uint flags for the reference compiler only;
// the TypeScript compiler's bool legalization is exercised separately on both GPUs.
const numericUniforms = UNIFORM_SHADER.replace(/bool/g, 'uint')
  .replace('settings.flags[0] && !settings.flags[1] && settings.inner.enabled',
    '(settings.flags[0] != 0u) && (settings.flags[1] == 0u) && (settings.inner.enabled != 0u)');
const compiler = process.env.SLANGC || 'slangc';
const version = spawnSync(compiler, ['-version'], {encoding: 'utf8'});
if (version.error) throw version.error;
const compilerVersion = (version.stdout + version.stderr).trim();
if (compilerVersion !== '2026.19') throw new Error('Reference fixtures require official Slang 2026.19');
const directory = mkdtempSync(join(tmpdir(), 'luma-slang-reference-'));
try {
  const fixtures = {};
  for (const [name, source, entryPoint] of [
    ['language', LANGUAGE_SHADER, 'main'],
    ['everyday', EVERYDAY_SHADER, 'main'],
    ['matrix', MATRIX_SHADER, 'computeMain'],
    ['uniforms', numericUniforms, 'main']
  ]) {
    const input = join(directory, `${name}.slang`);
    const output = join(directory, `${name}.wgsl`);
    const reflection = join(directory, `${name}.json`);
    writeFileSync(input, source);
    execFileSync(compiler, [input, '-target', 'wgsl', '-entry', entryPoint, '-matrix-layout-row-major', '-reflection-json', reflection, '-o', output], {stdio: 'inherit'});
    fixtures[name] = {source, entryPoint, code: readFileSync(output, 'utf8'), reflection: JSON.parse(readFileSync(reflection, 'utf8'))};
  }
  const destination = fileURLToPath(new URL('../../modules/slang/test/reference.json', import.meta.url));
  writeFileSync(destination, JSON.stringify({compilerVersion, fixtures}, null, 2) + '\n');
  console.log(`Generated reference fixtures with official Slang ${compilerVersion}`);
} finally { rmSync(directory, {recursive: true, force: true}); }
