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
by `GLTFAnimator`.

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
matching `requestAnimationFrame()`. It evaluates all active clips in one shared mixer pass.

Individual `GLTFAnimationClip` instances expose their format-independent `clip`, their shared
`mixer`, and their playback `action`:

```ts
const [walk, run] = scenegraphs.animator.getAnimations();

walk.action.setLoop('repeat');
run.action.setEffectiveTimeScale(1.25);
walk.action.crossFadeTo(run.action, 0.35);
```

`AnimationAction` and `AnimationMixer` measure clip time, fade duration, and update deltas in
**seconds**. If an application takes direct control of `animator.mixer.update(deltaSeconds)`, use
that mixer as the animation clock instead of simultaneously advancing the same actions through
`animator.setTime()`.

See the [engine animation guide](/docs/api-guide/engine/animation) and
[AnimationMixer API reference](/docs/api-reference/engine/animation/animation-mixer) for pause,
seek, reverse playback, once/repeat/ping-pong loops, weighted blending, and crossfading.

## Supported channels and interpolation

| Source channel | Runtime target |
| --- | --- |
| Node `translation`, `rotation`, and `scale` | The corresponding retained `GroupNode` transform. |
| Node `weights` | Node-local mesh morph-target weights and existing GPU vertex buffers. |
| Supported material-factor pointers | Shared canonical PBR material uniforms. |
| Supported texture-transform pointers | Per-slot UV offset, rotation, or scale. |

`STEP`, `LINEAR`, and `CUBICSPLINE` interpolation are supported. Quaternion rotation tracks use
shortest-path interpolation, and cubic quaternion results are normalized. Morph channels unpack
all source target weights, including cubic spline tangent/value/tangent groups.

`KHR_animation_pointer` supports the node transforms and morph weights above, selected
scalar/vector PBR factors, and `KHR_texture_transform` offset/rotation/scale on all 17 supported
texture slots. Camera pointers, extras, structural material switches such as `alphaMode`,
`doubleSided`, or `unlit`, animated `texCoord`, and `TEXCOORD_2+` are not supported.

## Skeletal animation and skinning

Parsed geometry preserves the glTF `JOINTS_0` and `WEIGHTS_0` attributes. Authored normalized
integer joint weights retain their intended normalized interpretation at the consumer boundary.
The existing shared `skin` shader module in `@luma.gl/shadertools` applies joint palettes; its
current uniform-array capacity is 64 joints.

The module accepts either its existing glTF scenegraph-based inputs or a format-independent
`jointMatrices` palette. The shared
[experimental SceneRenderer](/docs/api-reference/experimental/scene-renderer) consumes the
format-independent palette through its surface skin descriptor.

The optional ANARI integration can import source joint attributes and render an explicitly
provided surface joint palette, but its showcase importer does not automatically create or update
that palette from glTF skins. Imported skeletal playback through ANARI therefore still requires
application-provided skin-palette integration.

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
