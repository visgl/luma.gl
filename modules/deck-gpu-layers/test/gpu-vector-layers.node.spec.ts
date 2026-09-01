// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {PickingInfo} from '@deck.gl/core';
import {
  GPUArcLayer,
  GPUColumnLayer,
  GPUGridCellLayer,
  GPULineLayer,
  GPUPointCloudLayer,
  GPUScatterplotLayer,
  type GPUVectorLayerPickingInfo
} from '@deck.gl-community/gpu-layers';
import type {Buffer} from '@luma.gl/core';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {describe, expect, test, vi} from 'vitest';

describe('GPUVector deck layers', () => {
  test('preserve physical chunks and global picking provenance', () => {
    const positions = makeChunkedVector('positions', 'float32x2', [2, 3]);
    const radii = makeChunkedVector('radii', 'float32', [2, 3]);
    const layer = new GPUScatterplotLayer({
      id: 'gpu-scatterplot',
      getPosition: positions,
      getRadius: radii
    });

    const children = layer.renderLayers();
    expect(children.map(child => child.props['rowCount'])).toEqual([2, 3]);
    const secondInfo = children[1]!.getPickingInfo({
      info: {index: 3} as PickingInfo
    } as never) as GPUVectorLayerPickingInfo;
    expect(secondInfo.index).toBe(3);
    expect(secondInfo.gpuVector).toEqual({rowIndex: 3, batchIndex: 1, batchRowIndex: 1});
  });

  test('rejects misaligned semantic vector chunks', () => {
    const sourcePositions = makeChunkedVector('source', 'float32x2', [2, 3]);
    const targetPositions = makeChunkedVector('target', 'float32x2', [1, 4]);
    const layer = new GPULineLayer({
      id: 'gpu-lines',
      getSourcePosition: sourcePositions,
      getTargetPosition: targetPositions
    });

    expect(() => layer.renderLayers()).toThrow('chunk 0 row counts must align');
  });

  test('borrows GPUVector buffers without taking ownership', () => {
    const destroy = vi.fn();
    const positions = makeChunkedVector('positions', 'float32x2', [2], destroy);
    const layer = new GPUScatterplotLayer({id: 'borrowed', getPosition: positions});

    layer.renderLayers();
    layer.finalizeState({} as never);

    expect(destroy).not.toHaveBeenCalled();
  });

  test('preserves batches across the complete fixed-width primitive family', () => {
    const positions2 = makeChunkedVector('positions2', 'float32x2', [2, 3]);
    const positions3 = makeChunkedVector('positions3', 'float32x3', [2, 3]);
    const targets = makeChunkedVector('targets', 'float32x2', [2, 3]);
    const layers = [
      new GPUArcLayer({
        id: 'arcs',
        getSourcePosition: positions2,
        getTargetPosition: targets
      }),
      new GPUColumnLayer({id: 'columns', getPosition: positions2}),
      new GPUGridCellLayer({id: 'cells', getPosition: positions2}),
      new GPUPointCloudLayer({id: 'point-cloud', getPosition: positions3})
    ];

    expect(layers[0]!.renderLayers()).toHaveLength(2);
    expect(layers[1]!.renderLayers()).toHaveLength(2);
    expect(layers[2]!.renderLayers()).toBeInstanceOf(GPUColumnLayer);
    expect(layers[3]!.renderLayers()).toHaveLength(2);
  });
});

function makeChunkedVector<FormatT extends GPUVectorFormat>(
  name: string,
  format: FormatT,
  chunkLengths: number[],
  destroy = vi.fn()
): GPUVector<FormatT> {
  const components = format.endsWith('x2') ? 2 : format.endsWith('x3') ? 3 : 1;
  const bytesPerRow = components * Float32Array.BYTES_PER_ELEMENT;
  const data = chunkLengths.map(
    length =>
      new GPUData<FormatT>({
        buffer: {byteLength: length * bytesPerRow, destroy} as unknown as Buffer,
        format,
        length,
        byteStride: bytesPerRow,
        rowByteLength: bytesPerRow,
        ownsBuffer: false
      })
  );
  return new GPUVector({type: 'data', name, format, data, ownsData: false});
}
