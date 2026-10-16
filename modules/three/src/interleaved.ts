// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type DeckProps} from '@deck.gl/core';
import {luma, log, assert} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {type Camera, type Vector3Like, Vector2, Vector4, WebGLRenderer} from 'three';
import {HostDrivenDeck, ThreeCameraView} from './host-driven-deck';
import {makeDeckViewportFromThreeCamera} from './overlay';

export type ThreeDeckInterleavedProps = {
  renderer: WebGLRenderer;
  target?: Vector3Like;
  layers?: DeckProps['layers'];
  onError?: (error: Error) => void;
};

/** Check the depth and drawing-surface contract without changing renderer state. */
export function getThreeDeckInterleavedSupport(
  renderer: WebGLRenderer
): {supported: true; sharedDevice: true; sharedDepth: true} | {supported: false; reason: string} {
  if (!(renderer instanceof WebGLRenderer))
    return {supported: false, reason: 'Shared depth requires a Three WebGLRenderer'};
  const context = renderer.getContext();
  if (typeof WebGL2RenderingContext === 'undefined' || !(context instanceof WebGL2RenderingContext))
    return {supported: false, reason: 'Shared depth requires WebGL2'};
  if (!context.getContextAttributes()?.depth)
    return {supported: false, reason: 'Shared depth requires a depth buffer'};
  if (renderer.capabilities.logarithmicDepthBuffer || renderer.capabilities.reversedDepthBuffer)
    return {supported: false, reason: 'Shared depth requires standard depth mapping'};
  if (renderer.getRenderTarget() || renderer.getScissorTest() || renderer.xr.isPresenting)
    return {supported: false, reason: 'Shared depth requires the full default canvas framebuffer'};
  const viewport = renderer.getViewport(new Vector4());
  const size = renderer.getSize(new Vector2());
  if (viewport.x !== 0 || viewport.y !== 0 || viewport.z !== size.x || viewport.w !== size.y)
    return {supported: false, reason: 'Shared depth requires a full-canvas viewport'};
  return {supported: true, sharedDevice: true, sharedDepth: true};
}

/** Draws native deck layers into a Three-owned WebGL2 color and depth buffer. */
export class ThreeDeckInterleaved {
  private disposed = false;

  private constructor(
    private readonly renderer: WebGLRenderer,
    private readonly deck: HostDrivenDeck,
    private readonly target?: Vector3Like
  ) {}

  static async create(props: ThreeDeckInterleavedProps): Promise<ThreeDeckInterleaved> {
    const support = getThreeDeckInterleavedSupport(props.renderer);
    if (!support.supported) throw new Error(support.reason);
    const {renderer} = props;
    const canvas = renderer.domElement;
    const context = renderer.getContext();
    // The support probe guarantees the native context is WebGL2.
    assert(context instanceof WebGL2RenderingContext);
    const touchAction = canvas.style.touchAction;
    const cursor = canvas.style.cursor;
    const outline = canvas.style.outline;
    const tabIndex = canvas.getAttribute('tabindex');
    // Bring the host's cached state to a known boundary before luma installs state tracking.
    renderer.resetState();
    let deck: HostDrivenDeck | undefined;
    let initializing = true;
    try {
      const device = await luma.attachDevice(context, {
        adapters: [webgl2Adapter],
        createCanvasContext: {autoResize: false, useDevicePixels: renderer.getPixelRatio()}
      });
      await new Promise<void>((resolve, reject) => {
        deck = new HostDrivenDeck({
          device,
          gl: context,
          canvas,
          // Three owns the canvas layout and drawing-buffer size.
          width: null,
          height: null,
          useDevicePixels: renderer.getPixelRatio(),
          views: new ThreeCameraView({id: 'three-camera', controller: false}),
          viewState: {zoom: 0},
          controller: false,
          _pickable: false,
          _animate: true,
          // Three resets GL state between passes; do not rely on deck's initialization defaults.
          parameters: {
            depthCompare: 'less-equal',
            depthWriteEnabled: true,
            blendColorOperation: 'add',
            blendColorSrcFactor: 'src-alpha',
            blendColorDstFactor: 'one-minus-src-alpha',
            blendAlphaOperation: 'add',
            blendAlphaSrcFactor: 'one',
            blendAlphaDstFactor: 'one-minus-src-alpha'
          },
          getCursor: () => canvas.style.cursor,
          layers: props.layers,
          // Preserve both buffers produced by the host's opaque pass.
          _customRender: reason => deck!._drawLayers(reason, {clearCanvas: false}),
          onLoad: () => {
            deck!.stopScheduling();
            deck!.disableInteractions();
            resolve();
          },
          onError: error => {
            if (initializing) reject(error);
            else if (props.onError) props.onError(error);
            else log.error(error.message)();
          }
        });
      });
      initializing = false;
      return new ThreeDeckInterleaved(renderer, deck!, props.target);
    } catch (error) {
      deck?.finalize();
      throw error;
    } finally {
      // Deck must not claim the native canvas's pointer policy or invalidate Three's cache.
      canvas.style.touchAction = touchAction;
      canvas.style.cursor = cursor;
      canvas.style.outline = outline;
      if (tabIndex === null) canvas.removeAttribute('tabindex');
      else canvas.setAttribute('tabindex', tabIndex);
      renderer.resetState();
    }
  }

  setProps(props: Pick<DeckProps, 'layers'>): void {
    if (!this.disposed) this.deck.setProps(props);
  }

  /** Call after Three's opaque pass; later Three draws must preserve color and depth. */
  render(camera: Camera, time?: number): void {
    if (this.disposed) return;
    const support = getThreeDeckInterleavedSupport(this.renderer);
    if (!support.supported) throw new Error(support.reason);
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const viewport = makeDeckViewportFromThreeCamera(camera, width, height, this.target);
    this.renderer.resetState();
    try {
      const canvasContext = this.deck.getCanvasContext()!;
      canvasContext.cssWidth = width;
      canvasContext.cssHeight = height;
      // Follow Three's existing drawing buffer without assigning canvas.width/height (which
      // would erase its depth). luma only updates framebuffer metadata when sizes agree.
      canvasContext.setDrawingBufferSize(canvas.width, canvas.height);
      this.deck.setProps({
        useDevicePixels: this.renderer.getPixelRatio(),
        views: new ThreeCameraView({id: 'three-camera', width, height, controller: false}),
        viewState: {
          zoom: viewport.zoom,
          focalDistance: viewport.focalDistance,
          viewMatrix: Array.from(viewport.viewMatrix),
          projectionMatrix: Array.from(viewport.projectionMatrix)
        }
      });
      this.deck.renderFrame(time);
    } finally {
      this.renderer.resetState();
    }
  }

  /** Finalize deck resources; the host canvas, context and attached device remain borrowed. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.deck.finalize();
    } finally {
      this.renderer.resetState();
    }
  }
}
