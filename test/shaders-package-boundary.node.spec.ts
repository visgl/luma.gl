// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {expect, it} from 'vitest';

it('publishes shaders without a legacy workspace package or first-party imports', () => {
  const manifest = JSON.parse(readFileSync('modules/shaders/package.json', 'utf8'));
  expect(manifest.name).toBe('@luma.gl/shaders');
  expect(manifest.exports['.']).toEqual({
    types: './dist/index.d.ts',
    import: './dist/index.js',
    require: './dist/index.cjs'
  });
  expect(existsSync('modules/shadertools')).toBe(false);

  const violations: string[] = [];
  for (const moduleDirectory of readdirSync('modules', {withFileTypes: true})) {
    if (!moduleDirectory.isDirectory()) continue;
    const directory = join('modules', moduleDirectory.name);
    const packageManifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    for (const group of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies'
    ]) {
      if ('@luma.gl/shadertools' in (packageManifest[group] || {})) {
        violations.push(`${directory}/package.json: ${group}`);
      }
    }
    const sourceDirectory = join(directory, 'src');
    for (const filename of readdirSync(sourceDirectory, {recursive: true})) {
      if (!/\.[cm]?[jt]sx?$/.test(filename)) continue;
      const source = readFileSync(join(sourceDirectory, filename), 'utf8');
      if (
        /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"]@luma\.gl\/shadertools(?:\/|['"])/.test(
          source
        )
      ) {
        violations.push(join(sourceDirectory, filename));
      }
    }
  }
  expect(violations).toEqual([]);
});
