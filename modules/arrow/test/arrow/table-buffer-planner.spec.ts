// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {TableBufferPlanner, type TableColumnDescriptor} from '@luma.gl/arrow';
import type {Device} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';

test('TableBufferPlanner builds shared-geometry allocation groups deterministically', t => {
  const plan = TableBufferPlanner.getAllocationPlan({
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

  t.deepEqual(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    [
      ['interleaved-shared-geometry-columns', 'interleaved-shared-geometry-columns', ['positions']],
      [
        'interleaved-constant-attribute-columns',
        'interleaved-constant-attribute-columns',
        ['instanceSizes']
      ],
      ['position-attribute-columns', 'position-attribute-columns', ['instancePositions']],
      ['instanceAngles', 'separate-attribute-column', ['instanceAngles']]
    ],
    'builds stable groups independent of input order'
  );
  t.equal(
    plan.groups.find(group => group.id === 'interleaved-constant-attribute-columns')?.rowCount,
    4,
    'shared-geometry constants use shared geometry row count'
  );
  t.equal(
    plan.groups.find(group => group.id === 'interleaved-constant-attribute-columns')?.stepMode,
    'vertex',
    'shared-geometry constants use vertex step mode'
  );
  t.deepEqual(
    [...plan.packedColumnIds].sort(),
    ['instanceAngles', 'instancePositions', 'instanceSizes', 'positions'],
    'tracks planner-owned vertex buffer columns'
  );
  t.equal(
    plan.mappingsByColumnId.instancePositions[0].bufferName,
    'position-attribute-columns',
    'maps position column to position group'
  );

  t.end();
});

test('TableBufferPlanner builds row-geometry constants with instance step mode', t => {
  const plan = TableBufferPlanner.getAllocationPlan({
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

  t.deepEqual(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    [
      [
        'interleaved-constant-attribute-columns',
        'interleaved-constant-attribute-columns',
        ['angles']
      ],
      ['position-attribute-columns', 'position-attribute-columns', ['positions']]
    ],
    'row-geometry mode separates constants from positions'
  );
  t.equal(plan.groups[0].rowCount, 1, 'row-geometry constants use one materialized row');
  t.equal(plan.groups[0].stepMode, 'instance', 'row-geometry constants use instance step mode');

  t.end();
});

test('TableBufferPlanner uses priority for separate vs interleaved data columns', t => {
  const plan = TableBufferPlanner.getAllocationPlan({
    device: createDevice({maxVertexBuffers: 2}),
    modelInfo: {isInstanced: true},
    columns: [
      makeColumn('instancePickingColors', {priority: 'low'}),
      makeColumn('instanceAngles', {priority: 'medium'}),
      makeColumn('instanceColors', {priority: 'high'})
    ]
  });

  t.deepEqual(
    plan.groups.map(group => [group.id, group.kind, group.columns.map(column => column.id)]),
    [
      ['instanceColors', 'separate-attribute-column', ['instanceColors']],
      [
        'interleaved-attribute-columns',
        'interleaved-attribute-columns',
        ['instanceAngles', 'instancePickingColors']
      ]
    ],
    'assigns scarce separate slots by priority, then id'
  );

  t.end();
});

test('TableBufferPlanner marks unsupported columns as unmanaged', t => {
  const plan = TableBufferPlanner.getAllocationPlan({
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

  t.deepEqual(
    Object.fromEntries(
      Object.entries(plan.groupsByColumnId).map(([columnId, groups]) => [columnId, groups[0].kind])
    ),
    {
      externalValues: 'unmanaged-attribute-column',
      generatedPickingColors: 'separate-attribute-column',
      indices: 'unmanaged-attribute-column',
      nonPosition64: 'unmanaged-attribute-column',
      noAllocValues: 'unmanaged-attribute-column',
      transitionValues: 'unmanaged-attribute-column'
    },
    'keeps unsafe columns unmanaged while allowing generated noAlloc CPU data'
  );
  t.notOk(
    TableBufferPlanner.shouldSkipColumnBuffer(makeColumn('transitionValues', {isTransition: true})),
    'does not skip unmanaged transition columns'
  );
  t.ok(
    TableBufferPlanner.shouldSkipColumnBuffer(
      makeColumn('generatedPickingColors', {noAlloc: true, allowNoAllocManaged: true})
    ),
    'can skip generated noAlloc columns that the planner can publish'
  );

  t.end();
});

test('TableBufferPlanner maps fp64 position high and low components separately', t => {
  const plan = TableBufferPlanner.getAllocationPlan({
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

  t.deepEqual(
    plan.groups.map(group => [group.id, group.columns]),
    [
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
    ],
    'splits fp64 position columns into low constants and high position group'
  );
  t.deepEqual(
    plan.mappingsByColumnId.instanceSourcePositions.map(mapping => [
      mapping.attributeName,
      mapping.bufferName,
      mapping.fp64Component
    ]),
    [
      ['instanceSourcePositions64Low', 'interleaved-constant-attribute-columns', 'low'],
      ['instanceSourcePositions', 'position-attribute-columns', 'high']
    ],
    'maps shader-visible fp64 attributes'
  );

  t.end();
});

test('TableBufferPlanner uses WebGPU row-geometry storage groups when enabled', t => {
  const webgpuPlan = TableBufferPlanner.getAllocationPlan({
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
  const webglPlan = TableBufferPlanner.getAllocationPlan({
    device: createDevice({type: 'webgl', maxStorageBuffersPerShaderStage: 4}),
    modelInfo: {isInstanced: false},
    useStorageBuffers: true,
    columns: [
      makeColumn('positions', {stepMode: 'vertex', isPosition: true}),
      makeColumn('elevations')
    ]
  });
  const sharedGeometryPlan = TableBufferPlanner.getAllocationPlan({
    device: createDevice({type: 'webgpu', maxStorageBuffersPerShaderStage: 4}),
    modelInfo: {isInstanced: true},
    useStorageBuffers: true,
    columns: [makeColumn('elevations')]
  });

  t.deepEqual(
    webgpuPlan.groups
      .filter(group => group.kind === 'separate-storage-column')
      .map(group => group.id)
      .sort(),
    ['elevations', 'fillColors'],
    'uses dedicated storage buffers on WebGPU row geometries'
  );
  t.deepEqual(
    [...webgpuPlan.storageColumnIds].sort(),
    ['elevations', 'fillColors'],
    'tracks storage columns'
  );
  t.notOk(webgpuPlan.packedColumnIds.has('fillColors'), 'storage columns are not packed columns');
  t.notOk(
    webglPlan.groups.some(group => group.kind === 'separate-storage-column'),
    'does not use storage buffers on WebGL'
  );
  t.notOk(
    sharedGeometryPlan.groups.some(group => group.kind === 'separate-storage-column'),
    'does not use storage buffers for shared-geometry mode'
  );

  t.end();
});

test('TableBufferPlanner stacks storage groups and falls back on size limits', t => {
  const countLimitedPlan = TableBufferPlanner.getAllocationPlan({
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
  const sizeLimitedPlan = TableBufferPlanner.getAllocationPlan({
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
  t.deepEqual(
    stackedGroup && [stackedGroup.id, stackedGroup.columns.map(column => column.id)],
    ['stacked-storage-columns', ['fillColors', 'elevations']],
    'stacks overflow storage columns when only one binding is available'
  );
  t.deepEqual(
    stackedGroup?.byteOffsets,
    {fillColors: 0, elevations: 256},
    'aligns stacked storage columns'
  );
  t.equal(
    countLimitedPlan.mappingsByColumnId.elevations[0].byteOffset,
    256,
    'adds storage byte offsets to mappings'
  );
  t.notOk(
    sizeLimitedPlan.groups.some(
      group => group.kind === 'separate-storage-column' || group.kind === 'stacked-storage-columns'
    ),
    'falls back to vertex buffers when storage binding size is too small'
  );

  t.end();
});

test('TableBufferPlanner validates vertex buffer count and array stride limits', t => {
  t.throws(
    () =>
      TableBufferPlanner.getAllocationPlan({
        device: createDevice({maxVertexBuffers: 1}),
        modelInfo: {isInstanced: true},
        columns: [
          makeColumn('positions', {stepMode: 'vertex'}),
          makeColumn('instanceColors', {priority: 'high'})
        ]
      }),
    /requires 2 vertex buffers/,
    'throws when required vertex buffers exceed device limit'
  );
  t.throws(
    () =>
      TableBufferPlanner.getAllocationPlan({
        device: createDevice({maxVertexBuffers: 1, maxVertexBufferArrayStride: 16}),
        modelInfo: {isInstanced: true},
        columns: [
          makeColumn('instanceAngles', {byteStride: 12, priority: 'low'}),
          makeColumn('instanceSizes', {byteStride: 12, priority: 'low'})
        ]
      }),
    /requires byteStride 24/,
    'throws when interleaved group stride exceeds device limit'
  );

  t.end();
});

function makeColumn(
  id: string,
  overrides: Partial<TableColumnDescriptor> = {}
): TableColumnDescriptor {
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
  maxStorageBufferBindingSize
}: {
  type?: 'webgl' | 'webgpu' | 'null' | 'unknown';
  maxVertexBuffers?: number;
  maxVertexBufferArrayStride?: number;
  maxStorageBuffersPerShaderStage?: number;
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
  Object.defineProperty(limits, 'maxStorageBufferBindingSize', {
    value: maxStorageBufferBindingSize ?? device.limits.maxStorageBufferBindingSize
  });

  const testDevice = Object.create(device);
  Object.defineProperty(testDevice, 'type', {value: type});
  Object.defineProperty(testDevice, 'limits', {value: limits});
  return testDevice;
}
