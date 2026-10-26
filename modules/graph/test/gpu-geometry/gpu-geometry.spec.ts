// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {GPUMeshNormals, GPUMeshVertexNormals, GPUMeshSmoothing} from '@luma.gl/graph/gpu-geometry';
import {makeSpatialFixture, readFloats} from '../spatial-test-utils';

it('GPU geometry composes area-weighted face and vertex normals with offset views', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view(
      'float32x3',
      new Float32Array([0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 3]),
      4
    );
    const indices = fixture.view(
      'uint32',
      new Uint32Array([0, 1, 2, 0, 3, 1, 0, 0, 0, 0, 1, 99]),
      12
    );
    const faces = fixture.view('float32x3', new Float32Array(12), 4);
    const offsets = fixture.view('uint32', new Uint32Array([0, 2, 4, 5, 6, 6]));
    const incidence = fixture.view('uint32', new Uint32Array([0, 1, 0, 1, 0, 1]));
    const normals = fixture.view('float32x3', new Float32Array(15), 8);
    fixture.graph.add(
      new GPUMeshNormals({
        positions: positions.view,
        indices: indices.view,
        normals: faces.view,
        areaWeighted: true
      })
    );
    fixture.graph.add(
      new GPUMeshVertexNormals({
        faceNormals: faces.view,
        offsets: offsets.view,
        faceIndices: incidence.view,
        normals: normals.view
      })
    );
    await fixture.run();
    expect(await readFloats(faces.buffer, 4)).toEqual([0, 0, 2, 0, 6, 0, 0, 0, 0, 0, 0, 0]);
    const result = await readFloats(normals.buffer, 8);
    const expected = [
      0,
      6 / Math.sqrt(40),
      2 / Math.sqrt(40),
      0,
      6 / Math.sqrt(40),
      2 / Math.sqrt(40),
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      0,
      0
    ];
    result.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
  } finally {
    fixture.destroy();
  }
});

it('GPU geometry normalizes winding and handles empty triangle lists', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view('float32x3', new Float32Array([0, 0, 0, 2, 0, 0, 0, 1, 0]));
    const indices = fixture.view('uint32', new Uint32Array([0, 2, 1]));
    const normals = fixture.view('float32x3', new Float32Array(3));
    fixture.graph.add(
      new GPUMeshNormals({positions: positions.view, indices: indices.view, normals: normals.view})
    );
    const emptyIndices = fixture.view('uint32', new Uint32Array());
    const emptyNormals = fixture.view('float32x3', new Float32Array());
    expect(
      new GPUMeshNormals({
        positions: positions.view,
        indices: emptyIndices.view,
        normals: emptyNormals.view
      }).getCommandNodes(fixture.graph)
    ).toEqual([]);
    await fixture.run();
    expect(await readFloats(normals.buffer)).toEqual([0, 0, -1]);
  } finally {
    fixture.destroy();
  }
});

it('GPU smoothing preserves pins and isolated vertices across two composed iterations', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view(
      'float32x3',
      new Float32Array([0, 0, 0, 2, 0, 0, 8, 0, 0, 12, 0, 0])
    );
    const offsets = fixture.view('uint32', new Uint32Array([0, 1, 3, 4, 4]));
    const neighbors = fixture.view('uint32', new Uint32Array([1, 0, 2, 1]));
    const pinned = fixture.view('uint32', new Uint32Array([1, 0, 0, 0]));
    const intermediate = fixture.view('float32x3', new Float32Array(12));
    const output = fixture.view('float32x3', new Float32Array(12));
    const common = {
      offsets: offsets.view,
      neighbors: neighbors.view,
      pinned: pinned.view,
      factor: 0.5
    };
    fixture.graph.add(
      new GPUMeshSmoothing({
        ...common,
        id: 'first',
        positions: positions.view,
        output: intermediate.view
      })
    );
    fixture.graph.add(
      new GPUMeshSmoothing({
        ...common,
        id: 'second',
        positions: intermediate.view,
        output: output.view
      })
    );
    await fixture.run();
    expect(await readFloats(intermediate.buffer)).toEqual([0, 0, 0, 3, 0, 0, 5, 0, 0, 12, 0, 0]);
    expect(await readFloats(output.buffer)).toEqual([0, 0, 0, 2.75, 0, 0, 4, 0, 0, 12, 0, 0]);
  } finally {
    fixture.destroy();
  }
});

it('GPU geometry normalizes finite cross products at very large and small scales', async context => {
  const device = await getWebGPUTestDevice('core');
  if (!device) {
    context.skip();
    return;
  }
  const fixture = makeSpatialFixture(device);
  try {
    const positions = fixture.view(
      'float32x3',
      new Float32Array([0, 0, 0, 1e10, 0, 0, 0, 1e10, 0, 0, 0, 0, 1e-10, 0, 0, 0, 1e-10, 0])
    );
    const indices = fixture.view('uint32', new Uint32Array([0, 1, 2, 3, 4, 5]));
    const normals = fixture.view('float32x3', new Float32Array(6));
    fixture.graph.add(
      new GPUMeshNormals({positions: positions.view, indices: indices.view, normals: normals.view})
    );
    await fixture.run();
    expect(await readFloats(normals.buffer)).toEqual([0, 0, 1, 0, 0, 1]);
  } finally {
    fixture.destroy();
  }
});
