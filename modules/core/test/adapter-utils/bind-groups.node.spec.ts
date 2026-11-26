// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  type BindingDeclaration,
  type Bindings,
  getShaderLayoutBinding,
  normalizeBindingsByGroup
} from '@luma.gl/core';

/** Returns a fresh layout with uniform, texture and sampler bindings in three groups */
function makeBindings(): BindingDeclaration[] {
  return [
    {name: 'app', type: 'uniform', group: 0, location: 0},
    {name: 'texture', type: 'texture', group: 1, location: 1},
    {name: 'textureSampler', type: 'sampler', group: 1, location: 2},
    {name: 'pbrMaterial', type: 'uniform', group: 2, location: 3}
  ];
}

it('getShaderLayoutBinding resolves exact names and case-insensitive `uniforms` aliases', () => {
  const bindings = makeBindings();
  const shaderLayout = {bindings};

  expect(getShaderLayoutBinding(shaderLayout, 'texture')).toBe(bindings[1]);
  expect(getShaderLayoutBinding(shaderLayout, 'textureSampler')).toBe(bindings[2]);
  expect(getShaderLayoutBinding(shaderLayout, 'appUniforms')).toBe(bindings[0]);
  expect(getShaderLayoutBinding(shaderLayout, 'PBRMaterialUniforms')).toBe(bindings[3]);
  expect(getShaderLayoutBinding(shaderLayout, 'missing', {ignoreWarnings: true})).toBe(null);
});

it('getShaderLayoutBinding returns the first matching binding', () => {
  const bindings: BindingDeclaration[] = [
    {name: 'lighting', type: 'uniform', group: 0, location: 0},
    {name: 'lightingUniforms', type: 'uniform', group: 1, location: 1}
  ];

  // The alias of the first binding matches before the exact name of the second, as before
  expect(getShaderLayoutBinding({bindings}, 'lightingUniforms')).toBe(bindings[0]);
  const reversedBindings = [...bindings].reverse();
  expect(getShaderLayoutBinding({bindings: reversedBindings}, 'lightingUniforms')).toBe(
    bindings[1]
  );
});

it('getShaderLayoutBinding sees an earlier binding that starts to match', () => {
  const lightingUniforms: BindingDeclaration = {
    name: 'lightingUniforms',
    type: 'uniform',
    group: 1,
    location: 1
  };
  const bindings: BindingDeclaration[] = [
    {name: 'other', type: 'uniform', group: 0, location: 0},
    lightingUniforms
  ];
  const shaderLayout = {bindings};
  const resource = {};

  expect(getShaderLayoutBinding(shaderLayout, 'lightingUniforms')).toBe(lightingUniforms);

  // Replaced: the alias of the new first binding now matches first
  const lighting: BindingDeclaration = {name: 'lighting', type: 'uniform', group: 0, location: 0};
  bindings[0] = lighting;
  expect(getShaderLayoutBinding(shaderLayout, 'lightingUniforms')).toBe(lighting);
  expect(
    normalizeBindingsByGroup(shaderLayout, {lightingUniforms: resource} as unknown as Bindings)
  ).toEqual({0: {lightingUniforms: resource}});

  // Renamed in place: the earlier binding stops matching
  lighting.name = 'unrelated';
  expect(getShaderLayoutBinding(shaderLayout, 'lightingUniforms')).toBe(lightingUniforms);
  // Renamed in place: the earlier binding matches again
  lighting.name = 'LIGHTING';
  expect(getShaderLayoutBinding(shaderLayout, 'lightingUniforms')).toBe(lighting);
});

it('getShaderLayoutBinding sees bindings added or replaced after a lookup', () => {
  const bindings = makeBindings();
  const shaderLayout = {bindings};

  expect(getShaderLayoutBinding(shaderLayout, 'extra', {ignoreWarnings: true})).toBe(null);
  const extra: BindingDeclaration = {name: 'extra', type: 'uniform', group: 3, location: 4};
  bindings.push(extra);
  expect(getShaderLayoutBinding(shaderLayout, 'extra')).toBe(extra);

  expect(getShaderLayoutBinding(shaderLayout, 'texture')).toBe(bindings[1]);
  const replacement: BindingDeclaration = {name: 'texture', type: 'texture', group: 5, location: 1};
  bindings[1] = replacement;
  expect(getShaderLayoutBinding(shaderLayout, 'texture')).toBe(replacement);

  bindings.splice(1, 1);
  expect(getShaderLayoutBinding(shaderLayout, 'texture', {ignoreWarnings: true})).toBe(null);
});

it('normalizeBindingsByGroup groups bindings by their layout group', () => {
  const shaderLayout = {bindings: makeBindings()};
  const app = {};
  const texture = {};
  const material = {};
  const unknown = {};

  const bindGroups = normalizeBindingsByGroup(shaderLayout, {
    appUniforms: app,
    texture,
    pbrMaterial: material,
    unknown
  } as unknown as Bindings);

  expect(bindGroups).toEqual({
    0: {appUniforms: app, unknown},
    1: {texture},
    2: {pbrMaterial: material}
  });
});
