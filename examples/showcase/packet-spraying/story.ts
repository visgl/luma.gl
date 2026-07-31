// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AGGREGATION_POSITIONS,
  LEAF_POSITIONS,
  SWITCH_CONFIRMATION_DURATION,
  SWITCH_PROBE_DURATION,
  type Color,
  type Vector3
} from './network';

export type NetworkStoryState = 'healthy' | 'congested' | 'failed' | 'recovering';

export type NetworkStoryBeat = {
  color: string;
  description: string;
  id: string;
  pathIndex?: number;
  planeIndex?: number;
  position: number;
  title: string;
};

export type NetworkStoryCamera = {
  distance: number;
  pitch: number;
  target: Vector3;
  yaw: number;
};

export type NetworkStoryChapter = {
  beats: readonly NetworkStoryBeat[];
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

export type NetworkDynamicRangeProfile = {
  bloomIntensityScale: number;
  bloomThresholdScale: number;
  displayMode: 'extended-hdr' | 'floating-point' | 'standard';
  emissionScale: number;
  exposureScale: number;
  highlightBoost: number;
  illuminationScale: number;
  maximumLuminance: number;
  sceneIsFloatingPoint: boolean;
  specularScale: number;
};

export type NetworkDynamicRangeOptions = {
  deviceType: string;
  displaySupportsHighDynamicRange: boolean;
  highlightBoost?: number;
  presentationColorFormat: string;
  sceneColorFormat: string;
  visualIntensity: number;
};

export const MAX_NETWORK_OPTICS_LEVEL = 11;
export const DEFAULT_NETWORK_OPTICS_LEVEL = 7;
export const MAX_NETWORK_HDR_HIGHLIGHT_BOOST = 0.8;
export const DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST = 0.28;
export const GUIDED_STORY_SWITCH_INDEX = LEAF_POSITIONS.length + AGGREGATION_POSITIONS.length + 1;
const RECOVERY_CHAPTER_DURATION = 7;

export const NETWORK_STORY_CHAPTERS: readonly NetworkStoryChapter[] = [
  {
    id: 'conversations',
    title: 'Two conversations',
    description: 'Red and green packets leave separate servers and meet at a shared access switch.',
    duration: 7,
    networkState: 'healthy',
    beats: [
      {
        id: 'sources',
        title: 'Independent senders',
        description: 'Separate red and green servers launch their first packets.',
        color: '#a8c7ff',
        pathIndex: 0,
        position: 0.05
      },
      {
        id: 'interleave',
        title: 'Packets interleave',
        description: 'The source-side access plane interleaves one red packet with one green.',
        color: '#77adff',
        planeIndex: 0,
        position: 0.35
      },
      {
        id: 'destinations',
        title: 'Separate destinations',
        description: 'The destination plane separates both streams into their target servers.',
        color: '#77dfa4',
        planeIndex: 1,
        position: 0.71
      }
    ],
    camera: {target: [0, -0.85, 0], distance: 12.8, yaw: 0.52, pitch: 0.58}
  },
  {
    id: 'packet-spraying',
    title: 'Spraying across four paths',
    description:
      'Alternating packets cross two switch planes through four independent paths before reuniting.',
    duration: 8,
    networkState: 'healthy',
    beats: [
      {
        id: 'path-1',
        title: 'Backbone path one',
        description: 'The first spine carries alternating red and green packets.',
        color: '#83bcff',
        pathIndex: 0,
        position: 0.04
      },
      {
        id: 'path-2',
        title: 'Backbone path two',
        description: 'The next packets use an independent second spine.',
        color: '#83bcff',
        pathIndex: 1,
        position: 0.28
      },
      {
        id: 'path-3',
        title: 'Backbone path three',
        description: 'A third independent path adds throughput without congestion.',
        color: '#83bcff',
        pathIndex: 2,
        position: 0.52
      },
      {
        id: 'path-4',
        title: 'Backbone path four',
        description: 'The fourth path completes the load-balanced packet spray.',
        color: '#83bcff',
        pathIndex: 3,
        position: 0.76
      }
    ],
    camera: {target: [0, -0.2, 0], distance: 11.8, yaw: 0.78, pitch: 0.49}
  },
  {
    id: 'congestion',
    title: 'Congestion and packet trimming',
    description:
      'Packets shift toward healthy backbone paths while an overloaded switch trims payloads into headers.',
    duration: 7,
    networkState: 'congested',
    beats: [
      {
        id: 'pressure',
        title: 'Switch congestion',
        description: 'An amber spine becomes congested as incoming packets begin to queue.',
        color: '#ffbd68',
        pathIndex: 1,
        position: 0
      },
      {
        id: 'queued',
        title: 'Packets queue',
        description: 'Alternating red and green packets briefly accumulate before the switch.',
        color: '#ffc26f',
        pathIndex: 1,
        position: 0.3
      },
      {
        id: 'trimmed',
        title: 'Headers continue',
        description: 'The switch trims overloaded payloads while their compact headers continue.',
        color: '#ff9a54',
        pathIndex: 1,
        position: 0.53
      },
      {
        id: 'rebalanced',
        title: 'Healthy paths absorb load',
        description: 'Senders shift most packets toward healthy spines without retiring the path.',
        color: '#75dfa8',
        pathIndex: 2,
        position: 0.75
      }
    ],
    camera: {target: [0, 0.65, 0.55], distance: 10.6, yaw: 0.42, pitch: 0.45}
  },
  {
    id: 'failure',
    title: 'Failure and instant rerouting',
    description:
      'A failed switch drops in-flight packets, then traffic moves onto the surviving backbone paths.',
    duration: 8,
    networkState: 'failed',
    beats: [
      {
        id: 'packet-loss',
        title: 'In-flight packets are lost',
        description: 'The failing spine scatters the packets already committed to its path.',
        color: '#ff655e',
        pathIndex: 1,
        position: 0
      },
      {
        id: 'retired',
        title: 'Failed path retires',
        description: 'MRC detects packet loss and immediately removes the failed spine.',
        color: '#ff7869',
        pathIndex: 1,
        position: 0.28
      },
      {
        id: 'retransmitted',
        title: 'Missing packets retransmit',
        description: 'Missing red and green payloads retransmit through an independent spine.',
        color: '#85dca7',
        pathIndex: 2,
        position: 0.51
      },
      {
        id: 'surviving',
        title: 'Training continues',
        description: 'The remaining healthy paths keep both conversations moving.',
        color: '#83c6ff',
        pathIndex: 3,
        position: 0.76
      }
    ],
    camera: {target: [0, 0.7, 0.55], distance: 10.2, yaw: 0.24, pitch: 0.43}
  },
  {
    id: 'recovery',
    title: 'Probe, confirm, restore',
    description:
      'A blue probe reaches the repaired switch, then a cyan acknowledgment restores its path.',
    duration: RECOVERY_CHAPTER_DURATION,
    networkState: 'recovering',
    beats: [
      {
        id: 'probe',
        title: 'Control probe',
        description: 'A blue control packet probes the repaired spine before traffic resumes.',
        color: '#69aaff',
        pathIndex: 1,
        position: 0
      },
      {
        id: 'confirmation',
        title: 'Path confirmation',
        description: 'A cyan acknowledgment returns and confirms the entire route is healthy.',
        color: '#70eddf',
        pathIndex: 1,
        position: SWITCH_PROBE_DURATION / RECOVERY_CHAPTER_DURATION
      },
      {
        id: 'restored',
        title: 'Ordinary traffic resumes',
        description: 'Only after confirmation do alternating data packets return to the spine.',
        color: '#7de9a5',
        pathIndex: 1,
        position: (SWITCH_PROBE_DURATION + SWITCH_CONFIRMATION_DURATION) / RECOVERY_CHAPTER_DURATION
      }
    ],
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

/** Returns the most recent named event reached within the current story chapter. */
export function getNetworkStoryBeat(
  chapterIndex: number,
  elapsedTime: number
): NetworkStoryBeat | null {
  const chapter = getNetworkStoryChapter(chapterIndex);
  const progress = Number.isFinite(elapsedTime)
    ? Math.max(0, Math.min(elapsedTime / chapter.duration, 1))
    : 0;
  let currentBeat: NetworkStoryBeat | null = null;

  for (const beat of chapter.beats) {
    if (beat.position > progress) {
      break;
    }
    currentBeat = beat;
  }

  return currentBeat;
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

/** Brightens selected glass without obscuring its refraction or fault-state color. */
export function makeNetworkSwitchHighlightColor(
  color: Color,
  planeStrength: number,
  pathStrength: number
): Color {
  if (color[3] >= 0.44) {
    return color;
  }

  const boundedPlaneStrength = Math.max(0, Math.min(planeStrength, 1));
  const boundedPathStrength = Math.max(0, Math.min(pathStrength, 1));
  const highlightStrength = Math.min(boundedPlaneStrength * 0.42 + boundedPathStrength * 0.34, 0.6);
  if (highlightStrength < 0.001) {
    return color;
  }

  const targetColor: Color =
    boundedPathStrength > boundedPlaneStrength
      ? [0.42, 1.02, 1.55, color[3]]
      : [0.6, 0.82, 1.46, color[3]];
  return [
    color[0] + (targetColor[0] - color[0]) * highlightStrength,
    color[1] + (targetColor[1] - color[1]) * highlightStrength,
    color[2] + (targetColor[2] - color[2]) * highlightStrength,
    color[3]
  ];
}

/** Keeps floating-point highlights restrained without misreporting SDR presentation as HDR. */
export function makeNetworkDynamicRangeProfile(
  options: NetworkDynamicRangeOptions
): NetworkDynamicRangeProfile {
  const sceneIsFloatingPoint = options.sceneColorFormat === 'rgba16float';
  const supportsExtendedPresentation =
    sceneIsFloatingPoint &&
    options.deviceType === 'webgpu' &&
    options.displaySupportsHighDynamicRange &&
    options.presentationColorFormat === 'rgba16float';
  const displayMode = supportsExtendedPresentation
    ? 'extended-hdr'
    : sceneIsFloatingPoint
      ? 'floating-point'
      : 'standard';
  const requestedBoost = Number.isFinite(options.highlightBoost)
    ? Math.max(0, Math.min(options.highlightBoost ?? 0, MAX_NETWORK_HDR_HIGHLIGHT_BOOST))
    : DEFAULT_NETWORK_HDR_HIGHLIGHT_BOOST;
  const availableHeadroom = supportsExtendedPresentation ? 1 : sceneIsFloatingPoint ? 0.7 : 0;
  const highlightBoost = requestedBoost * availableHeadroom;

  return {
    bloomIntensityScale: 1 + highlightBoost * 0.28,
    bloomThresholdScale: 1 + highlightBoost * 0.6,
    displayMode,
    emissionScale: 1 + highlightBoost * 0.6,
    exposureScale: 1 - highlightBoost * 0.06,
    highlightBoost,
    illuminationScale: 1 + highlightBoost * (supportsExtendedPresentation ? 0.86 : 0.34),
    maximumLuminance: supportsExtendedPresentation ? 1 + highlightBoost * 3.2 : 1,
    sceneIsFloatingPoint,
    specularScale: 1 + highlightBoost * 0.32
  };
}
