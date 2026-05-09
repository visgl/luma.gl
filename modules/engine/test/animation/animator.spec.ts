// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {AnimationClipController, Animator} from '@luma.gl/engine';

class TestClip extends AnimationClipController {
  localTimes: number[] = [];

  protected override applyTime(localTimeSeconds: number): void {
    this.localTimes.push(localTimeSeconds);
  }
}

test('Animation#Animator clip controllers resolve local clip time from wall-clock ms', t => {
  const clip = new TestClip({name: 'test-clip', startTime: 0.5, speed: 2});

  clip.setTime(1250);

  t.deepEqual(clip.localTimes, [1.5], 'clip converts milliseconds to local seconds');
  t.equal(clip.name, 'test-clip', 'clip exposes configured name');

  t.end();
});

test('Animation#Animator skips paused clips and exposes compatibility aliases', t => {
  const activeClip = new TestClip({name: 'active'});
  const pausedClip = new TestClip({name: 'paused', playing: false});
  const animator = new Animator([activeClip, pausedClip]);

  animator.setTime(500);

  t.deepEqual(activeClip.localTimes, [0.5], 'active clip advances');
  t.deepEqual(pausedClip.localTimes, [], 'paused clip does not advance');
  t.equal(animator.animations, animator.getAnimations(), 'animations alias matches clip list');

  t.end();
});
