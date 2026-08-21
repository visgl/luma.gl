// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Keep luma.gl's work-in-progress WebXR declarations local to experimental.
 *
 * @types/webxr does not yet cover raw camera access and also adds ambient draft
 * WebGL extension overloads to every TypeScript program that installs luma.gl.
 * This package only needs the session, layer, view, raw-camera, and draft
 * WebGPU binding subset below.
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
  type XRHandedness = 'none' | 'left' | 'right';
  type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';
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
    layers?: XRProjectionLayer[];
  }

  interface XRSession extends EventTarget {
    readonly enabledFeatures?: readonly string[];
    readonly inputSources: XRInputSourceArray;

    cancelAnimationFrame(animationFrameId: number): void;
    end(): Promise<void>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    updateRenderState(renderStateInit?: XRRenderStateInit): Promise<void>;
  }

  interface XRSpace extends EventTarget {}

  interface XRReferenceSpace extends XRSpace {}

  interface XRInputSourceArray {
    readonly length: number;
    readonly [index: number]: XRInputSource;
    [Symbol.iterator](): IterableIterator<XRInputSource>;
  }

  interface XRInputSource {
    readonly handedness: XRHandedness;
    readonly targetRayMode: XRTargetRayMode;
    readonly targetRaySpace: XRSpace;
    readonly gripSpace?: XRSpace;
    readonly profiles: readonly string[];
    readonly gamepad?: Gamepad;
    readonly hand?: XRHand;
  }

  interface XRHand {
    readonly size: number;
  }

  interface XRInputSourceEvent extends Event {
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
  }

  interface XRInputSourcesChangeEvent extends Event {
    readonly added: readonly XRInputSource[];
    readonly removed: readonly XRInputSource[];
    readonly session: XRSession;
  }

  interface XRPose {
    readonly transform: XRRigidTransform;
  }

  interface XRFrame {
    readonly session: XRSession;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;
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

  interface XRProjectionLayerInit {
    colorFormat?: GPUTextureFormat;
    depthStencilFormat?: GPUTextureFormat;
    scaleFactor?: number;
    textureUsage?: GPUTextureUsageFlags;
  }

  interface XRProjectionLayer {}

  interface XRGPUSubImage {
    readonly colorTexture: GPUTexture;
    readonly depthStencilTexture: GPUTexture | null;
    readonly viewport: XRViewport;
    /** Legacy browser prototypes expose the selected texture-array layer here. */
    readonly imageIndex?: number;

    getViewDescriptor?(): GPUTextureViewDescriptor;
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

  class XRGPUBinding {
    constructor(session: XRSession, device: GPUDevice);

    getPreferredColorFormat(): GPUTextureFormat;
    createProjectionLayer(layerInit?: XRProjectionLayerInit): XRProjectionLayer;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRGPUSubImage;
  }
}

/** Experimental 9.4 raw-camera subset required by WebXRCameraTexture. */
export type WebXRRawCameraBinding = Pick<XRWebGLBinding, 'getCameraImage'>;
