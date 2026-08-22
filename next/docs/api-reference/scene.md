# @luma.gl/scene

[![ANARI](/img/standards/anari.svg)](https://www.khronos.org/anari/)

Experimental asset import

[![glTF](/img/standards/gltf.svg)](https://www.khronos.org/gltf/)[![OpenUSD](/img/standards/openusd.png)](https://openusd.org/)

ExperimentalPrivate workspaceFrom v10

`@luma.gl/scene` provides a private, experimental, independently developed retained rendering API built in the spirit of ANARI on top of luma.gl. Applications describe **what** to render as cameras, worlds, surfaces, materials, lights, and frames. The implementation decides **how** to compile that description into portable WebGPU or WebGL rendering.

Independent, non-conformant proof of concept

This package is inspired by the ANARI object model, but it is not an official ANARI implementation, is not an ANARI C binding, does not implement the full ANARI specification, and is not certified or conformant. It is not affiliated with or endorsed by The Khronos Group. ANARI and its logo are trademarks of The Khronos Group and identify the standard that inspires this project. The TypeScript API and supported feature set can change.

## Reference pages[​](#reference-pages "Direct link to Reference pages")

* [Device and object lifecycle](https://luma.gl/next/docs/api-reference/scene/anari-device.md): `ANARIDevice`, object creation, renderer registration, discovery, staged parameters, commits, and destruction.
* [Arrays and geometry](https://luma.gl/next/docs/api-reference/scene/anari-geometry.md): triangle meshes, RGB/RGBA colors, secondary UVs, joint palettes, morph targets, and analytic primitives.
* [Materials and lighting](https://luma.gl/next/docs/api-reference/scene/anari-materials-and-lights.md): all 21 canonical PBR maps, alpha masking/blending, UV samplers, punctual lights, and existing image-based lighting.
* [Animation and glTF integration](https://luma.gl/next/docs/api-reference/scene/anari-animation.md): retained node hierarchies, optional glTF adaptation, automatic skeletal and morph playback, mixer controls, and batched object commits.
* [Scene hierarchy](https://luma.gl/next/docs/api-reference/scene/anari-scene.md): surfaces, groups, transform instances, worlds, and instancing behavior.
* [Cameras, renderers, and frames](https://luma.gl/next/docs/api-reference/scene/anari-rendering.md): camera projections, forward/deferred/ray-tracing renderer controls, bloom, fog, frame rendering, and statistics.
* [Structured volume ray marching](https://luma.gl/next/docs/api-reference/scene/raymarch.md): scalar/vector buffer and 3D-texture volumes, transfer functions, compositing, and solid vector glyphs.
* [Scene schemas and JSON validation](https://luma.gl/next/docs/api-reference/scene/anari-schemas.md): optional Zod object schemas, retained-reference validation, generated JSON Schema, and editor integration.
* [ANARI C API and THREE.js mapping](https://luma.gl/next/docs/api-reference/scene/anari-api-mapping.md): official ANARI 1.1 functions, implementation coverage, behavioral differences, and THREE.js equivalents.
* [ANARI developer guide](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md): complete setup, scene construction, animation, HDR presentation, debugging, architecture, and limitations.
* [JSON scene playground](https://luma.gl/next/docs/api-guide/engine/anari-json-scenes.md#explore-the-json-scene-playground): live deck.gl-style JSON scene editing, reusable object references, animated presets, and retained-scene statistics.

## Private workspace availability[​](#private-workspace-availability "Direct link to Private workspace availability")

`@luma.gl/scene` is a private, unpublished luma.gl workspace. Install dependencies from a luma.gl checkout:

```
yarn install
```

Another workspace inside the same checkout can depend on it through `"@luma.gl/scene": "workspace:*"`. It cannot currently be installed from npm. Add `@luma.gl/webgl` to the consuming workspace if a WebGL 2 fallback is required.

## Object model[​](#object-model "Direct link to Object model")

```
ANARIDevice

  ├── ANARIArray

  ├── ANARISampler → ANARIMaterial

  ├── ANARIGeometry + ANARIMaterial → ANARISurface

  ├── ANARISurface + ANARILight → ANARIGroup

  ├── ANARIGroup + transform → ANARIInstance

  ├── ANARISurface / ANARIInstance / ANARILight → ANARIWorld

  ├── ANARICamera

  ├── ANARIRenderer

  └── ANARIWorld + ANARICamera + ANARIRenderer → ANARIFrame
```

Every scene object stores committed parameters. Reusing the same `ANARISurface` through multiple `ANARIInstance` objects lets the runtime compile one luma.gl model and issue one instanced draw for that surface.

## Exported classes[​](#exported-classes "Direct link to Exported classes")

```
import {

  ANARIDevice,

  ANARIObject,

  ANARIArray,

  ANARIGeometry,

  ANARISampler,

  ANARIMaterial,

  ANARISurface,

  ANARIGroup,

  ANARIInstance,

  ANARIWorld,

  ANARILight,

  ANARICamera,

  ANARIRenderer,

  ANARIFrame

} from '@luma.gl/scene';
```

The package also exports parameter interfaces, subtype unions, object metadata, frame statistics, and shared vector/matrix aliases. Each reference page documents its related exported types.

Optional functionality is isolated in separate entry points:

```
import {ANARIDevice} from '@luma.gl/scene';

import {makeANARIAnimationScene} from '@luma.gl/scene/gltf';

import {ANARISceneSchema} from '@luma.gl/scene/schemas';
```

The core entry point contains neither a glTF file loader nor Zod. The optional `/gltf` adapter consumes glTF-owned decoded data and reuses the existing engine animation mixer; `/schemas` separately loads the retained JSON validation helpers.

## Supported object subtypes[​](#supported-object-subtypes "Direct link to Supported object subtypes")

| Object type | Supported subtypes                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Array       | `array1D`                                                                                       |
| Geometry    | `triangle`, `sphere`, `cylinder`, `cone`, `quad`                                                |
| Material    | `matte`, `physicallyBased`                                                                      |
| Sampler     | `image2D`                                                                                       |
| Surface     | `default`                                                                                       |
| Group       | `default`                                                                                       |
| Instance    | `transform`                                                                                     |
| World       | `default`                                                                                       |
| Light       | `ambient`, `directional`, `point`, `spot`                                                       |
| Camera      | `perspective`, `orthographic`                                                                   |
| Renderer    | `default`, `deferred`, `debugNormals`, `debugDepth`, `raytrace`, and registered custom subtypes |
| Frame       | `default`                                                                                       |

Query the actual subtype list with `anariDevice.getObjectSubtypes(type)` instead of assuming future implementations expose the same set.

## Compatibility[​](#compatibility "Direct link to Compatibility")

| Capability                                                      | WebGPU                                                    | WebGL 2                     |
| --------------------------------------------------------------- | --------------------------------------------------------- | --------------------------- |
| Retained scene objects and instanced surfaces                   | Supported                                                 | Supported                   |
| Matte and physically based materials                            | Supported                                                 | Supported                   |
| All 21 canonical PBR image maps and slot-specific UV transforms | Supported                                                 | Supported                   |
| Secondary UVs and RGB/RGBA vertex colors                        | Supported                                                 | Supported                   |
| Alpha masking, blending, and double-sided materials             | Supported                                                 | Supported                   |
| Retained node/material/UV animation and morph targets           | Supported                                                 | Supported                   |
| Automatic imported glTF skeletal animation                      | Supported                                                 | Supported                   |
| Explicit surface joint palettes                                 | Supported                                                 | Supported                   |
| Existing caller-owned image-based lighting textures             | Supported                                                 | Supported                   |
| Captured opaque-scene transmission and refraction               | Supported                                                 | Supported                   |
| Ambient, directional, point, and spot lighting                  | Supported                                                 | Supported                   |
| Deferred renderer                                               | WebGPU-only G-buffer and direct deferred lighting         | Not supported               |
| Software ray-tracing renderer                                   | Shared `RayTracingSceneRenderer` and WebGPU command graph | Not supported               |
| Ray-traced skeletal/morph deformation or advanced PBR           | Not supported; use forward/deferred rendering             | Not supported               |
| Debug normals and depth renderers                               | Supported                                                 | Supported                   |
| Bloom                                                           | Supported                                                 | Supported                   |
| Deferred fog                                                    | Supported                                                 | Not supported               |
| Extended-range, Display P3 presentation                         | Supported on compatible displays and browsers             | Not supported; SDR fallback |

See [HDR and backend selection](https://luma.gl/next/docs/api-guide/engine/anari-first-scene.md#hdr-and-backend-selection) for capability detection and canvas setup.

## Experimental JSON playground[​](#experimental-json-playground "Direct link to Experimental JSON playground")

The private package includes a JSON scene playground at `examples/showcase/scene/playground.html`. Start it with `yarn workspace luma.gl-examples-showcase-scene start`, then open `/playground.html` on the reported development-server URL. The playground translates deck.gl-inspired `@@type` declarations, named ANARI object references, shared retained surfaces, generated torus/crystal/prism meshes, starfield distributions, composable transform animations, lights following named instances, cameras, and optional renderer presets into the API documented on these pages. The active renderer subtype is selected as frame state outside the renderer-independent scene. The complete Chromatic Atlas, Crystal Cathedral, and Celestial Engine showcase scenes are available as editable JSON presets.

The optional `@luma.gl/scene/gltf` entry point binds source node hierarchies, material and texture tracks, animated morph targets, and imported glTF skeletons to existing retained objects. The showcase preserves joint attributes, authored joint nodes, and inverse bind matrices; it creates reusable mesh-local palettes automatically and commits each animated retained surface at most once per frame. Applications can also provide explicit `skin: {jointMatrices}` surface descriptors. The separate `@luma.gl/scene/schemas` entry point exports experimental Zod schemas and generated JSON Schema for editor integration. The scene format is not an official ANARI serialization format. See the [schema API reference](https://luma.gl/next/docs/api-reference/scene/anari-schemas.md) and the [JSON scene playground developer guide](https://luma.gl/next/docs/api-guide/engine/anari-json-scenes.md#explore-the-json-scene-playground) for the full schema, animation vocabulary, and editing controls.
