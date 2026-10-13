// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Deck, OrbitView, type OrbitViewState} from '@deck.gl/core';
import {Buffer, Texture, luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {ThreeSceneAdapter} from '../src/objects';
import {synchronizeThreeCamera} from '../src/deck';
import {
  HalfFloatType,
  Mesh,
  MeshStandardMaterial,
  RenderTarget,
  SRGBColorSpace,
  WebGPURenderer,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {
  createDeckLanternLayers,
  createDeckLanternScene
} from '../../../examples/experimental/three/deck-lantern-scene';

test('Lantern PBR/shadows and native deck courtyard share depth with upstream parity', async context => {
  if (!navigator.gpu) return context.skip('WebGPU unavailable');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  document.body.append(canvas);
  const device = await luma.createDevice({
    type: 'webgpu',
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: false}
  });
  const adapter = new ThreeSceneAdapter({device});
  await adapter.init();
  const reference = new WebGPURenderer({
    canvas: document.createElement('canvas'),
    antialias: false,
    outputBufferType: HalfFloatType
  });
  await reference.init();
  const scene = await createDeckLanternScene(adapter.renderer);
  const referenceScene = await createDeckLanternScene(reference);
  referenceScene.scene.add(referenceScene.referenceContext);
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
  const comparisonTarget = new RenderTarget(128, 128);
  comparisonTarget.texture.colorSpace = SRGBColorSpace;
  reference.setRenderTarget(comparisonTarget);
  reference.setSize(128, 128, false);
  const errors: string[] = [];
  const nativeDevice = device.handle as GPUDevice;
  nativeDevice.addEventListener('uncapturederror', event => errors.push(event.error.message));
  const beginPass = vi.spyOn(device, 'beginRenderPass');
  const drawScene = vi.spyOn(adapter, 'draw');
  const destroyDevice = vi.spyOn(device, 'destroy');
  let geometryDispose: ReturnType<typeof vi.spyOn> | undefined;
  scene.scene.traverse(object => {
    if (
      !geometryDispose &&
      object instanceof Mesh &&
      object.material instanceof MeshStandardMaterial
    )
      geometryDispose = vi.spyOn(object.geometry, 'dispose');
  });
  let deck: Deck<OrbitView> | undefined;
  let showContext = false;
  try {
    let borrowedEnd: ReturnType<typeof vi.spyOn> | undefined;
    let submissionCount = 0;
    const submit = vi.spyOn(device, 'submit');
    const viewState: OrbitViewState = {
      target: [0, 0, -0.15],
      zoom: 4.1,
      rotationX: 35,
      rotationOrbit: -25
    };
    await new Promise<void>((resolve, reject) => {
      deck = new Deck<OrbitView>({
        device,
        canvas,
        width: 128,
        height: 128,
        style: {position: 'relative'},
        useDevicePixels: false,
        views: new OrbitView({orbitAxis: 'Z', fovy: 45}),
        controller: false,
        viewState,
        _framebuffer: framebuffer,
        layers: createDeckLanternLayers(scene, adapter, {context: false}),
        onLoad: resolve,
        onError: reject,
        onBeforeRender: () => {
          const viewport = deck!.getViewports()[0];
          synchronizeThreeCamera(scene.camera, viewport, WebGPUCoordinateSystem);
          adapter.prepare(scene.scene, scene.camera);
          beginPass.mockClear();
          submissionCount = submit.mock.calls.length;
        }
      });
    });
    let baseline: Uint8Array | undefined;
    for (const settings of [
      {context: false, reverse: false, lighting: true, environment: true, shadows: true, phase: 0},
      {
        context: false,
        reverse: false,
        lighting: false,
        environment: false,
        shadows: false,
        phase: 0
      },
      {context: true, reverse: false, lighting: true, environment: true, shadows: true, phase: 1},
      {context: true, reverse: true, lighting: true, environment: true, shadows: true, phase: 1}
    ]) {
      showContext = settings.context;
      for (const fixture of [scene, referenceScene]) {
        fixture.update(settings.phase);
        fixture.light.intensity = settings.lighting ? 3 : 0;
        fixture.scene.environmentIntensity = settings.environment ? 1 : 0;
        fixture.light.shadow.intensity = settings.shadows ? 1 : 0;
      }
      referenceScene.referenceContext.visible = showContext;
      let borrowedPassCalls = 0;
      const draw = drawScene.getMockImplementation();
      drawScene.mockImplementation((source, camera, pass) => {
        borrowedEnd = vi.spyOn(pass, 'end');
        const count = submit.mock.calls.length;
        const result = ThreeSceneAdapter.prototype.draw.call(adapter, source, camera, pass);
        expect(borrowedEnd).not.toHaveBeenCalled();
        expect(submit.mock.calls.length).toBe(count);
        borrowedPassCalls++;
        return result;
      });
      await new Promise<void>((resolve, reject) =>
        deck!.setProps({
          layers: createDeckLanternLayers(scene, adapter, {
            context: showContext,
            reverseOrder: settings.reverse
          }),
          onAfterRender: resolve,
          onError: reject
        })
      );
      drawScene.mockImplementation(draw!);
      expect(borrowedPassCalls).toBe(1);
      expect(beginPass).toHaveBeenCalledTimes(1);
      // Deck submits before onAfterRender and its animation loop also submits at frame end.
      // The borrowed Three draw itself must not submit (checked above).
      expect(submit.mock.calls.length - submissionCount).toBeLessThanOrEqual(2);
      color.readBuffer({}, readback);
      const pixels = await readback.readAsync();
      synchronizeThreeCamera(
        referenceScene.camera,
        deck!.getViewports()[0],
        WebGPUCoordinateSystem
      );
      reference.render(referenceScene.scene, referenceScene.camera);
      const expected = await reference.readRenderTargetPixelsAsync(
        comparisonTarget,
        0,
        0,
        128,
        128
      );
      let maximum = 0;
      let total = 0;
      let differingPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        let difference = 0;
        for (let channel = 0; channel < 3; channel++) {
          const error = Math.abs(pixels[index + channel] - expected[index + channel]);
          maximum = Math.max(maximum, error);
          total += error;
          difference = Math.max(difference, error);
        }
        if (difference > 2) differingPixels++;
      }
      if (!showContext) {
        expect(maximum).toBeLessThanOrEqual(3);
        expect(total / (128 * 128 * 3)).toBeLessThan(0.3);
      } else {
        expect(total / (128 * 128 * 3)).toBeLessThan(1);
        expect(differingPixels / (128 * 128)).toBeLessThan(0.005);
      }
      if (settings.lighting && !showContext) baseline = pixels;
      if (!settings.lighting) expect(Array.from(pixels)).not.toEqual(Array.from(baseline!));
      if (settings.context && !settings.reverse) baseline = pixels;
      if (settings.reverse) expect(Array.from(pixels)).toEqual(Array.from(baseline!));
    }
    deck!.finalize();
    deck = undefined;
    adapter.dispose();
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(destroyDevice).not.toHaveBeenCalled();
    const probe = device.createBuffer({byteLength: 16});
    probe.destroy();
    await nativeDevice.queue.onSubmittedWorkDone();
    expect(errors).toEqual([]);
  } finally {
    deck?.finalize();
    adapter.dispose();
    reference.dispose();
    comparisonTarget.dispose();
    scene.dispose();
    referenceScene.dispose();
    framebuffer.destroy();
    color.destroy();
    readback.destroy();
    device.destroy();
    canvas.remove();
    vi.restoreAllMocks();
  }
}, 60000);
