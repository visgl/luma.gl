// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
const uniformBlock = /* glsl */ `\
uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`;
export const pbrProjection = {
    name: 'pbrProjection',
    vs: uniformBlock,
    fs: uniformBlock,
    // TODO why is this needed?
    getUniforms: props => props,
    uniformTypes: {
        modelViewProjectionMatrix: 'mat4x4<f32>',
        modelMatrix: 'mat4x4<f32>',
        normalMatrix: 'mat4x4<f32>',
        camera: 'vec3<i32>'
    }
};
