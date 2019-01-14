import Model from '../scenegraph/model';
import {CylinderGeometry} from '../geometry';

export default class Cylinder extends Model {
  constructor(gl, opts = {}) {
    super(gl, Object.assign({}, opts, {geometry: new CylinderGeometry(opts)}));
  }
}
