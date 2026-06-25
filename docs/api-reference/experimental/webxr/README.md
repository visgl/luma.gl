# Experimental WebXR

<p class="badges">
  <img src="https://img.shields.io/badge/From-v10-blue.svg?style=flat-square" alt="From-v10" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

`@luma.gl/experimental` exposes experimental WebGL-only WebXR helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, and future input/layer/depth APIs.

## Scope

- [`WebXRAnimationFrameProvider`](/docs/api-reference/experimental/webxr/webxr-manager) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
- [`WebXRManager`](/docs/api-reference/experimental/webxr/webxr-manager) prepares an `XRWebGLLayer` and resolves per-view framebuffer, viewport, projection, and view matrix state.
- [`WebXRCameraTexture`](/docs/api-reference/experimental/webxr/webxr-camera-texture) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.

WebGPU WebXR camera textures, input sources, hit testing, anchors, depth sensing, and layer abstractions are not part of this v10 work in progress.
