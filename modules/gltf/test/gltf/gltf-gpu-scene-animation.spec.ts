// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF, type GLTFScenegraphs} from '@luma.gl/gltf';
import {getTestDevices, getWebGLTestDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('ordinary GPU scene playback renders CPU-equivalent skeletal and morph poses on real backends', async () => {
  const [webglDevice, webgpuDevices] = await Promise.all([
    getWebGLTestDevice(),
    getTestDevices(['webgpu'])
  ]);
  const devices = webglDevice ? [webglDevice, ...webgpuDevices] : webgpuDevices;
  expect(devices.length).toBeGreaterThan(0);
  for (const fixture of ['SimpleSkin.gltf', 'AnimatedMorphCube.glb']) {
    const source = postProcessGLTF(
      await load(`/examples/showcase/scene/public/gltf/${fixture}`, GLTFLoader, {
        gltf: {loadImages: false}
      })
    );
    // Both the mesh and skeleton inherit a nonidentity bind transform.
    const parent = {
      id: 'gpu-test-root',
      children: [...source.scenes[0].nodes],
      translation: [0, -0.5, 0],
      scale: [0.5, 0.5, 0.5]
    };
    source.nodes.push(parent);
    source.scenes[0].nodes = [parent];
    for (const device of devices) {
      const cpu = createScenegraphsFromGLTF(device, source);
      const gpu = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
      const color = device.createTexture({
        width: 48,
        height: 48,
        format: device.preferredColorFormat,
        usage: Texture.RENDER | Texture.COPY_SRC
      });
      const depth = device.createTexture({
        width: 48,
        height: 48,
        format: 'depth24plus',
        usage: Texture.RENDER
      });
      const framebuffer = device.createFramebuffer({
        width: 48,
        height: 48,
        colorAttachments: [color],
        depthStencilAttachment: depth
      });
      const memoryLayout = color.computeMemoryLayout({width: 48, height: 48});
      const readback = device.createBuffer({
        byteLength: memoryLayout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      const render = async (scenegraphs: GLTFScenegraphs, time: number): Promise<Uint8Array> => {
        scenegraphs.animator.setTime(time);
        const renderPass = device.beginRenderPass({
          framebuffer,
          clearColor: [0, 0, 0, 0],
          clearDepth: 1
        });
        for (const scene of scenegraphs.scenes) {
          scene.traverse((node, {worldMatrix}) => {
            if (node instanceof ModelNode) {
              const modelMatrix = new Matrix4(worldMatrix).multiplyRight(node.matrix);
              node.model.shaderInputs.setProps({
                pbrProjection: {
                  modelMatrix,
                  modelViewProjectionMatrix: modelMatrix,
                  normalMatrix: new Matrix4(modelMatrix).invert().transpose(),
                  camera: [0, 0, 4]
                }
              });
              expect(node.model.draw(renderPass), `${device.type} submits ${fixture}`).toBe(true);
            }
          });
        }
        renderPass.end();
        device.submit();
        color.readBuffer({width: 48, height: 48}, readback);
        return new Uint8Array(await readback.readAsync(0, memoryLayout.byteLength));
      };
      try {
        expect(gpu.animationStats.mode).toBe('gpu');
        const gpuPoses: Uint8Array[] = [];
        for (const time of [250, 750]) {
          const cpuPixels = await render(cpu, time);
          const gpuPixels = await render(gpu, time);
          expect(gpuPixels.filter((value, index) => index % 4 === 3)).toEqual(
            cpuPixels.filter((value, index) => index % 4 === 3)
          );
          expect(gpuPixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
          gpuPoses.push(gpuPixels);
        }
        if (fixture === 'SimpleSkin.gltf') {
          expect(gpuPoses[0]).not.toEqual(gpuPoses[1]);
        }
      } finally {
        cpu.destroy();
        gpu.destroy();
        readback.destroy();
        framebuffer.destroy();
        color.destroy();
        depth.destroy();
      }
    }
  }
}, 60_000);
