// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {WebXRRawCameraBinding} from './webxr-types';
export type {WebXRAnchorPose, WebXRAnchorState} from './webxr-anchor';
export {WebXRAnchorManager} from './webxr-anchor';
export {WebXRAnimationFrameProvider} from './webxr-animation-frame-provider';
export type {WebXRBoundsPoint, WebXRBoundsState} from './webxr-bounds';
export {
  getWebXRBoundsState,
  isPointInWebXRBounds,
  isWebXRBoundedReferenceSpace
} from './webxr-bounds';
export type {WebXRCameraTextureProps} from './webxr-camera-texture';
export {WebXRCameraTexture} from './webxr-camera-texture';
export type {
  WebXRDepthSensingManagerProps,
  WebXRDepthSensingSessionInitProps,
  WebXRDepthState,
  WebXRDepthViewState
} from './webxr-depth-sensing';
export {
  getWebXRDepthSensingSessionInit,
  getWebXRDepthTextureFormat,
  WebXRDepthSensingManager
} from './webxr-depth-sensing';
export type {
  WebXRDOMOverlayManagerProps,
  WebXRDOMOverlaySessionInitProps,
  WebXRDOMOverlayState
} from './webxr-dom-overlay';
export {getWebXRDOMOverlaySessionInit, WebXRDOMOverlayManager} from './webxr-dom-overlay';
export type {WebXRHandPinchProps, WebXRHandPinchState} from './webxr-hand-gestures';
export {getWebXRHandPinch} from './webxr-hand-gestures';
export type {WebXRHandJointState, WebXRHandTrackingState} from './webxr-hand-tracking';
export {WEBXR_HAND_JOINTS, WebXRHandTrackingManager} from './webxr-hand-tracking';
export type {
  WebXRGamepadAxisName,
  WebXRGamepadAxisState,
  WebXRGamepadButtonName,
  WebXRGamepadButtonState,
  WebXRGamepadState
} from './webxr-gamepad';
export {getWebXRGamepadState, getWebXRGamepadStates} from './webxr-gamepad';
export type {
  WebXRGamepadHapticActuator,
  WebXRHapticPulseProps,
  WebXRHapticPulseResult
} from './webxr-haptics';
export {getWebXRInputHapticActuator, pulseWebXRInputHaptics} from './webxr-haptics';
export type {
  WebXRCompositionLayerControlsProps,
  WebXRCompositionLayerControlsState,
  WebXRCompositionLayerManagerProps,
  WebXRCompositionLayerState,
  WebXRLayersSessionInitProps
} from './webxr-layers';
export {
  getWebXRCompositionLayerControls,
  getWebXRLayersSessionInit,
  setWebXRCompositionLayerControls,
  WebXRCompositionLayerManager
} from './webxr-layers';
export type {
  WebXRLightEstimationManagerProps,
  WebXRLightEstimationSessionInitProps,
  WebXRLightEstimationState
} from './webxr-light-estimation';
export {
  getWebXRLightEstimationSessionInit,
  getWebXRReflectionTextureFormat,
  WebXRLightEstimationManager
} from './webxr-light-estimation';
export type {WebXRMediaLayerState, WebXRMediaLayerType} from './webxr-media-layers';
export {WebXRMediaLayerManager} from './webxr-media-layers';
export type {
  WebXRSessionState,
  WebXRSessionStateManagerProps,
  WebXRTargetFrameRate
} from './webxr-session-state';
export {
  getWebXRSupportedFrameRates,
  getWebXRTargetFrameRate,
  makeWebXRSessionState,
  WebXRSessionStateManager
} from './webxr-session-state';
export type {
  WebXRSessionFeature,
  WebXRSessionFeatures,
  WebXRSessionSupport,
  WebXRSessionSupportProps
} from './webxr-session-init';
export {
  getWebXRSessionFeatures,
  getWebXRSessionSupport,
  isWebXRSessionFeatureEnabled,
  mergeWebXRSessionInit,
  WEBXR_DEFAULT_SESSION_SUPPORT_MODES
} from './webxr-session-init';
export type {
  WebXRMeshDetectionManagerProps,
  WebXRMeshDetectionSessionInitProps,
  WebXRMeshDetectionState,
  WebXRMeshState
} from './webxr-mesh-detection';
export {getWebXRMeshDetectionSessionInit, WebXRMeshDetectionManager} from './webxr-mesh-detection';
export type {
  WebXRPlaneDetectionManagerProps,
  WebXRPlaneDetectionSessionInitProps,
  WebXRPlaneDetectionState,
  WebXRPlaneState
} from './webxr-plane-detection';
export {
  getWebXRPlaneDetectionSessionInit,
  WebXRPlaneDetectionManager
} from './webxr-plane-detection';
export type {
  WebXRHitTestManagerProps,
  WebXRHitTestResult,
  WebXRHitTestState,
  WebXRTransientInputHitTestProps,
  WebXRTransientInputHitTestResult
} from './webxr-hit-test';
export {WebXRHitTestManager} from './webxr-hit-test';
export type {
  WebXRInputRay,
  WebXRInputRayPlaneIntersection,
  WebXRInputRayPlaneIntersectionProps
} from './webxr-input';
export {getWebXRInputRay, getWebXRInputRayPlaneIntersection} from './webxr-input';
export type {WebXRReferenceSpaceResetState} from './webxr-reference-space';
export {makeWebXRReferenceSpaceState, WebXRReferenceSpaceManager} from './webxr-reference-space';
export type {WebXRRenderState, WebXRRenderStateManagerProps} from './webxr-render-state';
export {
  getWebXRRenderStateInit,
  makeWebXRRenderState,
  WebXRRenderStateManager
} from './webxr-render-state';
export type {
  WebXRImageTrackingManagerProps,
  WebXRImageTrackingSessionInitProps,
  WebXRImageTrackingState,
  WebXRTrackedImageState
} from './webxr-image-tracking';
export {
  getWebXRImageTrackingSessionInit,
  WebXRImageTrackingManager
} from './webxr-image-tracking';
export type {
  WebXRFrameState,
  WebXRInputState,
  WebXRManagerProps,
  WebXRProjectionLayerControlsProps,
  WebXRProjectionLayerState,
  WebXRReferenceSpaceState,
  WebXRViewState
} from './webxr-manager';
export {
  getWebXRProjectionLayerState,
  getWebXRReferenceSpaceTypes,
  requestWebXRReferenceSpace,
  setWebXRProjectionLayerControls,
  WebXRManager
} from './webxr-manager';
