// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray3} from '@math.gl/types';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {floatColors} from '../../color/float-colors';
import {lighting} from '../lights/lighting';
import {PHONG_WGSL} from './phong-shaders-wgsl';
import {PHONG_VS, PHONG_FS} from './phong-shaders-glsl';

export type PhongMaterialProps = {
  unlit?: boolean;
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: NumberArray3;
};

const DEFAULT_SPECULAR_COLOR: NumberArray3 = [38.25, 38.25, 38.25];

/** In Phong shading, the normal vector is linearly interpolated across the surface of the polygon from the polygon's vertex normals. */
export const phongMaterial: ShaderModule<PhongMaterialProps> = {
  name: 'phongMaterial',
  firstBindingSlot: 0,
  bindingLayout: [{name: 'phongMaterial', group: 3}],
  dependencies: [lighting, floatColors],
  // Note these are switched between phong and gouraud
  source: PHONG_WGSL,
  vs: PHONG_VS,
  fs: PHONG_FS,
  defines: {
    LIGHTING_FRAGMENT: true
  },
  uniformTypes: {
    unlit: 'i32',
    ambient: 'f32',
    diffuse: 'f32',
    shininess: 'f32',
    specularColor: 'vec3<f32>'
  },
  defaultUniforms: {
    unlit: false,
    ambient: 0.35,
    diffuse: 0.6,
    shininess: 32,
    specularColor: DEFAULT_SPECULAR_COLOR
  },
  getUniforms(props?: PhongMaterialProps) {
    return {...phongMaterial.defaultUniforms, ...props};
  }
};
