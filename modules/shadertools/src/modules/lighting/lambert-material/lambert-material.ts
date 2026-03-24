// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {LAMBERT_WGSL} from './lambert-shaders-wgsl';
import {LAMBERT_VS, LAMBERT_FS} from './lambert-shaders-glsl';

/** Uniform props for the built-in diffuse-only Lambert material model. */
export type LambertMaterialProps = {
  unlit?: boolean;
  ambient?: number;
  diffuse?: number;
};

/** A matte material model that applies diffuse-only Lambert lighting per fragment. */
export const lambertMaterial: ShaderModule<LambertMaterialProps> = {
  name: 'lambertMaterial',
  firstBindingSlot: 0,
  bindingLayout: [{name: 'lambertMaterial', group: 3}],
  dependencies: [lighting],
  source: LAMBERT_WGSL,
  vs: LAMBERT_VS,
  fs: LAMBERT_FS,
  defines: {
    LIGHTING_FRAGMENT: true
  },
  uniformTypes: {
    unlit: 'i32',
    ambient: 'f32',
    diffuse: 'f32'
  },
  defaultUniforms: {
    unlit: false,
    ambient: 0.35,
    diffuse: 0.6
  },
  getUniforms(props?: LambertMaterialProps) {
    return {...lambertMaterial.defaultUniforms, ...props};
  }
};
