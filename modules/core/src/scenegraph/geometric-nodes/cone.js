import {ConeGeometry} from '../../geometries';
import {uid} from '../../utils';
import ModelNode from '../nodes/model-node';

export default class Cone extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('cone')} = props;
    super(gl, Object.assign({id}, props, {geometry: new ConeGeometry(props)}));
  }
}
