// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const LUDF_SOURCE_DIRECTORY = new URL('../../modules/experimental/src/ludf/', import.meta.url);
const LUDF_DOCUMENTATION = new URL(
  '../../docs/api-reference/experimental/ludf.md',
  import.meta.url
);
const LUDF_SOURCE_FILES = readdirSync(LUDF_SOURCE_DIRECTORY)
  .filter(fileName => fileName.endsWith('.ts'))
  .sort();
const LUDF_SPDX_HEADER = [
  '// luma.gl',
  '// SPDX-License-Identifier: MIT',
  '// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors',
  '// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.'
].join('\n');

describe('luDF RAPIDS attribution and independent MIT licensing', () => {
  test('discovers every production TypeScript implementation', () => {
    expect(LUDF_SOURCE_FILES.length).toBeGreaterThan(0);
    expect(LUDF_SOURCE_FILES).toContain('index.ts');
    expect(LUDF_SOURCE_FILES).toContain('lu-data-frame.ts');
  });

  test.each(LUDF_SOURCE_FILES)('preserves accurate SPDX attribution in %s', fileName => {
    const source = readFileSync(new URL(fileName, LUDF_SOURCE_DIRECTORY), 'utf8');

    expect(source.startsWith(`${LUDF_SPDX_HEADER}\n`)).toBe(true);
    expect(source).not.toMatch(/^\/\/ SPDX-FileCopyrightText:.*NVIDIA/m);
    expect(source).not.toMatch(/^\/\/ SPDX-License-Identifier:.*Apache-2\.0/m);
  });

  test('documents the distinct upstream Apache and original vis.gl MIT licenses', () => {
    const documentation = readFileSync(LUDF_DOCUMENTATION, 'utf8');

    expect(documentation).toContain('## Attribution and licensing');
    expect(documentation).toContain('https://github.com/rapidsai/cudf');
    expect(documentation).toContain('https://github.com/rapidsai/cudf/blob/main/LICENSE');
    expect(documentation).toContain('https://github.com/visgl/luma.gl/blob/master/LICENSE');
    expect(documentation).toContain('Apache License 2.0');
    expect(documentation).toContain('MIT-licensed');
    expect(documentation).toContain('does not copy or translate cuDF source code');
    expect(documentation).toContain('including CUDA or Python implementations');
    expect(documentation).toContain('neither affiliated with nor endorsed by NVIDIA');
    expect(documentation).toContain('feature parity');
  });
});
