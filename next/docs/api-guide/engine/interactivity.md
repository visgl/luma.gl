# Interactivity

## Event Management[​](#event-management "Direct link to Event Management")

`@luma.gl/engine` provides focused interaction helpers for common rendering workflows while leaving application-wide event routing to the browser or an application framework. For more general event and gesture recognition, the companion [mjolnir.js](https://uber-web.github.io/mjolnir.js/) framework also supports portable touch gestures.

## Orbit Camera Controls[​](#orbit-camera-controls "Direct link to Orbit Camera Controls")

[`OrbitControls`](https://luma.gl/next/docs/api-reference/engine/orbit-controls.md) attaches pointer-driven orbiting and wheel zoom to an HTML canvas. Configure the initial target, angle, distance, and camera limits, then update the controller before reading its camera position each frame:

```
import {OrbitControls} from '@luma.gl/engine';



const controls = new OrbitControls(canvas, {

  target: [0, 0, 0],

  distance: 12,

  minDistance: 3,

  maxDistance: 30,

  autoRotate: true

});



function renderFrame(timeMilliseconds: number) {

  controls.update(timeMilliseconds);

  const eyePosition = controls.getEyePosition();

  // Build the view matrix from eyePosition and controls.props.target.

}



// Release pointer listeners and restore canvas interaction styles when finished.

controls.destroy();
```

The controller is independent of the selected GPU backend and works with both WebGPU and WebGL2 applications.

## Picking and Highlighting[​](#picking-and-highlighting "Direct link to Picking and Highlighting")

Allowing he user to picking object from the screen is a key capability for most interactive applications. It is also often desirable to be able to highlight specific objects.

For the engine-level workflow, see [`PickingManager`](https://luma.gl/next/docs/api-reference/engine/picking-manager.md).

### About GPU picking[​](#about-gpu-picking "Direct link to About GPU picking")

GPU based picking has a couple of significant advantage over CPU-based picking:

* GPU-based picking is a picking technique that can be performed entirely on the GPU, meaning that it is very performant, especially when picking is done every frame.

* can be added to any existing shaders

* and is independent of the structure of the input geometry or rendering without requiring any additional picking logic to that shader, beyond calling one function in the vertex shader and one function in the fragment shader.

Note that GPU-based picking does comes with some limitations:

* Picking occluding objects require re-rendering and discarding the already picked objects.
* On WebGL-specific: the read back of the picking data from the picking texture can only be done synchronously, causing a GPU pipeline stall, which can defeat some of the performance advantages.

In luma.gl engine, GPU picking is typically managed by `PickingManager`:

* `mode: 'color'` is the default.
* `mode: 'auto'` prefers index picking when supported and otherwise falls back to color picking.
* WebGL can only use index picking on devices that support renderable `rg32sint` textures.

### About CPU picking[​](#about-cpu-picking "Direct link to About CPU picking")

Traditional 3d frameworks often support CPU-based picking, perhaps using a JavaScript `Ray` class that can be intersected with a standard JavaScript-format geometry.

CPU based picking techniques do have advantages:

* They can often provide precise intersection points on objects and they are better at handling picking of multiple objects, especially for objects that are occluded.
* However, CPU based picking techniques are slower and can require more data on the CPU or they may need to be customized to the structure of the input data.

Note that while CPU based picking support could be added to luma.gl, luma does not currently include an CPU-based picking algorithms.
