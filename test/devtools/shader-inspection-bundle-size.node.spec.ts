// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {expect, it} from 'vitest';
import {BUNDLE_SIZE_FIXTURES} from '../size/bundle-size.config.mjs';

it.each([
  'wgsl-inspect',
  'glsl-inspect',
  'shader-inspect',
  'core-wgsl-scan'
])('inspection#%s stays within its standalone bundle budget', async name => {
  const fixture = BUNDLE_SIZE_FIXTURES.find(value => value.name === name)!;
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
  expect(bytes.length).toBeLessThanOrEqual(fixture.maximum.minified);
  expect(gzipSync(bytes, {level: 9}).length).toBeLessThanOrEqual(fixture.maximum.gzip);
  const included = Object.values(result.metafile.outputs).flatMap(output =>
    Object.entries(output.inputs)
      .filter(([, value]) => value.bytesInOutput > 0)
      .map(([path]) => path)
  );
  for (const file of [
    'emitter',
    'wgsl-analysis',
    'wgsl-layout',
    'wgsl-builtins',
    'parser',
    'modules',
    'slang-operations'
  ])
    expect(included).not.toContain(`modules/slang/src/${file}.ts`);
  if (name === 'wgsl-inspect') {
    expect(included).not.toContain('modules/slang/src/glsl-inspect.ts');
    expect(included).not.toContain('modules/slang/src/lexer.ts');
  }
  if (name === 'glsl-inspect') expect(included).not.toContain('modules/slang/src/wgsl-parser.ts');
});
