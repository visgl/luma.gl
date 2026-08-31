// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('clustered lighting exposes one composable fullscreen resolve', () => {
  const pipeline = createClusteredDeferredLightingShaderPassPipeline();
  expect(pipeline.steps.length, 'the resolve is one fullscreen pass').toBe(1);
  expect(
    pipeline.steps[0].shaderPass.name,
    'the pipeline exposes the clustered-lighting pass'
  ).toBe('clusteredDeferredLighting');
  expect(pipeline.steps[0].output, 'lighting composes into the color chain').toBe('previous');
  expect(MAX_CLUSTERED_POINT_LIGHTS, 'the exported cluster capacity is explicit').toBe(512);
});

it('clustered light grid conservatively bins camera-plane and orthographic lights', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const pointLights = device.createBuffer({
    id: 'clustered-lighting-projection-point-lights',
    data: makeDeferredPointLightBufferData(
      [{position: [0, 0, 0.25], range: 0.5, color: [1, 1, 1], intensity: 1}],
      1
    ),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const clusteredLightGrid = new ClusteredLightGrid(device, {
    id: 'clustered-lighting-projection-test-grid',
    clusterDimensions: [4, 4, 1],
    maxLightsPerCluster: 1,
    maxLightCount: 1
  });

  try {
    clusteredLightGrid.encode(device.commandEncoder, {
      pointLights,
      pointLightCount: 1,
      projectionMatrix: new Matrix4().perspective({
        fovy: radians(45),
        aspect: 1,
        near: 0.1,
        far: 20
      }),
      nearPlane: 0.1,
      farPlane: 20
    });
    device.submit();

    const perspectiveClusterCounts = await readClusterLightCounts(
      clusteredLightGrid.clusterLightCounts
    );
    expect(
      Boolean(perspectiveClusterCounts.every(clusterCount => clusterCount === 1)),
      'a visible sphere centered behind the camera conservatively covers every screen tile'
    ).toBe(true);

    pointLights.write(
      makeDeferredPointLightBufferData(
        [{position: [0.49, 0, -10], range: 0.3, color: [1, 1, 1], intensity: 1}],
        1
      )
    );
    clusteredLightGrid.encode(device.commandEncoder, {
      pointLights,
      pointLightCount: 1,
      projectionMatrix: new Matrix4().ortho({
        left: -1,
        right: 1,
        bottom: -1,
        top: 1,
        near: 0.1,
        far: 20
      }),
      nearPlane: 0.1,
      farPlane: 20
    });
    device.submit();

    const orthographicClusterCounts = await readClusterLightCounts(
      clusteredLightGrid.clusterLightCounts
    );
    expect(
      orthographicClusterCounts[2 * 4 + 3],
      'orthographic light bounds retain their world-space radius at far depths'
    ).toBe(1);
    expect(
      orthographicClusterCounts[2 * 4 + 1],
      'orthographic light bounds do not expand into unrelated screen tiles'
    ).toBe(0);
  } finally {
    clusteredLightGrid.destroy();
    pointLights.destroy();
  }
});

it('clustered light grid bins lights and resolves materials on WebGPU', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  const clusteredTestLights: DeferredPointLight[] = Array.from({length: 4}, (_, lightIndex) => ({
    position: [0, 0, -0.1],
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

    const renderClusteredLighting = () =>
      renderer.renderToTexture({
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

    const outputTexture = renderClusteredLighting();
    device.submit();

    const clusterCounts = await readClusterLightCounts(clusteredLightGrid.clusterLightCounts);
    const clusterIndexBytes = await clusteredLightGrid.clusterLightIndices.readAsync();
    const clusterLightIndices = new Uint32Array(
      clusterIndexBytes.buffer,
      clusterIndexBytes.byteOffset,
      clusterIndexBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    expect(clusterCounts[0], 'the compute pass preserves overflow pressure for debugging').toBe(
      clusteredTestLights.length
    );
    expect(
      Array.from(clusterLightIndices.slice(0, 2)),
      'overflow compaction retains a deterministic light-index prefix'
    ).toEqual([0, 1]);
    expect(
      clusteredLightGrid.getShaderPassUniforms(0.1, 20).pointLightCount,
      'the fullscreen resolve receives the active point-light prefix'
    ).toBe(clusteredTestLights.length);
    expect(
      Boolean(outputTexture),
      'the clustered material G-buffer resolves through the pass'
    ).toBe(true);

    if (outputTexture) {
      const originalOutput = await readTexturePixel(outputTexture);
      const inactiveLights: DeferredPointLight[] = Array.from({length: 4}, () => ({
        position: [0, 0, -0.1],
        range: 2,
        color: [0, 1, 0],
        intensity: 100
      }));
      pointLights.write(
        makeDeferredPointLightBufferData([...clusteredTestLights, ...inactiveLights], 8)
      );
      clusteredLightGrid.encode(device.commandEncoder, {
        pointLights,
        pointLightCount: clusteredTestLights.length,
        projectionMatrix,
        nearPlane: 0.1,
        farPlane: 20
      });
      const outputWithInactiveLights = renderClusteredLighting();
      device.submit();

      if (outputWithInactiveLights) {
        expect(
          Array.from(await readTexturePixel(outputWithInactiveLights)),
          'overflow fallback ignores stale light records beyond the active prefix'
        ).toEqual(Array.from(originalOutput));
      }
    }
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
});

async function readClusterLightCounts(clusterLightCounts: Buffer): Promise<Uint32Array> {
  const clusterCountBytes = await clusterLightCounts.readAsync();
  return new Uint32Array(
    clusterCountBytes.buffer,
    clusterCountBytes.byteOffset,
    clusterCountBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
  );
}

async function readTexturePixel(texture: Texture): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width: 1, height: 1});
  const readbackBuffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width: 1, height: 1}, readbackBuffer);
    const pixelBytes = await readbackBuffer.readAsync(0, layout.byteLength);
    return new Uint8Array(pixelBytes.buffer, pixelBytes.byteOffset, 8).slice();
  } finally {
    readbackBuffer.destroy();
  }
}
