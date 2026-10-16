// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type DeckProps, Viewport} from '@deck.gl/core';
import {HostDrivenDeck, ThreeCameraView, type ThreeCameraViewState} from './host-driven-deck';
import {luma, log, type Device} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/core/webgl';
import {Matrix4, Vector3, WebGPUCoordinateSystem, type Camera, type Vector3Like} from 'three';

/** The overlay only reads public canvas and pixel-ratio state from the host renderer. */
export type ThreeDeckOverlayHost = {
  domElement: HTMLCanvasElement;
  getPixelRatio(): number;
};

export type ThreeDeckOverlayProps = {
  renderer: ThreeDeckOverlayHost;
  /** Positioned container filled by the host canvas; the overlay is appended above it. */
  container: HTMLDivElement;
  /** Borrowed reference point for pixel-sized symbols, usually OrbitControls.target. */
  target?: Vector3Like;
  layers?: DeckProps['layers'];
  onError?: (error: Error) => void;
};

/** A non-mutating attachment probe; it does not initialize or replace the Three renderer. */
export function getThreeDeckOverlaySupport({
  renderer,
  container
}: Pick<ThreeDeckOverlayProps, 'renderer' | 'container'>):
  | {supported: true; sharedDevice: false; sharedDepth: false}
  | {supported: false; reason: string} {
  if (
    typeof HTMLCanvasElement === 'undefined' ||
    !(renderer.domElement instanceof HTMLCanvasElement)
  )
    return {supported: false, reason: 'The overlay requires a browser canvas'};
  if (renderer.domElement.parentElement !== container)
    return {
      supported: false,
      reason: 'The host canvas must be a direct child of the overlay container'
    };
  if (getComputedStyle(container).position === 'static')
    return {supported: false, reason: 'The overlay container must be positioned'};
  return {supported: true, sharedDevice: false, sharedDepth: false};
}

/** Snapshot current Three matrices. Call after the host updates its camera matrices. */
export function makeDeckViewportFromThreeCamera(
  camera: Camera,
  width: number,
  height: number,
  target: Vector3Like = {x: 0, y: 0, z: 0}
): Viewport {
  const projection = camera.projectionMatrix.clone();
  // deck uses OpenGL clip depth even when its rendering backend is WebGPU.
  if (camera.coordinateSystem === WebGPUCoordinateSystem || camera.reversedDepth) {
    projection.premultiply(new Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, -1, 0, 0, 0, 1));
  }
  if (camera.reversedDepth) {
    projection.premultiply(new Matrix4().makeScale(1, 1, -1));
  }
  // deck calibrates pixel units at a reference depth, with perspective scaling elsewhere.
  const targetDepth = -new Vector3().copy(target).applyMatrix4(camera.matrixWorldInverse).z;
  const focalDistance = targetDepth > 0 ? targetDepth : 1;
  const referenceProjectionWeight =
    -projection.elements[11] * focalDistance + projection.elements[15];
  // Normalize homogeneous scale so the reference plane has clip w = 1, as in deck's
  // own viewports. NDC and clipping stay identical, while billboard layers agree on pixels.
  projection.multiplyScalar(1 / referenceProjectionWeight);
  return new Viewport({
    focalDistance,
    id: 'three-camera',
    width,
    height,
    viewMatrix: camera.matrixWorldInverse.toArray(),
    projectionMatrix: projection.toArray(),
    zoom: Math.log2((Math.max(1, height) * Math.abs(projection.elements[5])) / 2)
  });
}

/** Transparent deck canvas driven explicitly by an existing Three application's frame loop. */
export class ThreeDeckOverlay {
  readonly canvas: HTMLCanvasElement;
  private disposed = false;

  private constructor(
    private readonly renderer: ThreeDeckOverlayHost,
    private readonly deck: HostDrivenDeck,
    canvas: HTMLCanvasElement,
    private readonly target?: Vector3Like
  ) {
    this.canvas = canvas;
  }

  static async create(props: ThreeDeckOverlayProps): Promise<ThreeDeckOverlay> {
    const support = getThreeDeckOverlaySupport(props);
    if (!support.supported) throw new Error(support.reason);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const width = Math.max(1, props.renderer.domElement.clientWidth);
    const height = Math.max(1, props.renderer.domElement.clientHeight);
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      width: `${width}px`,
      height: `${height}px`
    });
    props.container.append(canvas);
    let deck: HostDrivenDeck | undefined;
    let device: Device | undefined;
    let initializing = true;
    const reportError = (error: Error) => {
      if (props.onError) props.onError(error);
      else log.error(error.message)();
    };
    try {
      // Await device creation here: Deck starts its loop in its constructor and does not expose
      // that startup promise. Owning it here also makes failed initialization fully disposable.
      device = await luma.createDevice({
        type: 'webgl',
        adapters: [webgl2Adapter],
        createCanvasContext: {canvas, useDevicePixels: props.renderer.getPixelRatio()}
      });
      await new Promise<void>((resolve, reject) => {
        deck = new HostDrivenDeck({
          device,
          canvas,
          width,
          height,
          useDevicePixels: props.renderer.getPixelRatio(),
          views: new ThreeCameraView({id: 'three-camera', width, height, controller: false}),
          viewState: {zoom: 0},
          controller: false,
          layers: props.layers,
          // The host explicitly renders every frame, including asynchronous layer updates.
          _animate: true,
          onLoad: () => {
            // Stop before AnimationLoop.start schedules its first requestAnimationFrame.
            deck!.stopScheduling();
            resolve();
          },
          onError: error => {
            if (initializing) reject(error);
            else reportError(error);
          }
        });
      });
      initializing = false;
      return new ThreeDeckOverlay(props.renderer, deck!, canvas, props.target);
    } catch (error) {
      deck?.finalize();
      device?.destroy();
      canvas.remove();
      reportError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /** Layer changes are consumed on the next host frame. */
  setProps(props: Pick<DeckProps, 'layers'>): void {
    if (!this.disposed) this.deck.setProps(props);
  }

  /** Call after renderer.render(scene, camera), with the host animation timestamp if available. */
  render(camera: Camera, time?: number): void {
    if (this.disposed) return;
    const {clientWidth: width, clientHeight: height} = this.renderer.domElement;
    if (!width || !height) {
      this.canvas.style.display = 'none';
      return;
    }
    this.canvas.style.display = 'block';
    // ResizeObserver runs after the host frame. Synchronize this owned surface now so deck's
    // CSS-to-device ratio and viewport agree on the very first frame after a resize.
    const canvasContext = this.deck.getCanvasContext()!;
    canvasContext.cssWidth = width;
    canvasContext.cssHeight = height;
    const viewport = makeDeckViewportFromThreeCamera(camera, width, height, this.target);
    const viewState: ThreeCameraViewState = {
      zoom: viewport.zoom,
      focalDistance: viewport.focalDistance,
      viewMatrix: Array.from(viewport.viewMatrix),
      projectionMatrix: Array.from(viewport.projectionMatrix)
    };
    const pixelRatio = this.renderer.getPixelRatio();
    this.deck.setProps({
      width,
      height,
      useDevicePixels: pixelRatio,
      views: new ThreeCameraView({id: 'three-camera', width, height, controller: false}),
      viewState
    });
    canvasContext.setDrawingBufferSize(
      Math.floor(width * pixelRatio),
      Math.floor(height * pixelRatio)
    );
    this.deck.renderFrame(time);
  }

  /** Releases only the overlay canvas, deck resources and its separate device. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.deck.dispose();
    this.canvas.remove();
  }
}
