// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice} from '@luma.gl/scene';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/scene/gltf-to-anari';
import {createANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';

it('glTF SimpleSkin renders automatically animated retained joints on WebGL and WebGPU', async () => {
  const asset = await load('/examples/showcase/scene/public/gltf/SimpleSkin.gltf', GLTFLoader, {
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
    expect(binding?.joints.length, `${graphicsDevice.type} binds authored joints`).toBe(2);
    scenegraphs.animator.setTime(500);

    const device = new ANARIDevice(graphicsDevice);
    const scene = createANARIJSONScene(device, description);
    try {
      const before = scene.frame.render();
      graphicsDevice.submit();
      scene.animations?.seek(1);
      const after = scene.frame.render();
      graphicsDevice.submit();

      expect(Boolean(before.drawCount > 0), `${graphicsDevice.type} draws the authored skin`).toBe(
        true
      );
      expect(
        after.drawCount,
        `${graphicsDevice.type} draws its animated pose without rebuilding the scene`
      ).toBe(before.drawCount);
    } finally {
      scene.destroy();
      device.destroy();
      for (const sourceScene of scenegraphs.scenes) {
        sourceScene.destroy();
      }
    }
  }

  expect(Boolean(devices.length > 0), 'at least one live graphics backend is exercised').toBe(true);
  void 0;
});
