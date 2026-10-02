// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUElementwise} from '../../src/gpu-core/gpu-elementwise';

describe('GPUElementwise', () => {
  it('exports a graph primitive', () => {
    expect(GPUElementwise).toBeDefined();
  });
});
