// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {GroupNode, ShaderInputs} from '@luma.gl/engine';
import {
  assembleGLSLShaderPair,
  SKIN_MAX_JOINTS,
  skin,
  WGSLShaderAssembler,
  type PlatformInfo
} from '@luma.gl/shadertools';
import {getWebGLTestDevice, getWebGPUTestDevice, NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

const WGSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgpu',
  gpu: 'test-gpu',
  shaderLanguage: 'wgsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('shadertools#skin returns empty uniforms without a glTF skin', () => {
  expect(
    skin.getUniforms({
      scenegraphsFromGLTF: {
        gltf: {}
      }
    }),
    'Returns an empty joint matrix when no skin data is available'
  ).toEqual({jointMatrix: []});

  void 0;
});

it('shadertools#skin packs joint matrices from the scenegraph', () => {
  const skeletonRootNode = new GroupNode({id: 'skeleton-root', position: [1, 0, 0]});
  const jointNode = new GroupNode({id: 'joint-0', position: [0, 2, 0]});
  skeletonRootNode.add(jointNode);

  const expectedJointMatrix = new Matrix4(skeletonRootNode.matrix).multiplyRight(jointNode.matrix);
  const inverseBindMatrices = new Float32Array(Array.from(new Matrix4()));

  const uniforms = skin.getUniforms({
    scenegraphsFromGLTF: {
      gltf: {
        skins: [
          {
            inverseBindMatrices: {value: inverseBindMatrices},
            joints: [1],
            skeleton: 0
          }
        ]
      },
      gltfNodeIndexToNodeMap: new Map([
        [0, skeletonRootNode],
        [1, jointNode]
      ])
    }
  });

  expect(
    Boolean(uniforms.jointMatrix instanceof Float32Array),
    'Returns a packed joint matrix buffer'
  ).toBe(true);
  expect(
    Array.from(uniforms.jointMatrix!.slice(0, 16)),
    'Writes the world matrix for the first joint'
  ).toEqual(Array.from(expectedJointMatrix));
  expect(
    Array.from(uniforms.jointMatrix!.slice(16, 32)),
    'Leaves unused joint matrix slots zeroed'
  ).toEqual(Array.from(new Float32Array(16)));

  void 0;
});

it('shadertools#skin supports Fox-sized skeletons beyond the previous 20-joint limit', () => {
  const skeletonRoot = new GroupNode({id: 'skeleton-root'});
  const nodes = new Map<number, GroupNode>([[0, skeletonRoot]]);
  const joints: number[] = [];
  for (let jointIndex = 0; jointIndex < 24; jointIndex++) {
    const nodeIndex = jointIndex + 1;
    const joint = new GroupNode({id: `joint-${jointIndex}`, position: [nodeIndex, 0, 0]});
    skeletonRoot.add(joint);
    nodes.set(nodeIndex, joint);
    joints.push(nodeIndex);
  }

  const uniforms = skin.getUniforms({
    scenegraphsFromGLTF: {
      gltf: {skins: [{joints, skeleton: 0}]},
      gltfNodeIndexToNodeMap: nodes
    }
  });

  expect(uniforms.jointMatrix?.length, 'allocates a portable joint palette').toBe(
    SKIN_MAX_JOINTS * 16
  );
  expect(uniforms.jointMatrix?.[23 * 16 + 12], 'retains the final Fox-sized skeleton joint').toBe(
    24
  );
  void 0;
});

it('shadertools#skin selects independent skins and defaults missing bind matrices', () => {
  const firstRoot = new GroupNode({id: 'first-root', position: [3, 0, 0]});
  const firstJoint = new GroupNode({id: 'first-joint', position: [1, 0, 0]});
  firstRoot.add(firstJoint);
  const secondRoot = new GroupNode({id: 'second-root', position: [10, 0, 0]});
  const secondJoint = new GroupNode({id: 'second-joint', position: [2, 0, 0]});
  secondRoot.add(secondJoint);

  const uniforms = skin.getUniforms({
    skinIndex: 1,
    meshWorldMatrix: new Matrix4().translate([10, 0, 0]),
    scenegraphsFromGLTF: {
      gltf: {skins: [{joints: [1], skeleton: 0}, {joints: [3]}]},
      scenes: [firstRoot, secondRoot],
      gltfNodeIndexToNodeMap: new Map([
        [0, firstRoot],
        [1, firstJoint],
        [2, secondRoot],
        [3, secondJoint]
      ])
    }
  });

  expect(uniforms.jointMatrix?.[12], 'selects the requested skin in mesh-local space').toBe(2);
  void 0;
});

it('shadertools#skin accepts a format-independent precomputed joint palette', () => {
  const jointMatrices = new Float32Array(new Matrix4().translate([7, 0, 0]));
  const uniforms = skin.getUniforms({jointMatrices});

  expect(uniforms.jointMatrix?.[12], 'preserves precomputed joint transforms').toBe(7);
  expect(uniforms.jointMatrix?.length, 'pads the uniform palette').toBe(SKIN_MAX_JOINTS * 16);
  void 0;
});

it('shadertools#skin keeps instance palettes feature-specialized in WGSL', async () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const source = /* wgsl */ `
@vertex
fn vertexMain(@builtin(instance_index) instanceIndex: u32) -> @builtin(position) vec4f {
#ifdef HAS_INSTANCED_SKIN
  return getInstancedSkinMatrix(vec4f(1.0, 0.0, 0.0, 0.0), vec4u(0u), instanceIndex, 2u)
    * vec4f(0.0, 0.0, 0.0, 1.0);
#else
  return getSkinMatrix(vec4f(1.0, 0.0, 0.0, 0.0), vec4u(0u))
    * vec4f(0.0, 0.0, 0.0, 1.0);
#endif
}`;
  const uninstancedShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source,
    modules: [skin]
  });
  const instancedShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source,
    modules: [skin],
    defines: {HAS_INSTANCED_SKIN: true}
  });

  expect(
    Boolean(uninstancedShader.bindingTable.some(binding => binding.name === 'skinJointMatrices')),
    'ordinary skinning requires no crowd storage binding'
  ).toBe(false);
  expect(
    Boolean(uninstancedShader.source.includes('getInstancedSkinMatrix')),
    'ordinary shaders exclude crowd skinning helpers'
  ).toBe(false);
  expect(
    Boolean(
      instancedShader.bindingTable.some(
        binding => binding.name === 'skinJointMatrices' && binding.kind === 'read-only-storage'
      )
    ),
    'instanced WebGPU skinning uses read-only packed matrix storage'
  ).toBe(true);
  expect(
    Boolean(instancedShader.source.includes('instanceIndex * jointsPerInstance')),
    'each drawn instance indexes its own contiguous joint palette'
  ).toBe(true);
  expect(
    Boolean(instancedShader.bindingTable.some(binding => binding.name === 'skin')),
    'the existing compatible skin uniform remains available'
  ).toBe(true);
  expect(
    skin.bindingLayout.find(binding => binding.name === 'skinJointMatrices')?.visibility,
    'packed palettes bind to the vertex stage only'
  ).toBe(1);

  if (typeof document !== 'undefined') {
    const device = await getWebGPUTestDevice();
    if (device) {
      const shader = device.createShader({
        id: 'instanced-skin-storage-vertex',
        source: instancedShader.source
      });
      try {
        const errors = (await shader.getCompilationInfo()).filter(
          message => message.type === 'error'
        );
        expect(
          errors.length,
          `the actual WebGPU backend compiles indexed storage skinning${
            errors.length ? `: ${errors.map(error => error.message).join('; ')}` : ''
          }`
        ).toBe(0);
      } finally {
        shader.destroy();
      }
    }
  }

  void 0;
});

it('shadertools#skin selects indexed storage palettes for large WebGPU skins', () => {
  const shaderAssembler = new WGSLShaderAssembler();
  const assembledShader = shaderAssembler.assembleWGSLShader({
    platformInfo: WGSL_PLATFORM_INFO,
    source: /* wgsl */ `
@vertex
fn vertexMain() -> @builtin(position) vec4f {
  return getSkinMatrix(vec4f(1.0, 0.0, 0.0, 0.0), vec4u(64u)) * vec4f(0.0, 0.0, 0.0, 1.0);
}`,
    modules: [skin],
    defines: {HAS_LARGE_SKIN: true}
  });

  expect(
    Boolean(
      assembledShader.bindingTable.some(
        binding => binding.name === 'skinJointMatrices' && binding.kind === 'read-only-storage'
      )
    ),
    'large WebGPU skins use an indexed storage palette'
  ).toBe(true);
  expect(
    Boolean(assembledShader.source.includes('skinJointMatrices[joints.x]')),
    'large skinning indexes the palette directly without an instance offset'
  ).toBe(true);
  void 0;
});

it('shadertools#skin assembles portable float-texture instance palettes for WebGL', async () => {
  const assembledShader = assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: /* glsl */ `#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = getInstancedSkinMatrix(
    vec4(1.0, 0.0, 0.0, 0.0), uvec4(0u), uint(gl_InstanceID), 2u
  ) * positions;
}`,
    fs: /* glsl */ `#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = vec4(1.0);
}`,
    modules: [skin],
    defines: {HAS_INSTANCED_SKIN: true}
  });

  expect(
    Boolean(assembledShader.vs.includes('uniform highp sampler2D skinJointMatrices')),
    'WebGL binds instance palettes as a vertex-sampled float texture'
  ).toBe(true);
  expect(
    Boolean(assembledShader.vs.includes('texelFetch(skinJointMatrices')),
    'joint matrices use exact unfiltered float texels'
  ).toBe(true);
  expect(
    Boolean(assembledShader.vs.includes('uint(gl_InstanceID)')),
    'WebGL indexes the drawn instance'
  ).toBe(true);
  expect(
    Boolean(assembledShader.vs.includes('var<storage')),
    'WebGL does not require storage buffers'
  ).toBe(false);

  if (typeof document !== 'undefined') {
    const device = await getWebGLTestDevice();
    const shader = device.createShader({
      id: 'instanced-skin-float-texture-vertex',
      stage: 'vertex',
      source: assembledShader.vs
    });
    try {
      const errors = (await shader.getCompilationInfo()).filter(
        message => message.type === 'error'
      );
      expect(
        errors.length,
        `the actual WebGL backend compiles indexed float-texture skinning${
          errors.length ? `: ${errors.map(error => error.message).join('; ')}` : ''
        }`
      ).toBe(0);
    } finally {
      shader.destroy();
    }
  }

  void 0;
});

it('shadertools#skin preserves uniforms while forwarding backend-native palette resources', () => {
  const device = new NullDevice({});
  const jointMatrices = new Float32Array(new Matrix4().translate([9, 0, 0]));
  const paletteBuffer = device.createBuffer({
    data: jointMatrices,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const paletteTexture = device.createTexture({
    width: 4,
    height: 1,
    format: 'rgba32float'
  });

  try {
    const storageUniforms = skin.getUniforms({jointMatrices, skinJointMatrices: paletteBuffer});
    const textureUniforms = skin.getUniforms({jointMatrices, skinJointMatrices: paletteTexture});
    const shaderInputs = new ShaderInputs({skin});
    shaderInputs.setProps({skin: {jointMatrices, skinJointMatrices: paletteBuffer}});

    expect(storageUniforms.jointMatrix?.[12], 'retains the existing uniform palette').toBe(9);
    expect(storageUniforms.skinJointMatrices, 'forwards WebGPU matrix storage').toBe(paletteBuffer);
    expect(textureUniforms.skinJointMatrices, 'forwards WebGL float textures').toBe(paletteTexture);
    expect(
      shaderInputs.getBindingValues().skinJointMatrices,
      'ShaderInputs recognizes the optional palette as a binding'
    ).toBe(paletteBuffer);
    expect(
      shaderInputs.getUniformValues().skin?.jointMatrix?.[12],
      'ShaderInputs retains the compatible padded uniform values'
    ).toBe(9);
  } finally {
    paletteBuffer.destroy();
    paletteTexture.destroy();
    device.destroy();
  }

  void 0;
});
