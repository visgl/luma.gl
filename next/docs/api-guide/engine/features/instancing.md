# Mesh instancing

Instancing draws many placements of shared geometry with one draw per compatible primitive instead of duplicating models.

The **SimpleInstancing** sample demonstrates this capability. Drag to orbit and scroll to zoom.

### SimpleInstancing

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

Engine `Model` supports instanced attributes and an `instanceCount`. The glTF adapter creates those instanced models automatically from authored transforms. `getGLTFNodeInstancing()` exposes resolved matrices and source attributes for inspection or a custom integration.

```
import {createScenegraphsFromGLTF, getGLTFNodeInstancing} from '@luma.gl/gltf';



const scenegraphs = createScenegraphsFromGLTF(device, gltf);

for (const sourceNode of gltf.nodes || []) {

  const instancing = getGLTFNodeInstancing(gltf, sourceNode);

  if (instancing) {

    console.log(instancing.matrices.length, instancing.attributes);

  }

}
```

Authored instances share render state. Independent skeletal animation uses the [animated crowd API](https://luma.gl/next/docs/api-reference/gltf/gltf-animated-crowd.md) rather than ordinary static instancing.

## glTF support[​](#gltf-support "Direct link to glTF support")

`EXT_mesh_gpu_instancing` supplies accessor-backed transforms and custom `_NAME` attributes. Each source primitive becomes one instanced model on WebGPU and WebGL. See [native glTF extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md).

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
