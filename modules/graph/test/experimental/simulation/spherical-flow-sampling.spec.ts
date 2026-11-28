// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/core/test-utils';
import {Kernel} from '@luma.gl/graph';
import {
  SphericalFlowField,
  type SphericalVectorFieldInput
} from '../../../src/experimental/simulation/spherical-flow-field';
import {SPHERICAL_FLOW_SAMPLING} from '../../../src/experimental/simulation/spherical-flow-sampling-shaders';

/** Exercise the production sampler directly, with no integrator or timestep. */
async function sample(
  device: Device,
  input: SphericalVectorFieldInput,
  positions: number[][]
): Promise<Float32Array> {
  const field = new SphericalFlowField(device, input);
  const queries = device.createBuffer({
    data: new Float32Array(positions.flatMap(position => [...position, 0])),
    usage: Buffer.STORAGE
  });
  const output = device.createBuffer({
    byteLength: positions.length * 16,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const kernel = new Kernel(device, {
    source: `
@group(0) @binding(0) var field: texture_2d<f32>;
@group(0) @binding(1) var<storage, read> queries: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> output: array<vec4f>;
${SPHERICAL_FLOW_SAMPLING}
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) index: vec3u) {
  output[index.x] = vec4f(sampleSnapshot(field, normalize(queries[index.x].xyz)), 0);
}`,
    shaderLayout: {
      bindings: [
        {name: 'field', type: 'texture', group: 0, location: 0},
        {name: 'queries', type: 'read-only-storage', group: 0, location: 1},
        {name: 'output', type: 'storage', group: 0, location: 2}
      ]
    }
  });
  try {
    const pass = device.beginComputePass({});
    kernel.dispatch(pass, {bindings: {field: field.texture, queries, output}, x: positions.length});
    pass.end();
    device.submit();
    const bytes = await output.readAsync();
    return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  } finally {
    kernel.destroy();
    output.destroy();
    queries.destroy();
    field.destroy();
  }
}

/** A global smooth world field with longitude variation and nonzero pole values. */
function makeField(width: number, height: number): SphericalVectorFieldInput {
  const velocity = new Float32Array(width * height * 3);
  for (let row = 0; row < height; row++) {
    const latitude = -Math.PI / 2 + (row * Math.PI) / (height - 1);
    for (let column = 0; column < width; column++) {
      const longitude = -Math.PI + (column * 2 * Math.PI) / (width - 1);
      const horizontal = Math.cos(latitude) * Math.cos(longitude);
      const vertical = Math.cos(latitude) * Math.sin(longitude);
      velocity.set(
        [1 + horizontal, 2 + vertical, 3 + Math.sin(latitude)],
        (row * width + column) * 3
      );
    }
  }
  return {shape: [height, width], velocity};
}

/** Cartesian positions retain latitude offsets too small to survive float32 asin(z). */
function position(longitude: number, latitude: number): number[] {
  return [
    Math.cos(latitude) * Math.cos(longitude),
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude)
  ];
}

it('samples exact poles and near-pole offsets without collapsing latitude to the pole', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const positions = [
    [0, 0, 1],
    [0, 0, -1],
    ...[-1, 1].flatMap(sign =>
      [-2.3, 0.4, 2.8].map(longitude => position(longitude, sign * (Math.PI / 2 - 0.0001)))
    )
  ];
  const values = await sample(device, makeField(129, 65), positions);
  for (let index = 0; index < positions.length; index++) {
    const expected = positions[index].map((component, axis) => component + axis + 1);
    expect(
      Math.hypot(...expected.map((value, axis) => values[index * 4 + axis] - value))
    ).toBeLessThan(0.000004);
  }
});

it('refines spatial error at fixed query positions across both polar caps and the seam', async context => {
  const device = await getTestDevice('webgpu');
  if (!device) return context.skip();
  const positions = [-1, 1].flatMap(sign =>
    [0.03, 0.11, 0.3].flatMap(offset =>
      [-Math.PI + 0.001, Math.PI - 0.001, -1.7, 0.6].map(longitude =>
        position(longitude, sign * (Math.PI / 2 - offset))
      )
    )
  );
  const errors: number[] = [];
  for (const width of [17, 33, 65]) {
    const values = await sample(device, makeField(width, (width + 1) / 2), positions);
    errors.push(
      Math.max(
        ...positions.map((point, index) =>
          Math.hypot(
            ...point.map((component, axis) => values[index * 4 + axis] - (component + axis + 1))
          )
        )
      )
    );
  }
  expect(errors[1]).toBeLessThan(errors[0] * 0.6);
  expect(errors[2]).toBeLessThan(errors[1] * 0.6);
  expect(errors[2]).toBeLessThan(0.002);
});
