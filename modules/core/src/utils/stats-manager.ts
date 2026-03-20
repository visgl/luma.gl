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
const ORDERED_STATS_CACHE = new WeakMap<
  Stats,
  {orderedStatNames: readonly string[]; statCount: number}
>();
const ORDERED_STAT_NAME_SET_CACHE = new WeakMap<readonly string[], Set<string>>();

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
  let addedOrderedStat = false;
  for (const statName of orderedStatNames) {
    if (!statsMap[statName]) {
      stats.get(statName);
      addedOrderedStat = true;
    }
  }

  const statCount = Object.keys(statsMap).length;
  const cachedStats = ORDERED_STATS_CACHE.get(stats);
  if (
    !addedOrderedStat &&
    cachedStats?.orderedStatNames === orderedStatNames &&
    cachedStats.statCount === statCount
  ) {
    return;
  }

  const reorderedStats: Record<string, Stat> = {};
  let orderedStatNamesSet = ORDERED_STAT_NAME_SET_CACHE.get(orderedStatNames);
  if (!orderedStatNamesSet) {
    orderedStatNamesSet = new Set(orderedStatNames);
    ORDERED_STAT_NAME_SET_CACHE.set(orderedStatNames, orderedStatNamesSet);
  }

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
  ORDERED_STATS_CACHE.set(stats, {orderedStatNames, statCount});
}
