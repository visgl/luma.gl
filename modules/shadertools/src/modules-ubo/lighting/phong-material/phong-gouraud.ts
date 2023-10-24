// luma.gl, MIT license
// Copyright (c) 2020 OpenJS Foundation
// Copyright (c) vis.gl contributors

import {ShaderModule} from '../../../lib/shader-module/shader-module';
import {lighting} from '../lights/lighting-uniforms';
import {PHONG_GOURAUD_SHADER, PHONG_GOURAUD_UNIFORMS} from './phong-gouraud.glsl';

export type PhongMaterialProps = PhongMaterialUniforms;

export type PhongMaterialUniforms = {
  ambient?: number;
  diffuse?: number;
  /** Specularity exponent */
  shininess?: number;
  specularColor?: [number, number, number];
}

export const pgMaterial: ShaderModule<PhongMaterialProps, PhongMaterialUniforms> = {
  name: 'gouraud-lighting',
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
  defines: {
    LIGHTING_VERTEX: 1
  },
  getUniforms(props: PhongMaterialProps): PhongMaterialUniforms {
    return {...pgMaterial.defaultUniforms, ...props};
  }
};

/** In Gouraud shading, color is calculated for each triangle vertex normal, and then color is interpolated colors across the triangle */
export const gouraudMaterial: ShaderModule<PhongMaterialProps, PhongMaterialUniforms> = {
  ...pgMaterial,
  name: 'gouraud-lighting',
  vs: PHONG_GOURAUD_SHADER,
  fs: PHONG_GOURAUD_UNIFORMS,
  defines: {
    LIGHTING_FRAGMENT: 1
  }
};

/** In Phong shading, the normal vector is linearly interpolated across the surface of the polygon from the polygon's vertex normals. */
export const phongMaterial: ShaderModule<PhongMaterialProps, PhongMaterialUniforms> = {
  ...pgMaterial,
  name: 'phong-lighting',
  vs: PHONG_GOURAUD_UNIFORMS,
  fs: PHONG_GOURAUD_SHADER,
  defines: {
    LIGHTING_FRAGMENT: 1
  }
};
