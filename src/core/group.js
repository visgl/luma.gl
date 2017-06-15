import Object3D from './object-3d';
import assert from 'assert';

// TODO - FIX
class Matrix4 {
  mulMat4() {
    return this;
  }
}

export default class Group extends Object3D {
  constructor(opts = {}) {
    const {children = []} = opts;
    children.every(child => assert(child instanceof Object3D));
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
  traverse(visitor, {viewMatrix = new Matrix4()} = {}) {
    for (const child of this.children) {
      const {matrix} = child;
      const worldMatrix = viewMatrix.mulMat4(matrix);
      let result;
      if (child instanceof Group) {
        result = child.traverse({matrix, worldMatrix, visitor});
      } else {
        if (child.program) {
          child.program.use();
          child.program.setUniforms({worldMatrix});
        }
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
  traverseReverse(visitor, {viewMatrix = new Matrix4()} = {}) {
    for (let i = this.children.length - 1; i >= 0; --i) {
      const child = this.children[i];
      const {matrix} = child;
      const worldMatrix = viewMatrix.mulMat4(matrix);
      let result;
      if (child instanceof Group) {
        result = child.traverse({matrix, worldMatrix, visitor});
      } else {
        if (child.program) {
          child.program.use();
          child.program.setUniforms({worldMatrix});
        }
        result = visitor(child, {});
      }
      // Abort if a result was returned
      if (result) {
        return result;
      }
    }
    return null;
  }
}
