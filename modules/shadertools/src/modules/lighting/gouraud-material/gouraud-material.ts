// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumberArray3} from '@math.gl/types';
import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {floatColors} from '../../color/float-colors';
import {lighting} from '../lights/lighting';
import {PHONG_VS, PHONG_FS} from '../phong-material/phong-shaders-glsl';
import {PHONG_WGSL} from '../phong-material/phong-shaders-wgsl';

export type GouraudMaterialProps = {
  unlit?: boolean;
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: [number, number, number];
};

const DEFAULT_SPECULAR_COLOR: NumberArray3 = [38.25, 38.25, 38.25];

/** In Gouraud shading, color is calculated for each triangle vertex normal, and then color is interpolated colors across the triangle */
export const gouraudMaterial: ShaderModule<GouraudMaterialProps> = {
  props: {} as GouraudMaterialProps,

  name: 'gouraudMaterial',
  bindingLayout: [{name: 'gouraudMaterial', group: 3}],
  // Note these are switched between phong and gouraud
  vs: PHONG_FS.replace('phongMaterial', 'gouraudMaterial'),
  fs: PHONG_VS.replace('phongMaterial', 'gouraudMaterial'),
  source: PHONG_WGSL.replaceAll('phongMaterial', 'gouraudMaterial'),
  defines: {
    LIGHTING_VERTEX: true
  },
  dependencies: [lighting, floatColors],
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

  getUniforms(props: GouraudMaterialProps) {
    return {...gouraudMaterial.defaultUniforms, ...props};
  }
};
