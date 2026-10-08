// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, OrthographicView} from '@deck.gl/core';
import {
  GPUProjectedPointLayer,
  type GPUProjectedPointPickingInfo
} from '@deck.gl-community/gpu-layers';
import {Buffer, Texture} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  prepareCRSProjection,
  ProjectionRenderTransform,
  ProjectionTableTransform
} from '@luma.gl/experimental/gpu-project/crs';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {uploadSourceTable} from '../../experimental/test/gpu-project/projection-table-fixtures';

for (const mode of ['pipeline', 'precision'] as const) {
  it(`inline UTM rendering: ${mode === 'pipeline' ? 'links the complete model bindings' : 'picks sub-float32-separated rows matching CPU and materialized output'}`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) context.skip();
    // Like the table kernels, raw binary64/double-single shaders are hardware-qualified.
    // SwiftShader compilation of the inline integer-fp64 program can stall its GPU process.
    if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
      context.skip();
    const prepared = prepareCRSProjection({
      from: 'EPSG:4326',
      to: '+proj=utm +zone=10 +datum=WGS84',
      bounds: [-122.400001, 37.799999, -122.399999, 37.800001],
      tolerance: 0.0000001
    });
    if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
    const source = [
      [-122.4, 37.8],
      [-122.4 + 1e-8, 37.8],
      [-122.4 - 1e-8, 37.8],
      [NaN, 37.8],
      [-123, 37.8]
    ] as const;
    const first = prepared.projection.projectSync([...source[0]]);
    const transform = new ProjectionRenderTransform(prepared, {
      origin: [first[0], first[1]],
      scale: [18000, 18000]
    });
    const batches = [
      {positions: new Float64Array(source[0]), inputValidity: Uint32Array.of(1)},
      {positions: new Float64Array(0), inputValidity: new Uint32Array(0)},
      {
        positions: new Float64Array(source.slice(1).flat()),
        inputValidity: Uint32Array.of(2, 0, 1, 1)
      }
    ];
    const positions = new GPUVector({
      type: 'data',
      name: 'positions',
      format: 'uint32x4',
      ownsData: true,
      data: batches.map(
        batch =>
          new GPUData({
            format: 'uint32x4',
            length: batch.positions.length / 2,
            ownsBuffer: true,
            buffer: device.createBuffer({
              data: batch.positions.length
                ? new Uint8Array(batch.positions.buffer)
                : new Uint8Array(16),
              usage: Buffer.VERTEX | Buffer.COPY_DST
            })
          })
      )
    });
    const validity = new GPUVector({
      type: 'data',
      name: 'validity',
      format: 'uint32',
      ownsData: true,
      data: batches.map(
        batch =>
          new GPUData({
            format: 'uint32',
            length: batch.inputValidity.length,
            ownsBuffer: true,
            buffer: device.createBuffer({
              data: batch.inputValidity.length ? batch.inputValidity : new Uint32Array(1),
              usage: Buffer.VERTEX | Buffer.COPY_DST
            })
          })
      )
    });
    const table = uploadSourceTable(device, batches);
    const materialized = new ProjectionTableTransform(prepared).createGPUProjectionTable(device, {
      table,
      positions: 'coordinates',
      inputValidity: 'selected'
    });
    const graph = new GPUCommandGraph(device);
    materialized.addToGraph(graph);
    const compiledGraph = graph.compile();
    const texture = device.createTexture({
      width: 64,
      height: 64,
      format: 'rgba8unorm',
      usage: Texture.RENDER | Texture.COPY_SRC
    });
    const framebuffer = device.createFramebuffer({
      width: 64,
      height: 64,
      colorAttachments: [texture],
      depthStencilAttachment: 'depth24plus'
    });
    const parent = document.createElement('div');
    document.body.append(parent);
    const errors: string[] = [];
    let frames = 0;
    function makeLayer(renderTransform: ProjectionRenderTransform) {
      return new GPUProjectedPointLayer({
        id: 'projected',
        transform: renderTransform,
        getPosition: positions,
        inputValidity: validity,
        getSourcePosition: index => source[index] ?? null,
        pointSize: 6,
        getColor: [255, 0, 0],
        pickable: true
      });
    }
    const deck = new Deck({
      parent,
      device,
      width: 64,
      height: 64,
      useDevicePixels: false,
      views: new OrthographicView(),
      initialViewState: {target: [0, 0], zoom: 0},
      _framebuffer: framebuffer,
      layers: [makeLayer(transform)],
      onAfterRender: () => frames++,
      onError: error => errors.push(error.message)
    });
    async function readFrame() {
      const previous = frames;
      const deadline = Date.now() + 15000;
      do {
        deck.redraw('projection render test');
        await new Promise(resolve => requestAnimationFrame(resolve));
      } while (frames < previous + 2 && !errors.length && Date.now() < deadline);
      expect(errors).toEqual([]);
      expect(frames).toBeGreaterThan(previous);
      const layout = texture.computeMemoryLayout();
      const output = device.createBuffer({
        byteLength: layout.byteLength,
        usage: Buffer.COPY_DST | Buffer.MAP_READ
      });
      try {
        texture.readBuffer({}, output);
        device.submit();
        return new Uint8Array(await output.readAsync()).slice();
      } finally {
        output.destroy();
      }
    }
    try {
      if (mode === 'pipeline') {
        await readFrame();
        const layer = deck.layerManager!.getLayers()[0] as GPUProjectedPointLayer;
        const model = layer.getModels()[0];
        expect(model.pipeline.linkStatus).toBe('success');
        expect(model.shaderInputs.modules.fp64arithmetic.uniformTypes).toEqual({
          ONE: 'f32',
          SPLIT: 'f32'
        });
        const parameters = model.bindings.projection_render_parameters as Buffer;
        deck.finalize();
        expect(parameters.destroyed).toBe(true);
        expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
        return;
      }
      const encoder = device.createCommandEncoder();
      compiledGraph.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      const expected = source.slice(0, 2).map(point => transform.projectPosition(point)!);
      expect(Math.fround(expected[0].destination[0])).toBe(Math.fround(expected[1].destination[0]));
      for (const [batchIndex, rowIndex] of [
        [0, 0],
        [2, 1]
      ]) {
        const data = materialized.table.batches[batchIndex].gpuData.positions;
        const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
        const words = new Float32Array((await buffer.readAsync(0, 16)).buffer);
        const common = transform.getCommonPosition([words[0] + words[1], words[2] + words[3]]);
        expect(
          Math.hypot(
            common[0] - expected[rowIndex].common[0],
            common[1] - expected[rowIndex].common[1]
          )
        ).toBeLessThan(0.02);
      }
      const pixels = await readFrame();
      const layout = texture.computeMemoryLayout();
      for (const [index, position] of expected.entries()) {
        const column = Math.round(32 + position.common[0]);
        const row = Math.round(32 + position.common[1]);
        expect(pixels[row * layout.bytesPerRow + column * 4]).toBeGreaterThan(200);
        const picked = (await deck.pickObjectAsync({
          x: column,
          y: row,
          radius: 1
        })) as GPUProjectedPointPickingInfo | null;
        expect(picked?.index).toBe(index);
        expect(picked?.projection).toEqual(position);
        expect(picked?.gpuVector?.batchIndex).toBe(index === 0 ? 0 : 2);
      }
      const masked = transform.projectPosition(source[2])!;
      expect(
        await deck.pickObjectAsync({
          x: Math.round(32 + masked.common[0]),
          y: Math.round(32 + masked.common[1]),
          radius: 1
        })
      ).toBeNull();
      const oldLayer = deck.layerManager!.getLayers()[0] as GPUProjectedPointLayer;
      const oldModel = oldLayer.getModels()[0];
      const oldParameters = oldModel.bindings.projection_render_parameters as Buffer;
      const nextTransform = new ProjectionRenderTransform(prepared, {
        origin: [first[0] + 0.0003, first[1]],
        scale: [18000, 18000]
      });
      deck.setProps({layers: [makeLayer(nextTransform)]});
      await readFrame();
      expect(oldParameters.destroyed).toBe(true);
      const updated = (await deck.pickObjectAsync({
        x: Math.round(32 - 5.4),
        y: 32,
        radius: 1
      })) as GPUProjectedPointPickingInfo | null;
      expect(updated?.index).toBe(0);
      expect(updated?.projection).toEqual(nextTransform.projectPosition(source[0]));
      const liveLayer = deck.layerManager!.getLayers()[0] as GPUProjectedPointLayer;
      const liveParameters = liveLayer.getModels()[0].bindings
        .projection_render_parameters as Buffer;
      deck.finalize();
      expect(liveParameters.destroyed).toBe(true);
      expect(positions.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
      expect(validity.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
    } finally {
      deck.finalize();
      parent.remove();
      framebuffer.destroy();
      texture.destroy();
      compiledGraph.destroy();
      materialized.destroy();
      table.destroy();
      positions.destroy();
      validity.destroy();
    }
  });
}
