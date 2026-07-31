# RFC: Explicit CanvasContext Drawing-Buffer Tracking

* **Date**: July 2026
* **Status**: Draft

## Summary

This RFC proposes fresh `CanvasContext` properties that describe the application's intended
canvas integration:

```ts
export type DrawingBufferSizeTracking = 'none' | 'canvas' | 'external-canvas';

export type CanvasContextProps = {
  drawingBufferSizeTracking?: DrawingBufferSizeTracking;
  drawingBufferSizeSource?: HTMLCanvasElement | OffscreenCanvas | null;
  pixelRatio?: number;
};
```

The properties replace the overlapping responsibilities of `autoResize`, `useDevicePixels`, and
`pixelSizeSource`. The old properties remain supported and are deprecated in luma.gl v9, with
removal proposed for v10.

The RFC also proposes `DeviceProps.canvasContextProps` as the preferred way to configure a
device's default or attached canvas context. The boolean form of `createCanvasContext` remains,
while its `CanvasContextProps` object form is deprecated.

## Motivation

Canvas sizing currently requires applications and integration libraries to combine three
properties:

```ts
createCanvasContext: {
  autoResize: true,
  useDevicePixels: true,
  pixelSizeSource: 'css-dpr'
}
```

The individual properties are overloaded or interact through implicit precedence:

- `autoResize` controls whether luma.gl owns drawing-buffer resizing.
- `useDevicePixels` accepts `true`, `false`, or a number, combining a mode and a value.
- `pixelSizeSource` changes the meaning of `useDevicePixels: true`.
- `DeviceProps.createCanvasContext` accepts a boolean or a configuration object.

These interactions leak into higher-level integrations. [deck.gl
#10370](https://github.com/visgl/deck.gl/pull/10370) must merge nested
`deviceProps.createCanvasContext` objects and narrow the boolean/object union to reproduce a
basemap's CSS/DPR sizing algorithm. [deck.gl
#10332](https://github.com/visgl/deck.gl/pull/10332) demonstrates the branching required to
interpret and forward `useDevicePixels: boolean | number`.

That is a symptom of an abstraction mismatch. deck.gl has two concrete integration behaviors:

- **Interleaved:** attach to an externally owned context and canvas. The external renderer changes
  the drawing-buffer dimensions; luma.gl reads them but never writes them.
- **Overlaid:** render to a separate luma.gl canvas whose drawing-buffer dimensions mirror the
  basemap canvas.

luma.gl currently exposes lower-level sizing algorithms, leaving deck.gl to reconstruct these
behaviors. The proposed API represents drawing-buffer ownership and source directly.

## Proposal

### Drawing-buffer tracking

`drawingBufferSizeTracking` selects where the target drawing-buffer dimensions come from:

| Tracking | Size source | Does luma.gl write the target `width` and `height`? | `pixelRatio` |
| --- | --- | --- | --- |
| `'none'` | Application | Never | Not allowed |
| `'canvas'` | Target canvas CSS/physical size | Yes, when size changes | Optional fixed ratio |
| `'external-canvas'` | `drawingBufferSizeSource.width/height` | Yes, unless source is target | Not allowed |

The default is `'canvas'`, preserving standalone canvas auto-sizing. With no `pixelRatio`, luma.gl
uses `ResizeObserver.devicePixelContentBoxSize` when available and falls back to content-box size
multiplied by browser DPR. With a numeric `pixelRatio`, luma.gl observes the content box and uses
`Math.floor(cssSize * pixelRatio)`. A ratio must be finite and greater than zero.

```ts
// The application owns absolute drawing-buffer dimensions.
{drawingBufferSizeTracking: 'none'}

// Track the target canvas at its exact physical pixel coverage when available.
{drawingBufferSizeTracking: 'canvas'}

// Disable device-pixel scaling while continuing to track target CSS resizes.
{drawingBufferSizeTracking: 'canvas', pixelRatio: 1}

// Use a fixed pixel ratio while continuing to track target CSS resizes.
{drawingBufferSizeTracking: 'canvas', pixelRatio: 1.5}
```

In `'none'` mode, target canvas CSS size, position, visibility, and DPR observation continue.
Resize callbacks still run, but luma.gl does not change the drawing buffer automatically.

### Track an external canvas

`'external-canvas'` tracking makes another canvas's actual backing-store `width` and `height`
authoritative:

```ts
await luma.createDevice({
  createCanvasContext: true,
  canvasContextProps: {
    canvas: overlayCanvas,
    drawingBufferSizeTracking: 'external-canvas',
    drawingBufferSizeSource: map.getCanvas()
  }
});
```

Before reporting or using the drawing-buffer size, luma.gl compares two integer properties from
the source canvas with its cached dimensions. It resizes the target only when they differ. This
does not read CSS layout, use `getBoundingClientRect()`, poll with a timer, or depend on observer
callback ordering.

If the source canvas is the target canvas itself, luma.gl updates only its size bookkeeping and
never writes the canvas. This is the default behavior for an attached WebGL context: the external
owner remains responsible for resizing the shared canvas.

`drawingBufferSizeSource` is required with `'external-canvas'` and is invalid with the other
tracking values. `pixelRatio` is invalid because the source already supplies authoritative pixel
dimensions.

### What is not tracked

The new properties govern only drawing-buffer dimensions: the integer `canvas.width` and
`canvas.height` backing-store properties.

An external source's CSS box, style, position, transforms, borders, scroll state, and containing
block are not mirrored. An overlaid target belongs to its own layout hierarchy, so copying those
properties could force layout, introduce feedback loops, and still fail to align canvases in
different coordinate systems. The target canvas continues to use its own existing observation for
CSS-size bookkeeping, callbacks, visibility, position, and CSS-to-device coordinate conversion.

Layout alignment remains the responsibility of deck.gl or the host application.

### Dynamic configuration

The new properties are mutable:

```ts
canvasContext.setProps({
  drawingBufferSizeTracking: 'canvas',
  pixelRatio: 1.5
});
```

Setting `pixelRatio: undefined` while tracking `'canvas'` resumes exact device-pixel observation
with browser-DPR fallback. This re-registers the active `ResizeObserver` with the appropriate box.
Changing to `'none'` leaves the current drawing-buffer size unchanged.

The external source can be replaced dynamically. A transition between external and target-canvas
tracking is explicit:

```ts
canvasContext.setProps({
  drawingBufferSizeTracking: 'external-canvas',
  drawingBufferSizeSource: map.getCanvas()
});

canvasContext.setProps({
  drawingBufferSizeTracking: 'canvas',
  drawingBufferSizeSource: null
});
```

### Default canvas-context configuration

Device creation gains a separate configuration property:

```ts
export type DeviceProps = {
  createCanvasContext?: boolean | CanvasContextProps;
  canvasContextProps?: CanvasContextProps;
};
```

Preferred usage is:

```ts
await luma.createDevice({
  createCanvasContext: true,
  canvasContextProps: {
    drawingBufferSizeTracking: 'canvas',
    pixelRatio: 1
  }
});
```

If the deprecated object form of `createCanvasContext` and `canvasContextProps` are both supplied,
they are shallow-merged and `canvasContextProps` wins.

Attaching an existing WebGL context necessarily creates a luma.gl `CanvasContext`. It defaults to
`'external-canvas'` with the attached canvas as `drawingBufferSizeSource`. Because source and target
are the same object, luma.gl reads externally owned dimensions but never writes them. Explicit
`canvasContextProps` override this default.

## Compatibility and precedence

If any new drawing-buffer property is supplied, the new properties are authoritative and the
three legacy sizing properties are ignored. Supplying `pixelRatio` or `drawingBufferSizeSource`
requires an explicit compatible `drawingBufferSizeTracking` value.

When the new properties are absent, legacy properties normalize as follows:

| Legacy configuration | Normalized behavior |
| --- | --- |
| `autoResize: false` | `drawingBufferSizeTracking: 'none'` |
| `useDevicePixels: false` | `'canvas'` tracking with `pixelRatio: 1` |
| `useDevicePixels: number` | `'canvas'` tracking with that fixed ratio |
| `useDevicePixels: true`, `pixelSizeSource: 'exact'` | `'canvas'` tracking using exact physical size |
| `useDevicePixels: true`, `pixelSizeSource: 'css-dpr'` | `'canvas'` compatibility path using content-box × live browser DPR |

The legacy CSS-DPR algorithm is intentionally not a separate value in the fresh API. Its primary
integration use case—matching another renderer's backing store—is represented more directly and
reliably by `'external-canvas'`. It remains available through legacy normalization while v9
compatibility is required.

Legacy `CanvasContext.setProps({useDevicePixels})` remains functional for contexts created with
legacy configuration. Once a context is configured with the new properties, later legacy sizing
updates are ignored.

## Migration

### Standalone canvas

```ts
// Before
{autoResize: true, useDevicePixels: 1}

// After
{drawingBufferSizeTracking: 'canvas', pixelRatio: 1}
```

### Externally sized attached context

```ts
// Before
{autoResize: false}

// After
{
  drawingBufferSizeTracking: 'external-canvas',
  drawingBufferSizeSource: gl.canvas
}
```

WebGL attachment supplies the latter configuration automatically.

### Overlay matching another canvas

```ts
// Before: reproduce the source renderer's sizing algorithm
{autoResize: true, useDevicePixels: true, pixelSizeSource: 'css-dpr'}

// After: use the source renderer's actual result
{
  drawingBufferSizeTracking: 'external-canvas',
  drawingBufferSizeSource: map.getCanvas()
}
```

## Deprecation

The following remain supported in v9 but are marked deprecated:

- `CanvasContextProps.autoResize`
- `CanvasContextProps.useDevicePixels`
- `CanvasContextProps.pixelSizeSource`
- The `CanvasContextProps` object form of `DeviceProps.createCanvasContext`

The proposed v10 API retains `createCanvasContext?: boolean`, adds
`canvasContextProps?: CanvasContextProps`, and removes the deprecated sizing properties.

## Alternatives considered

### Expose ResizeObserver algorithms as modes

Values such as `track-device-pixels` and `track-css-pixels` precisely describe implementation
choices but do not describe the integration the application is trying to implement. They also
leave overlay libraries responsible for reproducing an external renderer's algorithm.

### Use `track-none`, `track-canvas`, and `track-external-canvas`

The `track-` prefix makes the values readable in isolation, but repeats the word already present
in `drawingBufferSizeTracking`. The shorter values form complete phrases at the call site:
`drawingBufferSizeTracking: 'external-canvas'`.

### Add `drawingBufferSize`

A `[width, height]` property reads clearly next to `'none'`, but duplicates the existing
`setDrawingBufferSize(width, height)` imperative API and raises update/ownership questions. Manual
owners can set the canvas or call that method directly. This RFC keeps tracking policy separate
from one-time size mutation.

### Add a policy object

A discriminated policy object can encode every valid state statically, but adds nesting to the
common configuration path. The proposed flat tracking, source, and optional ratio remain explicit
without requiring another object.

## Proof of concept

The accompanying implementation:

- implements `none`, target-canvas, and external-canvas drawing-buffer tracking;
- checks an external canvas's backing-store dimensions at size-query and render boundaries;
- retains legacy exact and CSS-DPR algorithms through normalization;
- supports dynamic tracking, source, and ratio updates;
- reconfigures active resize observation when the target sizing algorithm changes;
- adds `DeviceProps.canvasContextProps`;
- defaults attached WebGL contexts to read-only self-tracking; and
- exercises new, legacy, dynamic, and attachment behavior in tests.

The proof of concept intentionally leaves stable API documentation and release notes unchanged
until the proposal is accepted.

## Open questions

- Should `drawingBufferSizeSource` accept only a canvas, or a smaller structural
  `{width: number; height: number}` source?
- Should `'none'` stop exact-device-pixel observation entirely, or retain current device-pixel
  bookkeeping and callbacks as the PoC does?
- Is the compatibility-only legacy CSS-DPR path sufficient for v9, given that new overlay
  integrations can track the external backing store directly?
