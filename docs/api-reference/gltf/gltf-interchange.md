# glTF Asset Interchange

[Overview](https://luma.gl/docs/api-reference/gltf.md)[Materials](https://luma.gl/docs/api-reference/gltf/gltf-materials.md)[Native Extensions](https://luma.gl/docs/api-reference/gltf/gltf-native-extensions.md)[Animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md)[Animated Crowd](https://luma.gl/docs/api-reference/gltf/gltf-animated-crowd.md)[Interchange](https://luma.gl/docs/api-reference/gltf/gltf-interchange.md)[Extensions](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md)

`@luma.gl/gltf` owns format-native scene interchange. `exportGLTF()` writes standards-conformant embedded `.gltf` documents or aligned binary `.glb` assets without depending on an application renderer, an ANARI device, or browser-specific GPU resources.

The same descriptors preserve authored node hierarchies, skins, inverse bind matrices, morph targets, animation clips, material-animation pointers, GPU instancing, variants, cameras, punctual-light extensions, and complete physical material records.

## Export a scene[​](#export-a-scene "Direct link to Export a scene")

```
import {exportGLTF, type GLTFExportScene} from '@luma.gl/gltf';



const scene: GLTFExportScene = {

  name: 'Animated character',

  nodes: [

    {name: 'Root', children: [1]},

    {name: 'Character', mesh: 0, weights: [0, 1]}

  ],

  meshes: [

    {

      name: 'Character mesh',

      weights: [0, 1],

      primitives: [

        {

          attributes: {

            POSITION: {

              data: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),

              size: 3

            },

            COLOR_0: {

              data: new Float32Array([1, 0, 0, 1, 0, 1, 0, 0.5, 0, 0, 1, 1]),

              size: 4

            }

          },

          indices: {data: new Uint16Array([0, 1, 2]), size: 1},

          material: 0

        }

      ]

    }

  ],

  materials: [

    {

      pbrMetallicRoughness: {

        baseColorFactor: [0.8, 0.5, 0.3, 1],

        metallicFactor: 0.2,

        roughnessFactor: 0.4

      }

    }

  ]

};



const gltf: string = exportGLTF(scene);

const glb: ArrayBuffer = exportGLTF(scene, {binary: true});
```

JSON assets embed their geometry in a `data:` URI. GLB assets contain correctly padded JSON and binary chunks. Both formats can be loaded again using the existing loaders.gl `GLTFLoader`.

## Geometry and typed accessors[​](#geometry-and-typed-accessors "Direct link to Geometry and typed accessors")

Every attribute retains its original glTF semantic. Do not replace source attribute keys with shader-facing aliases.

```
const attributes = {

  POSITION: {data: new Float32Array(positions), size: 3},

  NORMAL: {data: new Float32Array(normals), size: 3},

  TANGENT: {data: new Float32Array(tangents), size: 4},

  TEXCOORD_0: {data: new Float32Array(textureCoordinates), size: 2},

  TEXCOORD_1: {data: new Float32Array(additionalTextureCoordinates), size: 2},

  COLOR_0: {data: new Float32Array(vertexColors), size: 4},

  JOINTS_0: {data: new Uint16Array(jointIndices), size: 4},

  WEIGHTS_0: {data: new Uint8Array(jointWeights), size: 4, normalized: true},

  _TEMPERATURE: {data: new Float32Array(temperatures), size: 1}

};
```

The writer preserves authored component types, integer normalization, custom `_NAME` semantics, RGBA vertex colors, tangent handedness, and aligned buffer views. Position bounds are generated automatically unless explicit `min` and `max` values are supplied.

Sparse attributes preserve both their base values and sparse overrides:

```
const sparseAttribute = {

  data: new Float32Array([0, 0, 0]),

  size: 1,

  sparse: {

    indices: new Uint16Array([1]),

    values: new Float32Array([42])

  }

};
```

## Skins and morph targets[​](#skins-and-morph-targets "Direct link to Skins and morph targets")

Attach an existing glTF skin to the relevant node; joint indices address exported nodes.

```
const skinnedScene = {

  nodes: [

    {name: 'Root', children: [1, 2]},

    {name: 'Character', mesh: 0, skin: 0},

    {name: 'Joint'}

  ],

  skins: [

    {

      name: 'Character skeleton',

      joints: [2],

      skeleton: 2,

      inverseBindMatrices: {

        data: new Float32Array(inverseBindMatrices),

        size: 16

      }

    }

  ]

};
```

Primitive morph targets retain `POSITION`, `NORMAL`, and three-component `TANGENT` displacements. Base tangents remain four-component vectors so their handedness is not lost.

## Animation and animation pointers[​](#animation-and-animation-pointers "Direct link to Animation and animation pointers")

Use normal node targets for translation, rotation, scale, and morph weights. Use a pointer target to preserve a standards-native `KHR_animation_pointer` channel.

```
const animation = {

  name: 'Animated roughness',

  samplers: [

    {

      input: {data: new Float32Array([0, 1]), size: 1},

      output: {data: new Float32Array([0.2, 0.8]), size: 1},

      interpolation: 'LINEAR'

    }

  ],

  channels: [

    {

      sampler: 0,

      target: {

        path: 'pointer',

        pointer: '/materials/0/pbrMetallicRoughness/roughnessFactor'

      }

    }

  ]

};
```

Morph samplers preserve the glTF requirement that multi-target weight outputs remain flattened `SCALAR` accessors. The writer automatically discovers extension usage in material records, animation channels, primitive variant mappings, node instancing, and root extensions.

## Images, materials, and extensions[​](#images-materials-and-extensions "Direct link to Images, materials, and extensions")

Material and sampler descriptors use their authored glTF JSON shape. This preserves all canonical PBR extension maps, texture-coordinate selection, wrapping, filtering, and `KHR_texture_transform` without introducing another material translation layer.

```
const image = {

  name: 'Base color',

  data: imageBytes,

  mimeType: 'image/png'

};



const instances = {

  TRANSLATION: {data: new Float32Array([0, 0, 0, 2, 0, 0]), size: 3},

  _BATCH_ID: {data: new Uint16Array([0, 1]), size: 1}

};
```

Image bytes become data URIs in JSON exports and embedded buffer views in GLB exports. Node `instances` become `EXT_mesh_gpu_instancing` accessors. Existing `KHR_materials_variants` records, punctual lights, cameras, and additional extension payloads remain intact.

## Resource ownership[​](#resource-ownership "Direct link to Resource ownership")

All descriptors and typed arrays remain owned by the caller. Export never destroys GPU resources, mutates source arrays, changes material objects, or depends on `@luma.gl/scene`.

Applications using the optional ANARI playground adapt their retained descriptions into these format-owned descriptors. That adapter preserves animated hierarchy, morph targets, joint attributes, compatible skin descriptions, material pointers, authored samplers, and all supported physical material slots.
