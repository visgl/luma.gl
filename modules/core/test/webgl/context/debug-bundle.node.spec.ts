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
      build.onResolve({filter: /^@luma\.gl\/core\/webgl$/}, () => ({
        path: resolve('modules/core/src/webgl/index.ts')
      }));
    }
  };
  const buildResult = await esbuild.build({
    stdin: {
      contents: "export {webgl2Adapter} from '@luma.gl/core/webgl';",
      resolveDir: process.cwd()
    },
    bundle: true,
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

it('explicit WebGL debug imports retain their registration side effects', async () => {
  const buildResult = await esbuild.build({
    stdin: {
      contents: "import '@luma.gl/core/webgl/debug';",
      resolveDir: process.cwd()
    },
    bundle: true,
    format: 'esm',
    logLevel: 'silent',
    plugins: [
      {
        name: 'webgl-debug-source-alias',
        setup(build: esbuild.PluginBuild): void {
          build.onResolve({filter: /^@luma\.gl\/core\/webgl\/debug$/}, () => ({
            path: resolve('modules/core/src/webgl/debug.ts')
          }));
        }
      }
    ],
    treeShaking: true,
    write: false
  });
  const bundledSource = buildResult.outputFiles[0].text;
  expect(bundledSource).toContain('registerWebGLDeveloperTools({');
  expect(bundledSource).toContain('registerSpectorJS({');
});
