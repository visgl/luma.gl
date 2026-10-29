<a href="https://www.khronos.org/gltf/">
  <img
    src="https://raw.githubusercontent.com/visgl/luma.gl/master/website/static/img/standards/gltf.svg"
    alt="glTF"
    width="180"
  />
</a>

# @luma.gl/engine/gltf

Standards-first glTF assets with physically based materials, animated skeletons, morph deformation,
native animation pointers, and source-faithful rendering on WebGPU and WebGL.

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {createScenegraphsFromGLTF, postProcessGLTF} from '@luma.gl/engine/gltf';

const asset = await load('/models/model.glb', GLTFLoader);
const gltf = postProcessGLTF(asset);

const {scenes, animator, lights, modelBounds} = createScenegraphsFromGLTF(device, gltf, {
  useTangents: true,
  useByteColors: false
});

animator.setTime(performance.now());

```

The module preserves all 21 supported core/PBR-extension texture slots, sampler filters and
mipmaps, independent UV transforms and `TEXCOORD_1`, authored punctual lights, node transforms,
material/texture animation pointers, skin attributes, and animated morph targets.
Asset export lives in the shared `examples/gltf/gltf-exporter.ts` application helper.

`@loaders.gl/scene/gltf` owns `.gltf` / `.glb` parsing, linked buffers and images, Draco and
`EXT_meshopt_compression` and `KHR_meshopt_compression` decoding, Basis/KTX2 and supported WebP
texture selection, feature/structural metadata decoding, and GLB
container encoding. Applications own those loader dependencies; `@luma.gl/engine/gltf` has none.
`postProcessGLTF()` and its types are owned by luma.gl. Automatic `EXT_texture_avif` source selection will arrive with the next
loaders.gl v5 alpha release. Generic animation, scenegraph, and morph primitives remain in
`@luma.gl/engine`; shared PBR, lighting, and skinning shaders remain in `@luma.gl/shaders`.

- [glTF API overview](https://luma.gl/docs/api-reference/gltf)
- [Materials, textures, and lighting](https://luma.gl/docs/api-reference/gltf/gltf-materials)
- [Animation and deformation](https://luma.gl/docs/api-reference/gltf/gltf-animation)
- [Asset interchange and GLB export](https://luma.gl/docs/api-reference/gltf/gltf-interchange)
- [glTF extension support](https://luma.gl/docs/api-reference/gltf/gltf-extensions)
