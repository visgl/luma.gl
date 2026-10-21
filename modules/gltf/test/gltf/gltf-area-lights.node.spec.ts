// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GroupNode} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {GLTFAreaLightController} from '../../src/gltf/gltf-area-lights';

function makeController(type: 'rect' | 'disk' = 'rect') {
  const light = new GroupNode({position: [1, 0, 0], scale: [-2, 3, 1]});
  const parent = new GroupNode({
    position: [0, 1, 0],
    rotation: [0, Math.PI / 2, 0],
    children: [light]
  });
  const scene = new GroupNode({children: [parent]});
  const gltf = {
    nodes: [{id: 'light', extensions: {EXT_lights_area: {light: 0}}}],
    extensions: {
      EXT_lights_area: {
        lights: [{type, size: 2, rect: {aspect: 2}, intensity: 100, color: [0.5, 1, 1]}]
      }
    }
  } as unknown as GLTFPostprocessed;
  const controller = new GLTFAreaLightController({
    gltf,
    scenes: [scene],
    gltfNodeIndexToNodeMap: new Map([[0, light]])
  });
  return {controller, light, parent};
}

test('EXT_lights_area uses positive maximum scale and rotation-only one-sided orientation', () => {
  const {controller, parent} = makeController();
  const light = controller.getLights()[0];
  expect(Math.hypot(...light.halfAxisY)).toBeCloseTo(3);
  expect(Math.hypot(...light.halfAxisX)).toBeCloseTo(6);
  expect(light.position[0]).toBeCloseTo(0);
  expect(light.position[1]).toBeCloseTo(1);
  expect(light.position[2]).toBeCloseTo(-1);
  expect(light.normal[0]).toBeCloseTo(-1);
  expect(light.intensity).toBe(100);
  parent.display = false;
  expect(controller.getLights()).toEqual([]);
  controller.destroy();
  expect(controller.getLights()).toEqual([]);
});

test('EXT_lights_area disks ignore rectangle aspect and follow live dimensions', () => {
  const {controller, light} = makeController('disk');
  expect(Math.hypot(...controller.getLights()[0].halfAxisX)).toBeCloseTo(3);
  light.setMatrixComponents({scale: [1, 1, 1]});
  expect(Math.hypot(...controller.getLights()[0].halfAxisX)).toBeCloseTo(1);
});

test('matrix reflections preserve the emitting side and unrelated singular nodes are ignored', () => {
  const reflectedMatrix = [-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const light = new GroupNode({matrix: reflectedMatrix});
  const unrelated = new GroupNode({matrix: new Array(16).fill(0)});
  const scene = new GroupNode({children: [light, unrelated]});
  const gltf = {
    nodes: [
      {matrix: reflectedMatrix, extensions: {EXT_lights_area: {light: 0}}},
      {matrix: new Array(16).fill(0)}
    ],
    extensions: {EXT_lights_area: {lights: [{type: 'rect'}]}}
  } as unknown as GLTFPostprocessed;
  const controller = new GLTFAreaLightController({
    gltf,
    scenes: [scene],
    gltfNodeIndexToNodeMap: new Map([
      [0, light],
      [1, unrelated]
    ])
  });
  const result = controller.getLights();
  expect(result).toHaveLength(1);
  expect(result[0].normal[2]).toBeCloseTo(-1);
  expect(result[0].intensity).toBe(1000);
});
