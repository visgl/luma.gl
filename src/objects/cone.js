import {TruncatedConeGeometry} from './truncated-cone';
import Model from '../model';

export class ConeGeometry extends TruncatedConeGeometry {
  constructor({radius = 1, cap = true, ...opts} = {}) {
    super({
      ...opts,
      topRadius: 0,
      topCap: Boolean(cap),
      bottomCap: Boolean(cap),
      bottomRadius: radius
    });
  }
}

export default class Cone extends Model {
  constructor(opts = {}) {
    super({geometry: new ConeGeometry(opts), ...opts});
  }
}
