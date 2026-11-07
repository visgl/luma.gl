// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {expect, it} from 'vitest';
import {BUNDLE_SIZE_FIXTURES} from '../size/bundle-size.config.mjs';

it.each([
  'slang',
  'wgsl',
  'slang-luma'
])('slang#%s stays within its standalone browser bundle budget', async name => {
  const fixture = BUNDLE_SIZE_FIXTURES.find(fixture => fixture.name === name)!;
  const result = await build({
    entryPoints: [fixture.entry!],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    metafile: true
  });
  const bytes = result.outputFiles[0].contents;
  expect(bytes.byteLength).toBeLessThanOrEqual(fixture.maximum.minified);
  expect(gzipSync(bytes, {level: 9}).byteLength).toBeLessThanOrEqual(fixture.maximum.gzip);
  const inputs = Object.keys(result.metafile.inputs);
  expect(inputs.every(input => input.startsWith('modules/slang/src/'))).toBe(true);
  if (name === 'slang-luma') {
    expect(inputs).toEqual(['modules/slang/src/luma.ts']);
  } else {
    expect(inputs).not.toContain('modules/slang/src/luma.ts');
    if (name === 'wgsl') {
      for (const source of [
        'index',
        'parser',
        'lexer',
        'modules',
        'slang-interface',
        'slang-operations'
      ])
        expect(inputs).not.toContain(`modules/slang/src/${source}.ts`);
    } else {
      expect(inputs.some(input => /\/wgsl(?:-|\.)/.test(input))).toBe(false);
    }
  }
});

it('slang#combined frontends share compiler code and remain within their bundle budget', async () => {
  const result = await build({
    stdin: {
      contents:
        "export * from './modules/slang/src/index.ts'; export * from './modules/slang/src/wgsl.ts';",
      resolveDir: process.cwd()
    },
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false
  });
  const bytes = result.outputFiles[0].contents;
  expect(bytes.byteLength).toBeLessThanOrEqual(146_500);
  expect(gzipSync(bytes, {level: 9}).byteLength).toBeLessThanOrEqual(42_800);
});
