// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getTestDevices} from '@luma.gl/test-utils';
import {BackgroundTextureModel, DynamicTexture} from '@luma.gl/engine';
import {Texture} from '@luma.gl/core';

// Ensure setProps updates the texture immediately when texture is ready

test('BackgroundTextureModel#setProps updates texture', async t => {
  const devices = await getTestDevices();
  for (const device of devices) {
    if (device.type === 'webgpu') {
      continue; // eslint-disable-line no-continue
    }

    const texture1 = new DynamicTexture(device, {
      id: 'texture1',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([255, 0, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    const texture2 = new DynamicTexture(device, {
      id: 'texture2',
      usage: Texture.RENDER | Texture.COPY_SRC | Texture.COPY_DST,
      dimension: '2d',
      data: {data: new Uint8Array([0, 255, 0, 255]), width: 1, height: 1, format: 'rgba8unorm'}
    });
    await Promise.all([texture1.ready, texture2.ready]);

    const model = new BackgroundTextureModel(device, {backgroundTexture: texture1});
    t.equal(model.backgroundTexture, texture1.texture, 'initial texture set');

    model.setProps({backgroundTexture: texture2});
    t.equal(model.backgroundTexture, texture2.texture, 'background texture updated');

    model.destroy();
    texture1.destroy();
    texture2.destroy();
  }
  t.end();
});
