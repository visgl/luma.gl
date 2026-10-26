// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {expect, it} from 'vitest';
import {BUNDLE_SIZE_FIXTURES} from '../size/bundle-size.config.mjs';

it.each([
  'slang',
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
  }
});
