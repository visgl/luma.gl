// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {resolve} from 'node:path';
import esbuild from 'esbuild';
import test from 'test/utils/vitest-tape';

test('WebGL debug tools stay outside the normal adapter bundle', async t => {
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

  t.notOk(
    bundledInputs.some(path => path.endsWith('/webgl-developer-tools.ts')),
    'adapter bundle excludes WebGLDeveloperTools'
  );
  t.notOk(
    bundledInputs.some(path => path.endsWith('/spector.ts')),
    'adapter bundle excludes Spector integration'
  );
  t.ok(
    bundledInputs.some(path => path.endsWith('/debug-hooks.ts')),
    'adapter bundle retains only lightweight registration hooks'
  );
  t.end();
});
