# Animated crowds and levels of detail

Render independently animated characters with shared GPU geometry and select mesh detail by projected screen size.

### glTF Asset Studio

Physical materials · animated characters · standards-native glTF

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/gltf/asset-studio)Info

InfoSource

Mobile quality

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

`createGLTFAnimatedCrowd()` creates a fixed-capacity crowd. `addActors()` supplies independent clip and playback state; `update()` accepts delta seconds and, for LOD, camera and viewport data. `draw(renderPass)` submits one instanced draw per occupied compatible primitive/detail bucket. The application supplies camera, projection, lighting, and device submission.

Enable `lod` to select levels by screen coverage. `autoGenerate` can derive index-only levels when authored levels are absent. Inspect `lodStats` for level occupancy and submitted work.

```
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';



const crowd = createGLTFAnimatedCrowd(device, gltf, {

  capacity: 100,

  lod: {enabled: true, autoGenerate: true, ratios: [0.5, 0.25]}

});

crowd.addActors([{id: 'first'}, {id: 'second', speed: 1.5, phase: 0.35}]);



// Per frame, after configuring projection and lighting on crowd.models:

crowd.update(deltaSeconds, {

  viewMatrix,

  projectionMatrix,

  viewportWidth: canvas.width,

  viewportHeight: canvas.height

});

crowd.draw(renderPass);

console.table(crowd.lodStats.levels);

// When the crowd is no longer used:

// crowd.destroy();
```

## glTF support[​](#gltf-support "Direct link to glTF support")

Skeletal and morph animation are core glTF capabilities. `MSFT_lod` and `MSFT_screencoverage` supply authored node levels and coverage thresholds. Authored levels take precedence over generated levels. The studio starts with RobotExpressive. Choose Simple Skin LOD for authored levels, increase the actor count, and enable Auto LOD to explore them.

Material-level LOD, GPU-driven selection, and progressive streaming are not implemented. See [crowd usage](https://luma.gl/docs/api-reference/gltf/gltf-crowd-usage.md) and [performance and LOD](https://luma.gl/docs/api-reference/gltf/gltf-crowd-performance.md).

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
