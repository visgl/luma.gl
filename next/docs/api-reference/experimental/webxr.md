# Experimental WebXR

From v10Experimental API

`@luma.gl/experimental` exposes experimental WebGPU and WebGL WebXR session helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, and future input/depth APIs.

## Scope[​](#scope "Direct link to Scope")

* [`WebXRAnimationFrameProvider`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-manager.md) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
* [`WebXRManager`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-manager.md) prepares WebGPU projection layers or an `XRWebGLLayer`, then resolves per-view framebuffer, viewport, projection, and view matrix state.
* [`WebXRCameraTexture`](https://luma.gl/next/docs/api-reference/experimental/webxr/webxr-camera-texture.md) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.

The v10 API does not provide WebGPU raw camera textures, input sources, hit testing, anchors, depth sensing, or non-projection layers.
