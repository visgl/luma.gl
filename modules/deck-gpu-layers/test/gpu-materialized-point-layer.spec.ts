// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {
  GPUH3ProjectedPointSource,
  GPUMaterializedPointLayer,
  type GPUProjectedPointPickingInfo
} from '@deck.gl-community/gpu-layers';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {CompiledGPUCommandGraph} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {prepareCRSProjection, ProjectionRenderTransform} from '@luma.gl/graph/gpu-project-crs';
import {cellToLatLng, latLngToCell} from 'h3-js';
import {expect, it, vi} from 'vitest';

for (const groupChunks of [false, true]) {
  it(`updates only dirty resident H3 chunks and reuses materialized output for camera changes and picks (grouped ${groupChunks})`, async context => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    ) {
      return context.skip();
    }
    const initialCell = latLngToCell(37.8, -122.396, 12);
    const replacementCell = latLngToCell(37.802, -122.393, 12);
    const untouchedCell = latLngToCell(37.8, -122.403, 12);
    const maskedCell = latLngToCell(37.803, -122.401, 12);
    const rowCells = [untouchedCell, null, initialCell];
    const packed = (cell: string | null) => (cell ? BigInt(`0x${cell}`) : 0n);
    const buffers = [[untouchedCell, null], [initialCell]].map(cells =>
      device.createBuffer({
        data: new Uint32Array(BigUint64Array.from(cells, packed).buffer),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      })
    );
    const cells = new GPUVector({
      type: 'data',
      name: 'resident-cells',
      format: 'uint32x2',
      ownsData: true,
      data: buffers.map(
        (buffer, index) =>
          new GPUData({
            format: 'uint32x2',
            buffer,
            length: index === 0 ? 2 : 1,
            ownsBuffer: true
          })
      )
    });
    const replacement = device.createBuffer({
      data: new Uint32Array(BigUint64Array.of(packed(replacementCell)).buffer),
      usage: Buffer.COPY_SRC
    });
    const prepared = prepareCRSProjection({
      from: 'EPSG:4326',
      to: '+proj=utm +zone=10 +datum=WGS84',
      bounds: [-122.42, 37.78, -122.38, 37.82],
      tolerance: 0.0005
    });
    if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
    const center = prepared.projection.projectSync([-122.4, 37.8]);
    const transform = new ProjectionRenderTransform(prepared, {
      origin: [center[0], center[1]],
      scale: [0.075, 0.075]
    });
    const source = new GPUH3ProjectedPointSource(device, {cells, transform, groupChunks});
    const sourcePosition = (cell: string) => {
      const [latitude, longitude] = cellToLatLng(cell);
      return [Math.fround(longitude), Math.fround(latitude)] as const;
    };
    const layer = new GPUMaterializedPointLayer({
      id: 'materialized',
      positions: source.positions,
      validity: source.validity,
      transform: source.transform,
      getSourcePosition: index => (rowCells[index] ? sourcePosition(rowCells[index]) : null),
      pointSize: 8,
      getColor: [255, 0, 0],
      pickable: true
    });
    const encode = vi.spyOn(CompiledGPUCommandGraph.prototype, 'encode');
    const encodedNodes = () =>
      encode.mock.results.flatMap(result =>
        result.type === 'return' ? result.value.stats.nodes.map(node => node.id) : []
      );
    const parent = document.createElement('div');
    document.body.append(parent);
    let drawn = 0;
    const errors: string[] = [];
    const deck = new Deck({
      parent,
      device,
      width: 192,
      height: 128,
      useDevicePixels: false,
      views: new OrthographicView(),
      initialViewState: {target: [0, 0, 0], zoom: 0},
      layers: [layer],
      onAfterRender: () => drawn++,
      onError: error => errors.push(error.message)
    });

    async function redraw() {
      const previous = drawn;
      const deadline = performance.now() + 15000;
      do {
        deck.redraw('materialized H3 test');
        await new Promise(resolve => requestAnimationFrame(resolve));
      } while (drawn <= previous && !errors.length && performance.now() < deadline);
      expect(errors).toEqual([]);
      expect(drawn).toBeGreaterThan(previous);
    }
    async function pick(cell: string) {
      const position = transform.projectPosition(sourcePosition(cell))!;
      const [x, y] = deck.getViewports()[0].project([...position.common, 0]);
      return (await deck.pickObjectAsync({
        x: Math.round(x),
        y: Math.round(y),
        radius: 0
      })) as GPUProjectedPointPickingInfo | null;
    }

    try {
      source.updateChunks();
      const paired = groupChunks && device.limits.maxStorageBuffersPerShaderStage >= 9;
      expect(encodedNodes()).toEqual(
        paired
          ? ['h3-centers-0', 'h3-centers-1', 'h3-projection-0-1-chunks-0-1']
          : ['h3-centers-0', 'h3-projection-0-chunk-0', 'h3-centers-1', 'h3-projection-1-chunk-0']
      );
      encode.mockClear();
      await redraw();
      const model = layer.getModels()[0];
      const outputChunks = source.positions.data.slice();
      expect((await pick(initialCell))?.index).toBe(2);
      expect(await pick(maskedCell)).toBeNull();
      expect(encodedNodes()).toEqual([]);

      // Replace one resident cell with a GPU-to-GPU copy from preloaded storage.
      const copy = device.createCommandEncoder();
      copy.copyBufferToBuffer({sourceBuffer: replacement, destinationBuffer: buffers[1], size: 8});
      device.submit(copy.finish());
      rowCells[2] = replacementCell;
      source.updateChunks([1]);
      expect(encodedNodes()).toEqual(['h3-centers-1', 'h3-projection-1-chunk-0']);
      encode.mockClear();
      await redraw();
      expect(await pick(initialCell)).toBeNull();
      const updated = await pick(replacementCell);
      expect(updated?.gpuVector).toEqual({rowIndex: 2, batchIndex: 1, batchRowIndex: 0});
      expect(updated?.projection).toEqual(
        transform.projectPosition(sourcePosition(replacementCell))
      );
      expect((await pick(untouchedCell))?.index).toBe(0);
      expect(encodedNodes()).toEqual([]);

      deck.setProps({viewState: {target: [13, -4, 0], zoom: 0.3}});
      await redraw();
      expect(deck.getViewports()[0].zoom).toBe(0.3);
      expect((await pick(replacementCell))?.index).toBe(2);
      expect((await pick(untouchedCell))?.index).toBe(0);
      expect(encodedNodes()).toEqual([]);
      expect(layer.getModels()[0]).toBe(model);
      expect(source.positions.data.every((chunk, index) => chunk === outputChunks[index])).toBe(
        true
      );
      deck.finalize();
      expect(outputChunks.every(chunk => !chunk.buffer.destroyed)).toBe(true);
      source.destroy();
      expect(outputChunks.every(chunk => chunk.buffer.destroyed)).toBe(true);
      expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    } finally {
      encode.mockRestore();
      deck.finalize();
      parent.remove();
      source.destroy();
      replacement.destroy();
      cells.destroy();
    }
  }, 60000);
}
