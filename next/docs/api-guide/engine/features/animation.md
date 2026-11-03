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

0

<!-- -->

s

Scroll page · Ctrl/⌘ + scroll to interact

## Engine playback API[​](#engine-playback-api "Direct link to Engine playback API")

`AnimationBinding`, `AnimationTrack`, `AnimationClip`, and `AnimationMixer` belong to `@luma.gl/engine`. They sample and blend resolved runtime properties without reading a source asset during playback. `ScenegraphAnimator` adds clip selection and a dependent-update callback for skin palettes and other controllers.

```
import {AnimationMixer, MixerAnimationClip, ScenegraphAnimator} from '@luma.gl/engine';



// walkingClip and runningClip are resolved engine AnimationClip objects.

const mixer = new AnimationMixer();

const animator = new ScenegraphAnimator([

  new MixerAnimationClip(walkingClip, mixer),

  new MixerAnimationClip(runningClip, mixer)

], mixer, {autoplay: 'first', onUpdate: () => skins.update()});



animator.selectClip(walkingClip.name);

animator.selectClip(runningClip.name, {crossFadeDuration: 0.3});

animator.update(1 / 60);
```

`update()` advances by delta seconds; the compatibility `setTime()` method accepts absolute milliseconds. Crossfade durations are seconds. Do not advance the mixer independently as well as through its animator during the same frame. Active tracks may overwrite manual edits to the same property.

See [Animation](https://luma.gl/next/docs/api-guide/engine/animation.md) for native track construction and interpolation, [Skins](https://luma.gl/next/docs/api-guide/engine/scenegraph-skins.md) for palette updates, and [Morph targets](https://luma.gl/next/docs/api-guide/engine/scenegraph-morphs.md) for weight updates.

## glTF conversion[​](#gltf-conversion "Direct link to glTF conversion")

`createScenegraphsFromGLTF()` decodes source tracks and exposes the shared engine animator as `scenegraphs.animator`. It resolves source node indices into bindings and arranges dependent skin updates. Imported clip names and node indices are asset-specific.

Node translation, rotation, scale, skins, and morph-weight animation are core glTF features. `KHR_animation_pointer` additionally targets supported material, texture-transform, camera, light, and visibility properties. The [animation reference](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md) describes playback and supported targets.

See [glTF materials and textures](https://luma.gl/next/docs/api-reference/gltf/gltf-materials.md), [glTF animation](https://luma.gl/next/docs/api-reference/gltf/gltf-animation.md), and the [extension support matrix](https://luma.gl/next/docs/api-reference/gltf/gltf-extensions.md) for adapter details and current support limits.

[All engine features](https://luma.gl/next/docs/api-guide/engine/features.md)
