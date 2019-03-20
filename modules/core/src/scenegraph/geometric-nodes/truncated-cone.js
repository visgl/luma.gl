import {TruncatedConeGeometry} from '../../geometries';
import {uid} from '../../utils';
import ModelNode from '../nodes/model-node';

export default class TruncatedCone extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('truncated-cone')} = props;
    super(gl, Object.assign({id}, props, {geometry: new TruncatedConeGeometry(props)}));
  }
}
