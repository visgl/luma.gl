import {GltfDocsTabs} from '@site/src/components/docs/gltf-docs-tabs';

# glTF Animation and Deformation

<GltfDocsTabs active="animation" />

`@luma.gl/gltf` interprets glTF animation channels and connects them to the format-independent
animation and deformation primitives in `@luma.gl/engine`. It does not introduce a separate
animation mixer, interpolation implementation, or skinning shader.

## Load and inspect clips

```ts
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF, parseGLTFAnimations} from '@luma.gl/gltf';

const asset = await load('/models/character.glb', GLTFLoader);
const gltf = postProcessGLTF(asset);

const parsedAnimations = parseGLTFAnimations(gltf);
const scenegraphs = createScenegraphsFromGLTF(device, gltf);

console.log(parsedAnimations.map(animation => animation.name));
console.log(scenegraphs.animator.getAnimations().map(clip => clip.name));
```

`parseGLTFAnimations()` owns glTF accessor decoding and pointer interpretation. The returned
channels are converted to shared `AnimationTrack`, `AnimationClip`, and `AnimationMixer` objects
by `GLTFAnimator`. `scenegraphs.animations` retains the parsed source channels;
`scenegraphs.animator` owns their shared runtime actions; `scenegraphs.skins` owns reusable,
automatically updated source skin palettes.

## `GLTFAnimator`

```ts
function renderFrame(timeMilliseconds: number): void {
  scenegraphs.animator.setTime(timeMilliseconds);
  renderScene();
  requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);
```

`GLTFAnimator.setTime(timeMilliseconds)` accepts an **absolute timestamp in milliseconds**,
matching `requestAnimationFrame()`. It evaluates all active clips in one shared mixer pass, then
updates dependent skin palettes once.

Applications that already maintain an animation delta can use seconds directly:

```ts
scenegraphs.animator.update(deltaSeconds);
```

Unlike calling the underlying `mixer.update()` manually, `animator.update()` also refreshes the
automatically managed glTF skin bindings after every animation frame.

### Select and crossfade clips

```ts
const animator = scenegraphs.animator;

animator.selectClip('Walk');
console.log(animator.activeClip); // 'Walk'

animator.selectClip('Run', {
  crossFadeDuration: 0.35
});

console.log(animator.activeClip); // 'Run'
```

`selectClip()` stops unrelated actions, activates the selected source clip, and optionally
crossfades from the previously active clip. Durations are measured in **seconds**. Unknown clip
names are rejected without changing the active selection.

Individual `GLTFAnimationClip` instances expose their format-independent `clip`, their shared
`mixer`, and their playback `action`:

```ts
const [walk, run] = scenegraphs.animator.getAnimations();

walk.action.setLoop('repeat');
run.action.setEffectiveTimeScale(1.25);
walk.action.crossFadeTo(run.action, 0.35);
```

`AnimationAction` and `AnimationMixer` measure clip time, fade duration, and update deltas in
**seconds**. Do not simultaneously advance the same actions through `animator.setTime()` and
`animator.update()`. If an application directly controls `animator.mixer.update(deltaSeconds)`, it
must also update dependent source skin palettes explicitly with `scenegraphs.skins.update()`.

See the [engine animation guide](/docs/api-guide/engine/animation) and
[AnimationMixer API reference](/docs/api-reference/engine/animation/animation-mixer) for pause,
seek, reverse playback, once/repeat/ping-pong loops, weighted blending, and crossfading.

To share GPU models across independently posed actors, see
[GPU-animated glTF crowds](/docs/api-reference/gltf/gltf-animated-crowd).

## Supported channels and interpolation

| Source channel | Runtime target |
| --- | --- |
| Node `translation`, `rotation`, and `scale` | The corresponding retained `GroupNode` transform. |
| Node `weights` | Node-local mesh morph-target weights and existing GPU vertex buffers. |
| `KHR_node_visibility.visible` | Recursive scenegraph visibility and an in-place punctual-light refresh. |
| Supported material-factor pointers | Shared canonical PBR material uniforms. |
| Supported texture-transform pointers | Per-slot UV offset, rotation, or scale across all 17 map slots. |
| Perspective or orthographic camera pointers | Independent runtime projection definitions. |
| Punctual-light pointers | Authored linear color, intensity, range, and spotlight cone angles. |

`STEP`, `LINEAR`, and `CUBICSPLINE` interpolation are supported. Quaternion rotation tracks use
shortest-path interpolation, and cubic quaternion results are normalized. Morph channels unpack
all source target weights, including cubic spline tangent/value/tangent groups.

### Typed `KHR_animation_pointer` targets

Source pointers preserve their original JSON paths while being represented as typed node,
material, texture-transform, camera, or light channels:

```ts
for (const animation of scenegraphs.animations) {
  for (const channel of animation.channels) {
    switch (channel.type) {
      case 'node':
        console.log(channel.targetNodeId, channel.path);
        break;
      case 'material':
        console.log(channel.targetMaterialIndex, channel.property);
        break;
      case 'textureTransform':
        console.log(channel.textureSlot, channel.path);
        break;
      case 'camera':
        console.log(channel.targetCameraIndex, channel.projection, channel.property);
        break;
      case 'light':
        console.log(channel.targetLightIndex, channel.property, channel.component);
        break;
    }
  }
}
```

Supported source pointers include:

- `/nodes/1/extensions/KHR_node_visibility/visible` with `STEP` interpolation.
- `/cameras/0/perspective/yfov` and `/cameras/0/orthographic/xmag`.
- `/extensions/KHR_lights_punctual/lights/0/intensity` and individual `color/0` components.
- `/extensions/KHR_lights_punctual/lights/0/spot/innerConeAngle` and `outerConeAngle`.
- `/materials/0/extensions/KHR_materials_dispersion/dispersion` and supported physical factors.
- `KHR_texture_transform` offset, rotation, and scale across all 17 supported material map slots.

Camera channels update `scenegraphs.cameras`, which contains independent copies of source
projection definitions. Light and visibility channels refresh the existing `scenegraphs.lights`
array in place. Original postprocessed camera and light source data remains unchanged.

Extras, structural material switches such as `alphaMode`, `doubleSided`, or `unlit`, animated
`texCoord`, and `TEXCOORD_2+` are not supported. See
[native glTF extensions](/docs/api-reference/gltf/gltf-native-extensions) for the full target
matrix and strict extension diagnostics.

## Skeletal animation and skinning

Parsed geometry preserves the glTF `JOINTS_0` and `WEIGHTS_0` attributes. Authored normalized
integer joint weights retain their intended normalized interpretation at the consumer boundary.
The existing shared `skin` shader module in `@luma.gl/shadertools` applies joint palettes; its
current uniform-array capacity is 64 joints.

`createScenegraphsFromGLTF()` automatically builds a source-aware `GLTFSkinController`. Each
binding maps one authored mesh node to its source skin, animated joints, optional inverse bind
matrices, reusable mesh-local joint palette, and existing primitive models:

```ts
for (const binding of scenegraphs.skins.bindings) {
  console.log({
    sourceNode: binding.nodeIndex,
    sourceSkin: binding.skinIndex,
    jointCount: binding.joints.length,
    palette: binding.jointMatrices
  });
}

const skinBinding = scenegraphs.skins.getBinding(2);
console.log(skinBinding?.models.length);
```

`animator.setTime()` and `animator.update()` refresh all bindings once after their animation
channels evaluate. Multiple independent source skins, authored inverse-bind transforms, mesh-local
motion, and shared source nodes reuse the existing GPU models and skin shader instead of creating a
parallel skeletal runtime.

If application code changes a joint manually outside the animation controller, refresh the existing
palettes explicitly:

```ts
scenegraphs.skins.update();
```

The shared
[experimental SceneRenderer](/docs/api-reference/experimental/scene-renderer) consumes the
format-independent palette through its surface skin descriptor.

The optional ANARI glTF integration also maps retained source skin bindings to the same generic
joint-palette helper and updates its palettes after each animation frame. It remains an optional
`@luma.gl/anari/gltf` adapter: the ANARI core does not own a loader, animation mixer, or skinning
shader.

## Morph targets

Core glTF morph targets preserve authored `POSITION`, `NORMAL`, and `TANGENT` displacement
attributes. Initial node weights override mesh defaults when present. If several source nodes
share one mesh, their morph weights and mutable geometry remain isolated per node.

Animating a node's `weights` updates the existing vertex buffer rather than replacing the model or
rebuilding geometry every frame. Tangent displacement affects XYZ while preserving the base
tangent's handedness component. Shared interpolation and buffer updates are implemented by the
[engine morph-target utilities](/docs/api-reference/engine/animation/morph-targets).

For retained JSON morph playback, see
[ANARI animation and glTF integration](/docs/api-reference/anari/anari-animation).
