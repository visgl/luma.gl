// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Stat, Stats} from '@probe.gl/stats';

const GPU_TIME_AND_MEMORY_STATS = 'GPU Time and Memory';
const GPU_TIME_AND_MEMORY_STAT_ORDER = [
  'Adapter',
  'GPU',
  'GPU Type',
  'GPU Backend',
  'Frame Rate',
  'CPU Time',
  'GPU Time',
  'GPU Memory',
  'Buffer Memory',
  'Texture Memory',
  'Referenced Buffer Memory',
  'Referenced Texture Memory',
  'Swap Chain Texture'
] as const;

/**
 * Helper class managing a collection of probe.gl stats objects
 */
export class StatsManager {
  stats = new Map();

  getStats(name: string): Stats {
    return this.get(name);
  }

  get(name: string): Stats {
    if (!this.stats.has(name)) {
      this.stats.set(name, new Stats({id: name}));
    }

    const stats = this.stats.get(name);
    if (name === GPU_TIME_AND_MEMORY_STATS) {
      initializeStats(stats, GPU_TIME_AND_MEMORY_STAT_ORDER);
    }

    return stats;
  }
}

/** Global stats for all luma.gl devices */
export const lumaStats: StatsManager = new StatsManager();

function initializeStats(stats: Stats, orderedStatNames: readonly string[]): void {
  const statsMap = stats.stats;
  for (const statName of orderedStatNames) {
    stats.get(statName);
  }

  const reorderedStats: Record<string, Stat> = {};
  const orderedStatNamesSet = new Set(orderedStatNames);

  for (const statName of orderedStatNames) {
    if (statsMap[statName]) {
      reorderedStats[statName] = statsMap[statName];
    }
  }

  for (const [statName, stat] of Object.entries(statsMap)) {
    if (!orderedStatNamesSet.has(statName)) {
      reorderedStats[statName] = stat;
    }
  }

  for (const statName of Object.keys(statsMap)) {
    delete statsMap[statName];
  }

  Object.assign(statsMap, reorderedStats);
}
