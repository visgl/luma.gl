import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# Scenegraph Controllers and Deformation

<EngineDocsTabs group="scenegraph" active="controllers" />

Controllers operate on resolved scene objects. They do not require glTF source arrays,
node indices or JSON pointers during playback. This page describes the engine runtime;
asset decoding remains the importer's responsibility.

Focused capability guides cover [skins](./scenegraph-skins.mdx),
[morph targets](./scenegraph-morphs.mdx), [physical joints](./scenegraph-joints.mdx),
[interactivity](./scenegraph-interactivity.mdx), [billboards](./scenegraph-billboards.mdx),
[lights](./scenegraph-lights.mdx), and [audio](./scenegraph-audio.mdx).
This page explains their shared construction and update model.

## Animation Bindings and Playback

An `AnimationBinding` reads and writes a numeric property. `AnimationTrack` supplies
its keyframes, `AnimationClip` groups tracks, and `AnimationMixer` blends active actions.
The engine provides bindings for node transforms, morph weights, visibility, material
uniforms, texture transforms, and resolved camera or light properties.

```ts
import {
  AnimationClip, AnimationMixer, AnimationTrack, GroupNode,
  makeNodeAnimationBinding
} from '@luma.gl/engine';

const carriage = new GroupNode({id: 'carriage'});
const track = new AnimationTrack({
  times: [0, 1, 2],
  values: [[0, 0, 0], [2, 0, 0], [0, 0, 0]],
  binding: makeNodeAnimationBinding(carriage, 'translation', {
    id: 'carriage.translation'
  })
});
const clip = new AnimationClip({name: 'travel', tracks: [track]});
const mixer = new AnimationMixer();
mixer.clipAction(clip).play();
mixer.update(0.5);
```

Node bindings update the local matrix after changing translation, quaternion rotation
or scale. Rotation tracks must select `valueType: 'quaternion'`. Visibility bindings
can invoke a callback when dependent scene state, such as light collection, needs refresh.

`ScenegraphAnimator` adds named clip selection, optional crossfades, autoplay policy,
and one dependent-update callback after a mixer update. `MixerAnimationClip` adapts an
engine clip to its playback controller interface. Applications that already own a
clock and playback policy can use `AnimationMixer` directly.

See [Animation and deformation](/docs/api-guide/engine/animation) for interpolation,
looping, weights and blending.

## Materials, Texture Transforms and Variants

`makeMaterialAnimationBinding()` targets resolved material instances and a uniform
property, optionally one vector component. A glTF importer supplies all instances of
a source material, including inactive variants, so changing variants does not expose
stale animation state.

`makeTextureTransformAnimationBinding()` updates an offset, rotation or scale and
writes a UV-transform delta relative to the authored base transform. The importer
resolves the texture slot to its shader uniform; the engine performs the transform
math and runtime update. Share its transform-state map among channels addressing the
same material slot so independent offset and rotation channels compose correctly.

`MaterialVariants` stores named variants and bindings to `ModelNode` objects. Calling
`selectVariant(name)` updates both material and pipeline parameters. Unmapped primitives
return to their default appearance; `resetVariant()` restores every default. Variant
selection does not duplicate geometry or change spatial hierarchy.

## Skeletal Skinning

A skinning joint is an ordinary node used in a deformation palette. `SkinBinding`
contains:

- The mesh-owning `GroupNode`.
- Ordered joint node references and optional inverse bind matrices.
- A reusable `Float32Array` of joint matrices.
- The affected `ModelNode` objects.
- An optional GPU buffer or texture for palettes exceeding uniform limits.

`SkinController.update()` traverses the scene roots, evaluates world matrices, builds
mesh-local joint matrices and updates each bound model. The relationship is conceptually
`inverse(meshWorld) × jointWorld × inverseBind`. Palette ordering must match the mesh's
joint indices; joint names do not establish that ordering.

Call it after animating the skeleton and before drawing. Imported glTF bundles arrange
this dependent update through their animator. Programmatic scenes can construct
`SkinController` from their own roots and bindings.

**Current execution boundary:** palette calculation happens on the CPU. The resulting
palette is supplied to GPU skinning through uniforms, a storage buffer or a texture.
A GPU physics pose buffer does not automatically update skin palettes. Physics-driven
skeletal deformation needs an explicit bridge or a future GPU palette stage.

Skinning joints do not imply physical constraints, mass, collider shapes or motor
limits. See [Physical joints](/docs/api-guide/engine/scenegraph-physics#physical-joints)
for the separate constraint representation.

## Morph Targets

Morph targets retain base geometry attributes plus attribute deltas. `setMorphWeights()`
updates a mesh-owning node's registered morph primitives. Where GPU morph-weight
transport is available, it uploads weights; the fallback updates the model's existing
vertex buffers. It does not rebuild the scene tree for every animation frame.

Morph state currently uses explicit `userData` records (`morphMeshes`, `morphTargets`,
`morphWeights` and `morphWeightTransport`). Programmatic users must register those
records consistently; arbitrary geometry does not acquire morph behavior just because
a weights array is attached to a node.

Visual morphing does not rebuild physics collision shapes. Keep deforming render
geometry separate from rigid collision geometry unless an application explicitly
updates or reconstructs the physics representation.

## Camera, Light and Behavior State

`makePropertyAnimationBinding()` binds a numeric property on an already resolved
runtime object. An optional component index supports vector channels; an `onChange`
callback refreshes derived state such as punctual-light parameters. This does not
introduce a universal camera or light node class: projection and lighting definitions
remain referenced scene state.

`Interactivity` evaluates supported behavior graphs. Its external host interfaces
let applications connect operations to rendering or physics without making the engine
depend on an asset format or physics backend. Asynchronous physics queries require
explicit completion handling before their continuation results are consumed.

## Billboards, Area Lights and Audio

| Controller | Runtime behavior | Ownership |
| --- | --- | --- |
| `BillboardController` | Produces camera-facing draw transforms without mutating nodes | Borrows scene nodes |
| `AreaLightController` | Resolves visible area lights from node transforms and authored dimensions | Borrows scene nodes |
| `AudioController` | Updates spatial emitters and listener state | Owns its sources/processing nodes, borrows the audio context |

### Construct Engine Inputs Directly

A rectangle light uses width and height directly. It does not need a source document or extension object:

```ts
import {AreaLightController, GroupNode} from '@luma.gl/engine';

const lightNode = new GroupNode({position: [0, 3, 0]});
const scene = new GroupNode({children: [lightNode]});
const lights = new AreaLightController({
  scenes: [scene],
  bindings: [{
    node: lightNode,
    definition: {type: 'rect', width: 4, height: 2, intensity: 1000}
  }]
});

// After updating animated node transforms, pass these to your lighting shader inputs.
const currentLights = lights.getLights();
```

`BillboardOrientation.rotationAxis` accepts `'all'` or `'y'`. `MaterialVariants` accepts explicit `ModelNode` bindings, avoiding source-specific metadata lookups. `SkinController.getBinding(node)` uses the resolved mesh node rather than an asset index.

## Supporting audio APIs

`AudioGraph` constructs processing nodes and connects scheduled sources to borrowed emitter inputs. `AudioReverbBus`, `createParametricAudioResponse()`, and `selectAudioEnvironmentZone()` provide reusable reverb and spatial-zone behavior. They do not load glTF documents.

The audio context must be resumed from a user gesture before realtime playback. `AudioController.initialize()` fetches and decodes resources, `play()` starts sources, `stop()` stops playback, and `destroy()` releases owned processing resources. Audio is opt-in and independent of the graphics backend.

## glTF mapping

`createScenegraphsFromGLTF()` returns engine `skins` and `variants` controllers automatically. Optional features use parsers that return engine construction props:

```ts
import {AreaLightController, AudioController, BillboardController} from '@luma.gl/engine';
import {parseGLTFAreaLights, parseGLTFAudio, parseGLTFBillboards} from '@luma.gl/engine/gltf';

const areaLights = new AreaLightController(parseGLTFAreaLights(scenegraphs));
const billboards = new BillboardController(parseGLTFBillboards(scenegraphs));
const audio = new AudioController(parseGLTFAudio({
  scenegraphs,
  audioContext,
  baseUrl: modelUrl
}));
```

The parsers resolve extension names, source indices, scene attachments, and embedded buffer views. The engine controllers receive nodes, dimensions, typed graphs, and audio bytes. This keeps loading and source-format interpretation in glTF while runtime behavior belongs to engine.

See the glTF integration references for [billboards](/docs/api-reference/gltf/gltf-billboard), [area lights](/docs/api-reference/gltf/gltf-area-lights), [audio](/docs/api-reference/gltf/gltf-audio), and [native extensions](/docs/api-reference/gltf/gltf-native-extensions) for supported extension profiles and limits.
