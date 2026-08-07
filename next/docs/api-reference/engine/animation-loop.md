# AnimationLoop

[Guide](https://luma.gl/next/docs/api-guide/engine/animation.md)[Mixer](https://luma.gl/next/docs/api-reference/engine/animation/animation-mixer.md)[Morph Targets](https://luma.gl/next/docs/api-reference/engine/animation/morph-targets.md)[AnimationLoop](https://luma.gl/next/docs/api-reference/engine/animation-loop.md)[Template](https://luma.gl/next/docs/api-reference/engine/animation-loop-template.md)[KeyFrames](https://luma.gl/next/docs/api-reference/engine/animation/key-frames.md)[Timeline](https://luma.gl/next/docs/api-reference/engine/animation/timeline.md)

`AnimationLoop` manages a render loop around a luma.gl [`Device`](https://luma.gl/next/docs/api-reference/core/device.md). It resolves the device, tracks frame timing, builds [`AnimationProps`](#animationprops), and invokes application callbacks for initialization, per-frame rendering, and teardown.

Unlike older luma.gl APIs, the current `AnimationLoop` does not take a raw WebGL context. It operates on a `Device` or `Promise<Device>`.

## Usage[​](#usage "Direct link to Usage")

```
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

## Types[​](#types "Direct link to Types")

### `AnimationLoopProps`[​](#animationloopprops "Direct link to animationloopprops")

```
export type AnimationLoopProps = {

  device: Device | Promise<Device>;

  onAddHTML?: (div: HTMLDivElement) => string;

  onInitialize?: (animationProps: AnimationProps) => Promise<unknown>;

  onRender?: (animationProps: AnimationProps) => unknown;

  onFinalize?: (animationProps: AnimationProps) => void;

  onError?: (reason: Error) => void;

  stats?: Stats;

  autoResizeViewport?: boolean;

  animationFrameProvider?: AnimationFrameProvider;

};
```

* `device` is required and may be supplied lazily as a promise.
* `autoResizeViewport` resizes the default canvas context drawing buffer before rendering.

### `AnimationProps`[​](#animationprops "Direct link to animationprops")

The callbacks `onInitialize`, `onRender`, and `onFinalize` receive an `AnimationProps` object. Important fields include:

| Property                          | Type                                   | Description                                                        |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------------ |
| `animationLoop`                   | `AnimationLoop`                        | The active animation loop.                                         |
| `device`                          | `Device`                               | Resolved device.                                                   |
| `canvasContext`                   | `CanvasContext`                        | Default canvas context.                                            |
| `canvas`                          | `HTMLCanvasElement \| OffscreenCanvas` | Default canvas.                                                    |
| `width`, `height`, `aspect`       | `number`                               | Current drawing-buffer size and aspect ratio.                      |
| `time`, `startTime`, `engineTime` | `number`                               | Time information in milliseconds.                                  |
| `tick`, `tock`                    | `number`                               | Frame counters.                                                    |
| `needsRedraw`                     | `false \| string`                      | Last redraw reason, if any.                                        |
| `timeline`                        | `Timeline \| null`                     | Attached timeline, if any.                                         |
| `animationFrame`                  | `unknown \| null`                      | Experimental frame payload from a custom animation frame provider. |
| `_mousePosition`                  | `[number, number] \| null`             | Experimental mouse position.                                       |

## Properties[​](#properties "Direct link to Properties")

### `device: Device | null`[​](#device-device--null "Direct link to device-device--null")

Resolved device after initialization.

### `canvas: HTMLCanvasElement | OffscreenCanvas | null`[​](#canvas-htmlcanvaselement--offscreencanvas--null "Direct link to canvas-htmlcanvaselement--offscreencanvas--null")

Default canvas from the device's canvas context.

### `animationProps: AnimationProps | null`[​](#animationprops-animationprops--null "Direct link to animationprops-animationprops--null")

The most recently generated animation props object.

### `timeline: Timeline | null`[​](#timeline-timeline--null "Direct link to timeline-timeline--null")

Attached timeline, if any.

### `stats`, `sharedStats`, `cpuTime`, `gpuTime`, `frameRate`[​](#stats-sharedstats-cputime-gputime-framerate "Direct link to stats-sharedstats-cputime-gputime-framerate")

Probe.gl stats objects used to track frame timing.

## Methods[​](#methods "Direct link to Methods")

### `constructor(props: AnimationLoopProps)`[​](#constructorprops-animationloopprops "Direct link to constructorprops-animationloopprops")

Creates a new animation loop.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Stops the loop, removes internal event handling, and disables debug GPU timing on the device if it had been enabled.

### `delete(): void`[​](#delete-void "Direct link to delete-void")

Deprecated alias for `destroy()`.

### `reportError(error: Error): void`[​](#reporterrorerror-error-void "Direct link to reporterrorerror-error-void")

Calls `onError` and stores the error internally to prevent repeated rendering.

### `setProps(props: {autoResizeViewport?: boolean; animationFrameProvider?: AnimationFrameProvider}): this`[​](#setpropsprops-autoresizeviewport-boolean-animationframeprovider-animationframeprovider-this "Direct link to setpropsprops-autoresizeviewport-boolean-animationframeprovider-animationframeprovider-this")

Updates mutable loop settings.

### `setNeedsRedraw(reason: string): this`[​](#setneedsredrawreason-string-this "Direct link to setneedsredrawreason-string-this")

Marks the loop as needing redraw.

### `needsRedraw(): false | string`[​](#needsredraw-false--string "Direct link to needsredraw-false--string")

Returns the last redraw reason and clears the internal redraw flag.

### `start(): Promise<AnimationLoop>`[​](#start-promiseanimationloop "Direct link to start-promiseanimationloop")

Initializes the device if needed, calls `onInitialize`, and starts requesting animation frames.

### `stop(): this`[​](#stop-this "Direct link to stop-this")

Stops the loop and calls `onFinalize` if initialization completed successfully.

### `redraw(time?: number, animationFrame?: unknown | null): this`[​](#redrawtime-number-animationframe-unknown--null-this "Direct link to redrawtime-number-animationframe-unknown--null-this")

Runs a single frame immediately without waiting for `requestAnimationFrame`.

### `attachTimeline(timeline: Timeline): Timeline`[​](#attachtimelinetimeline-timeline-timeline "Direct link to attachtimelinetimeline-timeline-timeline")

Attaches a timeline that will be advanced automatically every frame.

### `detachTimeline(): void`[​](#detachtimeline-void "Direct link to detachtimeline-void")

Detaches the current timeline.

### `waitForRender(): Promise<AnimationLoop>`[​](#waitforrender-promiseanimationloop "Direct link to waitforrender-promiseanimationloop")

Marks the loop dirty and resolves after the next frame finishes.

### `toDataURL(): Promise<string>`[​](#todataurl-promisestring "Direct link to todataurl-promisestring")

Triggers a redraw and returns the current HTML canvas as a data URL.

## Remarks[​](#remarks "Direct link to Remarks")

* `AnimationLoop` expects the application to create and destroy its own GPU resources in `onInitialize` and `onFinalize`.
* If you prefer a class-based lifecycle, use [`AnimationLoopTemplate`](https://luma.gl/next/docs/api-reference/engine/animation-loop-template.md) together with `makeAnimationLoop()`.

## Experimental Frame Provider[​](#experimental-frame-provider "Direct link to Experimental Frame Provider")

![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)![Status: Work-In-Progress](https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square)

`AnimationLoop` accepts an experimental `animationFrameProvider` for schedulers that carry a per-frame payload. During those frames, `AnimationProps.animationFrame` contains the provider payload; it is `null` for ordinary browser frames.

```
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
