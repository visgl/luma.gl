// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {dggs} from '@luma.gl/shadertools';

const H3_INDEX = 0x085283473fffffffn;
const H3_PARENT_RESOLUTION_3 = 0x0832834fffffffffn;
const S2_INDEX = 0x6d00000000000000n;
const S2_FACE_5_INDEX = 0xad00000000000000n;
const A5_RESOLUTION_0_INDEX = 0x0200000000000000n;
const A5_RESOLUTION_1_INDEX = 0x0500000000000000n;
const A5_RESOLUTION_4_INDEX = 0x1a38000000000000n;
const A5_RESOLUTION_4_REFLECTED_INDEX = 0x2628000000000000n;
const A5_MAX_RESOLUTION_INDEX = 0x35bd75e8fee1100dn;
const INT64_NEGATIVE = -42n;
const INT64_POSITIVE = 17n;

test('shadertools#dggs exports WGSL helpers', t => {
  t.equal(dggs.name, 'dggs', 'module has expected name');
  t.ok(dggs.source?.includes('dggs_i64_less'), 'exports Int64 helper functions');
  t.ok(dggs.source?.includes('dggs_h3_get_resolution'), 'exports H3 decoder helpers');
  t.ok(dggs.source?.includes('dggs_h3_get_boundary_point'), 'exports H3 boundary helpers');
  t.ok(dggs.source?.includes('dggs_s2_get_face'), 'exports S2 decoder helpers');
  t.ok(dggs.source?.includes('dggs_a5_get_boundary_point'), 'exports A5 boundary helpers');
  t.end();
});

test('shadertools#dggs WGSL decodes H3, S2, and A5 words', async t => {
  const webgpuDevice = await getWebGPUTestDevice();
  if (!webgpuDevice) {
    t.comment('WebGPU unavailable, skipping DGGS WGSL compute test');
    t.end();
    return;
  }

  const inputWords = new Uint32Array([
    ...getLittleEndianWords(H3_INDEX),
    ...getLittleEndianWords(S2_INDEX),
    ...getLittleEndianWords(S2_FACE_5_INDEX),
    ...getLittleEndianWords(INT64_NEGATIVE),
    ...getLittleEndianWords(INT64_POSITIVE),
    ...getLittleEndianWords(0n),
    ...getLittleEndianWords(A5_RESOLUTION_0_INDEX),
    ...getLittleEndianWords(A5_RESOLUTION_1_INDEX),
    ...getLittleEndianWords(A5_RESOLUTION_4_INDEX),
    ...getLittleEndianWords(A5_MAX_RESOLUTION_INDEX),
    ...getLittleEndianWords(A5_RESOLUTION_4_REFLECTED_INDEX)
  ]);
  const expectedParentWords = getLittleEndianWords(H3_PARENT_RESOLUTION_3);
  const expectedInt64DifferenceWords = getLittleEndianWords(INT64_POSITIVE - INT64_NEGATIVE);
  const expectedResult = new Uint32Array([
    1,
    5,
    20,
    0,
    4,
    expectedParentWords[0],
    expectedParentWords[1],
    3,
    2,
    1,
    2,
    1,
    5,
    1,
    1,
    1,
    getFloat32Bits(-42),
    expectedInt64DifferenceWords[0],
    expectedInt64DifferenceWords[1],
    0,
    0,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    4,
    1,
    3,
    1,
    30,
    getFloat32Bits(-120.09849548339844),
    getFloat32Bits(40.015132904052734),
    4,
    2,
    5,
    0,
    1,
    1,
    getFloat32Bits(-74.28097534179688),
    getFloat32Bits(44.1791877746582)
  ]);

  const inputBuffer = webgpuDevice.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
    data: inputWords
  });
  const resultBuffer = webgpuDevice.createBuffer({
    usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
    byteLength: expectedResult.byteLength
  });
  const computation = new Computation(webgpuDevice, {
    source: DGGS_TEST_SHADER,
    modules: [dggs],
    shaderLayout: {
      bindings: [
        {name: 'inputWords', type: 'read-only-storage', group: 0, location: 0},
        {name: 'resultWords', type: 'storage', group: 0, location: 1}
      ]
    }
  });

  try {
    computation.setBindings({inputWords: inputBuffer, resultWords: resultBuffer});

    const computePass = webgpuDevice.beginComputePass({});
    computation.dispatch(computePass, 1);
    computePass.end();
    webgpuDevice.submit();

    const resultBytes = await resultBuffer.readAsync();
    const resultWords = new Uint32Array(
      resultBytes.buffer,
      resultBytes.byteOffset,
      resultBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT
    );
    t.deepEqual(Array.from(resultWords), Array.from(expectedResult), 'decodes expected fields');
  } finally {
    computation.destroy();
    inputBuffer.destroy();
    resultBuffer.destroy();
  }

  t.end();
});

const DGGS_TEST_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read> inputWords: array<vec2u>;
@group(0) @binding(1) var<storage, read_write> resultWords: array<u32>;

@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) globalInvocationId: vec3u) {
  if (globalInvocationId.x > 0u) {
    return;
  }

  let h3Index = dggs_u64_from_little_endian_words(inputWords[0]);
  let h3Parent = dggs_u64_to_little_endian_words(dggs_h3_get_parent(h3Index, 3u));
  resultWords[0] = dggs_h3_get_mode(h3Index);
  resultWords[1] = dggs_h3_get_resolution(h3Index);
  resultWords[2] = dggs_h3_get_base_cell(h3Index);
  resultWords[3] = dggs_h3_get_digit(h3Index, 1u);
  resultWords[4] = dggs_h3_get_digit(h3Index, 5u);
  resultWords[5] = h3Parent.x;
  resultWords[6] = h3Parent.y;

  let s2Index = dggs_u64_from_little_endian_words(inputWords[1]);
  resultWords[7] = dggs_s2_get_face(s2Index);
  resultWords[8] = dggs_s2_get_level(s2Index);
  resultWords[9] = dggs_s2_get_child_position(s2Index, 1u);
  resultWords[10] = dggs_s2_get_child_position(s2Index, 2u);
  resultWords[11] = select(0u, 1u, dggs_s2_is_valid_cell_id(s2Index));

  let s2Face5Index = dggs_u64_from_little_endian_words(inputWords[2]);
  resultWords[12] = dggs_s2_get_face(s2Face5Index);
  resultWords[13] = select(0u, 1u, dggs_s2_is_valid_cell_id(s2Face5Index));

  let negativeInt64 = dggs_i64_from_little_endian_words(inputWords[3]);
  let positiveInt64 = dggs_i64_from_little_endian_words(inputWords[4]);
  let int64Difference = dggs_i64_to_little_endian_words(
    dggs_i64_subtract(positiveInt64, negativeInt64)
  );
  resultWords[14] = select(0u, 1u, dggs_i64_is_negative(negativeInt64));
  resultWords[15] = select(0u, 1u, dggs_i64_less(negativeInt64, positiveInt64));
  resultWords[16] = bitcast<u32>(dggs_i64_to_f32(negativeInt64));
  resultWords[17] = int64Difference.x;
  resultWords[18] = int64Difference.y;

  let a5World = dggs_a5_deserialize(dggs_u64_from_little_endian_words(inputWords[5]));
  resultWords[19] = a5World.valid;
  resultWords[20] = a5World.resolution;

  let a5Resolution0 = dggs_a5_deserialize(dggs_u64_from_little_endian_words(inputWords[6]));
  resultWords[21] = a5Resolution0.valid;
  resultWords[22] = a5Resolution0.resolution;
  resultWords[23] = a5Resolution0.origin;

  let a5Resolution1 = dggs_a5_deserialize(dggs_u64_from_little_endian_words(inputWords[7]));
  resultWords[24] = a5Resolution1.valid;
  resultWords[25] = a5Resolution1.resolution;
  resultWords[26] = a5Resolution1.segment;

  let a5Resolution4 = dggs_a5_deserialize(dggs_u64_from_little_endian_words(inputWords[8]));
  resultWords[27] = a5Resolution4.valid;
  resultWords[28] = a5Resolution4.resolution;
  resultWords[29] = a5Resolution4.origin;
  resultWords[30] = a5Resolution4.segment;

  let a5MaxResolution = dggs_a5_deserialize(dggs_u64_from_little_endian_words(inputWords[9]));
  resultWords[31] = a5MaxResolution.valid;
  resultWords[32] = a5MaxResolution.resolution;

  let a5BoundaryPoint = dggs_a5_get_boundary_point(
    dggs_u64_from_little_endian_words(inputWords[8]),
    0u
  );
  resultWords[33] = bitcast<u32>(a5BoundaryPoint.x);
  resultWords[34] = bitcast<u32>(a5BoundaryPoint.y);

  let a5ReflectedIndex = dggs_u64_from_little_endian_words(inputWords[10]);
  let a5ReflectedCell = dggs_a5_deserialize(a5ReflectedIndex);
  let a5ReflectedAnchor = dggs_a5_make_anchor(
    a5ReflectedIndex,
    a5ReflectedCell,
    dggs_a5_segment_to_anchor_info(a5ReflectedCell)
  );
  let a5ReflectedBoundaryPoint = dggs_a5_get_boundary_point(a5ReflectedIndex, 1u);
  resultWords[35] = a5ReflectedCell.resolution;
  resultWords[36] = a5ReflectedAnchor.q;
  resultWords[37] = bitcast<u32>(a5ReflectedAnchor.offset.x);
  resultWords[38] = bitcast<u32>(a5ReflectedAnchor.offset.y);
  resultWords[39] = bitcast<u32>(a5ReflectedAnchor.flips.x);
  resultWords[40] = bitcast<u32>(a5ReflectedAnchor.flips.y);
  resultWords[41] = bitcast<u32>(a5ReflectedBoundaryPoint.x);
  resultWords[42] = bitcast<u32>(a5ReflectedBoundaryPoint.y);
}
`;

function getLittleEndianWords(value: bigint): [number, number] {
  const normalizedValue = BigInt.asUintN(64, value);
  return [Number(normalizedValue & 0xffffffffn), Number((normalizedValue >> 32n) & 0xffffffffn)];
}

function getFloat32Bits(value: number): number {
  return new Uint32Array(new Float32Array([value]).buffer)[0];
}
