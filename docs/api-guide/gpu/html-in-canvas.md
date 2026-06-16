# HTML-in-Canvas

HTML-in-Canvas is an emerging browser API for drawing laid out DOM descendants of a
`<canvas>` into Canvas 2D, WebGL, or WebGPU output. The browser already knows how to
turn DOM, layout, and CSS paint into pixels; the new part is that an application can
redirect those rendered pixels into a graphics surface instead of only letting the
page compositor display them.

```text
DOM
 |
 v
Layout
 |
 v
CSS paint
 |
 v
Compositor
 |
 v
GPU texture
```

Before HTML-in-Canvas, that pipeline effectively stopped at "display on screen" for
normal application code. The proposal adds an explicit DOM-to-canvas path, which makes
rich HTML useful as a texture source for charts, editor panels, in-game menus, labels,
tooltips, and other GPU-rendered interfaces.

:::caution
HTML-in-Canvas is still experimental. The [WICG explainer](https://github.com/WICG/html-in-canvas)
describes it as a proposal, and Chromium currently exposes it behind
`chrome://flags/#canvas-draw-element`.
:::

## Browser Model

The proposal has three main pieces:

- `layoutsubtree` on `<canvas>` opts direct canvas children into layout, hit testing,
  and accessibility while keeping them visually redirected through canvas drawing.
- DOM child drawing APIs copy rendered element pixels into Canvas 2D, WebGL, or WebGPU.
  The 3D paths are `WebGLRenderingContext.texElementImage2D(...)` and
  `GPUQueue.copyElementImageToTexture(...)`.
- `paint` and `requestPaint()` provide an update cycle so applications upload changed
  DOM pixels when needed instead of rasterizing every animation frame by default.

The source element must be a direct child of the opted-in canvas. When the application
draws that element somewhere other than its DOM location, it must keep the element's CSS
transform synchronized with the drawn location so browser hit testing and accessibility
match the pixels users see.

## luma.gl Feature Detection

luma.gl surfaces the complete DOM-to-texture path as the
`'html-in-canvas'` [`DeviceFeature`](/docs/api-reference/core/device-features). Prefer
checking the current `Device` instead of checking browser globals directly:

```ts
if (device.features.has('html-in-canvas')) {
  // The current browser and luma.gl backend expose the HTML-in-Canvas texture path.
}
```

The feature is present only when both parts needed by the active device exist:

- canvas proposal APIs: `HTMLCanvasElement.layoutSubtree` and
  `HTMLCanvasElement.requestPaint()`
- backend texture copy API: WebGPU `GPUQueue.copyElementImageToTexture(...)` or WebGL
  `WebGLRenderingContext.texElementImage2D(...)`

`isHTMLInCanvasSupported()` checks only the canvas-side proposal APIs. Use it when code
needs to decide whether a canvas can host a layout subtree before a luma.gl `Device`
exists. Use `device.features.has('html-in-canvas')` before attempting DOM-to-texture
upload through a specific WebGL or WebGPU device.

## luma.gl Scope

HTML-in-Canvas belongs at the texture-source boundary. luma.gl should treat the rendered
DOM subtree as a dynamic texture source, while higher-level libraries decide how that
texture is placed in a scene, synchronized with picking, or composed into UI panels.

That split keeps the portable GPU API focused:

- `@luma.gl/core` exposes capability detection through `DeviceFeature`.
- `@luma.gl/webgl` and `@luma.gl/webgpu` decide whether the active backend has the required
  DOM-to-texture copy method.
- engine or deck.gl-level code can build conveniences such as live HTML textures, panel
  faces on a cube, labels, or world-space UI once the primitive is available.

## Update Guidance

Treat HTML-in-Canvas content like other dynamic texture data:

- request a paint when application state changes the DOM subtree
- upload during the `paint` event when the browser has a current snapshot
- avoid unconditional uploads every frame unless the UI really changes every frame
- keep DOM transforms aligned with drawn transforms so interaction and accessibility stay
  correct

For normal image, canvas, or video uploads that do not need DOM layout rasterization, use
[`Texture.copyExternalImage()`](/docs/api-reference/core/resources/texture#copyexternalimage)
instead.
