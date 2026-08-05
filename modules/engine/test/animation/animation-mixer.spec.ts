// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('Animation#evaluateAnimationSampler clamps values without imposing playback loops', t => {
  const sampler = {input: [1, 2, 3], output: [[10], [20], [30]]};

  t.deepEqual(evaluateAnimationSampler(0, sampler), [10], 'samples before the first key clamp');
  t.deepEqual(evaluateAnimationSampler(1.5, sampler), [15], 'linear samples interpolate');
  t.deepEqual(evaluateAnimationSampler(5, sampler), [30], 'samples after the final key clamp');
  t.deepEqual(
    evaluateAnimationSampler(2, {...sampler, interpolation: 'STEP'}),
    [20],
    'step interpolation advances exactly at keyframe boundaries'
  );
  t.deepEqual(
    evaluateAnimationSampler(2.5, {...sampler, interpolation: 'STEP'}),
    [20],
    'step interpolation preserves the previous keyframe between boundaries'
  );
  t.equal(evaluateAnimationSampler(0, {input: [], output: []}), null, 'empty samplers return null');
  t.equal(
    evaluateAnimationSampler(1.5, {...sampler, interpolation: 'UNKNOWN'}),
    null,
    'unsupported interpolation modes return null'
  );

  t.end();
});

test('Animation#evaluateAnimationSampler interpolates cubic tangents and quaternion rotations', t => {
  const cubicSampler = {
    input: [0, 2],
    interpolation: 'CUBICSPLINE',
    output: [[0], [2], [2], [-2], [6], [0]]
  };
  t.deepEqual(evaluateAnimationSampler(1, cubicSampler), [5], 'cubic tangents scale with key time');
  t.deepEqual(evaluateAnimationSampler(2, cubicSampler), [6], 'cubic endpoints use stored values');

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
  t.ok(rotation, 'quaternion interpolation returns a value');
  t.ok(
    Math.abs((rotation?.[2] || 0) - Math.SQRT1_2) < 1e-12,
    'linear quaternion tracks use shortest-arc spherical interpolation'
  );
  t.ok(
    Math.abs(Math.hypot(...(rotation || [])) - 1) < 1e-12,
    'spherical interpolation preserves unit quaternion length'
  );

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
  t.ok(
    Math.abs(Math.hypot(...(cubicRotation || [])) - 1) < 1e-12,
    'cubic quaternion samples are normalized'
  );

  t.end();
});

test('Animation#AnimationMixer plays named tracks and caches actions', t => {
  let value = 0;
  const binding: AnimationBinding = {id: 'position.x', setValue: next => (value = next[0])};
  const clip = createScalarClip('move', binding, 0, 10, 2);
  const mixer = new AnimationMixer([clip]);
  const action = mixer.clipAction('move').play();

  mixer.update(0.5);

  t.equal(value, 2.5, 'a named action applies its interpolated track');
  t.equal(action.time, 0.5, 'the action exposes local clip time');
  t.equal(mixer.time, 0.5, 'the mixer exposes accumulated playback time');
  t.equal(mixer.clipAction(clip), action, 'clip actions are cached');
  t.equal(mixer.getAction('move'), action, 'actions are available by clip name');
  t.equal(mixer.getAction('missing'), undefined, 'missing actions return undefined');
  t.throws(() => mixer.clipAction('missing'), 'unknown clip names are rejected');

  t.end();
});

test('Animation#AnimationMixer resolves repeat, once, ping-pong, and finite loop boundaries', t => {
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
      t.equal(currentValue, values[index], `${loop} resolves traversal ${index + 1}`);
    });

    if (loop === 'once') {
      t.false(action.playing, 'once playback stops after applying its final keyframe');
    }
  });

  let finiteValue = 0;
  const finiteClip = createScalarClip('finite', {setValue: next => (finiteValue = next[0])}, 0, 1);
  const finiteMixer = new AnimationMixer([finiteClip]);
  const finiteAction = finiteMixer.clipAction('finite').setLoop('ping-pong', 2).play();
  finiteMixer.update(2);
  t.equal(finiteValue, 0, 'an even finite ping-pong traversal finishes at the first key');
  t.false(finiteAction.playing, 'finite traversal counts stop playback');

  t.end();
});

test('Animation#AnimationMixer supports seeking, speed, reverse playback, pausing, and stopping', t => {
  let value = 0;
  const clip = createScalarClip('move', {setValue: next => (value = next[0])}, 0, 10);
  const mixer = new AnimationMixer([clip]);
  const action = mixer.clipAction('move').play().setEffectiveTimeScale(2);

  mixer.update(0.2);
  t.equal(value, 4, 'positive time scales accelerate playback');

  action.pause();
  mixer.update(0.2);
  t.equal(value, 4, 'paused actions retain their sampled value');

  action.resume().setEffectiveTimeScale(-1);
  mixer.update(0.3);
  t.ok(Math.abs(value - 1) < 1e-12, 'negative time scales reverse playback');

  action.setTime(0.8);
  mixer.update(0);
  t.equal(value, 8, 'actions can seek independently');

  mixer.timeScale = 0.5;
  action.setEffectiveTimeScale(1);
  mixer.update(0.2);
  t.ok(Math.abs(value - 9) < 1e-12, 'mixer time scales affect every action');

  mixer.setTime(0.25);
  t.equal(value, 2.5, 'absolute mixer seeks sample the requested time');

  mixer.stopAllAction();
  t.equal(action.time, 0, 'stopping actions resets local time');
  t.false(action.playing, 'stopping actions disables playback');

  t.end();
});

test('Animation#AnimationMixer blends weighted actions against shared property bindings', t => {
  let value = 0;
  const firstBinding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const secondBinding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const firstClip = createScalarClip('first', firstBinding, 0, 10);
  const secondClip = createScalarClip('second', secondBinding, 10, 20);
  const mixer = new AnimationMixer([firstClip, secondClip]);
  mixer.clipAction('first', {weight: 0.25}).play();
  mixer.clipAction('second', {weight: 0.75}).play();

  mixer.update(0.5);

  t.equal(value, 12.5, 'tracks with the same binding identity blend by action weight');

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

  t.equal(baselineValue, 7, 'partial influence blends against an optional target baseline');

  t.end();
});

test('Animation#AnimationMixer crossfades clips and normalizes blended quaternions', t => {
  let value = 0;
  const binding: AnimationBinding = {id: 'shared', setValue: next => (value = next[0])};
  const firstClip = createScalarClip('first', binding, 0, 0);
  const secondClip = createScalarClip('second', binding, 10, 10);
  const mixer = new AnimationMixer([firstClip, secondClip]);
  const firstAction = mixer.clipAction('first').play();
  const secondAction = mixer.clipAction('second');

  firstAction.crossFadeTo(secondAction, 2);
  mixer.update(1);
  t.equal(value, 5, 'crossfades blend both clips at their midpoint');
  t.equal(firstAction.weight, 0.5, 'the outgoing action fades toward zero');
  t.equal(secondAction.weight, 0.5, 'the incoming action fades toward one');

  mixer.update(1);
  t.equal(value, 10, 'crossfades finish with the incoming clip');
  t.equal(firstAction.weight, 0, 'the outgoing action reaches zero influence');
  t.equal(secondAction.weight, 1, 'the incoming action reaches full influence');

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

  t.ok(Math.abs(Math.hypot(...quaternion) - 1) < 1e-12, 'blended quaternions remain normalized');
  t.ok(Math.abs(quaternion[2] - Math.SQRT1_2) < 1e-12, 'quaternion blends follow the shortest arc');

  t.end();
});
