# @luma.gl/anari-js

An experimental, ANARI-inspired declarative rendering interface implemented on top of luma.gl.

Applications describe cameras, worlds, groups, instances, surfaces, geometry, materials, lights,
renderers, and frames. The luma.gl-backed device compiles that retained scene into GPU-instanced
models, physically based shaders, portable WebGL/WebGPU render passes, optional bloom, and HDR
presentation when the WebGPU canvas is configured for extended dynamic range.

## Installation

```bash
yarn add @luma.gl/anari-js @luma.gl/core @luma.gl/engine @luma.gl/effects @luma.gl/shadertools @luma.gl/webgpu
```

Add `@luma.gl/webgl` when your application also needs a WebGL 2 fallback.

## Quick start

The following example assumes the page contains a `<canvas></canvas>` element:

```ts
import {ANARIDevice} from '@luma.gl/anari-js';
import {luma} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/webgpu';
import {Matrix4} from '@math.gl/core';

const canvas = document.querySelector('canvas');

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Add a canvas element before starting the renderer');
}

const graphicsDevice = await luma.createDevice({
  adapters: [webgpuAdapter],
  createCanvasContext: {canvas}
});

const anari = new ANARIDevice(graphicsDevice);
const geometry = anari.newGeometry('sphere', {radius: 1});
const material = anari.newMaterial('physicallyBased', {
  baseColor: [0.18, 0.52, 0.96],
  metallic: 0.75,
  roughness: 0.22
});
const surface = anari.newSurface({geometry, material});
const group = anari.newGroup({surface: [surface]});
const instance = anari.newInstance({
  group,
  transform: new Matrix4().translate([0, 1, 0])
});
const directionalLight = anari.newLight('directional', {
  direction: [-1, -1, -0.5],
  irradiance: 2
});
const world = anari.newWorld({instance: [instance], light: [directionalLight]});
const camera = anari.newCamera('perspective', {
  position: [0, 2, 8],
  direction: [0, -1, -8]
});
const renderer = anari.newRenderer('default', {bloomIntensity: 0.65});
const frame = anari.newFrame({world, camera, renderer});

frame.render();
graphicsDevice.submit();
```

## Committed parameters

Parameter changes become visible after `commitParameters()`:

```ts
material.setParameter('roughness', 0.08).commitParameters();
camera.setParameters({position: [4, 2, 7], direction: [-4, -2, -7]}).commitParameters();
frame.render();
```

Object construction commits initial parameters automatically. Later updates are staged until the
changed object is committed.

## Supported objects

| Object | Subtypes |
| --- | --- |
| Geometry | `triangle`, `sphere`, `cylinder`, `cone`, `quad` |
| Material | `matte`, `physicallyBased` |
| Light | `ambient`, `directional`, `point`, `spot` |
| Camera | `perspective`, `orthographic` |
| Renderer | `default`, `debugNormals`, `debugDepth` |

The scene hierarchy also supports arrays, surfaces, groups, transform instances, worlds, and
frames. Reusing one surface across many instances normally produces one instanced draw.

## HDR presentation

On an HDR-capable display, request an extended-range WebGPU canvas:

```ts
const supportsHighDynamicRange = window.matchMedia('(dynamic-range: high)').matches;

const graphicsDevice = await luma.createDevice({
  adapters: [webgpuAdapter],
  createCanvasContext: supportsHighDynamicRange
    ? {
        canvas,
        colorFormat: 'rgba16float',
        colorSpace: 'display-p3',
        toneMapping: 'extended'
      }
    : {canvas}
});
```

The ANARI renderer automatically preserves over-white highlights when the device uses
`rgba16float`. WebGL 2 and ordinary displays retain standard-dynamic-range rendering.

## Documentation

- [ANARI developer guide](https://luma.gl/docs/api-guide/engine/anari-rendering)
- [Complete ANARI API reference](https://luma.gl/docs/api-reference/anari-js)
- [ANARI C API and THREE.js mapping](https://luma.gl/docs/api-reference/anari-js/anari-api-mapping)

The reference covers device and object lifecycles, arrays, geometry, materials, lights, scene
hierarchy, cameras, renderers, frames, supported parameters, defaults, and current limitations.

## Showcase

The interactive showcase lives at `examples/showcase/anari`. Run it with
`yarn workspace luma.gl-examples-showcase-anari start`; add `?backend=webgl` to force the WebGL2
fallback instead of automatically selecting WebGPU. HDR-capable displays automatically use an
`rgba16float`, Display P3, extended-tone-mapping WebGPU presentation surface.

## Status

This package is a proof of concept inspired by the ANARI object model. It is not an ANARI C API
binding and does not claim Khronos conformance.
