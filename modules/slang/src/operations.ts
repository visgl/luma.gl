// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderOperation} from './ir';

/** Canonical operations retain no source-language spelling in target mappings. */
export function emitIntrinsicName(
  operation: ShaderOperation | undefined,
  target: 'glsl' | 'wgsl'
): string | undefined {
  switch (operation) {
    case 'mix':
      return 'mix';
    case 'fract':
      return 'fract';
    case 'inverse-sqrt':
      return target === 'wgsl' ? 'inverseSqrt' : 'inversesqrt';
    case 'derivative-x':
      return target === 'wgsl' ? 'dpdx' : 'dFdx';
    case 'derivative-y':
      return target === 'wgsl' ? 'dpdy' : 'dFdy';
    case 'atan2':
      return target === 'wgsl' ? 'atan2' : 'atan';
    default:
      return undefined;
  }
}
