// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GPUTableBufferPlanner,
  type GPUTableColumnDescriptor
} from '@luma.gl/experimental/gpu-tables';
import type {Device} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';

it('GPUTableBufferPlanner builds shared-geometry allocation groups deterministically', () => {
  const plan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 8}),
    modelInfo: {isInstanced: true},
    generateConstantAttributes: true,
    columns: [
      makeColumn('instanceSizes', {isConstant: true, priority: 'low'}),
      makeColumn('positions', {stepMode: 'vertex', byteStride: 8, byteLength: 32, rowCount: 4}),
      makeColumn('instanceAngles'),
      makeColumn('instancePositions', {byteStride: 12, byteLength: 24, isPosition: true})
    ]
  });

  expect(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    'builds stable groups independent of input order'
  ).toEqual([
    ['interleaved-shared-geometry-columns', 'interleaved-shared-geometry-columns', ['positions']],
    [
      'interleaved-constant-attribute-columns',
      'interleaved-constant-attribute-columns',
      ['instanceSizes']
    ],
    ['position-attribute-columns', 'position-attribute-columns', ['instancePositions']],
    ['instanceAngles', 'separate-attribute-column', ['instanceAngles']]
  ]);
  expect(
    plan.groups.find(group => group.id === 'interleaved-constant-attribute-columns')?.rowCount,
    'shared-geometry constants use shared geometry row count'
  ).toBe(4);
  expect(
    plan.groups.find(group => group.id === 'interleaved-constant-attribute-columns')?.stepMode,
    'shared-geometry constants use vertex step mode'
  ).toBe('vertex');
  expect([...plan.packedColumnIds].sort(), 'tracks planner-owned vertex buffer columns').toEqual([
    'instanceAngles',
    'instancePositions',
    'instanceSizes',
    'positions'
  ]);
  expect(
    plan.mappingsByColumnId.instancePositions[0].bufferName,
    'maps position column to position group'
  ).toBe('position-attribute-columns');

  void 0;
});

it('GPUTableBufferPlanner builds row-geometry constants with instance step mode', () => {
  const plan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 8}),
    modelInfo: {isInstanced: false},
    generateConstantAttributes: true,
    columns: [
      makeColumn('positions', {
        stepMode: 'vertex',
        byteStride: 8,
        byteLength: 80,
        rowCount: 10,
        isPosition: true
      }),
      makeColumn('angles', {isConstant: true})
    ]
  });

  expect(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    'row-geometry mode separates constants from positions'
  ).toEqual([
    [
      'interleaved-constant-attribute-columns',
      'interleaved-constant-attribute-columns',
      ['angles']
    ],
    ['position-attribute-columns', 'position-attribute-columns', ['positions']]
  ]);
  expect(plan.groups[0].rowCount, 'row-geometry constants use one materialized row').toBe(1);
  expect(plan.groups[0].stepMode, 'row-geometry constants use instance step mode').toBe('instance');

  void 0;
});

it('GPUTableBufferPlanner uses priority for separate vs interleaved data columns', () => {
  const plan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 2}),
    modelInfo: {isInstanced: true},
    columns: [
      makeColumn('instancePickingColors', {priority: 'low'}),
      makeColumn('instanceAngles', {priority: 'medium'}),
      makeColumn('instanceColors', {priority: 'high'})
    ]
  });

  expect(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    'assigns scarce separate slots by priority, then id'
  ).toEqual([
    ['instanceColors', 'separate-attribute-column', ['instanceColors']],
    [
      'interleaved-attribute-columns',
      'interleaved-attribute-columns',
      ['instanceAngles', 'instancePickingColors']
    ]
  ]);

  void 0;
});

it('GPUTableBufferPlanner marks unsupported columns as unmanaged', () => {
  const plan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 16}),
    modelInfo: {isInstanced: true},
    generateConstantAttributes: true,
    columns: [
      makeColumn('externalValues', {isExternalBufferOnly: true}),
      makeColumn('indices', {isIndexed: true}),
      makeColumn('nonPosition64', {isDoublePrecision: true}),
      makeColumn('noAllocValues', {noAlloc: true}),
      makeColumn('transitionValues', {isTransition: true}),
      makeColumn('generatedPickingColors', {
        noAlloc: true,
        allowNoAllocManaged: true,
        priority: 'low'
      })
    ]
  });

  expect(
    Object.fromEntries(
      Object.entries(plan.groupsByColumnId).map(([columnId, groups]) => [columnId, groups[0].kind])
    ),
    'keeps unsafe columns unmanaged while allowing generated noAlloc CPU data'
  ).toEqual({
    externalValues: 'unmanaged-attribute-column',
    generatedPickingColors: 'separate-attribute-column',
    indices: 'unmanaged-attribute-column',
    nonPosition64: 'unmanaged-attribute-column',
    noAllocValues: 'unmanaged-attribute-column',
    transitionValues: 'unmanaged-attribute-column'
  });
  expect(
    Boolean(
      GPUTableBufferPlanner.shouldSkipColumnBuffer(
        makeColumn('transitionValues', {isTransition: true})
      )
    ),
    'does not skip unmanaged transition columns'
  ).toBe(false);
  expect(
    Boolean(
      GPUTableBufferPlanner.shouldSkipColumnBuffer(
        makeColumn('generatedPickingColors', {noAlloc: true, allowNoAllocManaged: true})
      )
    ),
    'can skip generated noAlloc columns that the planner can publish'
  ).toBe(true);

  void 0;
});

it('GPUTableBufferPlanner maps fp64 position high and low components separately', () => {
  const plan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 8}),
    modelInfo: {isInstanced: true},
    generateConstantAttributes: true,
    columns: [
      makeColumn('instanceSourcePositions', {
        byteStride: 24,
        byteLength: 48,
        isPosition: true,
        isDoublePrecision: true
      }),
      makeColumn('instanceTargetPositions', {
        byteStride: 24,
        byteLength: 48,
        isPosition: true,
        isDoublePrecision: true
      })
    ]
  });

  expect(
    plan.groups.map(group => [group.id, group.columns]),
    'splits fp64 position columns into low constants and high position group'
  ).toEqual([
    [
      'interleaved-constant-attribute-columns',
      [
        {id: 'instanceSourcePositions', fp64Component: 'low'},
        {id: 'instanceTargetPositions', fp64Component: 'low'}
      ]
    ],
    [
      'position-attribute-columns',
      [
        {id: 'instanceSourcePositions', fp64Component: 'high'},
        {id: 'instanceTargetPositions', fp64Component: 'high'}
      ]
    ]
  ]);
  expect(
    plan.mappingsByColumnId.instanceSourcePositions.map(mapping => [
      mapping.attributeName,
      mapping.bufferName,
      mapping.fp64Component
    ]),
    'maps shader-visible fp64 attributes'
  ).toEqual([
    ['instanceSourcePositions64Low', 'interleaved-constant-attribute-columns', 'low'],
    ['instanceSourcePositions', 'position-attribute-columns', 'high']
  ]);

  void 0;
});

it('GPUTableBufferPlanner uses WebGPU row-geometry storage groups when enabled', () => {
  const webgpuPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({
      type: 'webgpu',
      maxStorageBuffersPerShaderStage: 4,
      maxStorageBufferBindingSize: 1024
    }),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {
        stepMode: 'vertex',
        byteStride: 8,
        byteLength: 80,
        rowCount: 10,
        isPosition: true
      }),
      makeColumn('fillColors', {byteStride: 4, byteLength: 8, priority: 'high'}),
      makeColumn('elevations', {byteStride: 4, byteLength: 8})
    ]
  });
  const webglPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({type: 'webgl', maxStorageBuffersPerShaderStage: 4}),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {stepMode: 'vertex', isPosition: true}),
      makeColumn('elevations')
    ]
  });
  const sharedGeometryPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({type: 'webgpu', maxStorageBuffersPerShaderStage: 4}),
    modelInfo: {isInstanced: true},
    useStorageBuffers: true,
    columns: [makeColumn('elevations')]
  });
  const vertexStorageLimitedPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({
      type: 'webgpu',
      maxStorageBuffersPerShaderStage: 4,
      maxStorageBuffersInVertexStage: 0,
      maxStorageBufferBindingSize: 1024
    }),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {stepMode: 'vertex', isPosition: true}),
      makeColumn('fillColors', {byteStride: 4, byteLength: 8})
    ]
  });

  expect(
    webgpuPlan.groups
      .filter(group => group.kind === 'separate-storage-column')
      .map(group => group.id)
      .sort(),
    'uses dedicated storage buffers on WebGPU row geometries'
  ).toEqual(['elevations', 'fillColors']);
  expect([...webgpuPlan.storageColumnIds].sort(), 'tracks storage columns').toEqual([
    'elevations',
    'fillColors'
  ]);
  expect(
    Boolean(webgpuPlan.packedColumnIds.has('fillColors')),
    'storage columns are not packed columns'
  ).toBe(false);
  expect(
    Boolean(webglPlan.groups.some(group => group.kind === 'separate-storage-column')),
    'does not use storage buffers on WebGL'
  ).toBe(false);
  expect(
    Boolean(sharedGeometryPlan.groups.some(group => group.kind === 'separate-storage-column')),
    'does not use storage buffers for shared-geometry mode'
  ).toBe(false);
  expect(
    Boolean(
      vertexStorageLimitedPlan.groups.some(
        group =>
          group.kind === 'separate-storage-column' || group.kind === 'stacked-storage-columns'
      )
    ),
    'does not use storage buffers when the vertex stage storage limit is zero'
  ).toBe(false);

  void 0;
});

it('GPUTableBufferPlanner stacks storage groups and falls back on size limits', () => {
  const countLimitedPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({
      type: 'webgpu',
      maxStorageBuffersPerShaderStage: 1,
      maxStorageBufferBindingSize: 1024
    }),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {stepMode: 'vertex', isPosition: true}),
      makeColumn('fillColors', {byteStride: 4, byteLength: 8, priority: 'high'}),
      makeColumn('elevations', {byteStride: 4, byteLength: 8})
    ]
  });
  const sizeLimitedPlan = GPUTableBufferPlanner.getAllocationPlan({
    device: createDevice({
      type: 'webgpu',
      maxStorageBuffersPerShaderStage: 4,
      maxStorageBufferBindingSize: 4
    }),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {stepMode: 'vertex', isPosition: true}),
      makeColumn('fillColors', {byteStride: 4, byteLength: 8, priority: 'high'}),
      makeColumn('elevations', {byteStride: 4, byteLength: 8})
    ]
  });

  const stackedGroup = countLimitedPlan.groups.find(
    group => group.kind === 'stacked-storage-columns'
  );
  expect(
    stackedGroup && [stackedGroup.id, stackedGroup.columns.map(column => column.id)],
    'stacks overflow storage columns when only one binding is available'
  ).toEqual(['stacked-storage-columns', ['fillColors', 'elevations']]);
  expect(stackedGroup?.byteOffsets, 'aligns stacked storage columns').toEqual({
    fillColors: 0,
    elevations: 256
  });
  expect(
    countLimitedPlan.mappingsByColumnId.elevations[0].byteOffset,
    'adds storage byte offsets to mappings'
  ).toBe(256);
  expect(
    Boolean(
      sizeLimitedPlan.groups.some(
        group =>
          group.kind === 'separate-storage-column' || group.kind === 'stacked-storage-columns'
      )
    ),
    'falls back to vertex buffers when storage binding size is too small'
  ).toBe(false);

  void 0;
});

it('GPUTableBufferPlanner validates vertex buffer count and array stride limits', () => {
  expect(
    () =>
      GPUTableBufferPlanner.getAllocationPlan({
        device: createDevice({maxVertexBuffers: 1}),
        modelInfo: {isInstanced: true},
        columns: [
          makeColumn('positions', {stepMode: 'vertex'}),
          makeColumn('instanceColors', {priority: 'high'})
        ]
      }),
    'throws when required vertex buffers exceed device limit'
  ).toThrow(/requires 2 vertex buffers/);
  expect(
    () =>
      GPUTableBufferPlanner.getAllocationPlan({
        device: createDevice({maxVertexBuffers: 1, maxVertexBufferArrayStride: 16}),
        modelInfo: {isInstanced: true},
        columns: [
          makeColumn('instanceAngles', {byteStride: 12, priority: 'low'}),
          makeColumn('instanceSizes', {byteStride: 12, priority: 'low'})
        ]
      }),
    'throws when interleaved group stride exceeds device limit'
  ).toThrow(/requires byteStride 24/);

  void 0;
});

function makeColumn(
  id: string,
  overrides: Partial<GPUTableColumnDescriptor> = {}
): GPUTableColumnDescriptor {
  return {
    id,
    byteStride: 4,
    byteLength: 8,
    rowCount: 2,
    stepMode: 'instance',
    supportsPackedBuffer: true,
    ...overrides
  };
}

function createDevice({
  type = 'webgpu',
  maxVertexBuffers,
  maxVertexBufferArrayStride,
  maxStorageBuffersPerShaderStage,
  maxStorageBuffersInVertexStage,
  maxStorageBufferBindingSize
}: {
  type?: 'webgl' | 'webgpu' | 'null' | 'unknown';
  maxVertexBuffers?: number;
  maxVertexBufferArrayStride?: number;
  maxStorageBuffersPerShaderStage?: number;
  maxStorageBuffersInVertexStage?: number;
  maxStorageBufferBindingSize?: number;
} = {}): Device {
  const device = new NullDevice({});
  const limits = Object.create(device.limits);
  Object.defineProperty(limits, 'maxVertexBuffers', {
    value: maxVertexBuffers ?? device.limits.maxVertexBuffers
  });
  Object.defineProperty(limits, 'maxVertexBufferArrayStride', {
    value: maxVertexBufferArrayStride ?? device.limits.maxVertexBufferArrayStride
  });
  Object.defineProperty(limits, 'maxStorageBuffersPerShaderStage', {
    value: maxStorageBuffersPerShaderStage ?? device.limits.maxStorageBuffersPerShaderStage
  });
  Object.defineProperty(limits, 'maxStorageBuffersInVertexStage', {
    value:
      maxStorageBuffersInVertexStage ??
      maxStorageBuffersPerShaderStage ??
      device.limits.maxStorageBuffersPerShaderStage
  });
  Object.defineProperty(limits, 'maxStorageBufferBindingSize', {
    value: maxStorageBufferBindingSize ?? device.limits.maxStorageBufferBindingSize
  });

  const testDevice = Object.create(device);
  Object.defineProperty(testDevice, 'type', {value: type});
  Object.defineProperty(testDevice, 'limits', {value: limits});
  return testDevice;
}
