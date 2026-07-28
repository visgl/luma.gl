// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Vector3} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core';
import {log} from '@luma.gl/core';
import {ScenegraphNode, ScenegraphNodeProps} from './scenegraph-node';
import {
  areScenegraphBoundsDefined,
  expandScenegraphBounds,
  makeEmptyScenegraphBounds
} from './scenegraph-bounds';
import type {ScenegraphBounds} from './scenegraph-bounds';

export type GroupNodeProps = ScenegraphNodeProps & {
  children?: ScenegraphNode[];
};

/** Camera-relative ordering options for a flattened scenegraph traversal. */
export type DepthSortedTraversalOptions = {
  viewMatrix: NumericArray;
  worldMatrix?: NumericArray;
  order?: 'back-to-front' | 'front-to-back';
};

/** Model transform, local aggregate bounds, and positive camera depth for one visited node. */
export type DepthSortedTraversalContext = {
  worldMatrix: Matrix4;
  bounds: [number[], number[]] | null;
  depth: number;
};

export class GroupNode extends ScenegraphNode {
  children: ScenegraphNode[];

  constructor(children: ScenegraphNode[]);
  constructor(props?: GroupNodeProps);

  constructor(props: ScenegraphNode[] | GroupNodeProps = {}) {
    props = Array.isArray(props) ? {children: props} : props;
    const {children = []} = props;
    log.assert(
      children.every(child => child instanceof ScenegraphNode),
      'every child must an instance of ScenegraphNode'
    );
    super(props);
    this.children = children;
  }

  override getBounds(): ScenegraphBounds | null {
    const result = makeEmptyScenegraphBounds();

    this.traverse((node, {worldMatrix}) => {
      const bounds = node.getBounds();
      if (!bounds) {
        return;
      }
      const nodeWorldMatrix = new Matrix4(worldMatrix).multiplyRight(node.matrix);
      expandScenegraphBounds(result, bounds, nodeWorldMatrix);
    });
    return areScenegraphBoundsDefined(result) ? result : null;
  }

  override destroy(): void {
    this.children.forEach(child => child.destroy());
    this.removeAll();
    super.destroy();
  }

  // Unpacks arrays and nested arrays of children
  add(...children: (ScenegraphNode | ScenegraphNode[])[]): this {
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

  traverse(
    visitor: (node: ScenegraphNode, context: {worldMatrix: Matrix4}) => void,
    {worldMatrix = new Matrix4()} = {}
  ) {
    const modelMatrix = new Matrix4(worldMatrix).multiplyRight(this.matrix);

    for (const child of this.children) {
      if (child instanceof GroupNode) {
        child.traverse(visitor, {worldMatrix: modelMatrix});
      } else {
        visitor(child, {worldMatrix: modelMatrix});
      }
    }
  }

  /** Visits leaf nodes ordered by the camera-space centers of their aggregate bounds. */
  traverseDepthSorted(
    visitor: (node: ScenegraphNode, context: DepthSortedTraversalContext) => void,
    {viewMatrix, worldMatrix = new Matrix4(), order = 'back-to-front'}: DepthSortedTraversalOptions
  ): void {
    const cameraMatrix = new Matrix4(viewMatrix);
    const nodes: {node: ScenegraphNode; context: DepthSortedTraversalContext; index: number}[] = [];

    this.traverse(
      (node, context) => {
        const bounds = node.getBounds();
        const center = bounds
          ? new Vector3(bounds[0]).add(bounds[1]).divide([2, 2, 2])
          : new Vector3();
        const nodeWorldMatrix = new Matrix4(context.worldMatrix).multiplyRight(node.matrix);
        nodeWorldMatrix.transformAsPoint(center, center);
        cameraMatrix.transformAsPoint(center, center);
        nodes.push({
          node,
          context: {worldMatrix: nodeWorldMatrix, bounds, depth: -center[2]},
          index: nodes.length
        });
      },
      {worldMatrix: new Matrix4(worldMatrix)}
    );

    const direction = order === 'back-to-front' ? -1 : 1;
    nodes.sort(
      (first, second) =>
        direction * (first.context.depth - second.context.depth) || first.index - second.index
    );

    for (const {node, context} of nodes) {
      visitor(node, context);
    }
  }

  preorderTraversal(
    visitor: (node: ScenegraphNode, context: {worldMatrix: Matrix4}) => void,
    {worldMatrix = new Matrix4()} = {}
  ) {
    const modelMatrix = new Matrix4(worldMatrix).multiplyRight(this.matrix);
    visitor(this, {worldMatrix: modelMatrix});

    for (const child of this.children) {
      if (child instanceof GroupNode) {
        child.preorderTraversal(visitor, {worldMatrix: modelMatrix});
      } else {
        visitor(child, {worldMatrix: modelMatrix});
      }
    }
  }
}
