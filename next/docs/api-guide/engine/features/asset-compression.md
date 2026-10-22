# Compressed geometry and textures

Compressed geometry and textures reduce asset transfer size and can reduce GPU texture storage when the device supports the resulting format.

The **ABeautifulGame** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### ABeautifulGame

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

`createScenegraphsFromGLTF()` consumes postprocessed loader output. Use `getGLTFExtensionSupport()` to inspect document capabilities and `strictExtensions: true` to reject unsupported required extensions before GPU scene creation. Compression decoding belongs to the loader; GPU texture upload belongs to the runtime adapter.

```
import {createScenegraphsFromGLTF, getGLTFExtensionSupport} from '@luma.gl/gltf';



// gltf is decoded and postprocessed by @loaders.gl/gltf.

for (const capability of getGLTFExtensionSupport(gltf).values()) {

  console.log(capability.extensionName, capability.supportLevel);

}

const scenegraphs = createScenegraphsFromGLTF(device, gltf, {

  strictExtensions: true

});
```

BasisU upload checks device format support. Optional unsupported formats use a fallback, while required unsupported formats fail strict checks. WebP depends on browser decoding; `EXT_texture_avif` source selection is unsupported by the installed glTF loader.

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_draco_mesh_compression`, `EXT_meshopt_compression`, and `KHR_meshopt_compression` route through loader decoding. `KHR_mesh_quantization` preserves compact vertex representations. `KHR_texture_basisu` supplies BasisU/KTX2 texture sources; WebP source selection uses `EXT_texture_webp`. The embedded sample opens the Draco/KTX2 variant of ABeautifulGame.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
