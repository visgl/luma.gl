// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type WebXRMediaLayerType = 'quad' | 'cylinder' | 'equirect';

export type WebXRMediaLayerState = {
  session: XRSession;
  layer: XRCompositionLayer;
  video: HTMLVideoElement;
  type: WebXRMediaLayerType;
  layout: XRLayerLayout;
  invertStereo: boolean;
  needsRedraw: boolean;
};

type WebXRMediaLayerRecord = {
  video: HTMLVideoElement;
  type: WebXRMediaLayerType;
  invertStereo: boolean;
};

/** Experimental v10 WebXR Layers API helper for video-backed composition layers. */
export class WebXRMediaLayerManager {
  session: XRSession | null = null;
  xrMediaBinding: XRMediaBinding | null = null;

  private _layers = new Map<XRCompositionLayer, WebXRMediaLayerRecord>();
  private _redrawLayers = new Set<XRCompositionLayer>();
  private _sessionEndListener = () => this.clearSession();
  private _redrawListener = (event: Event) => this._handleLayerRedraw(event);

  setSession(session: XRSession | null): this {
    this.clearSession();
    if (!session) {
      return this;
    }
    if (typeof XRMediaBinding === 'undefined') {
      throw new Error('WebXR media layers require XRMediaBinding');
    }

    this.session = session;
    this.xrMediaBinding = new XRMediaBinding(session);
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  createQuadLayer(video: HTMLVideoElement, init: XRMediaQuadLayerInit): XRQuadLayer {
    if (!this.xrMediaBinding) {
      throw new Error('WebXRMediaLayerManager has no XRMediaBinding');
    }
    const layer = this.xrMediaBinding.createQuadLayer(video, init);
    this._trackLayer(layer, video, 'quad', init);
    return layer;
  }

  createCylinderLayer(video: HTMLVideoElement, init: XRMediaCylinderLayerInit): XRCylinderLayer {
    if (!this.xrMediaBinding) {
      throw new Error('WebXRMediaLayerManager has no XRMediaBinding');
    }
    const layer = this.xrMediaBinding.createCylinderLayer(video, init);
    this._trackLayer(layer, video, 'cylinder', init);
    return layer;
  }

  createEquirectLayer(video: HTMLVideoElement, init: XRMediaEquirectLayerInit): XREquirectLayer {
    if (!this.xrMediaBinding) {
      throw new Error('WebXRMediaLayerManager has no XRMediaBinding');
    }
    const layer = this.xrMediaBinding.createEquirectLayer(video, init);
    this._trackLayer(layer, video, 'equirect', init);
    return layer;
  }

  async updateRenderState(layers: readonly XRLayer[]): Promise<void> {
    if (!this.session) {
      throw new Error('WebXRMediaLayerManager has no XRSession');
    }
    await this.session.updateRenderState({layers});
  }

  getLayerState(layer: XRCompositionLayer): WebXRMediaLayerState | null {
    if (!this.session) {
      return null;
    }

    const record = this._layers.get(layer);
    if (!record) {
      throw new Error('XRCompositionLayer is not tracked by this manager');
    }

    const needsRedraw = layer.needsRedraw || this._redrawLayers.has(layer);
    this._redrawLayers.delete(layer);

    return {
      session: this.session,
      layer,
      video: record.video,
      type: record.type,
      layout: layer.layout,
      invertStereo: record.invertStereo,
      needsRedraw
    };
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    for (const layer of this._layers.keys()) {
      layer.removeEventListener('redraw', this._redrawListener);
    }
    this._layers.clear();
    this._redrawLayers.clear();
    this.xrMediaBinding = null;
    this.session = null;
  }

  destroy(): void {
    this.clearSession();
  }

  private _trackLayer(
    layer: XRCompositionLayer,
    video: HTMLVideoElement,
    type: WebXRMediaLayerType,
    init: XRMediaLayerInit
  ): void {
    this._layers.set(layer, {
      video,
      type,
      invertStereo: init.invertStereo || false
    });
    layer.addEventListener('redraw', this._redrawListener);
  }

  private _handleLayerRedraw(event: Event): void {
    this._redrawLayers.add(event.currentTarget as XRCompositionLayer);
  }
}
