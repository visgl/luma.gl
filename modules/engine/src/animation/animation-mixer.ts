// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AnimationClip} from './animation-clip';
import {interpolateQuaternion, type AnimationValueType} from './animation-interpolation';
import type {AnimationBinding} from './animation-track';

/** Supported clip playback loop modes. */
export type AnimationLoopMode = 'once' | 'repeat' | 'ping-pong';

/** Optional initial playback properties for a clip action. */
export type AnimationActionProps = {
  /** Playback loop behavior. */
  loop?: AnimationLoopMode;
  /** Number of playback traversals before a repeating action finishes. */
  repetitions?: number;
  /** Playback speed and direction. */
  timeScale?: number;
  /** Blend contribution relative to other actions. */
  weight?: number;
};

type AnimationFade = {
  duration: number;
  elapsedTime: number;
  startWeight: number;
  endWeight: number;
};

type AccumulatedAnimationValue = {
  binding: AnimationBinding;
  value: number[];
  valueType: AnimationValueType;
  weight: number;
};

/** Playback state and blend influence for a single animation clip. */
export class AnimationAction {
  readonly clip: AnimationClip;
  readonly mixer: AnimationMixer;
  time: number = 0;
  timeScale: number;
  weight: number;
  loop: AnimationLoopMode;
  repetitions: number;
  paused: boolean = false;
  playing: boolean = false;

  private elapsedTime: number = 0;
  private fade: AnimationFade | null = null;

  constructor(mixer: AnimationMixer, clip: AnimationClip, props: AnimationActionProps = {}) {
    this.mixer = mixer;
    this.clip = clip;
    this.loop = props.loop || 'repeat';
    this.repetitions = props.repetitions ?? Number.POSITIVE_INFINITY;
    this.timeScale = props.timeScale ?? 1;
    this.weight = props.weight ?? 1;
  }

  /** Starts or resumes playback. */
  play(): this {
    this.playing = true;
    this.paused = false;
    return this;
  }

  /** Temporarily suspends playback while preserving local time. */
  pause(): this {
    this.paused = true;
    return this;
  }

  /** Continues playback after pausing. */
  resume(): this {
    this.playing = true;
    this.paused = false;
    return this;
  }

  /** Stops playback and restores the initial clip time. */
  stop(): this {
    this.playing = false;
    this.paused = false;
    this.fade = null;
    return this.reset();
  }

  /** Restores the initial clip time without changing playback state. */
  reset(): this {
    this.elapsedTime = 0;
    this.time = 0;
    return this;
  }

  /** Seeks to the supplied elapsed clip time, in seconds. */
  setTime(time: number): this {
    this.elapsedTime = time;
    this.time = this.resolveLocalTime(time);
    return this;
  }

  /** Selects playback loop behavior and an optional traversal count. */
  setLoop(loop: AnimationLoopMode, repetitions: number = Number.POSITIVE_INFINITY): this {
    this.loop = loop;
    this.repetitions = repetitions;
    this.time = this.resolveLocalTime(this.elapsedTime);
    return this;
  }

  /** Sets the action's blend contribution. */
  setEffectiveWeight(weight: number): this {
    this.weight = Math.max(0, weight);
    this.fade = null;
    return this;
  }

  /** Sets the action's playback speed and direction. */
  setEffectiveTimeScale(timeScale: number): this {
    this.timeScale = timeScale;
    return this;
  }

  /** Fades this action's current weight to full influence. */
  fadeIn(duration: number): this {
    return this.scheduleFade(1, duration);
  }

  /** Fades this action's current weight to zero influence. */
  fadeOut(duration: number): this {
    return this.scheduleFade(0, duration);
  }

  /** Fades this action out while another action fades in. */
  crossFadeTo(action: AnimationAction, duration: number): this {
    action.weight = 0;
    action.play().fadeIn(duration);
    return this.fadeOut(duration);
  }

  /** Fades another action out while this action fades in. */
  crossFadeFrom(action: AnimationAction, duration: number): this {
    action.crossFadeTo(this, duration);
    return this;
  }

  /** @internal Advances playback and pending fades by mixer-relative seconds. */
  advance(deltaTime: number): void {
    if (!this.playing || this.paused) {
      return;
    }

    this.advanceFade(Math.abs(deltaTime));
    this.elapsedTime += deltaTime * this.timeScale;
    this.time = this.resolveLocalTime(this.elapsedTime);
    if (this.hasFinished()) {
      this.playing = false;
    }
  }

  /** @internal Whether this action should contribute its current sampled value. */
  get shouldApply(): boolean {
    return (this.playing || this.hasFinished()) && this.weight > 0;
  }

  private scheduleFade(endWeight: number, duration: number): this {
    if (duration <= 0) {
      this.weight = endWeight;
      this.fade = null;
      return this;
    }
    this.fade = {duration, elapsedTime: 0, startWeight: this.weight, endWeight};
    return this;
  }

  private advanceFade(deltaTime: number): void {
    if (!this.fade) {
      return;
    }
    this.fade.elapsedTime += deltaTime;
    const ratio = Math.min(this.fade.elapsedTime / this.fade.duration, 1);
    this.weight = this.fade.startWeight + (this.fade.endWeight - this.fade.startWeight) * ratio;
    if (ratio === 1) {
      this.fade = null;
    }
  }

  private hasFinished(): boolean {
    const duration = this.clip.duration;
    if (duration <= 0) {
      return this.loop === 'once';
    }
    if (this.loop === 'once') {
      return this.elapsedTime >= duration || this.elapsedTime < 0;
    }
    return (
      Number.isFinite(this.repetitions) && Math.abs(this.elapsedTime) >= duration * this.repetitions
    );
  }

  private resolveLocalTime(elapsedTime: number): number {
    const duration = this.clip.duration;
    if (duration <= 0) {
      return 0;
    }

    if (this.loop === 'once') {
      return Math.min(Math.max(elapsedTime, 0), duration);
    }

    if (Number.isFinite(this.repetitions) && Math.abs(elapsedTime) >= duration * this.repetitions) {
      if (this.loop === 'ping-pong' && this.repetitions % 2 === 0) {
        return 0;
      }
      return elapsedTime < 0 ? 0 : duration;
    }

    const wrappedTime =
      elapsedTime >= 0 && elapsedTime < duration
        ? elapsedTime
        : ((elapsedTime % duration) + duration) % duration;
    if (this.loop === 'repeat') {
      return wrappedTime;
    }

    const traversal = Math.floor(elapsedTime / duration);
    return Math.abs(traversal % 2) === 0 ? wrappedTime : duration - wrappedTime;
  }
}

/** Coordinates reusable clip playback and blends tracks that share a target binding. */
export class AnimationMixer {
  time: number = 0;
  timeScale: number = 1;

  private readonly clips = new Map<string, AnimationClip>();
  private readonly actions = new Map<AnimationClip, AnimationAction>();

  constructor(clips: AnimationClip[] = []) {
    clips.forEach(clip => this.addClip(clip));
  }

  /** Makes a named clip available for playback. */
  addClip(clip: AnimationClip): this {
    this.clips.set(clip.name, clip);
    return this;
  }

  /** Returns the cached playback action for a clip or registered clip name. */
  clipAction(clip: AnimationClip | string, props?: AnimationActionProps): AnimationAction {
    const resolvedClip = typeof clip === 'string' ? this.clips.get(clip) : clip;
    if (!resolvedClip) {
      throw new Error(`Unknown animation clip: ${clip}`);
    }

    this.addClip(resolvedClip);
    let action = this.actions.get(resolvedClip);
    if (!action) {
      action = new AnimationAction(this, resolvedClip, props);
      this.actions.set(resolvedClip, action);
    }
    return action;
  }

  /** Returns a previously created named action, if present. */
  getAction(name: string): AnimationAction | undefined {
    const clip = this.clips.get(name);
    return clip ? this.actions.get(clip) : undefined;
  }

  /** Advances playback by seconds, then applies blended animation values. */
  update(deltaTime: number): this {
    const scaledDeltaTime = deltaTime * this.timeScale;
    this.time += scaledDeltaTime;
    this.actions.forEach(action => action.advance(scaledDeltaTime));
    this.applyValues();
    return this;
  }

  /** Seeks every action to an absolute mixer time, in seconds. */
  setTime(time: number): this {
    this.time = time;
    this.actions.forEach(action => {
      if (!action.paused) {
        action.setTime(time * action.timeScale);
      }
    });
    this.applyValues();
    return this;
  }

  /** Stops and resets all registered playback actions. */
  stopAllAction(): this {
    this.actions.forEach(action => action.stop());
    return this;
  }

  private applyValues(): void {
    const accumulatedValues = new Map<string | AnimationBinding, AccumulatedAnimationValue>();

    this.actions.forEach(action => {
      if (!action.shouldApply) {
        return;
      }

      action.clip.tracks.forEach(track => {
        const value = track.evaluate(action.time);
        if (!value) {
          return;
        }

        const bindingKey = track.binding.id || track.binding;
        const accumulatedValue = accumulatedValues.get(bindingKey);
        if (!accumulatedValue) {
          accumulatedValues.set(bindingKey, {
            binding: track.binding,
            value: [...value],
            valueType: track.valueType,
            weight: action.weight
          });
          return;
        }

        const totalWeight = accumulatedValue.weight + action.weight;
        const ratio = action.weight / totalWeight;
        accumulatedValue.value =
          track.valueType === 'quaternion'
            ? interpolateQuaternion(accumulatedValue.value, value, ratio)
            : accumulatedValue.value.map(
                (component, index) => component + (value[index] - component) * ratio
              );
        accumulatedValue.weight = totalWeight;
      });
    });

    accumulatedValues.forEach(({binding, value, valueType, weight}) => {
      const baseline = weight < 1 ? binding.getValue?.() : undefined;
      if (baseline && baseline.length === value.length) {
        value =
          valueType === 'quaternion'
            ? interpolateQuaternion(baseline, value, weight)
            : value.map(
                (component, index) => baseline[index] + (component - baseline[index]) * weight
              );
      }
      binding.setValue(value);
    });
  }
}
