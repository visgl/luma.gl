// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getGLTFModelOptions,
  selectGLTFModelOption
} from '../../website/src/components/gltf-model-options';

test('material examples expose only the requested pinned sample subset', () => {
  const models = getGLTFModelOptions(['CompareAmbientOcclusion', 'DamagedHelmet', 'DamagedHelmet']);
  expect(models.map(model => model.name)).toEqual(['CompareAmbientOcclusion', 'DamagedHelmet']);
  expect(models[0].url).toBe(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models/CompareAmbientOcclusion/glTF/CompareAmbientOcclusion.gltf'
  );
  expect(selectGLTFModelOption(models, models[1].url)).toBe(models[1]);

  // Changing pages must not retain an asset outside the new property subset.
  const nextModels = getGLTFModelOptions(['EmissiveStrengthTest']);
  expect(selectGLTFModelOption(nextModels, models[1].url)).toBe(nextModels[0]);
});

test('explicit and empty sources never fall back to the tutorial robot', () => {
  const models = getGLTFModelOptions(undefined, '/test-assets/material.gltf');
  expect(models).toEqual([{name: 'glTF model', url: '/test-assets/material.gltf'}]);
  expect(getGLTFModelOptions()).toEqual([]);
  expect(selectGLTFModelOption([], '')).toBeUndefined();
});
