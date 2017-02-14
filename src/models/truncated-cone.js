import {TruncatedConeGeometry} from '../geometry';
import {Model} from '../core';

export default class TruncatedCone extends Model {
  constructor(opts = {}) {
    super(Object.assign({}, opts, {geometry: new TruncatedConeGeometry(opts)}));
  }
}
