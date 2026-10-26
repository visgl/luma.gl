// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, Texture} from '@luma.gl/core';
import {getTestDevices} from '@luma.gl/test-utils';

const DEVICE_TYPES = ['webgl', 'webgpu'] as const;

it('Device command-encoder buffer writes preserve command order', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const sourceBuffer = device.createBuffer({
      byteLength: Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const destinationBuffer = device.createBuffer({
      byteLength: 2 * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.COPY_SRC | Buffer.COPY_DST
    });
    const commandEncoder = device.createCommandEncoder({id: `${device.type}-ordered-writes`});

    device.writeBufferViaCommandEncoder(commandEncoder, sourceBuffer, new Uint32Array([1]));
    commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      destinationOffset: 0,
      size: Uint32Array.BYTES_PER_ELEMENT
    });
    device.writeBufferViaCommandEncoder(commandEncoder, sourceBuffer, new Uint32Array([2]));
    commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      destinationOffset: Uint32Array.BYTES_PER_ELEMENT,
      size: Uint32Array.BYTES_PER_ELEMENT
    });

    device.submit(commandEncoder.finish());
    const receivedData = await destinationBuffer.readAsync();
    expect(
      Array.from(
        new Uint32Array(
          receivedData.buffer,
          receivedData.byteOffset,
          receivedData.byteLength / Uint32Array.BYTES_PER_ELEMENT
        )
      ),
      `${device.type} preserves encoded write/copy order`
    ).toEqual([1, 2]);

    sourceBuffer.destroy();
    destinationBuffer.destroy();
  }
});

it('Device render passes run after copies encoded before them', async () => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const sourceTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_SRC | Texture.COPY_DST | Texture.RENDER,
      data: new Uint8Array([255, 0, 0, 255])
    });
    const destinationTexture = device.createTexture({
      width: 1,
      height: 1,
      format: 'rgba8unorm',
      usage: Texture.COPY_SRC | Texture.COPY_DST | Texture.RENDER
    });
    const framebuffer = device.createFramebuffer({colorAttachments: [destinationTexture]});
    const commandEncoder = device.createCommandEncoder({id: `${device.type}-copy-before-pass`});

    // The copy writes red, then the later pass clears to blue. Blue must win.
    commandEncoder.copyTextureToTexture({sourceTexture, destinationTexture});
    const renderPass = commandEncoder.beginRenderPass({framebuffer, clearColor: [0, 0, 1, 1]});
    renderPass.end();
    device.submit(commandEncoder.finish());

    const layout = destinationTexture.computeMemoryLayout({width: 1, height: 1});
    const readBuffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    destinationTexture.readBuffer({width: 1, height: 1}, readBuffer);
    const receivedData = await readBuffer.readAsync();
    expect(Array.from(receivedData.slice(0, 4)), `${device.type} pass runs after the copy`).toEqual(
      [0, 0, 255, 255]
    );

    readBuffer.destroy();
    framebuffer.destroy();
    destinationTexture.destroy();
    sourceTexture.destroy();
  }
});
