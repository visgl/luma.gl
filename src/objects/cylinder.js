import {TruncatedConeGeometry} from './truncated-cone';
import Model from '../model';

export class CylinderGeometry extends TruncatedConeGeometry {
  constructor({radius = 1, ...opts} = {}) {
    super({
      ...opts,
      bottomRadius: radius,
      topRadius: radius
    });
  }
}

export default class Cylinder extends Model {
  constructor(opts) {
    super({geometry: new CylinderGeometry(opts), ...opts});
  }
}
