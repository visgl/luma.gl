// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, OrbitView, type OrbitViewState} from '@deck.gl/core';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {ThreeMeshAdapter} from '../src/objects';
import {synchronizeThreeCamera} from '../src/deck';
import {
  RenderTarget,
  SRGBColorSpace,
  UnsignedByteType,
  WebGPURenderer,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {createDeckLayers, createDeckScene} from '../../../examples/experimental/three/deck-scene';

test('Three meshes share deck device, pass, depth and camera with native ScatterplotLayer', async context => {
  if (!navigator.gpu) return context.skip('WebGPU unavailable');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  document.body.append(canvas);
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: false}
  });
  const color = device.createTexture({
    width: 128,
    height: 128,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 128,
    height: 128,
    colorAttachments: [color],
    depthStencilAttachment: 'depth32float'
  });
  const readback = device.createBuffer({
    byteLength: 128 * 128 * 4,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    antialias: false
  });
  const target = new RenderTarget(128, 128, {type: UnsignedByteType});
  target.texture.colorSpace = SRGBColorSpace;
  const scene = createDeckScene();
  const referenceScene = createDeckScene();
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const beginPass = vi.spyOn(device, 'beginRenderPass');
  const drawAdapter = vi.spyOn(ThreeMeshAdapter.prototype, 'draw');
  const disposeGeometry = vi.spyOn(scene.mesh.geometry, 'dispose');
  const disposeMaterial = vi.spyOn(scene.mesh.material, 'dispose');
  const destroyDevice = vi.spyOn(device, 'destroy');
  const createPipeline = vi.spyOn(device, 'createRenderPipeline');
  let deck: Deck<OrbitView> | undefined;
  try {
    await reference.init();
    reference.setRenderTarget(target);
    const viewState: OrbitViewState = {target: [0, 0, 0], zoom: 5, rotationX: 0, rotationOrbit: 0};
    await new Promise<void>((resolve, reject) => {
      deck = new Deck<OrbitView>({
        device,
        canvas,
        width: 128,
        height: 128,
        useDevicePixels: false,
        style: {position: 'relative'},
        views: new OrbitView({orbitAxis: 'Y', fovy: 45}),
        viewState,
        controller: false,
        _framebuffer: framebuffer,
        layers: createDeckLayers(scene),
        onLoad: resolve,
        onError: reject
      });
    });
    for (const [phase, cameraState] of [
      [0, viewState],
      [Math.PI / 2, viewState],
      [0.7, {...viewState, target: [0.2, -0.1, 0.1], rotationX: 25, rotationOrbit: -35, zoom: 5.3}]
    ] as const) {
      scene.update(phase);
      referenceScene.update(phase);
      let previousPixels: Uint8Array | undefined;
      for (const reverseOrder of [false, true]) {
        drawAdapter.mockClear();
        beginPass.mockClear();
        await new Promise<void>((resolve, reject) =>
          deck!.setProps({
            layers: createDeckLayers(scene, reverseOrder),
            viewState: cameraState,
            onAfterRender: resolve,
            onError: reject
          })
        );
        expect(drawAdapter).toHaveBeenCalledTimes(1);
        const sharedPass = drawAdapter.mock.calls[0][0];
        expect(sharedPass.device).toBe(device);
        expect(sharedPass.props.framebuffer).toBe(framebuffer);
        expect(beginPass).toHaveBeenCalledTimes(1);
        expect(
          createPipeline.mock.calls.some(
            ([props]) => props.depthStencilAttachmentFormat === 'depth32float'
          )
        ).toBe(true);
        color.readBuffer({}, readback);
        const pixels = await readback.readAsync();
        const viewport = deck!.getViewports()[0];
        synchronizeThreeCamera(referenceScene.camera, viewport, WebGPUCoordinateSystem);
        reference.render(referenceScene.scene, referenceScene.camera);
        const referencePixels = await reference.readRenderTargetPixelsAsync(target, 0, 0, 128, 128);
        let difference = 0;
        let differingPixels = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          let maximum = 0;
          for (let channel = 0; channel < 3; channel++) {
            const distance = Math.abs(pixels[index + channel] - referencePixels[index + channel]);
            difference += distance;
            maximum = Math.max(maximum, distance);
          }
          if (maximum > 2) differingPixels++;
        }
        // Native deck circles are analytic; Three's reference uses a 1024-sided polygon.
        expect(difference / (128 * 128 * 3)).toBeLessThan(1);
        expect(differingPixels / (128 * 128)).toBeLessThan(0.005);
        const center = (64 * 128 + 64) * 4;
        if (phase === 0) expect(pixels[center]).toBeGreaterThan(pixels[center + 1]);
        if (phase === Math.PI / 2) expect(pixels[center + 1]).toBeGreaterThan(pixels[center]);
        if (previousPixels) expect(Array.from(pixels)).toEqual(Array.from(previousPixels));
        previousPixels = pixels;
      }
    }
    deck!.finalize();
    deck = undefined;
    expect(disposeGeometry).not.toHaveBeenCalled();
    expect(disposeMaterial).not.toHaveBeenCalled();
    expect(destroyDevice).not.toHaveBeenCalled();
    const probe = device.createBuffer({byteLength: 16});
    probe.destroy();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    deck?.finalize();
    reference.dispose();
    target.dispose();
    scene.dispose();
    referenceScene.dispose();
    readback.destroy();
    framebuffer.destroy();
    color.destroy();
    device.destroy();
    canvas.remove();
    vi.restoreAllMocks();
  }
}, 60000);
