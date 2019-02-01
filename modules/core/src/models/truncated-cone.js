import Model from '../scenegraph/model';
import {TruncatedConeGeometry} from '../geometries';

export default class TruncatedCone extends Model {
  constructor(gl, opts = {}) {
    super(gl, Object.assign({}, opts, {geometry: new TruncatedConeGeometry(opts)}));
  }
}
