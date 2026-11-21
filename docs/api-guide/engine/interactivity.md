# Interaction, picking, and highlighting

[Workflow](https://luma.gl/docs/api-guide/engine/interactivity.md)[OrbitControls](https://luma.gl/docs/api-reference/engine/orbit-controls.md)[PickingManager](https://luma.gl/docs/api-reference/engine/picking-manager.md)

## Outcome[​](#outcome "Direct link to Outcome")

Interactive rendering has three distinct steps:

1. **Route input** from pointer, wheel, touch, or keyboard events.
2. **Interpret input** as a camera change or a picking request.
3. **Render feedback** by updating ordinary application or shader state.

Keeping those steps separate prevents controls, picking, and highlighting from becoming one backend-specific event handler.

## Mental model[​](#mental-model "Direct link to Mental model")

Engine provides focused helpers, not an application-wide event system:

* `OrbitControls` converts canvas pointer, pinch, two-finger pan, and wheel input into camera state.
* `PickingManager` renders object identity into an offscreen target and reads the identity at a requested pixel.
* Highlighting remains a normal render concern. Store the hovered or selected identity, pass it to the shader, and render that object differently.

Use browser events or an application framework to decide which canvas receives input. For more general gesture recognition, [mjolnir.js](https://uber-web.github.io/mjolnir.js/) supports portable touch and pointer gestures.

## Camera interaction[​](#camera-interaction "Direct link to Camera interaction")

`OrbitControls` attaches mouse, wheel, and touch orbit behavior to one HTML canvas. A single finger rotates the camera, two fingers pinch to zoom, and enabling panning lets two fingers move the orbit target. Update the controls before deriving the view matrix, then invalidate the view only when its state changes.

```
import {OrbitControls} from '@luma.gl/engine';



const controls = new OrbitControls(canvas, {

  target: [0, 0, 0],

  distance: 12,

  minDistance: 3,

  maxDistance: 30,

  enablePan: true

});



function updateCamera(timeMilliseconds: number): void {

  controls.update(timeMilliseconds);

  const eyePosition = controls.getEyePosition();

  // Build the view matrix from eyePosition and controls.props.target.

}



// Remove pointer listeners and restore canvas styles when finished.

controls.destroy();
```

The controller is independent of the graphics backend. The matrices derived from it can feed a WebGPU or WebGL 2 model.

## GPU picking workflow[​](#gpu-picking-workflow "Direct link to GPU picking workflow")

GPU picking reuses rendering to answer “which encoded object covers this pixel?”:

1. Assign a stable object or instance identity.
2. Render pickable geometry through the picking path.
3. Read the pixel under the pointer.
4. Decode the identity and publish it as hover or selection state.
5. Request a visible redraw that highlights the chosen identity.

[`PickingManager`](https://luma.gl/docs/api-reference/engine/picking-manager.md) supports two representations:

* `mode: 'color'` is the portable default.
* `mode: 'auto'` prefers integer index picking when the device supports a renderable `rg32sint` target and otherwise uses color picking.

The picked index should remain stable even if visible instances are compacted. If a renderer uses batch-local indices, carry the batch identity as well or translate back to a canonical application identity before publishing the result.

## Immediate highlighting[​](#immediate-highlighting "Direct link to Immediate highlighting")

Picking and highlighting need not use the same render pass. The picking pass discovers an identity; the visible fragment shader compares each object’s identity with the current hover or selection value.

```
let isHovered = objectIndex == uniforms.hoveredObjectIndex;

let highlight = select(vec3<f32>(1.0), vec3<f32>(1.18, 1.12, 0.82), isHovered);

fragmentColor = vec4<f32>(baseColor.rgb * highlight, baseColor.a);
```

This produces immediate feedback without rebuilding geometry or changing the picking target. For batched data, compare the canonical identity whenever possible rather than the transient visible-instance index.

## GPU versus CPU picking[​](#gpu-versus-cpu-picking "Direct link to GPU versus CPU picking")

| Approach                    | Strongest use                                                                    | Main cost or limitation                                                       |
| --------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GPU identity picking        | Frequent hover over already-rendered geometry; arbitrary shader-generated shapes | Requires a pick render/readback; deeper occluded hits need additional passes. |
| CPU ray or geometry picking | Precise intersection points, multiple hits, and geometry-aware tools             | Requires suitable CPU-side geometry or a CPU spatial index.                   |

WebGL 2 readback can synchronously stall the pipeline. WebGPU permits better staging, but hover still benefits from coalescing pointer movement and allowing only one readback in flight. luma.gl does not currently provide a general CPU ray-intersection system.

## Decisions and tradeoffs[​](#decisions-and-tradeoffs "Direct link to Decisions and tradeoffs")

* Pick on meaningful pointer changes, not every animation callback.
* Prefer immediate shader highlighting for hover; reserve geometry or material changes for persistent selection state.
* Keep page scrolling outside an embedded canvas until the user explicitly activates its controls.
* Use a rectangle or lasso selection tool to define a query region, then let the renderer or data layer decide how objects inside that region are selected.

## Common mistakes[​](#common-mistakes "Direct link to Common mistakes")

* Mixing browser event routing, pick execution, and UI publication into one large handler.
* Starting several asynchronous pick readbacks for successive pointer positions.
* Highlighting a compacted instance index that changes as the viewport changes.
* Treating a successful pick as permission to render continuously while the pointer is idle.
* Forgetting to destroy controls and picking resources when their canvas is unmounted.

## Related pages[​](#related-pages "Direct link to Related pages")

* [`OrbitControls`](https://luma.gl/docs/api-reference/engine/orbit-controls.md)
* [`PickingManager`](https://luma.gl/docs/api-reference/engine/picking-manager.md)
* [Redraw on demand](https://luma.gl/docs/api-guide/engine/redraw.md)
* [Shadertools picking module](https://luma.gl/docs/api-reference/shadertools/shader-modules/picking.md)
