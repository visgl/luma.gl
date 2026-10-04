# Animation and Deformation

[Workflow](https://luma.gl/docs/api-guide/engine/animation.md)[Mixer](https://luma.gl/docs/api-reference/engine/animation/animation-mixer.md)[Morph targets](https://luma.gl/docs/api-reference/engine/animation/morph-targets.md)[AnimationLoop](https://luma.gl/docs/api-reference/engine/animation-loop.md)[Template](https://luma.gl/docs/api-reference/engine/animation-loop-template.md)[KeyFrames](https://luma.gl/docs/api-reference/engine/animation/key-frames.md)[Timeline](https://luma.gl/docs/api-reference/engine/animation/timeline.md)

The `@luma.gl/engine` animation system plays reusable keyframe clips, blends overlapping actions, and applies morph-target deformation without depending on a particular asset format or renderer. glTF adapters, retained scenes, and custom applications can all use the same engine primitives.

## Animation Concepts[​](#animation-concepts "Direct link to Animation Concepts")

| Concept            | Responsibility                                              |
| ------------------ | ----------------------------------------------------------- |
| `AnimationBinding` | Reads and writes one application property.                  |
| `AnimationTrack`   | Samples keyframes for one bound property.                   |
| `AnimationClip`    | Groups tracks that play together.                           |
| `AnimationAction`  | Controls playback, looping, speed, and weight for one clip. |
| `AnimationMixer`   | Advances actions and combines their contributions.          |

The mixer and all keyframe times use **seconds**. Convert timestamps from `requestAnimationFrame`, `AnimationLoop`, and other millisecond clocks before advancing an animation.

## Create a Track and Play a Clip[​](#create-a-track-and-play-a-clip "Direct link to Create a Track and Play a Clip")

An animation binding connects a track to any numeric property. Binding values are always arrays: a scalar is represented as `[value]`, a translation as `[x, y, z]`, and a rotation quaternion as `[x, y, z, w]`.

```
import {AnimationClip, AnimationMixer, AnimationTrack} from '@luma.gl/engine';



let translation = [0, 0, 0];



const translationTrack = new AnimationTrack({

  name: 'translation',

  times: [0, 1, 2],

  values: [

    [0, 0, 0],

    [1, 0, 0],

    [1, 1, 0]

  ],

  interpolation: 'LINEAR',

  binding: {

    id: 'character.translation',

    getValue: () => translation,

    setValue: value => {

      translation = value;

    }

  }

});



const clip = new AnimationClip({name: 'move', tracks: [translationTrack]});

const mixer = new AnimationMixer([clip]);



mixer.clipAction('move').play();

mixer.update(0.5);



// translation is now [0.5, 0, 0].
```

Use a stable `binding.id` when separately created tracks modify the same property. The mixer uses that identity to blend their values together instead of writing the property independently.

### Drive the Mixer from a Render Loop[​](#drive-the-mixer-from-a-render-loop "Direct link to Drive the Mixer from a Render Loop")

```
let previousFrameTime: number | undefined;



function animate(frameTimeMilliseconds: number): void {

  const elapsedSeconds =

    previousFrameTime === undefined ? 0 : (frameTimeMilliseconds - previousFrameTime) / 1000;



  previousFrameTime = frameTimeMilliseconds;

  mixer.update(elapsedSeconds);



  // Render the updated scene here.

  requestAnimationFrame(animate);

}



requestAnimationFrame(animate);
```

`mixer.update(deltaSeconds)` advances existing actions. `mixer.setTime(absoluteSeconds)` seeks to an absolute mixer time and immediately applies the resulting pose.

## Interpolation[​](#interpolation "Direct link to Interpolation")

`AnimationTrack` supports three interpolation modes:

* `STEP` keeps the preceding keyframe value until the next keyframe.
* `LINEAR` interpolates vector components between adjacent keyframes.
* `CUBICSPLINE` evaluates cubic Hermite splines with incoming and outgoing tangents.

Set `valueType: 'quaternion'` for rotation tracks. Linear quaternion tracks use shortest-path spherical interpolation, and cubic quaternion results are normalized.

```
const rotationTrack = new AnimationTrack({

  name: 'rotation',

  times: [0, 1],

  values: [

    [0, 0, 0, 1],

    [0, 1, 0, 0]

  ],

  valueType: 'quaternion',

  binding: {

    id: 'character.rotation',

    setValue: rotation => {

      // Apply the normalized quaternion to the scene object.

    }

  }

});
```

For `CUBICSPLINE`, provide three arrays per keyframe, in `[inTangent, value, outTangent]` order. Tangents are scaled automatically by the duration between adjacent keyframes.

```
const cubicValues = [

  [0], // First keyframe incoming tangent.

  [0], // First keyframe value.

  [1], // First keyframe outgoing tangent.

  [1], // Second keyframe incoming tangent.

  [1], // Second keyframe value.

  [0] // Second keyframe outgoing tangent.

];



let opacity = 0;



const cubicTrack = new AnimationTrack({

  name: 'opacity',

  times: [0, 1],

  values: cubicValues,

  interpolation: 'CUBICSPLINE',

  binding: {

    setValue: ([value]) => {

      opacity = value;

    }

  }

});
```

Outside the available keyframes, a sampler clamps to its first or last value. Looping is controlled by the action, not by individual tracks.

## Playback, Looping, and Seeking[​](#playback-looping-and-seeking "Direct link to Playback, Looping, and Seeking")

```
const action = mixer.clipAction(clip, {

  loop: 'repeat',

  repetitions: Infinity,

  timeScale: 1,

  weight: 1

});



action.play();

action.pause();

action.resume();



action.setLoop('once');

action.setLoop('repeat', 3);

action.setLoop('ping-pong', 4);



action.setEffectiveTimeScale(2); // Double speed.

action.setEffectiveTimeScale(-1); // Reverse playback.

action.setTime(0.75); // Set the action's local time in seconds.

mixer.update(0); // Apply a manually changed action time immediately.



mixer.setTime(1.5); // Seek the complete mixer and apply immediately.

mixer.timeScale = 0.5; // Slow down every action.



action.stop();

mixer.stopAllAction();
```

`once` stops at the end of the clip, `repeat` wraps back to the beginning, and `ping-pong` alternates direction. For `ping-pong`, `repetitions` counts individual traversals.

Pausing freezes an action's local time while retaining its pose. Seeking the mixer leaves paused actions at their current local times.

## Blend and Crossfade Actions[​](#blend-and-crossfade-actions "Direct link to Blend and Crossfade Actions")

Actions affecting the same binding are combined according to their weights. If total weight is below one, the mixer blends toward the initial value returned by `binding.getValue`.

```
const walkAction = mixer.clipAction('walk').play();

const runAction = mixer.clipAction('run');



walkAction.crossFadeTo(runAction, 0.35);



// Both clips contribute during the 350-millisecond transition.

mixer.update(0.175);



runAction.setEffectiveWeight(0.6);

runAction.fadeOut(0.2);
```

`crossFadeTo` starts the destination action at zero weight and ramps both action weights over the specified number of seconds. Quaternion contributions are normalized after blending.

## Morph-Target Deformation[​](#morph-target-deformation "Direct link to Morph-Target Deformation")

Morph targets contain additive vertex deltas. The shared engine helpers apply any number of target weights to `POSITION`, `NORMAL`, and `TANGENT` attributes.

```
import {applyMorphTargets, type MorphTargetAttributes} from '@luma.gl/engine';



const baseAttributes: MorphTargetAttributes = {

  POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),

  NORMAL: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])

};



const targets: MorphTargetAttributes[] = [

  {POSITION: new Float32Array([1, 0, 0, 0, 0, 0, 0, 0, 0])},

  {POSITION: new Float32Array([0, 1, 0, 0, 0, 0, 0, 0, 0])}

];



const morphedAttributes = applyMorphTargets(baseAttributes, targets, [0.5, 0.25]);



// The first POSITION is now [0.5, 0.25, 0].

// baseAttributes remains unchanged.
```

Use `updateMorphTargetBuffers(model, geometry, targets, weights)` when the geometry is already uploaded. It rewrites the model's existing vertex buffer without rebuilding its pipeline. Keep the original CPU geometry immutable so successive animation frames always start from the same bind pose.

See the [morph-target reference](https://luma.gl/docs/api-reference/engine/animation/morph-targets.md) for tangent handedness, GPU buffer layout, and shared-geometry considerations.

## Relationship to Other Animation APIs[​](#relationship-to-other-animation-apis "Direct link to Relationship to Other Animation APIs")

* [`AnimationMixer`](https://luma.gl/docs/api-reference/engine/animation/animation-mixer.md) owns reusable keyframe playback, blending, and property bindings.
* [`AnimationLoop`](https://luma.gl/docs/api-reference/engine/animation-loop.md) schedules application frames; its timestamps must be converted from milliseconds before advancing a mixer.
* [`Timeline`](https://luma.gl/docs/api-reference/engine/animation/timeline.md) and [`KeyFrames`](https://luma.gl/docs/api-reference/engine/animation/key-frames.md) remain available for existing timeline-driven applications.
* `@luma.gl/gltf` owns glTF animation decoding, node bindings, skinning, and the compatibility `GLTFAnimator`.
* Higher-level scene renderers and ANARI adapters orchestrate these engine primitives instead of implementing independent animation or deformation systems.
