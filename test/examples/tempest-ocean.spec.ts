// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Texture} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {fromHalfFloat} from '@luma.gl/shadertools';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';
import TempestOceanAnimationLoopTemplate from '../../examples/showcase/tempest-ocean/app';

describe('Tempest Ocean: Spectral Stormfront', () => {
  test('encodes simulation before draw and renders finite HDR ocean radiance', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }

    const width = 128;
    const height = 72;
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    let viewer: TempestOceanAnimationLoopTemplate | null = null;
    try {
      viewer = new TempestOceanAnimationLoopTemplate({
        device,
        width,
        height,
        simulationResolution: 8,
        gridResolution: 9,
        tileCount: 1,
        patchSize: 64
      });
      await viewer.onInitialize({
        ...makeAnimationProps(device, width, height, 1000),
        canvas
      } as AnimationProps);

      expect(viewer.gridPlan.gridResolution).toBe(9);
      expect(viewer.simulation.resolution).toBe(8);
      expect(viewer.oceanModel.bindings.oceanDisplacements).toBe(
        viewer.simulation.outputs.displacementBuffer
      );
      expect(viewer.oceanModel.bindings.oceanNormalFoam).toBe(
        viewer.simulation.outputs.normalFoamBuffer
      );
      expect(viewer.sceneColorTexture.format).toBe('rgba16float');
      expect(
        viewer.postprocessingRenderer.passRenderers.map(
          passRenderer => passRenderer.passDefinition.name
        )
      ).toEqual(['bloomShaderPassPipeline', 'toneMapping']);

      const frameStages: string[] = [];
      const encodeSimulation = viewer.simulation.encode.bind(viewer.simulation);
      vi.spyOn(viewer.simulation, 'encode').mockImplementation((commandEncoder, options) => {
        frameStages.push('simulation');
        return encodeSimulation(commandEncoder, options);
      });
      const drawOcean = viewer.oceanModel.draw.bind(viewer.oceanModel);
      vi.spyOn(viewer.oceanModel, 'draw').mockImplementation(renderPass => {
        frameStages.push('ocean-draw');
        return drawOcean(renderPass);
      });
      // This test targets the simulation, offscreen ocean draw, and HDR readback. The shared test
      // canvas can outlive Dawn's external presentation instance as the complete SwiftShader suite
      // advances through independent files, so verify the presentation handoff without acquiring a
      // swap-chain texture from that unrelated browser-owned instance.
      const presentToScreen = vi
        .spyOn(viewer.postprocessingRenderer, 'renderToScreen')
        .mockImplementation(() => {});

      viewer.onRender(makeAnimationProps(device, width, height, 1000));
      device.submit();
      expect(frameStages).toEqual(['simulation', 'ocean-draw']);
      expect(presentToScreen).toHaveBeenCalledTimes(1);
      expect(presentToScreen).toHaveBeenLastCalledWith(
        expect.objectContaining({sourceTexture: viewer.sceneColorTexture})
      );
      expect(viewer.oceanTimeSeconds).toBe(0);

      const sceneColor = await readRgba16FloatTexture(viewer.sceneColorTexture, width, height);
      expect(sceneColor.every(Number.isFinite)).toBe(true);
      expect(getMaximumRgb(sceneColor)).toBeGreaterThan(1);
      expect(getRgbRange(sceneColor)).toBeGreaterThan(0.05);

      viewer.onRender(makeAnimationProps(device, width, height, 1033));
      device.submit();
      expect(viewer.oceanTimeSeconds).toBeGreaterThan(0);
      const timeBeforePause = viewer.oceanTimeSeconds;
      globalThis.dispatchEvent(new KeyboardEvent('keydown', {key: 'p'}));
      viewer.onRender(makeAnimationProps(device, width, height, 1100));
      device.submit();
      expect(viewer.oceanTimeSeconds).toBe(timeBeforePause);

      globalThis.dispatchEvent(new KeyboardEvent('keydown', {key: 'r'}));
      viewer.onRender(makeAnimationProps(device, width, height, 1116));
      device.submit();
      expect(viewer.oceanTimeSeconds).toBe(0);
    } finally {
      viewer?.onFinalize();
      canvas.remove();
      vi.restoreAllMocks();
    }
  }, 30_000);
});

function makeAnimationProps(
  device: AnimationProps['device'],
  width: number,
  height: number,
  time: number
): AnimationProps {
  return {
    device,
    tick: Math.floor((time / 1000) * 60),
    time,
    width,
    height,
    aspect: width / height
  } as AnimationProps;
}

async function readRgba16FloatTexture(
  texture: Texture,
  width: number,
  height: number
): Promise<Float32Array> {
  const readOptions = {width, height};
  const layout = texture.computeMemoryLayout(readOptions);
  const readback = texture.device.createBuffer({
    id: `${texture.id}-tempest-test-readback`,
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer(readOptions, readback);
    texture.device.submit();
    const bytes = await readback.readAsync(0, layout.byteLength);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const values = new Float32Array(width * height * 4);
    for (let yCoordinate = 0; yCoordinate < height; yCoordinate++) {
      for (let xCoordinate = 0; xCoordinate < width; xCoordinate++) {
        const valueOffset = (xCoordinate + width * yCoordinate) * 4;
        const byteOffset = yCoordinate * layout.bytesPerRow + xCoordinate * layout.bytesPerPixel;
        for (let channel = 0; channel < 4; channel++) {
          values[valueOffset + channel] = fromHalfFloat(
            view.getUint16(byteOffset + channel * Uint16Array.BYTES_PER_ELEMENT, true)
          );
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

function getRgbRange(values: Float32Array): number {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (let valueOffset = 0; valueOffset < values.length; valueOffset += 4) {
    for (let channel = 0; channel < 3; channel++) {
      minimum = Math.min(minimum, values[valueOffset + channel]);
      maximum = Math.max(maximum, values[valueOffset + channel]);
    }
  }
  return maximum - minimum;
}
