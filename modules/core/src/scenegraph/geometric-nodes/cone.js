import {ConeGeometry, uid} from '@luma.gl/core';
import ModelNode from '../nodes/model-node';

export default class Cone extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('cone')} = props;
    super(gl, Object.assign({id}, props, {geometry: new ConeGeometry(props)}));
  }
}
