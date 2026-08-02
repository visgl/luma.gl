// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Buffer, type Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import VolumetricFireForgeAnimationLoopTemplate from '../../examples/experimental/volumetric-fire-forge/app';

describe('Volumetric Fire Forge', () => {
  test('advances the simulation and renders the HDR volume pipeline on WebGPU', async () => {
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
    let viewer: VolumetricFireForgeAnimationLoopTemplate | null = null;
    const simulationDimensions = [16, 24, 16] as const;
    try {
      viewer = new VolumetricFireForgeAnimationLoopTemplate({
        device,
        width: 1,
        height: 1,
        simulationDimensions,
        pressureIterations: 2
      } as AnimationProps & {
        simulationDimensions: readonly [number, number, number];
        pressureIterations: number;
      });
      viewer.settings.sampleCount = 16;
      const initialSceneColorTexture = viewer.renderer.sceneColorTexture;
      const initialSceneDepthTexture = viewer.renderer.sceneDepthTexture;

      expect(viewer.simulation.stats.nodeOrder).toEqual([
        'advect-fire-velocity',
        'measure-divergence-and-clear-pressure',
        'project-pressure-1',
        'project-pressure-2',
        'project-fire-velocity',
        'advect-react-and-emit',
        'commit-combustion'
      ]);
      expect([
        viewer.renderer.sceneColorTexture.format,
        viewer.renderer.sceneDepthTexture.format
      ]).toEqual([viewer.renderer.sceneColorFormat, 'depth24plus']);
      expect(
        viewer.renderer.volumeRenderer.passRenderers.map(
          passRenderer => passRenderer.passDefinition.name
        )
      ).toEqual(['volumetricFireCompositeShaderPassPipeline']);
      expect(
        viewer.renderer.postprocessingRenderer.passRenderers.map(
          passRenderer => passRenderer.passDefinition.name
        )
      ).toEqual(['bloomShaderPassPipeline', 'toneMapping']);

      viewer.onRender(makeAnimationProps(device, 1000));
      device.submit();
      expect(viewer.stepsThisFrame).toBeGreaterThan(0);
      expect(viewer.renderer.framebufferSize).toEqual([96, 72]);
      expect(viewer.renderer.sceneColorTexture).not.toBe(initialSceneColorTexture);
      expect(viewer.renderer.sceneDepthTexture).not.toBe(initialSceneDepthTexture);
      expect(initialSceneColorTexture.destroyed).toBe(true);
      expect(initialSceneDepthTexture.destroyed).toBe(true);

      viewer.onRender(makeAnimationProps(device, 1017));
      device.submit();
      expect(viewer.stepsThisFrame).toBeGreaterThan(0);
      expect(viewer.frameIndex).toBe(6);

      // A live AnimationLoop tick advances at 60 units per second, while time is milliseconds.
      // Run through the startup warmup and prove the fixed-step clock continues at display rate.
      for (let frameIndex = 2; frameIndex < 10; frameIndex++) {
        viewer.onRender(makeAnimationProps(device, 1000 + frameIndex * 17));
        device.submit();
      }
      expect(viewer.stepsThisFrame).toBe(1);
      expect(viewer.frameIndex).toBe(26);

      const combustion = await readRgba16FloatVolume(
        viewer.simulation.combustionTexture,
        simulationDimensions
      );
      let maximumCombustion = 0;
      for (let valueOffset = 0; valueOffset < combustion.length; valueOffset += 4) {
        maximumCombustion = Math.max(
          maximumCombustion,
          combustion[valueOffset],
          combustion[valueOffset + 1],
          combustion[valueOffset + 2]
        );
      }
      expect(maximumCombustion).toBeGreaterThan(0.01);

      viewer.settings.debugView = 'Temperature';
      viewer.onRender(makeAnimationProps(device, 1170));
      device.submit();
      expect(viewer.lastVolumeTexture).not.toBeNull();
      const temperatureOutput = await readColorTexture(viewer.lastVolumeTexture!, [96, 72, 1]);
      expect(getMaximumRgb(temperatureOutput)).toBeGreaterThan(0.01);

      viewer.settings.debugView = 'Obstacles';
      viewer.onRender(makeAnimationProps(device, 1187));
      device.submit();
      const obstacleOutput = await readColorTexture(viewer.lastVolumeTexture!, [96, 72, 1]);
      expect(getMaximumRgb(obstacleOutput)).toBeGreaterThan(0.9);

      viewer.settings.paused = true;
      viewer.requestReset();
      viewer.onRender(makeAnimationProps(device, 1204));
      device.submit();
      expect(viewer.stepsThisFrame).toBe(1);
      const resetFrameIndex = viewer.frameIndex;

      viewer.onRender(makeAnimationProps(device, 1221));
      device.submit();
      expect(viewer.stepsThisFrame).toBe(0);
      expect(viewer.frameIndex).toBe(resetFrameIndex);

      viewer.requestSingleStep();
      viewer.onRender(makeAnimationProps(device, 1238));
      device.submit();
      expect(viewer.stepsThisFrame).toBe(1);
      expect(viewer.frameIndex).toBe(resetFrameIndex + 1);
    } finally {
      viewer?.onFinalize();
      host.remove();
    }
  }, 30_000);
});

function makeAnimationProps(device: AnimationProps['device'], time: number): AnimationProps {
  return {
    device,
    tick: Math.floor((time / 1000) * 60),
    time,
    width: 96,
    height: 72,
    aspect: 96 / 72
  } as AnimationProps;
}

async function readRgba16FloatVolume(
  texture: Texture,
  dimensions: readonly [number, number, number]
): Promise<Float32Array> {
  if (texture.format !== 'rgba16float') {
    throw new Error(`Expected rgba16float texture, received ${texture.format}.`);
  }
  return readColorTexture(texture, dimensions);
}

async function readColorTexture(
  texture: Texture,
  dimensions: readonly [number, number, number]
): Promise<Float32Array> {
  const isHalfFloat = texture.format === 'rgba16float';
  if (!isHalfFloat && texture.format !== 'rgba8unorm') {
    throw new Error(`Unsupported color readback format ${texture.format}.`);
  }
  const readOptions = {
    width: dimensions[0],
    height: dimensions[1],
    depthOrArrayLayers: dimensions[2]
  };
  const layout = texture.computeMemoryLayout(readOptions);
  const readback = texture.device.createBuffer({
    id: `${texture.id}-example-test-readback`,
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(readOptions, readback);
    const bytes = await readback.readAsync();
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const values = new Float32Array(dimensions[0] * dimensions[1] * dimensions[2] * 4);
    for (let zCoordinate = 0; zCoordinate < dimensions[2]; zCoordinate++) {
      for (let yCoordinate = 0; yCoordinate < dimensions[1]; yCoordinate++) {
        for (let xCoordinate = 0; xCoordinate < dimensions[0]; xCoordinate++) {
          const valueOffset =
            (xCoordinate + dimensions[0] * (yCoordinate + dimensions[1] * zCoordinate)) * 4;
          const byteOffset =
            zCoordinate * layout.bytesPerImage +
            yCoordinate * layout.bytesPerRow +
            xCoordinate * layout.bytesPerPixel;
          for (let channel = 0; channel < 4; channel++) {
            values[valueOffset + channel] = isHalfFloat
              ? fromHalfFloat(
                  view.getUint16(byteOffset + channel * Uint16Array.BYTES_PER_ELEMENT, true)
                )
              : view.getUint8(byteOffset + channel) / 255;
          }
        }
      }
    }
    return values;
  } finally {
    readback.destroy();
  }
}

function getMaximumRgb(values: Float32Array): number {
  let maximum = 0;
  for (let valueOffset = 0; valueOffset < values.length; valueOffset += 4) {
    maximum = Math.max(
      maximum,
      values[valueOffset],
      values[valueOffset + 1],
      values[valueOffset + 2]
    );
  }
  return maximum;
}
