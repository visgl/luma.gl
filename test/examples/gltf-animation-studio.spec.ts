// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Texture} from '@luma.gl/core';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';
import {GLTFAnimationStudio} from '../../examples/showcase/gltf/gltf-animation-studio';

test('Animation Studio renders expressive robot skinning and facial morphs on WebGL and WebGPU', async testCase => {
  const source = postProcessGLTF(
    await load('/examples/showcase/scene/public/gltf/RobotExpressive.glb', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    const studio = new GLTFAnimationStudio();
    const color = device.createTexture({
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depth = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [color],
      depthStencilAttachment: depth
    });

    try {
      studio.attach(scenegraphs);
      studio.selectClip('Walking');
      studio.update(0);
      studio.update(400);
      const firstPose = Array.from(scenegraphs.skins.bindings[0].jointMatrices);
      studio.selectClip('Running');
      studio.update(500);
      studio.update(900);

      testCase.equal(scenegraphs.skins.bindings.length, 2, `${device.type} binds both robot skins`);
      testCase.notDeepEqual(
        Array.from(scenegraphs.skins.bindings[0].jointMatrices),
        firstPose,
        `${device.type} updates a real 43-joint skin during crossfades`
      );

      const expression = studio.getState().morphTargets[0];
      studio.setMorphWeight(expression.identifier, 0.8);
      testCase.equal(
        scenegraphs.gltfNodeIndexToNodeMap.get(expression.nodeIndex)?.userData['morphWeights']?.[0],
        0.8,
        `${device.type} applies authored Angry facial morph`
      );

      const binding = scenegraphs.skins.bindings[0];
      const modelNode = binding.models[0];
      const identity = Array.from(new Matrix4());
      modelNode.model.shaderInputs.setProps({
        pbrProjection: {
          modelViewProjectionMatrix: identity,
          modelMatrix: identity,
          normalMatrix: identity,
          camera: [0, 0, 4]
        },
        skin: {jointMatrices: binding.jointMatrices}
      });
      const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      testCase.ok(modelNode.model.draw(renderPass), `${device.type} draws the animated robot`);
      renderPass.end();
      device.submit();
    } finally {
      studio.detach();
      for (const scene of scenegraphs.scenes) {
        scene.destroy();
      }
      framebuffer.destroy();
      color.destroy();
      depth.destroy();
    }
  }

  testCase.ok(devices.length > 0, 'at least one live graphics backend is exercised');
  testCase.end();
});
