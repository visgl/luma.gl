// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUValueArena} from '../../src/gpu-core/gpu-value-arena';

describe('GPUValueArena', () => {
  it('exports the packed value arena', () => {
    expect(GPUValueArena).toBeDefined();
  });
});
