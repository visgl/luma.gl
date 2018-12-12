import Node from './node';

export default class Camera extends Node {
  constructor(opts = {}) {
    super(opts);
    this.projectionMatrix = opts.projectionMatrix;
  }
}
