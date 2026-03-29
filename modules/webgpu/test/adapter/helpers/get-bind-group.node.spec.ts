// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import type {Bindings, ShaderLayout} from '@luma.gl/core';
import {
  formatBindGroupCreationErrorSummary,
  getBindGroupLabel
} from '../../../src/adapter/helpers/get-bind-group';

test('formatBindGroupCreationErrorSummary formats compact missing-binding summaries', t => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'skin', type: 'uniform', group: 0, location: 101},
      {name: 'appFrame', type: 'uniform', group: 0, location: 0},
      {name: 'pbrProjection', type: 'uniform', group: 0, location: 100}
    ]
  };
  const bindings: Bindings = {
    pbrProjection: {} as any,
    appFrame: {} as any
  };
  const entries = [
    {binding: 100, resource: {} as GPUBufferBinding},
    {binding: 0, resource: {} as GPUBufferBinding}
  ] as GPUBindGroupEntry[];

  t.equal(
    formatBindGroupCreationErrorSummary(shaderLayout, bindings, entries, 0),
    [
      'bindGroup creation failed for group 0: expected 3, provided 2',
      'expected: appFrame@0, pbrProjection@100, skin@101',
      'provided: appFrame@0, pbrProjection@100',
      'missing: skin@101'
    ].join('\n'),
    'summary reports expected/provided/missing bindings in binding order'
  );

  t.end();
});

test('formatBindGroupCreationErrorSummary reports unmatched logical bindings and unexpected entries', t => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [{name: 'appFrame', type: 'uniform', group: 0, location: 0}]
  };
  const bindings: Bindings = {
    extraBinding: {} as any,
    appFrame: {} as any
  };
  const entries = [
    {binding: 7, resource: {} as GPUBufferBinding},
    {binding: 0, resource: {} as GPUBufferBinding}
  ] as GPUBindGroupEntry[];

  t.equal(
    formatBindGroupCreationErrorSummary(shaderLayout, bindings, entries, 0),
    [
      'bindGroup creation failed for group 0: expected 1, provided 2',
      'expected: appFrame@0',
      'provided: appFrame@0, ?@7',
      'unexpected entries: ?@7',
      'unmatched logical bindings: extraBinding'
    ].join('\n'),
    'summary calls out logical names that do not map to the group and entries outside the layout'
  );

  t.end();
});

test('getBindGroupLabel uses pipeline id, group, and expected binding names', t => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'skin', type: 'uniform', group: 0, location: 101},
      {name: 'appFrame', type: 'uniform', group: 0, location: 0},
      {name: 'pbrProjection', type: 'uniform', group: 0, location: 100}
    ]
  };

  t.equal(
    getBindGroupLabel('scatter-plot', shaderLayout, 0),
    'scatter-plot/group0[appFrame,pbrProjection,skin]',
    'label uses pipeline id and binding names in binding order'
  );
  t.equal(
    getBindGroupLabel('scatter-plot', shaderLayout, 1),
    'scatter-plot/group1[empty]',
    'empty groups get an explicit empty label'
  );

  t.end();
});
