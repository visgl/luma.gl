// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const SOURCE_DIRECTORY = new URL('../../modules/experimental/src/gpu-graph/', import.meta.url);
const DOCUMENTATION_URL = new URL(
  '../../docs/api-reference/experimental/gpu-graph-operations.md',
  import.meta.url
);
const EXPECTED_SOURCE_HEADER = [
  '// luma.gl',
  '// SPDX-License-Identifier: MIT',
  '// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors',
  '// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.'
].join('\n');

describe('GPU Graph RAPIDS attribution', () => {
  test('accurately attributes every independently written production source file', () => {
    const sourceFileNames = readdirSync(SOURCE_DIRECTORY)
      .filter(fileName => fileName.endsWith('.ts'))
      .sort();

    expect(sourceFileNames.length).toBeGreaterThan(0);

    for (const sourceFileName of sourceFileNames) {
      const source = readFileSync(new URL(sourceFileName, SOURCE_DIRECTORY), 'utf8');

      expect(source.startsWith(EXPECTED_SOURCE_HEADER), sourceFileName).toBe(true);
      expect(source).not.toContain('SPDX-License-Identifier: Apache-2.0');
      expect(source).not.toMatch(/SPDX-FileCopyrightText:.*NVIDIA/);
    }
  });

  test('documents upstream licensing without claiming copied code or endorsement', () => {
    const documentation = readFileSync(DOCUMENTATION_URL, 'utf8');

    expect(documentation.match(/^## Attribution and licensing$/gmu)).toHaveLength(1);
    expect(documentation).toContain('https://github.com/rapidsai/cugraph');
    expect(documentation).toContain('https://github.com/rapidsai/cugraph/blob/main/LICENSE');
    expect(documentation).toContain('[Apache License 2.0]');
    expect(documentation).toContain('[MIT-licensed]');
    expect(documentation).toContain('does not copy or translate cuGraph source code');
    expect(documentation).toContain('or CUDA implementations');
    expect(documentation).toContain('feature parity');
    expect(documentation).toContain('NVIDIA affiliation, or NVIDIA endorsement');
  });
});
