// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {AGGREGATION_POSITIONS, LEAF_POSITIONS, type Vector3} from './network';

export type NetworkStoryState = 'healthy' | 'congested' | 'failed' | 'recovering';

export type NetworkStoryCamera = {
  distance: number;
  pitch: number;
  target: Vector3;
  yaw: number;
};

export type NetworkStoryChapter = {
  camera: NetworkStoryCamera;
  description: string;
  duration: number;
  id: string;
  networkState: NetworkStoryState;
  title: string;
};

export type NetworkStoryProgress = {
  chapterProgress: number;
  overallProgress: number;
};

export type NetworkOpticsProfile = {
  bloom: number;
  caustics: number;
  illumination: number;
  label: string;
  level: number;
  motion: number;
  refraction: number;
  spectral: number;
  surface: number;
};

export const MAX_NETWORK_OPTICS_LEVEL = 11;
export const DEFAULT_NETWORK_OPTICS_LEVEL = 7;
export const GUIDED_STORY_SWITCH_INDEX = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + 1;

export const NETWORK_STORY_CHAPTERS: readonly NetworkStoryChapter[] = [
  {
    id: 'conversations',
    title: 'Two conversations',
    description: 'Red and green packets leave separate servers and meet at a shared access switch.',
    duration: 7,
    networkState: 'healthy',
    camera: {target: [0, -0.85, 0], distance: 12.8, yaw: 0.52, pitch: 0.58}
  },
  {
    id: 'packet-spraying',
    title: 'Spraying across four paths',
    description:
      'Alternating packets cross two switch planes through four independent paths before reuniting.',
    duration: 8,
    networkState: 'healthy',
    camera: {target: [0, -0.2, 0], distance: 11.8, yaw: 0.78, pitch: 0.49}
  },
  {
    id: 'congestion',
    title: 'Congestion and packet trimming',
    description:
      'Packets shift toward healthy backbone paths while an overloaded switch trims payloads into headers.',
    duration: 7,
    networkState: 'congested',
    camera: {target: [0, 0.65, 0.55], distance: 10.6, yaw: 0.42, pitch: 0.45}
  },
  {
    id: 'failure',
    title: 'Failure and instant rerouting',
    description:
      'A failed switch drops in-flight packets, then traffic moves onto the surviving backbone paths.',
    duration: 8,
    networkState: 'failed',
    camera: {target: [0, 0.7, 0.55], distance: 10.2, yaw: 0.24, pitch: 0.43}
  },
  {
    id: 'recovery',
    title: 'Probe, confirm, restore',
    description:
      'A blue probe reaches the repaired switch, then a cyan acknowledgment restores its path.',
    duration: 7,
    networkState: 'recovering',
    camera: {target: [0, 0.9, 0.65], distance: 9.8, yaw: 0.16, pitch: 0.46}
  }
];

export function getWrappedStoryChapterIndex(chapterIndex: number): number {
  return (
    ((chapterIndex % NETWORK_STORY_CHAPTERS.length) + NETWORK_STORY_CHAPTERS.length) %
    NETWORK_STORY_CHAPTERS.length
  );
}

export function getNetworkStoryChapter(chapterIndex: number): NetworkStoryChapter {
  return NETWORK_STORY_CHAPTERS[getWrappedStoryChapterIndex(chapterIndex)];
}

/** Returns bounded chapter and duration-weighted full-tour playback progress. */
export function getNetworkStoryProgress(
  chapterIndex: number,
  elapsedTime: number
): NetworkStoryProgress {
  const wrappedIndex = getWrappedStoryChapterIndex(chapterIndex);
  const chapter = NETWORK_STORY_CHAPTERS[wrappedIndex];
  const boundedElapsedTime = Number.isFinite(elapsedTime)
    ? Math.max(0, Math.min(elapsedTime, chapter.duration))
    : 0;
  const elapsedPreviousChapters = NETWORK_STORY_CHAPTERS.slice(0, wrappedIndex).reduce(
    (totalDuration, previousChapter) => totalDuration + previousChapter.duration,
    0
  );
  const totalDuration = NETWORK_STORY_CHAPTERS.reduce(
    (duration, storyChapter) => duration + storyChapter.duration,
    0
  );

  return {
    chapterProgress: boundedElapsedTime / chapter.duration,
    overallProgress: (elapsedPreviousChapters + boundedElapsedTime) / totalDuration
  };
}

/** Brings optical techniques online progressively while keeping low settings packet-first. */
export function makeNetworkOpticsProfile(level: number): NetworkOpticsProfile {
  const normalizedLevel = Number.isFinite(level)
    ? Math.max(0, Math.min(level, MAX_NETWORK_OPTICS_LEVEL))
    : DEFAULT_NETWORK_OPTICS_LEVEL;
  const stage = (start: number, end: number): number => {
    const progress = Math.max(0, Math.min((normalizedLevel - start) / (end - start), 1));
    return progress * progress * (3 - 2 * progress);
  };
  const fireworks = stage(8, MAX_NETWORK_OPTICS_LEVEL);

  return {
    bloom: stage(3.5, 8.5) * (1 + fireworks * 0.18),
    caustics: stage(5.5, MAX_NETWORK_OPTICS_LEVEL) * (1 + fireworks * 0.35),
    illumination: stage(2, 7.25) * (1 + fireworks * 0.2),
    label:
      normalizedLevel < 2
        ? 'Diagram'
        : normalizedLevel < 4.5
          ? 'Clear glass'
          : normalizedLevel < 7.5
            ? 'Cinematic'
            : normalizedLevel < 10
              ? 'Spectral'
              : 'Fireworks',
    level: normalizedLevel,
    motion: stage(2.75, 7.5) * (1 + fireworks * 0.16),
    refraction: stage(1.5, 6.25) * (1 + fireworks * 0.12),
    spectral: stage(5, 10) * (1 + fireworks * 0.25),
    surface: stage(0, 3)
  };
}
