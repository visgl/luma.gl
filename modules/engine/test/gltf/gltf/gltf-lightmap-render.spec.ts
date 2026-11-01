// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/core/test-utils';
import {expect, test} from 'vitest';
import {createScenegraphsFromGLTF} from '../../../src/gltf/gltf/create-scenegraph-from-gltf';

for (const fixture of ['node-atlas', 'gpu-atlas']) {
  test(`KHR_lightmap renders the upstream ${fixture} regions on WebGL and WebGPU`, async () => {
    const source = postProcessGLTF(
      await load(`/test/data/gltf/lightmap/${fixture}.gltf`, GLTFLoader)
    );
    const [webgl, webgpu] = await Promise.all([getWebGLTestDevice(), getTestDevices(['webgpu'])]);
    const devices = webgl ? [webgl, ...webgpu] : webgpu;
    expect(devices.length).toBeGreaterThan(0);
    for (const device of devices) {
      const bundle = createScenegraphsFromGLTF(device, source);
      const texture = device.createTexture({
        width: 64,
        height: 64,
        format: 'rgba8unorm',
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const depthTexture = device.createTexture({
        width: 64,
        height: 64,
        format: 'depth24plus',
        usage: Texture.RENDER
      });
      const framebuffer = device.createFramebuffer({
        width: 64,
        height: 64,
        colorAttachments: [texture],
        depthStencilAttachment: depthTexture
      });
      const layout = texture.computeMemoryLayout({width: 64, height: 64});
      const readback = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        const projection = new Matrix4().ortho({
          left: -1.2,
          right: 1.2,
          bottom: -0.1,
          top: 0.9,
          near: -1,
          far: 1
        });
        const pass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
        for (const scene of bundle.scenes)
          scene.traverse((node, {worldMatrix}) => {
            if (!(node instanceof ModelNode)) return;
            const modelMatrix = new Matrix4(worldMatrix).multiplyRight(node.matrix);
            node.model.setParameters({
              depthWriteEnabled: false,
              depthCompare: 'always',
              cullMode: 'none'
            });
            node.model.shaderInputs.setProps({
              lighting: {lights: []},
              pbrProjection: {
                modelMatrix,
                modelViewProjectionMatrix: new Matrix4(projection).multiplyRight(modelMatrix),
                normalMatrix: new Matrix4(),
                camera: [0, 0, 2]
              }
            });
            node.model.draw(pass);
          });
        pass.end();
        device.submit();
        texture.readBuffer({width: 64, height: 64}, readback);
        const pixels = await readback.readAsync(0, layout.byteLength);
        const left = (32 * 64 + 16) * 4;
        const right = (32 * 64 + 48) * 4;
        expect(pixels[left + 3], `${device.type} draws left atlas geometry`).toBeGreaterThan(0);
        expect(pixels[right + 3], `${device.type} draws right atlas geometry`).toBeGreaterThan(0);
        expect(
          pixels[left] - pixels[left + 2],
          `${device.type} selects the warm atlas region`
        ).toBeGreaterThan(5);
        expect(
          pixels[right + 2] - pixels[right],
          `${device.type} selects the cool atlas region`
        ).toBeGreaterThan(5);
      } finally {
        readback.destroy();
        framebuffer.destroy();
        texture.destroy();
        depthTexture.destroy();
        bundle.destroy();
      }
    }
  });
}
