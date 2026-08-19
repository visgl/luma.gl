import {DocumentationBadge, DocumentationBadges} from '@site/src/components/docs/documentation-badges';

# ANARI Scene Schemas

<DocumentationBadges>
  <DocumentationBadge tone="experimental">Experimental</DocumentationBadge>
  <DocumentationBadge tone="neutral">Private workspace</DocumentationBadge>
  <DocumentationBadge tone="version">From v10</DocumentationBadge>
</DocumentationBadges>

`@luma.gl/anari/schemas` exposes optional Zod schemas for the experimental retained-scene JSON
format and generates a JSON Schema suitable for Monaco, VS Code, and other schema-aware editors.
It is separate from the ordinary `@luma.gl/anari` entry point, so applications that only render
scenes do not load Zod.

:::caution[Experimental scene format]
These schemas describe the private luma.gl ANARI playground format. They are not an official ANARI
serialization standard, and their structure can change with the experimental package.
:::

## Imports

```ts
import {
  ANARIVector3Schema,
  ANARIVector4Schema,
  ANARIMatrix4Schema,
  ANARIGeometryGeneratorSchema,
  ANARIGeometrySchema,
  ANARITextureSchema,
  ANARIMaterialSchema,
  ANARIAnimationSchema,
  ANARIAnimationNodeSchema,
  ANARIAnimationTargetSchema,
  ANARIAnimationTrackSchema,
  ANARIAnimationClipSchema,
  ANARIAnimationPlaybackSchema,
  ANARILightSchema,
  ANARICameraSchema,
  ANARIRendererSchema,
  ANARISurfaceSchema,
  ANARIGroupSchema,
  ANARIInstanceSchema,
  ANARIStarfieldSchema,
  ANARISceneSchema,
  ANARI_SCENE_JSON_SCHEMA,
  type ANARISceneDescription
} from '@luma.gl/anari/schemas';
```

## Exported schemas

| Export | Validates |
| --- | --- |
| `ANARIVector3Schema` | Three finite XYZ, direction, scale, or linear RGB components. |
| `ANARIVector4Schema` | Four finite RGBA components. |
| `ANARIMatrix4Schema` | Sixteen finite column-major transform-matrix values. |
| `ANARIGeometryGeneratorSchema` | Procedural `torus`, `crystal`, and `prism` generators. |
| `ANARIGeometrySchema` | Analytic primitives and triangle meshes, including RGBA colors, two UV sets, joint attributes, and morph targets/weights. |
| `ANARITextureSchema` | Retained image source, color space, sampler addressing/filtering, coordinate set, and UV transform. |
| `ANARIMaterialSchema` | `matte`/`physicallyBased` factors, alpha/culling options, and all 21 retained texture references. |
| `ANARIAnimationSchema` | `orbit`, `bob`, `spin`, `wobble`, `pulse`, and `follow` animations. |
| `ANARIAnimationNodeSchema` | Source-node parent, local transform, initial morph weights, and retained instance/geometry identifiers. |
| `ANARIAnimationTargetSchema` | Stable retained node, instance, material, sampler, light, or camera targets. |
| `ANARIAnimationTrackSchema` | Increasing keyframe times, matching value counts, interpolation, and optional source UV transform. |
| `ANARIAnimationClipSchema` | Named clips containing one or more retained animation tracks. |
| `ANARIAnimationPlaybackSchema` | Selected clip, initial playback state, speed, and once/repeat/ping-pong loop mode. |
| `ANARILightSchema` | `ambient`, `directional`, `point`, and `spot` lights. |
| `ANARICameraSchema` | `perspective` and `orthographic` cameras. |
| `ANARIRendererSchema` | Optional renderer preset configuration for `default`, `deferred`, `raytrace`, `debugNormals`, and `debugDepth`. |
| `ANARISurfaceSchema` | Named geometry/material pairings. |
| `ANARIGroupSchema` | Reusable retained surfaces and optional lights. |
| `ANARIInstanceSchema` | Named transform placements and composable animations. |
| `ANARIStarfieldSchema` | Deterministic retained background-star distributions. |
| `ANARISceneSchema` | A renderer-independent scene and its cross-object semantic references, plus optional renderer presets. |
| `ANARI_SCENE_JSON_SCHEMA` | Draft-07 JSON Schema generated from `ANARISceneSchema`. |
| `ANARISceneDescription` | TypeScript scene type inferred from `ANARISceneSchema`. |

Each object schema uses a strict property set and discriminates supported subtypes through its
`@@type` property. Numeric constraints reject invalid radii, segment counts, roughness, metallic
values, light intensities, camera distances, and similar unsupported values.

Ray-tracing presets additionally accept a positive integer `samplesPerPixel`, a nonnegative integer
`maxBounces`, and boolean `progressive` and `shadows` settings. These subtype-specific properties
remain invalid on forward, deferred, and debug renderer presets. Application-defined runtimes
registered with `ANARIDevice.registerRenderer()` are not automatically added to the strict schema.

## Texture and sampler declarations

```json
{
  "source": "textures/fabric-color.png",
  "colorSpace": "srgb",
  "textureCoordinateSet": 1,
  "sampler": {
    "addressModeU": "repeat",
    "addressModeV": "mirror-repeat",
    "minFilter": "linear",
    "magFilter": "linear",
    "mipmapFilter": "linear"
  },
  "transform": [1, 0, 0, 0, 1, 0, 0.25, 0, 1]
}
```

`textureCoordinateSet` accepts `0` or `1`. Address modes accept `repeat`, `clamp-to-edge`, and
`mirror-repeat`; minification/magnification accept `nearest` or `linear`; mipmap filtering also
accepts `none`. Color-bearing textures should use `srgb`, while normal/roughness and other data
textures use `linear`.

## Retained animation declarations

Scenes can add optional `nodes`, `clips`, and `playback` sections:

```json
{
  "nodes": {
    "character": {
      "translation": [0, 0, 0],
      "weights": [0],
      "instances": ["character-instance"],
      "geometries": ["character-geometry"]
    }
  },
  "clips": [
    {
      "name": "Expression",
      "tracks": [
        {
          "target": {"type": "node", "identifier": "character", "path": "weights"},
          "times": [0, 1],
          "values": [[0], [1]],
          "interpolation": "LINEAR"
        }
      ]
    }
  ],
  "playback": {"clip": "Expression", "playing": true, "loop": "repeat"}
}
```

This fragment supplements the required top-level camera, geometry, material, and surface scene
fields. `STEP` and `LINEAR` tracks require one value per keyframe; `CUBICSPLINE` requires three
values per keyframe, corresponding to in-tangent, value, and out-tangent. Keyframe times must be
strictly increasing.

## Validate a scene

```ts
import {ANARISceneSchema} from '@luma.gl/anari/schemas';

const result = ANARISceneSchema.safeParse(scene);

if (result.success) {
  renderScene(result.data);
} else {
  for (const issue of result.error.issues) {
    console.error(`${issue.path.join('.')}: ${issue.message}`);
  }
}
```

In addition to validating local property shapes, `ANARISceneSchema` verifies:

- Surfaces reference existing named geometries and materials.
- Material texture properties reference existing named textures.
- Groups reference existing surfaces and lights.
- Instances have unique identifiers and reference existing groups or surfaces.
- Starfield distributions reference existing surfaces.
- Animated lights follow existing named instances.
- Animation-node parents exist, are not self-references, and do not form cycles.
- Animation-node instance identifiers resolve to existing retained instances.
- Animation tracks target existing nodes, instances, materials, samplers, lights, or the camera.
- Clip names are unique, playback selects an existing clip, and keyframe values match interpolation.

Zod issues include the exact object/property path, allowing editors to display error indicators on
the invalid retained reference rather than only reporting a generic scene-level failure.

## Generate editor diagnostics

`ANARI_SCENE_JSON_SCHEMA` is generated directly from the Zod schema with
`z.toJSONSchema(ANARISceneSchema, {target: 'draft-07', reused: 'ref'})`. Its identifier is
`https://luma.gl/schemas/anari-scene.json`.

Register the generated schema with Monaco's JSON language service:

```ts
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {ANARI_SCENE_JSON_SCHEMA} from '@luma.gl/anari/schemas';

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  schemas: [
    {
      uri: ANARI_SCENE_JSON_SCHEMA.$id,
      fileMatch: ['inmemory://anari/scene.json'],
      schema: ANARI_SCENE_JSON_SCHEMA
    }
  ]
});
```

JSON Schema supplies syntax diagnostics, subtype-aware autocomplete, property documentation, and
numeric constraints. Run `ANARISceneSchema.safeParse()` separately to add the semantic retained
reference checks that cannot be expressed by ordinary JSON Schema alone.

The [ANARI JSON scenes guide](/docs/api-guide/engine/anari-json-scenes#validate-scenes-with-zod-and-json-schema)
and [JSON scene playground](/docs/api-guide/engine/anari-json-scenes#explore-the-json-scene-playground)
show how these schemas integrate with live scene editing. See
[ANARI animation and glTF integration](/docs/api-reference/anari/anari-animation) for retained
playback and optional glTF adapter details.
