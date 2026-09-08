// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {resolve} from 'node:path';
import esbuild from 'esbuild';
import {expect, it} from 'vitest';

it('WebGL debug tools stay outside the normal adapter bundle', async () => {
  const sourceAliases = {
    name: 'webgl-source-alias',
    setup(build: esbuild.PluginBuild): void {
      build.onResolve({filter: /^@luma\.gl\/webgl$/}, () => ({
        path: resolve('modules/webgl/src/index.ts')
      }));
    }
  };
  const buildResult = await esbuild.build({
    stdin: {
      contents: "export {webgl2Adapter} from '@luma.gl/webgl';",
      resolveDir: process.cwd()
    },
    bundle: true,
    external: ['@luma.gl/core'],
    format: 'esm',
    logLevel: 'silent',
    metafile: true,
    plugins: [sourceAliases],
    treeShaking: true,
    write: false
  });
  const bundledInputs = Object.keys(buildResult.metafile.inputs);

  expect(
    bundledInputs.some(path => path.endsWith('/webgl-developer-tools.ts')),
    'adapter bundle excludes WebGLDeveloperTools'
  ).toBe(false);
  expect(
    bundledInputs.some(path => path.endsWith('/spector.ts')),
    'adapter bundle excludes Spector integration'
  ).toBe(false);
  expect(
    bundledInputs.some(path => path.endsWith('/debug-hooks.ts')),
    'adapter bundle retains only lightweight registration hooks'
  ).toBe(true);
});
