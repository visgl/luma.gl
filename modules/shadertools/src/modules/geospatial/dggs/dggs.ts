// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../../lib/shader-module/shader-module';
import {dggsWGSL} from './dggs-wgsl';

/** WGSL helpers for 64-bit DGGS cell IDs encoded as two u32 words. */
export const dggs = {
  name: 'dggs',
  source: dggsWGSL
} as const satisfies ShaderModule<{}, {}>;
