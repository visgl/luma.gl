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
import test from 'test/utils/vitest-tape';

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

test('shadertools#skin returns empty uniforms without a glTF skin', t => {
  t.deepEqual(
    skin.getUniforms({
      scenegraphsFromGLTF: {
        gltf: {}
      }
    }),
    {jointMatrix: []},
    'Returns an empty joint matrix when no skin data is available'
  );

  t.end();
});

test('shadertools#skin packs joint matrices from the scenegraph', t => {
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

  t.ok(uniforms.jointMatrix instanceof Float32Array, 'Returns a packed joint matrix buffer');
  t.deepEqual(
    Array.from(uniforms.jointMatrix!.slice(0, 16)),
    Array.from(expectedJointMatrix),
    'Writes the world matrix for the first joint'
  );
  t.deepEqual(
    Array.from(uniforms.jointMatrix!.slice(16, 32)),
    Array.from(new Float32Array(16)),
    'Leaves unused joint matrix slots zeroed'
  );

  t.end();
});

test('shadertools#skin supports Fox-sized skeletons beyond the previous 20-joint limit', t => {
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

  t.equal(uniforms.jointMatrix?.length, SKIN_MAX_JOINTS * 16, 'allocates a portable joint palette');
  t.equal(uniforms.jointMatrix?.[23 * 16 + 12], 24, 'retains the final Fox-sized skeleton joint');
  t.end();
});

test('shadertools#skin selects independent skins and defaults missing bind matrices', t => {
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

  t.equal(uniforms.jointMatrix?.[12], 2, 'selects the requested skin in mesh-local space');
  t.end();
});

test('shadertools#skin accepts a format-independent precomputed joint palette', t => {
  const jointMatrices = new Float32Array(new Matrix4().translate([7, 0, 0]));
  const uniforms = skin.getUniforms({jointMatrices});

  t.equal(uniforms.jointMatrix?.[12], 7, 'preserves precomputed joint transforms');
  t.equal(uniforms.jointMatrix?.length, SKIN_MAX_JOINTS * 16, 'pads the uniform palette');
  t.end();
});

test('shadertools#skin keeps instance palettes feature-specialized in WGSL', async t => {
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

  t.notOk(
    uninstancedShader.bindingTable.some(binding => binding.name === 'skinJointMatrices'),
    'ordinary skinning requires no crowd storage binding'
  );
  t.notOk(
    uninstancedShader.source.includes('getInstancedSkinMatrix'),
    'ordinary shaders exclude crowd skinning helpers'
  );
  t.ok(
    instancedShader.bindingTable.some(
      binding => binding.name === 'skinJointMatrices' && binding.kind === 'read-only-storage'
    ),
    'instanced WebGPU skinning uses read-only packed matrix storage'
  );
  t.ok(
    instancedShader.source.includes('instanceIndex * jointsPerInstance'),
    'each drawn instance indexes its own contiguous joint palette'
  );
  t.ok(
    instancedShader.bindingTable.some(binding => binding.name === 'skin'),
    'the existing compatible skin uniform remains available'
  );
  t.equal(
    skin.bindingLayout.find(binding => binding.name === 'skinJointMatrices')?.visibility,
    1,
    'packed palettes bind to the vertex stage only'
  );

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
        t.equal(
          errors.length,
          0,
          `the actual WebGPU backend compiles indexed storage skinning${
            errors.length ? `: ${errors.map(error => error.message).join('; ')}` : ''
          }`
        );
      } finally {
        shader.destroy();
      }
    }
  }

  t.end();
});

test('shadertools#skin selects indexed storage palettes for large WebGPU skins', t => {
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

  t.ok(
    assembledShader.bindingTable.some(
      binding => binding.name === 'skinJointMatrices' && binding.kind === 'read-only-storage'
    ),
    'large WebGPU skins use an indexed storage palette'
  );
  t.ok(
    assembledShader.source.includes('skinJointMatrices[joints.x]'),
    'large skinning indexes the palette directly without an instance offset'
  );
  t.end();
});

test('shadertools#skin assembles portable float-texture instance palettes for WebGL', async t => {
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

  t.ok(
    assembledShader.vs.includes('uniform highp sampler2D skinJointMatrices'),
    'WebGL binds instance palettes as a vertex-sampled float texture'
  );
  t.ok(
    assembledShader.vs.includes('texelFetch(skinJointMatrices'),
    'joint matrices use exact unfiltered float texels'
  );
  t.ok(assembledShader.vs.includes('uint(gl_InstanceID)'), 'WebGL indexes the drawn instance');
  t.notOk(assembledShader.vs.includes('var<storage'), 'WebGL does not require storage buffers');

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
      t.equal(
        errors.length,
        0,
        `the actual WebGL backend compiles indexed float-texture skinning${
          errors.length ? `: ${errors.map(error => error.message).join('; ')}` : ''
        }`
      );
    } finally {
      shader.destroy();
    }
  }

  t.end();
});

test('shadertools#skin preserves uniforms while forwarding backend-native palette resources', t => {
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

    t.equal(storageUniforms.jointMatrix?.[12], 9, 'retains the existing uniform palette');
    t.equal(storageUniforms.skinJointMatrices, paletteBuffer, 'forwards WebGPU matrix storage');
    t.equal(textureUniforms.skinJointMatrices, paletteTexture, 'forwards WebGL float textures');
    t.equal(
      shaderInputs.getBindingValues().skinJointMatrices,
      paletteBuffer,
      'ShaderInputs recognizes the optional palette as a binding'
    );
    t.equal(
      shaderInputs.getUniformValues().skin?.jointMatrix?.[12],
      9,
      'ShaderInputs retains the compatible padded uniform values'
    );
  } finally {
    paletteBuffer.destroy();
    paletteTexture.destroy();
    device.destroy();
  }

  t.end();
});
