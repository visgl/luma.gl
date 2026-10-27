// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const forbidden = {core: ['gpgpu', 'graph', 'engine'], gpgpu: ['engine', 'graph'], graph: ['engine']};
for (const [name, dependencies] of Object.entries(forbidden)) {
  const directory = resolve(root, 'modules', name);
  const manifest = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
  for (const dependency of dependencies) {
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      assert(!manifest[field]?.[`@luma.gl/${dependency}`], `${name} ${field} depends on ${dependency}`);
    }
  }
  // Check source, emitted JavaScript and public declarations, including type-only imports.
  for (const folder of ['src', 'dist']) {
    const files = await readdir(resolve(directory, folder), {recursive: true});
    for (const file of files.filter(file => /\.(?:ts|js|cjs)$/.test(file))) {
      const path = resolve(directory, folder, file);
      const source = await readFile(path, 'utf8');
      for (const [, specifier] of source.matchAll(/(?:from\s*|(?:import|require)\s*\(\s*)['"]([^'"]+)['"]/g)) {
        for (const dependency of dependencies) {
          assert(
            specifier !== `@luma.gl/${dependency}` && !specifier.startsWith(`@luma.gl/${dependency}/`),
            `${path} imports ${specifier}`
          );
          if (specifier.startsWith('.')) {
            const target = resolve(dirname(path), specifier);
            assert(!target.startsWith(resolve(root, 'modules', dependency) + '/'), `${path} imports ${target}`);
          }
        }
      }
    }
  }
}
console.log('Verified engine → graph → gpgpu → core package boundaries.');
