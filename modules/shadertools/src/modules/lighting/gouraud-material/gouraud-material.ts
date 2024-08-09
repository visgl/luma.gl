// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray3} from '@math.gl/types';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting';
import {PHONG_VS, PHONG_FS} from '../phong-material/phong-shaders-glsl';

export type GouraudMaterialProps = {
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: [number, number, number];
};

/** In Gouraud shading, color is calculated for each triangle vertex normal, and then color is interpolated colors across the triangle */
export const gouraudMaterial: ShaderModule<GouraudMaterialProps> = {
  props: {} as GouraudMaterialProps,

  name: 'gouraudMaterial',
  // Note these are switched between phong and gouraud
  vs: PHONG_FS.replace('phongMaterial', 'gouraudMaterial'),
  fs: PHONG_VS.replace('phongMaterial', 'gouraudMaterial'),
  defines: {
    LIGHTING_VERTEX: 1
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

  getUniforms(props: GouraudMaterialProps) {
    const uniforms = {...props};
    if (uniforms.specularColor) {
      uniforms.specularColor = uniforms.specularColor.map(x => x / 255) as NumberArray3;
    }
    return {...gouraudMaterial.defaultUniforms, ...uniforms};
  }
};
