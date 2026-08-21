// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Matrix4} from '@math.gl/core';

import {ShaderModule} from '../../../lib/shader-module/shader-module';

/** Fits comfortably inside the minimum portable WebGL uniform-block limit. */
export const SKIN_MAX_JOINTS = 64;

export const source = /* wgsl */ `
struct skinUniforms {
  jointMatrix: array<mat4x4<f32>, ${SKIN_MAX_JOINTS}>,
};

@group(0) @binding(auto) var<uniform> skin: skinUniforms;

#ifdef HAS_INSTANCED_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;

fn getInstancedSkinMatrix(
  weights: vec4f,
  joints: vec4u,
  instanceIndex: u32,
  jointsPerInstance: u32
) -> mat4x4<f32> {
  let firstJoint = instanceIndex * jointsPerInstance;
  return (weights.x * skinJointMatrices[firstJoint + joints.x])
       + (weights.y * skinJointMatrices[firstJoint + joints.y])
       + (weights.z * skinJointMatrices[firstJoint + joints.z])
       + (weights.w * skinJointMatrices[firstJoint + joints.w]);
}
#else
#ifdef HAS_LARGE_SKIN
@group(0) @binding(auto) var<storage, read> skinJointMatrices: array<mat4x4<f32>>;
#endif
#endif

fn getSkinMatrix(weights: vec4f, joints: vec4u) -> mat4x4<f32> {
#ifdef HAS_LARGE_SKIN
  return (weights.x * skinJointMatrices[joints.x])
       + (weights.y * skinJointMatrices[joints.y])
       + (weights.z * skinJointMatrices[joints.z])
       + (weights.w * skinJointMatrices[joints.w]);
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
}
`;

export const vs = /* glsl */ `\

layout(std140) uniform skinUniforms {
  mat4 jointMatrix[SKIN_MAX_JOINTS];
} skin;

#ifdef HAS_INSTANCED_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getInstancedJointMatrix(uint jointIndex, uint instanceIndex) {
  int firstColumn = int(jointIndex * 4u);
  int row = int(instanceIndex);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, row), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, row), 0)
  );
}

mat4 getInstancedSkinMatrix(
  vec4 weights,
  uvec4 joints,
  uint instanceIndex,
  uint jointsPerInstance
) {
  return (weights.x * getInstancedJointMatrix(joints.x, instanceIndex))
       + (weights.y * getInstancedJointMatrix(joints.y, instanceIndex))
       + (weights.z * getInstancedJointMatrix(joints.z, instanceIndex))
       + (weights.w * getInstancedJointMatrix(joints.w, instanceIndex));
}
#else
#ifdef HAS_LARGE_SKIN
uniform highp sampler2D skinJointMatrices;

mat4 getSkinJointMatrix(uint jointIndex) {
  int firstColumn = int(jointIndex * 4u);
  return mat4(
    texelFetch(skinJointMatrices, ivec2(firstColumn, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 1, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 2, 0), 0),
    texelFetch(skinJointMatrices, ivec2(firstColumn + 3, 0), 0)
  );
}
#endif
#endif

mat4 getSkinMatrix(vec4 weights, uvec4 joints) {
#ifdef HAS_LARGE_SKIN
  return (weights.x * getSkinJointMatrix(joints.x))
       + (weights.y * getSkinJointMatrix(joints.y))
       + (weights.z * getSkinJointMatrix(joints.z))
       + (weights.w * getSkinJointMatrix(joints.w));
#else
  return (weights.x * skin.jointMatrix[joints.x])
       + (weights.y * skin.jointMatrix[joints.y])
       + (weights.z * skin.jointMatrix[joints.z])
       + (weights.w * skin.jointMatrix[joints.w]);
#endif
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
  /** Instance-packed joint palettes: WebGPU storage buffer or WebGL float texture. */
  skinJointMatrices?: Binding;
  /** Optional mesh transform used to convert world-space joints into mesh-local space. */
  meshWorldMatrix?: readonly number[];
};

export type SkinUniforms = {
  jointMatrix?: any;
};

type SkinBindings = {
  /** WebGPU read-only storage or WebGL vertex-sampled float texture. */
  skinJointMatrices?: Binding;
};

export const skin = {
  props: {} as SkinProps,
  uniforms: {} as SkinUniforms,
  bindings: {} as SkinBindings,

  name: 'skin',
  bindingLayout: [
    {name: 'skin', group: 0},
    {name: 'skinJointMatrices', group: 0, visibility: 1}
  ],
  dependencies: [],
  source,
  vs,
  fs,

  defines: {
    SKIN_MAX_JOINTS
  },

  getUniforms: (
    props: SkinProps = {},
    _previousUniforms?: SkinUniforms
  ): SkinUniforms & SkinBindings => {
    const {
      jointMatrices,
      skinJointMatrices,
      scenegraphsFromGLTF,
      skinIndex = 0,
      meshWorldMatrix
    } = props;
    const bindings = skinJointMatrices ? {skinJointMatrices} : {};
    if (jointMatrices) {
      return {jointMatrix: makeJointPalette(jointMatrices), ...bindings};
    }

    const sourceSkin = scenegraphsFromGLTF?.gltf?.skins?.[skinIndex];
    if (!sourceSkin) {
      return {jointMatrix: [], ...bindings};
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

    return {jointMatrix: jointPalette, ...bindings};
  },

  uniformTypes: {
    jointMatrix: ['mat4x4<f32>', SKIN_MAX_JOINTS]
  }
} as const satisfies ShaderModule<SkinProps, SkinUniforms, SkinBindings>;

function makeJointPalette(jointMatrices: Float32Array | readonly number[]): Float32Array {
  const jointPalette = new Float32Array(SKIN_MAX_JOINTS * 16);
  jointPalette.set(
    jointMatrices instanceof Float32Array
      ? jointMatrices.subarray(0, jointPalette.length)
      : jointMatrices.slice(0, jointPalette.length)
  );
  return jointPalette;
}
