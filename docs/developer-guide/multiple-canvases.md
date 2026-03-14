# Multiple Canvases

This guide covers the recommended way to use luma.gl with more than one canvas.

## Overview

WebGPU can create multiple real GPU-backed canvases. WebGL cannot. A WebGL device is tied to one actual GPU-backed canvas.

`PresentationContext` provides the portable API:

- on WebGL, the device renders into its default `CanvasContext` and `present()` copies into each destination canvas
- on WebGPU, each `PresentationContext` renders directly into its own destination canvas

To keep the application setup portable, create the device with a default `CanvasContext` backed by an `OffscreenCanvas` even when running on WebGPU.

## When To Use It

Use `PresentationContext` when:

- you need to show the same renderer output in multiple canvases
- you need a multi-canvas workflow that still works on WebGL
- you are comfortable with sequential presentation, where one device presents to one target at a time

Do not use it when:

- you need truly independent simultaneous GPU-backed canvases on WebGL
- you need different scenes rendered concurrently from the same WebGL device

## Requirement

For a portable app, create the device with a default `CanvasContext` backed by an `OffscreenCanvas`.

On WebGL, `device.createPresentationContext()` requires that offscreen-backed default context. On WebGPU, presentation contexts do not borrow the default context, but using the same device setup keeps the app backend-agnostic.

That default canvas is the real render target. The visible canvases are presentation targets that receive copied pixels.

```ts
const offscreenCanvas = new OffscreenCanvas(1, 1);

const device = await luma.createDevice({
  type: 'best-available',
  adapters: [webgl2Adapter, webgpuAdapter],
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

### WebGL

Each call to `getCurrentFramebuffer()`:

- resizes the device's default `CanvasContext` to match the presentation target
- returns the framebuffer from that default `CanvasContext`

Each call to `present()`:

- submits pending GPU commands
- copies the default canvas contents into the destination canvas

On WebGL, all presentation contexts share one default render target, so they must be used sequentially.

### WebGPU

Each `PresentationContext` creates a real `GPUCanvasContext` on its destination canvas.

Each call to `getCurrentFramebuffer()`:

- returns a framebuffer for that destination canvas

Each call to `present()`:

- submits pending GPU commands for that destination canvas

On WebGPU, presentation contexts do not borrow the default canvas.

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
- On WebGL, render and present each target in sequence during a frame.
- On WebGPU, render each target with its own presentation context and call `present()` explicitly.
- Keep the default canvas hidden or offscreen. It is an implementation detail, not a user-facing surface.

## Limitations

- `PresentationContext` is not supported on `NullDevice`.
- On WebGL, presentation is a copy step.
- On WebGPU, presentation is direct to the destination canvas.
- On WebGL, multiple presentation targets share one default canvas, so they are not independent render surfaces.
