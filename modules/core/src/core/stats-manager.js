import {Stats} from 'probe.gl';

class StatsManager {
  constructor() {
    this.stats = {};
  }

  get(name) {
    if (!this.stats[name]) {
      this.stats[name] = new Stats({id: name});
    }

    return this.stats[name];
  }
}

export default new StatsManager();
