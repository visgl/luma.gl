// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Framebuffer} from '@luma.gl/core';

type WebXRWebGLDevice = Device & {
  type: 'webgl';
  gl: WebGL2RenderingContext;
};

/** Experimental v10 WebXR session setup options. */
export type WebXRManagerProps = {
  referenceSpaceType?: XRReferenceSpaceType;
  layerInit?: XRWebGLLayerInit;
};

/** Experimental v10 per-view render state for one active XR frame. */
export type WebXRViewState = {
  xrView: XRView;
  eye: XREye;
  index: number;
  viewport: [x: number, y: number, width: number, height: number];
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  camera: XRCamera | null;
};

/** Experimental v10 render state resolved from one active XR frame. */
export type WebXRFrameState = {
  xrFrame: XRFrame;
  framebuffer: Framebuffer;
  views: readonly WebXRViewState[];
};

/**
 * Experimental v10 WebGL-only WebXR session and per-view render-state helper.
 *
 * This is intentionally a small work-in-progress surface. It owns XRWebGLLayer
 * setup and exposes the framebuffer, viewports, and matrices luma.gl callers
 * need to render each XRView themselves.
 */
export class WebXRManager {
  readonly device: WebXRWebGLDevice;
  props: Required<WebXRManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;
  baseLayer: XRWebGLLayer | null = null;

  private _framebuffer: Framebuffer | null = null;
  private _sessionEndListener = () => this.clearSession();

  constructor(device: Device, props: WebXRManagerProps = {}) {
    if (!isWebXRWebGLDevice(device)) {
      throw new Error('WebXRManager is only available on WebGL in v10 work in progress');
    }

    this.device = device;
    this.props = {...WebXRManager.defaultProps, ...props};
  }

  async setSession(session: XRSession | null, props: WebXRManagerProps = {}): Promise<this> {
    this.clearSession();
    this.props = {...this.props, ...props};

    if (!session) {
      return this;
    }

    await this.device.gl.makeXRCompatible();

    const baseLayer = new XRWebGLLayer(session, this.device.gl, this.props.layerInit);
    await session.updateRenderState({baseLayer});
    const referenceSpace = await session.requestReferenceSpace(this.props.referenceSpaceType);

    this.session = session;
    this.referenceSpace = referenceSpace;
    this.baseLayer = baseLayer;
    session.addEventListener('end', this._sessionEndListener);

    return this;
  }

  getFrameState(xrFrame: XRFrame): WebXRFrameState | null {
    if (!this.session || !this.referenceSpace || !this.baseLayer) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }

    const viewerPose = xrFrame.getViewerPose(this.referenceSpace);
    if (!viewerPose) {
      return null;
    }

    const framebuffer = this._getFramebuffer();
    const views = viewerPose.views.map((xrView, index) => {
      const viewport = this.baseLayer?.getViewport(xrView);
      if (!viewport) {
        throw new Error('XRWebGLLayer did not provide a viewport for XRView');
      }

      return {
        xrView,
        eye: xrView.eye,
        index,
        viewport: [viewport.x, viewport.y, viewport.width, viewport.height],
        projectionMatrix: xrView.projectionMatrix,
        viewMatrix: xrView.transform.inverse.matrix,
        camera: xrView.camera ?? null
      } satisfies WebXRViewState;
    });

    return {xrFrame, framebuffer, views};
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this._framebuffer?.destroy();
    this._framebuffer = null;
    this.baseLayer = null;
    this.referenceSpace = null;
    this.session = null;
  }

  destroy(): void {
    this.clearSession();
  }

  private _getFramebuffer(): Framebuffer {
    const baseLayer = this.baseLayer;
    if (!baseLayer) {
      throw new Error('WebXRManager has no XRWebGLLayer');
    }
    const framebufferHandle = baseLayer.framebuffer as WebGLFramebuffer | null | undefined;
    if (framebufferHandle === undefined) {
      throw new Error('XRWebGLLayer framebuffer is only available during an active XR frame');
    }

    if (
      !this._framebuffer ||
      this._framebuffer.props.handle !== framebufferHandle ||
      this._framebuffer.width !== baseLayer.framebufferWidth ||
      this._framebuffer.height !== baseLayer.framebufferHeight
    ) {
      this._framebuffer?.destroy();
      this._framebuffer = this.device.createFramebuffer({
        id: 'webxr-framebuffer',
        handle: framebufferHandle,
        width: baseLayer.framebufferWidth,
        height: baseLayer.framebufferHeight
      });
    }

    return this._framebuffer;
  }

  static defaultProps: Required<WebXRManagerProps> = {
    referenceSpaceType: 'local',
    layerInit: undefined!
  };
}

function isWebXRWebGLDevice(device: Device): device is WebXRWebGLDevice {
  return device.type === 'webgl' && 'gl' in device;
}
