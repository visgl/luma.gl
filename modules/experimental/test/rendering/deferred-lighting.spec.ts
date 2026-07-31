// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, Texture} from '@luma.gl/core';
import {ShaderPassRenderer} from '@luma.gl/engine';
import {
  createDeferredAmbientLightingShaderPassPipeline,
  createDeferredLightingShaderPassPipeline,
  deferredAmbientLighting,
  makeDeferredPointLightBufferData,
  MAX_DEFERRED_POINT_LIGHTS
} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('deferred lighting packs fixed-size point-light records', testCase => {
  const data = makeDeferredPointLightBufferData(
    [
      {
        position: [1, 2, 3],
        range: 4,
        color: [0.25, 0.5, 0.75],
        intensity: 6
      }
    ],
    2
  );

  testCase.equal(data.length, 16, 'the array reserves two vec4 values per light slot');
  testCase.deepEqual(
    Array.from(data.slice(0, 8)),
    [1, 2, 3, 4, 0.25, 0.5, 0.75, 6],
    'position/range and color/intensity use the shader record layout'
  );
  testCase.deepEqual(
    Array.from(data.slice(8)),
    new Array(8).fill(0),
    'unused fixed-capacity light slots stay zeroed'
  );
  testCase.throws(
    () => makeDeferredPointLightBufferData([], 0),
    /positive safe integer/,
    'invalid capacities are rejected'
  );
  testCase.throws(
    () =>
      makeDeferredPointLightBufferData(
        [{position: [0, 0, 0], range: 0, color: [1, 1, 1], intensity: 1}],
        1
      ),
    /range/,
    'invalid light ranges are rejected'
  );
  testCase.end();
});

test('deferred lighting exposes one composable fullscreen resolve', testCase => {
  const pipeline = createDeferredLightingShaderPassPipeline();
  testCase.equal(pipeline.steps.length, 1, 'the resolve is one fullscreen pass');
  testCase.equal(
    pipeline.steps[0].shaderPass.name,
    'deferredLighting',
    'the pipeline exposes the deferred-lighting pass'
  );
  testCase.equal(pipeline.steps[0].output, 'previous', 'lighting composes into the color chain');
  testCase.equal(MAX_DEFERRED_POINT_LIGHTS, 64, 'the exported capacity matches the WGSL loop');
  testCase.end();
});

test('deferred ambient lighting isolates the material ambient contribution', testCase => {
  const pipeline = createDeferredAmbientLightingShaderPassPipeline();
  testCase.equal(pipeline.steps.length, 1, 'ambient extraction remains one composable pass');
  testCase.equal(
    pipeline.steps[0].shaderPass,
    deferredAmbientLighting,
    'the pipeline exposes the reusable deferred ambient-light shader'
  );
  testCase.equal(
    deferredAmbientLighting.uniformTypes.ambientColor,
    'vec3<f32>',
    'ambient extraction uses the same linear ambient color as the lighting resolve'
  );
  testCase.ok(
    deferredAmbientLighting.source.includes('baseColor * deferredAmbientLighting.ambientColor'),
    'ambient extraction excludes direct lighting and emissive radiance'
  );
  testCase.end();
});

test('deferred lighting resolves G-buffer material attachments on WebGPU', async testCase => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    testCase.comment('WebGPU is not available');
    testCase.end();
    return;
  }

  const width = 4;
  const height = 4;
  const sourceTexture = device.createTexture({
    id: 'deferred-lighting-source',
    format: device.preferredColorFormat,
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const normalTexture = device.createTexture({
    id: 'deferred-lighting-normal',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const baseColorMetallicTexture = device.createTexture({
    id: 'deferred-lighting-base-color-metallic',
    format: 'rgba8unorm',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const emissiveOcclusionTexture = device.createTexture({
    id: 'deferred-lighting-emissive-occlusion',
    format: 'rgba8uint',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const depthTexture = device.createTexture({
    id: 'deferred-lighting-depth',
    format: 'depth24plus',
    width,
    height,
    usage: Texture.SAMPLE | Texture.RENDER | Texture.COPY_DST
  });
  const sceneFramebuffer = device.createFramebuffer({
    id: 'deferred-lighting-scene',
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
  const pointLights = device.createBuffer({
    id: 'deferred-lighting-point-lights',
    data: makeDeferredPointLightBufferData(
      [{position: [0, 0, -1], range: 6, color: [1, 0.4, 0.2], intensity: 4}],
      MAX_DEFERRED_POINT_LIGHTS
    ),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const renderer = new ShaderPassRenderer(device, {
    shaderPasses: [createDeferredLightingShaderPassPipeline()],
    flipY: false
  });
  renderer.resize([width, height]);

  try {
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
        pointLights
      },
      uniforms: {
        deferredLighting: {
          inverseProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
          ambientColor: [0.04, 0.04, 0.05],
          directionalLightDirectionView: [0.2, 0.7, -0.5],
          directionalLightColor: [1, 0.95, 0.9],
          directionalLightIntensity: 2,
          pointLightCount: 1
        }
      }
    });
    device.submit();

    testCase.ok(outputTexture, 'the material G-buffer resolves through the pass renderer');
  } finally {
    renderer.destroy();
    pointLights.destroy();
    sceneFramebuffer.destroy();
    sourceTexture.destroy();
    normalTexture.destroy();
    baseColorMetallicTexture.destroy();
    emissiveOcclusionTexture.destroy();
    depthTexture.destroy();
  }

  testCase.end();
});
