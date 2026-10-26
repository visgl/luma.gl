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
await writeCommonJSModules(distributionDirectory);
await writeCommonJSModules(new URL('../modules/anari/dist/', import.meta.url));
await writeCommonJSModules(new URL('../modules/graph/dist/experimental/', import.meta.url));

async function writeCommonJSModules(directory) {
  const files = await readdir(directory, {recursive: true});
  await Promise.all(files.filter(file => file.endsWith('.js')).map(async file => {
    const source = await readFile(new URL(file, directory), 'utf8');
    const rewrittenSource = source.replace(
      /((?:from\s+|import\s*(?:\(\s*)?)['"])(\.[^'"]+)\.js(['"])/g,
      '$1$2.cjs$3'
    );
    const {code} = await transform(rewrittenSource, {
      format: 'cjs',
      platform: 'node',
      target: 'node16',
      sourcefile: fileURLToPath(new URL(file, directory))
    });
    await writeFile(new URL(file.replace(/\.js$/, '.cjs'), directory), code);
  }));
}

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

// The focused graph entry point must reuse all core authoring and scheduler constructors.
// Bundling it separately would make instanceof checks depend on the import path.
const graphDistributionDirectory = new URL('../modules/graph/dist/', import.meta.url);
const graphEntryPoint = new URL('gpu-graph/index.js', graphDistributionDirectory);
const graphSource = await readFile(graphEntryPoint, 'utf8');
const {code: graphCode} = await transform(
  graphSource.replace(/(['"])\.\.\/gpu-core\/[^'"]+\.js\1/g, "'../gpu-core/index.cjs'"),
  {
    format: 'cjs',
    platform: 'node',
    target: 'node16',
    sourcefile: fileURLToPath(graphEntryPoint)
  }
);
await writeFile(new URL('gpu-graph/index.cjs', graphDistributionDirectory), graphCode);
const graphApi = require(fileURLToPath(new URL('gpu-graph/index.cjs', graphDistributionDirectory)));
const gpuCoreApi = require(fileURLToPath(new URL('gpu-core/index.cjs', graphDistributionDirectory)));
for (const name of ['GraphBufferHandle', 'GraphDataView', 'GraphExternalTextureHandle', 'GraphTextureHandle', 'GraphTextureView', 'GraphVectorView']) {
  assert.equal(typeof graphApi[name], 'function');
}
for (const [name, value] of Object.entries(graphApi)) {
  assert.equal(value, gpuCoreApi[name]);
}
assert.notEqual(graphApi.GPUGraph, graphApi.GPUCommandGraph);
assert.equal(graphApi.GPUGraph.name, 'GPUGraph');
process.stdout.write('Verified CommonJS GPU graph constructor identity.\n');

// The focused package root reuses scheduler and diagnostics constructors without
// re-exporting the optional algorithms from gpu-core.
const rootGraphEntryPoint = new URL('index.js', graphDistributionDirectory);
const rootGraphExportNames = [
  ...Object.keys(graphApi),
  'GPUCommandGraphAutotuner',
  'getGPUCommandGraphAdapterIdentity',
  'GPUCommandGraphExecutionBudgetController',
  'GPUCommandGraphInspector'
];
const {code: rootGraphCode} = await transform(
  `export {${rootGraphExportNames.join(',')}} from './gpu-core/index.cjs';`,
  {format: 'cjs', platform: 'node', target: 'node16', sourcefile: fileURLToPath(rootGraphEntryPoint)}
);
await writeFile(new URL('index.cjs', graphDistributionDirectory), rootGraphCode);
const rootGraphApi = require(fileURLToPath(new URL('index.cjs', graphDistributionDirectory)));
for (const [name, value] of Object.entries(rootGraphApi)) {
  assert.equal(value, gpuCoreApi[name]);
}
assert.equal('GPUScan' in rootGraphApi, false);
process.stdout.write('Verified CommonJS GPU Graph package root identity.\n');

// Public renderer facades and experimental aggregates preserve constructor identity.
const anariDistributionDirectory = new URL('../modules/anari/dist/', import.meta.url);
const anariApi = require(fileURLToPath(new URL('index.cjs', anariDistributionDirectory)));
for (const entryPoint of ['forward', 'deferred', 'raytrace', 'raymarch']) {
  const facade = require(fileURLToPath(new URL(`${entryPoint}.cjs`, anariDistributionDirectory)));
  for (const [name, value] of Object.entries(facade)) {
    assert.equal(value, anariApi[name]);
  }
}
const graphExperimentalDirectory = new URL('experimental/', graphDistributionDirectory);
const graphExperimentalApi = require(fileURLToPath(new URL('index.cjs', graphExperimentalDirectory)));
for (const entryPoint of ['models', 'simulation']) {
  const implementation = require(fileURLToPath(new URL(`${entryPoint}/index.cjs`, graphExperimentalDirectory)));
  for (const [name, value] of Object.entries(implementation)) {
    assert.equal(value, graphExperimentalApi[name]);
  }
}
process.stdout.write('Verified CommonJS renderer and experimental subpath identity.\n');
