// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture, TextureFormat, TextureProps} from '@luma.gl/core';
import {Texture as TextureResource} from '@luma.gl/core';
import type {WebXRDepthBinding} from './webxr-types';

export type WebXRDepthSensingManagerProps = {
  textureFormat?: TextureFormat;
  textureUsage?: number;
};

export type WebXRDepthSensingSessionInitProps = {
  required?: boolean;
  usagePreference?: XRDepthUsage[];
  dataFormatPreference?: XRDepthDataFormat[];
  depthTypeRequest?: XRDepthType[];
  matchDepthView?: boolean;
};

export type WebXRDepthState = {
  xrFrame: XRFrame;
  session: XRSession;
  views: readonly WebXRDepthViewState[];
};

export type WebXRDepthViewState = {
  xrView: XRView;
  depthInformation: XRDepthInformation;
  cpuDepthInformation: XRCPUDepthInformation | null;
  webGLDepthInformation: XRWebGLDepthInformation | null;
  texture: Texture | null;
  width: number;
  height: number;
  rawValueToMeters: number;
  normDepthBufferFromNormView: XRRigidTransform;
  matrix: Float32Array;
  textureType: XRTextureType | null;
  imageIndex: number | null;
};

type ResolvedWebXRDepthSensingManagerProps = Required<WebXRDepthSensingManagerProps>;

/** Experimental v10 WebXR depth-sensing CPU and WebGL texture helper. */
export class WebXRDepthSensingManager {
  props: ResolvedWebXRDepthSensingManagerProps;

  session: XRSession | null = null;
  device: Device | null = null;
  xrWebGLBinding: WebXRDepthBinding | null = null;

  private _textures = new Map<WebGLTexture, Texture>();
  private _sessionEndListener = () => this.clearSession();

  constructor(props: WebXRDepthSensingManagerProps = {}) {
    this.props = {...WebXRDepthSensingManager.defaultProps, ...props};
  }

  setSession(session: XRSession | null): this {
    this.clearSession();
    if (!session) {
      return this;
    }

    this.session = session;
    session.addEventListener('end', this._sessionEndListener);
    return this;
  }

  setWebGLBinding(device: Device | null, xrWebGLBinding: WebXRDepthBinding | null): this {
    this._destroyTextures();
    this.device = device;
    this.xrWebGLBinding = xrWebGLBinding;
    return this;
  }

  getDepthState(xrFrame: XRFrame, xrViews: readonly XRView[]): WebXRDepthState | null {
    if (!this.session || xrViews.length === 0 || isDepthSensingPaused(this.session)) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.getDepthInformation && !this.xrWebGLBinding?.getDepthInformation) {
      return null;
    }

    const views = xrViews
      .map(xrView => this._getDepthViewState(xrFrame, xrView))
      .filter((viewState): viewState is WebXRDepthViewState => Boolean(viewState));

    return views.length > 0 ? {xrFrame, session: this.session, views} : null;
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.session = null;
    this._destroyTextures();
  }

  destroy(): void {
    this.clearSession();
    this.device = null;
    this.xrWebGLBinding = null;
  }

  private _getDepthViewState(xrFrame: XRFrame, xrView: XRView): WebXRDepthViewState | null {
    const cpuDepthInformation = getCPUDepthInformation(xrFrame, xrView);
    const webGLDepthInformation = getWebGLDepthInformation(this.xrWebGLBinding, xrView);
    const depthInformation = cpuDepthInformation || webGLDepthInformation;
    if (!depthInformation) {
      return null;
    }

    return {
      xrView,
      depthInformation,
      cpuDepthInformation,
      webGLDepthInformation,
      texture: this._getDepthTexture(webGLDepthInformation),
      width: depthInformation.width,
      height: depthInformation.height,
      rawValueToMeters: depthInformation.rawValueToMeters,
      normDepthBufferFromNormView: depthInformation.normDepthBufferFromNormView,
      matrix: depthInformation.normDepthBufferFromNormView.matrix,
      textureType: webGLDepthInformation?.textureType ?? null,
      imageIndex: webGLDepthInformation?.imageIndex ?? null
    };
  }

  private _getDepthTexture(depthInformation: XRWebGLDepthInformation | null): Texture | null {
    if (!depthInformation || !this.device || this.device.type !== 'webgl') {
      return null;
    }

    const textureHandle = depthInformation.texture;
    let texture = this._textures.get(textureHandle);
    if (!texture) {
      texture = this.device.createTexture({
        id: `webxr-depth-texture-${this._textures.size + 1}`,
        handle: textureHandle,
        _isHandleBorrowed: true,
        dimension: getDepthTextureDimension(depthInformation),
        width: depthInformation.width,
        height: depthInformation.height,
        depth: getDepthTextureLayerCount(depthInformation),
        format:
          this.props.textureFormat || getWebXRDepthTextureFormat(this.session?.depthDataFormat),
        usage: this.props.textureUsage
      } as TextureProps);
      this._textures.set(textureHandle, texture);
    }

    return texture;
  }

  private _destroyTextures(): void {
    for (const texture of this._textures.values()) {
      texture.destroy();
    }
    this._textures.clear();
  }

  static defaultProps: ResolvedWebXRDepthSensingManagerProps = {
    textureFormat: undefined!,
    textureUsage: TextureResource.SAMPLE
  };
}

export function getWebXRDepthSensingSessionInit(
  props: WebXRDepthSensingSessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['depth-sensing'],
    depthSensing: {
      usagePreference: props.usagePreference || ['cpu-optimized', 'gpu-optimized'],
      dataFormatPreference: props.dataFormatPreference || [
        'luminance-alpha',
        'float32',
        'unsigned-short'
      ],
      depthTypeRequest: props.depthTypeRequest,
      matchDepthView: props.matchDepthView
    }
  };
}

export function getWebXRDepthTextureFormat(
  depthDataFormat: XRDepthDataFormat | null | undefined
): TextureFormat {
  switch (depthDataFormat) {
    case 'float32':
      return 'r32float';
    case 'unsigned-short':
      return 'r16uint';
    case 'luminance-alpha':
    default:
      return 'rg8unorm';
  }
}

function getCPUDepthInformation(xrFrame: XRFrame, xrView: XRView): XRCPUDepthInformation | null {
  if (!xrFrame.getDepthInformation) {
    return null;
  }

  try {
    return xrFrame.getDepthInformation(xrView) || null;
  } catch {
    return null;
  }
}

function getWebGLDepthInformation(
  xrWebGLBinding: WebXRDepthBinding | null,
  xrView: XRView
): XRWebGLDepthInformation | null {
  if (!xrWebGLBinding?.getDepthInformation) {
    return null;
  }

  try {
    return xrWebGLBinding.getDepthInformation(xrView) || null;
  } catch {
    return null;
  }
}

function isDepthSensingPaused(session: XRSession): boolean {
  return session.depthActive === false;
}

function getDepthTextureDimension(depthInformation: XRWebGLDepthInformation): '2d' | '2d-array' {
  return depthInformation.textureType === WEBGL_TEXTURE_2D_ARRAY ||
    depthInformation.imageIndex !== undefined
    ? '2d-array'
    : '2d';
}

function getDepthTextureLayerCount(depthInformation: XRWebGLDepthInformation): number {
  return getDepthTextureDimension(depthInformation) === '2d-array'
    ? Math.max(1, (depthInformation.imageIndex ?? 0) + 1)
    : 1;
}

const WEBGL_TEXTURE_2D_ARRAY = 0x8c1a;
