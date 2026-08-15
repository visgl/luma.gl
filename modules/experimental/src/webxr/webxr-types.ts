// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Keep luma.gl's v10 work-in-progress WebXR declarations local to experimental.
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

  interface GlobalEventHandlers {
    onbeforexrselect: ((this: GlobalEventHandlers, event: Event) => unknown) | null;
  }

  type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
  type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
  type XREye = 'none' | 'left' | 'right';
  type XRHandedness = 'none' | 'left' | 'right';
  type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';
  type XRHitTestTrackableType = 'point' | 'plane' | 'mesh';
  type XRDepthDataFormat = 'luminance-alpha' | 'float32' | 'unsigned-short';
  type XRDepthType = 'raw' | 'smooth';
  type XRDepthUsage = 'cpu-optimized' | 'gpu-optimized';
  type XRTextureType = number;
  type XRDOMOverlayType = 'screen' | 'floating' | 'head-locked';
  type XRHandJoint =
    | 'wrist'
    | 'thumb-metacarpal'
    | 'thumb-phalanx-proximal'
    | 'thumb-phalanx-distal'
    | 'thumb-tip'
    | 'index-finger-metacarpal'
    | 'index-finger-phalanx-proximal'
    | 'index-finger-phalanx-intermediate'
    | 'index-finger-phalanx-distal'
    | 'index-finger-tip'
    | 'middle-finger-metacarpal'
    | 'middle-finger-phalanx-proximal'
    | 'middle-finger-phalanx-intermediate'
    | 'middle-finger-phalanx-distal'
    | 'middle-finger-tip'
    | 'ring-finger-metacarpal'
    | 'ring-finger-phalanx-proximal'
    | 'ring-finger-phalanx-intermediate'
    | 'ring-finger-phalanx-distal'
    | 'ring-finger-tip'
    | 'pinky-finger-metacarpal'
    | 'pinky-finger-phalanx-proximal'
    | 'pinky-finger-phalanx-intermediate'
    | 'pinky-finger-phalanx-distal'
    | 'pinky-finger-tip';
  type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

  interface XRSystem extends EventTarget {
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  }

  interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
    depthSensing?: XRDepthStateInit;
    domOverlay?: XRDOMOverlayInit;
  }

  interface XRDOMOverlayInit {
    root: Element;
  }

  interface XRDOMOverlayState {
    type: XRDOMOverlayType;
  }

  interface XRDepthStateInit {
    usagePreference: XRDepthUsage[];
    dataFormatPreference: XRDepthDataFormat[];
    depthTypeRequest?: XRDepthType[];
    matchDepthView?: boolean;
  }

  interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer;
    layers?: XRProjectionLayer[];
  }

  interface XRSession extends EventTarget {
    readonly enabledFeatures?: readonly string[];
    readonly inputSources: XRInputSourceArray;
    readonly depthUsage?: XRDepthUsage;
    readonly depthDataFormat?: XRDepthDataFormat;
    readonly depthType?: XRDepthType | null;
    readonly depthActive?: boolean;
    readonly domOverlayState?: XRDOMOverlayState | null;

    cancelAnimationFrame(animationFrameId: number): void;
    end(): Promise<void>;
    pauseDepthSensing?(): void;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    requestHitTestSource?(options: XRHitTestOptionsInit): Promise<XRHitTestSource | null>;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    resumeDepthSensing?(): void;
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
    get(jointName: XRHandJoint): XRJointSpace | undefined;
    [Symbol.iterator](): IterableIterator<[XRHandJoint, XRJointSpace]>;
  }

  interface XRJointSpace extends XRSpace {
    readonly jointName: XRHandJoint;
  }

  interface XRJointPose extends XRPose {
    readonly radius: number;
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

  interface XRRay {
    readonly origin: DOMPointReadOnly;
    readonly direction: DOMPointReadOnly;
    readonly matrix: Float32Array;
  }

  interface XRHitTestOptionsInit {
    space: XRSpace;
    offsetRay?: XRRay;
    entityTypes?: XRHitTestTrackableType[];
  }

  interface XRHitTestSource {
    cancel(): void;
  }

  interface XRHitTestResult {
    createAnchor?(): Promise<XRAnchor>;
    getPose(baseSpace: XRSpace): XRPose | undefined;
  }

  interface XRAnchor {
    readonly anchorSpace: XRSpace;
    delete(): void;
  }

  interface XRDepthInformation {
    readonly width: number;
    readonly height: number;
    readonly normDepthBufferFromNormView: XRRigidTransform;
    readonly rawValueToMeters: number;
  }

  interface XRCPUDepthInformation extends XRDepthInformation {
    readonly data: ArrayBuffer;
    getDepthInMeters(x: number, y: number): number;
  }

  interface XRWebGLDepthInformation extends XRDepthInformation {
    readonly texture: WebGLTexture;
    readonly textureType: XRTextureType;
    readonly imageIndex?: number;
  }

  interface XRFrame {
    readonly session: XRSession;
    readonly trackedAnchors?: ReadonlySet<XRAnchor>;
    createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
    fillJointRadii?(jointSpaces: readonly XRJointSpace[], radii: Float32Array): boolean;
    fillPoses?(spaces: readonly XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean;
    getDepthInformation?(view: XRView): XRCPUDepthInformation | null;
    getHitTestResults?(hitTestSource: XRHitTestSource): XRHitTestResult[];
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose | null;
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
    getDepthInformation?(view: XRView): XRWebGLDepthInformation | null;
  }

  class XRGPUBinding {
    constructor(session: XRSession, device: GPUDevice);

    getPreferredColorFormat(): GPUTextureFormat;
    createProjectionLayer(layerInit?: XRProjectionLayerInit): XRProjectionLayer;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRGPUSubImage;
  }
}

export type WebXRDepthBinding = Pick<XRWebGLBinding, 'getDepthInformation'>;

/** Experimental v10 raw-camera subset required by WebXRCameraTexture. */
export type WebXRRawCameraBinding = Pick<XRWebGLBinding, 'getCameraImage'>;
