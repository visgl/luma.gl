// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {Geometry, Model} from '@luma.gl/engine';
import {createPBRMaterial, createPBRSurfaceModel, PBRSurfacePass} from '@luma.gl/engine/lighting';
import {Matrix4} from '@math.gl/core';

for (const getDevice of [getWebGLTestDevice, getWebGPUTestDevice]) {
  test(`PBR surface normals, depth, deformation, masks and lifetime (${getDevice.name})`, async context => {
    const device = await getDevice();
    if (!device) return context.skip('No rendering device');
    const surface = new PBRSurfacePass(device, {width: 32, height: 32});
    const normalMap = device.createTexture({
      width: 1,
      height: 1,
      data: new Uint8Array([255, 128, 128, 255])
    });
    const alphaMap = device.createTexture({
      width: 2,
      height: 1,
      data: new Uint8Array([255, 255, 255, 255, 255, 255, 255, 0]),
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    });
    const material = createPBRMaterial(device, {
      uniforms: {baseColorFactor: [1, 1, 1, 1], alphaCutoff: 0.5, baseColorUVSet: 1},
      bindings: {pbr_normalSampler: normalMap, pbr_baseColorSampler: alphaMap}
    });
    const geometry = new Geometry({
      attributes: {
        POSITION: {size: 3, value: new Float32Array([-0.9, -0.9, 0, 0.9, -0.9, 0, 0, 0.9, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
        TANGENT: {size: 4, value: new Float32Array([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1])},
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
        TEXCOORD_1: {size: 2, value: new Float32Array(6).fill(0.25)},
        COLOR_0: {size: 4, value: new Float32Array(12).fill(1)},
        JOINTS_0: {size: 4, value: new Uint16Array(12)},
        WEIGHTS_0: {size: 4, value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0])}
      }
    });
    const view = new Matrix4().lookAt({eye: [2, 0, 4], center: [0, 0, 0]});
    const projection = new Matrix4().ortho({
      left: -1.5,
      right: 1.5,
      bottom: -1.5,
      top: 1.5,
      near: 0.1,
      far: 10
    });
    if (device.type === 'webgpu')
      projection.multiplyLeft(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 0, 0.5, 1]));
    const readback = device.createBuffer({
      byteLength: 256,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    async function readNormal(x = 16, y = 16) {
      surface.normalTexture.readBuffer({x, y, width: 1, height: 1}, readback);
      device.submit();
      return Array.from((await readback.readAsync()).slice(0, 4));
    }
    const probeColor = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const probeFramebuffer = device.createFramebuffer({colorAttachments: [probeColor]});
    const probe = new Model(device, {
      source: `@group(0) @binding(auto) var surfaceDepth: texture_depth_2d;
      @vertex fn vertexMain(@builtin(vertex_index) index:u32)->@builtin(position) vec4f {let positions=array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));return vec4f(positions[index],0,1);}
      @fragment fn fragmentMain()->@location(0) vec4f {let depth=textureLoad(surfaceDepth,vec2i(textureDimensions(surfaceDepth))/2,0);return vec4f(vec3f(depth),1);}`,
      vs: `#version 300 es
      void main(){vec2 positions[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));gl_Position=vec4(positions[gl_VertexID],0,1);}`,
      fs: `#version 300 es
      precision highp float;
      uniform sampler2D surfaceDepth;
      out vec4 fragmentColor;
      void main(){float depth=texelFetch(surfaceDepth,textureSize(surfaceDepth,0)/2,0).r;fragmentColor=vec4(vec3(depth),1);}`,
      vertexCount: 3,
      bindings: {surfaceDepth: surface.depthTexture},
      colorAttachmentFormats: ['rgba8unorm']
    });
    async function readDepth() {
      probe.setBindings({surfaceDepth: surface.depthTexture});
      const pass = device.beginRenderPass({
        framebuffer: probeFramebuffer,
        clearColor: [0, 0, 0, 0]
      });
      pass.setParameters({viewport: [0, 0, 1, 1]});
      probe.draw(pass);
      pass.end();
      device.submit();
      probeColor.readBuffer({width: 1, height: 1}, readback);
      device.submit();
      return (await readback.readAsync())[0];
    }
    let retainedModel: Model | undefined;
    try {
      const submit = vi.spyOn(device, 'submit');
      const callbackOrder: string[] = [];
      surface.render({
        prepareSurfaces: () => callbackOrder.push('prepare'),
        drawSurfaces: () => callbackOrder.push('draw')
      });
      expect(callbackOrder).toEqual(['prepare', 'draw']);
      expect(submit).not.toHaveBeenCalled();
      submit.mockRestore();
      device.submit();
      expect(await readNormal()).toEqual([128, 128, 255, 0]);
      expect(await readDepth()).toBe(255);
      expect(() =>
        surface.render({
          drawSurfaces: () => {
            throw new Error('surface draw failed');
          }
        })
      ).toThrow('surface draw failed');
      surface.render({drawSurfaces: () => {}});
      device.submit();
      const oldNormal = surface.normalTexture;
      const oldDepth = surface.depthTexture;
      surface.resize({width: 32, height: 32});
      expect(surface.normalTexture).toBe(oldNormal);
      for (const variant of [
        'ordinary',
        'instanced',
        'skinned',
        'noNormals',
        'mapped',
        'backFace'
      ]) {
        const instance = new Matrix4().translate([0.08, 0, 0]).scale([-0.8, 0.9, 1]);
        const names = [0, 1, 2, 3].map(column => `instanceModelMatrixCol${column}`);
        const buffers =
          variant === 'instanced'
            ? names.map((name, column) =>
                device.createBuffer({
                  data: new Float32Array(instance.slice(column * 4, column * 4 + 4)),
                  usage: Buffer.VERTEX
                })
              )
            : [];
        const reversed = variant === 'backFace';
        const backGeometry = reversed
          ? new Geometry({
              indices: new Uint16Array([0, 2, 1]),
              attributes: {
                ...geometry.attributes,
                NORMAL: {size: 3, value: new Float32Array([0, 0, -1, 0, 0, -1, 0, 0, -1])}
              }
            })
          : geometry;
        const model = createPBRSurfaceModel(device, {
          geometry: backGeometry,
          material,
          instanceCount: 1,
          defines: {
            HAS_SKIN: variant === 'skinned',
            HAS_INSTANCING: variant === 'instanced',
            HAS_NORMALS: variant !== 'noNormals',
            HAS_TANGENTS: variant !== 'noNormals',
            ALPHA_CUTOFF: true,
            DOUBLE_SIDED: reversed
          },
          attributes: Object.fromEntries(
            names.slice(0, buffers.length).map((name, index) => [name, buffers[index]])
          ),
          bufferLayout: buffers.length
            ? names.map(name => ({name, format: 'float32x4', stepMode: 'instance'}))
            : [],
          parameters: {cullMode: 'none'}
        });
        try {
          const skinMatrix = new Matrix4().rotateY(-0.3).scale([1, 0.8, 1.2]);
          if (variant === 'skinned')
            model.shaderInputs.setProps({skin: {jointMatrices: skinMatrix}});
          const modelMatrix = new Matrix4().rotateY(0.2).scale([0.9, 0.8, 1]);
          const total = new Matrix4(modelMatrix);
          if (variant === 'instanced') total.multiplyRight(instance);
          if (variant === 'skinned') total.multiplyRight(skinMatrix);
          model.shaderInputs.setProps({
            pbrProjection: {
              modelMatrix,
              normalMatrix: new Matrix4(modelMatrix).invert().transpose(),
              modelViewProjectionMatrix: new Matrix4(projection)
                .multiplyRight(view)
                .multiplyRight(modelMatrix),
              camera: [2, 0, 4]
            },
            pbrSurface: {viewMatrix: view, useMaterialNormals: variant === 'mapped'}
          });
          surface.render({drawSurfaces: target => model.draw(target.renderPass)});
          device.submit();
          const worldNormal = Array.from(
            new Matrix4(total).invert().transpose().transform([0, 0, 1, 0])
          ).slice(0, 3);
          let normal: number[] = view.transformAsVector(worldNormal);
          if (variant === 'mapped')
            normal = view.transformAsVector(
              new Matrix4(total).transformAsVector([1, 1 / 255, 1 / 255])
            );
          const magnitude = Math.hypot(...normal);
          normal = normal.map(value => value / magnitude);
          const pixel = await readNormal();
          for (let channel = 0; channel < 3; channel++) {
            expect(
              Math.abs(pixel[channel] - Math.round((normal[channel] * 0.5 + 0.5) * 255)),
              `${device.type} ${variant} view-normal channel ${channel}; pixel ${pixel}; expected ${normal}`
            ).toBeLessThanOrEqual(2);
          }
          expect(pixel[3]).toBe(255);
          // Independent ray-plane intersection at the sampled pixel verifies hardware clip-depth conventions.
          const viewProjection = new Matrix4(projection).multiplyRight(view);
          const inverse = new Matrix4(viewProjection).invert();
          const near = inverse.transformAsPoint([
            1 / 32,
            device.type === 'webgpu' ? -1 / 32 : 1 / 32,
            device.type === 'webgpu' ? 0 : -1
          ]);
          const far = inverse.transformAsPoint([
            1 / 32,
            device.type === 'webgpu' ? -1 / 32 : 1 / 32,
            1
          ]);
          const origin = total.transformAsPoint([0, 0, 0]);
          const ray = far.map((value, index) => value - near[index]);
          const dot = (first: number[], second: number[]) =>
            first.reduce((sum, value, index) => sum + value * second[index], 0);
          const distance =
            dot(
              worldNormal,
              origin.map((value, index) => value - near[index])
            ) / dot(worldNormal, ray);
          const hit = near.map((value, index) => value + distance * ray[index]);
          const clipDepth = viewProjection.transformAsPoint(hit)[2];
          const depth = await readDepth();
          expect(
            Math.abs(depth - (device.type === 'webgpu' ? clipDepth : clipDepth * 0.5 + 0.5) * 255)
          ).toBeLessThan(2);
          if (variant === 'ordinary') {
            material.setProps({pbrMaterial: {baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0.5, 0, 1]}});
            surface.render({drawSurfaces: target => model.draw(target.renderPass)});
            device.submit();
            expect((await readNormal())[3]).toBe(0);
            expect(await readDepth()).toBe(255);
            material.setProps({pbrMaterial: {baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]}});
          }
          if (variant === 'backFace') retainedModel = model;
        } finally {
          if (model !== retainedModel) model.destroy();
          for (const buffer of buffers) buffer.destroy();
        }
      }
      surface.resize({width: 16, height: 8});
      expect(oldNormal.destroyed).toBe(true);
      expect(oldDepth.destroyed).toBe(true);
      surface.render({drawSurfaces: target => retainedModel!.draw(target.renderPass)});
      device.submit();
      expect((await readNormal(8, 4))[3]).toBe(255);
      const finalNormal = surface.normalTexture;
      const finalDepth = surface.depthTexture;
      surface.destroy();
      surface.destroy();
      expect(finalNormal.destroyed).toBe(true);
      expect(finalDepth.destroyed).toBe(true);
      expect(() => surface.render({drawSurfaces: () => {}})).toThrow();
      const recreated = new PBRSurfacePass(device, {width: 16, height: 8});
      try {
        recreated.render({drawSurfaces: target => retainedModel!.draw(target.renderPass)});
        device.submit();
        recreated.normalTexture.readBuffer({x: 8, y: 4, width: 1, height: 1}, readback);
        device.submit();
        expect((await readback.readAsync())[3]).toBe(255);
      } finally {
        recreated.destroy();
      }
    } finally {
      vi.restoreAllMocks();
      retainedModel?.destroy();
      surface.destroy();
      probe.destroy();
      probeFramebuffer.destroy();
      probeColor.destroy();
      material.destroy();
      normalMap.destroy();
      alphaMap.destroy();
      readback.destroy();
    }
  });
}
