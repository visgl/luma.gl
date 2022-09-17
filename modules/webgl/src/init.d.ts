import {Stats} from '@probe.gl/stats';

export class StatsManager {
  constructor();
  get(name: any): Stats; // TODO: Isn't this get(name: string): Stats;
}

export const lumaStats: StatsManager;

// luma global object - TODO - add types
declare const _default: any;
export default _default;
