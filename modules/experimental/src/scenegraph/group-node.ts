import {Matrix4} from '@math.gl/core';
import {log} from '@luma.gl/webgl';
import ScenegraphNode, {ScenegraphNodeProps} from './scenegraph-node';

export type GroupNodeProps = ScenegraphNodeProps & {
  children?: ScenegraphNode[];
}

export default class GroupNode extends ScenegraphNode {
  children: ScenegraphNode[];

  constructor(children: ScenegraphNode[]);
  constructor(props?: GroupNodeProps);

  constructor(props: ScenegraphNode[] | GroupNodeProps = {}) {
    props = Array.isArray(props) ? {children: props} : props;
    const {children = []} = props;
    log.assert(
      children.every((child) => child instanceof ScenegraphNode),
      'every child must an instance of ScenegraphNode'
    );
    super(props);
    this.children = children;
  }

  destroy() {
    this.children.forEach((child) => child.destroy());
    this.removeAll();
    super.destroy();
  }

  // Unpacks arrays and nested arrays of children
  add(...children: ScenegraphNode[]): this {
    for (const child of children) {
      if (Array.isArray(child)) {
        this.add(...child);
      } else {
        this.children.push(child);
      }
    }
    return this;
  }

  remove(child: ScenegraphNode): this {
    const children = this.children;
    const indexOf = children.indexOf(child);
    if (indexOf > -1) {
      children.splice(indexOf, 1);
    }
    return this;
  }

  removeAll(): this {
    this.children = [];
    return this;
  }

  traverse(visitor, {worldMatrix = new Matrix4()} = {}) {
    const modelMatrix = new Matrix4(worldMatrix).multiplyRight(this.matrix);

    for (const child of this.children) {
      if (child instanceof GroupNode) {
        child.traverse(visitor, {worldMatrix: modelMatrix});
      } else {
        visitor(child, {worldMatrix: modelMatrix});
      }
    }
  }
}
