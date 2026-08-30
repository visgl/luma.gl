import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# @luma.gl/scene

<p>
  <a href="https://www.khronos.org/anari/">
    <img src="/img/standards/anari.svg" alt="ANARI" height="72" />
  </a>
</p>

<p><small>Experimental asset import</small></p>

<div className="docs-api-card__logos" role="group" aria-label="Experimental asset import">
  <a href="https://www.khronos.org/gltf/">
    <img
      src="/img/standards/gltf.svg"
      alt="glTF"
      height="50"
      className="docs-api-card__logo docs-api-card__logo--secondary"
    />
  </a>
  <a href="https://openusd.org/">
    <img
      src="/img/standards/openusd.png"
      alt="OpenUSD"
      height="40"
      className="docs-api-card__logo docs-api-card__logo--secondary docs-api-card__logo--on-dark"
    />
  </a>
</div>

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Private workspace</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/scene` provides a private, experimental, independently developed retained rendering API
built in the spirit of ANARI on top of luma.gl. Applications describe **what** to render as cameras,
worlds, surfaces, materials, lights, and frames. The implementation decides **how** to compile that
description into portable WebGPU or WebGL rendering.

:::caution[Independent, non-conformant proof of concept]
This package is inspired by the ANARI object model, but it is not an official ANARI implementation,
is not an ANARI C binding, does not implement the full ANARI specification, and is not certified or
conformant. It is not affiliated with or endorsed by The Khronos Group. ANARI and its logo are
trademarks of The Khronos Group and identify the standard that inspires this project. The TypeScript
API and supported feature set can change.
:::

## Reference pages

- [Device and object lifecycle](/docs/api-reference/scene/anari-device): `ANARIDevice`, object creation, renderer registration, discovery, staged parameters, commits, and destruction.
- [Arrays and geometry](/docs/api-reference/scene/anari-geometry): triangle meshes, RGB/RGBA colors, secondary UVs, joint palettes, morph targets, and analytic primitives.
- [Materials and lighting](/docs/api-reference/scene/anari-materials-and-lights): all 21 canonical PBR maps, alpha masking/blending, UV samplers, punctual lights, and existing image-based lighting.
- [Animation and glTF integration](/docs/api-reference/scene/anari-animation): retained node hierarchies, optional glTF adaptation, automatic skeletal and morph playback, mixer controls, and batched object commits.
- [Scene hierarchy](/docs/api-reference/scene/anari-scene): surfaces, groups, transform instances, worlds, and instancing behavior.
- [Cameras, renderers, and frames](/docs/api-reference/scene/anari-rendering): camera projections, forward/deferred/ray-tracing renderer controls, bloom, fog, frame rendering, and statistics.
- [Structured volume ray marching](/docs/api-reference/scene/raymarch): scalar/vector buffer and 3D-texture volumes, transfer functions, compositing, and solid vector glyphs.
- [Scene schemas and JSON validation](/docs/api-reference/scene/anari-schemas): optional Zod object schemas, retained-reference validation, generated JSON Schema, and editor integration.
- [ANARI C API and THREE.js mapping](/docs/api-reference/scene/anari-api-mapping): official ANARI 1.1 functions, implementation coverage, behavioral differences, and THREE.js equivalents.
- [ANARI developer guide](/docs/api-guide/engine/anari-rendering): complete setup, scene construction, animation, HDR presentation, debugging, architecture, and limitations.
- [JSON scene playground](/docs/api-guide/engine/anari-json-scenes#explore-the-json-scene-playground): live deck.gl-style JSON scene editing, reusable object references, animated presets, and retained-scene statistics.

## Private workspace availability

`@luma.gl/scene` is a private, unpublished luma.gl workspace. Install dependencies from a luma.gl
checkout:

```bash
yarn install
```

Another workspace inside the same checkout can depend on it through
`"@luma.gl/scene": "workspace:*"`. It cannot currently be installed from npm. Add `@luma.gl/webgl`
to the consuming workspace if a WebGL 2 fallback is required.

## Object model

```text
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

## Exported classes

```ts
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

```ts
import {ANARIDevice} from '@luma.gl/scene';
import {makeANARIAnimationScene} from '@luma.gl/scene/gltf';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
```

The core entry point contains neither a glTF file loader nor Zod. The optional `/gltf` adapter
consumes glTF-owned decoded data and reuses the existing engine animation mixer; `/schemas`
separately loads the retained JSON validation helpers.

## Supported object subtypes

| Object type | Supported subtypes |
| --- | --- |
| Array | `array1D` |
| Geometry | `triangle`, `sphere`, `cylinder`, `cone`, `quad` |
| Material | `matte`, `physicallyBased` |
| Sampler | `image2D` |
| Surface | `default` |
| Group | `default` |
| Instance | `transform` |
| World | `default` |
| Light | `ambient`, `directional`, `point`, `spot` |
| Camera | `perspective`, `orthographic` |
| Renderer | `default`, `deferred`, `debugNormals`, `debugDepth`, `raytrace`, and registered custom subtypes |
| Frame | `default` |

Query the actual subtype list with `anariDevice.getObjectSubtypes(type)` instead of assuming future implementations expose the same set.

## Compatibility

| Capability | WebGPU | WebGL 2 |
| --- | --- | --- |
| Retained scene objects and instanced surfaces | Supported | Supported |
| Matte and physically based materials | Supported | Supported |
| All 21 canonical PBR image maps and slot-specific UV transforms | Supported | Supported |
| Secondary UVs and RGB/RGBA vertex colors | Supported | Supported |
| Alpha masking, blending, and double-sided materials | Supported | Supported |
| Retained node/material/UV animation and morph targets | Supported | Supported |
| Automatic imported glTF skeletal animation | Supported | Supported |
| Explicit surface joint palettes | Supported | Supported |
| Existing caller-owned image-based lighting textures | Supported | Supported |
| Captured opaque-scene transmission and refraction | Supported | Supported |
| Ambient, directional, point, and spot lighting | Supported | Supported |
| Deferred renderer | WebGPU-only G-buffer and direct deferred lighting | Not supported |
| Software ray-tracing renderer | Shared `RayTracingSceneRenderer` and WebGPU command graph | Not supported |
| Ray-traced skeletal/morph deformation or advanced PBR | Not supported; use forward/deferred rendering | Not supported |
| Debug normals and depth renderers | Supported | Supported |
| Bloom | Supported | Supported |
| Deferred fog | Supported | Not supported |
| Extended-range, Display P3 presentation | Supported on compatible displays and browsers | Not supported; SDR fallback |

See [HDR and backend selection](/docs/api-guide/engine/anari-first-scene#hdr-and-backend-selection) for capability detection and canvas setup.

## Experimental JSON playground

The private package includes a JSON scene playground at
`examples/showcase/scene/playground.html`. Start it with
`yarn workspace luma.gl-examples-showcase-scene start`, then open `/playground.html` on the
reported development-server URL. The playground translates deck.gl-inspired `@@type`
declarations, named ANARI object references, shared retained surfaces, generated torus/crystal/prism
meshes, starfield distributions, composable transform animations, lights following named
instances, cameras, and optional renderer presets into the API documented on these pages. The active
renderer subtype is selected as frame state outside the renderer-independent scene. The complete
Chromatic Atlas, Crystal Cathedral, and Celestial Engine showcase scenes are available as editable
JSON presets.

The optional `@luma.gl/scene/gltf` entry point binds source node hierarchies, material and texture
tracks, animated morph targets, and imported glTF skeletons to existing retained objects. The
showcase preserves joint attributes, authored joint nodes, and inverse bind matrices; it creates
reusable mesh-local palettes automatically and commits each animated retained surface at most once
per frame. Applications can also provide explicit `skin: {jointMatrices}` surface descriptors.
The separate `@luma.gl/scene/schemas` entry point exports experimental Zod schemas and generated
JSON Schema for editor integration. The scene format is not an official ANARI serialization format.
See the [schema API reference](/docs/api-reference/scene/anari-schemas) and the
[JSON scene playground developer guide](/docs/api-guide/engine/anari-json-scenes#explore-the-json-scene-playground)
for the full schema, animation vocabulary, and editing controls.
