import {CylinderGeometry} from '../../geometries';
import {uid} from '../../utils';
import ModelNode from '../nodes/model-node';

export default class Cylinder extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('cylinder')} = props;
    super(gl, Object.assign({id}, props, {geometry: new CylinderGeometry(props)}));
  }
}
