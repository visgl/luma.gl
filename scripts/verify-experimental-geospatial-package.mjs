// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import typescript from 'typescript';

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = require('../modules/experimental/package.json');
const runtimeExportNames = [
  'GPUHaversineDistance',
  'GPUPairwisePointDistance',
  'GPUPairwisePointInPolygon',
  'GPUPairwisePointLinestringNearest',
  'GPUPairwisePointSegmentDistance',
  'GPUGridIndex',
  'GPUPointSpatialQuery',
  'GPUSinusoidalProjection'
];
const runtimeValueExportNames = ['GPU_POINT_IN_POLYGON_CLASSIFICATION'];
// GPUGridIndex predates the geospatial subpath as a generic GPU primitive.
const preexistingRootExportNames = new Set(['GPUGridIndex']);

assert.deepEqual(packageJson.exports?.['./geospatial'], {
  import: './dist/geospatial/index.js',
  require: './dist/geospatial/index.cjs',
  types: './dist/geospatial/index.d.ts'
});

const ecmaScriptGeospatialModule = await import('@luma.gl/experimental/geospatial');
const commonJsGeospatialModule = require('@luma.gl/experimental/geospatial');
const ecmaScriptRootModule = await import('@luma.gl/experimental');
const commonJsRootModule = require('@luma.gl/experimental');

for (const exportName of runtimeExportNames) {
  assert.equal(typeof ecmaScriptGeospatialModule[exportName], 'function');
  assert.equal(typeof commonJsGeospatialModule[exportName], 'function');
  assert.equal(exportName in ecmaScriptRootModule, preexistingRootExportNames.has(exportName));
  assert.equal(exportName in commonJsRootModule, preexistingRootExportNames.has(exportName));
}
for (const exportName of runtimeValueExportNames) {
  assert.equal(typeof ecmaScriptGeospatialModule[exportName], 'object');
  assert.equal(typeof commonJsGeospatialModule[exportName], 'object');
  assert.equal(exportName in ecmaScriptRootModule, false);
  assert.equal(exportName in commonJsRootModule, false);
}

function makeRootVector(rootModule, id, format, rowByteLength) {
  const chunk = {
    buffer: {id: `${id}-buffer`},
    format,
    length: 1,
    byteOffset: 0,
    byteStride: rowByteLength,
    rowByteLength
  };
  return new rootModule.GraphVectorView({
    id,
    name: id,
    format,
    length: 1,
    valueLength: format === 'float32x2' ? 2 : 1,
    stride: format === 'float32x2' ? 2 : 1,
    byteStride: rowByteLength,
    rowByteLength,
    data: [chunk]
  });
}

for (const [rootModule, geospatialModule] of [
  [ecmaScriptRootModule, ecmaScriptGeospatialModule],
  [commonJsRootModule, commonJsGeospatialModule]
]) {
  const positions = makeRootVector(rootModule, 'positions', 'float32x2', 8);
  const output = makeRootVector(rootModule, 'output', 'float32x2', 8);
  assert.doesNotThrow(
    () => new geospatialModule.GPUSinusoidalProjection({positions, output}),
    'root GraphVectorView values must interoperate with the separately bundled geospatial subpath'
  );
}

const temporaryDirectory = mkdtempSync(path.join(repositoryRoot, '.geospatial-package-'));
try {
  const typeTestPath = path.join(temporaryDirectory, 'index.mts');
  writeFileSync(
    typeTestPath,
    `import {
  GPUHaversineDistance,
  GPUGridIndex,
  GPUPairwisePointDistance,
  GPUPairwisePointInPolygon,
  GPUPairwisePointLinestringNearest,
  GPUPairwisePointSegmentDistance,
  GPUPointSpatialQuery,
  GPUSinusoidalProjection,
  GPU_POINT_IN_POLYGON_CLASSIFICATION,
  type GPUFloat64Positions,
  type GPUGridIndexProps,
  type GPUPairwisePointInPolygonProps,
  type GPUPairwisePointLinestringNearestProps,
  type GPUPointInPolygonClassification,
  type GPUPointSpatialQueryProps,
  type GPUSpatialQueryOutput
} from '@luma.gl/experimental/geospatial';
import type {GPUCommandGraphContributor} from '@luma.gl/experimental';

const constructors = [
  GPUHaversineDistance,
  GPUGridIndex,
  GPUPairwisePointDistance,
  GPUPairwisePointInPolygon,
  GPUPairwisePointLinestringNearest,
  GPUPairwisePointSegmentDistance,
  GPUPointSpatialQuery,
  GPUSinusoidalProjection
];
declare const contributor: GPUCommandGraphContributor;
declare const positions: GPUFloat64Positions;
declare const gridProps: GPUGridIndexProps;
declare const polygonProps: GPUPairwisePointInPolygonProps;
declare const nearestProps: GPUPairwisePointLinestringNearestProps;
declare const classification: GPUPointInPolygonClassification;
declare const queryProps: GPUPointSpatialQueryProps;
declare const queryOutput: GPUSpatialQueryOutput;
void constructors;
void contributor;
void positions;
void gridProps;
void polygonProps;
void nearestProps;
void classification;
void queryProps;
void queryOutput;
void GPU_POINT_IN_POLYGON_CLASSIFICATION;

// @ts-expect-error Geospatial algorithms stay isolated from the experimental root.
import {GPUHaversineDistance as RootGPUHaversineDistance} from '@luma.gl/experimental';
void RootGPUHaversineDistance;

// @ts-expect-error The classification constant stays isolated from the experimental root.
import {GPU_POINT_IN_POLYGON_CLASSIFICATION as RootClassification} from '@luma.gl/experimental';
void RootClassification;
`
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
      getCanonicalFileName: fileName => fileName,
      getCurrentDirectory: () => temporaryDirectory,
      getNewLine: () => '\n'
    })
  );
} finally {
  rmSync(temporaryDirectory, {force: true, recursive: true});
}

console.log('Verified @luma.gl/experimental/geospatial ESM, CJS, and declaration imports.');
