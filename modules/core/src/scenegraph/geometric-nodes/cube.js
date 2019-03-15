import {CubeGeometry, uid} from '@luma.gl/core';
import ModelNode from '../nodes/model-node';

export default class Cube extends ModelNode {
  constructor(gl, props = {}) {
    const {id = uid('cube')} = props;
    super(gl, Object.assign({}, props, {id, geometry: new CubeGeometry(props)}));
  }
}
