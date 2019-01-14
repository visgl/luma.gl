import ScenegraphNode from './scenegraph-node';

export default class Camera extends ScenegraphNode {
  constructor(opts = {}) {
    super(opts);
    this.projectionMatrix = opts.projectionMatrix;
  }
}
