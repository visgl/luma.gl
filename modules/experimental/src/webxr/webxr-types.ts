// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Keep luma.gl's v10 work-in-progress WebXR declarations local to experimental.
 *
 * @types/webxr does not yet cover raw camera access and also adds ambient draft
 * WebGL extension overloads to every TypeScript program that installs luma.gl.
 * This package only needs the session, layer, view, and raw-camera subset below.
 */
export {};

declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface WebGLContextAttributes {
    xrCompatible?: boolean;
  }

  interface WebGLRenderingContextBase {
    makeXRCompatible(): Promise<void>;
  }

  type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
  type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
  type XREye = 'none' | 'left' | 'right';
  type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

  interface XRSystem extends EventTarget {
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  }

  interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
  }

  interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
  }

  interface XRSession extends EventTarget {
    cancelAnimationFrame(animationFrameId: number): void;
    end(): Promise<void>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    updateRenderState(renderStateInit?: XRRenderStateInit): Promise<void>;
  }

  interface XRSpace extends EventTarget {}

  interface XRReferenceSpace extends XRSpace {}

  interface XRFrame {
    readonly session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;
  }

  interface XRViewerPose {
    readonly views: readonly XRView[];
  }

  interface XRRigidTransform {
    readonly matrix: Float32Array;
    readonly inverse: XRRigidTransform;
  }

  interface XRCamera {
    readonly width: number;
    readonly height: number;
  }

  interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
    readonly transform: XRRigidTransform;
    readonly camera: XRCamera | null;
  }

  interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }

  interface XRWebGLLayerInit {
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    alpha?: boolean;
    ignoreDepthValues?: boolean;
    framebufferScaleFactor?: number;
  }

  class XRWebGLLayer {
    constructor(
      session: XRSession,
      context: WebGLRenderingContext | WebGL2RenderingContext,
      layerInit?: XRWebGLLayerInit
    );

    readonly framebuffer: WebGLFramebuffer | null;
    readonly framebufferWidth: number;
    readonly framebufferHeight: number;

    getViewport(view: XRView): XRViewport | undefined;
  }

  class XRWebGLBinding {
    constructor(session: XRSession, context: WebGLRenderingContext | WebGL2RenderingContext);

    getCameraImage(camera: XRCamera): WebGLTexture | null;
  }
}

/** Experimental v10 raw-camera subset required by WebXRCameraTexture. */
export type WebXRRawCameraBinding = Pick<XRWebGLBinding, 'getCameraImage'>;
