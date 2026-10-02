// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect, test} from 'vitest';

test('gpu-core execution stays independent of Computation and shader assembly policy', () => {
  const root = resolve('modules/gpgpu/src/gpu-core');
  const violations: string[] = [];
  for (const file of readdirSync(root, {recursive: true})) {
    if (typeof file !== 'string' || !file.endsWith('.ts')) continue;
    const source = readFileSync(resolve(root, file), 'utf8');
    if (/\b(?:Computation|ShaderInputs|UniformStore|ShaderAssembler)\b/.test(source)) {
      violations.push(file);
    }
  }
  expect(violations).toEqual([]);
});
