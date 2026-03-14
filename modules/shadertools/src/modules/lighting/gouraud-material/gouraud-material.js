// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { lighting } from '../lights/lighting';
import { PHONG_VS, PHONG_FS } from '../phong-material/phong-shaders-glsl';
import { PHONG_WGSL } from '../phong-material/phong-shaders-wgsl';
/** In Gouraud shading, color is calculated for each triangle vertex normal, and then color is interpolated colors across the triangle */
export const gouraudMaterial = {
    props: {},
    name: 'gouraudMaterial',
    // Note these are switched between phong and gouraud
    vs: PHONG_FS.replace('phongMaterial', 'gouraudMaterial'),
    fs: PHONG_VS.replace('phongMaterial', 'gouraudMaterial'),
    source: PHONG_WGSL.replaceAll('phongMaterial', 'gouraudMaterial'),
    defines: {
        LIGHTING_VERTEX: true
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
    getUniforms(props) {
        const uniforms = { ...props };
        if (uniforms.specularColor) {
            uniforms.specularColor = uniforms.specularColor.map(x => x / 255);
        }
        return { ...gouraudMaterial.defaultUniforms, ...uniforms };
    }
};
