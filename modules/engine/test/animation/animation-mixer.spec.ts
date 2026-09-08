// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  AnimationTrack,
  evaluateAnimationSampler,
  type AnimationBinding,
  type AnimationLoopMode
} from '@luma.gl/engine';

function createScalarClip(
  name: string,
  binding: AnimationBinding,
  startValue: number,
  endValue: number,
  duration: number = 1
): AnimationClip {
  return new AnimationClip({
    name,
    tracks: [
      new AnimationTrack({
        name: `${name}.value`,
        times: [0, duration],
        values: [[startValue], [endValue]],
        binding
      })
    ]
  });
}

it('Animation#evaluateAnimationSampler clamps values without imposing playback loops', () => {
  const sampler = {input: [1, 2, 3], output: [[10], [20], [30]]};

  expect(evaluateAnimationSampler(0, sampler), 'samples before the first key clamp').toEqual([10]);
  expect(evaluateAnimationSampler(1.5, sampler), 'linear samples interpolate').toEqual([15]);
  expect(evaluateAnimationSampler(5, sampler), 'samples after the final key clamp').toEqual([30]);
  expect(
    evaluateAnimationSampler(2, {...sampler, interpolation: 'STEP'}),
    'step interpolation advances exactly at keyframe boundaries'
  ).toEqual([20]);
  expect(
    evaluateAnimationSampler(2.5, {...sampler, interpolation: 'STEP'}),
    'step interpolation preserves the previous keyframe between boundaries'
  ).toEqual([20]);
  expect(evaluateAnimationSampler(0, {input: [], output: []}), 'empty samplers return null').toBe(
    null
  );
  expect(
    evaluateAnimationSampler(1.5, {...sampler, interpolation: 'UNKNOWN'}),
    'unsupported interpolation modes return null'
  ).toBe(null);

  void 0;
});

it('Animation#evaluateAnimationSampler interpolates cubic tangents and quaternion rotations', () => {
  const cubicSampler = {
    input: [0, 2],
    interpolation: 'CUBICSPLINE',
    output: [[0], [2], [2], [-2], [6], [0]]
  };
  expect(evaluateAnimationSampler(1, cubicSampler), 'cubic tangents scale with key time').toEqual([
    5
  ]);
  expect(evaluateAnimationSampler(2, cubicSampler), 'cubic endpoints use stored values').toEqual([
    6
  ]);

  const rotation = evaluateAnimationSampler(
    0.5,
    {
      input: [0, 1],
      output: [
        [0, 0, 0, 1],
        [0, 0, 1, 0]
      ]
    },
    'quaternion'
  );
  expect(Boolean(rotation), 'quaternion interpolation returns a value').toBe(true);
  expect(
    Boolean(Math.abs((rotation?.[2] || 0) - Math.SQRT1_2) < 1e-12),
    'linear quaternion tracks use shortest-arc spherical interpolation'
  ).toBe(true);
  expect(
    Boolean(Math.abs(Math.hypot(...(rotation || [])) - 1) < 1e-12),
    'spherical interpolation preserves unit quaternion length'
  ).toBe(true);

  const cubicRotation = evaluateAnimationSampler(
    0.5,
    {
      input: [0, 1],
      interpolation: 'CUBICSPLINE',
      output: [
        [0, 0, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
      ]
    },
    'quaternion'
  );
  expect(
    Boolean(Math.abs(Math.hypot(...(cubicRotation || [])) - 1) < 1e-12),
    'cubic quaternion samples are normalized'
  ).toBe(true);

  void 0;
});

it('Animation#AnimationMixer plays named tracks and caches actions', () => {
  let value = 0;
  const binding: AnimationBinding = {id: 'position.x', setValue: next => (value = next[0])};
  const clip = createScalarClip('move', binding, 0, 10, 2);
  const mixer = new AnimationMixer([clip]);
  const action = mixer.clipAction('move').play();

  mixer.update(0.5);

  expect(value, 'a named action applies its interpolated track').toBe(2.5);
  expect(action.time, 'the action exposes local clip time').toBe(0.5);
  expect(mixer.time, 'the mixer exposes accumulated playback time').toBe(0.5);
  expect(mixer.clipAction(clip), 'clip actions are cached').toBe(action);
  expect(mixer.getAction('move'), 'actions are available by clip name').toBe(action);
  expect(mixer.getAction('missing'), 'missing actions return undefined').toBe(undefined);
  expect(() => mixer.clipAction('missing'), 'unknown clip names are rejected').toThrow();

  void 0;
});

it('Animation#AnimationMixer resolves repeat, once, ping-pong, and finite loop boundaries', () => {
  const expectations: Array<{loop: AnimationLoopMode; times: number[]; values: number[]}> = [
    {loop: 'repeat', times: [0.75, 0.5, 0.75], values: [0.75, 0.25, 0]},
    {loop: 'ping-pong', times: [0.75, 0.5, 0.75], values: [0.75, 0.75, 0]},
    {loop: 'once', times: [0.75, 0.5], values: [0.75, 1]}
  ];

  expectations.forEach(({loop, times, values}) => {
    let currentValue = 0;
    const clip = createScalarClip(loop, {setValue: next => (currentValue = next[0])}, 0, 1);
    const mixer = new AnimationMixer([clip]);
    const action = mixer.clipAction(loop, {loop}).play();

    times.forEach((time, index) => {
      mixer.update(time);
      expect(currentValue, `${loop} resolves traversal ${index + 1}`).toBe(values[index]);
    });

    if (loop === 'once') {
      expect(Boolean(action.playing), 'once playback stops after applying its final keyframe').toBe(
        false
      );
    }
  });

  let finiteValue = 0;
  const finiteClip = createScalarClip('finite', {setValue: next => (finiteValue = next[0])}, 0, 1);
  const finiteMixer = new AnimationMixer([finiteClip]);
  const finiteAction = finiteMixer.clipAction('finite').setLoop('ping-pong', 2).play();
  finiteMixer.update(2);
  expect(finiteValue, 'an even finite ping-pong traversal finishes at the first key').toBe(0);
  expect(Boolean(finiteAction.playing), 'finite traversal counts stop playback').toBe(false);

  void 0;
});

it('Animation#AnimationMixer supports seeking, speed, reverse playback, pausing, and stopping', () => {
  let value = 0;
  const clip = createScalarClip('move', {setValue: next => (value = next[0])}, 0, 10);
  const mixer = new AnimationMixer([clip]);
  const action = mixer.clipAction('move').play().setEffectiveTimeScale(2);

  mixer.update(0.2);
  expect(value, 'positive time scales accelerate playback').toBe(4);

  action.pause();
  mixer.update(0.2);
  expect(value, 'paused actions retain their sampled value').toBe(4);

  action.resume().setEffectiveTimeScale(-1);
  mixer.update(0.3);
  expect(Boolean(Math.abs(value - 1) < 1e-12), 'negative time scales reverse playback').toBe(true);

  action.setTime(0.8);
  mixer.update(0);
  expect(value, 'actions can seek independently').toBe(8);

  mixer.timeScale = 0.5;
  action.setEffectiveTimeScale(1);
  mixer.update(0.2);
  expect(Boolean(Math.abs(value - 9) < 1e-12), 'mixer time scales affect every action').toBe(true);

  mixer.setTime(0.25);
  expect(value, 'absolute mixer seeks sample the requested time').toBe(2.5);

  mixer.stopAllAction();
  expect(action.time, 'stopping actions resets local time').toBe(0);
  expect(Boolean(action.playing), 'stopping actions disables playback').toBe(false);

  void 0;
});

it('Animation#AnimationMixer blends weighted actions against shared property bindings', () => {
  let value = 0;
  const firstBinding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const secondBinding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const firstClip = createScalarClip('first', firstBinding, 0, 10);
  const secondClip = createScalarClip('second', secondBinding, 10, 20);
  const mixer = new AnimationMixer([firstClip, secondClip]);
  mixer.clipAction('first', {weight: 0.25}).play();
  mixer.clipAction('second', {weight: 0.75}).play();

  mixer.update(0.5);

  expect(value, 'tracks with the same binding identity blend by action weight').toBe(12.5);

  let baselineValue = 4;
  const baselineClip = createScalarClip(
    'baseline',
    {
      getValue: () => [baselineValue],
      setValue: next => (baselineValue = next[0])
    },
    8,
    12
  );
  const baselineMixer = new AnimationMixer([baselineClip]);
  baselineMixer.clipAction('baseline', {weight: 0.5}).play();
  baselineMixer.update(0.5);

  expect(baselineValue, 'partial influence blends against an optional target baseline').toBe(7);

  void 0;
});

it('Animation#AnimationMixer preserves bind poses across partial weights and completed fades', () => {
  let value = 2;
  const clip = createScalarClip(
    'bind-pose',
    {
      id: 'bind-pose',
      getValue: () => [value],
      setValue: next => (value = next[0])
    },
    10,
    10,
    2
  );
  const mixer = new AnimationMixer([clip]);
  const action = mixer.clipAction('bind-pose', {weight: 0.5}).play();

  mixer.update(0.25);
  expect(value, 'partial influence initially blends against the original bind pose').toBe(6);

  mixer.update(0.25);
  expect(value, 'later samples keep blending against the immutable original bind pose').toBe(6);

  action.setEffectiveWeight(1);
  mixer.update(0);
  expect(value, 'full influence applies the animated value').toBe(10);

  action.fadeOut(1);
  mixer.update(0.5);
  expect(value, 'fade-outs continue blending against the original bind pose').toBe(6);

  mixer.update(0.5);
  expect(value, 'zero-weight completed fades restore the original bind pose').toBe(2);

  void 0;
});

it('Animation#AnimationMixer crossfades clips and normalizes blended quaternions', () => {
  let value = 0;
  const binding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const firstClip = createScalarClip('first', binding, 0, 0);
  const secondClip = createScalarClip('second', binding, 10, 10);
  const mixer = new AnimationMixer([firstClip, secondClip]);
  const firstAction = mixer.clipAction('first').play();
  const secondAction = mixer.clipAction('second');

  firstAction.crossFadeTo(secondAction, 2);
  mixer.update(1);
  expect(value, 'crossfades blend both clips at their midpoint').toBe(5);
  expect(firstAction.weight, 'the outgoing action fades toward zero').toBe(0.5);
  expect(secondAction.weight, 'the incoming action fades toward one').toBe(0.5);

  mixer.update(1);
  expect(value, 'crossfades finish with the incoming clip').toBe(10);
  expect(firstAction.weight, 'the outgoing action reaches zero influence').toBe(0);
  expect(secondAction.weight, 'the incoming action reaches full influence').toBe(1);

  let quaternion: number[] = [];
  const quaternionBinding: AnimationBinding = {
    id: 'rotation',
    setValue: next => (quaternion = next)
  };
  const rotationClips = [
    new AnimationClip({
      name: 'identity',
      tracks: [
        new AnimationTrack({
          times: [0],
          values: [[0, 0, 0, 1]],
          valueType: 'quaternion',
          binding: quaternionBinding
        })
      ]
    }),
    new AnimationClip({
      name: 'turned',
      tracks: [
        new AnimationTrack({
          times: [0],
          values: [[0, 0, 1, 0]],
          valueType: 'quaternion',
          binding: quaternionBinding
        })
      ]
    })
  ];
  const rotationMixer = new AnimationMixer(rotationClips);
  rotationMixer.clipAction('identity', {weight: 0.5}).play();
  rotationMixer.clipAction('turned', {weight: 0.5}).play();
  rotationMixer.update(0);

  expect(
    Boolean(Math.abs(Math.hypot(...quaternion) - 1) < 1e-12),
    'blended quaternions remain normalized'
  ).toBe(true);
  expect(
    Boolean(Math.abs(quaternion[2] - Math.SQRT1_2) < 1e-12),
    'quaternion blends follow the shortest arc'
  ).toBe(true);

  void 0;
});
