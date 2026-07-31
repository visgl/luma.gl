# @luma.gl/anari-js

An experimental, ANARI-inspired declarative rendering interface implemented on top of luma.gl.

Applications describe cameras, worlds, groups, instances, surfaces, geometry, materials, lights,
renderers, and frames. The luma.gl-backed device compiles that retained scene into GPU-instanced
models, physically based shaders, portable WebGL/WebGPU render passes, optional bloom, and HDR
presentation when the WebGPU canvas is configured for extended dynamic range.

```ts
import {ANARIDevice} from '@luma.gl/anari-js';

const anari = new ANARIDevice(lumaDevice);
const geometry = anari.newGeometry('sphere', {radius: 1});
const material = anari.newMaterial('physicallyBased', {
  baseColor: [0.18, 0.52, 0.96],
  metallic: 0.75,
  roughness: 0.22
});
const surface = anari.newSurface({geometry, material});
const group = anari.newGroup({surface: [surface]});
const instance = anari.newInstance({group, transform: modelMatrix});
const world = anari.newWorld({instance: [instance], light: [directionalLight]});
const camera = anari.newCamera('perspective', {position: [0, 2, 8]});
const renderer = anari.newRenderer('default', {bloomIntensity: 0.65});
const frame = anari.newFrame({world, camera, renderer});

frame.render();
```

Parameter changes become visible after `commitParameters()`:

```ts
material.setParameter('roughness', 0.08).commitParameters();
camera.setParameters({position: [4, 2, 7], direction: [-4, -2, -7]}).commitParameters();
frame.render();
```

Implemented geometry subtypes are `triangle`, `sphere`, `cylinder`, `cone`, and `quad`.
Implemented materials are `matte` and `physicallyBased`. Renderer subtypes are `default`,
`debugNormals`, and `debugDepth`.

This package is a proof of concept inspired by the ANARI object model. It is not an ANARI C API
binding and does not claim Khronos conformance.

The interactive showcase lives at `examples/showcase/anari`. Run it with
`yarn workspace luma.gl-examples-showcase-anari start`; add `?backend=webgl` to force the WebGL2
fallback instead of automatically selecting WebGPU. HDR-capable displays automatically use an
`rgba16float`, Display P3, extended-tone-mapping WebGPU presentation surface.
