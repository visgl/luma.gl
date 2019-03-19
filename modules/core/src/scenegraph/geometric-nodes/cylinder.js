import {CylinderGeometry, uid} from '@luma.gl/core';
import ModelNode from '../nodes/model-node';

export default class Cylinder extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('cylinder')} = props;
    super(gl, Object.assign({id}, props, {geometry: new CylinderGeometry(props)}));
  }
}
