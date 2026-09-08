// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {makeGPUSplatData, SplatRenderer, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('SplatRenderer composites opaque meshes, sorted splats, and transparent mesh overlays', () => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeMixedSplatSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [64, 64]});
  const renderPass = device.getDefaultRenderPass();
  const drawOrder: string[] = [];
  const model = renderer.model;
  if (!model) {
    expect(false, 'creates a Gaussian splat render model').toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
    return;
  }

  const drawSplats = model.draw.bind(model);
  model.draw = pass => {
    expect(pass, 'records splats into the shared mesh render pass').toBe(renderPass);
    drawOrder.push('splats');
    return drawSplats(pass);
  };
  expect(
    Boolean(
      renderer.drawMixed(renderPass, {
        opaqueMeshes: [
          {
            draw(pass) {
              expect(pass, 'records the opaque mesh into the same depth attachment').toBe(
                renderPass
              );
              drawOrder.push('opaque');
              return true;
            }
          }
        ],
        transparentMeshes: [
          {
            draw() {
              drawOrder.push('transparent');
            }
          }
        ]
      })
    ),
    'draws an integrated mesh and Gaussian splat scene'
  ).toBe(true);
  expect(drawOrder, 'preserves scene compositing order').toEqual([
    'opaque',
    'splats',
    'transparent'
  ]);
  expect(model.parameters.depthCompare, 'tests splats against opaque mesh depth').toBe(
    'less-equal'
  );
  expect(model.parameters.depthWriteEnabled, 'preserves opaque depth beneath transparency').toBe(
    false
  );

  renderer.setProps({depthCompare: 'greater-equal', depthWriteEnabled: true});
  expect(model.parameters.depthCompare, 'supports reversed-depth mesh scenes').toBe(
    'greater-equal'
  );
  expect(model.parameters.depthWriteEnabled, 'supports explicitly requested depth writes').toBe(
    true
  );

  renderer.destroy();
  prepared.destroy();
  void 0;
});

it('SplatRenderer enforces semantic filtering on WebGL without changing source opacity', async () => {
  const device = new NullDevice({});
  const source = makeMixedSplatSource();
  source.opacities.set([0.25, 0.5, 0.75]);
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    semanticFilter: {include: [7]},
    viewportSize: [64, 64]
  });

  expect(Array.from(renderer.getSortedIndices()), 'filters before stable depth sorting').toEqual([
    2, 0
  ]);
  const opacityBuffer = renderer.getBatchOpacityBuffer(0);
  const bytes = await opacityBuffer.readAsync();
  expect(
    Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)),
    'masks rejected WebGL rows in a renderer-owned opacity allocation'
  ).toEqual([0.25, 0, 0.75]);
  expect(Array.from(source.opacities), 'preserves caller-owned source opacity').toEqual([
    0.25, 0.5, 0.75
  ]);

  renderer.draw(device.getDefaultRenderPass());
  const sortedOpacityBuffer = renderer.model?.vertexArray.attributes[4];
  if (!(sortedOpacityBuffer instanceof Buffer)) {
    expect(
      false,
      'binds renderer-owned, semantically filtered opacity in sorted source-row order'
    ).toBe(true);
    renderer.destroy();
    prepared.destroy();
    void 0;
    return;
  }
  expect(
    sortedOpacityBuffer,
    'keeps batch-order semantic masks separate from sorted instanced attributes'
  ).not.toBe(opacityBuffer);
  expect(sortedOpacityBuffer, 'binds the run-owned reordered opacity allocation').toBe(
    renderer.getDrawRuns()[0]?.attributeBuffers?.opacities
  );
  const sortedOpacityBytes = await sortedOpacityBuffer.readAsync();
  expect(
    Array.from(
      new Float32Array(
        sortedOpacityBytes.buffer,
        sortedOpacityBytes.byteOffset,
        sortedOpacityBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
      )
    ),
    'preserves the accepted source opacities in exact back-to-front draw order'
  ).toEqual([0.75, 0.25]);
  expect(
    Array.from(source.opacities),
    'does not reorder or mask caller-owned source opacity'
  ).toEqual([0.25, 0.5, 0.75]);
  renderer.setProps({semanticFilter: undefined});
  expect(renderer.stats.visibleSplatCount, 'restores every source row when the filter clears').toBe(
    3
  );
  expect(
    renderer.getBatchOpacityBuffer(0),
    'restores caller-owned opacity when semantic masking is disabled'
  ).toBe(prepared.opacities.data[0].buffer);

  renderer.setProps({sortMode: 'none', semanticFilter: {include: [7, 9]}});
  renderer.draw(device.getDefaultRenderPass());
  expect(
    renderer.model?.vertexArray.attributes[4],
    'binds the original semantic mask directly when all source rows retain their original order'
  ).toBe(renderer.getBatchOpacityBuffer(0));

  renderer.destroy();
  expect(
    Boolean(opacityBuffer.destroyed),
    'releases only the renderer-owned semantic opacity mask'
  ).toBe(true);
  expect(
    Boolean(sortedOpacityBuffer.destroyed),
    'releases the renderer-owned sorted opacity allocation'
  ).toBe(true);
  expect(
    Boolean(prepared.opacities.data[0].buffer.destroyed),
    'preserves caller-owned opacity'
  ).toBe(false);
  prepared.destroy();
  void 0;
});

function makeMixedSplatSource(): SplatSource {
  return {
    positions: new Float32Array([0, 0, 0.2, 0, 0, 0.5, 0, 0, 0.8]),
    scales: new Float32Array([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]),
    colors: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255]),
    opacities: new Float32Array([1, 1, 1]),
    semanticIds: new Uint32Array([7, 9, 7])
  };
}
