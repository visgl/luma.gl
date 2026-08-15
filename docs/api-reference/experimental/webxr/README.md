# Experimental WebXR

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`@luma.gl/experimental` exposes experimental WebGPU and WebGL WebXR session helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, input, hit testing, and future depth APIs.

## Scope

- [`WebXRAnimationFrameProvider`](/docs/api-reference/experimental/webxr/webxr-manager) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
- [`WebXRManager`](/docs/api-reference/experimental/webxr/webxr-manager) prepares WebGPU projection layers or an `XRWebGLLayer`, then resolves per-view framebuffer, viewport, projection, and view matrix state.
- [`WebXRCameraTexture`](/docs/api-reference/experimental/webxr/webxr-camera-texture) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.
- [`WebXRCompositionLayerManager`](/docs/api-reference/experimental/webxr/webxr-composition-layer-manager) creates WebGL quad, cylinder, equirect, and cube composition layers and resolves borrowed subimage framebuffers for rendering.
- [`WebXRDepthSensingManager`](/docs/api-reference/experimental/webxr/webxr-depth-sensing-manager) resolves WebXR depth sensing state from CPU buffers or borrowed WebGL depth textures.
- [`WebXRDOMOverlayManager`](/docs/api-reference/experimental/webxr/webxr-dom-overlay-manager) tracks DOM overlay state and suppresses XR select events from overlay UI.
- [`getWebXRHandPinch`](/docs/api-reference/experimental/webxr/webxr-hand-gestures) derives simple thumb-to-finger pinch gestures from tracked hand joints.
- [`WebXRHandTrackingManager`](/docs/api-reference/experimental/webxr/webxr-hand-tracking-manager) resolves articulated hand joint matrices and radii from WebXR hand input sources.
- [`WebXRHitTestManager`](/docs/api-reference/experimental/webxr/webxr-hit-test-manager) requests an AR hit-test source and resolves hit poses in the app reference space.
- [`WebXRAnchorManager`](/docs/api-reference/experimental/webxr/webxr-anchor-manager) creates, tracks, resolves, and deletes AR anchors.
- [`WebXRMediaLayerManager`](/docs/api-reference/experimental/webxr/webxr-media-layer-manager) creates video-backed quad, cylinder, and equirect composition layers through the XR compositor.

WebGPU raw camera textures are not part of this v10 work in progress.
