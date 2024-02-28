// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Stats} from '@probe.gl/stats';

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

    return this.stats.get(name);
  }
}

/** Global stats for all luma.gl devices */
export const lumaStats: StatsManager = new StatsManager();
