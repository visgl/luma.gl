// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {BufferTransform} from '@luma.gl/engine';
import {picking, getShaderModuleUniforms} from '@luma.gl/shadertools';

const TEST_DATA = {
  vertexColorData: new Float32Array([
    0,
    0,
    0,
    255,
    100,
    150,
    50,
    50,
    50,
    251,
    103,
    153, // is picked only when threshold is 5
    150,
    100,
    255,
    254.5,
    100,
    150, // is picked with default threshold (1)
    100,
    150,
    255,
    255,
    255,
    255,
    255,
    100,
    149.5 // // is picked with default threshold (1)
  ])
};

const TEST_CASES = [
  {
    highlightedObjectColor: null,
    isPicked: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    highlightedObjectColor: [255, 255, 255] as [number, number, number],
    isPicked: [0, 0, 0, 0, 0, 0, 0, 1, 0]
  },
  {
    highlightedObjectColor: [255, 100, 150] as [number, number, number],
    isPicked: [0, 1, 0, 0, 0, 0, 0, 0, 0]
  }
];

test('picking#getUniforms', async t => {
  t.deepEqual(getShaderModuleUniforms(picking, {}, {}), {}, 'Empty input');

  t.deepEqual(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: undefined,
      highlightColor: [255, 0, 0]
    }),
    {
      isActive: true,
      isAttribute: false,
      highlightColor: [1, 0, 0, 1]
    },
    'Undefined input (no change to highlighted object)'
  );

  t.deepEqual(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: null,
      highlightColor: [255, 0, 0]
    }),
    {
      isActive: true,
      isAttribute: false,
      isHighlightActive: false,
      highlightColor: [1, 0, 0, 1]
    },
    'Null input (clear highlighted object)'
  );

  t.deepEqual(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51]
    }),
    {
      isHighlightActive: true,
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [0.4, 0, 0, 0.2]
    },
    'Picked input (set highlighted object)'
  );

  t.deepEqual(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51],
      useFloatColors: false
    }),
    {
      useFloatColors: false,
      isHighlightActive: true,
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [0.4, 0, 0, 0.2]
    },
    'Override useFloatColors'
  );

  t.end();
});

test('picking#highlightedObjectColor', async t => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const vertexColorData = TEST_DATA.vertexColorData;
  const vertexCount = vertexColorData.length / 3;
  const transform = createPickingAlphaTransform(device, vertexColorData, vertexCount);

  await Promise.all(
    TEST_CASES.map(async testCase => {
      transform.model.shaderInputs.setProps({
        picking: {
          highlightedObjectColor: testCase.highlightedObjectColor
        }
      });
      transform.run();

      const outData = await readTransformOutput(transform, 'isPicked', vertexCount);
      t.deepEqual(Array.from(outData), testCase.isPicked, 'Vertex should correctly get picked');
    })
  );

  transform.destroy();
  t.end();
});

test('picking#picking_setPickingColor', async t => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }
  const vertexColorData = TEST_DATA.vertexColorData;
  const vertexCount = vertexColorData.length / 3;
  const transform = createPickingAlphaTransform(device, vertexColorData, vertexCount);

  transform.model.shaderInputs.setProps({
    picking: {
      isActive: true
    }
  });
  transform.run();

  const outData = await readTransformOutput(transform, 'isPicked', vertexCount);
  t.deepEqual(
    Array.from(outData),
    [0, 1, 1, 1, 1, 1, 1, 1, 1],
    'Zero picking color is marked invalid and all non-zero colors are pickable'
  );

  transform.destroy();

  t.end();
});

function createPickingAlphaTransform(
  device,
  vertexColorData: Float32Array,
  vertexCount: number
): BufferTransform {
  const vertexColor = device.createBuffer({data: vertexColorData});
  const isPicked = device.createBuffer({byteLength: vertexCount * Float32Array.BYTES_PER_ELEMENT});

  return new BufferTransform(device, {
    vs: `\
    #version 300 es
    in vec3 vertexColor;
    out float isPicked;

    void main() {
      picking_setPickingColor(vertexColor);
      isPicked = picking_vRGBcolor_Avalid.a;
    }
    `,
    bufferLayout: [{name: 'vertexColor', format: 'float32x3'}],
    outputs: ['isPicked'],
    modules: [picking],
    vertexCount,
    attributes: {vertexColor},
    feedbackBuffers: {isPicked}
  });
}

async function readTransformOutput(
  transform: BufferTransform,
  varyingName: string,
  vertexCount: number
): Promise<Float32Array> {
  const bytes = await transform.readAsync(varyingName);
  return new Float32Array(bytes.buffer, bytes.byteOffset, vertexCount);
}
