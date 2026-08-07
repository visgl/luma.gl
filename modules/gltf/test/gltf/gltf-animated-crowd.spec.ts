// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import test from 'test/utils/vitest-tape';

test('glTF crowds draw independent SimpleSkin actors in one real WebGL and WebGPU call', async testContext => {
  const source = postProcessGLTF(
    await load('/examples/showcase/anari/public/gltf/SimpleSkin.gltf', GLTFLoader, {
      gltf: {loadImages: false}
    })
  );
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;

  for (const device of devices) {
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 8});
    const colorTexture = device.createTexture({
      width: 32,
      height: 32,
      format: device.preferredColorFormat,
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const depthTexture = device.createTexture({
      width: 32,
      height: 32,
      format: 'depth24plus',
      usage: Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({
      width: 32,
      height: 32,
      colorAttachments: [colorTexture],
      depthStencilAttachment: depthTexture
    });

    try {
      const [first, second, third] = crowd.addActors([
        {id: 'left', phase: 0, transform: new Matrix4().translate([-0.5, 0, 0])},
        {id: 'center', phase: 0.35, transform: new Matrix4()},
        {id: 'right', phase: 0.7, speed: 2, transform: new Matrix4().translate([0.5, 0, 0])}
      ]);
      const model = crowd.models[0];
      const identity = Array.from(new Matrix4());
      model.shaderInputs.setProps({
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
      const drawCount = crowd.draw(renderPass);
      renderPass.end();
      device.submit();

      if (
        device.info.gpu !== 'software' &&
        device.info.gpuType !== 'cpu' &&
        !device.info.fallback
      ) {
        const memoryLayout = colorTexture.computeMemoryLayout({width: 32, height: 32});
        const readbackBuffer = device.createBuffer({
          byteLength: memoryLayout.byteLength,
          usage: Buffer.COPY_DST | Buffer.MAP_READ
        });
        try {
          colorTexture.readBuffer({width: 32, height: 32}, readbackBuffer);
          const pixels = await readbackBuffer.readAsync(0, memoryLayout.byteLength);
          testContext.ok(
            pixels.some((value, index) => index % 4 === 3 && value > 0),
            `${device.type} writes visible crowd geometry into the real framebuffer`
          );
        } finally {
          readbackBuffer.destroy();
        }
      }

      testContext.equal(drawCount, 1, `${device.type} submits one shared primitive draw`);
      testContext.equal(model.instanceCount, 3, `${device.type} draws all three actor instances`);
      testContext.ok(model.isInstanced, `${device.type} enables instanced primitive rendering`);
      testContext.notDeepEqual(
        Array.from(first.skins.bindings[0].jointMatrices),
        Array.from(second.skins.bindings[0].jointMatrices),
        `${device.type} preserves independent actor joint poses`
      );
      const resource = crowd.primitiveGroups[0].skinJointMatrices;
      testContext.ok(
        device.type === 'webgpu' ? resource instanceof Buffer : resource instanceof Texture,
        `${device.type} selects its native crowd palette binding`
      );

      const initialModel = model;
      const initialThirdTime = third.time;
      crowd.update(0.1);
      testContext.equal(crowd.models[0], initialModel, `${device.type} reuses its compiled model`);
      testContext.ok(third.time > initialThirdTime, `${device.type} advances actor-local playback`);

      const updatedRenderPass = device.beginRenderPass({
        framebuffer,
        clearColor: [0, 0, 0, 0],
        clearDepth: 1
      });
      testContext.equal(
        crowd.draw(updatedRenderPass),
        1,
        `${device.type} keeps draw count constant after animation`
      );
      updatedRenderPass.end();
      device.submit();
    } finally {
      crowd.destroy();
      framebuffer.destroy();
      colorTexture.destroy();
      depthTexture.destroy();
    }
  }

  testContext.ok(devices.length > 0, 'at least one live graphics backend is exercised');
  testContext.end();
});
