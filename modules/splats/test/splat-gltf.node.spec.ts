// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  isGLTFSplatPrimitive,
  loadGPUSplatDataFromGLTF,
  makeGPUSplatDataFromGLTF,
  makeSplatSourceFromGLTF,
  type GLTFSplatPrimitive
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('glTF Gaussian primitives preserve source identities and convert Khronos attributes', t => {
  const device = new NullDevice({});
  const primitive = makeGLTFSplatPrimitive();
  const source = makeSplatSourceFromGLTF(primitive, {sourceBatchIndex: 7, rowIndexBase: 42});
  const prepared = makeGPUSplatDataFromGLTF(device, primitive, {
    sourceBatchIndex: 7,
    rowIndexBase: 42
  });

  t.ok(isGLTFSplatPrimitive(primitive), 'recognizes the declared Khronos primitive extension');
  t.equal(source.positions, primitive.attributes['POSITION'], 'borrows decoded Float32 positions');
  t.equal(
    source.scales,
    primitive.attributes['KHR_gaussian_splatting:SCALE'],
    'borrows decoded linear Float32 scales'
  );
  t.deepEqual(
    Array.from(source.rotations),
    [1, 0, 0, 0, 0.5, 0.5, 0.5, 0.5],
    'converts glTF XYZW quaternions to renderer WXYZ order'
  );
  t.ok(Math.abs(source.colors[0] - 0.7820947917738781) < 1e-6, 'reconstructs SH DC radiance');
  t.equal(source.colors[3], 1, 'keeps opacity separate from the diffuse color alpha');
  t.deepEqual(Array.from(source.opacities), [0.25, 0.75], 'retains linear source opacity');
  t.deepEqual(Array.from(source.semanticIds!), [3, 9], 'preserves 3D Tiles feature identifiers');
  t.equal(prepared.sourceInfo.sourceBatchIndex, 7, 'retains the source tile batch identity');
  t.equal(prepared.sourceInfo.sourceRowIndexOffset, 42, 'retains stable global source rows');
  t.equal(prepared.semanticIds?.format, 'uint32', 'uploads feature metadata as semantic IDs');

  prepared.destroy();
  t.end();
});

test('glTF Gaussian primitives normalize integer accessors and decode sRGB display colors', t => {
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

  t.deepEqual(
    Array.from(source.rotations),
    [1, 0, 0, 0, 0, -1, 0, 0],
    'normalizes signed glTF accessor components and clamps the negative endpoint'
  );
  t.deepEqual(Array.from(source.opacities), [0, 1], 'normalizes unsigned opacity accessors');
  t.ok(source.colors[0] < 0.7820947917738781, 'converts sRGB display radiance to linear RGB');
  t.end();
});

test('glTF Gaussian primitives retain complete ordered SH bands and selected feature metadata', t => {
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

  t.equal(firstDegreeSource.sphericalHarmonicsDegree, 1, 'caps fully authored higher-order bands');
  t.equal(
    firstDegreeSource.sphericalHarmonics?.length,
    18,
    'retains nine scalars per degree-one row'
  );
  t.ok(
    Math.abs(firstDegreeSource.sphericalHarmonics![9] - 10.1) < 1e-5,
    'packs source rows as basis-major RGB triplets'
  );
  t.equal(secondDegreeSource.sphericalHarmonicsDegree, 2, 'infers the complete degree-two band');
  t.equal(
    secondDegreeSource.sphericalHarmonics?.length,
    48,
    'retains 24 scalars per degree-two row'
  );
  t.deepEqual(
    Array.from(firstDegreeSource.semanticIds!),
    [17, 19],
    'selects requested 3D Tiles feature metadata without glTF package dependencies'
  );
  t.end();
});

test('glTF Gaussian primitives select declared attribute-backed feature metadata', t => {
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
  t.deepEqual(
    Array.from(source.semanticIds!),
    [13, 17],
    'skips non-attribute feature descriptors and selects the first declared attribute set'
  );
  t.throws(
    () => makeSplatSourceFromGLTF(primitive, {featureIdAttribute: '_FEATURE_ID_9'}),
    /feature-ID attribute/,
    'rejects an explicitly requested feature set that is absent'
  );
  t.throws(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {...primitive.attributes, _FEATURE_ID_0: new Float32Array([1, 2])}
      }),
    /unsigned integers/,
    'rejects lossy floating-point feature identifiers'
  );
  t.end();
});

test('glTF Gaussian primitives reject invalid modes, incomplete bands, and mismatched rows', t => {
  const primitive = makeGLTFSplatPrimitive();
  t.throws(
    () => makeSplatSourceFromGLTF({...primitive, mode: 4}),
    /Unsupported glTF Gaussian splat primitive/,
    'requires glTF POINTS primitive mode'
  );
  t.throws(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {...primitive.attributes, 'KHR_gaussian_splatting:OPACITY': new Float32Array(1)}
      }),
    /matching rows/,
    'rejects accessors that do not describe the same source rows'
  );
  t.throws(
    () =>
      makeSplatSourceFromGLTF({
        ...primitive,
        attributes: {
          ...primitive.attributes,
          'KHR_gaussian_splatting:SH_DEGREE_1_COEF_0': new Float32Array(6)
        }
      }),
    /bands must be complete/,
    'rejects partially authored higher-order spherical harmonics'
  );
  t.throws(
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
    /bands must be consecutive/,
    'rejects higher bands without their required lower-order coefficients'
  );
  t.end();
});

test('glTF SPZ v2 primitives hand compressed payloads to caller-owned async decoders', async t => {
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
      t.equal(primitive, compressedPrimitive, 'forwards the exact source primitive to the decoder');
      t.equal(options.compression, compression, 'forwards the nested SPZ v2 extension metadata');
      t.equal(options.signal, abortController.signal, 'forwards caller-owned cancellation');
      return decodedPrimitive;
    }
  });

  t.equal(decoderCallCount, 1, 'decodes the compressed primitive exactly once');
  t.equal(prepared.rowIndexBase, 100, 'retains tile identity through the compression boundary');
  prepared.destroy();

  const alreadyDecoded = await loadGPUSplatDataFromGLTF(device, {
    ...compressedPrimitive,
    attributes: decodedPrimitive.attributes
  });
  t.equal(decoderCallCount, 1, 'never decodes accessors that the external loader already resolved');
  alreadyDecoded.destroy();

  try {
    await loadGPUSplatDataFromGLTF(device, compressedPrimitive);
    t.fail('compressed primitives require an externally supplied decoder');
  } catch (error) {
    t.ok(
      error instanceof Error && /SPZ decoder/.test(error.message),
      'reports compressed primitives without an externally supplied decoder'
    );
  }
  t.end();
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
