import {SphereGeometry} from '../../geometries';
import {uid} from '../../utils';
import ModelNode from '../nodes/model-node';

export default class Sphere extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('sphere')} = props;
    super(gl, Object.assign({}, props, {id, geometry: new SphereGeometry(props)}));
  }
}
