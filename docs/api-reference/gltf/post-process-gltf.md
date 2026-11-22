# postProcessGLTF

`postProcessGLTF(source: GLTFWithBuffers): GLTFPostprocessed` synchronously prepares decoded
glTF data for rendering. It resolves numeric references, supplies rendering defaults and IDs,
and materializes accessor values. Import the function and resolved `GLTF*Postprocessed` types
from `@luma.gl/engine/gltf`.

## Usage

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {postProcessGLTF} from '@luma.gl/engine/gltf';

const source = await load('/model.glb', GLTFLoader);
const resolved = postProcessGLTF(source);
for (const node of resolved.scene?.nodes || []) {
  for (const primitive of node.mesh?.primitives || []) {
    const positions = primitive.attributes.POSITION.value;
  }
}
```

The decoder is optional. Ordinary glTF JSON and caller-supplied resources also work:

```ts
const resolved = postProcessGLTF({
  json: document,
  buffers: [{arrayBuffer: geometryBytes, byteOffset: 0, byteLength: geometryBytes.byteLength}],
  images: decodedImages,
  baseUri: '/models/'
});
```

## Input and resource ownership

`GLTFWithBuffers` contains standard indexed `json`, resolved `buffers`, optional `images`, and an
optional `baseUri`. Each loaded buffer supplies an `arrayBuffer`, `byteOffset`, and `byteLength`.
Load/decode all referenced resources before calling this function. It does not fetch resources,
decode Draco or meshopt, transcode textures, or write GLB files. Those operations remain loader-owned.

Source JSON and borrowed bytes/images remain unchanged. Accessors backed by buffer views always
materialize packed values in new storage, including tightly packed inputs. Decoder-provided `value`
arrays are reused unless sparse replacements require a copy. Sparse replacements never change
borrowed storage, including decoder-provided values and Node buffers.
Retain the original indexed container for editing, conversion, or serialization.

## Resolved output

- Scene/node/mesh/skin/camera links become object references. `scene` refers to the default scene.
- Resolved scene objects receive stable IDs when absent. Document and animation IDs remain optional.
- Buffers retain source metadata and loaded ranges, including extension-generated buffers.
- Buffer views expose byte ranges as `bufferView.data` (`Uint8Array`).
- Accessors expose typed `value` arrays and `components`, `bytesPerComponent`, and `bytesPerElement`.
  Omitted buffer views supply implicit zeros; sparse substitutions apply to the base values.
  Normalization flags remain metadata; integer values are not converted to normalized floats.
- Images borrow decoded resources in `image.image`. Missing resources remain `null`; relative URIs
  remain unchanged; callers must resolve relative URIs themselves. Draft glTF 2.1 `asset.thumbnail`
  resolves to its image object.
- Texture `source` and `sampler` resolve to image and sampler objects. Missing samplers receive a
  default. Sampler `parameters` use WebGL numeric constants for filters and wrapping.
- Material texture-info objects retain their numeric `index` and add a resolved `texture` reference.
  Emissive factors default to zero, including when only an emissive texture is authored.
- Unknown extension payloads, including interactivity graphs, retain their numeric indices and data.

Draft component types use `Int32Array`, `Float64Array`, `BigInt64Array`, or `BigUint64Array` as
appropriate. Half floats use native `Float16Array` when available and otherwise preserve binary16
words in `Uint16Array`.

## Portable topology

WebGPU does not support `LINE_LOOP` or `TRIANGLE_FAN`. Postprocessing expands them to indexed
`LINES` and `TRIANGLES`, preserving winding and source data. Both indexed and non-indexed
primitives work, including implicit-zero and sparse index accessors. Generated indices use
`Uint16Array` or `Uint32Array` according to the largest referenced vertex.

## Migration from loaders.gl

Replace imports of `postProcessGLTF` and `GLTF*Postprocessed` types from `@loaders.gl/scene/gltf` with
imports from `@luma.gl/engine/gltf`. Pass the `GLTFLoader` result directly to the luma.gl function.
For loader-side traversal, writing, or conversion, keep the indexed document and use loaders.gl’s
accessor helpers or `GLTFIterator` instead of creating a resolved rendering document.
