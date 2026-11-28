// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView} from '@deck.gl/core';
import {
  GPUMaterializedMapLineLayer,
  GPUMaterializedMapPointLayer,
  GPUTableMapPointSource
} from '@deck.gl-community/gpu-layers';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUTable} from '@luma.gl/graph/gpu-tables';
import {expect, it, vi} from 'vitest';

it('projects resident UTM batches and picks points and segments without a coordinate readback', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  ) {
    return context.skip();
  }
  const center = [-122.4, 37.8] as const;
  // UTM zone 10N transects in San Francisco. Two batches deliberately reuse local row zero.
  const pointCoordinates = [551900, 4183800, 552300, 4184000];
  const endCoordinates = [552100, 4183800, 552500, 4184000];
  const makeColumn = (name: string, coordinates: number[]) =>
    new GPUVector({
      name,
      type: 'data',
      format: 'uint32x4',
      ownsData: true,
      data: [0, 2].map(
        offset =>
          new GPUData({
            format: 'uint32x4',
            length: 1,
            ownsBuffer: true,
            buffer: device.createBuffer({
              data: new Uint32Array(new Float64Array(coordinates.slice(offset, offset + 2)).buffer),
              usage: Buffer.STORAGE | Buffer.COPY_DST
            })
          })
      )
    });
  const startColumn = makeColumn('start', pointCoordinates);
  const endColumn = makeColumn('end', endCoordinates);
  const table = new GPUTable({vectors: {start: startColumn, end: endColumn}});
  const options = {
    table,
    from: 'EPSG:32610',
    bounds: [551500, 4183500, 553000, 4184600] as const,
    sourceOrigin: [552000, 4183900] as const,
    tolerance: 0.05
  };
  const start = new GPUTableMapPointSource(device, {
    ...options,
    id: 'local-start',
    positions: 'start'
  });
  const end = new GPUTableMapPointSource(device, {...options, id: 'local-end', positions: 'end'});
  const pointLayer = new GPUMaterializedMapPointLayer({
    id: 'points',
    source: start,
    pickable: true,
    pointSize: 8
  });
  const lineLayer = new GPUMaterializedMapLineLayer({
    id: 'lines',
    start,
    end,
    pickable: true,
    getWidth: 8,
    getFeatureIndex: () => 42
  });
  const parent = document.createElement('div');
  document.body.append(parent);
  const encode = vi.spyOn(CompiledGPUCommandGraph.prototype, 'encode');
  const encodedNodes = () =>
    encode.mock.results.flatMap(result =>
      result.type === 'return' ? result.value.stats.nodes.map(node => node.id) : []
    );
  const errors: string[] = [];
  let frames = 0;
  const deck = new Deck({
    parent,
    device,
    views: new MapView(),
    width: 768,
    height: 512,
    useDevicePixels: false,
    initialViewState: {longitude: center[0], latitude: center[1], zoom: 14, bearing: 17},
    layers: [lineLayer, pointLayer],
    onAfterRender: () => frames++,
    onError: error => errors.push(error.message)
  });
  const redraw = async () => {
    const previous = frames;
    const deadline = performance.now() + 15000;
    do {
      deck.redraw('resident map table');
      await new Promise(resolve => requestAnimationFrame(resolve));
    } while (frames <= previous && !errors.length && performance.now() < deadline);
    expect(errors).toEqual([]);
    expect(frames).toBeGreaterThan(previous);
  };
  const pixel = (coordinates: [number, number]) => {
    const local = start.transform.projectPosition(coordinates)!.common;
    const viewport = deck.getViewports()[0];
    return viewport.project(
      viewport.unprojectPosition([
        start.commonOrigin[0] + local[0],
        start.commonOrigin[1] + local[1],
        0
      ])
    );
  };
  const pick = async (x: number, y: number) =>
    (await deck.pickObjectAsync({x: Math.round(x), y: Math.round(y), radius: 0})) as {
      layer?: {id: string};
      gpuVector?: unknown;
    } | null;
  const replacement = device.createBuffer({
    data: new Uint32Array(new Float64Array([600000, 4184000]).buffer),
    usage: Buffer.COPY_SRC
  });
  const retainedPositions = end.positions;
  const retainedValidity = end.validity;
  const retainedBuffers = [...retainedPositions.data, ...retainedValidity.data].map(
    chunk => chunk.buffer
  );
  try {
    start.updateChunks();
    end.updateChunks();
    expect(encodedNodes()).toHaveLength(4);
    encode.mockClear();
    await redraw();
    const [pointX, pointY] = pixel([552300, 4184000]);
    const [targetX, targetY] = pixel([552500, 4184000]);
    const identity = {rowIndex: 1, batchIndex: 1, batchRowIndex: 0};
    expect(await pick(pointX, pointY)).toMatchObject({layer: {id: 'points'}, gpuVector: identity});
    expect(await pick((pointX + targetX) / 2, (pointY + targetY) / 2)).toMatchObject({
      layer: {id: 'lines'},
      featureIndex: 42,
      gpuVector: identity
    });
    expect(encodedNodes()).toEqual([]);

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer({
      sourceBuffer: replacement,
      destinationBuffer: endColumn.data[1].buffer as Buffer,
      size: 16
    });
    device.submit(encoder.finish());
    end.updateChunks([1, 1]);
    expect(end.positions).toBe(retainedPositions);
    expect(end.validity).toBe(retainedValidity);
    [...end.positions.data, ...end.validity.data].forEach((chunk, index) => {
      expect(chunk.buffer).toBe(retainedBuffers[index]);
    });
    expect(encodedNodes()).toEqual(['local-end-batch-1-chunk-0']);
    encode.mockClear();
    await redraw();
    expect(await pick((pointX + targetX) / 2, (pointY + targetY) / 2)).toBeNull();
    expect(await pick(pointX, pointY)).toMatchObject({layer: {id: 'points'}, gpuVector: identity});
    const [firstX, firstY] = pixel([552000, 4183800]);
    expect(await pick(firstX, firstY)).toMatchObject({
      layer: {id: 'lines'},
      featureIndex: 42,
      gpuVector: {rowIndex: 0, batchIndex: 0, batchRowIndex: 0}
    });
    deck.setProps({viewState: {longitude: center[0], latitude: center[1], zoom: 11}});
    await redraw();
    expect(encodedNodes()).toEqual([]);
  } finally {
    deck.finalize();
    encode.mockRestore();
    start.destroy();
    end.destroy();
    expect(startColumn.data[0].buffer.destroyed).toBe(false);
    table.destroy();
    startColumn.destroy();
    endColumn.destroy();
    replacement.destroy();
    parent.remove();
  }
}, 60000);
