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
  type XRVisibilityState = 'visible' | 'visible-blurred' | 'hidden';
  type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
  type XREye = 'none' | 'left' | 'right';
  type XRHandedness = 'none' | 'left' | 'right';
  type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';
  type XRHitTestTrackableType = 'point' | 'plane' | 'mesh';
  type XRImageTrackability = 'untrackable' | 'trackable';
  type XRImageTrackingState = 'untracked' | 'tracked' | 'emulated';
  type XRPlaneOrientation = 'horizontal' | 'vertical';
  type XRDepthDataFormat = 'luminance-alpha' | 'float32' | 'unsigned-short';
  type XRDepthType = 'raw' | 'smooth';
  type XRDepthUsage = 'cpu-optimized' | 'gpu-optimized';
  type XRReflectionFormat = 'srgba8' | 'rgba16f';
  type XRTextureType = number;
  type XRLayerTextureType = 'texture' | 'texture-array';
  type XRLayerLayout = 'default' | 'mono' | 'stereo' | 'stereo-left-right' | 'stereo-top-bottom';
  type XRLayerQuality = 'default' | 'text-optimized' | 'graphics-optimized';
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
    trackedImages?: XRTrackedImageInit[];
  }

  interface XRTrackedImageInit {
    image: ImageBitmap;
    widthInMeters: number;
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
    depthNear?: number;
    depthFar?: number;
    inlineVerticalFieldOfView?: number;
    baseLayer?: XRWebGLLayer;
    layers?: readonly XRLayer[];
  }

  interface XRRenderState {
    readonly depthNear: number;
    readonly depthFar: number;
    readonly inlineVerticalFieldOfView: number | null;
    readonly baseLayer: XRWebGLLayer | null;
    readonly layers?: readonly XRLayer[];
  }

  interface XRSession extends EventTarget {
    readonly enabledFeatures?: readonly string[];
    readonly inputSources: XRInputSourceArray;
    readonly renderState?: XRRenderState;
    readonly visibilityState?: XRVisibilityState;
    readonly frameRate?: number;
    readonly supportedFrameRates?: Float32Array | readonly number[];
    readonly isSystemKeyboardSupported?: boolean;
    readonly depthUsage?: XRDepthUsage;
    readonly depthDataFormat?: XRDepthDataFormat;
    readonly depthType?: XRDepthType | null;
    readonly depthActive?: boolean;
    readonly domOverlayState?: XRDOMOverlayState | null;
    readonly preferredReflectionFormat?: XRReflectionFormat;

    cancelAnimationFrame(animationFrameId: number): void;
    end(): Promise<void>;
    getImageTrackability?(): Promise<readonly XRImageTrackability[]>;
    pauseDepthSensing?(): void;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    requestHitTestSource?(options: XRHitTestOptionsInit): Promise<XRHitTestSource | null>;
    requestHitTestSourceForTransientInput?(
      options: XRTransientInputHitTestOptionsInit
    ): Promise<XRTransientInputHitTestSource | null>;
    requestLightProbe?(options?: XRLightProbeInit): Promise<XRLightProbe>;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    initiateRoomCapture?(): Promise<void>;
    resumeDepthSensing?(): void;
    updateRenderState(renderStateInit?: XRRenderStateInit): Promise<void>;
    updateTargetFrameRate?(rate: number): Promise<void>;
  }

  interface XRSpace extends EventTarget {}

  interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace?(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset?: ((this: XRReferenceSpace, event: XRReferenceSpaceEvent) => unknown) | null;
  }

  interface XRReferenceSpaceEvent extends Event {
    readonly referenceSpace: XRReferenceSpace;
    readonly transform: XRRigidTransform | null;
  }

  interface XRReferenceSpaceEventInit extends EventInit {
    referenceSpace: XRReferenceSpace;
    transform?: XRRigidTransform | null;
  }

  interface XRBoundedReferenceSpace extends XRReferenceSpace {
    readonly boundsGeometry: readonly DOMPointReadOnly[];
  }

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

  interface XRTransientInputHitTestOptionsInit {
    profile: string;
    offsetRay?: XRRay;
    entityTypes?: XRHitTestTrackableType[];
  }

  interface XRHitTestSource {
    cancel(): void;
  }

  interface XRTransientInputHitTestSource {
    cancel(): void;
  }

  interface XRHitTestResult {
    createAnchor?(): Promise<XRAnchor>;
    getPose(baseSpace: XRSpace): XRPose | undefined;
  }

  interface XRTransientInputHitTestResult {
    readonly inputSource: XRInputSource;
    readonly results: readonly XRHitTestResult[];
  }

  interface XRAnchor {
    readonly anchorSpace: XRSpace;
    delete(): void;
  }

  interface XRLightProbe extends EventTarget {
    readonly probeSpace: XRSpace;
    onreflectionchange: ((this: XRLightProbe, event: Event) => unknown) | null;
  }

  interface XRLightProbeInit {
    reflectionFormat?: XRReflectionFormat;
  }

  interface XRLightEstimate {
    readonly sphericalHarmonicsCoefficients: Float32Array;
    readonly primaryLightDirection: DOMPointReadOnly;
    readonly primaryLightIntensity: DOMPointReadOnly;
  }

  interface XRPlane {
    readonly planeSpace: XRSpace;
    readonly polygon: readonly DOMPointReadOnly[];
    readonly orientation: XRPlaneOrientation | null;
    readonly lastChangedTime: DOMHighResTimeStamp;
    readonly semanticLabel?: string | null;
  }

  interface XRPlaneSet extends ReadonlySet<XRPlane> {}

  interface XRMesh {
    readonly meshSpace: XRSpace;
    readonly vertices: Float32Array;
    readonly indices: Uint32Array;
    readonly lastChangedTime: DOMHighResTimeStamp;
    readonly semanticLabel?: string | null;
  }

  interface XRMeshSet extends ReadonlySet<XRMesh> {}

  interface XRImageTrackingResult {
    readonly imageSpace: XRSpace;
    readonly index: number;
    readonly trackingState: XRImageTrackingState;
    readonly measuredWidthInMeters: number;
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
    readonly detectedPlanes?: XRPlaneSet;
    readonly detectedMeshes?: XRMeshSet;
    createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
    fillJointRadii?(jointSpaces: readonly XRJointSpace[], radii: Float32Array): boolean;
    fillPoses?(spaces: readonly XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean;
    getDepthInformation?(view: XRView): XRCPUDepthInformation | null;
    getHitTestResults?(hitTestSource: XRHitTestSource): XRHitTestResult[];
    getHitTestResultsForTransientInput?(
      hitTestSource: XRTransientInputHitTestSource
    ): XRTransientInputHitTestResult[];
    getImageTrackingResults?(): readonly XRImageTrackingResult[];
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose | null;
    getLightEstimate?(lightProbe: XRLightProbe): XRLightEstimate | null;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;
  }

  interface XRViewerPose extends XRPose {
    readonly views: readonly XRView[];
  }

  interface XRRigidTransform {
    readonly position: DOMPointReadOnly;
    readonly orientation: DOMPointReadOnly;
    readonly matrix: Float32Array;
    readonly inverse: XRRigidTransform;
  }

  interface XRRigidTransformConstructor {
    new (position?: DOMPointInit, orientation?: DOMPointInit): XRRigidTransform;
  }

  var XRRigidTransform: XRRigidTransformConstructor | undefined;

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

  interface XRLayer extends EventTarget {}

  interface XRCompositionLayer extends XRLayer {
    readonly layout: XRLayerLayout;
    blendTextureSourceAlpha: boolean;
    forceMonoPresentation: boolean;
    opacity: number;
    readonly mipLevels: number;
    quality: XRLayerQuality;
    readonly needsRedraw: boolean;

    destroy(): void;
  }

  interface XRQuadLayer extends XRCompositionLayer {
    space: XRSpace;
    transform: XRRigidTransform;
    width: number;
    height: number;
    onredraw: ((this: XRQuadLayer, event: Event) => unknown) | null;
  }

  interface XRCylinderLayer extends XRCompositionLayer {
    space: XRSpace;
    transform: XRRigidTransform;
    radius: number;
    centralAngle: number;
    aspectRatio: number;
    onredraw: ((this: XRCylinderLayer, event: Event) => unknown) | null;
  }

  interface XREquirectLayer extends XRCompositionLayer {
    space: XRReferenceSpace;
    transform: XRRigidTransform;
    radius: number;
    centralHorizontalAngle: number;
    upperVerticalAngle: number;
    lowerVerticalAngle: number;
    onredraw: ((this: XREquirectLayer, event: Event) => unknown) | null;
  }

  interface XRCubeLayer extends XRCompositionLayer {
    space: XRReferenceSpace;
    orientation: DOMPointReadOnly | null;
    onredraw: ((this: XRCubeLayer, event: Event) => unknown) | null;
  }

  interface XRSubImage {
    readonly viewport: XRViewport;
  }

  interface XRWebGLSubImage extends XRSubImage {
    readonly colorTexture: WebGLTexture;
    readonly depthStencilTexture: WebGLTexture | null;
    readonly motionVectorTexture: WebGLTexture | null;
    readonly imageIndex?: number;
    readonly colorTextureWidth: number;
    readonly colorTextureHeight: number;
    readonly depthStencilTextureWidth?: number | null;
    readonly depthStencilTextureHeight?: number | null;
  }

  interface XRLayerInit {
    space: XRSpace;
    textureType?: XRLayerTextureType;
    colorFormat?: number;
    depthFormat?: number | null;
    mipLevels?: number;
    viewPixelWidth: number;
    viewPixelHeight: number;
    layout?: XRLayerLayout;
    isStatic?: boolean;
    clearOnAccess?: boolean;
  }

  interface XRQuadLayerInit extends XRLayerInit {
    transform?: XRRigidTransform;
    width?: number;
    height?: number;
  }

  interface XRCylinderLayerInit extends XRLayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralAngle?: number;
    aspectRatio?: number;
  }

  interface XREquirectLayerInit extends XRLayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralHorizontalAngle?: number;
    upperVerticalAngle?: number;
    lowerVerticalAngle?: number;
  }

  interface XRCubeLayerInit extends XRLayerInit {
    orientation?: DOMPointReadOnly | null;
  }

  interface XRMediaLayerInit {
    space: XRSpace;
    layout?: XRLayerLayout;
    invertStereo?: boolean;
  }

  interface XRMediaQuadLayerInit extends XRMediaLayerInit {
    transform?: XRRigidTransform;
    width?: number;
    height?: number;
  }

  interface XRMediaCylinderLayerInit extends XRMediaLayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralAngle?: number;
    aspectRatio?: number;
  }

  interface XRMediaEquirectLayerInit extends XRMediaLayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralHorizontalAngle?: number;
    upperVerticalAngle?: number;
    lowerVerticalAngle?: number;
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

  interface XRProjectionLayer extends XRCompositionLayer {
    readonly textureWidth: number;
    readonly textureHeight: number;
    readonly textureArrayLength: number;
    readonly ignoreDepthValues: boolean;
    fixedFoveation: number | null;
    deltaPose: XRRigidTransform | null;
  }

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

    createProjectionLayer(layerInit?: XRProjectionLayerInit): XRProjectionLayer;
    createQuadLayer(layerInit: XRQuadLayerInit): XRQuadLayer;
    createCylinderLayer(layerInit: XRCylinderLayerInit): XRCylinderLayer;
    createEquirectLayer(layerInit: XREquirectLayerInit): XREquirectLayer;
    createCubeLayer(layerInit: XRCubeLayerInit): XRCubeLayer;
    getCameraImage(camera: XRCamera): WebGLTexture | null;
    getDepthInformation?(view: XRView): XRWebGLDepthInformation | null;
    getReflectionCubeMap?(lightProbe: XRLightProbe): WebGLTexture | null;
    getSubImage(layer: XRCompositionLayer, frame: XRFrame, eye?: XREye): XRWebGLSubImage;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRWebGLSubImage;
  }

  class XRMediaBinding {
    constructor(session: XRSession);

    createQuadLayer(video: HTMLVideoElement, layerInit: XRMediaQuadLayerInit): XRQuadLayer;
    createCylinderLayer(
      video: HTMLVideoElement,
      layerInit: XRMediaCylinderLayerInit
    ): XRCylinderLayer;
    createEquirectLayer(
      video: HTMLVideoElement,
      layerInit: XRMediaEquirectLayerInit
    ): XREquirectLayer;
  }

  class XRGPUBinding {
    constructor(session: XRSession, device: GPUDevice);

    getPreferredColorFormat(): GPUTextureFormat;
    createProjectionLayer(layerInit?: XRProjectionLayerInit): XRProjectionLayer;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRGPUSubImage;
  }
}

export type WebXRDepthBinding = Pick<XRWebGLBinding, 'getDepthInformation'>;

/** Experimental v10 WebXR lighting-estimation reflection cube-map subset. */
export type WebXRLightEstimationBinding = Pick<XRWebGLBinding, 'getReflectionCubeMap'>;

/** Experimental v10 raw-camera subset required by WebXRCameraTexture. */
export type WebXRRawCameraBinding = Pick<XRWebGLBinding, 'getCameraImage'>;
