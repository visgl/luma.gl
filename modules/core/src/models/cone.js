import Model from '../scenegraph/model';
import {ConeGeometry} from '../geometry';

export default class Cone extends Model {
  constructor(gl, opts = {}) {
    super(gl, Object.assign({}, opts, {geometry: new ConeGeometry(opts)}));
  }
}
