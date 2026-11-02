// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GroupNode, ScenegraphNode} from '@luma.gl/engine';
import {describe, expect, test} from 'vitest';

function makeScene() {
  const leftHinge = new ScenegraphNode({id: 'hinge'});
  const rightHinge = new ScenegraphNode({id: 'hinge', display: false});
  const leftDoor = new GroupNode({id: 'door', children: [leftHinge]});
  const rightDoor = new GroupNode({id: 'door', children: [rightHinge]});
  const leftRoom = new GroupNode({id: 'left', children: [leftDoor]});
  const rightRoom = new GroupNode({id: 'right', display: false, children: [rightDoor]});
  const scene = new GroupNode({id: 'scene', children: [leftRoom, rightRoom]});
  return {scene, leftRoom, rightRoom, leftDoor, rightDoor, leftHinge, rightHinge};
}

describe('scenegraph node paths', () => {
  test('resolves exact IDs, groups and the search root without matching substrings', () => {
    const {scene, leftRoom} = makeScene();
    expect(scene.findNode('left')).toBe(leftRoom);
    expect(scene.findNode('scene')).toBe(scene);
    expect(scene.findNode('/')).toBe(scene);
    expect(scene.findNode('lef')).toBeUndefined();
    expect(scene.findNodes('missing')).toEqual([]);
  });

  test('matches contiguous partial paths and anchors absolute paths below the receiver', () => {
    const {scene, leftRoom, leftHinge} = makeScene();
    expect(scene.findNode('left/door/hinge')).toBe(leftHinge);
    expect(scene.findNode('scene/left/door/hinge')).toBe(leftHinge);
    expect(scene.findNode('/left/door/hinge')).toBe(leftHinge);
    expect(scene.findNode('/door/hinge')).toBeUndefined();
    expect(scene.findNode('left/hinge')).toBeUndefined();
    expect(scene.findNode('/scene/left/door/hinge')).toBeUndefined();
    expect(leftRoom.findNode('/door/hinge')).toBe(leftHinge);
    expect(leftRoom.findNode('/')).toBe(leftRoom);
  });

  test('includes hidden branches in deterministic preorder and refuses ambiguous single matches', () => {
    const {scene, leftDoor, rightDoor, leftHinge, rightHinge} = makeScene();
    expect(scene.findNodes('door')).toEqual([leftDoor, rightDoor]);
    expect(scene.findNodes('door/hinge')).toEqual([leftHinge, rightHinge]);
    expect(() => scene.findNode('hinge')).toThrow('Ambiguous scenegraph path: hinge (2 matches)');
    expect(() => scene.findNode('door/hinge')).toThrow('Ambiguous scenegraph path');
    expect(scene.findNode('right/door/hinge')).toBe(rightHinge);
  });

  test('reports duplicate sibling IDs as ambiguous even for an anchored path', () => {
    const first = new ScenegraphNode({id: 'duplicate'});
    const second = new ScenegraphNode({id: 'duplicate'});
    const scene = new GroupNode({children: [first, second]});
    expect(scene.findNodes('/duplicate')).toEqual([first, second]);
    expect(() => scene.findNode('/duplicate')).toThrow('Ambiguous scenegraph path');
  });

  test('decodes slash and tilde escapes exactly once and treats other characters literally', () => {
    const slash = new ScenegraphNode({id: 'a/b'});
    const tilde = new ScenegraphNode({id: 'a~b'});
    const escaped = new ScenegraphNode({id: '~1'});
    const literal = new ScenegraphNode({id: '*.part [1]'});
    const scene = new GroupNode({children: [slash, tilde, escaped, literal]});
    expect(scene.findNode('a~1b')).toBe(slash);
    expect(scene.findNode('/a~0b')).toBe(tilde);
    expect(scene.findNode('~01')).toBe(escaped);
    expect(scene.findNode('*.part [1]')).toBe(literal);
    expect(scene.findNode('*')).toBeUndefined();
    expect(scene.findNode('a/b')).toBeUndefined();
  });

  test.each([
    '',
    '//',
    '/left/',
    'left//door',
    '~',
    '~2',
    'left/~x'
  ])('rejects malformed path %j', path => {
    expect(() => makeScene().scene.findNodes(path)).toThrow('Invalid scenegraph path');
  });

  test('reflects direct hierarchy edits without invalidating an existing node reference', () => {
    const {scene, leftDoor, rightRoom, leftHinge} = makeScene();
    const reference = scene.findNode('/left/door/hinge');
    leftDoor.remove(leftHinge);
    rightRoom.children.push(leftHinge);
    expect(scene.findNode('/left/door/hinge')).toBeUndefined();
    expect(scene.findNode('/right/hinge')).toBe(reference);
    rightRoom.removeAll();
    expect(scene.findNode('/right/hinge')).toBeUndefined();
  });

  test('does not depend on transforms or recurse through a deep hierarchy', () => {
    const leaf = new ScenegraphNode({id: 'leaf'});
    let root: ScenegraphNode = leaf;
    for (let index = 0; index < 10000; index++) {
      root = new GroupNode({id: `group-${index}`, children: [root]});
    }
    if (!(root instanceof GroupNode)) throw new Error('Expected group');
    expect(root.findNode('group-1/group-0/leaf')).toBe(leaf);
  });

  test('rejects cycles and multiply parented nodes instead of looping or choosing a path', () => {
    const cyclic = new GroupNode({id: 'cyclic'});
    cyclic.add(cyclic);
    expect(() => cyclic.findNodes('missing')).toThrow('Scenegraph lookup requires a tree');
    expect(() => cyclic.findNode('/')).toThrow('Scenegraph lookup requires a tree');
    const shared = new ScenegraphNode({id: 'shared'});
    const scene = new GroupNode({
      children: [new GroupNode([shared]), new GroupNode([shared])]
    });
    expect(() => scene.findNode('shared')).toThrow('Scenegraph lookup requires a tree');
  });
});
