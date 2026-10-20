// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {GPUTimeSeries, GPUTimeSeriesEnvelope} from '@luma.gl/gpgpu/gpu-timeseries';

export function createFixture(
  device: Device,
  chunks: number[][],
  binCount = 4,
  masks?: number[][]
) {
  const buffers: Buffer[] = [];
  const vectors: GPUVector[] = [];
  function makeVector<Format extends GPUVectorFormat>(
    name: string,
    format: Format,
    values: Float32Array | Uint32Array,
    length: number
  ) {
    // An unaligned storage-binding offset exercises the shader's scalar component addressing.
    const buffer = device.createBuffer({
      id: name,
      byteLength: Math.max(4, values.byteLength) + 4,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    if (values.byteLength) buffer.write(values, 4);
    buffers.push(buffer);
    const vector = new GPUVector<Format>({
      type: 'buffer',
      name,
      format,
      buffer,
      length,
      byteOffset: 4,
      ownsBuffer: false
    });
    vectors.push(vector);
    return {buffer, vector};
  }
  const data = chunks.map(
    (chunk, index) =>
      makeVector(`source-${index}`, 'float32', Float32Array.from(chunk), chunk.length).vector
        .data[0]
  );
  const values = new GPUVector<'float32'>({
    type: 'data',
    name: 'values',
    format: 'float32',
    data,
    ownsData: false
  });
  vectors.push(values);
  let validity: GPUVector<'uint32'> | undefined;
  if (masks) {
    const maskData = masks.map(
      (chunk, index) =>
        makeVector(`validity-${index}`, 'uint32', Uint32Array.from(chunk), chunk.length).vector
          .data[0]
    );
    validity = new GPUVector<'uint32'>({
      type: 'data',
      name: 'validity',
      format: 'uint32',
      data: maskData,
      ownsData: false
    });
    vectors.push(validity);
  }
  const series = new GPUTimeSeries({values, validity, origin: 100, interval: 0.1});
  const range = makeVector('range', 'uint32x2', new Uint32Array([0, values.length]), 1);
  const output = makeVector('output', 'float32x4', new Float32Array(binCount * 4), binCount);
  const sourceIds = makeVector('source-ids', 'uint32x4', new Uint32Array(binCount * 4), binCount);
  const counts = makeVector('counts', 'uint32x2', new Uint32Array(binCount * 2), binCount);
  const props = {
    series,
    range: range.vector,
    output: output.vector,
    sourceIds: sourceIds.vector,
    counts: counts.vector
  };
  return {
    props,
    series,
    range,
    output,
    sourceIds,
    counts,
    buffers,
    vectors,
    operation: new GPUTimeSeriesEnvelope(props),
    destroy() {
      for (const vector of vectors) vector.destroy();
      for (const buffer of buffers) buffer.destroy();
    }
  };
}

/** Independent CPU oracle: assign each source row to its integer interval, then summarize lists. */
export function calculateEnvelope(
  values: number[],
  binCount: number,
  first: number,
  last: number,
  validity?: number[]
) {
  const start = Math.min(first, values.length);
  const end = Math.max(start, Math.min(last, values.length));
  const output: number[] = [];
  const sourceIds: number[] = [];
  const counts: number[] = [];
  for (let bucket = 0; bucket < binCount; bucket++) {
    const begin = start + Math.floor(((end - start) * bucket) / binCount);
    const finish = start + Math.floor(((end - start) * (bucket + 1)) / binCount);
    const accepted: number[] = [];
    for (let sample = begin; sample < finish; sample++) {
      if (Number.isFinite(values[sample]) && (!validity || validity[sample])) accepted.push(sample);
    }
    if (accepted.length) {
      const minimum = accepted.reduce((left, right) =>
        values[right] < values[left] ? right : left
      );
      const maximum = accepted.reduce((left, right) =>
        values[right] > values[left] ? right : left
      );
      const identifiers = [minimum, maximum, accepted[0], accepted[accepted.length - 1]];
      output.push(...identifiers.map(identifier => values[identifier]));
      sourceIds.push(...identifiers);
    } else {
      output.push(0, 0, 0, 0);
      sourceIds.push(...Array(4).fill(0xffffffff));
    }
    counts.push(accepted.length, finish - begin - accepted.length);
  }
  return {output, sourceIds, counts};
}
