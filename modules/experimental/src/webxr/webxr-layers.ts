// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Framebuffer, Texture, TextureFormat, TextureProps} from '@luma.gl/core';
import {Texture as TextureResource} from '@luma.gl/core';

type WebXRWebGLDevice = Device & {
  type: 'webgl';
  gl: WebGLRenderingContext | WebGL2RenderingContext;
};

export type WebXRCompositionLayerManagerProps = {
  colorTextureFormat?: TextureFormat;
  depthStencilTextureFormat?: TextureFormat;
  textureUsage?: number;
};

export type WebXRLayersSessionInitProps = {
  required?: boolean;
};

export type WebXRCompositionLayerState = {
  xrFrame: XRFrame;
  session: XRSession;
  layer: XRCompositionLayer;
  controls: WebXRCompositionLayerControlsState;
  subImage: XRWebGLSubImage;
  framebuffer: Framebuffer;
  colorTexture: Texture;
  depthStencilTexture: Texture | null;
  viewport: [x: number, y: number, width: number, height: number];
  eye: XREye;
  layout: XRLayerLayout;
  needsRedraw: boolean;
  imageIndex: number | null;
};

export type WebXRCompositionLayerControlsProps = {
  blendTextureSourceAlpha?: boolean;
  forceMonoPresentation?: boolean;
  opacity?: number;
  quality?: XRLayerQuality;
};

export type WebXRCompositionLayerControlsState = {
  layer: XRCompositionLayer;
  blendTextureSourceAlpha: boolean;
  forceMonoPresentation: boolean;
  opacity: number;
  mipLevels: number;
  quality: XRLayerQuality;
  needsRedraw: boolean;
};

type ResolvedWebXRCompositionLayerManagerProps = Required<WebXRCompositionLayerManagerProps>;

type WebXRCompositionLayerResources = {
  subImage: XRWebGLSubImage;
  framebuffer: Framebuffer;
  colorTexture: Texture;
  depthStencilTexture: Texture | null;
};

/** Experimental v10 WebXR Layers API helper for WebGL composition layers. */
export class WebXRCompositionLayerManager {
  readonly device: WebXRWebGLDevice;
  props: ResolvedWebXRCompositionLayerManagerProps;

  session: XRSession | null = null;
  xrWebGLBinding: XRWebGLBinding | null = null;

  private _layers = new Set<XRCompositionLayer>();
  private _resources = new Map<XRCompositionLayer, WebXRCompositionLayerResources[]>();
  private _sessionEndListener = () => this.clearSession();
  private _redrawListener = (event: Event) => this._handleLayerRedraw(event);
  private _redrawLayers = new Set<XRCompositionLayer>();

  constructor(device: Device, props: WebXRCompositionLayerManagerProps = {}) {
    if (!isWebXRWebGLDevice(device)) {
      throw new Error('WebXRCompositionLayerManager requires a WebGL device');
    }
    this.device = device;
    this.props = {...WebXRCompositionLayerManager.defaultProps, ...props};
  }

  async setSession(session: XRSession | null): Promise<this> {
    this.clearSession();
    if (!session) {
      return this;
    }
    if (typeof XRWebGLBinding === 'undefined') {
      throw new Error('WebXR Layers require XRWebGLBinding');
    }

    await this.device.gl.makeXRCompatible();
    this.xrWebGLBinding = new XRWebGLBinding(session, this.device.gl);
    this.session = session;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  createQuadLayer(init: XRQuadLayerInit): XRQuadLayer {
    if (!this.xrWebGLBinding) {
      throw new Error('WebXRCompositionLayerManager has no XRWebGLBinding');
    }
    const layer = this.xrWebGLBinding.createQuadLayer(init);
    this._trackLayer(layer);
    return layer;
  }

  setLayerControls(
    layer: XRCompositionLayer,
    props: WebXRCompositionLayerControlsProps
  ): WebXRCompositionLayerControlsState {
    if (!this._layers.has(layer)) {
      throw new Error('XRCompositionLayer is not tracked by this manager');
    }
    return setWebXRCompositionLayerControls(layer, props);
  }

  getLayerControls(layer: XRCompositionLayer): WebXRCompositionLayerControlsState {
    if (!this._layers.has(layer)) {
      throw new Error('XRCompositionLayer is not tracked by this manager');
    }
    return getWebXRCompositionLayerControls(layer, this._redrawLayers.has(layer));
  }

  destroyLayer(layer: XRCompositionLayer): void {
    if (!this._layers.has(layer)) {
      return;
    }

    layer.removeEventListener('redraw', this._redrawListener);
    this._redrawLayers.delete(layer);
    this._layers.delete(layer);
    this._destroyLayerResources(layer);
    layer.destroy();
  }

  createCylinderLayer(init: XRCylinderLayerInit): XRCylinderLayer {
    if (!this.xrWebGLBinding) {
      throw new Error('WebXRCompositionLayerManager has no XRWebGLBinding');
    }
    const layer = this.xrWebGLBinding.createCylinderLayer(init);
    this._trackLayer(layer);
    return layer;
  }

  createEquirectLayer(init: XREquirectLayerInit): XREquirectLayer {
    if (!this.xrWebGLBinding) {
      throw new Error('WebXRCompositionLayerManager has no XRWebGLBinding');
    }
    const layer = this.xrWebGLBinding.createEquirectLayer(init);
    this._trackLayer(layer);
    return layer;
  }

  createCubeLayer(init: XRCubeLayerInit): XRCubeLayer {
    if (!this.xrWebGLBinding) {
      throw new Error('WebXRCompositionLayerManager has no XRWebGLBinding');
    }
    const layer = this.xrWebGLBinding.createCubeLayer(init);
    this._trackLayer(layer);
    return layer;
  }

  async updateRenderState(layers: readonly XRLayer[]): Promise<void> {
    if (!this.session) {
      throw new Error('WebXRCompositionLayerManager has no XRSession');
    }
    await this.session.updateRenderState({layers});
  }

  getLayerState(
    xrFrame: XRFrame,
    layer: XRCompositionLayer,
    eye: XREye = 'none'
  ): WebXRCompositionLayerState | null {
    if (!this.session || !this.xrWebGLBinding) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!this._layers.has(layer)) {
      throw new Error('XRCompositionLayer is not tracked by this manager');
    }

    const subImage = this.xrWebGLBinding.getSubImage(layer, xrFrame, eye);
    const resources = this._getLayerResources(layer, subImage, eye);
    const viewport = subImage.viewport;
    const needsRedraw = layer.needsRedraw || this._redrawLayers.has(layer);
    this._redrawLayers.delete(layer);

    return {
      xrFrame,
      session: this.session,
      layer,
      controls: getWebXRCompositionLayerControls(layer, needsRedraw),
      subImage,
      framebuffer: resources.framebuffer,
      colorTexture: resources.colorTexture,
      depthStencilTexture: resources.depthStencilTexture,
      viewport: [viewport.x, viewport.y, viewport.width, viewport.height],
      eye,
      layout: layer.layout,
      needsRedraw,
      imageIndex: subImage.imageIndex ?? null
    };
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this._destroyResources();
    for (const layer of this._layers) {
      layer.removeEventListener('redraw', this._redrawListener);
    }
    this._layers.clear();
    this._redrawLayers.clear();
    this.xrWebGLBinding = null;
    this.session = null;
  }

  destroy(): void {
    this.clearSession();
  }

  private _trackLayer(layer: XRCompositionLayer): void {
    this._layers.add(layer);
    layer.addEventListener('redraw', this._redrawListener);
  }

  private _getLayerResources(
    layer: XRCompositionLayer,
    subImage: XRWebGLSubImage,
    eye: XREye
  ): WebXRCompositionLayerResources {
    const resources = this._resources.get(layer) || [];
    const index = getSubImageIndex(subImage, eye);
    const previousResources = resources[index];

    if (previousResources && hasMatchingSubImage(previousResources.subImage, subImage)) {
      return previousResources;
    }

    const colorTexture = this._createBorrowedTexture(subImage, subImage.colorTexture, 'color');
    let depthStencilTexture: Texture | null = null;
    try {
      depthStencilTexture = subImage.depthStencilTexture
        ? this._createBorrowedTexture(subImage, subImage.depthStencilTexture, 'depth-stencil')
        : null;
      const framebuffer = this.device.createFramebuffer({
        id: `webxr-composition-layer-framebuffer-${this._resources.size + 1}-${index}`,
        width: subImage.colorTextureWidth,
        height: subImage.colorTextureHeight,
        colorAttachments: [colorTexture.view],
        depthStencilAttachment: depthStencilTexture?.view || null
      });
      previousResources?.framebuffer.destroy();
      previousResources?.depthStencilTexture?.destroy();
      previousResources?.colorTexture.destroy();

      const nextResources = {subImage, framebuffer, colorTexture, depthStencilTexture};
      resources[index] = nextResources;
      this._resources.set(layer, resources);
      return nextResources;
    } catch (error) {
      depthStencilTexture?.destroy();
      colorTexture.destroy();
      throw error;
    }
  }

  private _createBorrowedTexture(
    subImage: XRWebGLSubImage,
    textureHandle: WebGLTexture,
    attachment: 'color' | 'depth-stencil'
  ): Texture {
    const imageIndex = subImage.imageIndex ?? null;
    return this.device.createTexture({
      id: `webxr-composition-layer-${attachment}-texture-${this._resources.size + 1}`,
      handle: textureHandle,
      _isHandleBorrowed: true,
      dimension: imageIndex === null ? '2d' : '2d-array',
      width: getSubImageTextureWidth(subImage, attachment),
      height: getSubImageTextureHeight(subImage, attachment),
      depth: imageIndex === null ? 1 : imageIndex + 1,
      format:
        attachment === 'color'
          ? this.props.colorTextureFormat
          : this.props.depthStencilTextureFormat,
      usage: this.props.textureUsage
    } as TextureProps);
  }

  private _handleLayerRedraw(event: Event): void {
    this._redrawLayers.add(event.currentTarget as XRCompositionLayer);
  }

  private _destroyResources(): void {
    for (const layer of this._resources.keys()) {
      this._destroyLayerResources(layer);
    }
    this._resources.clear();
  }

  private _destroyLayerResources(layer: XRCompositionLayer): void {
    const resourceList = this._resources.get(layer);
    if (!resourceList) {
      return;
    }
    for (const resources of resourceList) {
      if (!resources) {
        continue;
      }
      resources.framebuffer.destroy();
      resources.depthStencilTexture?.destroy();
      resources.colorTexture.destroy();
    }
    this._resources.delete(layer);
  }

  static defaultProps: ResolvedWebXRCompositionLayerManagerProps = {
    colorTextureFormat: 'rgba8unorm',
    depthStencilTextureFormat: 'depth24plus',
    textureUsage: TextureResource.RENDER_ATTACHMENT
  };
}

export function getWebXRLayersSessionInit(props: WebXRLayersSessionInitProps = {}): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['layers']
  };
}

export function setWebXRCompositionLayerControls(
  layer: XRCompositionLayer,
  props: WebXRCompositionLayerControlsProps
): WebXRCompositionLayerControlsState {
  if (props.blendTextureSourceAlpha !== undefined) {
    layer.blendTextureSourceAlpha = props.blendTextureSourceAlpha;
  }
  if (props.forceMonoPresentation !== undefined) {
    layer.forceMonoPresentation = props.forceMonoPresentation;
  }
  if (props.opacity !== undefined) {
    layer.opacity = props.opacity;
  }
  if (props.quality !== undefined) {
    layer.quality = props.quality;
  }
  return getWebXRCompositionLayerControls(layer);
}

export function getWebXRCompositionLayerControls(
  layer: XRCompositionLayer,
  needsRedrawOverride = false
): WebXRCompositionLayerControlsState {
  return {
    layer,
    blendTextureSourceAlpha: layer.blendTextureSourceAlpha,
    forceMonoPresentation: layer.forceMonoPresentation,
    opacity: layer.opacity,
    mipLevels: layer.mipLevels,
    quality: layer.quality,
    needsRedraw: layer.needsRedraw || needsRedrawOverride
  };
}

function getSubImageIndex(subImage: XRWebGLSubImage, eye: XREye): number {
  if (subImage.imageIndex !== undefined) {
    return subImage.imageIndex;
  }
  switch (eye) {
    case 'left':
      return 1;
    case 'right':
      return 2;
    default:
      return 0;
  }
}

function getSubImageTextureWidth(
  subImage: XRWebGLSubImage,
  attachment: 'color' | 'depth-stencil'
): number {
  return attachment === 'color'
    ? subImage.colorTextureWidth
    : subImage.depthStencilTextureWidth || subImage.colorTextureWidth;
}

function getSubImageTextureHeight(
  subImage: XRWebGLSubImage,
  attachment: 'color' | 'depth-stencil'
): number {
  return attachment === 'color'
    ? subImage.colorTextureHeight
    : subImage.depthStencilTextureHeight || subImage.colorTextureHeight;
}

function hasMatchingSubImage(
  previousSubImage: XRWebGLSubImage,
  nextSubImage: XRWebGLSubImage
): boolean {
  return (
    previousSubImage.colorTexture === nextSubImage.colorTexture &&
    previousSubImage.depthStencilTexture === nextSubImage.depthStencilTexture &&
    previousSubImage.imageIndex === nextSubImage.imageIndex &&
    previousSubImage.colorTextureWidth === nextSubImage.colorTextureWidth &&
    previousSubImage.colorTextureHeight === nextSubImage.colorTextureHeight &&
    previousSubImage.depthStencilTextureWidth === nextSubImage.depthStencilTextureWidth &&
    previousSubImage.depthStencilTextureHeight === nextSubImage.depthStencilTextureHeight
  );
}

function isWebXRWebGLDevice(device: Device): device is WebXRWebGLDevice {
  return device.type === 'webgl' && 'gl' in device;
}
