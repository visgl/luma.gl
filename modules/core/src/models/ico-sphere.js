import Model from '../scenegraph/model';
import {IcoSphereGeometry} from '../geometries';

export default class IcoSphere extends Model {
  constructor(gl, opts = {}) {
    super(gl, Object.assign({}, opts, {geometry: new IcoSphereGeometry(opts)}));
  }
}
