import {Model} from '../core';
import {IcoSphereGeometry} from '../geometry';

export default class IcoSphere extends Model {
  constructor(opts = {}) {
    super(Object.assign({}, opts, {geometry: new IcoSphereGeometry(opts)}));
  }
}
