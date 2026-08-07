// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {makeGPUSplatData, SplatRenderer, type SplatSource} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('SplatRenderer composites opaque meshes, sorted splats, and transparent mesh overlays', t => {
  const device = new NullDevice({});
  const prepared = makeGPUSplatData(device, makeMixedSplatSource());
  const renderer = new SplatRenderer(device, {data: prepared, viewportSize: [64, 64]});
  const renderPass = device.getDefaultRenderPass();
  const drawOrder: string[] = [];
  const model = renderer.model;
  if (!model) {
    t.fail('creates a Gaussian splat render model');
    renderer.destroy();
    prepared.destroy();
    t.end();
    return;
  }

  const drawSplats = model.draw.bind(model);
  model.draw = pass => {
    t.equal(pass, renderPass, 'records splats into the shared mesh render pass');
    drawOrder.push('splats');
    return drawSplats(pass);
  };
  t.ok(
    renderer.drawMixed(renderPass, {
      opaqueMeshes: [
        {
          draw(pass) {
            t.equal(pass, renderPass, 'records the opaque mesh into the same depth attachment');
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
    }),
    'draws an integrated mesh and Gaussian splat scene'
  );
  t.deepEqual(drawOrder, ['opaque', 'splats', 'transparent'], 'preserves scene compositing order');
  t.equal(model.parameters.depthCompare, 'less-equal', 'tests splats against opaque mesh depth');
  t.equal(model.parameters.depthWriteEnabled, false, 'preserves opaque depth beneath transparency');

  renderer.setProps({depthCompare: 'greater-equal', depthWriteEnabled: true});
  t.equal(model.parameters.depthCompare, 'greater-equal', 'supports reversed-depth mesh scenes');
  t.equal(model.parameters.depthWriteEnabled, true, 'supports explicitly requested depth writes');

  renderer.destroy();
  prepared.destroy();
  t.end();
});

test('SplatRenderer enforces semantic filtering on WebGL without changing source opacity', async t => {
  const device = new NullDevice({});
  const source = makeMixedSplatSource();
  const prepared = makeGPUSplatData(device, source);
  const renderer = new SplatRenderer(device, {
    data: prepared,
    semanticFilter: {include: [7]},
    viewportSize: [64, 64]
  });

  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [2, 0],
    'filters before stable depth sorting'
  );
  const opacityBuffer = renderer.getBatchOpacityBuffer(0);
  const bytes = await opacityBuffer.readAsync();
  t.deepEqual(
    Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)),
    [1, 0, 1],
    'masks rejected WebGL rows in a renderer-owned opacity allocation'
  );
  t.deepEqual(Array.from(source.opacities), [1, 1, 1], 'preserves caller-owned source opacity');

  renderer.draw(device.getDefaultRenderPass());
  t.equal(
    renderer.model?.vertexArray.attributes[4],
    opacityBuffer,
    'binds semantic masking to the fallback instanced shader'
  );
  renderer.setProps({semanticFilter: undefined});
  t.equal(renderer.stats.visibleSplatCount, 3, 'restores every source row when the filter clears');
  t.equal(
    renderer.getBatchOpacityBuffer(0),
    prepared.opacities.data[0].buffer,
    'restores caller-owned opacity when semantic masking is disabled'
  );

  renderer.destroy();
  t.ok(opacityBuffer.destroyed, 'releases only the renderer-owned semantic opacity mask');
  t.notOk(prepared.opacities.data[0].buffer.destroyed, 'preserves caller-owned opacity');
  prepared.destroy();
  t.end();
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
