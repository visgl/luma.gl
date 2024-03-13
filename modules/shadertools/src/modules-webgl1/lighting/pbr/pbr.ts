// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {lights} from '../lights/lights';

import {vs} from './pbr-vertex-glsl';
import {fs} from './pbr-fragment-glsl';

/**
 * An implementation of PBR (Physically-Based Rendering).
 * Physically Based Shading of a microfacet surface defined by a glTF material.
 */
export const pbr = {
  name: 'pbr',
  vs,
  fs,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  dependencies: [lights],
  getUniforms: (props: any) => props
};
