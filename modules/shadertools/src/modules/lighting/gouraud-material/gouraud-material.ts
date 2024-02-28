// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting-uniforms';
import {GOURAUD_VS, GOURAUD_FS} from './gouraud-shaders-glsl';

export type GouraudMaterialProps = GouraudMaterialUniforms;

export type GouraudMaterialUniforms = {
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: [number, number, number];
};

/** In Gouraud shading, color is calculated for each triangle vertex normal, and then color is interpolated colors across the triangle */
export const gouraudMaterial: ShaderModule<GouraudMaterialProps, GouraudMaterialUniforms> = {
  name: 'gouraud-lighting',
  // Note these are switched between phong and gouraud
  vs: GOURAUD_VS,
  fs: GOURAUD_FS,
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
  getUniforms(props: GouraudMaterialProps): GouraudMaterialUniforms {
    return {...gouraudMaterial.defaultUniforms, ...props};
  }
};
