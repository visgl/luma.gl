# Experimental WebXR

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`@luma.gl/experimental` exposes experimental WebGL-only WebXR helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, and future input/layer/depth APIs.

## Scope[​](#scope "Direct link to Scope")

* [`WebXRAnimationFrameProvider`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-manager.md) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
* [`WebXRManager`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-manager.md) prepares an `XRWebGLLayer` and resolves per-view framebuffer, viewport, projection, and view matrix state.
* [`WebXRCameraTexture`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-camera-texture.md) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.

WebGPU WebXR camera textures, input sources, hit testing, anchors, depth sensing, and layer abstractions are not part of this v10 work in progress.
