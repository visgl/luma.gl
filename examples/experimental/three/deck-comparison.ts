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
import {createDeckLayers, createDeckScene} from './deck-scene';

/** One deck-owned pass on the left; upstream Three comparison on the right. */
export async function createDeckComparison(
  device: Device,
  referenceCanvas: HTMLCanvasElement,
  width: number,
  onError: (error: Error) => void
) {
  const canvas = device.getDefaultCanvasContext().canvas;
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error('Deck comparison requires an HTML canvas');
  const scene = createDeckScene();
  const referenceScene = createDeckScene();
  const reference = new WebGPURenderer({
    canvas: referenceCanvas,
    antialias: false,
    outputBufferType: HalfFloatType
  });
  await reference.init();
  reference.setSize(width, width, false);
  const controlsCamera = new PerspectiveCamera(45, 1, 0.1, 1000);
  const controls = new OrbitControls(controlsCamera, referenceCanvas);
  let viewState: OrbitViewState = {target: [0, 0, 0], zoom: 7, rotationX: 15, rotationOrbit: -15};
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
      views: new OrbitView({orbitAxis: 'Y', fovy: 45, near: 0.1, far: 1000}),
      viewState,
      controller: true,
      _animate: true,
      layers: createDeckLayers(scene),
      onLoad: resolve,
      onError: error => {
        onError(error);
        reject(error);
      },
      onViewStateChange: ({viewState: next}) => {
        viewState = next;
        deck.setProps({viewState});
      },
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
          deck.setProps({layers: createDeckLayers(scene, reverseOrder)});
        }
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
      rotationX: (Math.asin(offset.y / distance) * 180) / Math.PI,
      rotationOrbit: (Math.atan2(-offset.x, offset.z) * 180) / Math.PI
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
      deck.setProps({layers: createDeckLayers(scene, reverseOrder)});
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
      scene.dispose();
      referenceScene.dispose();
    }
  };
}
