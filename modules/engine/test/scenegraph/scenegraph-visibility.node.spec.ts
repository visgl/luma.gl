// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GroupNode, ScenegraphNode} from '@luma.gl/engine';
import {describe, expect, test} from 'vitest';

describe('scenegraph hierarchical visibility', () => {
  test('honors display at construction and through runtime property updates', () => {
    const node = new ScenegraphNode({display: false});
    expect(node.display).toBe(false);

    node.setProps({display: true});
    expect(node.display).toBe(true);
  });

  test('skips hidden branches during rendering while preserving structural preorder traversal', () => {
    const visibleLeaf = new ScenegraphNode({id: 'visible'});
    const hiddenLeaf = new ScenegraphNode({id: 'hidden-leaf', display: false});
    const hiddenDescendant = new ScenegraphNode({id: 'hidden-descendant'});
    const hiddenParent = new GroupNode({
      id: 'hidden-parent',
      display: false,
      children: [hiddenDescendant]
    });
    const scene = new GroupNode({
      id: 'scene',
      children: [visibleLeaf, hiddenLeaf, hiddenParent]
    });

    const renderedNodes: string[] = [];
    scene.traverse(node => renderedNodes.push(node.id));
    expect(renderedNodes).toEqual(['visible']);

    const structuralNodes: string[] = [];
    scene.preorderTraversal(node => structuralNodes.push(node.id));
    expect(structuralNodes).toEqual([
      'scene',
      'visible',
      'hidden-leaf',
      'hidden-parent',
      'hidden-descendant'
    ]);

    hiddenParent.setProps({display: true});
    renderedNodes.length = 0;
    scene.traverse(node => renderedNodes.push(node.id));
    expect(renderedNodes).toEqual(['visible', 'hidden-descendant']);
  });

  test('hides an entire scene when its root is not displayed', () => {
    const scene = new GroupNode({
      display: false,
      children: [new ScenegraphNode({id: 'child'})]
    });
    const nodes: string[] = [];
    scene.traverse(node => nodes.push(node.id));
    expect(nodes).toEqual([]);
  });
});
