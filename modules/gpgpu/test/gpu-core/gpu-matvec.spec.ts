// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUMatVec} from '../../src/gpu-core/gpu-matvec';

describe('GPUMatVec', () => {
  it('exports a graph primitive', () => {
    expect(GPUMatVec).toBeDefined();
  });
});
