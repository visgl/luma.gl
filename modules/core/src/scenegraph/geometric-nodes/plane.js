import {PlaneGeometry, uid} from '@luma.gl/core';
import ModelNode from '../nodes/model-node';

export default class Plane extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('plane')} = props;
    super(gl, Object.assign({}, props, {id, geometry: new PlaneGeometry(props)}));
  }
}
