// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {AnimationClipController, Animator} from '@luma.gl/engine';
import {expect, it} from 'vitest';

class TestClip extends AnimationClipController {
  localTimes: number[] = [];

  protected override applyTime(localTimeSeconds: number): void {
    this.localTimes.push(localTimeSeconds);
  }
}

it('Animation#Animator clip controllers resolve local clip time from wall-clock ms', () => {
  const clip = new TestClip({name: 'test-clip', startTime: 0.5, speed: 2});

  clip.setTime(1250);

  expect(clip.localTimes, 'clip converts milliseconds to local seconds').toEqual([1.5]);
  expect(clip.name, 'clip exposes configured name').toBe('test-clip');
});

it('Animation#Animator skips paused clips and exposes compatibility aliases', () => {
  const activeClip = new TestClip({name: 'active'});
  const pausedClip = new TestClip({name: 'paused', playing: false});
  const animator = new Animator([activeClip, pausedClip]);

  animator.setTime(500);

  expect(activeClip.localTimes, 'active clip advances').toEqual([0.5]);
  expect(pausedClip.localTimes, 'paused clip does not advance').toEqual([]);
  expect(animator.animations, 'animations alias matches clip list').toBe(animator.getAnimations());
});
