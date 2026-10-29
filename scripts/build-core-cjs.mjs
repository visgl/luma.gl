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
await writeCommonJSModules(new URL('../modules/gpgpu/dist/', import.meta.url));
await writeCommonJSModules(new URL('../modules/graph/dist/', import.meta.url));
await writeCommonJSModules(new URL('../modules/engine/dist/', import.meta.url));

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

// Dynamic resource facades preserve identity; engine owns shader-module convenience APIs.
const engineApi = require('../modules/engine/dist/index.cjs');
const executionApi = require('../modules/gpgpu/dist/index.cjs');
const dataApi = require('../modules/gpgpu/dist/gpu-data/index.cjs');
for (const name of ['DynamicBuffer', 'DynamicTexture']) {
  assert.equal(typeof executionApi[name], 'function');
  assert.equal(engineApi[name], executionApi[name]);
}
for (const name of ['Computation', 'ShaderInputs', 'BufferTransform', 'TextureTransform', 'GPUVectorModel', 'GPUVectorGeometry', 'getGPUVectorModelBatches', 'validateGPUVectorBatchStructure']) {
  assert.equal(typeof engineApi[name], 'function');
  assert.equal(name in executionApi, false);
  assert.equal(name in dataApi, false);
}
assert(engineApi.Model.prototype instanceof engineApi.GPUVectorModel);
process.stdout.write('Verified CommonJS execution primitive identity.\n');

await import('./verify-package-layering.mjs');

// Optional resource conveniences preserve identity across all compatibility exports.
const dynamicApi = require('../modules/core/dist/dynamic/index.cjs');
const [coreEsm, dynamicEsm, engineEsm, executionEsm] = await Promise.all([
  import('../modules/core/dist/index.js'),
  import('../modules/core/dist/dynamic/index.js'),
  import('../modules/engine/dist/index.js'),
  import('../modules/gpgpu/dist/index.js')
]);
for (const name of ['DynamicBuffer', 'DynamicTexture']) {
  assert.equal(typeof dynamicApi[name], 'function');
  assert.equal(dynamicApi[name], engineApi[name]);
  assert.equal(dynamicApi[name], executionApi[name]);
  assert.equal(dynamicEsm[name], engineEsm[name]);
  assert.equal(dynamicEsm[name], executionEsm[name]);
  assert(!(name in coreApi));
  assert(!(name in coreEsm));
}
process.stdout.write('Verified optional dynamic resource identity in ESM and CommonJS.\n');

// Shader-module conveniences remain engine-owned in both module formats.
for (const name of ['Computation', 'ShaderInputs']) {
  assert.equal(typeof engineEsm[name], 'function');
  assert(!(name in executionEsm));
}

// Kernel execution helpers are exported only by gpgpu, in both module formats.
for (const name of ['Kernel', 'RenderKernel']) {
  assert.equal(typeof executionApi[name], 'function');
  assert.equal(typeof executionEsm[name], 'function');
  assert(!(name in engineApi));
  assert(!(name in engineEsm));
  assert(!(name in coreApi));
  assert(!(name in coreEsm));
}
process.stdout.write('Verified gpgpu kernel export ownership.\n');

// The lightweight browser entry shares existing CommonJS device singleton implementations.
const testUtilities = require('../modules/core/dist/test-utils/index.cjs');
const deviceTestUtilities = require('@luma.gl/core/test-utils');
const legacyTestUtilities = require('@luma.gl/core/test-utils/legacy');
assert.equal(typeof legacyTestUtilities.createTestDevice, 'function');
assert(!('createTestDevice' in testUtilities));
assert(!('SnapshotTestRunner' in testUtilities));
for (const name of ['getWebGPUTestDevice', 'NullDevice', 'nullAdapter']) {
  assert.equal(deviceTestUtilities[name], testUtilities[name]);
}
process.stdout.write('Verified device helper CommonJS identities.\n');

// glTF subpaths reuse engine scenegraph constructors in both module formats.
const gltfApi = require('@luma.gl/engine/gltf');
const gltfPhysicsApi = require('@luma.gl/engine/gltf-physics');
const gltfEsm = await import('../modules/engine/dist/gltf/index.js');
assert.equal(typeof gltfApi.createScenegraphsFromGLTF, 'function');
assert.equal(typeof gltfEsm.createScenegraphsFromGLTF, 'function');
assert.equal(typeof gltfPhysicsApi.parseGLTFPhysics, 'function');
assert(!('createScenegraphsFromGLTF' in engineApi));
