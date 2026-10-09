// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';
import {
  compileProjectionPlan,
  compileProjectionProgram,
  findProjectionPatch,
  GPUProjection,
  indexProjectionPlan,
  packProjectionPlan
} from '@luma.gl/experimental/gpu-project';
import {validateProjectionRouting} from '../../src/gpu-project/projection-routing-benchmark';

it('indexes without changing the fit or packed legacy ABI and preserves canonical leaf order', () => {
  const plan = compileProjectionPlan({
    projection: position => [Math.sin(position[0]), Math.cos(position[1])],
    bounds: [-2, -2, 2, 2],
    precision: 'double-single',
    degree: 2,
    tolerance: 0.001
  });
  const indexed = indexProjectionPlan(plan);
  expect(indexed.patches).toBe(plan.patches);
  expect(plan.routingIndex).toBeUndefined();
  const legacyWords = packProjectionPlan(plan);
  expect(packProjectionPlan(indexed).slice(0, legacyWords.length)).toEqual(legacyWords);
  expect(indexed.routingIndex!.length).toBeGreaterThan(1);
  const leaves = indexed.routingIndex!.flatMap(node =>
    Array.from(
      {length: node.patchEnd - node.firstPatch},
      (_value, index) => node.firstPatch + index
    )
  );
  expect(leaves).toEqual(plan.patches.map(patch => patch.id));
  for (const [index, node] of indexed.routingIndex!.entries()) {
    expect(node.escape).toBeGreaterThan(index);
    expect(node.escape).toBeLessThanOrEqual(indexed.routingIndex!.length);
  }
  const compile = (candidate: typeof plan) =>
    compileProjectionProgram({
      precision: 'double-single',
      operations: [{type: 'adaptive', plan: candidate}]
    });
  expect(compile(plan).isCompatible(compile(indexed))).toBe(false);
  expect(compile(indexed).isCompatible(compile(indexProjectionPlan(plan)))).toBe(true);
});

it('rejects two agreeing but invalid routing outputs before reporting performance', () => {
  const plan = compileProjectionPlan({
    projection: position => [Math.sin(position[0]), Math.cos(position[1])],
    bounds: [-2, -2, 2, 2],
    precision: 'double-single',
    degree: 2,
    tolerance: 0.001
  });
  const coordinates = [
    plan.patches[0].sourceOrigin,
    plan.patches.at(-1)!.sourceOrigin,
    [3, 0] as const,
    [NaN, 0] as const
  ];
  const expected = Int32Array.from(coordinates, coordinate =>
    findProjectionPatch(plan, coordinate)
  );
  expect(() =>
    validateProjectionRouting(plan, coordinates, Uint32Array.from(expected), expected)
  ).not.toThrow();
  expect(() =>
    validateProjectionRouting(plan, coordinates, new Uint32Array(4).fill(0xffffffff), expected)
  ).toThrow(/validity/);
  const wrongPatch = Uint32Array.from(expected);
  wrongPatch[1] = 0;
  expect(() => validateProjectionRouting(plan, coordinates, wrongPatch, expected)).toThrow(
    /does not cover/
  );
});

it('requires sufficient borrowed index storage and preserves layout on updates', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const graph = new GPUCommandGraph(device);
  const input = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const output = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const plan = compileProjectionPlan({
    projection: position => position,
    bounds: [-1, -1, 1, 1],
    precision: 'double-single'
  });
  const indexed = indexProjectionPlan(plan);
  const storage = device.createBuffer({
    byteLength: packProjectionPlan(plan).byteLength,
    usage: Buffer.STORAGE
  });
  const positions = graph.createDataView(
    graph.importBuffer({id: 'input', byteLength: input.byteLength, usage: input.usage}, input),
    {format: 'uint32x4', length: 1}
  );
  const destination = graph.createDataView(
    graph.importBuffer({id: 'output', byteLength: output.byteLength, usage: output.usage}, output),
    {format: 'float32x4', length: 1}
  );
  const planBuffer = graph.createDataView(
    graph.importBuffer({id: 'plan', byteLength: storage.byteLength, usage: storage.usage}, storage),
    {format: 'uint32', length: storage.byteLength / 4}
  );
  try {
    expect(
      () =>
        new GPUProjection({
          positions,
          output: destination,
          plan: indexed,
          planBuffer,
          precision: 'double-single'
        })
    ).toThrow(/smaller/);
    const contributor = new GPUProjection({
      positions,
      output: destination,
      plan: indexed,
      precision: 'double-single'
    });
    expect(() => contributor.updatePlan(plan)).toThrow(/layout/);
    expect(() => contributor.updatePlan({...indexed, strictDomains: true})).toThrow(/layout/);
    contributor.updatePlan(indexProjectionPlan(plan));
    contributor.destroy();
    expect(input.destroyed).toBe(false);
    expect(output.destroyed).toBe(false);
  } finally {
    storage.destroy();
    input.destroy();
    output.destroy();
    device.destroy();
  }
});
