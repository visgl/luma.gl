// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView, type MapViewState} from '@deck.gl/core';
import type {Device} from '@luma.gl/core';
import {pickThreeObject, synchronizeThreeCamera} from '@luma.gl/three/deck';
import {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {HalfFloatType, WebGPURenderer, WebGPUCoordinateSystem} from 'three/webgpu';
import {createGeographicLayers, createGeographicScene, GEOGRAPHIC_ORIGIN} from './geographic-scene';

export async function createGeographicComparison(
  device: Device,
  referenceCanvas: HTMLCanvasElement,
  width: number,
  onError: (error: Error) => void,
  onSelect: (id?: string) => void
) {
  const canvas = device.getDefaultCanvasContext().canvas;
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Geographic demo requires a canvas');
  const adapter = new ThreeSceneAdapter({device});
  const reference = new WebGPURenderer({
    canvas: referenceCanvas,
    antialias: false,
    outputBufferType: HalfFloatType
  });
  let scene: Awaited<ReturnType<typeof createGeographicScene>> | undefined;
  let referenceScene: Awaited<ReturnType<typeof createGeographicScene>> | undefined;
  let deck: Deck<MapView> | undefined;
  let disposed = false;
  let reverseOrder = false;
  let showModels = true;
  function selectAt(position: [number, number]) {
    if (!scene || !referenceScene) return;
    const intersection = pickThreeObject(scene.camera, position, [
      scene.scene,
      scene.referenceContext
    ]);
    let id: string | undefined;
    for (let object = intersection?.object; object; object = object.parent || undefined)
      if (object.userData['geographicId']) {
        id = object.userData['geographicId'];
        break;
      }
    scene.select(id);
    referenceScene.select(id);
    onSelect(id);
    deck?.redraw('selection');
  }
  let pointerOrigin: [number, number] | undefined;
  const handlePointerDown = (event: PointerEvent) => {
    pointerOrigin = [event.clientX, event.clientY];
  };
  const handleClick = (event: MouseEvent) => {
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    if (
      pointerOrigin &&
      Math.hypot(event.clientX - pointerOrigin[0], event.clientY - pointerOrigin[1]) > 4
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    selectAt([
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2
    ]);
  };
  try {
    await adapter.init();
    await reference.init();
    reference.setSize(width, width, false);
    scene = await createGeographicScene(adapter.renderer);
    referenceScene = await createGeographicScene(reference);
    referenceScene.scene.add(referenceScene.referenceContext);
    let viewState: MapViewState = {
      longitude: GEOGRAPHIC_ORIGIN[0],
      latitude: GEOGRAPHIC_ORIGIN[1],
      zoom: 18.8 + Math.log2(width / 512),
      pitch: 55,
      bearing: -25
    };
    await new Promise<void>((resolve, reject) => {
      deck = new Deck<MapView>({
        device,
        canvas,
        width: null,
        height: null,
        style: {position: 'relative'},
        useDevicePixels: false,
        views: new MapView(),
        viewState,
        controller: true,
        layers: createGeographicLayers(scene!, adapter),
        onLoad: resolve,
        onError: error => {
          onError(error);
          reject(error);
        },
        onViewStateChange: ({viewState: next}) => {
          viewState = next;
          deck!.setProps({viewState});
        },
        onBeforeRender: () => {
          const viewport = deck!.getViewports()[0];
          if (!viewport || disposed) return;
          synchronizeThreeCamera(
            scene!.camera,
            viewport,
            WebGPUCoordinateSystem,
            GEOGRAPHIC_ORIGIN
          );
          adapter.prepare(scene!.scene, scene!.camera);
        },
        onAfterRender: () => {
          if (disposed) return;
          const viewport = deck!.getViewports()[0];
          if (!viewport) return;
          synchronizeThreeCamera(
            referenceScene!.camera,
            viewport,
            WebGPUCoordinateSystem,
            GEOGRAPHIC_ORIGIN
          );
          reference.render(referenceScene!.scene, referenceScene!.camera);
        }
      });
    });
    canvas.addEventListener('pointerdown', handlePointerDown);
    referenceCanvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('click', handleClick);
    referenceCanvas.addEventListener('click', handleClick);
  } catch (error) {
    disposed = true;
    deck?.finalize();
    reference.dispose();
    adapter.dispose();
    scene?.dispose();
    referenceScene?.dispose();
    throw error;
  }
  return {
    setSize(size: number) {
      device.getDefaultCanvasContext().setDrawingBufferSize(size, size);
      reference.setSize(size, size, false);
      deck!.setProps({});
    },
    reverseOrder() {
      reverseOrder = !reverseOrder;
      const layers = createGeographicLayers(scene!, adapter, reverseOrder);
      deck!.setProps({
        layers: showModels ? layers : layers.filter(layer => layer.id !== 'geographic-lanterns')
      });
    },
    pause() {
      // Exercise layer removal/reinsertion with caller-owned scene and adapter intact.
      showModels = !showModels;
      scene!.models.forEach(model => {
        model.visible = showModels;
      });
      referenceScene!.models.forEach(model => {
        model.visible = showModels;
      });
      const layers = createGeographicLayers(scene!, adapter, reverseOrder);
      deck!.setProps({
        layers: showModels ? layers : layers.filter(layer => layer.id !== 'geographic-lanterns')
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('pointerdown', handlePointerDown);
      referenceCanvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('click', handleClick);
      referenceCanvas.removeEventListener('click', handleClick);
      deck!.finalize();
      reference.dispose();
      adapter.dispose();
      scene!.dispose();
      referenceScene!.dispose();
    }
  };
}
