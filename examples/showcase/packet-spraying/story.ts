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
    title: 'Spraying across four planes',
    description:
      'Alternating packets spread across independent network paths and reunite near their destinations.',
    duration: 8,
    networkState: 'healthy',
    camera: {target: [0, -0.2, 0], distance: 11.8, yaw: 0.78, pitch: 0.49}
  },
  {
    id: 'congestion',
    title: 'Congestion and packet trimming',
    description:
      'An overloaded switch trims packet payloads while small headers trigger retransmission.',
    duration: 7,
    networkState: 'congested',
    camera: {target: [0, 0.65, 0.55], distance: 10.6, yaw: 0.42, pitch: 0.45}
  },
  {
    id: 'failure',
    title: 'Failure and instant rerouting',
    description:
      'A failed switch drops in-flight packets, then traffic moves onto the surviving planes.',
    duration: 8,
    networkState: 'failed',
    camera: {target: [0, 0.7, 0.55], distance: 10.2, yaw: 0.24, pitch: 0.43}
  },
  {
    id: 'recovery',
    title: 'Probe, confirm, restore',
    description:
      'A blue probe reaches the repaired switch, then a cyan acknowledgment restores its plane.',
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
