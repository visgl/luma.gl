// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ANARIMatrix4, ANARIVector3, ANARIVector4} from './anari-types';

/** Interpolation modes supported by serialized ANARI animation tracks. */
export type ANARIAnimationInterpolation = 'STEP' | 'LINEAR' | 'CUBICSPLINE';

/** Retained scene object or transform node addressed by an animation track. */
export type ANARIAnimationTargetType =
  | 'node'
  | 'instance'
  | 'material'
  | 'sampler'
  | 'light'
  | 'camera';

/** Stable serialized target of one animation channel. */
export type ANARIAnimationTarget = {
  type: ANARIAnimationTargetType;
  identifier: string;
  path: string;
  component?: number;
};

/** Optional source transform used when animating a retained texture sampler. */
export type ANARIAnimationTextureTransform = {
  offset: readonly [number, number];
  rotation: number;
  scale: readonly [number, number];
};

/** JSON-compatible keyframe sequence owned by the shared engine animation mixer. */
export type ANARIAnimationTrackDescription = {
  target: ANARIAnimationTarget;
  times: readonly number[];
  values: readonly (readonly number[])[];
  interpolation?: ANARIAnimationInterpolation;
  baseTransform?: ANARIAnimationTextureTransform;
};

/** Named clip serialized with an ANARI scene. */
export type ANARIAnimationClipDescription = {
  name: string;
  tracks: readonly ANARIAnimationTrackDescription[];
  duration?: number;
};

/** Local transform hierarchy preserved independently from retained surface instances. */
export type ANARIAnimationNodeDescription = {
  parent?: string;
  translation?: ANARIVector3;
  rotation?: ANARIVector4;
  scale?: ANARIVector3;
  matrix?: ANARIMatrix4;
  instances?: readonly string[];
  /** Initial glTF morph-target weights owned by this source node. */
  weights?: readonly number[];
  /** Retained primitive geometries affected only by this node's morph channels. */
  geometries?: readonly string[];
};

/** Initial action settings for a serialized animated scene. */
export type ANARIAnimationPlaybackDescription = {
  clip?: string;
  playing?: boolean;
  speed?: number;
  loop?: 'once' | 'repeat' | 'ping-pong';
};

/** Optional animation payload shared by ANARI JSON and the glTF integration adapter. */
export type ANARIAnimationSceneDescription = {
  nodes?: Readonly<Record<string, ANARIAnimationNodeDescription>>;
  clips?: readonly ANARIAnimationClipDescription[];
  playback?: ANARIAnimationPlaybackDescription;
};
