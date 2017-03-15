import {CubeGeometry} from '../geometry';
import {Model} from '../core';
import {uid} from '../utils';

export default class Cube extends Model {
  constructor(opts = {}) {
    const {id = uid('cube')} = opts;
    super(Object.assign({}, opts, {id, geometry: new CubeGeometry(opts)}));
  }
}
