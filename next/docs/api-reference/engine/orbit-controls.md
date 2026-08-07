# OrbitControls

`OrbitControls` adds pointer-driven orbiting, wheel zoom, optional automatic rotation, and configurable camera bounds to an HTML canvas. The controls maintain a camera position around a target without depending on a specific renderer, scene graph, or GPU backend.

## Usage[​](#usage "Direct link to Usage")

```
import {OrbitControls} from '@luma.gl/engine';

import {Matrix4} from '@math.gl/core';



const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

const controls = new OrbitControls(canvas, {

  target: [0, 1, 0],

  distance: 8,

  minDistance: 2,

  maxDistance: 24,

  pitch: 0.35,

  autoRotate: true,

  autoRotateSpeed: 0.2

});

const viewMatrix = new Matrix4();



function render(timeMilliseconds: number): void {

  controls.update(timeMilliseconds);



  viewMatrix.lookAt({

    eye: controls.getEyePosition(),

    center: controls.props.target,

    up: [0, 1, 0]

  });



  // Use viewMatrix to draw the current animation frame.

  requestAnimationFrame(render);

}



requestAnimationFrame(render);
```

Call `controls.destroy()` when the canvas or its owning application is removed.

## Types[​](#types "Direct link to Types")

### `OrbitPosition`[​](#orbitposition "Direct link to orbitposition")

```
type OrbitPosition = [number, number, number];
```

A three-component world-space position. `OrbitControls` copies configured targets, so mutating the original target array does not move the orbit center.

### `OrbitControlsProps`[​](#orbitcontrolsprops "Direct link to orbitcontrolsprops")

```
type OrbitControlsProps = {

  target?: Readonly<OrbitPosition>;

  distance?: number;

  yaw?: number;

  pitch?: number;

  minDistance?: number;

  maxDistance?: number;

  minPitch?: number;

  maxPitch?: number;

  rotateSpeed?: number;

  pitchSpeed?: number;

  zoomSpeed?: number;

  autoRotate?: boolean;

  autoRotateSpeed?: number;

  onInteractionStart?: () => void;

};
```

| Property             | Default               | Description                                                                                           |
| -------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `target`             | `[0, 0, 0]`           | World-space point around which the camera rotates.                                                    |
| `distance`           | `10`                  | Initial distance from the orbit target, in world-space units.                                         |
| `yaw`                | `0`                   | Initial horizontal orbit angle in radians.                                                            |
| `pitch`              | `0.25`                | Initial vertical orbit angle in radians.                                                              |
| `minDistance`        | `1`                   | Minimum distance from the target.                                                                     |
| `maxDistance`        | `100`                 | Maximum distance from the target.                                                                     |
| `minPitch`           | `-Math.PI / 2 + 0.01` | Lowest allowed pitch angle in radians.                                                                |
| `maxPitch`           | `Math.PI / 2 - 0.01`  | Highest allowed pitch angle in radians.                                                               |
| `rotateSpeed`        | `0.006`               | Horizontal rotation applied per CSS pixel of pointer movement, in radians.                            |
| `pitchSpeed`         | `rotateSpeed`         | Optional vertical rotation applied per CSS pixel. Negative values invert the vertical drag direction. |
| `zoomSpeed`          | `0.001`               | Exponential wheel-zoom sensitivity.                                                                   |
| `autoRotate`         | `false`               | Whether `update()` automatically advances the horizontal angle.                                       |
| `autoRotateSpeed`    | `0.1`                 | Automatic horizontal rotation speed in radians per second.                                            |
| `onInteractionStart` | `undefined`           | Optional callback invoked when a primary-button drag or wheel interaction begins.                     |

## Properties[​](#properties "Direct link to Properties")

### `canvas: HTMLCanvasElement`[​](#canvas-htmlcanvaselement "Direct link to canvas-htmlcanvaselement")

The canvas receiving pointer and wheel events.

### `props`[​](#props "Direct link to props")

The resolved orbit configuration. Defaults are filled in when controls are created. Read `props.target` when constructing a camera view matrix; call `setProps()` to update configuration and apply new camera values consistently.

### `yaw: number`[​](#yaw-number "Direct link to yaw-number")

Current horizontal orbit angle in radians. Applications can read or adjust this value directly between frames.

### `pitch: number`[​](#pitch-number "Direct link to pitch-number")

Current vertical orbit angle in radians. Pointer interaction and `setProps()` clamp this value between `minPitch` and `maxPitch`.

### `distance: number`[​](#distance-number "Direct link to distance-number")

Current world-space distance from the target. Wheel interaction and `setProps()` clamp this value between `minDistance` and `maxDistance`.

## Methods[​](#methods "Direct link to Methods")

### `constructor(canvas: HTMLCanvasElement, props?: OrbitControlsProps)`[​](#constructorcanvas-htmlcanvaselement-props-orbitcontrolsprops "Direct link to constructorcanvas-htmlcanvaselement-props-orbitcontrolsprops")

Creates controls for `canvas`, attaches pointer and wheel listeners, clamps the initial pitch and distance, and sets the canvas cursor and `touch-action` style for orbit gestures.

`canvas` must be a real HTML canvas or an equivalent object implementing DOM pointer-event methods. An `OffscreenCanvas` does not provide the necessary interaction APIs.

### `update(timeMilliseconds: number): void`[​](#updatetimemilliseconds-number-void "Direct link to updatetimemilliseconds-number-void")

Advances automatic rotation using an absolute animation-frame timestamp in **milliseconds**. Call once per frame before reading `getEyePosition()`.

* The first call records the initial timestamp without changing the angle.
* Automatic rotation is paused while the primary pointer is dragging.
* Rotation resumes from the manually adjusted angle after the pointer is released.
* Elapsed time is clamped to 100 milliseconds to avoid large camera jumps after an inactive tab or stalled frame.
* Backward timestamps do not reverse the orbit.

```
function onAnimationFrame(timeMilliseconds: number): void {

  controls.update(timeMilliseconds);

  const cameraPosition = controls.getEyePosition();



  drawFrame(cameraPosition);

}
```

### `getEyePosition(): OrbitPosition`[​](#geteyeposition-orbitposition "Direct link to geteyeposition-orbitposition")

Returns the current world-space camera position computed from `target`, `yaw`, `pitch`, and `distance`.

At `yaw: 0` and `pitch: 0`, the camera is positioned on the positive Z side of its target. Positive pitch moves the camera upward.

### `setProps(props: OrbitControlsProps): void`[​](#setpropsprops-orbitcontrolsprops-void "Direct link to setpropsprops-orbitcontrolsprops-void")

Updates the orbit configuration without replacing the controls or reattaching event listeners.

Specified camera values are applied immediately. If pitch or distance limits change, existing values are clamped to the new limits. An updated target is copied rather than retained by reference.

```
controls.setProps({

  target: sceneBounds.center,

  distance: sceneBounds.radius * 2,

  minDistance: sceneBounds.radius * 0.25,

  maxDistance: sceneBounds.radius * 8

});
```

Changing `yaw`, `pitch`, or `distance` through `setProps()` also updates the configured camera pose used by `reset()`.

### `setAutoRotate(autoRotate: boolean): void`[​](#setautorotateautorotate-boolean-void "Direct link to setautorotateautorotate-boolean-void")

Enables or disables automatic rotation without resetting the current angle.

```
controls.setAutoRotate(false);
```

### `reset(): void`[​](#reset-void "Direct link to reset-void")

Restores the configured yaw, pitch, and distance. The restored pitch and distance respect the current configured bounds.

### `destroy(): void`[​](#destroy-void "Direct link to destroy-void")

Removes all pointer and wheel listeners, releases active pointer capture, and restores the canvas cursor and `touch-action` styles that existed before construction.

## Interaction behavior[​](#interaction-behavior "Direct link to Interaction behavior")

* Drag with the primary mouse button or an equivalent touch/pen pointer to orbit the target.
* Scroll the wheel to zoom. Wheel deltas are bounded before applying exponential zoom so large trackpad or mouse events cannot produce an excessive distance jump.
* Pointer capture keeps a drag associated with its original pointer even when the pointer moves outside the canvas.
* `pointercancel` ends an active drag and releases pointer capture.
* The controls compute camera coordinates only; rendering, camera projection, matrix updates, and redraw scheduling remain the application's responsibility.
* `@luma.gl/experimental` continues to re-export `OrbitControls` for compatibility, but new applications should import the class and its types from `@luma.gl/engine`.
