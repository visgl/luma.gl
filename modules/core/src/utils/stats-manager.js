// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { Stats } from '@probe.gl/stats';
/**
 * Helper class managing a collection of probe.gl stats objects
 */
export class StatsManager {
    stats = new Map();
    getStats(name) {
        return this.get(name);
    }
    get(name) {
        if (!this.stats.has(name)) {
            this.stats.set(name, new Stats({ id: name }));
        }
        return this.stats.get(name);
    }
}
/** Global stats for all luma.gl devices */
export const lumaStats = new StatsManager();
