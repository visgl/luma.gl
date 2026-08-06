<a href="https://www.khronos.org/gltf/">
  <img
    src="https://raw.githubusercontent.com/visgl/luma.gl/master/website/static/img/standards/gltf.svg"
    alt="glTF"
    width="180"
  />
</a>

# @luma.gl/gltf

Standards-first glTF assets with physically based materials, animated skeletons, morph deformation,
native animation pointers, and source-faithful `.gltf` / `.glb` interchange on WebGPU and WebGL.

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF, exportGLTF} from '@luma.gl/gltf';

const asset = await load('/models/model.glb', GLTFLoader);
const gltf = postProcessGLTF(asset);

const {scenes, animator, lights, modelBounds} = createScenegraphsFromGLTF(device, gltf, {
  useTangents: true,
  useByteColors: false
});

animator.setTime(performance.now());

const exportScene = {name: 'Exported scene', nodes: [{name: 'Root'}]};
const gltfDocument = exportGLTF(exportScene);
const binaryAsset = exportGLTF(exportScene, {binary: true});
```

The module preserves all 17 supported core/PBR-extension texture slots, sampler filters and
mipmaps, independent UV transforms and `TEXCOORD_1`, authored punctual lights, node transforms,
material/texture animation pointers, skin attributes, and animated morph targets. Generic
`exportGLTF()` descriptors also preserve hierarchy, skins, inverse bind matrices, morph targets,
animation clips, variants, GPU instancing, cameras, lights, and source-faithful accessors.

`@loaders.gl/gltf` owns asset loading and decompression. Generic animation, scenegraph, and morph
primitives remain in `@luma.gl/engine`; shared PBR, lighting, and skinning shaders remain in
`@luma.gl/shadertools`.

- [glTF API overview](https://luma.gl/docs/api-reference/gltf)
- [Materials, textures, and lighting](https://luma.gl/docs/api-reference/gltf/gltf-materials)
- [Animation and deformation](https://luma.gl/docs/api-reference/gltf/gltf-animation)
- [Asset interchange and GLB export](https://luma.gl/docs/api-reference/gltf/gltf-interchange)
- [glTF extension support](https://luma.gl/docs/api-reference/gltf/gltf-extensions)
