// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {LumaRenderer} from '@luma.gl/three/backend';
import {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {synchronizeThreeCamera} from '@luma.gl/three/deck';
import {WebGPUCoordinateSystem} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Deck, OrbitView} from '@deck.gl/core';
import {MixedObjectRenderer} from './mixed-object-renderer';
import {createObjectScene} from './object-scene';
import {createGLTFScene} from './gltf-scene';
import {createDeckLanternScene, createDeckLanternLayers} from './deck-lantern-scene';

/** Dedicated single-surface examples: the luma context owns the drawing-buffer size. */
async function initialize(): Promise<void> {
  const container = document.querySelector<HTMLElement>('#viewport')!;
  const canvas = container.querySelector('canvas')!;
  const status = document.querySelector<HTMLElement>('#status')!;
  const integration = new URLSearchParams(location.search).get('integration') || 'core';
  const device = await luma.createDevice({
    adapters: [webgpuAdapter, webgl2Adapter],
    type: integration === 'core' && !navigator.gpu ? 'webgl' : 'webgpu',
    createCanvasContext: {canvas, autoResize: true, useDevicePixels: true}
  });
  const context = device.getDefaultCanvasContext();
  await context.initialized;
  let isReady = false;
  const reportReady = () => {
    if (isReady) return;
    isReady = true;
    window.parent.postMessage({type: 'luma-example-ready'}, window.location.origin);
  };
  const start = performance.now();
  if (integration === 'deck') {
    const adapter = new ThreeSceneAdapter({device});
    await adapter.init();
    const fixture = await createDeckLanternScene(adapter.renderer);
    const deck = new Deck({
      device,
      canvas,
      width: null,
      height: null,
      useDevicePixels: true,
      views: new OrbitView({orbitAxis: 'Z', fovy: 45, near: 0.1, far: 1000}),
      initialViewState: {target: [0, 0, -0.15], zoom: 6.1, rotationX: 35, rotationOrbit: -25},
      controller: true,
      _animate: true,
      layers: createDeckLanternLayers(fixture, adapter),
      onLoad: () => {
        status.hidden = true;
      },
      onError: error => {
        status.hidden = false;
        status.textContent = String(error);
      },
      onBeforeRender: () => {
        const viewport = deck.getViewports()[0];
        if (!viewport) return;
        fixture.update((performance.now() - start) / 1000);
        synchronizeThreeCamera(fixture.camera, viewport, WebGPUCoordinateSystem);
        adapter.prepare(fixture.scene, fixture.camera);
      },
      onAfterRender: () => {
        reportReady();
        deck.setProps({layers: createDeckLanternLayers(fixture, adapter)});
      }
    });
    window.addEventListener(
      'pagehide',
      () => {
        deck.finalize();
        adapter.dispose();
        fixture.dispose();
        device.destroy();
      },
      {once: true}
    );
    return;
  }
  const renderer =
    integration === 'engine' ? new MixedObjectRenderer(device) : new LumaRenderer({device});
  await renderer.init();
  const fixture =
    integration === 'engine'
      ? createObjectScene()
      : await createGLTFScene(renderer as LumaRenderer, 'materials');
  const controls = new OrbitControls(fixture.camera, canvas);
  let disposed = false;
  // CSS dimensions determine camera projection; CanvasContext observes physical dimensions.
  const resize = () => {
    fixture.camera.aspect =
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    fixture.camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  status.hidden = true;
  let drawingBufferWidth = 0;
  let drawingBufferHeight = 0;
  renderer.setAnimationLoop(() => {
    if (disposed || !container.clientWidth || !container.clientHeight) return;
    const [width, height] = context.getDrawingBufferSize();
    if (width !== drawingBufferWidth || height !== drawingBufferHeight) {
      // The context owns physical sizing; synchronize Three's internal viewport to it.
      renderer.setSize(width, height, false);
      drawingBufferWidth = width;
      drawingBufferHeight = height;
      resize();
    }
    controls.update();
    fixture.update((performance.now() - start) / 1000);
    renderer.render(fixture.scene, fixture.camera);
    reportReady();
  });
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      fixture.dispose();
      renderer.dispose();
      device.destroy();
    },
    {once: true}
  );
}
void initialize().catch(error => {
  window.parent.postMessage(
    {type: 'luma-example-error', message: String(error)},
    window.location.origin
  );
  const status = document.querySelector<HTMLElement>('#status')!;
  status.hidden = false;
  status.textContent = String(error);
});
