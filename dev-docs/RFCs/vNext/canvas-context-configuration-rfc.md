# RFC: Explicit CanvasContext Drawing-Buffer Sizing

* **Date**: July 2026
* **Status**: Draft

## Summary

This RFC proposes fresh, non-overloaded `CanvasContext` properties:

```ts
export type DrawingBufferSizingMode =
  | 'manual'
  | 'track-device-pixels'
  | 'track-css-pixels';

export type CanvasContextProps = {
  drawingBufferSizingMode?: DrawingBufferSizingMode;
  trackCanvas?: HTMLCanvasElement | OffscreenCanvas | null;
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
`deviceProps.createCanvasContext` objects and narrow the boolean/object union to select legacy
CSS-DPR sizing. [deck.gl #10332](https://github.com/visgl/deck.gl/pull/10332) demonstrates the
branching required to interpret and forward `useDevicePixels: boolean | number`.

The proposed API directly represents the two canvas-integration behaviors used by deck.gl:

- **Interleaved:** attach to an externally owned context and canvas. The external renderer changes
  the drawing-buffer dimensions; luma.gl reads them but never writes them.
- **Overlaid:** render to a separate luma.gl canvas whose drawing-buffer dimensions mirror the
  basemap canvas.

The lower-level self-sizing properties remain useful for standalone canvases, but deck.gl no
longer needs to reproduce the basemap's CSS/DPR sizing algorithm to implement either integration.

## Proposal

### Track another canvas

`trackCanvas` makes another canvas's actual `width` and `height` authoritative:

```ts
await luma.createDevice({
  createCanvasContext: true,
  canvasContextProps: {
    canvas: overlayCanvas,
    trackCanvas: map.getCanvas()
  }
});
```

Before reporting or using the drawing-buffer size, luma.gl compares two integer properties from
the source canvas with its cached dimensions. It resizes the target only when they differ. This
does not read CSS layout, use `getBoundingClientRect()`, poll with a timer, or depend on observer
callback ordering.

When `trackCanvas` is supplied, `drawingBufferSizingMode` defaults to `'manual'`.
`trackCanvas` is incompatible with an automatic sizing mode or `pixelRatio`, because the tracked
canvas already supplies authoritative dimensions.

If the tracked canvas is the target canvas itself, luma.gl updates only its size bookkeeping. This
is the default behavior for an attached WebGL context: the external owner remains responsible for
resizing the shared canvas.

### Drawing-buffer sizing

`drawingBufferSizingMode` selects the resizing and observation behavior:

| Mode | ResizeObserver box | Drawing-buffer size |
| --- | --- | --- |
| `'manual'` | `device-pixel-content-box` | Never changed automatically |
| `'track-device-pixels'` | `device-pixel-content-box` | Exact reported physical size |
| `'track-css-pixels'` | `content-box` | CSS size × `pixelRatio ?? window.devicePixelRatio` |

The default is `'track-device-pixels'`, preserving current default behavior. If the browser does
not support `device-pixel-content-box`, luma.gl falls back to content-box dimensions multiplied by
the browser DPR.

`pixelRatio` is only valid with `'track-css-pixels'`. It must be finite and greater than zero.

```ts
// An external owner controls absolute drawing-buffer dimensions.
{drawingBufferSizingMode: 'manual'}

// Mirror another canvas's actual drawing-buffer dimensions.
{trackCanvas: map.getCanvas()}

// Track exact physical pixels using the newer ResizeObserver API.
{drawingBufferSizingMode: 'track-device-pixels'}

// Track CSS dimensions using the browser DPR.
{drawingBufferSizingMode: 'track-css-pixels'}

// Disable device-pixel scaling.
{drawingBufferSizingMode: 'track-css-pixels', pixelRatio: 1}

// Use a fixed pixel ratio while continuing to follow CSS resizes.
{drawingBufferSizingMode: 'track-css-pixels', pixelRatio: 1.5}
```

In manual mode, canvas size, position, visibility, and DPR observation continue. Resize callbacks
still run, but luma.gl does not call `setDrawingBufferSize()` automatically.

### Dynamic configuration

The new properties are mutable:

```ts
canvasContext.setProps({
  drawingBufferSizingMode: 'track-css-pixels',
  pixelRatio: 1.5
});
```

Changing between `track-css-pixels` and `track-device-pixels` re-registers the active
`ResizeObserver` with the corresponding box. Setting `pixelRatio: undefined` while in
`track-css-pixels` mode resumes browser DPR tracking. Changing to manual mode leaves the current
drawing-buffer size unchanged.

`trackCanvas` can be replaced dynamically. Clearing it leaves the context in manual mode and
preserves the current size; an application can supply an automatic sizing mode in the same update
to resume self-sizing:

```ts
canvasContext.setProps({
  trackCanvas: null,
  drawingBufferSizingMode: 'track-device-pixels'
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
    drawingBufferSizingMode: 'track-css-pixels'
  }
});
```

If the deprecated object form of `createCanvasContext` and `canvasContextProps` are both supplied,
they are shallow-merged and `canvasContextProps` wins.

Attaching an existing WebGL context necessarily creates a luma.gl `CanvasContext`. It defaults to
manual sizing and tracks the attached canvas itself because the creator of the WebGL context owns
its dimensions. `canvasContextProps` can explicitly override that default.

## Compatibility and precedence

If `trackCanvas` is supplied, it is authoritative and automatic sizing properties are rejected.
Otherwise, if `drawingBufferSizingMode` is supplied, the new sizing properties are authoritative
and the three legacy sizing properties are ignored. Supplying `pixelRatio` requires an explicit
`drawingBufferSizingMode: 'track-css-pixels'`.

When the new mode is absent, legacy properties normalize as follows:

| Legacy configuration | New equivalent |
| --- | --- |
| `autoResize: false` | `drawingBufferSizingMode: 'manual'` |
| `useDevicePixels: false` | `drawingBufferSizingMode: 'track-css-pixels', pixelRatio: 1` |
| `useDevicePixels: number` | `drawingBufferSizingMode: 'track-css-pixels', pixelRatio: number` |
| `useDevicePixels: true`, `pixelSizeSource: 'exact'` | `drawingBufferSizingMode: 'track-device-pixels'` |
| `useDevicePixels: true`, `pixelSizeSource: 'css-dpr'` | `drawingBufferSizingMode: 'track-css-pixels'` |

Legacy `CanvasContext.setProps({useDevicePixels})` remains functional for contexts created with
legacy configuration. Once a context is configured with the new properties, later legacy sizing
updates are ignored.

## Deprecation

The following remain supported in v9 but are marked deprecated:

- `CanvasContextProps.autoResize`
- `CanvasContextProps.useDevicePixels`
- `CanvasContextProps.pixelSizeSource`
- The `CanvasContextProps` object form of `DeviceProps.createCanvasContext`

The proposed v10 API retains `createCanvasContext?: boolean`, adds
`canvasContextProps?: CanvasContextProps`, and removes the deprecated sizing properties.

## Alternatives considered

### Keep `useDevicePixels: boolean | number`

This preserves the smallest API but continues to require runtime type checks throughout
applications and integration layers.

### Add a policy object

A discriminated policy object can encode every valid state statically, but adds nesting to the
common configuration path. The proposed flat mode and optional ratio remain explicit without
requiring another object.

### Use ResizeObserver box names as modes

Names such as `content-box` and `device-pixel-content-box` map directly to browser terminology,
but expose an implementation detail and become misleading when exact device-pixel observation is
unsupported. The proposed names describe the stable application-facing behavior: track device
pixels, track CSS pixels, or leave sizing under manual ownership.

### Keep `autoResize` as an independent switch

Ownership and sizing source are technically independent, but supporting every combination
recreates the current precedence problem. Manual sizing is instead a first-class mode.

## Proof of concept

The accompanying implementation:

- tracks another canvas's actual dimensions at size-query and render boundaries;
- normalizes legacy properties into the new sizing model;
- supports dynamic mode and ratio updates;
- reconfigures active resize observation;
- adds `DeviceProps.canvasContextProps`;
- defaults attached WebGL contexts to read-only self-tracking; and
- exercises new, legacy, dynamic, and attachment behavior in tests.

The proof of concept intentionally leaves stable API documentation and release notes unchanged
until the proposal is accepted.
