// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView} from '@deck.gl/core';
import {
  GPUMaterializedMapPointLayer,
  GPUH3MapPointSource,
  type GPUProjectedPointPickingInfo
} from '@deck.gl-community/gpu-layers';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {cellToLatLng, latLngToCell} from 'h3-js';
import {expect, it, vi} from 'vitest';

it('picks resident H3 points across Mercator zoom modes and updates only the dirty chunk', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  ) {
    return context.skip();
  }
  const first = latLngToCell(37.799, -122.405, 12);
  const second = latLngToCell(37.801, -122.398, 12);
  const replacement = latLngToCell(37.802, -122.394, 12);
  const masked = latLngToCell(37.804, -122.402, 12);
  const outside = latLngToCell(37.8, -122.414, 12);
  const rowCells = [first, null, second, outside];
  const words = (cell: string | null) => (cell ? BigInt(`0x${cell}`) : 0n);
  const buffers = [
    [first, null],
    [second, outside]
  ].map(cells =>
    device.createBuffer({
      data: new Uint32Array(BigUint64Array.from(cells, words).buffer),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    })
  );
  const replacementBuffer = device.createBuffer({
    data: new Uint32Array(BigUint64Array.of(words(replacement)).buffer),
    usage: Buffer.COPY_SRC
  });
  const cells = new GPUVector({
    type: 'data',
    name: 'map-h3',
    format: 'uint32x2',
    ownsData: true,
    data: buffers.map(
      buffer => new GPUData({format: 'uint32x2', length: 2, buffer, ownsBuffer: true})
    )
  });
  expect(() => new GPUH3MapPointSource(device, {cells, bounds: [170, -10, -170, 10]})).toThrow(
    /Web Mercator world/
  );
  const source = new GPUH3MapPointSource(device, {cells, bounds: [-122.41, 37.79, -122.39, 37.81]});
  const sourcePosition = (cell: string) => {
    const [latitude, longitude] = cellToLatLng(cell);
    return [Math.fround(longitude), Math.fround(latitude)] as const;
  };
  const parent = document.createElement('div');
  document.body.append(parent);
  const encode = vi.spyOn(CompiledGPUCommandGraph.prototype, 'encode');
  const getEncodedNodes = () =>
    encode.mock.results.flatMap(result =>
      result.type === 'return' ? result.value.stats.nodes.map(node => node.id) : []
    );
  let frames = 0;
  const errors: string[] = [];
  const layer = new GPUMaterializedMapPointLayer(
    {id: 'h3-map-points'},
    {
      source,
      getSourcePosition: index => (rowCells[index] ? sourcePosition(rowCells[index]) : null),
      pointSize: 8,
      getColor: [255, 0, 0],
      pickable: true
    }
  );
  const deck = new Deck({
    parent,
    device,
    views: new MapView(),
    width: 768,
    height: 256,
    useDevicePixels: false,
    initialViewState: {longitude: -122.402, latitude: 37.8, zoom: 11},
    layers: [layer],
    onAfterRender: () => frames++,
    onError: error => errors.push(error.message)
  });
  const redraw = async () => {
    const previous = frames;
    const deadline = performance.now() + 15000;
    do {
      deck.redraw('H3 materialized map');
      await new Promise(resolve => requestAnimationFrame(resolve));
    } while (frames <= previous && !errors.length && performance.now() < deadline);
    expect(errors).toEqual([]);
    expect(frames).toBeGreaterThan(previous);
  };
  const pick = async (cell: string) => {
    const [longitude, latitude] = sourcePosition(cell);
    const [x, y] = deck.getViewports()[0].project([longitude, latitude, 0]);
    return (await deck.pickObjectAsync({
      x: Math.round(x),
      y: Math.round(y),
      radius: 0
    })) as GPUProjectedPointPickingInfo | null;
  };
  const retainedPositions = source.positions;
  const retainedValidity = source.validity;
  const retainedBuffers = [...retainedPositions.data, ...retainedValidity.data].map(
    chunk => chunk.buffer
  );
  try {
    source.updateChunks();
    expect(getEncodedNodes()).toEqual([
      'h3-centers-0',
      'h3-projection-0-chunk-0',
      'h3-centers-1',
      'h3-projection-1-chunk-0'
    ]);
    encode.mockClear();
    await redraw();
    expect((await pick(first))?.index).toBe(0);
    expect((await pick(second))?.index).toBe(2);
    expect(await pick(masked)).toBeNull();
    expect(await pick(outside)).toBeNull();
    const model = layer.getModels()[0];
    expect(getEncodedNodes()).toEqual([]);

    const clonedLayer = layer.clone({pointSize: 10});
    expect(clonedLayer.props.pointSize).toBe(10);
    deck.setProps({
      layers: [clonedLayer],
      viewState: {longitude: -122.401, latitude: 37.801, zoom: 14, bearing: 17}
    });
    await redraw();
    expect((await pick(first))?.index).toBe(0);
    expect((await pick(second))?.index).toBe(2);
    expect(clonedLayer.getModels()[0]).toBe(model);
    expect(getEncodedNodes()).toEqual([]);

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer({
      sourceBuffer: replacementBuffer,
      destinationBuffer: buffers[1],
      size: 8
    });
    device.submit(encoder.finish());
    rowCells[2] = replacement;
    source.updateChunks([1]);
    expect(source.positions).toBe(retainedPositions);
    expect(source.validity).toBe(retainedValidity);
    [...source.positions.data, ...source.validity.data].forEach((chunk, index) => {
      expect(chunk.buffer).toBe(retainedBuffers[index]);
    });
    expect(getEncodedNodes()).toEqual(['h3-centers-1', 'h3-projection-1-chunk-0']);
    encode.mockClear();
    await redraw();
    expect(await pick(second)).toBeNull();
    const picked = await pick(replacement);
    expect(picked?.gpuVector).toEqual({rowIndex: 2, batchIndex: 1, batchRowIndex: 0});
    expect(picked?.projection).toEqual(
      source.transform.projectPosition(sourcePosition(replacement))
    );
    const [longitude, latitude] = sourcePosition(replacement);
    expect(picked?.coordinate?.[0]).toBeCloseTo(longitude, 4);
    expect(picked?.coordinate?.[1]).toBeCloseTo(latitude, 4);
    expect((await pick(first))?.index).toBe(0);
    expect(getEncodedNodes()).toEqual([]);
  } finally {
    encode.mockRestore();
    deck.finalize();
    parent.remove();
    source.destroy();
    cells.destroy();
    replacementBuffer.destroy();
  }
}, 60000);
