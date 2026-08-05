// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  evaluateAnimationSampler,
  type AnimationInterpolation,
  type AnimationSampler,
  type AnimationValueType
} from './animation-interpolation';

/** Read/write connection between an animation track and an application property. */
export type AnimationBinding = {
  /** Stable identity used to blend tracks that address the same property. */
  id?: string;
  /** Reads the unanimated property value when an action has less than full influence. */
  getValue?: () => readonly number[];
  /** Applies an interpolated or blended property value. */
  setValue: (value: number[]) => void;
};

/** Construction properties for a reusable keyframe track. */
export type AnimationTrackProps = {
  /** Application-visible track name. */
  name?: string;
  /** Keyframe times, in seconds. */
  times: readonly number[];
  /** Keyframe values, including glTF-compatible cubic spline tangent triples. */
  values: readonly (readonly number[])[];
  /** Interpolation between adjacent keyframes. */
  interpolation?: AnimationInterpolation;
  /** Value interpretation used during interpolation and blending. */
  valueType?: AnimationValueType;
  /** Target property updated when the track is played. */
  binding: AnimationBinding;
};

/** A typed, target-bound keyframe sequence shared by all scene formats. */
export class AnimationTrack {
  readonly name: string;
  readonly times: readonly number[];
  readonly values: readonly (readonly number[])[];
  readonly interpolation: AnimationInterpolation;
  readonly valueType: AnimationValueType;
  readonly binding: AnimationBinding;

  constructor(props: AnimationTrackProps) {
    this.name = props.name || props.binding.id || 'unnamed';
    this.times = props.times;
    this.values = props.values;
    this.interpolation = props.interpolation || 'LINEAR';
    this.valueType = props.valueType || 'vector';
    this.binding = props.binding;
  }

  /** Last keyframe time, in seconds. */
  get duration(): number {
    return this.times[this.times.length - 1] || 0;
  }

  /** glTF-compatible read-only view of this track's keyframe data. */
  get sampler(): AnimationSampler {
    return {input: this.times, output: this.values, interpolation: this.interpolation};
  }

  /** Evaluates the track at an already-resolved clip time, in seconds. */
  evaluate(time: number): number[] | null {
    return evaluateAnimationSampler(time, this.sampler, this.valueType);
  }
}
