// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, test} from 'vitest';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SPDX_HEADER_LINE_COUNT = 12;
const SOURCE_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.wgsl',
  '.glsl'
]);
const EXCLUDED_SOURCE_DIRECTORIES = new Set([
  'node_modules',
  'vendor',
  'vendored',
  'third_party',
  'third-party',
  'dist',
  'build',
  'coverage',
  'generated',
  '__generated__'
]);
const SPDX_LICENSE_IDENTIFIER_PATTERN = /^\s*(?:\/\/|\/\*+|\*)\s*SPDX-License-Identifier:\s*\S/u;
const SPDX_FILE_COPYRIGHT_TEXT_PATTERN = /^\s*(?:\/\/|\/\*+|\*)\s*SPDX-FileCopyrightText:\s*\S/u;

// Embedded third-party material needs its actual owners and license expressions reviewed before
// these existing headers can be normalized without incorrectly assigning ownership to vis.gl.
const TEMPORARY_MIXED_LICENSE_EXCEPTIONS = new Set([
  'modules/effects/src/passes/postprocessing/fxaa/fxaa.ts',
  'modules/engine/src/geometries/plane-geometry.ts',
  'modules/engine/src/geometries/truncated-cone-geometry.ts',
  'modules/engine/src/geometries/sphere-geometry.ts',
  'modules/text/src/fonts/helvetiker.ts'
]);

// This declaration file was copied from Spector.js and must retain its independently reviewed
// upstream ownership instead of receiving a speculative vis.gl copyright claim.
const THIRD_PARTY_SOURCE_EXCEPTIONS = new Set(['modules/webgl/src/context/debug/spector-types.ts']);

const PBR_SHADER_SOURCE_FILES = [
  'modules/shadertools/src/modules/lighting/pbr-material/pbr-material-glsl.ts',
  'modules/shadertools/src/modules/lighting/pbr-material/pbr-material-wgsl.ts'
];

function listRepositorySourceFiles(): string[] {
  const repositoryFiles = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8'
    }
  ).split('\0');

  return repositoryFiles.filter(sourceFile => {
    if (
      !SOURCE_FILE_EXTENSIONS.has(path.extname(sourceFile)) ||
      !existsSync(path.join(REPOSITORY_ROOT, sourceFile))
    ) {
      return false;
    }

    const pathSegments = sourceFile.split('/');

    return (
      !pathSegments.some(pathSegment => EXCLUDED_SOURCE_DIRECTORIES.has(pathSegment)) &&
      !sourceFile.startsWith('website/static/') &&
      !/\.(?:min|bundle)\.[cm]?js$/u.test(sourceFile)
    );
  });
}

function readSourceHeader(sourceFile: string): string[] {
  return readFileSync(path.join(REPOSITORY_ROOT, sourceFile), 'utf8')
    .split(/\r?\n/u)
    .slice(0, SPDX_HEADER_LINE_COUNT);
}

const REPOSITORY_SOURCE_FILES = listRepositorySourceFiles();

describe('SPDX source headers', () => {
  test('records copyright ownership for every existing SPDX-licensed first-party source', () => {
    const missingLicenseSources: string[] = [];
    const missingCopyrightSources: string[] = [];
    let licensedSourceCount = 0;

    for (const sourceFile of REPOSITORY_SOURCE_FILES) {
      if (THIRD_PARTY_SOURCE_EXCEPTIONS.has(sourceFile)) {
        continue;
      }

      const sourceHeader = readSourceHeader(sourceFile);
      const hasLicenseIdentifier = sourceHeader.some(headerLine =>
        SPDX_LICENSE_IDENTIFIER_PATTERN.test(headerLine)
      );
      const sourcePathSegments = sourceFile.split('/');
      const isProductionModuleSource =
        sourcePathSegments[0] === 'modules' && sourcePathSegments[2] === 'src';

      if (!hasLicenseIdentifier) {
        if (isProductionModuleSource) {
          missingLicenseSources.push(sourceFile);
        }

        continue;
      }

      licensedSourceCount++;

      if (TEMPORARY_MIXED_LICENSE_EXCEPTIONS.has(sourceFile)) {
        continue;
      }

      if (!sourceHeader.some(headerLine => SPDX_FILE_COPYRIGHT_TEXT_PATTERN.test(headerLine))) {
        missingCopyrightSources.push(sourceFile);
      }
    }

    expect(licensedSourceCount).toBeGreaterThan(0);
    expect(missingLicenseSources).toEqual([]);
    expect(missingCopyrightSources).toEqual([]);
  });

  test('removes temporary mixed-license exceptions after their ownership is normalized', () => {
    const repositorySourceFiles = new Set(REPOSITORY_SOURCE_FILES);

    for (const sourceFile of TEMPORARY_MIXED_LICENSE_EXCEPTIONS) {
      expect(repositorySourceFiles.has(sourceFile), sourceFile).toBe(true);

      const sourceHeader = readSourceHeader(sourceFile);

      expect(
        sourceHeader.some(headerLine => SPDX_LICENSE_IDENTIFIER_PATTERN.test(headerLine)),
        sourceFile
      ).toBe(true);
      expect(
        sourceHeader.some(headerLine => SPDX_FILE_COPYRIGHT_TEXT_PATTERN.test(headerLine)),
        `${sourceFile} no longer requires a mixed-license exception`
      ).toBe(false);
    }
  });

  test('keeps copied third-party source exceptions accurate and explicitly unclaimed', () => {
    const repositorySourceFiles = new Set(REPOSITORY_SOURCE_FILES);

    for (const sourceFile of THIRD_PARTY_SOURCE_EXCEPTIONS) {
      expect(repositorySourceFiles.has(sourceFile), sourceFile).toBe(true);

      const sourceHeader = readSourceHeader(sourceFile);

      expect(
        sourceHeader.some(headerLine => SPDX_LICENSE_IDENTIFIER_PATTERN.test(headerLine)),
        `${sourceFile} no longer requires a third-party source exception`
      ).toBe(false);
      expect(
        sourceHeader.some(headerLine => SPDX_FILE_COPYRIGHT_TEXT_PATTERN.test(headerLine)),
        `${sourceFile} no longer requires a third-party source exception`
      ).toBe(false);
    }
  });

  test('retains valid MIT and ISC licensing and both owners for the Mapbox earcut derivative', () => {
    const sourceFile = 'modules/math-geoarrow/src/optimized-earcut.ts';
    const sourceHeader = readSourceHeader(sourceFile);

    expect(sourceHeader).toContain('// SPDX-License-Identifier: MIT AND ISC');
    expect(sourceHeader).toContain('// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors');
    expect(sourceHeader).toContain('// SPDX-FileCopyrightText: Copyright (c) 2016, Mapbox');
    expect(readFileSync(path.join(REPOSITORY_ROOT, sourceFile), 'utf8')).toContain(
      '  ISC License\n\n  Copyright (c) 2016, Mapbox'
    );
  });

  test.each(
    PBR_SHADER_SOURCE_FILES
  )('preserves both copyright owners and MIT licensing for %s', sourceFile => {
    const sourceHeader = readSourceHeader(sourceFile);
    const licenseIdentifiers = sourceHeader.filter(headerLine =>
      SPDX_LICENSE_IDENTIFIER_PATTERN.test(headerLine)
    );

    expect(licenseIdentifiers).toEqual(['// SPDX-License-Identifier: MIT']);
    expect(sourceHeader).toContain('// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors');
    expect(sourceHeader).toContain(
      '// SPDX-FileCopyrightText: Copyright (c) 2016-2017 Mohamad Moneimne and Contributors'
    );
  });
});
