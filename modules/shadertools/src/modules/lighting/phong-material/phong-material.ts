// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting-uniforms';
import {PHONG_VS, PHONG_FS} from './phong-shaders-glsl';
import type {NumberArray3} from '../../../lib/utils/uniform-types';

export type PhongMaterialProps = {
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: NumberArray3;
};

/** In Phong shading, the normal vector is linearly interpolated across the surface of the polygon from the polygon's vertex normals. */
export const phongMaterial: ShaderModule<PhongMaterialProps> = {
  name: 'phongMaterial',
  // Note these are switched between phong and gouraud
  vs: PHONG_VS,
  fs: PHONG_FS,
  defines: {
    LIGHTING_FRAGMENT: 1
  },
  dependencies: [lighting],
  uniformTypes: {
    ambient: 'f32',
    diffuse: 'f32',
    shininess: 'f32',
    specularColor: 'vec3<f32>'
  },
  defaultUniforms: {
    ambient: 0.35,
    diffuse: 0.6,
    shininess: 32,
    specularColor: [0.15, 0.15, 0.15]
  },
  getUniforms(props?: PhongMaterialProps) {
    const uniforms = {...props};
    if (uniforms.specularColor) {
      uniforms.specularColor = uniforms.specularColor.map(x => x / 255) as NumberArray3;
    }
    return {...phongMaterial.defaultUniforms, ...uniforms};
  }
};
