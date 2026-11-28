// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ANARIDevice, encodeRayTracingImagePNG} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';

it('encodes tiles as a PNG in top-left image order', async () => {
  const red = new Uint8Array([255, 0, 0, 255, 255, 0, 0, 255]);
  const green = new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]);
  const top = {x: 0, y: 0, width: 2, height: 1, data: red};
  const bottom = {x: 0, y: 1, width: 2, height: 1, data: green};
  const blob = await encodeRayTracingImagePNG(2, 2, [top, bottom]);
  expect(blob.type).toBe('image/png');
  const bitmap = await createImageBitmap(blob);
  try {
    expect([bitmap.width, bitmap.height]).toEqual([2, 2]);
    const context = new OffscreenCanvas(2, 2).getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    expect(Array.from(context.getImageData(0, 0, 2, 2).data)).toEqual([...red, ...green]);
  } finally {
    bitmap.close();
  }
  await expect(encodeRayTracingImagePNG(2, 2, [top])).rejects.toThrow();
  await expect(encodeRayTracingImagePNG(2, 2, [bottom, top])).rejects.toThrow();
});

it('exports a retained frame before its first render with an independent size and history', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const graphics = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(4, 4)}
  });
  const anari = new ANARIDevice(graphics);
  try {
    const renderer = anari.newRenderer('raytrace', {background: [0.3, 0.2, 0.1, 1]});
    const frame = anari.newFrame({
      world: anari.newWorld({}),
      camera: anari.newCamera('perspective', {}),
      renderer,
      size: [4, 4]
    });
    const options = {width: 5, height: 3, tileSize: 3};
    const sdr = [];
    for await (const tile of frame.exportTiles(options)) sdr.push(tile);
    expect(sdr.map(({x, y, width, height, data}) => [x, y, width, height, data.length])).toEqual([
      [0, 0, 3, 3, 36],
      [3, 0, 2, 3, 24]
    ]);
    const hdr = frame.exportTiles(options, 'rgba16float');
    expect((await hdr.next()).value?.data.length).toBe(72);
    await hdr.return(undefined);
    expect(frame.getParameter('size')).toEqual([4, 4]);
    expect(await frame.readRadiance()).toBeNull();
    frame.setParameters({renderer: anari.newRenderer('default', {})}).commitParameters();
    await expect(frame.exportTiles(options).next()).rejects.toThrow(
      'does not support tiled export'
    );
    frame.destroy();
  } finally {
    anari.destroy();
    graphics.destroy();
  }
});
