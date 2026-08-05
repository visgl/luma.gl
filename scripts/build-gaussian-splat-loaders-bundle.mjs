// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Regenerates the browser-only loaders.gl 5 Gaussian splat artifact without changing dependencies.
 *
 * Usage:
 *   node scripts/build-gaussian-splat-loaders-bundle.mjs /path/to/loaders.gl
 *   LOADERS_GL_ROOT=/path/to/loaders.gl node scripts/build-gaussian-splat-loaders-bundle.mjs
 */

import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const loadersRoot = resolve(
  process.argv[2] || process.env.LOADERS_GL_ROOT || join(repositoryRoot, '..', 'loaders.gl')
);
const loadersManifestPath = join(loadersRoot, 'modules/core/package.json');

if (!existsSync(loadersManifestPath)) {
  throw new Error(
    'Provide a loaders.gl 5 checkout as the first argument or set LOADERS_GL_ROOT.'
  );
}

const loadersManifest = JSON.parse(readFileSync(loadersManifestPath, 'utf8'));
if (!loadersManifest.version.startsWith('5.')) {
  throw new Error(`Expected a loaders.gl 5 checkout, received ${loadersManifest.version}.`);
}

const loadersCommit =
  process.env.LOADERS_GL_SOURCE_COMMIT ||
  execFileSync('git', ['-C', loadersRoot, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
const loadersRequire = createRequire(join(loadersRoot, 'package.json'));
const esbuild = loadersRequire('esbuild');
const outputDirectory = join(
  repositoryRoot,
  'website/static/standalone-examples/gaussian-splats'
);
const outputFile = join(outputDirectory, 'loaders-gl.mjs');
const licenseFile = join(outputDirectory, 'loaders-gl.LICENSE.txt');

mkdirSync(outputDirectory, {recursive: true});

const entrypoint = [
  `export {load} from ${JSON.stringify(join(loadersRoot, 'modules/core/src/lib/api/load'))};`,
  `export {loadInBatches} from ${JSON.stringify(join(loadersRoot, 'modules/core/src/lib/api/load-in-batches'))};`,
  `export {PLYLoaderWithParser as PLYLoader} from ${JSON.stringify(join(loadersRoot, 'modules/ply/src/ply-loader-with-parser'))};`,
  `export {SPLATLoaderWithParser as SPLATLoader} from ${JSON.stringify(join(loadersRoot, 'modules/splats/src/splat-loader'))};`,
  `export {KSPLATLoaderWithParser as KSPLATLoader} from ${JSON.stringify(join(loadersRoot, 'modules/splats/src/ksplat-loader'))};`,
  `export {SPZLoaderWithParser as SPZLoader} from ${JSON.stringify(join(loadersRoot, 'modules/splats/src/spz-loader'))};`,
  `export {RADLoaderWithParser as RADLoader} from ${JSON.stringify(join(loadersRoot, 'modules/splats/src/rad-loader'))};`
].join('\n');

const buildResult = await esbuild.build({
  stdin: {
    contents: entrypoint,
    resolveDir: loadersRoot,
    sourcefile: 'gaussian-splat-loaders-entry.ts',
    loader: 'ts'
  },
  outfile: outputFile,
  banner: {
    js: `/*! loaders.gl ${loadersManifest.version} (${loadersCommit}) | License notices: ./loaders-gl.LICENSE.txt */`
  },
  bundle: true,
  format: 'esm',
  legalComments: 'none',
  metafile: true,
  minify: true,
  platform: 'browser',
  target: 'es2022',
  treeShaking: true
});

const dependencyNames = new Set();
for (const sourcePath of Object.keys(buildResult.metafile.inputs)) {
  const normalizedPath = sourcePath.replaceAll('\\', '/');
  const nodeModulesIndex = normalizedPath.lastIndexOf('node_modules/');
  if (nodeModulesIndex < 0) {
    continue;
  }
  const dependencySegments = normalizedPath.slice(nodeModulesIndex + 'node_modules/'.length).split('/');
  const dependencyName = dependencySegments[0]?.startsWith('@')
    ? `${dependencySegments[0]}/${dependencySegments[1]}`
    : dependencySegments[0];
  if (dependencyName) {
    dependencyNames.add(dependencyName);
  }
}

const licenseSections = [
  `loaders.gl ${loadersManifest.version}\nSource: https://github.com/visgl/loaders.gl/tree/${loadersCommit}`,
  readFileSync(join(loadersRoot, 'LICENSE'), 'utf8').trim()
];

for (const dependencyName of Array.from(dependencyNames).sort()) {
  const dependencyDirectory = join(loadersRoot, 'node_modules', dependencyName);
  const dependencyManifest = JSON.parse(
    readFileSync(join(dependencyDirectory, 'package.json'), 'utf8')
  );
  const licenseNames = readdirSync(dependencyDirectory)
    .filter(fileName => /^(license|licence|notice|copying)(\.|$)/i.test(fileName))
    .sort();

  licenseSections.push(
    `\n${'='.repeat(80)}\n${dependencyName} ${dependencyManifest.version} (${dependencyManifest.license})`
  );
  for (const licenseName of licenseNames) {
    licenseSections.push(
      `\n${licenseName}\n${readFileSync(join(dependencyDirectory, licenseName), 'utf8').trim()}`
    );
  }
}

const normalizedLicenseText = `${licenseSections.join('\n\n')}\n`
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+$/gm, '');
writeFileSync(licenseFile, normalizedLicenseText);

const outputBytes = readFileSync(outputFile);
const compressedBytes = gzipSync(outputBytes, {level: 9});
process.stdout.write(
  `${basename(outputFile)}: ${outputBytes.byteLength.toLocaleString()} bytes, ` +
    `${compressedBytes.byteLength.toLocaleString()} bytes gzip\n`
);
process.stdout.write(`${basename(licenseFile)}: ${dependencyNames.size} bundled dependency notices\n`);
