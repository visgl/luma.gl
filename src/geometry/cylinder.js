import {TruncatedConeGeometry} from './truncated-cone';
import Model from '../core/model';

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
    super({
      ...opts,
      geometry: new CylinderGeometry(opts)
    });
  }
}
