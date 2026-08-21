// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readdirSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const SOURCE_DIRECTORY = new URL('../../modules/gpgpu/src/gpu-graph/', import.meta.url);
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
});
