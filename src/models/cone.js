import {ConeGeometry} from '../geometry';
import {Model} from '../core';

export default class Cone extends Model {
  constructor(opts = {}) {
    super(Object.assign({}, opts, {geometry: new ConeGeometry(opts)}));
  }
}
