// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

/** Fits comfortably inside the minimum portable WebGL uniform-block limit. */
export const SKIN_MAX_JOINTS = 64;

export const source = /* wgsl */ `
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, ${SKIN_MAX_JOINTS}>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
}
`;

export const vs = /* glsl */ `\

layout(std140) uniform skinUniforms {
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
  /** Existing glTF scenegraph input retained for backwards compatibility. */
  scenegraphsFromGLTF?: any;
  /** Source skin selected when the scene contains more than one skeleton. */
  skinIndex?: number;
  /** Adapter-owned joint palette, already expressed in the skinned mesh's local space. */
  jointMatrices?: Float32Array | readonly number[];
  /** Optional mesh transform used to convert world-space joints into mesh-local space. */
  meshWorldMatrix?: readonly number[];
};

export type SkinUniforms = {
  jointMatrix?: any;
};

export const skin = {
  props: {} as SkinProps,
  uniforms: {} as SkinUniforms,

  name: 'skin',
  bindingLayout: [{name: 'skin', group: 0}],
  dependencies: [],
  source,
  vs,
  fs,

  defines: {
    SKIN_MAX_JOINTS
  },

  getUniforms: (props: SkinProps = {}, _previousUniforms?: SkinUniforms): SkinUniforms => {
    const {jointMatrices, scenegraphsFromGLTF, skinIndex = 0, meshWorldMatrix} = props;
    if (jointMatrices) {
      return {jointMatrix: makeJointPalette(jointMatrices)};
    }

    const sourceSkin = scenegraphsFromGLTF?.gltf?.skins?.[skinIndex];
    if (!sourceSkin) {
      return {jointMatrix: []};
    }

    const {inverseBindMatrices, joints, skeleton} = sourceSkin;
    const nodeMap = scenegraphsFromGLTF.gltfNodeIndexToNodeMap;
    const matrices = new Map<string, Matrix4>();
    const root = skeleton === undefined ? undefined : nodeMap?.get(skeleton);
    const roots = root ? [root] : scenegraphsFromGLTF.scenes || [];
    for (const sceneRoot of roots) {
      sceneRoot.preorderTraversal((node: {id: string}, {worldMatrix}: {worldMatrix: Matrix4}) => {
        matrices.set(node.id, worldMatrix);
      });
    }

    const inverseMeshMatrix = meshWorldMatrix ? new Matrix4(meshWorldMatrix).invert() : null;
    const jointPalette = new Float32Array(SKIN_MAX_JOINTS * 16);
    const inverseBindValues = inverseBindMatrices?.value;

    for (let jointIndex = 0; jointIndex < Math.min(joints.length, SKIN_MAX_JOINTS); jointIndex++) {
      const jointNode = nodeMap?.get(joints[jointIndex]);
      if (!jointNode) {
        continue;
      }

      const worldMatrix = matrices.get(jointNode.id) || jointNode.matrix;
      const jointMatrix = inverseMeshMatrix
        ? new Matrix4(inverseMeshMatrix).multiplyRight(worldMatrix)
        : new Matrix4(worldMatrix);
      if (inverseBindValues && inverseBindValues.length >= (jointIndex + 1) * 16) {
        jointMatrix.multiplyRight(
          new Matrix4(Array.from(inverseBindValues.slice(jointIndex * 16, (jointIndex + 1) * 16)))
        );
      }
      jointPalette.set(jointMatrix, jointIndex * 16);
    }

    return {jointMatrix: jointPalette};
  },

  uniformTypes: {
    jointMatrix: ['mat4x4<f32>', SKIN_MAX_JOINTS]
  }
} as const satisfies ShaderModule<SkinProps, SkinUniforms>;

function makeJointPalette(jointMatrices: Float32Array | readonly number[]): Float32Array {
  const jointPalette = new Float32Array(SKIN_MAX_JOINTS * 16);
  jointPalette.set(
    jointMatrices instanceof Float32Array
      ? jointMatrices.subarray(0, jointPalette.length)
      : jointMatrices.slice(0, jointPalette.length)
  );
  return jointPalette;
}
