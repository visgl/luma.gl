# Native glTF Extensions

[Overview](https://luma.gl/next/docs/api-reference/gltf.md)[Materials](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md)[Native Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md)[Animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md)[Animated Crowd](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md)[Interchange](https://luma.gl/next/docs/api-reference/gltf/gltf-interchange.md)[Extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md)

glTF extensions should describe what an asset actually does, not merely which JSON properties survived loading. `@luma.gl/gltf` connects authored material variants, GPU instance transforms, recursive node visibility, typed animation pointers, and required-extension capabilities to the existing luma.gl scenegraph and animation runtime.

The implementation remains format-owned: `@loaders.gl/gltf` reads and postprocesses the asset, `@luma.gl/gltf` resolves glTF extension semantics, and `@luma.gl/engine` owns generic scenegraph, model, and animation behavior. There is no parallel loader, material system, or renderer.

## Load a standards-native scene[​](#load-a-standards-native-scene "Direct link to Load a standards-native scene")

```
import {load} from '@loaders.gl/core';

import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';

import {createScenegraphsFromGLTF} from '@luma.gl/gltf';



const asset = await load('/models/product.glb', GLTFLoader);

const gltf = postProcessGLTF(asset);



const scenegraphs = createScenegraphsFromGLTF(device, gltf, {

  strictExtensions: true,

  useByteColors: false

});



console.log(scenegraphs.variants.names);

console.log(scenegraphs.extensionSupport);

console.log(scenegraphs.animations.map(animation => animation.name));
```

`postProcessGLTF()` is explicit: loaders.gl v4 does not support the historical `{gltf: {postProcess: true}}` loader option. Use `useByteColors: false` when consuming punctual light colors as glTF-authored linear RGB values. Strict extension handling is described below.

| Extension                  | Runtime behavior                                                        | Scenegraph access                                          |
| -------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| `KHR_materials_variants`   | Selects authored materials without replacing scene nodes.               | `scenegraphs.variants`                                     |
| `EXT_mesh_gpu_instancing`  | Draws authored mesh instances in a single instanced draw per primitive. | `getGLTFNodeInstancing(gltf, node)`                        |
| `KHR_node_visibility`      | Recursively hides descendants and attached punctual lights.             | `scenegraphs.gltfNodeIndexToNodeMap`                       |
| `KHR_animation_pointer`    | Drives node, material, texture, camera, and punctual-light properties.  | `scenegraphs.animations` and `scenegraphs.animator`        |
| `KHR_materials_dispersion` | Preserves and animates physically based chromatic dispersion.           | Canonical material uniforms and material-pointer channels. |

## Material variants[​](#material-variants "Direct link to Material variants")

`KHR_materials_variants` stores application-visible variant names at the document root and maps individual mesh primitives to alternate source materials:

```
{

  "extensions": {

    "KHR_materials_variants": {

      "variants": [{"name": "Midnight"}, {"name": "Sunrise"}]

    }

  },

  "meshes": [

    {

      "primitives": [

        {

          "material": 0,

          "extensions": {

            "KHR_materials_variants": {

              "mappings": [

                {"material": 1, "variants": [0]},

                {"material": 2, "variants": [1]}

              ]

            }

          }

        }

      ]

    }

  ]

}
```

The scenegraph exposes one format-aware controller:

```
const {variants} = scenegraphs;



console.log(variants.names); // ['Midnight', 'Sunrise']

console.log(variants.activeVariant); // null



variants.selectVariant('Midnight');

console.log(variants.activeVariant); // 'Midnight'



variants.selectVariant('Sunrise');

variants.resetVariant();



console.log(variants.activeVariant); // null
```

Selection preserves existing `GroupNode`, `ModelNode`, and `Model` identities. Each mapped primitive receives its authored material and source-derived pipeline parameters; primitives without a mapping for the selected variant return to their original material. Unknown names are rejected before any primitive changes.

The parsed definitions are also available in authored order:

```
for (const variant of scenegraphs.variants.variants) {

  console.log(variant.index, variant.name);

}
```

**Material-layout constraint:** selection updates existing material and pipeline state; it does not rebuild an existing model's shader feature layout. Alternate materials should remain compatible with the primitive's original shader specialization, particularly when introducing a previously absent texture or alpha-cutoff define.

## Mesh GPU instancing[​](#mesh-gpu-instancing "Direct link to Mesh GPU instancing")

`EXT_mesh_gpu_instancing` associates accessor-backed transforms with a source mesh node. Each source primitive becomes one real instanced model on WebGL and WebGPU:

```
{

  "nodes": [

    {

      "mesh": 0,

      "extensions": {

        "EXT_mesh_gpu_instancing": {

          "attributes": {

            "TRANSLATION": 3,

            "ROTATION": 4,

            "SCALE": 5,

            "_FEATURE_ID": 6

          }

        }

      }

    }

  ]

}
```

Inspect resolved instance transforms and exact authored accessor metadata:

```
import {getGLTFNodeInstancing} from '@luma.gl/gltf';



const instancing = getGLTFNodeInstancing(gltf, gltf.nodes[0]);



if (instancing) {

  console.log(instancing.matrices.length);

  console.log(instancing.matrices[0]);



  for (const [semantic, attribute] of Object.entries(instancing.attributes)) {

    console.log(semantic, {

      values: attribute.value,

      components: attribute.size,

      count: attribute.count,

      normalized: attribute.normalized

    });

  }

}
```

Omitted translation, rotation, and scale components receive their glTF identity defaults. Signed and unsigned normalized integer accessors are decoded correctly, and authored quaternions are normalized before matrix composition. Mismatched accessor counts fail instead of producing partial or incorrectly indexed draws.

Generated model nodes expose the same underlying instance data:

```
import {ModelNode} from '@luma.gl/engine';



scenegraphs.scenes[0].traverse(node => {

  if (node instanceof ModelNode && node.model.isInstanced) {

    console.log(node.model.instanceCount);

    console.log(node.instanceMatrices);

  }

});
```

Each instance matrix is uploaded through four per-instance vector attributes. Bounds include every instance, so `scenegraphs.modelBounds` and `scenegraphs.sceneBounds` remain useful for initial camera framing. Custom `_NAME` accessors are preserved in `instancing.attributes`; applications must explicitly bind custom semantics if their own shaders consume them.

Instancing reduces repeated mesh draws, not the number of distinct source primitives: a mesh with three primitives still produces three instanced draws.

## Recursive node visibility[​](#recursive-node-visibility "Direct link to Recursive node visibility")

`KHR_node_visibility` contributes its authored boolean directly to the existing generic `GroupNode.display` state:

```
{

  "nodes": [

    {

      "children": [1, 2],

      "extensions": {

        "KHR_node_visibility": {"visible": false}

      }

    },

    {"mesh": 0},

    {"extensions": {"KHR_lights_punctual": {"light": 0}}}

  ]

}
```

The entire descendant subtree is hidden during rendering. Punctual lights attached anywhere inside that subtree are omitted from `scenegraphs.lights`:

```
const node = scenegraphs.gltfNodeIndexToNodeMap.get(0);



console.log(node?.display); // false

console.log(scenegraphs.lights.length); // excludes hidden descendants
```

`GroupNode.traverse()` skips hidden nodes and descendants. `preorderTraversal()` deliberately retains structural traversal, allowing applications and internal controllers to inspect or update hidden nodes. `GroupNode.getBounds()` follows visible traversal; the initial `scenegraphs.sceneBounds` and `scenegraphs.modelBounds` are load-time snapshots.

### Animate visibility[​](#animate-visibility "Direct link to Animate visibility")

The ratified pointer targets the extension's boolean field:

```
{

  "samplers": [{"input": 0, "output": 1, "interpolation": "STEP"}],

  "channels": [

    {

      "sampler": 0,

      "target": {

        "path": "pointer",

        "extensions": {

          "KHR_animation_pointer": {

            "pointer": "/nodes/3/extensions/KHR_node_visibility/visible"

          }

        }

      }

    }

  ]

}
```

Boolean visibility requires `STEP` interpolation. When a visibility channel evaluates, `GLTFAnimator` updates the existing node and refreshes punctual lights in place: the `scenegraphs.lights` array keeps its identity while its contents reflect the newly visible scene.

```
const originalLights = scenegraphs.lights;



scenegraphs.animator.setTime(1000);



console.log(scenegraphs.gltfNodeIndexToNodeMap.get(3)?.display);

console.log(scenegraphs.lights === originalLights); // true
```

Changing `node.display` directly affects generic scenegraph traversal, but does not automatically refresh a previously parsed punctual-light array. The glTF animation controller handles that refresh for source-authored visibility channels.

## Typed animation pointers[​](#typed-animation-pointers "Direct link to Typed animation pointers")

`KHR_animation_pointer` targets precise JSON properties while reusing the existing shared `AnimationSampler`, `AnimationTrack`, `AnimationClip`, and `AnimationMixer` implementations.

| Target family        | Example pointer                                                                                | Result                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Node transform       | `/nodes/2/translation`                                                                         | Updates the existing node transform.             |
| Morph weights        | `/nodes/2/weights`                                                                             | Updates existing morph vertex buffers.           |
| Recursive visibility | `/nodes/2/extensions/KHR_node_visibility/visible`                                              | Updates `display` and refreshes punctual lights. |
| Perspective camera   | `/cameras/0/perspective/yfov`                                                                  | Updates a runtime projection copy.               |
| Orthographic camera  | `/cameras/1/orthographic/xmag`                                                                 | Updates a runtime projection copy.               |
| Light intensity      | `/extensions/KHR_lights_punctual/lights/0/intensity`                                           | Refreshes the corresponding runtime light.       |
| Light RGB channel    | `/extensions/KHR_lights_punctual/lights/0/color/2`                                             | Updates one authored linear color component.     |
| Spotlight cone       | `/extensions/KHR_lights_punctual/lights/0/spot/innerConeAngle`                                 | Preserves distinct inner and outer cones.        |
| Chromatic dispersion | `/materials/0/extensions/KHR_materials_dispersion/dispersion`                                  | Updates the canonical physical-material uniform. |
| Texture transform    | `/materials/0/pbrMetallicRoughness/baseColorTexture/extensions/KHR_texture_transform/offset/0` | Updates the existing material's UV transform.    |

Supported perspective properties are `aspectRatio`, `yfov`, `znear`, and `zfar`; orthographic properties are `xmag`, `ymag`, `znear`, and `zfar`. Punctual lights support `color`, individual RGB components, `intensity`, `range`, `innerConeAngle`, and `outerConeAngle`.

Camera projections are cloned into `scenegraphs.cameras` before animation. Light definitions are also copied, and the exported light array is refreshed in place. Animation therefore never mutates the original postprocessed glTF camera or light document.

### Inspect discriminated channel types[​](#inspect-discriminated-channel-types "Direct link to Inspect discriminated channel types")

```
import {

  parseGLTFAnimations,

  type GLTFCameraAnimationChannel,

  type GLTFLightAnimationChannel

} from '@luma.gl/gltf';



for (const animation of parseGLTFAnimations(gltf)) {

  for (const channel of animation.channels) {

    if (channel.type === 'camera') {

      const cameraChannel: GLTFCameraAnimationChannel = channel;

      console.log(cameraChannel.targetCameraIndex, cameraChannel.projection, cameraChannel.property);

    }



    if (channel.type === 'light') {

      const lightChannel: GLTFLightAnimationChannel = channel;

      console.log(lightChannel.targetLightIndex, lightChannel.property, lightChannel.component);

    }



    if (channel.type === 'material' && channel.property === 'dispersion') {

      console.log(channel.targetMaterialIndex, channel.pointer);

    }

  }

}
```

Physical dispersion is meaningful when the source material enables its authored `KHR_materials_dispersion` extension. The shared experimental `SceneRenderer` and ANARI facade combine the animated canonical uniform with captured opaque-scene refraction. The standalone glTF model path preserves and animates the same factor but does not capture scene color.

See [glTF animation and deformation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md) for clip selection, crossfading, automatic skin palettes, and morph-target playback.

## Strict extension capability checks[​](#strict-extension-capability-checks "Direct link to Strict extension capability checks")

The glTF distinction between `extensionsUsed` and `extensionsRequired` matters: optional unsupported features may degrade gracefully, while required unsupported features should reject the asset before GPU models are created.

```
import {

  assertSupportedGLTFExtensions,

  getGLTFExtensionSupport,

  getUnsupportedRequiredGLTFExtensions

} from '@luma.gl/gltf';



const support = getGLTFExtensionSupport(gltf);



for (const extension of support.values()) {

  console.log({

    name: extension.extensionName,

    required: extension.required,

    supported: extension.supported,

    level: extension.supportLevel,

    explanation: extension.comment

  });

}



const unsupportedRequired = getUnsupportedRequiredGLTFExtensions(gltf);



if (unsupportedRequired.length > 0) {

  assertSupportedGLTFExtensions(gltf);

}
```

`createScenegraphsFromGLTF(device, gltf, {strictExtensions: true})` performs the same assertion **before** parsing GPU resources. The returned `scenegraphs.extensionSupport` is the same document-specific capability model.

| Support level      | Meaning                                                                 | Accepted when required? |
| ------------------ | ----------------------------------------------------------------------- | ----------------------- |
| `built-in`         | A complete decoder or runtime path handles the feature.                 | Yes                     |
| `parsed-and-wired` | Parsed source data is connected to the existing runtime.                | Yes                     |
| `loader-only`      | Loader data survives, but device/application support is not guaranteed. | No                      |
| `none`             | No complete built-in runtime behavior is available.                     | No                      |

For example, required `KHR_node_visibility`, `EXT_mesh_gpu_instancing`, material variants, and physically implemented `KHR_materials_dispersion` pass strict checks. A required unknown vendor extension fails. Required WebP or AVIF texture extensions remain conservative because image decode support depends on the browser/device combination.

Capability collection includes declared used/required extensions, source root extension entries, extensions moved during loaders.gl postprocessing, and detected punctual lights.

## Automatic animation and deformation integration[​](#automatic-animation-and-deformation-integration "Direct link to Automatic animation and deformation integration")

Native pointers participate in the same animation frame as transforms, skinning, and morphing:

```
scenegraphs.animator.selectClip('Walk');

scenegraphs.animator.selectClip('Run', {crossFadeDuration: 0.35});



function renderFrame(timestampMilliseconds: number): void {

  scenegraphs.animator.setTime(timestampMilliseconds);



  for (const binding of scenegraphs.skins.bindings) {

    console.log(binding.nodeIndex, binding.joints.length, binding.jointMatrices);

  }



  requestAnimationFrame(renderFrame);

}
```

`setTime()` accepts absolute milliseconds; `selectClip()` crossfade duration and `animator.update(deltaSeconds)` use seconds. Imported skin palettes are updated automatically once after all channels evaluate, using existing mesh-local joint matrices and the canonical shared skin shader. `scenegraphs.skins.getBinding(nodeIndex)` exposes a specific reusable skin binding.

## Official fixture coverage[​](#official-fixture-coverage "Direct link to Official fixture coverage")

The runtime is tested against compact, unmodified CC0 assets from Khronos glTF Sample Assets, pinned to source commit `2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf`:

| Official fixture       | Size   | What is checked                                                                                                             |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `SimpleInstancing.glb` | 7.2 KB | Real WebGL/WebGPU instanced draws, source TRS accessors, instance counts, matrices, and aggregate bounds.                   |
| `CubeVisibility.glb`   | 3.2 KB | Recursive hidden meshes, boolean `STEP` animation, strict capability checks, and derived variant/dispersion mutation cases. |
| `LightVisibility.glb`  | 2.9 KB | Recursive hidden punctual lights, stable light arrays, animated camera projections, and authored light properties.          |

CPU tests inspect parsed source behavior and scenegraph identity using `NullDevice`. Browser tests execute real WebGL and WebGPU draw calls against the same official instancing fixture. Mutation tests derive material-variant and camera/light/dispersion-pointer cases from the small official documents instead of adding large synthetic assets.

The fixture attribution and pinned source revision are recorded in `modules/gltf/test/data/README.md`.

## Architecture and ownership[​](#architecture-and-ownership "Direct link to Architecture and ownership")

| Package                 | Responsibility                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@loaders.gl/gltf`      | Container decoding, accessor/image decoding, and explicit glTF postprocessing.                                |
| `@luma.gl/gltf`         | Extension interpretation, source-material mappings, typed pointers, skin ownership, and capability reporting. |
| `@luma.gl/engine`       | Generic `GroupNode` visibility, reusable `Model` instancing, animation mixing, and deformation utilities.     |
| `@luma.gl/shadertools`  | Canonical PBR material uniforms, physical shading, and reusable skinning.                                     |
| `@luma.gl/experimental` | Optional format-independent physical scene rendering and captured-scene transmission.                         |
| `@luma.gl/anari`        | Optional thin retained-object orchestration through `@luma.gl/anari/gltf`; no loader or BRDF ownership.       |

The core ANARI package does not import glTF. Its optional glTF adapter imports the existing glTF parsers and engine animation primitives. Camera, punctual-light, and visibility pointer playback currently belongs to the canonical glTF scenegraph; the thin ANARI animation adapter safely ignores unsupported target families instead of creating an independent extension runtime.

## Boundaries and current limitations[​](#boundaries-and-current-limitations "Direct link to Boundaries and current limitations")

* Visibility booleans require `STEP`; interpolating a boolean channel is invalid.
* Texture transforms support `TEXCOORD_0` and `TEXCOORD_1`, not animated `texCoord` or `TEXCOORD_2+`.
* Structural material switches such as `alphaMode`, `doubleSided`, and `unlit` are not animation pointer targets.
* Material variants do not construct a new shader feature layout when the alternate material adds previously absent texture bindings.
* Custom `_NAME` instance accessors remain available without being automatically bound to a custom shader.
* Standalone glTF scenegraphs do not own an opaque-scene capture pass; true transmitted scene-color refraction is provided by the shared experimental renderer and ANARI facade.
* Generic `extras`, unsupported vendor metadata, automatic image-based-light extension ingestion, and video-texture extensions are not silently presented as supported required features.

For the complete extension-by-extension capability matrix, see [glTF extension support](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md).
