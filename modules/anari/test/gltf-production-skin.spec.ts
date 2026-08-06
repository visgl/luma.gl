// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice} from '@luma.gl/anari';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/anari/gltf-to-anari';
import {createANARIJSONScene} from '../../../examples/showcase/anari/playground-scene';

test('glTF SimpleSkin renders automatically animated retained joints on WebGL and WebGPU', async testContext => {
  const asset = await load('/examples/showcase/anari/public/gltf/SimpleSkin.gltf', GLTFLoader, {
    gltf: {loadImages: false}
  });
  const source = postProcessGLTF(asset);
  const description = await makeANARIJSONSceneFromGLTF(source, 'GPU SIMPLE SKIN');
  if (description.renderer) {
    description.renderer.bloomIntensity = 0;
  }

  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const graphicsDevice of devices) {
    const scenegraphs = createScenegraphsFromGLTF(graphicsDevice, source);
    const binding = scenegraphs.skins.getBinding(0);
    testContext.equal(binding?.joints.length, 2, `${graphicsDevice.type} binds authored joints`);
    scenegraphs.animator.setTime(500);

    const device = new ANARIDevice(graphicsDevice);
    const scene = createANARIJSONScene(device, description);
    try {
      const before = scene.frame.render();
      graphicsDevice.submit();
      scene.animations?.seek(1);
      const after = scene.frame.render();
      graphicsDevice.submit();

      testContext.ok(before.drawCount > 0, `${graphicsDevice.type} draws the authored skin`);
      testContext.equal(
        after.drawCount,
        before.drawCount,
        `${graphicsDevice.type} draws its animated pose without rebuilding the scene`
      );
    } finally {
      scene.destroy();
      device.destroy();
      for (const sourceScene of scenegraphs.scenes) {
        sourceScene.destroy();
      }
    }
  }

  testContext.ok(devices.length > 0, 'at least one live graphics backend is exercised');
  testContext.end();
});
