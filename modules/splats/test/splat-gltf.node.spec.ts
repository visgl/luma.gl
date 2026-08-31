// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  isGLTFSplatPrimitive,
  loadGPUSplatDataFromGLTF,
  makeGPUSplatDataFromGLTF,
  makeSplatSourceFromGLTF,
  type GLTFSplatPrimitive
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('glTF Gaussian primitives preserve source identities and convert Khronos attributes', () => {
  const device = new NullDevice({});
  const primitive = makeGLTFSplatPrimitive();
  const source = makeSplatSourceFromGLTF(primitive, {sourceBatchIndex: 7, rowIndexBase: 42});
  const prepared = makeGPUSplatDataFromGLTF(device, primitive, {
    sourceBatchIndex: 7,
    rowIndexBase: 42
  });

  expect(
    Boolean(isGLTFSplatPrimitive(primitive)),
    'recognizes the declared Khronos primitive extension'
  ).toBe(true);
  expect(source.positions, 'borrows decoded Float32 positions').toBe(
    primitive.attributes['POSITION']
  );
  expect(source.scales, 'borrows decoded linear Float32 scales').toBe(
    primitive.attributes['KHR_gaussian_splatting:SCALE']
  );
  expect(
    Array.from(source.rotations),
    'converts glTF XYZW quaternions to renderer WXYZ order'
  ).toEqual([1, 0, 0, 0, 0.5, 0.5, 0.5, 0.5]);
  expect(
    Boolean(Math.abs(source.colors[0] - 0.7820947917738781) < 1e-6),
    'reconstructs SH DC radiance'
  ).toBe(true);
  expect(source.colors[3], 'keeps opacity separate from the diffuse color alpha').toBe(1);
  expect(Array.from(source.opacities), 'retains linear source opacity').toEqual([0.25, 0.75]);
  expect(Array.from(source.semanticIds!), 'preserves 3D Tiles feature identifiers').toEqual([3, 9]);
  expect(prepared.sourceInfo.sourceBatchIndex, 'retains the source tile batch identity').toBe(7);
  expect(prepared.sourceInfo.sourceRowIndexOffset, 'retains stable global source rows').toBe(42);
  expect(prepared.semanticIds?.format, 'uploads feature metadata as semantic IDs').toBe('uint32');

  prepared.destroy();
  void 0;
});

it('glTF Gaussian primitives normalize integer accessors and decode sRGB display colors', () => {
  const primitive = makeGLTFSplatPrimitive('srgb_rec709_display');
  const normalizedPrimitive: GLTFSplatPrimitive = {
    ...primitive,
    attributes: {
      ...primitive.attributes,
      'KHR_gaussian_splatting:ROTATION': {
        value: new Int8Array([0, 0, 0, 127, -128, 0, 0, 0]),
        size: 4,
        count: 2,
        normalized: true
      },
      'KHR_gaussian_splatting:OPACITY': {
        value: new Uint8Array([0, 255]),
        normalized: true
      }
    }
  };
  const source = makeSplatSourceFromGLTF(normalizedPrimitive);

  expect(
    Array.from(source.rotations),
    'normalizes signed glTF accessor components and clamps the negative endpoint'
  ).toEqual([1, 0, 0, 0, 0, -1, 0, 0]);
  expect(Array.from(source.opacities), 'normalizes unsigned opacity accessors').toEqual([0, 1]);
  expect(
    Boolean(source.colors[0] < 0.7820947917738781),
    'converts sRGB display radiance to linear RGB'
  ).toBe(true);
  void 0;
});

it('glTF Gaussian primitives retain complete ordered SH bands and selected feature metadata', () => {
  const primitive = makeGLTFSplatPrimitive();
  const attributes: GLTFSplatPrimitive['attributes'] = {
    ...primitive.attributes,
    _FEATURE_ID_2: new Uint16Array([17, 19]),
    ...Object.fromEntries(
      Array.from({length: 3}, (_, coefficientIndex) => [
        `KHR_gaussian_splatting:SH_DEGREE_1_COEF_${coefficientIndex}`,
        new Float32Array([
          coefficientIndex + 0.1,
          coefficientIndex + 0.2,
          coefficientIndex + 0.3,
          coefficientIndex + 10.1,
          coefficientIndex + 10.2,
          coefficientIndex + 10.3
        ])
      ])
    ),
    ...Object.fromEntries(
      Array.from({length: 5}, (_, coefficientIndex) => [
        `KHR_gaussian_splatting:SH_DEGREE_2_COEF_${coefficientIndex}`,
        new Float32Array(6).fill(coefficientIndex + 20)
      ])
    )
  };
  const firstDegreeSource = makeSplatSourceFromGLTF(
    {...primitive, attributes},
    {maxSphericalHarmonicsDegree: 1, featureIdAttribute: '_FEATURE_ID_2'}
  );
  const secondDegreeSource = makeSplatSourceFromGLTF({...primitive, attributes});

  expect(firstDegreeSource.sphericalHarmonicsDegree, 'caps fully authored higher-order bands').toBe(
    1
  );
  expect(
    firstDegreeSource.sphericalHarmonics?.length,
    'retains nine scalars per degree-one row'
  ).toBe(18);
  expect(
    Boolean(Math.abs(firstDegreeSource.sphericalHarmonics![9] - 10.1) < 1e-5),
    'packs source rows as basis-major RGB triplets'
  ).toBe(true);
  expect(secondDegreeSource.sphericalHarmonicsDegree, 'infers the complete degree-two band').toBe(
    2
  );
  expect(
    secondDegreeSource.sphericalHarmonics?.length,
    'retains 24 scalars per degree-two row'
  ).toBe(48);
  expect(
    Array.from(firstDegreeSource.semanticIds!),
    'selects requested 3D Tiles feature metadata without glTF package dependencies'
  ).toEqual([17, 19]);
  void 0;
});

it('glTF Gaussian primitives select declared attribute-backed feature metadata', () => {
  const primitive = makeGLTFSplatPrimitive();
  const withMixedFeatureDeclarations: GLTFSplatPrimitive = {
    ...primitive,
    attributes: {...primitive.attributes, _FEATURE_ID_2: new Uint16Array([13, 17])},
    extensions: {
      ...primitive.extensions,
      EXT_mesh_features: {featureIds: [{}, {attribute: 2}]}
    }
  };

  const source = makeSplatSourceFromGLTF(withMixedFeatureDeclarations);
  expect(
    Array.from(source.semanticIds!),
    'skips non-attribute feature descriptors and selects the first declared attribute set'
  ).toEqual([13, 17]);
  expect(
    () => makeSplatSourceFromGLTF(primitive, {featureIdAttribute: '_FEATURE_ID_9'}),
    'rejects an explicitly requested feature set that is absent'
  ).toThrow(/feature-ID attribute/);
  expect(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {...primitive.attributes, _FEATURE_ID_0: new Float32Array([1, 2])}
      }),
    'rejects lossy floating-point feature identifiers'
  ).toThrow(/unsigned integers/);
  void 0;
});

it('glTF Gaussian primitives reject invalid modes, incomplete bands, and mismatched rows', () => {
  const primitive = makeGLTFSplatPrimitive();
  expect(
    () => makeSplatSourceFromGLTF({...primitive, mode: 4}),
    'requires glTF POINTS primitive mode'
  ).toThrow(/Unsupported glTF Gaussian splat primitive/);
  expect(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {...primitive.attributes, 'KHR_gaussian_splatting:OPACITY': new Float32Array(1)}
      }),
    'rejects accessors that do not describe the same source rows'
  ).toThrow(/matching rows/);
  expect(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {
          ...primitive.attributes,
          'KHR_gaussian_splatting:SH_DEGREE_1_COEF_0': new Float32Array(6)
        }
      }),
    'rejects partially authored higher-order spherical harmonics'
  ).toThrow(/bands must be complete/);
  expect(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {
          ...primitive.attributes,
          ...Object.fromEntries(
            Array.from({length: 5}, (_, index) => [
              `KHR_gaussian_splatting:SH_DEGREE_2_COEF_${index}`,
              new Float32Array(6)
            ])
          )
        }
      }),
    'rejects higher bands without their required lower-order coefficients'
  ).toThrow(/bands must be consecutive/);
  void 0;
});

it('glTF SPZ v2 primitives hand compressed payloads to caller-owned async decoders', async () => {
  const device = new NullDevice({});
  const decodedPrimitive = makeGLTFSplatPrimitive();
  const compression = {bufferView: 4};
  const compressedPrimitive: GLTFSplatPrimitive = {
    ...decodedPrimitive,
    attributes: {},
    extensions: {
      ...decodedPrimitive.extensions,
      KHR_gaussian_splatting: {
        ...decodedPrimitive.extensions!.KHR_gaussian_splatting!,
        extensions: {KHR_gaussian_splatting_compression_spz_2: compression}
      }
    }
  };
  const abortController = new AbortController();
  let decoderCallCount = 0;
  const prepared = await loadGPUSplatDataFromGLTF(device, compressedPrimitive, {
    rowIndexBase: 100,
    signal: abortController.signal,
    decodeCompressedPrimitive: async (primitive, options) => {
      decoderCallCount++;
      expect(primitive, 'forwards the exact source primitive to the decoder').toBe(
        compressedPrimitive
      );
      expect(options.compression, 'forwards the nested SPZ v2 extension metadata').toBe(
        compression
      );
      expect(options.signal, 'forwards caller-owned cancellation').toBe(abortController.signal);
      return decodedPrimitive;
    }
  });

  expect(decoderCallCount, 'decodes the compressed primitive exactly once').toBe(1);
  expect(prepared.rowIndexBase, 'retains tile identity through the compression boundary').toBe(100);
  prepared.destroy();

  const alreadyDecoded = await loadGPUSplatDataFromGLTF(device, {
    ...compressedPrimitive,
    attributes: decodedPrimitive.attributes
  });
  expect(
    decoderCallCount,
    'never decodes accessors that the external loader already resolved'
  ).toBe(1);
  alreadyDecoded.destroy();

  try {
    await loadGPUSplatDataFromGLTF(device, compressedPrimitive);
    expect(false, 'compressed primitives require an externally supplied decoder').toBe(true);
  } catch (error) {
    expect(
      Boolean(error instanceof Error && /SPZ decoder/.test(error.message)),
      'reports compressed primitives without an externally supplied decoder'
    ).toBe(true);
  }
  void 0;
});

function makeGLTFSplatPrimitive(
  colorSpace: 'lin_rec709_display' | 'srgb_rec709_display' = 'lin_rec709_display'
): GLTFSplatPrimitive {
  return {
    mode: 0,
    attributes: {
      POSITION: new Float32Array([1, 2, 3, 4, 5, 6]),
      'KHR_gaussian_splatting:SCALE': new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]),
      'KHR_gaussian_splatting:ROTATION': new Float32Array([0, 0, 0, 1, 0.5, 0.5, 0.5, 0.5]),
      'KHR_gaussian_splatting:OPACITY': new Float32Array([0.25, 0.75]),
      'KHR_gaussian_splatting:SH_DEGREE_0_COEF_0': new Float32Array([1, 0, -1, 2, 3, 4]),
      _FEATURE_ID_0: new Uint32Array([3, 9])
    },
    extensions: {
      KHR_gaussian_splatting: {kernel: 'ellipse', colorSpace},
      EXT_mesh_features: {featureIds: [{attribute: 0}]}
    }
  };
}
