# @luma.gl/anari-js

`@luma.gl/anari-js` provides an experimental, ANARI-inspired retained rendering API on top of luma.gl. Applications describe **what** to render as cameras, worlds, surfaces, materials, lights, and frames. The implementation decides **how** to compile that description into portable WebGPU or WebGL rendering.

:::caution Experimental proof of concept
This package follows concepts from the ANARI object model, but it is not an ANARI C binding, does not implement the full ANARI specification, and does not claim Khronos conformance. Its TypeScript API and supported feature set can change.
:::

## Reference pages

- [Device and object lifecycle](/docs/api-reference/anari-js/anari-device): `ANARIDevice`, object creation, discovery, staged parameters, commits, and destruction.
- [Arrays and geometry](/docs/api-reference/anari-js/anari-geometry): `ANARIArray`, typed data, triangle meshes, spheres, cylinders, cones, and quads.
- [Materials and lighting](/docs/api-reference/anari-js/anari-materials-and-lights): matte and physically based materials; ambient, directional, point, and spot lights.
- [Scene hierarchy](/docs/api-reference/anari-js/anari-scene): surfaces, groups, transform instances, worlds, and instancing behavior.
- [Cameras, renderers, and frames](/docs/api-reference/anari-js/anari-rendering): camera projections, renderer controls, bloom, fog, frame rendering, and statistics.
- [ANARI C API and THREE.js mapping](/docs/api-reference/anari-js/anari-api-mapping): official ANARI 1.1 functions, implementation coverage, behavioral differences, and THREE.js equivalents.
- [ANARI developer guide](/docs/api-guide/engine/anari-rendering): complete setup, scene construction, animation, HDR presentation, debugging, architecture, and limitations.

## Installation

Install the ANARI package, its luma.gl peer dependencies, and at least one backend:

```bash
yarn add @luma.gl/anari-js @luma.gl/core @luma.gl/engine @luma.gl/effects @luma.gl/shadertools @luma.gl/webgpu
```

Add `@luma.gl/webgl` if your application also needs a WebGL 2 fallback. During development in the luma.gl repository, the package is available as a local Yarn workspace.

## Object model

```text
ANARIDevice
  ├── ANARIArray
  ├── ANARIGeometry + ANARIMaterial → ANARISurface
  ├── ANARISurface + ANARILight → ANARIGroup
  ├── ANARIGroup + transform → ANARIInstance
  ├── ANARISurface / ANARIInstance / ANARILight → ANARIWorld
  ├── ANARICamera
  ├── ANARIRenderer
  └── ANARIWorld + ANARICamera + ANARIRenderer → ANARIFrame
```

Every scene object stores committed parameters. Reusing the same `ANARISurface` through multiple `ANARIInstance` objects lets the runtime compile one luma.gl model and issue one instanced draw for that surface.

## Exported classes

```ts
import {
  ANARIDevice,
  ANARIObject,
  ANARIArray,
  ANARIGeometry,
  ANARIMaterial,
  ANARISurface,
  ANARIGroup,
  ANARIInstance,
  ANARIWorld,
  ANARILight,
  ANARICamera,
  ANARIRenderer,
  ANARIFrame
} from '@luma.gl/anari-js';
```

The package also exports parameter interfaces, subtype unions, object metadata, frame statistics, and shared vector/matrix aliases. Each reference page documents its related exported types.

## Supported object subtypes

| Object type | Supported subtypes |
| --- | --- |
| Array | `array1D` |
| Geometry | `triangle`, `sphere`, `cylinder`, `cone`, `quad` |
| Material | `matte`, `physicallyBased` |
| Surface | `default` |
| Group | `default` |
| Instance | `transform` |
| World | `default` |
| Light | `ambient`, `directional`, `point`, `spot` |
| Camera | `perspective`, `orthographic` |
| Renderer | `default`, `debugNormals`, `debugDepth` |
| Frame | `default` |

Query the actual subtype list with `anariDevice.getObjectSubtypes(type)` instead of assuming future implementations expose the same set.

## Compatibility

| Capability | WebGPU | WebGL 2 |
| --- | --- | --- |
| Retained scene objects and instanced surfaces | Supported | Supported |
| Matte and physically based materials | Supported | Supported |
| Ambient, directional, point, and spot lighting | Supported | Supported |
| Debug normals and depth renderers | Supported | Supported |
| Bloom and fog | Supported | Supported |
| Extended-range, Display P3 presentation | Supported on compatible displays and browsers | Not supported; SDR fallback |

See [HDR and backend selection](/docs/api-guide/engine/anari-rendering#hdr-and-backend-selection) for capability detection and canvas setup.
