import {EngineDocsTabs} from '@site/src/components/docs/engine-docs-tabs';

# AnimationMixer

<EngineDocsTabs group="animation" active="animation-mixer" />

The `AnimationMixer` plays and blends reusable `AnimationClip` instances. A clip groups `AnimationTrack` objects, and each track updates an application property through an `AnimationBinding`. `AnimationAction` controls playback for an individual clip.

All times, durations, and interpolation keyframes use **seconds**.

## Usage

```typescript
import {AnimationClip, AnimationMixer, AnimationTrack} from '@luma.gl/engine';

let translation = [0, 0, 0];

const track = new AnimationTrack({
  name: 'node.translation',
  times: [0, 1, 2],
  values: [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0]
  ],
  binding: {
    id: 'node.translation',
    getValue: () => translation,
    setValue: value => {
      translation = value;
    }
  }
});

const clip = new AnimationClip({name: 'move', tracks: [track]});
const mixer = new AnimationMixer([clip]);

mixer.clipAction('move').setLoop('repeat').play();
mixer.update(0.5);

// translation is [0.5, 0, 0].
```

For complete playback and deformation examples, see the [animation programming guide](/docs/api-guide/engine/animation).

## AnimationMixer

### constructor(clips?: AnimationClip[])

Creates a mixer and optionally registers its available clips.

```typescript
const mixer = new AnimationMixer([walkClip, runClip]);
```

### Properties

- `time: number` — Elapsed mixer time, in seconds.
- `timeScale: number` — Global playback-speed multiplier. Negative values reverse all advancing actions.

### addClip(clip: AnimationClip): this

Registers an additional clip with the mixer.

### clipAction(clip: AnimationClip | string, props?: AnimationActionProps): AnimationAction

Returns the action for a clip or registered clip name, creating it if necessary. The same action is returned on subsequent calls for that clip; initialization properties only apply when the action is first created.

### getAction(name: string): AnimationAction | undefined

Returns an existing action by clip name, without creating a new action.

### update(deltaTime: number): this

Advances the mixer by a relative duration in seconds, updates active actions, and writes their blended property values. Pass zero after changing an action's local time when its new pose must be applied immediately.

### setTime(time: number): this

Seeks to an absolute mixer time in seconds and immediately applies the resulting values. Paused actions retain their current local times.

### stopAllAction(): this

Stops and resets every action currently owned by the mixer.

## AnimationAction

Create actions through `mixer.clipAction(...)` so they are registered with the mixer.

### AnimationActionProps

```typescript
type AnimationActionProps = {
  loop?: 'once' | 'repeat' | 'ping-pong';
  repetitions?: number;
  timeScale?: number;
  weight?: number;
};
```

- `loop` — Playback mode; defaults to `'repeat'`.
- `repetitions` — Number of allowed traversals; defaults to `Infinity`.
- `timeScale` — Action-specific playback-speed multiplier; defaults to `1`.
- `weight` — Relative contribution while blending; defaults to `1`.

### Properties

- `clip: AnimationClip` — The action's source clip.
- `mixer: AnimationMixer` — The owning mixer.
- `time: number` — Local clip time in seconds.
- `timeScale: number` — Local playback-speed multiplier.
- `weight: number` — Current blending weight.
- `loop: AnimationLoopMode` — Current playback mode.
- `repetitions: number` — Maximum traversals for the current loop mode.
- `paused: boolean` — Whether local playback time is frozen.
- `playing: boolean` — Whether the action is actively playing.

### Playback Methods

- `play(): this` — Starts or resumes playback.
- `pause(): this` — Freezes local playback time while preserving the current pose.
- `resume(): this` — Continues a paused action.
- `stop(): this` — Stops playback and resets local time.
- `reset(): this` — Resets local time and completed-loop state.
- `setTime(time: number): this` — Sets local clip time in seconds. Call `mixer.update(0)` to immediately apply the changed pose.
- `setLoop(loop: AnimationLoopMode, repetitions?: number): this` — Selects `'once'`, `'repeat'`, or `'ping-pong'`; repetitions default to `Infinity`.
- `setEffectiveTimeScale(timeScale: number): this` — Changes action playback speed. Negative values play in reverse.
- `setEffectiveWeight(weight: number): this` — Changes blending weight; values are clamped to zero or greater.

### Fading Methods

- `fadeIn(duration: number): this` — Fades the action toward full weight over the specified duration in seconds.
- `fadeOut(duration: number): this` — Fades the action toward zero weight over the specified duration in seconds.
- `crossFadeTo(action: AnimationAction, duration: number): this` — Starts the destination action at zero weight and crossfades between both actions.
- `crossFadeFrom(action: AnimationAction, duration: number): this` — Crossfades from the specified action into this action.

```typescript
const walkAction = mixer.clipAction('walk').play();
const runAction = mixer.clipAction('run');

walkAction.crossFadeTo(runAction, 0.4);
```

When multiple actions update the same binding, their values are combined using their current weights. If the combined weight is below one, the original value from `binding.getValue` supplies the remaining contribution.

## AnimationClip

An `AnimationClip` groups tracks intended to play together.

```typescript
const clip = new AnimationClip({
  name: 'walk',
  tracks: [translationTrack, rotationTrack],
  duration: 2
});
```

### AnimationClipProps

- `name: string` — Name used to retrieve the clip or action.
- `tracks: AnimationTrack[]` — Tracks evaluated together.
- `duration?: number` — Explicit duration in seconds. If omitted, the duration is the longest track duration.

### Properties

- `name: string` — Clip name.
- `tracks: AnimationTrack[]` — Source tracks.
- `duration: number` — Playback duration in seconds.

## AnimationTrack

An `AnimationTrack` samples one property and sends each result to an `AnimationBinding`.

### AnimationTrackProps

```typescript
type AnimationTrackProps = {
  name?: string;
  times: readonly number[];
  values: readonly (readonly number[])[];
  interpolation?: 'STEP' | 'LINEAR' | 'CUBICSPLINE';
  valueType?: 'vector' | 'quaternion';
  binding: AnimationBinding;
};
```

- `times` — Increasing keyframe times in seconds.
- `values` — Numeric arrays associated with each keyframe. Scalars use one-element arrays.
- `interpolation` — Interpolation mode; defaults to `'LINEAR'`.
- `valueType` — `'vector'` by default. Set `'quaternion'` for shortest-path spherical interpolation and normalized quaternion results.
- `binding` — Property accessor updated when the track is evaluated.

For `'CUBICSPLINE'`, `values` contains three arrays per keyframe in `[inTangent, value, outTangent]` order.

### Properties

- `name: string` — Track name.
- `times: readonly number[]` — Keyframe times in seconds.
- `values: readonly (readonly number[])[]` — Keyframe values.
- `interpolation: AnimationInterpolation` — Interpolation mode.
- `valueType: AnimationValueType` — `'vector'` or `'quaternion'`.
- `binding: AnimationBinding` — Bound property.
- `duration: number` — Final keyframe time, or zero for an empty track.
- `sampler: AnimationSampler` — Sampler view over the track's keyframes.

### evaluate(time: number): number[] | null

Samples the track at the specified time in seconds. Times outside its range clamp to the nearest endpoint. Track evaluation does not perform looping; looping is determined by the action.

## AnimationBinding

```typescript
type AnimationBinding = {
  id?: string;
  getValue?: () => readonly number[];
  setValue: (value: number[]) => void;
};
```

- `id` — Stable property identifier. Use the same identifier when separately constructed bindings represent the same property.
- `getValue` — Returns the initial property value used when action weights do not sum to one.
- `setValue` — Applies the final blended property value.

Without an explicit `id`, the binding object identity determines whether tracks target the same property.

## evaluateAnimationSampler

The lower-level sampler can also be evaluated independently:

```typescript
import {evaluateAnimationSampler} from '@luma.gl/engine';

const value = evaluateAnimationSampler(0.5, {
  input: [0, 1],
  output: [[0], [10]],
  interpolation: 'LINEAR'
});

// value is [5].
```

### evaluateAnimationSampler(time, sampler, valueType?): number[] | null

- `time: number` — Sample time in seconds.
- `sampler.input: readonly number[]` — Keyframe times.
- `sampler.output: readonly (readonly number[])[]` — Keyframe value arrays.
- `sampler.interpolation?: AnimationInterpolation` — `'STEP'`, `'LINEAR'`, or `'CUBICSPLINE'`.
- `valueType?: AnimationValueType` — `'vector'` by default, or `'quaternion'`.

Returns the sampled numeric array, or `null` when the sampler does not contain usable keyframes. Quaternion linear interpolation uses spherical interpolation; cubic quaternion results are normalized.

## Related Documentation

- [Animation and deformation guide](/docs/api-guide/engine/animation)
- [Morph-target helpers](/docs/api-reference/engine/animation/morph-targets)
- [AnimationLoop](/docs/api-reference/engine/animation-loop)
- [Timeline](/docs/api-reference/engine/animation/timeline)
- [KeyFrames](/docs/api-reference/engine/animation/key-frames)
