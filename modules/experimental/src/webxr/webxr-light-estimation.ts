// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Texture, TextureFormat, TextureProps} from '@luma.gl/core';
import {Texture as TextureResource} from '@luma.gl/core';
import type {WebXRLightEstimationBinding} from './webxr-types';

export type WebXRLightEstimationManagerProps = {
  reflectionFormat?: XRReflectionFormat | 'preferred';
  reflectionCubeMapSize?: number;
  textureFormat?: TextureFormat;
  textureUsage?: number;
};

export type WebXRLightEstimationSessionInitProps = {
  required?: boolean;
};

export type WebXRLightEstimationState = {
  xrFrame: XRFrame;
  session: XRSession;
  lightProbe: XRLightProbe;
  lightEstimate: XRLightEstimate;
  probePose: XRPose | null;
  matrix: Float32Array | null;
  sphericalHarmonicsCoefficients: Float32Array;
  primaryLightDirection: [number, number, number];
  primaryLightIntensity: [number, number, number];
  reflectionCubeMap: WebGLTexture | null;
  reflectionCubeMapTexture: Texture | null;
  reflectionRevision: number;
};

type ResolvedWebXRLightEstimationManagerProps = Required<WebXRLightEstimationManagerProps>;

/** Experimental v10 WebXR lighting-estimation probe and reflection-cubemap helper. */
export class WebXRLightEstimationManager {
  props: ResolvedWebXRLightEstimationManagerProps;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;
  lightProbe: XRLightProbe | null = null;
  device: Device | null = null;
  xrWebGLBinding: WebXRLightEstimationBinding | null = null;

  private _reflectionCubeMapTextures = new Map<WebGLTexture, Texture>();
  private _reflectionRevision = 0;
  private _sessionEndListener = () => this.clearSession();
  private _reflectionChangeListener = () => {
    this._reflectionRevision++;
  };

  constructor(props: WebXRLightEstimationManagerProps = {}) {
    this.props = {...WebXRLightEstimationManager.defaultProps, ...props};
  }

  async setSession(
    session: XRSession | null,
    referenceSpace: XRReferenceSpace | null,
    props: WebXRLightEstimationManagerProps = {}
  ): Promise<this> {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }
    if (!referenceSpace) {
      throw new Error('WebXRLightEstimationManager requires an app reference space');
    }
    if (!session.requestLightProbe) {
      throw new Error('WebXR light-estimation probes are not supported in this browser');
    }

    const lightProbe = await session.requestLightProbe(getLightProbeInit(session, this.props));

    this.session = session;
    this.referenceSpace = referenceSpace;
    this.lightProbe = lightProbe;
    this._reflectionRevision = 0;
    session.addEventListener('end', this._sessionEndListener);
    lightProbe.addEventListener('reflectionchange', this._reflectionChangeListener);
    return this;
  }

  setWebGLBinding(device: Device | null, xrWebGLBinding: WebXRLightEstimationBinding | null): this {
    this._destroyReflectionCubeMapTextures();
    this.device = device;
    this.xrWebGLBinding = xrWebGLBinding;
    return this;
  }

  getLightEstimationState(xrFrame: XRFrame): WebXRLightEstimationState | null {
    if (!this.session || !this.referenceSpace || !this.lightProbe) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }
    if (!xrFrame.getLightEstimate) {
      return null;
    }

    const lightEstimate = xrFrame.getLightEstimate(this.lightProbe);
    if (!lightEstimate) {
      return null;
    }

    const probePose = xrFrame.getPose(this.lightProbe.probeSpace, this.referenceSpace) || null;
    const reflectionCubeMap = this._getReflectionCubeMap();

    return {
      xrFrame,
      session: this.session,
      lightProbe: this.lightProbe,
      lightEstimate,
      probePose,
      matrix: probePose?.transform.matrix ?? null,
      sphericalHarmonicsCoefficients: lightEstimate.sphericalHarmonicsCoefficients,
      primaryLightDirection: getDOMPointVector3(lightEstimate.primaryLightDirection),
      primaryLightIntensity: getDOMPointVector3(lightEstimate.primaryLightIntensity),
      reflectionCubeMap,
      reflectionCubeMapTexture: this._getReflectionCubeMapTexture(reflectionCubeMap),
      reflectionRevision: this._reflectionRevision
    };
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this.lightProbe?.removeEventListener('reflectionchange', this._reflectionChangeListener);
    this.session = null;
    this.referenceSpace = null;
    this.lightProbe = null;
    this._reflectionRevision = 0;
    this._destroyReflectionCubeMapTextures();
  }

  destroy(): void {
    this.clearSession();
    this.device = null;
    this.xrWebGLBinding = null;
  }

  private _getReflectionCubeMap(): WebGLTexture | null {
    if (!this.xrWebGLBinding?.getReflectionCubeMap || !this.lightProbe) {
      return null;
    }

    try {
      return this.xrWebGLBinding.getReflectionCubeMap(this.lightProbe) || null;
    } catch {
      return null;
    }
  }

  private _getReflectionCubeMapTexture(reflectionCubeMap: WebGLTexture | null): Texture | null {
    const size = this.props.reflectionCubeMapSize;
    if (!reflectionCubeMap || !this.device || this.device.type !== 'webgl' || !size) {
      return null;
    }

    let texture = this._reflectionCubeMapTextures.get(reflectionCubeMap);
    if (!texture) {
      texture = this.device.createTexture({
        id: `webxr-light-reflection-cube-map-${this._reflectionCubeMapTextures.size + 1}`,
        handle: reflectionCubeMap,
        _isHandleBorrowed: true,
        dimension: 'cube',
        width: size,
        height: size,
        depth: 6,
        format:
          this.props.textureFormat || getWebXRReflectionTextureFormat(this.props.reflectionFormat),
        usage: this.props.textureUsage
      } as TextureProps);
      this._reflectionCubeMapTextures.set(reflectionCubeMap, texture);
    }

    return texture;
  }

  private _destroyReflectionCubeMapTextures(): void {
    for (const texture of this._reflectionCubeMapTextures.values()) {
      texture.destroy();
    }
    this._reflectionCubeMapTextures.clear();
  }

  static defaultProps: ResolvedWebXRLightEstimationManagerProps = {
    reflectionFormat: 'srgba8',
    reflectionCubeMapSize: undefined!,
    textureFormat: undefined!,
    textureUsage: TextureResource.SAMPLE
  };
}

export function getWebXRLightEstimationSessionInit(
  props: WebXRLightEstimationSessionInitProps = {}
): XRSessionInit {
  return {
    [props.required ? 'requiredFeatures' : 'optionalFeatures']: ['light-estimation']
  };
}

export function getWebXRReflectionTextureFormat(
  reflectionFormat: XRReflectionFormat | 'preferred' | null | undefined
): TextureFormat {
  return reflectionFormat === 'rgba16f' ? 'rgba16float' : 'rgba8unorm-srgb';
}

function getLightProbeInit(
  session: XRSession,
  props: ResolvedWebXRLightEstimationManagerProps
): XRLightProbeInit {
  const reflectionFormat =
    props.reflectionFormat === 'preferred'
      ? session.preferredReflectionFormat || 'srgba8'
      : props.reflectionFormat;

  return {reflectionFormat};
}

function getDOMPointVector3(point: DOMPointReadOnly): [number, number, number] {
  return [point.x, point.y, point.z];
}
