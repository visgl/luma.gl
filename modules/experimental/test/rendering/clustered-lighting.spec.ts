// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  ClusteredLightGrid,
  createClusteredDeferredLightingShaderPassPipeline,
  makeDeferredPointLightBufferData,
  MAX_CLUSTERED_POINT_LIGHTS,
  type DeferredPointLight
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Matrix4, radians} from '@math.gl/core';

test('clustered lighting exposes one composable fullscreen resolve', testCase => {
  const pipeline = createClusteredDeferredLightingShaderPassPipeline();
  testCase.equal(pipeline.steps.length, 1, 'the resolve is one fullscreen pass');
  testCase.equal(
    pipeline.steps[0].shaderPass.name,
    'clusteredDeferredLighting',
    'the pipeline exposes the clustered-lighting pass'
  );
  testCase.equal(pipeline.steps[0].output, 'previous', 'lighting composes into the color chain');
  testCase.equal(MAX_CLUSTERED_POINT_LIGHTS, 512, 'the exported cluster capacity is explicit');
  testCase.end();
});

test('clustered light grid bins lights and resolves materials on WebGPU', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 4;
  const height = 4;
  const projectionMatrix = new Matrix4().perspective({
    fovy: radians(45),
    aspect: 1,
    near: 0.1,
    far: 20
  });
  const clusteredTestLights: DeferredPointLight[] = Array.from({length: 8}, (_, lightIndex) => ({
    position: [0, 0, -4],
    range: 2,
    color: [1, 0.4 + lightIndex * 0.01, 0.2],
    intensity: 4
  }));
  const pointLights = device.createBuffer({
    id: 'clustered-lighting-point-lights',
    data: makeDeferredPointLightBufferData(clusteredTestLights, 8),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusteredLightGrid = new ClusteredLightGrid(device, {
    id: 'clustered-lighting-test-grid',
    clusterDimensions: [1, 1, 1],
    maxLightsPerCluster: 2,
    maxLightCount: 8
  });
  const sourceTexture = device.createTexture({
    id: 'clustered-lighting-source',
    format: 'rgba16float',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const normalTexture = device.createTexture({
    id: 'clustered-lighting-normal',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const baseColorMetallicTexture = device.createTexture({
    id: 'clustered-lighting-base-color-metallic',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const emissiveOcclusionTexture = device.createTexture({
    id: 'clustered-lighting-emissive-occlusion',
    format: 'rgba8uint',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const depthTexture = device.createTexture({
    id: 'clustered-lighting-depth',
    format: 'depth24plus',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const sceneFramebuffer = device.createFramebuffer({
    id: 'clustered-lighting-scene',
    width,
    height,
    colorAttachments: [
      sourceTexture,
      normalTexture,
      baseColorMetallicTexture,
      emissiveOcclusionTexture
    ],
    depthStencilAttachment: depthTexture
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createClusteredDeferredLightingShaderPassPipeline()],
    colorFormat: 'rgba16float',
    flipY: false
  });
  renderer.resize([width, height]);

  try {
    clusteredLightGrid.encode(device.commandEncoder, {
      pointLights,
      pointLightCount: clusteredTestLights.length,
      projectionMatrix,
      nearPlane: 0.1,
      farPlane: 20
    });
    const sceneRenderPass = device.beginRenderPass({
      framebuffer: sceneFramebuffer,
      clearColors: [
        new Float32Array([0.01, 0.01, 0.01, 1]),
        new Float32Array([0.5, 0.5, 1, 0.4]),
        new Float32Array([0.72, 0.12, 0.08, 0.35]),
        new Float32Array([5, 3, 0, 255])
      ],
      clearDepth: 0.5
    });
    sceneRenderPass.end();

    const outputTexture = renderer.renderToTexture({
      sourceTexture,
      bindings: {
        depthTexture,
        normalTexture,
        baseColorMetallicTexture,
        emissiveOcclusionTexture,
        pointLights,
        ...clusteredLightGrid.getShaderPassBindings()
      },
      uniforms: {
        clusteredDeferredLighting: {
          inverseProjectionMatrix: new Matrix4(projectionMatrix).invert(),
          ambientColor: [0.04, 0.04, 0.05],
          directionalLightDirectionView: [0.2, 0.7, -0.5],
          directionalLightColor: [1, 0.95, 0.9],
          directionalLightIntensity: 2,
          ...clusteredLightGrid.getShaderPassUniforms(0.1, 20)
        }
      }
    });
    device.submit();

    const clusterCountBytes = await clusteredLightGrid.clusterLightCounts.readAsync();
    const clusterIndexBytes = await clusteredLightGrid.clusterLightIndices.readAsync();
    const clusterCounts = new Uint32Array(
      clusterCountBytes.buffer,
      clusterCountBytes.byteOffset,
      clusterCountBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    const clusterLightIndices = new Uint32Array(
      clusterIndexBytes.buffer,
      clusterIndexBytes.byteOffset,
      clusterIndexBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    testCase.equal(
      clusterCounts[0],
      clusteredTestLights.length,
      'the compute pass preserves overflow pressure for debugging'
    );
    testCase.deepEqual(
      Array.from(clusterLightIndices.slice(0, 2)),
      [0, 1],
      'overflow compaction retains a deterministic light-index prefix'
    );
    testCase.ok(outputTexture, 'the clustered material G-buffer resolves through the pass');
  } finally {
    renderer.destroy();
    sceneFramebuffer.destroy();
    sourceTexture.destroy();
    normalTexture.destroy();
    baseColorMetallicTexture.destroy();
    emissiveOcclusionTexture.destroy();
    depthTexture.destroy();
    clusteredLightGrid.destroy();
    pointLights.destroy();
  }

  testCase.end();
});
