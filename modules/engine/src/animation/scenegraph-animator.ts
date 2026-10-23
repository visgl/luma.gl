// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Animator, AnimationClipController} from './animator';
import {AnimationClip} from './animation-clip';
import {AnimationMixer, type AnimationAction} from './animation-mixer';

export type AnimationSelectionOptions = {crossFadeDuration?: number};
export type ScenegraphAnimationClip = AnimationClipController & {action: AnimationAction};

/** Playback policy shared by imported and programmatic scene animations. */
export class ScenegraphAnimator<TClip extends ScenegraphAnimationClip> extends Animator<TClip> {
  readonly mixer: AnimationMixer;
  activeClip: string | undefined;
  private onUpdate?: () => void;
  private previousTimeSeconds: number | undefined;

  constructor(
    clips: TClip[],
    mixer: AnimationMixer,
    options: {
      onUpdate?: () => void;
      autoplay?: 'all' | 'first' | false;
    } = {}
  ) {
    super(clips);
    this.mixer = mixer;
    this.onUpdate = options.onUpdate;
    this.activeClip = clips[0]?.name;
    if (options.autoplay === false) {
      for (const clip of clips) {
        clip.playing = false;
        clip.action.stop();
      }
    } else if (options.autoplay === 'first' && this.activeClip) this.selectClip(this.activeClip);
  }

  /** Registers the dependent scenegraph update performed once after each animation frame. */
  setUpdateHandler(callback: (() => void) | undefined): this {
    this.onUpdate = callback;
    return this;
  }

  /** Resolves legacy wall-clock milliseconds while evaluating all clips in one mixer pass. */
  override setTime(timeMs: number): void {
    const absoluteTimeSeconds = timeMs / 1000;
    const elapsedSeconds =
      this.previousTimeSeconds === undefined ? 0 : absoluteTimeSeconds - this.previousTimeSeconds;
    this.previousTimeSeconds = absoluteTimeSeconds;
    const scaledElapsedSeconds = elapsedSeconds * this.mixer.timeScale;

    this.clips.forEach(clip => {
      if (!clip.playing) {
        clip.action.stop();
        return;
      }
      if (clip.action.paused) {
        return;
      }
      clip.action.resume();
      const localTime = Math.max(0, absoluteTimeSeconds - clip.startTime) * clip.speed;
      clip.action.setTime(localTime - scaledElapsedSeconds * clip.action.timeScale);
    });
    this.mixer.update(elapsedSeconds);
    this.onUpdate?.();
  }

  /** Advances clips using delta seconds without converting the legacy millisecond clock. */
  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
    this.onUpdate?.();
  }

  /** Selects one imported clip and optionally crossfades from the previous selection. */
  selectClip(name: string, options: AnimationSelectionOptions = {}): TClip {
    const nextClip = this.clips.find(clip => clip.name === name);
    if (!nextClip) {
      throw new Error(`Unknown animation clip: ${name}`);
    }

    const previousClip = this.clips.find(clip => clip.name === this.activeClip);
    const crossFadeDuration = options.crossFadeDuration || 0;
    for (const clip of this.clips) {
      if (clip !== nextClip && !(crossFadeDuration > 0 && clip === previousClip)) {
        clip.playing = false;
        clip.action.stop();
      }
    }

    nextClip.playing = true;
    if (crossFadeDuration > 0 && previousClip && previousClip !== nextClip) {
      previousClip.playing = true;
      previousClip.action.crossFadeTo(nextClip.action, crossFadeDuration);
    } else {
      nextClip.action.reset().setEffectiveWeight(1).play();
    }
    this.activeClip = name;
    return nextClip;
  }
}

/** A reusable clip controller backed by an engine mixer action. */
export class MixerAnimationClip extends AnimationClipController {
  readonly action: AnimationAction;
  constructor(
    readonly clip: AnimationClip,
    readonly mixer: AnimationMixer = new AnimationMixer()
  ) {
    super({name: clip.name});
    this.action = mixer.clipAction(clip).play();
  }
  protected override applyTime(time: number): void {
    this.action.setTime(time);
    this.mixer.update(0);
  }
}
