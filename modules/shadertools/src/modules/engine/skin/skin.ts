// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

const SKIN_MAX_JOINTS = 20;

export const vs = /* glsl */ `\

uniform skinUniforms {
  mat4 jointMatrix[SKIN_MAX_JOINTS];
} skin;

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}

`;

export const fs = /* glsl */ `\
`;

export type SkinProps = {
  scenegraphsFromGLTF?: any;
};

export type SkinUniforms = {
  jointMatrix?: any;
};

export const skin = {
  props: {} as SkinProps,
  uniforms: {} as SkinUniforms,

  name: 'skin',
  dependencies: [],
  // source: '', // TODO: IMPLEMENT WEBGPU SHADER
  vs,
  fs,

  defines: {
    SKIN_MAX_JOINTS
  },

  getUniforms: (props: SkinProps = {}, prevUniforms?: SkinUniforms): SkinUniforms => {
    const {scenegraphsFromGLTF} = props;

    if (!scenegraphsFromGLTF?.gltf?.skins?.[0]) {
      return {jointMatrix: []};
    }

    const {inverseBindMatrices, joints, skeleton} = scenegraphsFromGLTF.gltf.skins[0];

    const matsib = [];
    const countib = inverseBindMatrices.value.length / 16;
    for (let i = 0; i < countib; i++) {
      const slice = inverseBindMatrices.value.subarray(i * 16, i * 16 + 16);
      matsib.push(new Matrix4(Array.from(slice)));
    }

    const top = scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(skeleton);
    const matrices: Record<string, Matrix4> = {};
    top.preorderTraversal((node: any, {worldMatrix}: any) => {
      matrices[node.id] = worldMatrix;
    });

    const mats = new Float32Array(SKIN_MAX_JOINTS * 16); // 16 floats per 4x4 matrix
    for (let i = 0; i < SKIN_MAX_JOINTS; ++i) {
      const nodeIndex = joints[i];
      if (nodeIndex === undefined) break;

      const worldMat = matrices[scenegraphsFromGLTF.gltfNodeIndexToNodeMap.get(nodeIndex).id];
      const invBindMat = matsib[i];

      const Z = new Matrix4().copy(worldMat).multiplyRight(invBindMat);

      const off = i * 16;

      for (let j = 0; j < 16; j++) {
        mats[off + j] = Z[j];
      }
    }

    return {
      jointMatrix: mats
    };
  },

  uniformTypes: {
    jointMatrix: 'mat4x4<f32>'
  },
  uniformSizes: {
    jointMatrix: SKIN_MAX_JOINTS
  }
} as const satisfies ShaderModule<SkinProps, SkinUniforms>;
