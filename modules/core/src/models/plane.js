import Model from '../scenegraph/model';
import {PlaneGeometry} from '../geometries';
import {uid} from '../utils';

export default class Plane extends Model {
  constructor(gl, opts = {}) {
    const {id = uid('plane')} = opts;
    super(gl, Object.assign({}, opts, {id, geometry: new PlaneGeometry(opts)}));
  }
}
