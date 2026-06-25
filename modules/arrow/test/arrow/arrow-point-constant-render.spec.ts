// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {Buffer, Texture} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {prepareArrowPointInput} from '../../../../examples/arrow/arrow-points/arrow-point-renderer';
import {
  createPointModel,
  createPointShaderInputs,
  type PointModelMode
} from '../../../../examples/arrow/arrow-points/point-model';

test('Arrow points render constant styles through WebGPU attributes and storage', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const positions = makeArrowFixedSizeListVector(
    new arrow.Float32(),
    2,
    new Float32Array([0, 0, 0.5, 0.5])
  );
  const prepared = await prepareArrowPointInput(device, {
    positions,
    colors: null,
    radii: null,
    radius: 0.35,
    timeColumn: null
  });
  const shaderInputs = createPointShaderInputs(device);
  shaderInputs.setProps({
    pointViewport: {
      center: [0, 0],
      scale: 1,
      aspect: 1,
      currentTime: 0,
      trailLength: 1,
      timeEnabled: 0
    }
  });

  for (const mode of ['attributes', 'storage'] as const satisfies PointModelMode[]) {
    const colorTexture = device.createTexture({
      width: 8,
      height: 8,
      format: 'rgba8unorm',
      usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 8,
      height: 8,
      colorAttachments: [colorTexture]
    });
    const model = createPointModel(device, {
      id: `arrow-point-constant-${mode}`,
      table: prepared.table,
      shaderInputs,
      mode
    });
    await waitForPipeline(model.pipeline);
    t.equal(model.pipeline.linkStatus, 'success', `${mode} pipeline links`);

    const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 0]});
    t.ok(model.drawBatches(renderPass), `${mode} batch draw succeeds`);
    renderPass.end();
    device.submit();
    const pixels = await readPixels(colorTexture, 8, 8);
    t.ok(
      pixels.some((value, index) => index % 4 === 3 && value > 0),
      `${mode} renders visible point pixels`
    );

    model.destroy();
    framebuffer.destroy();
    colorTexture.destroy();
  }

  prepared.destroy();
  t.end();
});

async function waitForPipeline(pipeline: {
  linkStatus: 'pending' | 'success' | 'error';
}): Promise<void> {
  for (let iteration = 0; iteration < 100 && pipeline.linkStatus === 'pending'; iteration++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function readPixels(texture: Texture, width: number, height: number): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const arrayBufferView = await buffer.readAsync(0, layout.byteLength);
    const result = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      result.set(
        new Uint8Array(
          arrayBufferView.buffer,
          arrayBufferView.byteOffset + row * layout.bytesPerRow,
          width * 4
        ),
        row * width * 4
      );
    }
    return result;
  } finally {
    buffer.destroy();
  }
}
