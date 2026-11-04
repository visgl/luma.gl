// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  GroupNode,
  ScenegraphInteractionManager,
  getFirstScenegraphInteractionHit,
  isScenegraphInteractionEnabled
} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/core/test-utils';
import {createScenegraphsFromGLTF, postProcessGLTF} from '@luma.gl/engine/gltf';

describe('scenegraph interaction', () => {
  test('uses the entire instance path and skips ineligible near hits', () => {
    const root = new GroupNode({selectable: false, hoverable: true});
    const child = new GroupNode({selectable: true, hoverable: false, display: false});
    const other = new GroupNode({selectable: true, hoverable: true});
    const hits = [
      {path: [root, child], distance: 1},
      {path: [other], distance: 2}
    ];
    expect(isScenegraphInteractionEnabled(hits[0].path, 'select')).toBe(false);
    expect(isScenegraphInteractionEnabled(hits[0].path, 'hover')).toBe(false);
    expect(getFirstScenegraphInteractionHit(hits, 'select')).toBe(hits[1]);
    root.setProps({selectable: true});
    expect(getFirstScenegraphInteractionHit(hits, 'select')).toBe(hits[0]);
    child.setProps({hoverable: true});
    expect(getFirstScenegraphInteractionHit(hits, 'hover')).toBe(hits[0]);
    expect(isScenegraphInteractionEnabled([], 'hover')).toBe(false);
  });

  test('bubbles selection and tracks subtree hover transitions separately per controller', () => {
    const root = new GroupNode({id: 'root'});
    const first = new GroupNode({id: 'first'});
    const second = new GroupNode({id: 'second'});
    const events: string[] = [];
    const controller = new ScenegraphInteractionManager(event =>
      events.push(
        `${event.type}:${event.target.id}:${event.currentTarget.id}:${event.controllerIndex}`
      )
    );
    controller.select([{path: [root, first]}], 2);
    expect(events.splice(0)).toEqual(['select:first:first:2', 'select:first:root:2']);
    controller.updateHover([{path: [root, first]}], 1);
    expect(events.splice(0)).toEqual(['hover-in:first:first:1', 'hover-in:first:root:1']);
    controller.updateHover([{path: [root, second]}], 1);
    expect(events.splice(0)).toEqual(['hover-out:first:first:1', 'hover-in:second:second:1']);
    controller.updateHover([{path: [root, first]}], 2);
    events.length = 0;
    root.setProps({hoverable: false});
    controller.updateHover([{path: [root, second]}], 1);
    expect(events.splice(0)).toEqual(['hover-out:second:second:1', 'hover-out:second:root:1']);
    controller.clearHover(2);
    expect(events.splice(0)).toEqual(['hover-out:first:first:2', 'hover-out:first:root:2']);
  });

  test('imports flags and animates their local values using STEP pointers', () => {
    const json = {
      asset: {version: '2.0'},
      scenes: [{nodes: [0]}],
      nodes: [
        {
          children: [1],
          extensions: {
            KHR_node_selectability: {selectable: false},
            KHR_node_hoverability: {hoverable: false}
          }
        },
        {}
      ]
    };
    const gltf = postProcessGLTF({json, buffers: [], images: []} as any);
    gltf.accessors.push(
      {value: new Float32Array([0, 0.5, 2]), components: 1} as any,
      {value: new Float32Array([0, 1, 1]), components: 1} as any
    );
    gltf.animations.push({
      name: 'interaction',
      samplers: [{input: 0, output: 1, interpolation: 'STEP'}],
      channels: [
        {
          sampler: 0,
          target: {
            path: 'pointer',
            extensions: {
              KHR_animation_pointer: {
                pointer: '/nodes/0/extensions/KHR_node_selectability/selectable'
              }
            }
          }
        },
        {
          sampler: 0,
          target: {
            path: 'pointer',
            extensions: {
              KHR_animation_pointer: {
                pointer: '/nodes/0/extensions/KHR_node_hoverability/hoverable'
              }
            }
          }
        }
      ]
    } as any);
    const device = new NullDevice({});
    const scene = createScenegraphsFromGLTF(device, gltf);
    const root = scene.gltfNodeIndexToNodeMap.get(0)!;
    const child = scene.gltfNodeIndexToNodeMap.get(1)!;
    expect(root.selectable).toBe(false);
    expect(root.hoverable).toBe(false);
    expect(child.selectable).toBe(true);
    expect(isScenegraphInteractionEnabled([root, child], 'select')).toBe(false);
    scene.animator.setTime(1000);
    expect(root.selectable).toBe(true);
    expect(root.hoverable).toBe(true);
    expect(isScenegraphInteractionEnabled([root, child], 'select')).toBe(true);
    scene.destroy();
    device.destroy();
  });
});
