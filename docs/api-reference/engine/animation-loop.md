# AnimationLoop

`AnimationLoop` manages a render loop around a luma.gl [`Device`](/docs/api-reference/core/device).
It resolves the device, tracks frame timing, builds [`AnimationProps`](#animationprops), and invokes application callbacks for initialization, per-frame rendering, and teardown.

Unlike older luma.gl APIs, the current `AnimationLoop` does not take a raw WebGL context. It operates on a `Device` or `Promise<Device>`.

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
  stats?: Stats;
  autoResizeViewport?: boolean;
};
```

- `device` is required and may be supplied lazily as a promise.
- `autoResizeViewport` resizes the default canvas context drawing buffer before rendering.

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

### `setProps(props: {autoResizeViewport?: boolean}): this`

Updates mutable loop settings.

### `setNeedsRedraw(reason: string): this`

Marks the loop as needing redraw.

### `needsRedraw(): false | string`

Returns the last redraw reason and clears the internal redraw flag.

### `start(): Promise<AnimationLoop>`

Initializes the device if needed, calls `onInitialize`, and starts requesting animation frames.

### `stop(): this`

Stops the loop and calls `onFinalize` if initialization completed successfully.

### `redraw(time?: number): this`

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
