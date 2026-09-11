// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUSpMV} from '../../src/gpu-core/gpu-spmv';

describe('GPUSpMV', () => {
  it('exports a graph primitive', () => {
    expect(GPUSpMV).toBeDefined();
  });
});
