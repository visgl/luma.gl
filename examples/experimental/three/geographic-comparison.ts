// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapController, MapView, WebMercatorViewport, type MapViewState} from '@deck.gl/core';
import {Timeline} from '@luma.gl/engine';
import {EventManager, Pan, Pinch} from 'mjolnir.js';
import type {Device} from '@luma.gl/core';
import {synchronizeThreeCamera} from '@luma.gl/three/deck';
import {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {HalfFloatType, WebGPURenderer, WebGPUCoordinateSystem} from 'three/webgpu';
import {createGeographicLayers, createGeographicScene, GEOGRAPHIC_ORIGIN} from './geographic-scene';
import {createSceneSelection} from './scene-selection';

export async function createGeographicComparison(
  device: Device,
  referenceCanvas: HTMLCanvasElement,
  width: number,
  onError: (error: Error) => void,
  onSelect: (id?: string) => void
) {
  const deviceCanvas = device.getDefaultCanvasContext().canvas;
  if (!(deviceCanvas instanceof HTMLCanvasElement))
    throw new Error('Geographic demo requires a canvas');
  const canvas = deviceCanvas;
  const adapter = new ThreeSceneAdapter({device});
  const reference = new WebGPURenderer({
    canvas: referenceCanvas,
    antialias: false,
    outputBufferType: HalfFloatType
  });
  let scene: Awaited<ReturnType<typeof createGeographicScene>> | undefined;
  let referenceScene: Awaited<ReturnType<typeof createGeographicScene>> | undefined;
  let deck: Deck<MapView> | undefined;
  let referenceController: MapController | undefined;
  let eventManager: EventManager | undefined;
  const timeline = new Timeline();
  let transitionFrame = 0;
  let transitioning = false;
  const resizeObserver = new ResizeObserver(() => updateController());
  let viewState: MapViewState = {
    longitude: GEOGRAPHIC_ORIGIN[0],
    latitude: GEOGRAPHIC_ORIGIN[1],
    zoom: 18.8 + Math.log2(width / 512),
    pitch: 55,
    bearing: -25
  };
  function updateController() {
    const bounds = referenceCanvas.getBoundingClientRect();
    timeline.setTime(performance.now());
    referenceController?.setProps({
      ...viewState,
      position: viewState.position
        ? [viewState.position[0], viewState.position[1], viewState.position[2]]
        : undefined,
      id: 'reference',
      x: 0,
      y: 0,
      width: bounds.width,
      height: bounds.height,
      doubleClickZoom: false,
      doubleClickDragZoom: false,
      multiTouchDrag: 'rotate'
    });
  }
  function updateViewState(next: MapViewState) {
    viewState = next;
    deck?.setProps({viewState});
    updateController();
  }
  function updateTransition(time: number) {
    transitionFrame = 0;
    timeline.setTime(time);
    referenceController?.updateTransition();
    if (transitioning && !disposed && !transitionFrame)
      transitionFrame = requestAnimationFrame(updateTransition);
  }
  let disposed = false;
  let reverseOrder = false;
  let showModels = true;
  function updateLayers() {
    const layers = createGeographicLayers(scene!, adapter, reverseOrder);
    deck?.setProps({
      layers: showModels ? layers : layers.filter(layer => layer.id !== 'geographic-lanterns')
    });
  }
  function selectObject(value: unknown) {
    if (!scene || !referenceScene || disposed) return;
    const id = typeof value === 'string' ? value : undefined;
    scene.select(id);
    referenceScene.select(id);
    onSelect(id);
    updateLayers();
  }
  const selection = createSceneSelection({
    select: selectObject,
    onError,
    pick: async position => {
      if (!deck) return undefined;
      const bounds = canvas.getBoundingClientRect();
      const info = await deck.pickObjectAsync({
        x: ((position[0] + 1) * bounds.width) / 2,
        y: ((1 - position[1]) * bounds.height) / 2
      });
      return info?.object?.id;
    }
  });
  let pointerOrigin: [number, number] | undefined;
  let pointerMoved = false;
  const handlePointerDown = (event: PointerEvent) => {
    pointerOrigin = [event.clientX, event.clientY];
    pointerMoved = !event.isPrimary;
  };
  const handlePointerMove = (event: PointerEvent) => {
    if (
      pointerOrigin &&
      Math.hypot(event.clientX - pointerOrigin[0], event.clientY - pointerOrigin[1]) > 4
    )
      pointerMoved = true;
  };
  const handlePointerCancel = () => {
    pointerMoved = true;
  };
  const handleClick = (event: MouseEvent) => {
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    if (pointerMoved) return;
    if (
      pointerOrigin &&
      Math.hypot(event.clientX - pointerOrigin[0], event.clientY - pointerOrigin[1]) > 4
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    void selection.selectAt([
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
    eventManager = new EventManager(referenceCanvas, {
      touchAction: 'none',
      recognizers: [
        {recognizer: new Pan({event: 'multipan', threshold: 10, pointers: 2})},
        {recognizer: new Pinch(), requireFailure: ['multipan']},
        {
          recognizer: new Pan({threshold: 1}),
          recognizeWith: ['pinch'],
          requireFailure: ['multipan']
        }
      ]
    });
    referenceController = new MapController({
      timeline,
      eventManager,
      makeViewport: properties => new WebMercatorViewport(properties),
      onViewStateChange: ({viewState: next}) => updateViewState(next),
      onStateChange: state => {
        if (state.isDragging) pointerMoved = true;
        transitioning = Boolean(state.inTransition);
        if (transitioning && !transitionFrame) {
          transitionFrame = requestAnimationFrame(updateTransition);
        }
      }
    });
    updateController();
    resizeObserver.observe(referenceCanvas);
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
        controller: {doubleClickZoom: false, doubleClickDragZoom: false, multiTouchDrag: 'rotate'},
        layers: createGeographicLayers(scene!, adapter),
        onLoad: resolve,
        onClick: info => {
          if (!pointerMoved) {
            selection.select(info.object?.id);
          }
        },
        getCursor: ({isDragging, isHovering}) =>
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab',
        getTooltip: info => (typeof info.object?.id === 'string' ? info.object.id : null),
        onError: error => {
          onError(error);
          reject(error);
        },
        onViewStateChange: ({viewState: next}) => {
          updateViewState(next);
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
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('pointerdown', handlePointerDown);
    referenceCanvas.addEventListener('pointerdown', handlePointerDown);
    referenceCanvas.addEventListener('click', handleClick);
  } catch (error) {
    disposed = true;
    selection.dispose();
    resizeObserver.disconnect();
    cancelAnimationFrame(transitionFrame);
    referenceController?.finalize();
    eventManager?.destroy();
    deck?.finalize();
    reference.dispose();
    adapter.dispose();
    scene?.dispose();
    referenceScene?.dispose();
    throw error;
  }
  return {
    setSize(size: number) {
      updateController();
      device.getDefaultCanvasContext().setDrawingBufferSize(size, size);
      reference.setSize(size, size, false);
      deck!.setProps({});
    },
    reverseOrder() {
      reverseOrder = !reverseOrder;
      updateLayers();
    },
    pause() {
      selection.invalidate();
      // Exercise layer removal/reinsertion with caller-owned scene and adapter intact.
      showModels = !showModels;
      scene!.models.forEach(model => {
        model.visible = showModels;
      });
      referenceScene!.models.forEach(model => {
        model.visible = showModels;
      });
      updateLayers();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      selection.dispose();
      resizeObserver.disconnect();
      cancelAnimationFrame(transitionFrame);
      referenceController?.finalize();
      eventManager?.destroy();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      referenceCanvas.removeEventListener('pointerdown', handlePointerDown);
      referenceCanvas.removeEventListener('click', handleClick);
      deck!.finalize();
      reference.dispose();
      adapter.dispose();
      scene!.dispose();
      referenceScene!.dispose();
    }
  };
}
