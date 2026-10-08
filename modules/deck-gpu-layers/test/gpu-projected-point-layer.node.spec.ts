// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  COORDINATE_SYSTEM,
  OrthographicViewport,
  WebMercatorViewport,
  type LayerContext,
  type PickingInfo
} from '@deck.gl/core';
import {GPUProjectedPointLayer} from '@deck.gl-community/gpu-layers';
import {Buffer} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {ProjectionRenderTransform} from '@luma.gl/experimental/gpu-project/crs';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it, vi} from 'vitest';
import {makeTableTransform} from '../../experimental/test/gpu-project/projection-table-fixtures';

function makeLayer() {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const {prepared} = makeTableTransform();
  const transform = new ProjectionRenderTransform(prepared, {
    origin: [550000, 4190000],
    scale: [1, 1]
  });
  const positions = new GPUVector({
    type: 'data',
    name: 'positions',
    ownsData: true,
    format: 'uint32x4',
    data: [1, 0, 1].map(
      length =>
        new GPUData({
          format: 'uint32x4',
          length,
          buffer: device.createBuffer({byteLength: 16, usage: Buffer.VERTEX}),
          ownsBuffer: true
        })
    )
  });
  const validity = new GPUVector({
    type: 'data',
    name: 'validity',
    ownsData: true,
    format: 'uint32',
    data: [1, 0, 1].map(
      length =>
        new GPUData({
          format: 'uint32',
          length,
          buffer: device.createBuffer({byteLength: 4, usage: Buffer.VERTEX}),
          ownsBuffer: true
        })
    )
  });
  const getSourcePosition = vi.fn(() => [-122.4, 37.8] as const);
  const layer = new GPUProjectedPointLayer({
    id: 'projected',
    transform,
    getPosition: positions,
    inputValidity: validity,
    getSourcePosition
  });
  layer.context = {
    device,
    viewport: new OrthographicViewport({width: 64, height: 64})
  } as LayerContext;
  return {device, layer, positions, validity, getSourcePosition};
}

it('picking retains physical chunk identity and uses the current CPU transform without readback', () => {
  const {device, layer, positions, validity, getSourcePosition} = makeLayer();
  try {
    const result = layer.getPickingInfo({info: {index: 1} as PickingInfo});
    expect(result.gpuVector).toEqual({rowIndex: 1, batchIndex: 2, batchRowIndex: 0});
    expect(result.projection).toEqual(layer.props.transform.projectPosition([-122.4, 37.8]));
    expect(getSourcePosition).toHaveBeenCalledExactlyOnceWith(1);
    expect(layer.getPickingInfo({info: {index: -1} as PickingInfo}).projection).toBeUndefined();
    expect(getSourcePosition).toHaveBeenCalledOnce();
    expect(layer.props.coordinateSystem).toBe(COORDINATE_SYSTEM.CARTESIAN);
  } finally {
    positions.destroy();
    validity.destroy();
    device.destroy();
  }
});

it('declines geospatial viewports before allocating a projection model', () => {
  const {device, layer, positions, validity} = makeLayer();
  layer.context.viewport = new WebMercatorViewport({width: 64, height: 64});
  const allocate = vi.spyOn(device, 'createBuffer');
  try {
    expect(() => layer.initializeState(layer.context)).toThrow('Cartesian viewport');
    expect(allocate).not.toHaveBeenCalled();
  } finally {
    allocate.mockRestore();
    positions.destroy();
    validity.destroy();
    device.destroy();
  }
});

it('releases parameters if a later owned allocation fails without destroying borrowed chunks', () => {
  const {device, layer, positions, validity} = makeLayer();
  const createBuffer = device.createBuffer.bind(device);
  let parameters: Buffer | undefined;
  const allocate = vi
    .spyOn(device, 'createBuffer')
    .mockImplementationOnce(props => {
      parameters = createBuffer(props);
      return parameters;
    })
    .mockImplementationOnce(() => {
      throw new Error('allocation failed');
    });
  try {
    expect(() => layer.initializeState(layer.context)).toThrow('allocation failed');
    expect(parameters?.destroyed).toBe(true);
    expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
    expect(validity.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
  } finally {
    allocate.mockRestore();
    positions.destroy();
    validity.destroy();
    device.destroy();
  }
});
