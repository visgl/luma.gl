# Multiple Canvases

This guide covers the recommended way to use luma.gl with more than one canvas when you need WebGL compatibility.

## Overview

WebGPU can create multiple real `CanvasContext` instances. WebGL cannot. A WebGL device is tied to one actual GPU-backed canvas.

`PresentationContext` provides a portable workaround:

- the device renders into its default `CanvasContext`
- each `PresentationContext` tracks a separate destination canvas
- `present()` copies the rendered result into that destination canvas

## When To Use It

Use `PresentationContext` when:

- you need to show the same renderer output in multiple canvases
- you need a multi-canvas workflow that still works on WebGL
- you are comfortable with sequential presentation, where one device presents to one target at a time

Do not use it when:

- you need truly independent simultaneous GPU-backed canvases on WebGL
- you need different scenes rendered concurrently from the same WebGL device

## Requirement

For WebGL, `device.createPresentationContext()` only works when the device's default `CanvasContext` is backed by an `OffscreenCanvas`.

That default canvas is the real render target. The visible canvases are presentation targets that receive copied pixels.

```ts
const offscreenCanvas = new OffscreenCanvas(1, 1);

const device = await luma.createDevice({
  type: 'webgl',
  adapters: [webgl2Adapter],
  createCanvasContext: {canvas: offscreenCanvas}
});
```

## Basic Flow

```ts
const leftPresentationContext = device.createPresentationContext({canvas: leftCanvas});
const rightPresentationContext = device.createPresentationContext({canvas: rightCanvas});

const leftFramebuffer = leftPresentationContext.getCurrentFramebuffer();
const leftRenderPass = device.beginRenderPass({framebuffer: leftFramebuffer});
// draw left view
leftRenderPass.end();
leftPresentationContext.present();

const rightFramebuffer = rightPresentationContext.getCurrentFramebuffer();
const rightRenderPass = device.beginRenderPass({framebuffer: rightFramebuffer});
// draw right view
rightRenderPass.end();
rightPresentationContext.present();
```

## How It Works

Each call to `getCurrentFramebuffer()`:

- resizes the device's default `CanvasContext` to match the presentation target
- returns the framebuffer from that default `CanvasContext`

Each call to `present()`:

- submits pending GPU commands
- copies the default canvas contents into the destination canvas

Because all presentation contexts share one default render target, they must be used sequentially.

## Sizing

`PresentationContext` tracks the destination canvas the same way `CanvasContext` tracks a render canvas:

- CSS size
- device pixel size
- drawing buffer size
- device pixel ratio changes

This means a presentation target can still use `autoResize` and `useDevicePixels`.

## Recommended Pattern

- Create one device with an offscreen default canvas.
- Create one `PresentationContext` per visible canvas.
- Render and present each target in sequence during a frame.
- Keep the default canvas hidden or offscreen. It is an implementation detail, not a user-facing surface.

## Limitations

- v1 is WebGL-only.
- `PresentationContext` is not supported on WebGPU or `NullDevice`.
- Presentation is a copy step, not direct swap-chain presentation.
- Multiple presentation targets share one default canvas, so they are not independent render surfaces.
