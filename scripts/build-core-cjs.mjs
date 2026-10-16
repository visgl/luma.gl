// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {transform} from 'esbuild';

// Preserve one module graph across core, backend, constants, and optional debug
// entry points. Separate bundled entry points would duplicate classes and hooks.
const distributionDirectory = new URL('../modules/core/dist/', import.meta.url);
const distributionFiles = await readdir(distributionDirectory, {recursive: true});
await Promise.all(
  distributionFiles.filter(file => file.endsWith('.js')).map(async file => {
    const source = await readFile(new URL(file, distributionDirectory), 'utf8');
    const rewrittenSource = source.replace(
      /((?:from\s+|import\s*(?:\(\s*)?)['"])(\.[^'"]+)\.js(['"])/g,
      '$1$2.cjs$3'
    );
    const {code} = await transform(rewrittenSource, {
      format: 'cjs',
      // Node needs export-name annotations for dynamic import() of CommonJS files.
      platform: 'node',
      target: 'node16',
      sourcefile: fileURLToPath(new URL(file, distributionDirectory))
    });
    await writeFile(new URL(file.replace(/\.js$/, '.cjs'), distributionDirectory), code);
  })
);

const require = createRequire(import.meta.url);
const coreApi = require(fileURLToPath(new URL('index.cjs', distributionDirectory)));
for (const backend of ['webgl', 'webgpu']) {
  const deviceClassName = backend === 'webgl' ? 'WebGLDevice' : 'WebGPUDevice';
  const implementation = await import(
    new URL(`${backend}/adapter/${backend}-device.cjs`, distributionDirectory)
  );
  assert.equal(typeof implementation[deviceClassName], 'function');
  assert(implementation[deviceClassName].prototype instanceof coreApi.Device);
}
process.stdout.write('Verified CommonJS device identity and dynamic imports.\n');
