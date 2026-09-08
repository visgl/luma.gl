// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Buffer, type Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {CubeGeometry, Model, ShaderPassRenderer} from '@luma.gl/engine';
import {ClusteredLightGrid, GBuffer, makeDeferredPointLightBufferData} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4, radians} from '@math.gl/core';
import LightstormMegacityAnimationLoopTemplate from '../../examples/showcase/lightstorm-megacity/app';
import {
  createLightstormDeferredLightingCompositeShaderPass,
  LIGHTSTORM_LIGHT_MARKER_SHADER,
  LIGHTSTORM_RENDER_SHADER
} from '../../examples/showcase/lightstorm-megacity/lightstorm-shaders';

describe('Lightstorm Megacity', () => {
  test('compacts visible city records into an indirect draw', async () => {
    const device = await getWebGPUTestDevice('core');
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      Boolean(device.info.fallback)
    ) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let viewer: LightstormMegacityAnimationLoopTemplate | null = null;
    try {
      viewer = new LightstormMegacityAnimationLoopTemplate({
        device,
        lightstormCapacity: 2048
      } as AnimationProps & {lightstormCapacity: number});
      const state = viewer as unknown as {
        sceneColorFormat: string;
        comparisonView: boolean;
        activeClusteredLightCount: number;
        clusteredLightGrid: ClusteredLightGrid;
        deferredLightingRenderer: {
          passRenderers: Array<{passDefinition: {name: string}}>;
        };
        resources: {
          compiled: {
            stats: {
              nodeOrder: string[];
              importedTextureCount: number;
              logicalTransientTextureCount: number;
            };
          };
          drawCommands: {buffer: {readAsync: () => Promise<Uint8Array>}};
          sceneGBuffer: GBuffer;
        };
      };
      const nodeOrder = state.resources.compiled.stats.nodeOrder;
      expect(nodeOrder).toContain('visible-city-records-identity');
      expect(
        nodeOrder.some(identifier => identifier.startsWith('visible-city-records-compact'))
      ).toBe(true);
      expect(nodeOrder).toContain('render-visible-city');
      expect(state.resources.compiled.stats.importedTextureCount).toBe(6);
      expect(state.resources.compiled.stats.logicalTransientTextureCount).toBe(0);
      expect([
        state.resources.sceneGBuffer.colorTexture.format,
        state.resources.sceneGBuffer.normalRoughnessTexture.format,
        state.resources.sceneGBuffer.velocityTexture.format,
        state.resources.sceneGBuffer.getExtraColorTexture('baseColorMetallic').format,
        state.resources.sceneGBuffer.getExtraColorTexture('emissiveOcclusion').format,
        state.resources.sceneGBuffer.depthTexture.format
      ]).toEqual([
        state.sceneColorFormat,
        'rgba8unorm',
        'rg16float',
        'rgba8unorm',
        'rgba8uint',
        'depth24plus'
      ]);
      expect(
        state.deferredLightingRenderer.passRenderers.map(
          passRenderer => passRenderer.passDefinition.name
        )
      ).toEqual(
        state.sceneColorFormat === 'rgba16float'
          ? ['lightstormDeferredLightingCompositeShaderPass', 'ssrCompositeShaderPass']
          : ['lightstormDeferredLightingCompositeShaderPass']
      );

      viewer.onRender({
        device,
        time: 1000,
        width: 800,
        height: 600,
        animationLoop: {
          frameRate: {getSampleHz: () => 60},
          cpuTime: {getSampleAverageTime: () => 1},
          gpuTime: {getSampleAverageTime: () => 1}
        }
      } as unknown as AnimationProps);
      device.submit();

      expect(state.activeClusteredLightCount).toBe(128);
      const clusterCounts = await readUint32Buffer(state.clusteredLightGrid.clusterLightCounts);
      expect(clusterCounts.some(clusterCount => clusterCount > 0)).toBe(true);

      const bytes = await state.resources.drawCommands.buffer.readAsync();
      const command = new Uint32Array(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
      );
      expect(command[1]).toBeGreaterThan(0);
      expect(command[1]).toBeLessThanOrEqual(2048);

      state.comparisonView = true;
      viewer.onRender({
        device,
        time: 1016,
        width: 800,
        height: 600,
        animationLoop: {
          frameRate: {getSampleHz: () => 60},
          cpuTime: {getSampleAverageTime: () => 1},
          gpuTime: {getSampleAverageTime: () => 1}
        }
      } as unknown as AnimationProps);
      device.submit();
      expect(state.activeClusteredLightCount).toBe(0);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);

  test('draws the real five-target shader and clustered resolve on WebGPU', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }

    const width = 4;
    const height = 4;
    const nearPlane = 0.1;
    const farPlane = 20;
    const projectionMatrix = new Matrix4().perspective({
      fovy: radians(60),
      aspect: width / height,
      near: nearPlane,
      far: farPlane
    });
    const viewMatrix = new Matrix4();
    const uniformData = new Float32Array(60);
    uniformData.set(projectionMatrix, 0);
    uniformData.set(viewMatrix, 16);
    uniformData.set([Math.tan(radians(30)), 1, nearPlane, farPlane], 32);
    uniformData.set([0, 0, 0, 1], 36);
    uniformData.set([0, 1, 0, 0], 40);
    uniformData.set(projectionMatrix, 44);

    const resourcesToDestroy: Array<{destroy(): void}> = [];
    try {
      const sceneGBuffer = new GBuffer(device, {
        id: 'lightstorm-five-target-test-scene',
        width,
        height,
        colorFormat: 'rgba8unorm',
        normalRoughnessFormat: 'rgba8unorm',
        velocityFormat: 'rg16float',
        depthStencilFormat: 'depth24plus',
        extraColorAttachments: [
          {name: 'baseColorMetallic', format: 'rgba8unorm'},
          {name: 'emissiveOcclusion', format: 'rgba8uint'}
        ]
      });
      resourcesToDestroy.push(sceneGBuffer);
      const instances = device.createBuffer({
        id: 'lightstorm-five-target-test-instances',
        data: new Float32Array([0, 0.35, -2, 1, 0.5, 0.5, 0.5, 0.25, 0.1, 0.2, 0.35, 0]),
        usage: Buffer.STORAGE
      });
      resourcesToDestroy.push(instances);
      const visibleIdentifiers = device.createBuffer({
        id: 'lightstorm-five-target-test-visible-identifiers',
        data: new Uint32Array([0]),
        usage: Buffer.STORAGE
      });
      resourcesToDestroy.push(visibleIdentifiers);
      const uniforms = device.createBuffer({
        id: 'lightstorm-five-target-test-uniforms',
        data: uniformData,
        usage: Buffer.UNIFORM
      });
      resourcesToDestroy.push(uniforms);
      const lightMarkers = device.createBuffer({
        id: 'lightstorm-five-target-test-light-markers',
        // Keep the emissive marker behind the material cube so it exercises the five-target
        // marker shader without depth-occluding the surface used to verify clustered lighting.
        data: new Float32Array([0, 0.55, -3, 24, 1, 0.5, 0.25, 30, 0, 0.5, 0, 0]),
        usage: Buffer.STORAGE
      });
      resourcesToDestroy.push(lightMarkers);
      const pointLights = device.createBuffer({
        id: 'lightstorm-five-target-test-point-lights',
        data: makeDeferredPointLightBufferData(
          [{position: [0, 0.55, -1], range: 24, color: [1, 0.5, 0.25], intensity: 30}],
          1
        ),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      resourcesToDestroy.push(pointLights);
      const darkPointLights = device.createBuffer({
        id: 'lightstorm-five-target-test-dark-point-lights',
        data: makeDeferredPointLightBufferData(
          [{position: [0, 0.55, -1], range: 24, color: [1, 0.5, 0.25], intensity: 0}],
          1
        ),
        usage: Buffer.STORAGE
      });
      resourcesToDestroy.push(darkPointLights);
      const model = new Model(device, {
        id: 'lightstorm-five-target-test-model',
        source: LIGHTSTORM_RENDER_SHADER,
        geometry: new CubeGeometry({id: 'lightstorm-five-target-test-cube', indices: true}),
        colorAttachmentFormats: [
          'rgba8unorm',
          'rgba8unorm',
          'rg16float',
          'rgba8unorm',
          'rgba8uint'
        ],
        depthStencilAttachmentFormat: 'depth24plus',
        shaderLayout: {
          attributes: [
            {name: 'positions', location: 0, type: 'vec3<f32>'},
            {name: 'normals', location: 1, type: 'vec3<f32>'}
          ],
          bindings: [
            {name: 'instances', type: 'read-only-storage', group: 0, location: 0},
            {name: 'visibleIds', type: 'read-only-storage', group: 0, location: 1},
            {name: 'uniforms', type: 'uniform', group: 0, location: 2}
          ]
        },
        parameters: {
          cullMode: 'back',
          depthCompare: 'less-equal',
          depthWriteEnabled: true
        }
      });
      resourcesToDestroy.push(model);
      const lightMarkerModel = new Model(device, {
        id: 'lightstorm-five-target-test-light-marker-model',
        source: LIGHTSTORM_LIGHT_MARKER_SHADER,
        geometry: new CubeGeometry({id: 'lightstorm-five-target-test-marker-cube', indices: true}),
        instanceCount: 2,
        colorAttachmentFormats: [
          'rgba8unorm',
          'rgba8unorm',
          'rg16float',
          'rgba8unorm',
          'rgba8uint'
        ],
        depthStencilAttachmentFormat: 'depth24plus',
        shaderLayout: {
          attributes: [
            {name: 'positions', location: 0, type: 'vec3<f32>'},
            {name: 'normals', location: 1, type: 'vec3<f32>'}
          ],
          bindings: [
            {name: 'lightMarkers', type: 'read-only-storage', group: 0, location: 0},
            {name: 'uniforms', type: 'uniform', group: 0, location: 1}
          ]
        },
        parameters: {
          cullMode: 'back',
          depthCompare: 'less-equal',
          depthWriteEnabled: true
        }
      });
      resourcesToDestroy.push(lightMarkerModel);
      const clusteredLightGrid = new ClusteredLightGrid(device, {
        id: 'lightstorm-five-target-test-clusters',
        clusterDimensions: [2, 2, 2],
        maxLightsPerCluster: 1,
        maxLightCount: 1
      });
      resourcesToDestroy.push(clusteredLightGrid);
      const deferredLightingRenderer = new ShaderPassRenderer(device, {
        shaderPasses: [createLightstormDeferredLightingCompositeShaderPass('rgba8unorm')],
        colorFormat: 'rgba8unorm'
      });
      resourcesToDestroy.push(deferredLightingRenderer);
      deferredLightingRenderer.resize([width, height]);

      clusteredLightGrid.encode(device.commandEncoder, {
        pointLights,
        pointLightCount: 1,
        projectionMatrix,
        nearPlane,
        farPlane
      });
      model.setBindings({instances, visibleIds: visibleIdentifiers, uniforms});
      model.predraw(device.commandEncoder);
      lightMarkerModel.setBindings({lightMarkers, uniforms});
      lightMarkerModel.predraw(device.commandEncoder);
      const renderPass = device.commandEncoder.beginRenderPass({
        id: 'lightstorm-five-target-test-render-pass',
        framebuffer: sceneGBuffer.framebuffer,
        clearColors: [
          new Float32Array([0.0015, 0.003, 0.012, 1]),
          new Float32Array([0.5, 0.5, 1, 1]),
          new Float32Array([0, 0, 0, 0]),
          new Float32Array([0, 0, 0, 0]),
          new Uint32Array([0, 0, 0, 0])
        ],
        clearDepth: 1
      });
      const didDraw = model.draw(renderPass);
      const didDrawLightMarkers = lightMarkerModel.draw(renderPass);
      renderPass.end();
      expect(didDraw).toBe(true);
      expect(didDrawLightMarkers).toBe(true);

      const makeResolveOptions = (lightBuffer: Buffer) => ({
        sourceTexture: sceneGBuffer.colorTexture,
        bindings: {
          depthTexture: sceneGBuffer.depthTexture,
          normalTexture: sceneGBuffer.normalRoughnessTexture,
          baseColorMetallicTexture: sceneGBuffer.getExtraColorTexture('baseColorMetallic'),
          emissiveOcclusionTexture: sceneGBuffer.getExtraColorTexture('emissiveOcclusion'),
          pointLights: lightBuffer,
          ...clusteredLightGrid.getShaderPassBindings()
        },
        uniforms: {
          clusteredDeferredLighting: {
            inverseProjectionMatrix: new Matrix4(projectionMatrix).invert(),
            ambientColor: [0, 0, 0],
            directionalLightDirectionView: [0.36, 0.82, 0.44],
            directionalLightColor: [1, 0.84, 0.68],
            directionalLightIntensity: 0,
            ...clusteredLightGrid.getShaderPassUniforms(nearPlane, farPlane)
          },
          lightstormDeferredComposite: {
            inverseProjectionMatrix: new Matrix4(projectionMatrix).invert(),
            fogColor: [0, 0, 0],
            forwardColorFloor: 0
          }
        }
      });
      const unlitTexture = deferredLightingRenderer.encodeToTexture(
        device.commandEncoder,
        makeResolveOptions(darkPointLights)
      );
      expect(unlitTexture).not.toBeNull();
      device.submit();

      const clusterCounts = await readUint32Buffer(clusteredLightGrid.clusterLightCounts);
      expect(clusterCounts.some(clusterCount => clusterCount === 1)).toBe(true);
      const unlitPixels = await readTexturePixels(unlitTexture!, width, height);

      const litTexture = deferredLightingRenderer.encodeToTexture(
        device.commandEncoder,
        makeResolveOptions(pointLights)
      );
      expect(litTexture).not.toBeNull();
      device.submit();
      const litPixels = await readTexturePixels(litTexture!, width, height);
      expect(sumRgb(litPixels)).toBeGreaterThan(sumRgb(unlitPixels));
    } finally {
      for (const resource of resourcesToDestroy.reverse()) {
        resource.destroy();
      }
    }
  }, 30_000);
});

async function readUint32Buffer(buffer: Buffer): Promise<Uint32Array> {
  const bytes = await buffer.readAsync();
  return new Uint32Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
}

function sumRgb(pixels: Uint8Array): number {
  let sum = 0;
  for (let index = 0; index < pixels.length; index++) {
    if (index % 4 !== 3) {
      sum += pixels[index]!;
    }
  }
  return sum;
}

async function readTexturePixels(
  texture: Texture,
  width: number,
  height: number
): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const paddedPixels = await buffer.readAsync(0, layout.byteLength);
    const pixels = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      pixels.set(
        new Uint8Array(
          paddedPixels.buffer,
          paddedPixels.byteOffset + row * layout.bytesPerRow,
          width * 4
        ),
        row * width * 4
      );
    }
    return pixels;
  } finally {
    buffer.destroy();
  }
}
