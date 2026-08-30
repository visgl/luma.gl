import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# Experimental WebXR

<DocumentationBadges>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
  <DocumentationBadge tone="experimental">Experimental API</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/experimental` exposes experimental WebGPU and WebGL WebXR session helpers. They stay outside `@luma.gl/engine` because WebXR brings its own session lifecycle, frame scheduler, per-view rendering state, raw camera access, and future input/depth APIs.

## Scope

- [`WebXRAnimationFrameProvider`](/docs/api-reference/experimental/webxr/webxr-manager) drives an engine `AnimationLoop` from `XRSession.requestAnimationFrame()`.
- [`WebXRManager`](/docs/api-reference/experimental/webxr/webxr-manager) prepares WebGPU projection layers or an `XRWebGLLayer`, then resolves per-view framebuffer, viewport, projection, and view matrix state.
- [`WebXRCameraTexture`](/docs/api-reference/experimental/webxr/webxr-camera-texture) binds WebXR Raw Camera Access as a borrowed read-only WebGL texture sampled through GLSL `sampler2D`.

The v10 API does not provide WebGPU raw camera textures, input sources, hit testing, anchors,
depth sensing, or non-projection layers.
