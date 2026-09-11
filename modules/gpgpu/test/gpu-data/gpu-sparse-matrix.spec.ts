// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe,expect,it} from 'vitest';
import {GPUCOOMatrix,GPUCSRMatrix} from '../../src/gpu-data/gpu-sparse-matrix';
describe('GPU sparse matrix formats',()=>{it('exports COO and CSR data structures',()=>{expect(GPUCOOMatrix).toBeDefined();expect(GPUCSRMatrix).toBeDefined();});});
