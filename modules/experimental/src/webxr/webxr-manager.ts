// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device, Framebuffer, Texture, TextureFormat, TextureViewProps} from '@luma.gl/core';

type WebXRWebGLDevice = Device & {
  type: 'webgl';
  gl: WebGL2RenderingContext;
};

type WebXRWebGPUDevice = Device & {
  type: 'webgpu';
  handle: GPUDevice;
};

type WebXRWebGPUViewResources = {
  colorTextureHandle: GPUTexture;
  depthTextureHandle: GPUTexture | null;
  colorTexture: Texture;
  depthTexture: Texture | null;
  framebuffer: Framebuffer;
  viewDescriptor: TextureViewProps;
  referenceCount: number;
};

/** Experimental v10 WebXR session setup options. */
export type WebXRManagerProps = {
  referenceSpaceType?: XRReferenceSpaceType;
  layerInit?: XRWebGLLayerInit;
  projectionLayerInit?: XRProjectionLayerInit;
};

/** Experimental v10 per-view render state for one active XR frame. */
export type WebXRViewState = {
  xrView: XRView;
  eye: XREye;
  index: number;
  framebuffer: Framebuffer;
  viewport: [x: number, y: number, width: number, height: number];
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  camera: XRCamera | null;
};

/** Experimental v10 render state resolved from one active XR frame. */
export type WebXRFrameState = {
  xrFrame: XRFrame;
  /** The shared WebGL framebuffer or first WebGPU view framebuffer. */
  framebuffer: Framebuffer;
  views: readonly WebXRViewState[];
};

/**
 * Experimental v10 WebXR session and per-view render-state helper.
 *
 * WebGL sessions use a shared XRWebGLLayer framebuffer. WebGPU sessions use
 * XRGPUBinding projection layers and borrow compositor-owned per-view textures.
 */
export class WebXRManager {
  readonly device: WebXRWebGLDevice | WebXRWebGPUDevice;
  props: Required<WebXRManagerProps>;

  session: XRSession | null = null;
  referenceSpace: XRReferenceSpace | null = null;
  baseLayer: XRWebGLLayer | null = null;
  projectionLayer: XRProjectionLayer | null = null;
  webGPUBinding: XRGPUBinding | null = null;

  private _framebuffer: Framebuffer | null = null;
  private _webGPUViewResources: WebXRWebGPUViewResources[] = [];
  private _sessionEndListener = () => this.clearSession();

  constructor(device: Device, props: WebXRManagerProps = {}) {
    if (!isWebXRWebGLDevice(device) && !isWebXRWebGPUDevice(device)) {
      throw new Error('WebXRManager requires a WebGL or WebGPU device');
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

    if (isWebXRWebGLDevice(this.device)) {
      await this.device.gl.makeXRCompatible();

      const baseLayer = new XRWebGLLayer(session, this.device.gl, this.props.layerInit);
      await session.updateRenderState({baseLayer});
      this.baseLayer = baseLayer;
    } else {
      if (typeof XRGPUBinding === 'undefined') {
        throw new Error('WebGPU WebXR is not supported in this browser');
      }
      if (session.enabledFeatures && !session.enabledFeatures.includes('webgpu')) {
        throw new Error('WebGPU WebXR requires an XRSession with the webgpu feature');
      }

      const webGPUBinding = new XRGPUBinding(session, this.device.handle);
      const projectionLayer = webGPUBinding.createProjectionLayer({
        colorFormat: webGPUBinding.getPreferredColorFormat(),
        depthStencilFormat: this.device.preferredDepthFormat as GPUTextureFormat,
        ...this.props.projectionLayerInit
      });
      await session.updateRenderState({layers: [projectionLayer]});
      this.webGPUBinding = webGPUBinding;
      this.projectionLayer = projectionLayer;
    }

    try {
      this.referenceSpace = await session.requestReferenceSpace(this.props.referenceSpaceType);
      this.session = session;
      session.addEventListener('end', this._sessionEndListener);
      return this;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  getFrameState(xrFrame: XRFrame): WebXRFrameState | null {
    if (!this.session || !this.referenceSpace || (!this.baseLayer && !this.projectionLayer)) {
      return null;
    }
    if (xrFrame.session !== this.session) {
      throw new Error('XRFrame belongs to a different XRSession');
    }

    const viewerPose = xrFrame.getViewerPose(this.referenceSpace);
    if (!viewerPose || viewerPose.views.length === 0) {
      return null;
    }

    if (this.baseLayer) {
      return this._getWebGLFrameState(xrFrame, viewerPose);
    }

    return this._getWebGPUFrameState(xrFrame, viewerPose);
  }

  clearSession(): void {
    this.session?.removeEventListener('end', this._sessionEndListener);
    this._framebuffer?.destroy();
    this._framebuffer = null;

    for (const viewResources of this._webGPUViewResources) {
      this._releaseWebGPUViewResources(viewResources);
    }
    this._webGPUViewResources = [];

    this.baseLayer = null;
    this.projectionLayer = null;
    this.webGPUBinding = null;
    this.referenceSpace = null;
    this.session = null;
  }

  destroy(): void {
    this.clearSession();
  }

  private _getWebGLFrameState(xrFrame: XRFrame, viewerPose: XRViewerPose): WebXRFrameState {
    const framebuffer = this._getWebGLFramebuffer();
    const views = viewerPose.views.map((xrView, index) => {
      const viewport = this.baseLayer?.getViewport(xrView);
      if (!viewport) {
        throw new Error('XRWebGLLayer did not provide a viewport for XRView');
      }

      return makeWebXRViewState(xrView, index, framebuffer, viewport);
    });

    return {xrFrame, framebuffer, views};
  }

  private _getWebGPUFrameState(xrFrame: XRFrame, viewerPose: XRViewerPose): WebXRFrameState {
    const projectionLayer = this.projectionLayer;
    const webGPUBinding = this.webGPUBinding;
    if (!projectionLayer || !webGPUBinding) {
      throw new Error('WebXRManager has no WebGPU projection layer');
    }

    const views = viewerPose.views.map((xrView, index) => {
      const subImage = webGPUBinding.getViewSubImage(projectionLayer, xrView);
      const framebuffer = this._getWebGPUViewFramebuffer(subImage, index);
      return makeWebXRViewState(xrView, index, framebuffer, subImage.viewport);
    });

    while (this._webGPUViewResources.length > views.length) {
      const unusedViewResources = this._webGPUViewResources.pop();
      if (unusedViewResources) {
        this._releaseWebGPUViewResources(unusedViewResources);
      }
    }

    return {xrFrame, framebuffer: views[0]!.framebuffer, views};
  }

  private _getWebGLFramebuffer(): Framebuffer {
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

  private _getWebGPUViewFramebuffer(subImage: XRGPUSubImage, index: number): Framebuffer {
    const colorTextureHandle = subImage.colorTexture;
    const depthTextureHandle = subImage.depthStencilTexture;
    const viewDescriptor = getWebGPUViewDescriptor(subImage, index);
    const previousViewResources = this._webGPUViewResources[index];

    if (
      previousViewResources &&
      hasMatchingWebGPUViewResources(
        previousViewResources,
        colorTextureHandle,
        depthTextureHandle,
        viewDescriptor
      )
    ) {
      return previousViewResources.framebuffer;
    }

    const sharedViewResources = this._webGPUViewResources.find(viewResources =>
      hasMatchingWebGPUViewResources(
        viewResources,
        colorTextureHandle,
        depthTextureHandle,
        viewDescriptor
      )
    );
    if (sharedViewResources) {
      sharedViewResources.referenceCount++;
      this._webGPUViewResources[index] = sharedViewResources;
      if (previousViewResources) {
        this._releaseWebGPUViewResources(previousViewResources);
      }
      return sharedViewResources.framebuffer;
    }

    const colorTexture = this._createBorrowedWebGPUTexture(
      colorTextureHandle,
      viewDescriptor,
      index,
      'color'
    );
    let depthTexture: Texture | null = null;
    try {
      depthTexture = depthTextureHandle
        ? this._createBorrowedWebGPUTexture(depthTextureHandle, viewDescriptor, index, 'depth')
        : null;
      const framebuffer = this.device.createFramebuffer({
        id: `webxr-view-${index}-framebuffer`,
        width: colorTextureHandle.width,
        height: colorTextureHandle.height,
        colorAttachments: [colorTexture.view],
        depthStencilAttachment: depthTexture?.view || null
      });

      this._webGPUViewResources[index] = {
        colorTextureHandle,
        depthTextureHandle,
        colorTexture,
        depthTexture,
        framebuffer,
        viewDescriptor,
        referenceCount: 1
      };

      if (previousViewResources) {
        this._releaseWebGPUViewResources(previousViewResources);
      }

      return framebuffer;
    } catch (error) {
      depthTexture?.destroy();
      colorTexture.destroy();
      throw error;
    }
  }

  private _createBorrowedWebGPUTexture(
    textureHandle: GPUTexture,
    viewDescriptor: TextureViewProps,
    index: number,
    attachment: 'color' | 'depth'
  ): Texture {
    return this.device.createTexture({
      id: `webxr-view-${index}-${attachment}-texture`,
      handle: textureHandle,
      _isHandleBorrowed: true,
      dimension: textureHandle.depthOrArrayLayers > 1 ? '2d-array' : '2d',
      format: textureHandle.format as TextureFormat,
      width: textureHandle.width,
      height: textureHandle.height,
      depth: textureHandle.depthOrArrayLayers,
      mipLevels: textureHandle.mipLevelCount,
      samples: textureHandle.sampleCount,
      usage: textureHandle.usage,
      view: viewDescriptor
    });
  }

  private _releaseWebGPUViewResources(viewResources: WebXRWebGPUViewResources): void {
    viewResources.referenceCount--;
    if (viewResources.referenceCount !== 0) {
      return;
    }

    viewResources.framebuffer.destroy();
    viewResources.depthTexture?.destroy();
    viewResources.colorTexture.destroy();
  }

  static defaultProps: Required<WebXRManagerProps> = {
    referenceSpaceType: 'local',
    layerInit: undefined!,
    projectionLayerInit: undefined!
  };
}

function makeWebXRViewState(
  xrView: XRView,
  index: number,
  framebuffer: Framebuffer,
  viewport: XRViewport
): WebXRViewState {
  return {
    xrView,
    eye: xrView.eye,
    index,
    framebuffer,
    viewport: [viewport.x, viewport.y, viewport.width, viewport.height],
    projectionMatrix: xrView.projectionMatrix,
    viewMatrix: xrView.transform.inverse.matrix,
    camera: xrView.camera ?? null
  };
}

function getWebGPUViewDescriptor(subImage: XRGPUSubImage, index: number): TextureViewProps {
  const descriptor = subImage.getViewDescriptor?.();
  const fallbackArrayLayer =
    subImage.imageIndex ?? (subImage.colorTexture.depthOrArrayLayers > 1 ? index : 0);

  return {
    dimension: descriptor?.dimension || '2d',
    aspect: descriptor?.aspect || 'all',
    baseMipLevel: descriptor?.baseMipLevel || 0,
    mipLevelCount: descriptor?.mipLevelCount || 1,
    baseArrayLayer: descriptor?.baseArrayLayer ?? fallbackArrayLayer,
    arrayLayerCount: descriptor?.arrayLayerCount || 1
  };
}

function hasMatchingWebGPUViewDescriptor(
  previousDescriptor: TextureViewProps,
  nextDescriptor: TextureViewProps
): boolean {
  return (
    previousDescriptor.dimension === nextDescriptor.dimension &&
    previousDescriptor.aspect === nextDescriptor.aspect &&
    previousDescriptor.baseMipLevel === nextDescriptor.baseMipLevel &&
    previousDescriptor.mipLevelCount === nextDescriptor.mipLevelCount &&
    previousDescriptor.baseArrayLayer === nextDescriptor.baseArrayLayer &&
    previousDescriptor.arrayLayerCount === nextDescriptor.arrayLayerCount
  );
}

function hasMatchingWebGPUViewResources(
  viewResources: WebXRWebGPUViewResources,
  colorTextureHandle: GPUTexture,
  depthTextureHandle: GPUTexture | null,
  viewDescriptor: TextureViewProps
): boolean {
  return (
    viewResources.colorTextureHandle === colorTextureHandle &&
    viewResources.depthTextureHandle === depthTextureHandle &&
    hasMatchingWebGPUViewDescriptor(viewResources.viewDescriptor, viewDescriptor)
  );
}

function isWebXRWebGLDevice(device: Device): device is WebXRWebGLDevice {
  return device.type === 'webgl' && 'gl' in device;
}

function isWebXRWebGPUDevice(device: Device): device is WebXRWebGPUDevice {
  return device.type === 'webgpu' && 'handle' in device;
}
