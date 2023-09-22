// luma.gl, MIT license

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting-uniforms';
import {PHONG_GOURAUD_SHADER} from './phong-gouraud.glsl';

export type PhongMaterialProps = PhongMaterialUniforms;

export type PhongMaterialUniforms = {
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: [number, number, number];
}

export const gouraudLighting: ShaderModule<PhongMaterialProps, PhongMaterialUniforms> = {
  name: 'gouraud-lighting',
  dependencies: [lighting],
  vs: PHONG_GOURAUD_SHADER,
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
  defines: {
    LIGHTING_VERTEX: 1
  },
  getUniforms(props: PhongMaterialProps): PhongMaterialUniforms {
    return {...gouraudLighting.defaultUniforms, ...props};
  }
};

export const phongLighting: ShaderModule<PhongMaterialProps, PhongMaterialUniforms> = {
  ...gouraudLighting,
  name: 'phong-lighting',
  defines: {
    LIGHTING_FRAGMENT: 1
  }
};
