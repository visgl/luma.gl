import {Model} from '../core';
import {SphereGeometry} from '../geometry';
import {uid} from '../utils';

export default class Sphere extends Model {
  constructor(opts = {}) {
    const {id = uid('sphere')} = opts;
    super(Object.assign({}, opts, {id, geometry: new SphereGeometry(opts)}));
  }
}
