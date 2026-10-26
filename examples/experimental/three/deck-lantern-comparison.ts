// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrbitView, type OrbitViewState} from '@deck.gl/core';
import type {Device} from '@luma.gl/core';
import {synchronizeThreeCamera} from '@luma.gl/three/deck';
import {
  HalfFloatType,
  PerspectiveCamera,
  Vector3,
  WebGPURenderer,
  WebGPUCoordinateSystem
} from 'three/webgpu';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {createDeckLanternLayers, createDeckLanternScene} from './deck-lantern-scene';

/** One deck-owned pass on the left; upstream Three comparison on the right. */
export async function createDeckLanternComparison(
  device: Device,
  referenceCanvas: HTMLCanvasElement,
  width: number,
  onError: (error: Error) => void,
  getSettings: () => {lighting: boolean; environment: boolean; shadows: boolean; context: boolean}
) {
  const canvas = device.getDefaultCanvasContext().canvas;
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error('Deck comparison requires an HTML canvas');
  const adapter = new ThreeSceneAdapter({device});
  const reference = new WebGPURenderer({
    canvas: referenceCanvas,
    antialias: false,
    outputBufferType: HalfFloatType
  });
  async function prepareScenes() {
    let scene: Awaited<ReturnType<typeof createDeckLanternScene>> | undefined;
    try {
      await adapter.init();
      await reference.init();
      reference.setSize(width, width, false);
      scene = await createDeckLanternScene(adapter.renderer);
      const referenceScene = await createDeckLanternScene(reference);
      return {scene, referenceScene};
    } catch (error) {
      scene?.dispose();
      reference.dispose();
      adapter.dispose();
      throw error;
    }
  }
  const {scene, referenceScene} = await prepareScenes();
  referenceScene.scene.add(referenceScene.referenceContext);
  const controlsCamera = new PerspectiveCamera(45, 1, 0.1, 1000);
  controlsCamera.up.set(0, 0, 1);
  const controls = new OrbitControls(controlsCamera, referenceCanvas);
  let viewState: OrbitViewState = {
    target: [0, 0, -0.15],
    zoom: 6.1,
    rotationX: 35,
    rotationOrbit: -25
  };
  let reverseOrder = false;
  let paused = false;
  let synchronizing = false;
  let disposed = false;
  const start = performance.now();
  let deck: Deck<OrbitView>;
  const ready = new Promise<void>((resolve, reject) => {
    deck = new Deck<OrbitView>({
      device,
      canvas,
      width: null,
      height: null,
      style: {position: 'relative'},
      useDevicePixels: false,
      views: new OrbitView({orbitAxis: 'Z', fovy: 45, near: 0.1, far: 1000}),
      viewState,
      controller: true,
      _animate: true,
      layers: createDeckLanternLayers(scene, adapter),
      onLoad: resolve,
      onError: error => {
        onError(error);
        reject(error);
      },
      onViewStateChange: ({viewState: next}) => {
        viewState = next;
        deck.setProps({viewState});
      },
      onBeforeRender: () => {
        const viewport = deck.getViewports()[0];
        if (!viewport || disposed) return;
        const settings = getSettings();
        for (const fixture of [scene, referenceScene]) {
          fixture.light.intensity = settings.lighting ? 3 : 0;
          fixture.scene.environmentIntensity = settings.environment ? 1 : 0;
          fixture.light.shadow.intensity = settings.shadows ? 1 : 0;
        }
        referenceScene.referenceContext.visible = settings.context;
        synchronizeThreeCamera(scene.camera, viewport, WebGPUCoordinateSystem);
        adapter.prepare(scene.scene, scene.camera);
      },
      getTooltip: ({object}) =>
        object && 'elevation' in object
          ? {text: `Station ${object.id + 1}: ${object.elevation.toFixed(2)} units`}
          : null,
      onAfterRender: () => {
        if (disposed) return;
        const viewport = deck.getViewports()[0];
        if (!viewport) return;
        synchronizeThreeCamera(referenceScene.camera, viewport, WebGPUCoordinateSystem);
        reference.render(referenceScene.scene, referenceScene.camera);
        synchronizing = true;
        controlsCamera.position.copy(referenceScene.camera.position);
        controlsCamera.quaternion.copy(referenceScene.camera.quaternion);
        controls.target.set(...viewState.target);
        controls.update();
        synchronizing = false;
        if (!paused) {
          const phase = (performance.now() - start) / 1000;
          scene.update(phase);
          referenceScene.update(phase);
        }
        deck.setProps({
          layers: createDeckLanternLayers(scene, adapter, {
            reverseOrder,
            context: getSettings().context
          })
        });
      }
    });
  });
  controls.addEventListener('change', () => {
    if (synchronizing || disposed) return;
    const offset = new Vector3().subVectors(controlsCamera.position, controls.target);
    const distance = offset.length();
    const height = deck.height;
    const focalDistance = 0.5 / Math.tan((45 * Math.PI) / 360);
    viewState = {
      target: [controls.target.x, controls.target.y, controls.target.z],
      zoom: Math.log2((height * focalDistance) / distance),
      rotationX: (Math.asin(offset.z / distance) * 180) / Math.PI,
      rotationOrbit: (Math.atan2(-offset.x, -offset.y) * 180) / Math.PI
    };
    deck.setProps({viewState});
  });
  try {
    await ready;
  } catch (error) {
    disposed = true;
    deck!.finalize();
    controls.dispose();
    reference.dispose();
    adapter.dispose();
    scene.dispose();
    referenceScene.dispose();
    throw error;
  }
  return {
    setSize(size: number) {
      device.getDefaultCanvasContext().setDrawingBufferSize(size, size);
      reference.setSize(size, size, false);
      deck.setProps({});
    },
    reverseOrder() {
      reverseOrder = !reverseOrder;
      deck.setProps({
        layers: createDeckLanternLayers(scene, adapter, {
          reverseOrder,
          context: getSettings().context
        })
      });
    },
    pause() {
      paused = !paused;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      deck.finalize();
      controls.dispose();
      reference.dispose();
      adapter.dispose();
      scene.dispose();
      referenceScene.dispose();
    }
  };
}
