import {Stats} from 'probe.gl';

export default class StatsManager {
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

export const lumaStats: StatsManager = new StatsManager();
