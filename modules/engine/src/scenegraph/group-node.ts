// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4, Vector3} from '@math.gl/core';
import type {NumericArray} from '@math.gl/core';
import {assert, log} from '@luma.gl/core';
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

  /** Resolve one exact ID or path. Missing nodes return undefined; ambiguous paths throw. */
  findNode(path: string): ScenegraphNode | undefined {
    const matches = this.findNodes(path);
    if (matches.length > 1) {
      throw new Error(`Ambiguous scenegraph path: ${path} (${matches.length} matches)`);
    }
    return matches[0];
  }

  /** Find structural matches in preorder, including hidden nodes and the search root. */
  findNodes(path: string): ScenegraphNode[] {
    const anchored = path.startsWith('/');
    const segments =
      path === '/'
        ? []
        : (anchored ? path.slice(1) : path).split('/').map(segment => {
            if (!segment || /~(?![01])/.test(segment)) {
              throw new Error(`Invalid scenegraph path: ${path}`);
            }
            return segment.replace(/~1/g, '/').replace(/~0/g, '~');
          });
    const matches: ScenegraphNode[] = [];
    const ancestors: string[] = [];
    const visited = new Set<ScenegraphNode>();
    const pending: {node: ScenegraphNode; depth: number}[] = [{node: this, depth: 0}];
    while (pending.length) {
      const {node, depth} = pending.pop()!;
      // Structural lookup requires a tree: cycles and shared node objects are invalid.
      assert(!visited.has(node));
      visited.add(node);
      ancestors.length = depth;
      ancestors.push(node.id);
      const offset = ancestors.length - segments.length;
      if (
        (anchored ? offset === 1 : offset >= 0) &&
        segments.every((segment, index) => segment === ancestors[offset + index])
      ) {
        matches.push(node);
      }
      if (node instanceof GroupNode) {
        for (let index = node.children.length - 1; index >= 0; index--) {
          pending.push({node: node.children[index], depth: depth + 1});
        }
      }
    }
    return matches;
  }

  traverse(
    visitor: (node: ScenegraphNode, context: {worldMatrix: Matrix4}) => void,
    {worldMatrix = new Matrix4()} = {}
  ) {
    if (!this.display) {
      return;
    }

    const modelMatrix = new Matrix4(worldMatrix).multiplyRight(this.matrix);

    for (const child of this.children) {
      if (!child.display) {
        continue;
      }
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
