# ANARI Scene Schemas

![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)![Private workspace](https://img.shields.io/badge/Availability-Private-red.svg?style=flat-square)![From-v10](https://img.shields.io/badge/From-v10-blue.svg?style=flat-square)

`@luma.gl/anari/schemas` exposes optional Zod schemas for the experimental retained-scene JSON format and generates a JSON Schema suitable for Monaco, VS Code, and other schema-aware editors. It is separate from the ordinary `@luma.gl/anari` entry point, so applications that only render scenes do not load Zod.

Experimental scene format

These schemas describe the private luma.gl ANARI playground format. They are not an official ANARI serialization standard, and their structure can change with the experimental package.

## Imports[​](#imports "Direct link to Imports")

```
import {

  ANARIVector3Schema,

  ANARIVector4Schema,

  ANARIMatrix4Schema,

  ANARIGeometryGeneratorSchema,

  ANARIGeometrySchema,

  ANARITextureSchema,

  ANARIMaterialSchema,

  ANARIAnimationSchema,

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

## Exported schemas[​](#exported-schemas "Direct link to Exported schemas")

| Export                         | Validates                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ANARIVector3Schema`           | Three finite XYZ, direction, scale, or linear RGB components.                                          |
| `ANARIVector4Schema`           | Four finite RGBA components.                                                                           |
| `ANARIMatrix4Schema`           | Sixteen finite column-major transform-matrix values.                                                   |
| `ANARIGeometryGeneratorSchema` | Procedural `torus`, `crystal`, and `prism` generators.                                                 |
| `ANARIGeometrySchema`          | `triangle`, `sphere`, `cylinder`, `cone`, and `quad` geometries.                                       |
| `ANARITextureSchema`           | Retained image source, color space, and optional UV transform.                                         |
| `ANARIMaterialSchema`          | `matte` and `physicallyBased` materials and bounded material properties.                               |
| `ANARIAnimationSchema`         | `orbit`, `bob`, `spin`, `wobble`, `pulse`, and `follow` animations.                                    |
| `ANARILightSchema`             | `ambient`, `directional`, `point`, and `spot` lights.                                                  |
| `ANARICameraSchema`            | `perspective` and `orthographic` cameras.                                                              |
| `ANARIRendererSchema`          | Optional renderer preset configuration for `default`, `deferred`, `debugNormals`, and `debugDepth`.    |
| `ANARISurfaceSchema`           | Named geometry/material pairings.                                                                      |
| `ANARIGroupSchema`             | Reusable retained surfaces and optional lights.                                                        |
| `ANARIInstanceSchema`          | Named transform placements and composable animations.                                                  |
| `ANARIStarfieldSchema`         | Deterministic retained background-star distributions.                                                  |
| `ANARISceneSchema`             | A renderer-independent scene and its cross-object semantic references, plus optional renderer presets. |
| `ANARI_SCENE_JSON_SCHEMA`      | Draft-07 JSON Schema generated from `ANARISceneSchema`.                                                |
| `ANARISceneDescription`        | TypeScript scene type inferred from `ANARISceneSchema`.                                                |

Each object schema uses a strict property set and discriminates supported subtypes through its `@@type` property. Numeric constraints reject invalid radii, segment counts, roughness, metallic values, light intensities, camera distances, and similar unsupported values.

## Validate a scene[​](#validate-a-scene "Direct link to Validate a scene")

```
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

* Surfaces reference existing named geometries and materials.
* Material texture properties reference existing named textures.
* Groups reference existing surfaces and lights.
* Instances have unique identifiers and reference existing groups or surfaces.
* Starfield distributions reference existing surfaces.
* Animated lights follow existing named instances.

Zod issues include the exact object/property path, allowing editors to display error indicators on the invalid retained reference rather than only reporting a generic scene-level failure.

## Generate editor diagnostics[​](#generate-editor-diagnostics "Direct link to Generate editor diagnostics")

`ANARI_SCENE_JSON_SCHEMA` is generated directly from the Zod schema with `z.toJSONSchema(ANARISceneSchema, {target: 'draft-07', reused: 'ref'})`. Its identifier is `https://luma.gl/schemas/anari-scene.json`.

Register the generated schema with Monaco's JSON language service:

```
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

JSON Schema supplies syntax diagnostics, subtype-aware autocomplete, property documentation, and numeric constraints. Run `ANARISceneSchema.safeParse()` separately to add the semantic retained reference checks that cannot be expressed by ordinary JSON Schema alone.

The [ANARI developer guide](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md#validate-scenes-with-zod-and-json-schema) and [JSON scene playground](https://luma.gl/next/docs/api-guide/engine/anari-rendering.md#explore-the-json-scene-playground) show how these schemas integrate with live scene editing.
