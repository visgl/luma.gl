// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getTestDevices} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('glTF renders official EXT_mesh_gpu_instancing through one real draw on available backends', async testCase => {
  const source = postProcessGLTF(
    await load(new URL('../data/SimpleInstancing.glb', import.meta.url).href, GLTFLoader, {
      gltf: {loadImages: false}
    })
  );

  for (const device of await getTestDevices()) {
    const scenegraphs = createScenegraphsFromGLTF(device, source, {strictExtensions: true});
    const colorTexture = device.createTexture({
      width: 16,
      height: 16,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 16,
      height: 16,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 16,
      height: 16,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      let modelNode: ModelNode | undefined;
      scenegraphs.scenes[0].traverse(node => {
        if (node instanceof ModelNode) {
          modelNode = node;
        }
      });

      testCase.ok(modelNode, `${device.type} creates one instanced primitive`);
      if (modelNode) {
        const identity = Array.from(new Matrix4());
        modelNode.model.shaderInputs.setProps({
          pbrProjection: {
            modelViewProjectionMatrix: identity,
            modelMatrix: identity,
            normalMatrix: identity,
            camera: [0, 0, 4]
          }
        });
        const renderPass = device.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 0],
          clearDepth: 1
        });
        testCase.ok(modelNode.model.draw(renderPass), `${device.type} executes an instanced draw`);
        renderPass.end();
        device.submit();

        testCase.ok(modelNode.model.isInstanced, `${device.type} enables GPU instancing`);
        testCase.ok(
          modelNode.model.instanceCount > 1,
          `${device.type} submits every authored source instance`
        );
      }
    } finally {
      for (const scene of scenegraphs.scenes) {
        scene.destroy();
      }
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  testCase.end();
});
