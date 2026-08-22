# ANARI JSON scenes

[Overview](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md)[First scene](https://luma.gl/next/docs/api-guide/engine/anari-first-scene.md)[Architecture](https://luma.gl/next/docs/api-guide/engine/anari-architecture.md)[JSON scenes](https://luma.gl/next/docs/api-guide/engine/anari-json-scenes.md)

## Explore the JSON scene playground[​](#explore-the-json-scene-playground "Direct link to Explore the JSON scene playground")

The private ANARI showcase includes a deck.gl-style JSON playground for describing complete scenes without writing rendering code. Start the showcase from the repository root:

```
yarn workspace luma.gl-examples-showcase-scene start
```

Open `/playground.html` on the reported development-server URL, or select **JSON LAB** in the Observatory. The playground provides a Monaco JSON editor with syntax highlighting, schema-aware completions, property documentation, red error indicators, animated example scenes, WebGPU/WebGL selection, a renderer selector for frame presentation, automatic HDR presentation when available, orbit controls, validation feedback, and live instance, draw-call, and triangle statistics.

Use **GLTF ↓** or **USD ↓** to download the currently valid retained scene. Export bakes procedural geometry, starfield distributions, and retained instances into a static snapshot; transfers mesh positions, normals, UVs, vertex colors, materials, texture images, camera, and supported lights; and emits standalone JSON glTF with embedded buffers/images or ASCII `.usda`. ANARI animation declarations, optional renderer presets, bloom, fog, and renderer-only HDR controls remain ANARI-specific and are not exported.

Experimental playground format

The JSON format and its optional schema exports are experimental. They are not part of the ANARI C specification and can change with the private `@luma.gl/scene` workspace.

### Validate scenes with Zod and JSON Schema[​](#validate-scenes-with-zod-and-json-schema "Direct link to Validate scenes with Zod and JSON Schema")

The optional `@luma.gl/scene/schemas` entry point exports separate Zod schemas for geometry, materials, lights, cameras, renderers, surfaces, groups, instances, animations, and complete scenes. Importing ordinary rendering objects from `@luma.gl/scene` does not load Zod:

```
import {

  ANARIGeometrySchema,

  ANARISceneSchema,

  ANARI_SCENE_JSON_SCHEMA

} from '@luma.gl/scene/schemas';



const geometry = ANARIGeometrySchema.safeParse({

  '@@type': 'sphere',

  radius: 1,

  segments: 32

});



const result = ANARISceneSchema.safeParse(scene);



if (!result.success) {

  for (const issue of result.error.issues) {

    console.error(issue.path.join('.'), issue.message);

  }

}
```

`ANARI_SCENE_JSON_SCHEMA` is generated directly from the Zod scene schema as draft-07 JSON Schema. Associate it with a Monaco JSON model to provide subtype-aware autocomplete, property hovers, numeric bounds, syntax highlighting, and ordinary schema diagnostics. Runtime Zod validation adds semantic checks for missing retained resources, duplicate instance identifiers, missing group references, and animated lights following nonexistent instances; the playground maps those issue paths back to precise Monaco error indicators.

### Describe a scene with JSON[​](#describe-a-scene-with-json "Direct link to Describe a scene with JSON")

Use `@@type` to select ANARI object subtypes, registry keys to name shared resources, and `@@id` to name individual lights and instances. Renderer data is optional in the playground JSON: the ANARI world remains renderer-independent, while the active renderer subtype is selected by the playground UI and attached only when constructing the frame.

```
{

  "version": 1,

  "name": "MY FIRST ANARI SCENE",

  "camera": {

    "@@type": "perspective",

    "position": [6, 4, 9],

    "target": [0, 1, 0],

    "fovy": 0.75,

    "orbit": {"speed": 0.08}

  },

  "geometries": {

    "orb": {"@@type": "sphere", "radius": 0.8, "segments": 28},

    "floor": {"@@type": "quad", "width": 14, "height": 14}

  },

  "materials": {

    "metal": {

      "@@type": "physicallyBased",

      "baseColor": [0.28, 0.45, 0.95],

      "metallic": 0.85,

      "roughness": 0.15

    },

    "floor": {"@@type": "matte", "color": [0.12, 0.13, 0.2]}

  },

  "surfaces": {

    "orb": {"geometry": "orb", "material": "metal"},

    "floor": {"geometry": "floor", "material": "floor"}

  },

  "instances": [

    {

      "@@id": "left-orb",

      "surface": "orb",

      "position": [-1.3, 1, 0],

      "animation": {"@@type": "bob", "amplitude": 0.25, "speed": 1.1}

    },

    {

      "@@id": "right-orb",

      "surface": "orb",

      "position": [1.3, 1, 0]

    }

  ],

  "lights": [

    {

      "@@id": "sun",

      "@@type": "directional",

      "direction": [-1, -1, -0.4],

      "irradiance": 2

    },

    {

      "@@id": "emitter",

      "@@type": "point",

      "position": [3, 2, 0],

      "color": [1, 0.35, 0.12],

      "intensity": 22,

      "animation": {

        "@@type": "orbit",

        "center": [0, 2, 0],

        "radius": 3,

        "speed": 0.7

      }

    }

  ],

  "world": {"surfaces": ["floor"]}

}
```

Both orb instances reference the same named surface. The playground retains that surface identity and caches its implicit group, allowing the runtime to issue one instanced draw instead of one draw for each orb.

### Scene properties and object references[​](#scene-properties-and-object-references "Direct link to Scene properties and object references")

| Property              | Meaning                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `version`             | JSON schema version; currently `1`.                                                                                                                                                                                |
| `name`, `description` | Human-readable preview title and optional scene description.                                                                                                                                                       |
| `camera`              | Camera `@@type`, normal ANARI camera parameters, optional `target`, and optional orbit speed.                                                                                                                      |
| `renderer`            | Optional renderer preset parameters for exposure, tone mapping, output color space, bloom, background, and fog. The playground's renderer selector chooses the active renderer subtype independently of the scene. |
| `geometries`          | Named geometry declarations; triangle meshes accept number arrays or compact `torus`, `crystal`, and beveled `prism` generators.                                                                                   |
| `materials`           | Named `matte` or `physicallyBased` material declarations.                                                                                                                                                          |
| `surfaces`            | Named surface declarations referencing geometry and material identifiers.                                                                                                                                          |
| `groups`              | Optional named groups referencing `surfaces` and optional `lights`.                                                                                                                                                |
| `instances`           | Array of objects with `@@id`, a `group` or `surface` reference, transforms, and optional animation.                                                                                                                |
| `nodes`               | Optional imported animation hierarchy with transforms, retained instance references, and owned morph geometries.                                                                                                   |
| `clips`, `playback`   | Optional keyframe animation clips plus selected clip, playback speed, playing state, and loop behavior.                                                                                                            |
| `distributions`       | Optional compact procedural instance distributions, including seeded `starfield` populations.                                                                                                                      |
| `lights`              | Array of lights with `@@id`, ANARI subtype/parameters, and optional animation.                                                                                                                                     |
| `world`               | Optional selected `surfaces`, `instances`, and `lights`; all instances and lights are included by default.                                                                                                         |

An instance can describe its transform with `position`, `rotation`, and `scale` three-component vectors, or supply a complete 16-element `matrix`. Rotations use radians and are applied in X, Y, Z order. Instances referencing a `surface` directly share an automatically generated group; use an explicit named `group` when multiple surfaces or group-attached lights are required.

Object subtypes match the private package: `triangle`, `sphere`, `cylinder`, `cone`, and `quad` geometry; `matte` and `physicallyBased` materials; `ambient`, `directional`, `point`, and `spot` lights; `perspective` and `orthographic` cameras; and optional renderer presets for `default`, `deferred`, `raytrace`, `debugNormals`, and `debugDepth`. Ray-tracing presets additionally accept `samplesPerPixel`, `maxBounces`, `progressive`, `shadows`, `resolutionScale`, `minimumResolutionScale`, `adaptiveResolution`, `targetFrameTimeMilliseconds`, `temporalReprojection`, and `shadowSamplesPerFrame`.

### Generate compact triangle meshes and starfields[​](#generate-compact-triangle-meshes-and-starfields "Direct link to Generate compact triangle meshes and starfields")

Triangle geometry can provide literal `vertex.position`, `vertex.normal`, and `primitive.index` number arrays. For commonly repeated showcase shapes, it can instead declare a procedural mesh generator while remaining entirely JSON:

```
{

  "orbit-ring": {

    "@@type": "triangle",

    "generator": {

      "@@type": "torus",

      "majorRadius": 1,

      "minorRadius": 0.025,

      "majorSegments": 110,

      "minorSegments": 10

    }

  },

  "gemstone": {

    "@@type": "triangle",

    "generator": {

      "@@type": "crystal",

      "radius": 0.47,

      "height": 2.6,

      "sides": 6

    }

  },

  "opal-column": {

    "@@type": "triangle",

    "generator": {

      "@@type": "prism",

      "radius": 0.52,

      "height": 1,

      "sides": 12,

      "bevel": 0.1

    }

  }

}
```

The `torus` generator creates indexed vertices and normals. The `crystal` generator creates pointed, flat-shaded gemstone facets, while the `prism` generator creates finely faceted, beveled shafts suitable for polished architectural crystals.

Similarly, `distributions` expands a concise declaration into deterministic retained instances that all share the same surface:

```
{

  "distributions": [

    {

      "@@id": "background-stars",

      "@@type": "starfield",

      "surface": "star",

      "count": 260,

      "radius": 45,

      "seed": 7

    }

  ]

}
```

This represents hundreds of individually transformed stars without filling the editable JSON with hundreds of nearly identical instance objects.

### Animate retained scene objects[​](#animate-retained-scene-objects "Direct link to Animate retained scene objects")

Procedural animations update existing objects through `setParameter(...).commitParameters()`; authored glTF clips use the shared engine animation mixer. Neither path rebuilds the world each frame, and authored channels take precedence when both paths target the same retained object.

| Animation `@@type` | Applies to           | Properties                                                                                                    |
| ------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `orbit`            | Instances and lights | Optional `center`, `radius`, `speed`, `phase`, inclined orbit, oscillating `height`, and `verticalFrequency`. |
| `bob`              | Instances            | Optional vertical `amplitude`, `speed`, and `phase`.                                                          |
| `spin`             | Instances            | Optional `axis`, angular `speed`, and `phase`.                                                                |
| `wobble`           | Instances            | Optional `axis`, angular `amplitude`, `speed`, and `phase`.                                                   |
| `pulse`            | Lights               | Optional intensity `amplitude`, `speed`, and `phase`.                                                         |
| `follow`           | Lights               | Named instance `target` and optional positional `offset`.                                                     |

Use `animation` for one behavior or `animations` to compose several behaviors on a single instance:

```
{

  "@@id": "orbit-ring-3",

  "surface": "violet-ring",

  "position": [0, 7, 0],

  "rotation": [0.2, 0, 0.6],

  "animations": [

    {"@@type": "wobble", "axis": "x", "amplitude": 0.07, "speed": 0.28},

    {"@@type": "spin", "axis": "z", "speed": -0.055}

  ]

}
```

An illuminated satellite and its actual point light can be linked without duplicating their orbital formulas:

```
{

  "@@id": "satellite-light",

  "@@type": "point",

  "position": [4.2, 7, 0],

  "color": [0.24, 0.54, 1],

  "intensity": 42,

  "animation": {"@@type": "follow", "target": "satellite-3"}

}
```

The playground includes the complete **Chromatic Atlas**, **Crystal Cathedral**, and **Celestial Engine** Observatory scenes as editable JSON presets. They preserve shared retained surfaces, generated halo and orbital meshes, hundreds of background stars, composable object motion, physically based materials, fog, bloom, HDR presentation, and real lights tracking the orbiting satellites. Crystal Cathedral additionally demonstrates faceted translucent crystal geometry, fine beveled prisms, smooth 32-segment spires, and glossy opalescent materials.

The editor applies valid changes automatically after a short debounce. Toggle **LIVE** to switch to manual changes, use **APPLY** or `⌘ Enter` / `Ctrl Enter` to commit, and select **FORMAT**, **RESET**, or **COPY** for common editing actions. Invalid JSON, unknown object references, duplicate identifiers, unsupported subtypes, and incompatible animations are reported inline while preserving the last successfully rendered scene.

### Import OpenUSD and glTF scenes[​](#import-openusd-and-gltf-scenes "Direct link to Import OpenUSD and glTF scenes")

Both the Observatory and the JSON playground expose an experimental 3D scene selector supporting OpenUSD and glTF. Production-quality glTF samples include an Antique Camera, Brass Lantern, and Vintage Toy Car from Khronos Group's CC0 glTF Sample Assets. OpenUSD samples include a detailed Utah/Fancy teapot atelier, a cinematic Open Chess Set knight triptych, a composed vehicle gallery, a formula racer, a crimson sedan, a reusable wheel assembly, and a material laboratory. The teapot and vehicle models are selected from public-domain CC0 USD Working Group assets. The knight is attributed to the Academy Software Foundation's Open Chess Set under CC BY 4.0; complete credits accompany the bundled assets.

The glTF adapter uses the existing loaders.gl GLTF loader, preserves indexed triangle meshes, reuses retained surfaces for repeated nodes, translates physically based materials, and retains all 21 canonical PBR texture slots as fragment-sampled ANARI image samplers. Source wrapping, filter and mipmap settings, color spaces, both UV sets, `KHR_texture_transform`, alpha masking, sidedness, and authored punctual lights are preserved. Joint attributes are imported, while animated joint deformation additionally requires an application-provided retained `surface.skin.jointMatrices` palette. POSITION, NORMAL, and TANGENT morph targets and animated morph weights play through the retained scene automatically.

The optional `@luma.gl/scene/gltf` entry point translates parsed glTF clips and binds their node, material, sampler, and morph channels to existing retained objects:

```
import {makeANARIAnimationScene} from '@luma.gl/scene/gltf';



const animation = makeANARIAnimationScene(description, retainedObjects);



animation.play();

animation.update(timeSeconds);

animation.seek(1.5);
```

`update()` receives an absolute monotonic time in seconds. The handle shares the engine animation mixer and commits each changed retained object at most once per frame. See [ANARI glTF and keyframe animation](https://luma.gl/next/docs/api-reference/scene/anari-animation.md) and [glTF animation and deformation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md) for complete bindings, interpolation modes, ownership, and playback examples. Local file selection supports standalone `.gltf` and `.glb` assets as well as supported OpenUSD files.

The example-local `USDLoader` follows the loaders.gl loader contract and is structured for future extraction into an `@loaders.gl/usd` module:

```
import {load} from '@loaders.gl/core';

import {USDLoader} from './usd-loader/usd-loader';

import {makeANARIJSONSceneFromUSD} from './usd-to-anari';



const stage = await load('/usd/vehicle-gallery.usda', USDLoader, {

  usd: {variantSelections: {wheels: 'wheelNormal'}}

});



const scene = makeANARIJSONSceneFromUSD(stage, 'VEHICLE GALLERY');
```

The loader preserves stage metadata, prim hierarchies, typed attributes, material bindings, references, payloads, selected variants, and local overrides. The ANARI adapter converts supported meshes, analytic primitives, transform instances, `UsdPreviewSurface` materials, connected `UsdUVTexture` images, directional lights, and point lights into the same editable JSON format as the built-in playground presets. Imported scenes are normalized into a consistent studio-scale coordinate system and automatically receive glossy staging, animated cyan/amber HDR emitters, real following point lights, and bloom.

Supported input is ASCII `.usda` / `.usd` plus uncompressed `.usdz` archives whose root layer is ASCII. Binary USDC crates, complete USD composition semantics, and arbitrary MaterialX/MDL networks remain unsupported. Local uploads must be standalone ASCII stages or self-contained ASCII-root USDZ archives; a loose stage with external references needs a resolvable URL.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Declarative ANARI rendering](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md)
* [ANARI API reference](https://luma.gl/next/docs/api-reference/scene.md)
* [Engine programming](https://luma.gl/next/docs/api-guide/engine.md)
