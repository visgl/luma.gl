import {expect, test} from 'vitest';
import { getTestDevices } from '@luma.gl/test-utils';
import { BackgroundTextureModel, DynamicTexture } from '@luma.gl/engine';
import { Texture } from '@luma.gl/core';

// Ensure setProps updates the texture immediately when texture is ready

test('BackgroundTextureModel#setProps updates texture', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }
    const texture1 = new DynamicTexture(device, {
      id: 'texture1',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {
        data: new Uint8Array([255, 0, 0, 255]),
        width: 1,
        height: 1,
        format: 'rgba8unorm'
      }
    });
    const texture2 = new DynamicTexture(device, {
      id: 'texture2',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {
        data: new Uint8Array([0, 255, 0, 255]),
        width: 1,
        height: 1,
        format: 'rgba8unorm'
      }
    });
    await Promise.all([texture1.ready, texture2.ready]);
    const model = new BackgroundTextureModel(device, {
      backgroundTexture: texture1
    });
    expect(model.backgroundTexture, 'initial texture set').toBe(texture1.texture);
    model.setProps({
      backgroundTexture: texture2
    });
    expect(model.backgroundTexture, 'background texture updated').toBe(texture2.texture);
    model.destroy();
    texture1.destroy();
    texture2.destroy();
  }
});
test('BackgroundTextureModel#blend uses destination alpha compositing', async () => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }
    const texture = new DynamicTexture(device, {
      id: 'texture',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {
        data: new Uint8Array([255, 0, 0, 255]),
        width: 1,
        height: 1,
        format: 'rgba8unorm'
      }
    });
    await texture.ready;
    const model = new BackgroundTextureModel(device, {
      backgroundTexture: texture,
      blend: true
    });
    expect(model.parameters.blend, 'blending enabled').toBe(true);
    expect(model.parameters.blendColorSrcFactor, 'background color scales with scene transparency').toBe('one-minus-dst-alpha');
    expect(model.parameters.blendColorDstFactor, 'scene color is preserved during background compositing').toBe('one');
    expect(model.parameters.blendAlphaSrcFactor, 'background alpha follows destination transparency').toBe('one-minus-dst-alpha');
    expect(model.parameters.blendAlphaDstFactor, 'scene alpha is preserved during background compositing').toBe('one');
    model.destroy();
    texture.destroy();
  }
});
