import Node from './scenegraph-node';
import {Matrix4} from 'math.gl';
import {log} from '../utils';
import assert from '../utils/assert';

export default class Group extends Node {
  constructor(opts = {}) {
    opts = Array.isArray(opts) ? {children: opts} : opts;
    const {children = []} = opts;
    children.every(child => assert(child instanceof Node));
    super(opts);
    this.children = children;
  }

  // Unpacks arrays and nested arrays of children
  add(...children) {
    for (const child of children) {
      if (Array.isArray(child)) {
        this.add(...child);
      } else {
        this.children.push(child);
      }
    }
    return this;
  }

  remove(child) {
    const children = this.children;
    const indexOf = children.indexOf(child);
    if (indexOf > -1) {
      children.splice(indexOf, 1);
    }
    return this;
  }

  removeAll() {
    this.children = [];
    return this;
  }

  // If visitor returns a truthy value, traversal will be aborted and that value
  // will be returned from `traverse`. Otherwise `traverse` will return null.
  traverse(visitor, {modelMatrix: modelMatrixIn = new Matrix4()} = {}) {
    for (const child of this.children) {
      const {matrix} = child;
      const modelMatrix = new Matrix4(modelMatrixIn).multiplyRight(matrix);
      let result;
      if (child instanceof Group) {
        result = child.traverse(visitor, {modelMatrix});
      } else {
        // Note: this will overwrite the child matrix
        // In glTF, meshes and primitives do no have their own matrix.
        child.setMatrix(modelMatrix);
        result = visitor(child, {});
      }
      // Abort if a result was returned
      if (result) {
        return result;
      }
    }
    return null;
  }

  // If visitor returns a truthy value, traversal will be aborted and that value
  // will be returned from `traverseReverse`. Otherwise `traverseReverse` will return null.
  traverseReverse(visitor, opts) {
    log.warn('traverseReverse is not reverse')();
    return this.traverse(visitor, opts);
  }
}
