// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {
  selectAudioEnvironmentZone,
  type GLTFAudioEnvironmentZone
} from '../../src/gltf/gltf-audio-environment';

test('environment zones prioritize authored precedence then transformed volume', () => {
  const zones: GLTFAudioEnvironmentZone[] = [
    {environment: 0, worldMatrix: new Matrix4(), shape: {type: 'box', size: [10, 10, 10]}},
    {environment: 1, worldMatrix: new Matrix4(), shape: {type: 'sphere', radius: 1}},
    {
      environment: 2,
      priority: 1,
      worldMatrix: new Matrix4().translate([3, 0, 0]),
      shape: {type: 'sphere', radius: 1}
    }
  ];
  expect(selectAudioEnvironmentZone(zones, [0, 0, 0])?.environment).toBe(1);
  expect(selectAudioEnvironmentZone(zones, [3, 0, 0])?.environment).toBe(2);
  expect(selectAudioEnvironmentZone(zones, [9, 0, 0])).toBeUndefined();
});

test('environment zones measure inward blends and maximum-scale spheres', () => {
  const sphere: GLTFAudioEnvironmentZone = {
    environment: 3,
    worldMatrix: new Matrix4().scale([2, 1, 1]),
    shape: {type: 'sphere', radius: 1},
    blendDistance: 1
  };
  expect(selectAudioEnvironmentZone([sphere], [0, 1.5, 0])).toEqual({environment: 3, weight: 0.5});
  const box: GLTFAudioEnvironmentZone = {
    environment: 4,
    worldMatrix: new Matrix4().translate([5, 0, 0]).scale([2, 1, 1]),
    shape: {type: 'box', size: [2, 2, 2]},
    blendDistance: 1
  };
  expect(selectAudioEnvironmentZone([box], [6.5, 0, 0])).toEqual({environment: 4, weight: 0.5});
});
