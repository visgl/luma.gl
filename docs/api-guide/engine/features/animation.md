# Animation and deformation

Animation combines clip playback, skeletal deformation, and morph targets to bring characters and scene objects to life.

The **RobotExpressive** sample in the glTF Asset Studio demonstrates this capability. The embedded viewer opens that asset and retains the studio controls for exploring it.

### glTF Asset Studio

Physical materials · animated characters · standards-native glTF

[GitHub](https://github.com/visgl/luma.gl/tree/master/examples/gltf/asset-studio)Info

InfoSource

Mobile quality

```
// Loading source…
```

**Loading example**Preparing GPU resources…

Scroll page · Ctrl/⌘ + scroll to interact

## API[​](#api "Direct link to API")

The engine animation mixer underlies imported clip playback. The glTF adapter exposes it through `scenegraphs.animator`: `selectClip()` activates a source clip, `crossFadeDuration` is in seconds, and `setTime()` advances to absolute milliseconds. `setGLTFMorphWeights()` changes the weights of a mapped mesh node.

```
import {createScenegraphsFromGLTF, setGLTFMorphWeights} from '@luma.gl/gltf';



const scenegraphs = createScenegraphsFromGLTF(device, gltf);

scenegraphs.animator.selectClip('Walking');

scenegraphs.animator.selectClip('Running', {crossFadeDuration: 0.3});

scenegraphs.animator.setTime(1000);



// Node 13 is the face in the RobotExpressive sample.

const faceNode = scenegraphs.gltfNodeIndexToNodeMap.get(13);

if (faceNode) {

  setGLTFMorphWeights(faceNode, [0.8, 0, 0]);

}
```

Clip names and node indices are asset-specific. Active morph animation may overwrite manually set weights on subsequent frames.

## glTF support[​](#gltf-support "Direct link to glTF support")

Node translation, rotation, scale, skins, and morph-weight animation are core glTF features. `KHR_animation_pointer` additionally targets supported material, texture-transform, camera, light, and visibility properties. The [animation reference](https://luma.gl/docs/api-reference/gltf/gltf-animation.md) describes playback and supported targets.

See [glTF materials and textures](https://luma.gl/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/docs/api-guide/engine/features.md)
