# Experimental WebXR

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`@luma.gl/experimental` exposes experimental WebGPU and WebGL WebXR session helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, input, hit testing, and future depth APIs.

## Scope

- [`WebXRAnimationFrameProvider`](/docs/api-reference/experimental/webxr/webxr-manager) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
- [`getWebXRBoundsState`](/docs/api-reference/experimental/webxr/webxr-bounds) reads room-scale `bounded-floor` geometry for teleport limits and floor overlays.
- [`WebXRManager`](/docs/api-reference/experimental/webxr/webxr-manager) prepares WebGPU projection layers or an `XRWebGLLayer`, then resolves per-view framebuffer, viewport, projection, and view matrix state.
- [`WebXRCameraTexture`](/docs/api-reference/experimental/webxr/webxr-camera-texture) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.
- [`WebXRCompositionLayerManager`](/docs/api-reference/experimental/webxr/webxr-composition-layer-manager) creates WebGL quad, cylinder, equirect, and cube composition layers, manages common layer controls, and resolves borrowed subimage framebuffers for rendering.
- [`WebXRDepthSensingManager`](/docs/api-reference/experimental/webxr/webxr-depth-sensing-manager) resolves WebXR depth sensing state from CPU buffers or borrowed WebGL depth textures.
- [`WebXRDOMOverlayManager`](/docs/api-reference/experimental/webxr/webxr-dom-overlay-manager) tracks DOM overlay state and suppresses XR select events from overlay UI.
- [`getWebXRGamepadState`](/docs/api-reference/experimental/webxr/webxr-gamepad) snapshots live XR gamepad buttons and axes into stable per-frame state, with optional per-frame action transitions through `WebXRGamepadActionManager`.
- [`getWebXRHandPinch`](/docs/api-reference/experimental/webxr/webxr-hand-gestures) derives simple thumb-to-finger pinch gestures from tracked hand joints.
- [`WebXRHandTrackingManager`](/docs/api-reference/experimental/webxr/webxr-hand-tracking-manager) resolves articulated hand joint matrices and radii from WebXR hand input sources.
- [`WebXRImageTrackingManager`](/docs/api-reference/experimental/webxr/webxr-image-tracking-manager) resolves AR tracked-image poses, tracking states, measured widths, and added/updated/removed frame diffs.
- [`pulseWebXRInputHaptics`](/docs/api-reference/experimental/webxr/webxr-haptics) pulses compatible controller haptic actuators exposed through WebXR input gamepads.
- [`WebXRHitTestManager`](/docs/api-reference/experimental/webxr/webxr-hit-test-manager) requests an AR hit-test source and resolves hit poses in the app reference space.
- [`WebXRAnchorManager`](/docs/api-reference/experimental/webxr/webxr-anchor-manager) creates, tracks, resolves, and deletes AR anchors.
- [`WebXRLightEstimationManager`](/docs/api-reference/experimental/webxr/webxr-light-estimation-manager) resolves AR light probes, direct-light estimates, spherical harmonics, and optional reflection cube maps.
- [`WebXRMediaLayerManager`](/docs/api-reference/experimental/webxr/webxr-media-layer-manager) creates video-backed quad, cylinder, and equirect composition layers through the XR compositor.
- [`WebXRMeshDetectionManager`](/docs/api-reference/experimental/webxr/webxr-mesh-detection-manager) resolves detected AR mesh poses, vertex/index buffers, labels, and added/updated/removed frame diffs.
- [`WebXRPlaneDetectionManager`](/docs/api-reference/experimental/webxr/webxr-plane-detection-manager) resolves detected AR plane poses, polygons, labels, and added/updated/removed frame diffs.
- [`WebXRReferenceSpaceManager`](/docs/api-reference/experimental/webxr/webxr-reference-space-manager) tracks reference-space reset events and forwards offset reference-space creation.
- [`WebXRRenderStateManager`](/docs/api-reference/experimental/webxr/webxr-render-state-manager) updates and snapshots WebXR render-state clip planes and inline field of view.
- [`mergeWebXRSessionInit`](/docs/api-reference/experimental/webxr/webxr-session-init) composes required and optional feature lists from multiple WebXR helper modules.
- [`WebXRSessionStateManager`](/docs/api-reference/experimental/webxr/webxr-session-state-manager) tracks session visibility, frame rates, and optional target frame-rate requests.

WebGPU raw camera textures are not part of this v10 work in progress.
