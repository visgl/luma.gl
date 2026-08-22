import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';
import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';
import {DocumentationContract} from '@site/src/components/docs/foundation-docs';

# AnimationLoop

<EngineDocsTabs group="animation" active="animation-loop" />

`AnimationLoop` manages a render loop around a luma.gl [`Device`](/docs/api-reference/core/device).
It resolves the device, tracks frame timing, builds [`AnimationProps`](#animationprops), and invokes application callbacks for initialization, per-frame rendering, and teardown.

Unlike older luma.gl APIs, the current `AnimationLoop` does not take a raw WebGL context. It operates on a `Device` or `Promise<Device>`.

<DocumentationContract title="AnimationLoop" rows={[
  {label: 'Role', value: 'Resolve the device and coordinate initialization, frames, timing, resize, and finalization'},
  {label: 'Construction', value: 'Device or device promise plus lifecycle callbacks'},
  {label: 'Updates', value: 'Start, stop, or request work through the application redraw policy'},
  {label: 'Ownership', value: 'Finalizes loop state; application callbacks destroy the resources they create'},
  {label: 'Portability', value: 'Runs over Core devices rather than raw backend contexts'},
  {label: 'Performance', value: 'Prefer invalidation-driven frames when nothing is animated'}
]} />

:::warning Common mistake
An animation loop does not require continuous drawing. If the scene is static, submit a new frame only
for interaction, animation, resize, asynchronous results, or another visible state change.
:::

## Usage

```typescript
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {AnimationLoop} from '@luma.gl/engine';

const animationLoop = new AnimationLoop({
  device: luma.createDevice({
    adapters: [webgl2Adapter],
    createCanvasContext: true
  }),

  async onInitialize({device}) {
    // Create GPU resources here.
  },

  onRender({device, canvasContext}) {
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const renderPass = device.beginRenderPass({framebuffer, clearColor: [0, 0, 0, 1]});
    // Draw application models here.
    renderPass.end();
  },

  onFinalize() {
    // Destroy application-owned resources here.
  }
});

await animationLoop.start();
```

## Types

### `AnimationLoopProps`

```ts
export type AnimationLoopProps = {
  device: Device | Promise<Device>;
  onAddHTML?: (div: HTMLDivElement) => string;
  onInitialize?: (animationProps: AnimationProps) => Promise<unknown>;
  onRender?: (animationProps: AnimationProps) => unknown;
  onFinalize?: (animationProps: AnimationProps) => void;
  onError?: (reason: Error) => void;
  errorDisplay?: false | CanvasErrorDisplayProps;
  stats?: Stats;
  autoResizeViewport?: boolean;
  animationFrameProvider?: AnimationFrameProvider;
};
```

- `device` is required and may be supplied lazily as a promise.
- `autoResizeViewport` resizes the default canvas context drawing buffer before rendering.
- `errorDisplay` defaults to an accessible overlay on the resolved HTML canvas. Set it to `false`
  to keep errors callback/console-only, or provide a `target` canvas, container, or DOM id so device
  promise failures are visible before a device exists.

Device creation, initialization, rendering, and unexpected device loss flow through
`reportError()`. Fatal errors stop frame scheduling, call the animation loop's `onError`, and remain
visible on the canvas. Runtime errors reported by `device.reportError()` (including validation,
resource, and uncaptured GPU errors) keep the loop running and briefly appear as red fading text.
Supplying `DeviceProps.onError` gives the application control of those runtime errors and suppresses
the transient canvas message. Intentional destruction and failed attempts followed by successful
fallback do not show either display.

### `AnimationProps`

The callbacks `onInitialize`, `onRender`, and `onFinalize` receive an `AnimationProps` object.
Important fields include:

| Property | Type | Description |
| --- | --- | --- |
| `animationLoop` | `AnimationLoop` | The active animation loop. |
| `device` | `Device` | Resolved device. |
| `canvasContext` | `CanvasContext` | Default canvas context. |
| `canvas` | `HTMLCanvasElement \| OffscreenCanvas` | Default canvas. |
| `width`, `height`, `aspect` | `number` | Current drawing-buffer size and aspect ratio. |
| `time`, `startTime`, `engineTime` | `number` | Time information in milliseconds. |
| `tick`, `tock` | `number` | Frame counters. |
| `needsRedraw` | `false \| string` | Last redraw reason, if any. |
| `timeline` | `Timeline \| null` | Attached timeline, if any. |
| `animationFrame` | `unknown \| null` | Experimental frame payload from a custom animation frame provider. |
| `_mousePosition` | `[number, number] \| null` | Experimental mouse position. |

## Properties

### `device: Device | null`

Resolved device after initialization.

### `canvas: HTMLCanvasElement | OffscreenCanvas | null`

Default canvas from the device's canvas context.

### `animationProps: AnimationProps | null`

The most recently generated animation props object.

### `timeline: Timeline | null`

Attached timeline, if any.

### `stats`, `sharedStats`, `cpuTime`, `gpuTime`, `frameRate`

Probe.gl stats objects used to track frame timing.

## Methods

### `constructor(props: AnimationLoopProps)`

Creates a new animation loop.

### `destroy(): void`

Stops the loop, removes internal event handling, and disables debug GPU timing on the device if it had been enabled.

### `delete(): void`

Deprecated alias for `destroy()`.

### `reportError(error: Error): void`

Calls `onError` and stores the error internally to prevent repeated rendering.

### `setProps(props: {autoResizeViewport?: boolean; animationFrameProvider?: AnimationFrameProvider}): this`

Updates mutable loop settings.

### `setNeedsRedraw(reason: string): this`

Marks the loop as needing redraw.

### `needsRedraw(): false | string`

Returns the last redraw reason and clears the internal redraw flag.

### `start(): Promise<AnimationLoop>`

Initializes the device if needed, calls `onInitialize`, and starts requesting animation frames.

### `stop(): this`

Stops the loop and calls `onFinalize` if initialization completed successfully.

### `redraw(time?: number, animationFrame?: unknown | null): this`

Runs a single frame immediately without waiting for `requestAnimationFrame`.

### `attachTimeline(timeline: Timeline): Timeline`

Attaches a timeline that will be advanced automatically every frame.

### `detachTimeline(): void`

Detaches the current timeline.

### `waitForRender(): Promise<AnimationLoop>`

Marks the loop dirty and resolves after the next frame finishes.

### `toDataURL(): Promise<string>`

Triggers a redraw and returns the current HTML canvas as a data URL.

## Remarks

- `AnimationLoop` expects the application to create and destroy its own GPU resources in `onInitialize` and `onFinalize`.
- If you prefer a class-based lifecycle, use [`AnimationLoopTemplate`](/docs/api-reference/engine/animation-loop-template) together with `makeAnimationLoop()`.

## Experimental Frame Provider

<DocumentationBadges>
  <DocumentationBadge tone="version">From v9.4</DocumentationBadge>
  <DocumentationBadge tone="experimental">Experimental API</DocumentationBadge>
</DocumentationBadges>

`AnimationLoop` accepts an experimental `animationFrameProvider` for schedulers that carry a per-frame payload. During those frames, `AnimationProps.animationFrame` contains the provider payload; it is `null` for ordinary browser frames.

```typescript
const animationFrameProvider = {
  requestAnimationFrame(callback) {
    return customScheduler.requestAnimationFrame((time, frame) => callback(time, frame));
  },
  cancelAnimationFrame(animationFrameId) {
    customScheduler.cancelAnimationFrame(animationFrameId);
  }
};

const animationLoop = new AnimationLoop({
  device,
  animationFrameProvider,
  onRender({animationFrame}) {
    // Inspect provider-specific frame state here.
  }
});
```
