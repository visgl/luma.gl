# Scene visibility

Hide a scene subtree while preserving its hierarchy and resources for later reuse.

### CubeVisibility

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/tutorials/hello-gltf)Info

InfoSource

Mobile

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

Engine scenegraph nodes expose `display` and `setProps({display})`. Visible traversal skips hidden nodes and their descendants, while structural traversal can still inspect them. Imported nodes are available through `scenegraphs.gltfNodeIndexToNodeMap`; source node indices are asset-specific.

```
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';



const scenegraphs = createScenegraphsFromGLTF(device, gltf);

const sourceNode = scenegraphs.gltfNodeIndexToNodeMap.get(0);

if (sourceNode) {

  sourceNode.setProps({display: false});

  // Restore this subtree when needed.

  sourceNode.setProps({display: true});

}
```

## glTF support[​](#gltf-support "Direct link to glTF support")

`KHR_node_visibility` initializes recursive visibility. `KHR_animation_pointer` can animate its boolean `visible` property with `STEP` interpolation. Authored visibility animation also refreshes the existing `scenegraphs.lights` array to omit hidden punctual lights. A manual `display` update only changes scenegraph visibility; applications managing lights separately must refresh them too. Bounds stored in `sceneBounds` and `modelBounds` are load-time snapshots.

See [native glTF extensions](https://luma.gl/next/docs/api-reference/gltf/gltf-native-extensions.md).

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
