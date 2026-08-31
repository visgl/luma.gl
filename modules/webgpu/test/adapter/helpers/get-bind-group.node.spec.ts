// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import type {Bindings, ShaderLayout} from '@luma.gl/core';
import {
  formatBindGroupCreationErrorSummary,
  getBindGroup,
  getBindGroupLabel
} from '../../../src/adapter/helpers/get-bind-group';
import {WebGPUExternalTexture} from '../../../src/adapter/resources/webgpu-external-texture';
import {WebGPUPipelineLayout} from '../../../src/adapter/resources/webgpu-pipeline-layout';
import {WebGPUTexture} from '../../../src/adapter/resources/webgpu-texture';

it('formatBindGroupCreationErrorSummary formats compact missing-binding summaries', () => {
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

  expect(
    formatBindGroupCreationErrorSummary(shaderLayout, bindings, entries, 0),
    'summary reports expected/provided/missing bindings in binding order'
  ).toBe(
    [
      'bindGroup creation failed for group 0: expected 3, provided 2',
      'expected: appFrame@0, pbrProjection@100, skin@101',
      'provided: appFrame@0, pbrProjection@100',
      'missing: skin@101'
    ].join('\n')
  );

  void 0;
});

it('formatBindGroupCreationErrorSummary reports unmatched logical bindings and unexpected entries', () => {
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

  expect(
    formatBindGroupCreationErrorSummary(shaderLayout, bindings, entries, 0),
    'summary calls out logical names that do not map to the group and entries outside the layout'
  ).toBe(
    [
      'bindGroup creation failed for group 0: expected 1, provided 2',
      'expected: appFrame@0',
      'provided: appFrame@0, ?@7',
      'unexpected entries: ?@7',
      'unmatched logical bindings: extraBinding'
    ].join('\n')
  );

  void 0;
});

it('getBindGroupLabel uses pipeline id, group, and expected binding names', () => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'skin', type: 'uniform', group: 0, location: 101},
      {name: 'appFrame', type: 'uniform', group: 0, location: 0},
      {name: 'pbrProjection', type: 'uniform', group: 0, location: 100}
    ]
  };

  expect(
    getBindGroupLabel('scatter-plot', shaderLayout, 0),
    'label uses pipeline id and binding names in binding order'
  ).toBe('scatter-plot/group0[appFrame,pbrProjection,skin]');
  expect(
    getBindGroupLabel('scatter-plot', shaderLayout, 1),
    'empty groups get an explicit empty label'
  ).toBe('scatter-plot/group1[empty]');

  void 0;
});

it('WebGPU external texture bindings use external handles and paired samplers', () => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'videoTexture', type: 'external-texture', group: 0, location: 0},
      {name: 'videoTextureSampler', type: 'sampler', group: 0, location: 1}
    ]
  };
  const externalTexture = Object.assign(Object.create(WebGPUExternalTexture.prototype), {
    handle: 'external-handle',
    sampler: {handle: 'sampler-handle'}
  }) as WebGPUExternalTexture;
  const descriptor = getBindGroup(
    makeMockWebGPUDevice(),
    {} as GPUBindGroupLayout,
    shaderLayout,
    {videoTexture: externalTexture},
    0
  ) as unknown as GPUBindGroupDescriptor;

  expect(
    descriptor.entries,
    'native external texture binds its handle and default sampler'
  ).toEqual([
    {binding: 0, resource: 'external-handle'},
    {binding: 1, resource: 'sampler-handle'}
  ]);

  void 0;
});

it('WebGPU external texture bindings reject copied texture fallback views', () => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [
      {name: 'videoTexture', type: 'external-texture', group: 0, location: 0},
      {name: 'videoTextureSampler', type: 'sampler', group: 0, location: 1}
    ]
  };
  const copiedTexture = Object.assign(Object.create(WebGPUTexture.prototype), {
    view: {handle: 'texture-view-handle'},
    sampler: {handle: 'sampler-handle'}
  }) as WebGPUTexture;
  const bindGroup = getBindGroup(
    makeMockWebGPUDevice(),
    {} as GPUBindGroupLayout,
    shaderLayout,
    {videoTexture: copiedTexture},
    0
  );

  expect(bindGroup, 'copied texture cannot satisfy an external texture slot').toBe(null);

  void 0;
});

it('WebGPU external texture shader layouts emit externalTexture bind group entries', () => {
  const shaderLayout: ShaderLayout = {
    attributes: [],
    bindings: [{name: 'videoTexture', type: 'external-texture', group: 0, location: 4}]
  };
  const originalGPUShaderStage = globalThis.GPUShaderStage;
  globalThis.GPUShaderStage = {VERTEX: 1, FRAGMENT: 2, COMPUTE: 4} as GPUShaderStage;
  const pipelineLayout = Object.assign(Object.create(WebGPUPipelineLayout.prototype), {
    props: {shaderLayout}
  }) as WebGPUPipelineLayout;

  const entries = (pipelineLayout as any).mapShaderLayoutToBindGroupEntriesByGroup();

  globalThis.GPUShaderStage = originalGPUShaderStage;
  expect(entries, 'pipeline layout uses WebGPU externalTexture descriptor').toEqual([
    [{binding: 4, visibility: 7, externalTexture: {}}]
  ]);

  void 0;
});

function makeMockWebGPUDevice(): any {
  return {
    handle: {
      createBindGroup: (descriptor: GPUBindGroupDescriptor) => descriptor
    },
    pushErrorScope: () => {},
    popErrorScope: () => {}
  };
}
