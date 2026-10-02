// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import esbuild from 'esbuild';
import {describe, expect, test} from 'vitest';
import * as fontsModule from '../../src/fonts/index';
import * as textModule from '../../src/index';

describe('@luma.gl/text/fonts package boundary', () => {
  test('publishes the existing side-effect-free ESM, CommonJS, and types subpath', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      sideEffects?: boolean;
      exports?: Record<string, Record<string, string>>;
    };

    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.exports?.['./fonts']).toEqual({
      types: './dist/fonts/index.d.ts',
      import: './dist/fonts/index.js',
      require: './dist/fonts/index.cjs'
    });
  });

  test('exports CPU font preparation while preserving root compatibility', () => {
    for (const exportName of [
      'buildBitmapFontAtlas',
      'buildMapping',
      'buildMsdfFontAtlas',
      'buildSdfFontAtlas',
      'getCharacterAtlasPage',
      'getCharacterLayoutOffset',
      'getTextKerningOffset',
      'loadMsdfFontAtlas',
      'measureFontAtlasText',
      'nextPowOfTwo'
    ] as const) {
      expect(
        typeof fontsModule[exportName],
        `${exportName} is exported from the fonts subpath`
      ).toBe('function');
      expect(
        fontsModule[exportName],
        `${exportName} remains the same export on the text root`
      ).toBe(textModule[exportName]);
    }

    expect(typeof fontsModule.createTextKerning).toBe('function');
    expect(fontsModule.helvetiker.familyName).toBe('Helvetiker');
    expect('helvetiker' in textModule, 'bundled font data stays off the text root').toBe(false);
  });

  test('bundles without luma.gl, loaders.gl, or GPU implementation modules', async () => {
    const buildResult = await esbuild.build({
      entryPoints: [resolve('modules/text/src/fonts/index.ts')],
      bundle: true,
      format: 'esm',
      logLevel: 'silent',
      metafile: true,
      platform: 'browser',
      treeShaking: true,
      write: false
    });
    const bundledInputs = Object.keys(buildResult.metafile.inputs);
    const forbiddenInputs = bundledInputs.filter(
      input =>
        /node_modules\/@(?:luma|loaders)\.gl\//.test(input) ||
        /modules\/(?:core|engine|experimental|gpgpu)\//.test(input)
    );
    const bundledPackages = bundledInputs
      .filter(input => input.includes('node_modules/'))
      .map(input => input.split('node_modules/')[1]?.split('/').slice(0, 2).join('/'));

    expect(forbiddenInputs).toEqual([]);
    expect([...new Set(bundledPackages)]).toEqual(['@mapbox/tiny-sdf']);
  });
});
