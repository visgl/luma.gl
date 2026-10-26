// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {mergeGLTFModelCatalog} from '../../examples/gltf/asset-studio/gltf-model-catalog';

test('material assets remain available beyond the animation studio subset', () => {
  const preferred = [{name: 'RobotExpressive', source: 'pinned-studio'}];
  const catalog = [
    {name: 'RobotExpressive', source: 'catalog'},
    {name: 'ClearCoatCarPaint', source: 'catalog'},
    {name: 'GlamVelvetSofa', source: 'catalog'}
  ];
  const merged = mergeGLTFModelCatalog(preferred, catalog);
  expect(merged.map(model => model.name)).toEqual([
    'RobotExpressive',
    'ClearCoatCarPaint',
    'GlamVelvetSofa'
  ]);
  expect(merged[0]).toBe(preferred[0]);
  expect(preferred).toHaveLength(1);
  expect(catalog).toHaveLength(3);
});
