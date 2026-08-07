// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import typescript from 'typescript';

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repositoryRoot, 'modules/experimental');
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const lurasterExport = packageJson.exports?.['./luraster'];

assert.equal(packageJson.name, '@luma.gl/experimental');
assert.equal(packageJson.private, true, 'the existing experimental package remains private');
assert.equal(packageJson.sideEffects, false, 'the optional subpath remains side-effect free');
assert.deepEqual(lurasterExport, {
  import: './dist/luraster/index.js',
  require: './dist/luraster/index.cjs',
  types: './dist/luraster/index.d.ts'
});

const ecmaScriptModuleEntry = path.resolve(packageRoot, lurasterExport.import);
const commonJsEntry = path.resolve(packageRoot, lurasterExport.require);
const declarationEntry = path.resolve(packageRoot, lurasterExport.types);
const ecmaScriptRootEntry = path.resolve(packageRoot, packageJson.exports['.'].import);
const commonJsRootEntry = path.resolve(packageRoot, packageJson.exports['.'].require);

assert.doesNotThrow(() => readFileSync(declarationEntry, 'utf8'), 'LuRaster declarations exist');

const ecmaScriptRasterModule = await import(pathToFileURL(ecmaScriptModuleEntry).href);
const commonJsRasterModule = require(commonJsEntry);
const ecmaScriptRootModule = await import(pathToFileURL(ecmaScriptRootEntry).href);
const commonJsRootModule = require(commonJsRootEntry);
const ecmaScriptExportNames = Object.keys(ecmaScriptRasterModule).sort();
const commonJsExportNames = Object.keys(commonJsRasterModule)
  .filter((exportName) => exportName !== '__esModule')
  .sort();
const requiredRuntimeExportNames = [
  'GPURaster',
  'GPURasterBufferToTexture',
  'GPURasterTextureToBuffer',
  'getRasterDeviceLimits',
  'planRasterDispatchStripes'
];

assert.deepEqual(
  commonJsExportNames,
  ecmaScriptExportNames,
  'ESM and CommonJS expose the same optional LuRaster runtime symbols'
);
for (const exportName of requiredRuntimeExportNames) {
  assert.equal(typeof ecmaScriptRasterModule[exportName], 'function');
  assert.equal(typeof commonJsRasterModule[exportName], 'function');
}
for (const exportName of ecmaScriptExportNames) {
  assert.equal(
    exportName in ecmaScriptRootModule,
    false,
    `ESM experimental root excludes ${exportName}`
  );
  assert.equal(
    exportName in commonJsRootModule,
    false,
    `CommonJS experimental root excludes ${exportName}`
  );
}

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'luma-luraster-package-'));
try {
  const temporaryPackageScope = path.join(temporaryDirectory, 'node_modules', '@luma.gl');
  mkdirSync(temporaryPackageScope, {recursive: true});
  symlinkSync(packageRoot, path.join(temporaryPackageScope, 'experimental'));
  const typeTestPath = path.join(temporaryDirectory, 'index.mts');
  writeFileSync(
    typeTestPath,
    `import {
  GPURaster,
  GPURasterBufferToTexture,
  GPURasterTextureToBuffer,
  getRasterDeviceLimits,
  planRasterDispatchStripes,
  type GPURasterBand,
  type GPURasterMetadata,
  type RasterDeviceLimits,
  type RasterDispatchStripe
} from '@luma.gl/experimental/luraster';
import type {GPUCommandGraphContributor, GPUReductionMask} from '@luma.gl/experimental';

declare const contributor: GPUCommandGraphContributor;
declare const rasterBand: GPURasterBand;
declare const rasterMetadata: GPURasterMetadata;
declare const rasterDeviceLimits: RasterDeviceLimits;
declare const rasterDispatchStripe: RasterDispatchStripe;
declare const reductionMask: GPUReductionMask;
declare const textureToBuffer: GPURasterTextureToBuffer;
const rasterContributor: GPUCommandGraphContributor = textureToBuffer;

void GPURaster;
void GPURasterBufferToTexture;
void GPURasterTextureToBuffer;
void getRasterDeviceLimits;
void planRasterDispatchStripes;
void contributor;
void rasterBand;
void rasterMetadata;
void rasterDeviceLimits;
void rasterDispatchStripe;
void reductionMask;
void rasterContributor;

// @ts-expect-error Raster algorithms stay isolated from the experimental root.
import {GPURaster as RootGPURaster} from '@luma.gl/experimental';
void RootGPURaster;
`
  );
  assert.equal(
    createRequire(typeTestPath).resolve('@luma.gl/experimental/luraster'),
    commonJsEntry,
    "the temporary consumer resolves this worktree's experimental package"
  );

  const program = typescript.createProgram([typeTestPath], {
    module: typescript.ModuleKind.NodeNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: typescript.ScriptTarget.ES2022,
    types: []
  });
  const diagnostics = typescript.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    typescript.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => temporaryDirectory,
      getNewLine: () => '\n'
    })
  );
} finally {
  rmSync(temporaryDirectory, {force: true, recursive: true});
}

console.log('Verified @luma.gl/experimental/luraster ESM, CJS, and declaration imports.');
