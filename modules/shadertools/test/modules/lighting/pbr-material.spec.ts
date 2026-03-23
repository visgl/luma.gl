// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {makeShaderBlockLayout, ShaderBlockWriter, UniformStore} from '@luma.gl/core';
import {
  getShaderModuleUniformBlockFields,
  getShaderModuleUniformLayoutValidationResult,
  getShaderModuleUniforms,
  pbrMaterial,
  type PBRMaterialUniforms
} from '@luma.gl/shadertools';

const FLOAT32_EPSILON = 1e-6;

const EXPECTED_UNIFORM_BUFFER_LAYOUT = {
  unlit: {offset: 0, size: 1},
  baseColorMapEnabled: {offset: 1, size: 1},
  baseColorFactor: {offset: 4, size: 4},
  normalMapEnabled: {offset: 8, size: 1},
  normalScale: {offset: 9, size: 1},
  emissiveMapEnabled: {offset: 10, size: 1},
  emissiveFactor: {offset: 12, size: 3},
  metallicRoughnessValues: {offset: 16, size: 2},
  metallicRoughnessMapEnabled: {offset: 18, size: 1},
  occlusionMapEnabled: {offset: 19, size: 1},
  occlusionStrength: {offset: 20, size: 1},
  alphaCutoffEnabled: {offset: 21, size: 1},
  alphaCutoff: {offset: 22, size: 1},
  specularColorFactor: {offset: 24, size: 3},
  specularIntensityFactor: {offset: 27, size: 1},
  specularColorMapEnabled: {offset: 28, size: 1},
  specularIntensityMapEnabled: {offset: 29, size: 1},
  ior: {offset: 30, size: 1},
  transmissionFactor: {offset: 31, size: 1},
  transmissionMapEnabled: {offset: 32, size: 1},
  thicknessFactor: {offset: 33, size: 1},
  attenuationDistance: {offset: 34, size: 1},
  attenuationColor: {offset: 36, size: 3},
  clearcoatFactor: {offset: 39, size: 1},
  clearcoatRoughnessFactor: {offset: 40, size: 1},
  clearcoatMapEnabled: {offset: 41, size: 1},
  clearcoatRoughnessMapEnabled: {offset: 42, size: 1},
  sheenColorFactor: {offset: 44, size: 3},
  sheenRoughnessFactor: {offset: 47, size: 1},
  sheenColorMapEnabled: {offset: 48, size: 1},
  sheenRoughnessMapEnabled: {offset: 49, size: 1},
  iridescenceFactor: {offset: 50, size: 1},
  iridescenceIor: {offset: 51, size: 1},
  iridescenceThicknessRange: {offset: 52, size: 2},
  iridescenceMapEnabled: {offset: 54, size: 1},
  anisotropyStrength: {offset: 55, size: 1},
  anisotropyRotation: {offset: 56, size: 1},
  anisotropyDirection: {offset: 58, size: 2},
  anisotropyMapEnabled: {offset: 60, size: 1},
  emissiveStrength: {offset: 61, size: 1},
  IBLenabled: {offset: 62, size: 1},
  scaleIBLAmbient: {offset: 64, size: 2},
  scaleDiffBaseMR: {offset: 68, size: 4},
  scaleFGDSpec: {offset: 72, size: 4}
} as const;

const EXPECTED_UNIFORM_NAMES = Object.keys(EXPECTED_UNIFORM_BUFFER_LAYOUT);

const fullPBRUniforms: Required<PBRMaterialUniforms> = {
  ...pbrMaterial.defaultUniforms,
  unlit: true,
  baseColorMapEnabled: true,
  baseColorFactor: [0.2, 0.4, 0.6, 0.8],
  normalMapEnabled: true,
  normalScale: 0.35,
  emissiveMapEnabled: true,
  emissiveFactor: [0.1, 0.15, 0.2],
  metallicRoughnessValues: [0.7, 0.25],
  metallicRoughnessMapEnabled: true,
  occlusionMapEnabled: true,
  occlusionStrength: 0.65,
  alphaCutoffEnabled: true,
  alphaCutoff: 0.33,
  specularColorFactor: [0.9, 0.8, 0.7],
  specularIntensityFactor: 0.55,
  specularColorMapEnabled: true,
  specularIntensityMapEnabled: true,
  ior: 1.33,
  transmissionFactor: 0.42,
  transmissionMapEnabled: true,
  thicknessFactor: 0.11,
  attenuationDistance: 12.5,
  attenuationColor: [0.95, 0.85, 0.75],
  clearcoatFactor: 0.88,
  clearcoatRoughnessFactor: 0.12,
  clearcoatMapEnabled: true,
  clearcoatRoughnessMapEnabled: true,
  sheenColorFactor: [0.3, 0.25, 0.2],
  sheenRoughnessFactor: 0.44,
  sheenColorMapEnabled: true,
  sheenRoughnessMapEnabled: true,
  iridescenceFactor: 0.66,
  iridescenceIor: 1.18,
  iridescenceThicknessRange: [140, 380],
  iridescenceMapEnabled: true,
  anisotropyStrength: 0.5,
  anisotropyRotation: 1.25,
  anisotropyDirection: [0.6, -0.8],
  anisotropyMapEnabled: true,
  emissiveStrength: 4.2,
  IBLenabled: true,
  scaleIBLAmbient: [1.25, 0.75],
  scaleDiffBaseMR: [1, 0.5, 0.25, 0.125],
  scaleFGDSpec: [0.9, 0.6, 0.3, 0.1]
};

function almostEqual(actualValue: number, expectedValue: number): boolean {
  return Math.abs(actualValue - expectedValue) <= FLOAT32_EPSILON;
}

test('shadertools#pbrMaterial exposes typed defaults and uniform names', testCase => {
  const pbrMaterialUniformTypecheck: Required<PBRMaterialUniforms> = pbrMaterial.defaultUniforms;
  testCase.ok(pbrMaterialUniformTypecheck, 'pbrMaterial default uniforms are typed');

  // @ts-expect-error Fix typing
  const uniforms = getShaderModuleUniforms(pbrMaterial, {}, {});
  testCase.ok(uniforms, 'default PBR material uniforms resolve');
  testCase.deepEqual(
    Object.keys(pbrMaterial.uniformTypes),
    EXPECTED_UNIFORM_NAMES,
    'uniform type field order is stable'
  );

  testCase.end();
});

test('shadertools#pbrMaterial shader uniform blocks match uniformTypes order', testCase => {
  const fragmentValidationResult = getShaderModuleUniformLayoutValidationResult(
    pbrMaterial,
    'fragment'
  );
  const wgslValidationResult = getShaderModuleUniformLayoutValidationResult(pbrMaterial, 'wgsl');

  testCase.ok(fragmentValidationResult?.matches, 'fragment validation result matches');
  testCase.ok(wgslValidationResult?.matches, 'WGSL validation result matches');
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(pbrMaterial, 'fragment'),
    EXPECTED_UNIFORM_NAMES,
    'GLSL uniform block order matches uniformTypes'
  );
  testCase.deepEqual(
    getShaderModuleUniformBlockFields(pbrMaterial, 'wgsl'),
    EXPECTED_UNIFORM_NAMES,
    'WGSL uniform struct order matches uniformTypes'
  );

  testCase.end();
});

test('shadertools#pbrMaterial uniform buffer layout matches expected std140 packing', testCase => {
  const shaderBlockLayout = makeShaderBlockLayout(pbrMaterial.uniformTypes);

  testCase.equal(
    shaderBlockLayout.byteLength,
    304,
    'uniform buffer layout reports the exact packed size'
  );
  testCase.deepEqual(
    Object.keys(shaderBlockLayout.fields),
    EXPECTED_UNIFORM_NAMES,
    'uniform buffer layout key order matches uniform definitions'
  );

  for (const [uniformName, expectedLayout] of Object.entries(EXPECTED_UNIFORM_BUFFER_LAYOUT)) {
    const actualLayout = shaderBlockLayout.fields[uniformName];
    testCase.ok(actualLayout, `${uniformName} is present in the layout`);
    testCase.equal(actualLayout?.offset, expectedLayout.offset, `${uniformName} offset`);
    testCase.equal(actualLayout?.size, expectedLayout.size, `${uniformName} size`);
  }

  testCase.end();
});

test('shadertools#pbrMaterial uniform store reports minimum allocation size separately', testCase => {
  const uniformStore = new UniformStore<{material: PBRMaterialUniforms}>({type: 'webgl'} as any, {
    material: {
      uniformTypes: pbrMaterial.uniformTypes,
      defaultUniforms: pbrMaterial.defaultUniforms
    }
  });

  testCase.equal(
    uniformStore.getUniformBufferByteLength('material'),
    1024,
    'uniform store keeps the minimum allocation size'
  );
  testCase.equal(
    uniformStore.getUniformBufferData('material').byteLength,
    304,
    'uniform store serializes only the packed block data'
  );

  testCase.end();
});

test('shadertools#pbrMaterial serializes a full PBR sample into the expected buffer slots', testCase => {
  const shaderBlockLayout = makeShaderBlockLayout(pbrMaterial.uniformTypes);
  const shaderBlockWriter = new ShaderBlockWriter(shaderBlockLayout);
  const uniformBufferData = shaderBlockWriter.getData(fullPBRUniforms);
  const float32View = new Float32Array(uniformBufferData.buffer);
  const int32View = new Int32Array(uniformBufferData.buffer);

  const expectedIntegerValues = {
    unlit: 1,
    baseColorMapEnabled: 1,
    normalMapEnabled: 1,
    emissiveMapEnabled: 1,
    metallicRoughnessMapEnabled: 1,
    occlusionMapEnabled: 1,
    alphaCutoffEnabled: 1,
    specularColorMapEnabled: 1,
    specularIntensityMapEnabled: 1,
    transmissionMapEnabled: 1,
    clearcoatMapEnabled: 1,
    clearcoatRoughnessMapEnabled: 1,
    sheenColorMapEnabled: 1,
    sheenRoughnessMapEnabled: 1,
    iridescenceMapEnabled: 1,
    anisotropyMapEnabled: 1,
    IBLenabled: 1
  } as const;

  for (const [uniformName, expectedValue] of Object.entries(expectedIntegerValues)) {
    const uniformOffset = shaderBlockLayout.fields[uniformName].offset;
    testCase.equal(int32View[uniformOffset], expectedValue, `${uniformName} encoded as i32`);
  }

  const expectedScalarValues = {
    normalScale: 0.35,
    occlusionStrength: 0.65,
    alphaCutoff: 0.33,
    specularIntensityFactor: 0.55,
    ior: 1.33,
    transmissionFactor: 0.42,
    thicknessFactor: 0.11,
    attenuationDistance: 12.5,
    clearcoatFactor: 0.88,
    clearcoatRoughnessFactor: 0.12,
    sheenRoughnessFactor: 0.44,
    iridescenceFactor: 0.66,
    iridescenceIor: 1.18,
    anisotropyStrength: 0.5,
    anisotropyRotation: 1.25,
    emissiveStrength: 4.2
  } as const;

  for (const [uniformName, expectedValue] of Object.entries(expectedScalarValues)) {
    const uniformOffset = shaderBlockLayout.fields[uniformName].offset;
    testCase.ok(
      almostEqual(float32View[uniformOffset], expectedValue),
      `${uniformName} encoded as f32`
    );
  }

  const expectedVectorValues = {
    baseColorFactor: [0.2, 0.4, 0.6, 0.8],
    emissiveFactor: [0.1, 0.15, 0.2],
    metallicRoughnessValues: [0.7, 0.25],
    specularColorFactor: [0.9, 0.8, 0.7],
    attenuationColor: [0.95, 0.85, 0.75],
    sheenColorFactor: [0.3, 0.25, 0.2],
    iridescenceThicknessRange: [140, 380],
    anisotropyDirection: [0.6, -0.8],
    scaleIBLAmbient: [1.25, 0.75],
    scaleDiffBaseMR: [1, 0.5, 0.25, 0.125],
    scaleFGDSpec: [0.9, 0.6, 0.3, 0.1]
  } as const;

  for (const [uniformName, expectedValues] of Object.entries(expectedVectorValues)) {
    const uniformOffset = shaderBlockLayout.fields[uniformName].offset;

    for (let valueIndex = 0; valueIndex < expectedValues.length; valueIndex++) {
      testCase.ok(
        almostEqual(float32View[uniformOffset + valueIndex], expectedValues[valueIndex]),
        `${uniformName}[${valueIndex}] encoded as f32`
      );
    }
  }

  const expectedPaddingSlots = {
    baseColorFactor: [],
    emissiveFactor: [15],
    specularColorFactor: [],
    attenuationColor: [],
    sheenColorFactor: [],
    anisotropyRotation: [57],
    IBLenabled: [63]
  } as const;

  for (const [uniformName, paddingSlots] of Object.entries(expectedPaddingSlots)) {
    for (const paddingSlot of paddingSlots) {
      testCase.equal(float32View[paddingSlot], 0, `${uniformName} padding remains zeroed`);
    }
  }

  testCase.end();
});

test('shadertools#pbrMaterial uniform store preserves prior and default values across partial updates', testCase => {
  const shaderBlockLayout = makeShaderBlockLayout(pbrMaterial.uniformTypes);
  const uniformStore = new UniformStore<{material: PBRMaterialUniforms}>({type: 'webgl'} as any, {
    material: {
      uniformTypes: pbrMaterial.uniformTypes,
      defaultUniforms: pbrMaterial.defaultUniforms
    }
  });

  uniformStore.setUniforms({
    material: {
      baseColorFactor: [0.25, 0.5, 0.75, 1],
      clearcoatFactor: 0.8,
      emissiveStrength: 2.5
    }
  });

  uniformStore.setUniforms({
    material: {
      metallicRoughnessValues: [0.4, 0.6],
      IBLenabled: true,
      scaleIBLAmbient: [0.5, 1.5]
    }
  });

  const uniformBufferData = uniformStore.getUniformBufferData('material');
  const float32View = new Float32Array(uniformBufferData.buffer);
  const int32View = new Int32Array(uniformBufferData.buffer);

  const baseColorFactorOffset = shaderBlockLayout.fields.baseColorFactor.offset;
  const metallicRoughnessValuesOffset = shaderBlockLayout.fields.metallicRoughnessValues.offset;
  const clearcoatFactorOffset = shaderBlockLayout.fields.clearcoatFactor.offset;
  const emissiveStrengthOffset = shaderBlockLayout.fields.emissiveStrength.offset;
  const iorOffset = shaderBlockLayout.fields.ior.offset;
  const IBLenabledOffset = shaderBlockLayout.fields.IBLenabled.offset;
  const scaleIBLAmbientOffset = shaderBlockLayout.fields.scaleIBLAmbient.offset;
  const scaleDiffBaseMROffset = shaderBlockLayout.fields.scaleDiffBaseMR.offset;

  testCase.ok(almostEqual(float32View[baseColorFactorOffset], 0.25), 'baseColorFactor update kept');
  testCase.ok(
    almostEqual(float32View[baseColorFactorOffset + 2], 0.75),
    'baseColorFactor vector update kept'
  );
  testCase.ok(
    almostEqual(float32View[metallicRoughnessValuesOffset], 0.4),
    'metallicRoughnessValues first component updated'
  );
  testCase.ok(
    almostEqual(float32View[metallicRoughnessValuesOffset + 1], 0.6),
    'metallicRoughnessValues second component updated'
  );
  testCase.ok(almostEqual(float32View[clearcoatFactorOffset], 0.8), 'clearcoatFactor kept');
  testCase.ok(almostEqual(float32View[emissiveStrengthOffset], 2.5), 'emissiveStrength kept');
  testCase.ok(
    almostEqual(float32View[iorOffset], pbrMaterial.defaultUniforms.ior),
    'default ior preserved'
  );
  testCase.equal(int32View[IBLenabledOffset], 1, 'IBL enabled flag updated');
  testCase.ok(almostEqual(float32View[scaleIBLAmbientOffset], 0.5), 'scaleIBLAmbient x updated');
  testCase.ok(
    almostEqual(float32View[scaleIBLAmbientOffset + 1], 1.5),
    'scaleIBLAmbient y updated'
  );
  testCase.equal(
    float32View[scaleDiffBaseMROffset],
    0,
    'default debug uniforms remain untouched when not updated'
  );

  testCase.end();
});
