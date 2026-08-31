// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import {BufferTransform} from '@luma.gl/engine';
import {
  assembleGLSLShaderPair,
  type PlatformInfo,
  picking,
  getShaderModuleUniforms
} from '@luma.gl/shadertools';

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

const GLSL_PLATFORM_INFO: PlatformInfo = {
  type: 'webgl',
  gpu: 'test-gpu',
  shaderLanguage: 'glsl',
  shaderLanguageVersion: 300,
  features: new Set()
};

it('picking#defaultUniforms', () => {
  expect(picking.defaultUniforms, 'Legacy default uniforms remain stable').toEqual({
    isActive: false,
    isAttribute: false,
    isHighlightActive: false,
    useByteColors: true,
    highlightedObjectColor: [0, 0, 0],
    highlightColor: [0, 1, 1, 1]
  });

  void 0;
});

it('picking#getUniforms', async () => {
  expect(getShaderModuleUniforms(picking, {}, {}), 'Empty input').toEqual({});

  expect(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: undefined,
      highlightColor: [255, 0, 0]
    }),
    'Undefined input (no change to highlighted object)'
  ).toEqual({
    isActive: true,
    isAttribute: false,
    highlightColor: [1, 0, 0, 1]
  });

  expect(
    picking.getUniforms({
      isActive: true,
      highlightedObjectColor: null,
      highlightColor: [255, 0, 0]
    }),
    'Null input (clear highlighted object)'
  ).toEqual({
    isActive: true,
    isAttribute: false,
    isHighlightActive: false,
    highlightColor: [1, 0, 0, 1]
  });

  expect(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51]
    }),
    'Picked input (set highlighted object)'
  ).toEqual({
    isHighlightActive: true,
    highlightedObjectColor: [0, 0, 1],
    highlightColor: [0.4, 0, 0, 0.2]
  });

  expect(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [102, 0, 0, 51],
      useByteColors: true
    }),
    'Byte highlight colors normalize when useByteColors is true'
  ).toEqual({
    useByteColors: true,
    isHighlightActive: true,
    highlightedObjectColor: [0, 0, 1],
    highlightColor: [0.4, 0, 0, 0.2]
  });

  expect(
    picking.getUniforms({
      highlightedObjectColor: [0, 0, 1],
      highlightColor: [1, 0, 0, 0.5],
      useByteColors: false
    }),
    'useByteColors=false preserves float highlight colors'
  ).toEqual({
    useByteColors: false,
    isHighlightActive: true,
    highlightedObjectColor: [0, 0, 1],
    highlightColor: [1, 0, 0, 0.5]
  });

  expect(
    picking.getUniforms({
      isActive: false,
      isAttribute: true,
      useByteColors: false
    }),
    'Legacy activity, attribute, and byte-color props remain unchanged'
  ).toEqual({
    isActive: false,
    isAttribute: true,
    useByteColors: false
  });

  void 0;
});

it('picking#highlightedObjectColor', async () => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    void 0;
    void 0;
    return;
  }

  const vertexColorData = TEST_DATA.vertexColorData;
  const vertexCount = vertexColorData.length / 3;
  const transform = createPickingAlphaTransform(device, vertexColorData, vertexCount);

  for (const testCase of TEST_CASES) {
    transform.model.shaderInputs.setProps({
      picking: {
        highlightedObjectColor: testCase.highlightedObjectColor
      }
    });
    transform.run();

    const outData = await readTransformOutput(transform, 'isPicked', vertexCount);
    expect(Array.from(outData), 'Vertex should correctly get picked').toEqual(testCase.isPicked);
  }

  transform.destroy();
  void 0;
});

it('picking#picking_setPickingColor', async () => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    void 0;
    void 0;
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
  expect(
    Array.from(outData),
    'Zero picking color is marked invalid and all non-zero colors are pickable'
  ).toEqual([0, 1, 1, 1, 1, 1, 1, 1, 1]);

  transform.destroy();

  void 0;
});

it('picking#useByteColors', async () => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    void 0;
    void 0;
    return;
  }

  const vertexColorData = new Float32Array([255, 128, 64, 0.25, 0.5, 0.75]);
  const vertexCount = vertexColorData.length / 3;

  const normalizedTransform = createPickingPayloadTransform(
    device,
    vertexColorData,
    vertexCount,
    'picking_setPickingColor(vertexColor);'
  );
  normalizedTransform.model.shaderInputs.setProps({
    picking: {
      isActive: true,
      useByteColors: true
    }
  });
  normalizedTransform.run();

  const normalizedData = await readTransformOutput(normalizedTransform, 'payload', vertexCount * 3);
  expect(
    Array.from(normalizedData).map(value => Number(value.toFixed(6))),
    'Legacy module normalizes byte colors when useByteColors is true'
  ).toEqual([1, 0.501961, 0.25098, 0.00098, 0.001961, 0.002941]);
  normalizedTransform.destroy();

  const floatColorTransform = createPickingPayloadTransform(
    device,
    vertexColorData,
    vertexCount,
    'picking_setPickingColor(vertexColor);'
  );
  floatColorTransform.model.shaderInputs.setProps({
    picking: {
      isActive: true,
      useByteColors: false
    }
  });
  floatColorTransform.run();

  const floatColorData = await readTransformOutput(floatColorTransform, 'payload', vertexCount * 3);
  expect(
    Array.from(floatColorData).map(value => Number(value.toFixed(6))),
    'Legacy module preserves float colors when useByteColors is false'
  ).toEqual([255, 128, 64, 0.25, 0.5, 0.75]);
  floatColorTransform.destroy();

  void 0;
});

it('picking#picking_setPickingAttribute', async () => {
  const device = await getWebGLTestDevice();

  if (!BufferTransform.isSupported(device)) {
    void 0;
    void 0;
    return;
  }

  const attributeData = new Float32Array([1, 2, 3, 4, 5, 6]);
  const vertexCount = attributeData.length / 3;
  const transform = createPickingPayloadTransform(
    device,
    attributeData,
    vertexCount,
    'picking_setPickingAttribute(vertexColor);'
  );

  transform.model.shaderInputs.setProps({
    picking: {
      isActive: true,
      isAttribute: true
    }
  });
  transform.run();

  const outData = await readTransformOutput(transform, 'payload', vertexCount * 3);
  expect(Array.from(outData), 'Legacy attribute picking payload remains unchanged').toEqual([
    1, 2, 3, 4, 5, 6
  ]);

  transform.destroy();
  void 0;
});

it('picking#assembledGLSLContract', () => {
  const assembledShader = assembleGLSLShaderPair({
    platformInfo: GLSL_PLATFORM_INFO,
    vs: `\
#version 300 es
in vec4 positions;
void main(void) {
  gl_Position = positions;
}
`,
    fs: `\
#version 300 es
precision highp float;
out vec4 fragmentColor;
void main(void) {
  fragmentColor = vec4(1.0);
}
`,
    modules: [picking]
  });

  expect(
    Boolean(assembledShader.vs.includes('void picking_setPickingColor(vec3 pickingColor)')),
    'Legacy picking_setPickingColor remains present in assembled vertex GLSL'
  ).toBe(true);
  expect(
    Boolean(assembledShader.vs.includes('void picking_setPickingAttribute(vec3 value)')),
    'Legacy picking_setPickingAttribute remains present in assembled vertex GLSL'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 picking_filterHighlightColor(vec4 color)')),
    'Legacy picking_filterHighlightColor remains present in assembled fragment GLSL'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 picking_filterPickingColor(vec4 color)')),
    'Legacy picking_filterPickingColor remains present in assembled fragment GLSL'
  ).toBe(true);
  expect(
    Boolean(assembledShader.fs.includes('vec4 picking_filterColor(vec4 color)')),
    'Legacy picking_filterColor remains present in assembled fragment GLSL'
  ).toBe(true);
  expect(
    assembledShader.vs.includes('batchIndex') || assembledShader.fs.includes('batchIndex'),
    'Engine batch-index payload identifiers are not injected into the legacy module'
  ).toBe(false);
  expect(
    assembledShader.vs.includes('highlightedBatchIndex') ||
      assembledShader.fs.includes('highlightedBatchIndex'),
    'Engine highlight batch identifiers are not injected into the legacy module'
  ).toBe(false);
  expect(
    assembledShader.vs.includes('ivec4(') || assembledShader.fs.includes('ivec4('),
    'Legacy GLSL module does not emit integer render-target payloads'
  ).toBe(false);

  void 0;
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

function createPickingPayloadTransform(
  device,
  vertexColorData: Float32Array,
  vertexCount: number,
  pickingSetup: string
): BufferTransform {
  const vertexColor = device.createBuffer({data: vertexColorData});
  const payload = device.createBuffer({
    byteLength: vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT
  });

  return new BufferTransform(device, {
    vs: `\
    #version 300 es
    in vec3 vertexColor;
    out vec3 payload;

    void main() {
      ${pickingSetup}
      payload = picking_vRGBcolor_Avalid.rgb;
    }
    `,
    bufferLayout: [{name: 'vertexColor', format: 'float32x3'}],
    outputs: ['payload'],
    modules: [picking],
    vertexCount,
    attributes: {vertexColor},
    feedbackBuffers: {payload}
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
