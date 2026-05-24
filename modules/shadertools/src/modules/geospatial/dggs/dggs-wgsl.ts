// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** WGSL source implementing 64-bit DGGS cell key and boundary helpers. */
export const dggsWGSL = /* wgsl */ `\
const DGGS_H3_CELL_MODE: u32 = 1u;
const DGGS_H3_MAX_RESOLUTION: u32 = 15u;
const DGGS_H3_MAX_BASE_CELL: u32 = 121u;
const DGGS_H3_UNUSED_DIGIT: u32 = 7u;
const DGGS_H3_RES0_U_GNOMONIC: f32 = 0.381966011250105;
const DGGS_H3_RSQRT7: f32 = 0.3779644730092272;
const DGGS_H3_ONETHIRD: f32 = 0.3333333333333333;
const DGGS_H3_AP7_ROT_RADS: f32 = 0.3334731722518321;
const DGGS_H3_SQRT3_2: f32 = 0.8660254037844386;
const DGGS_S2_MAX_LEVEL: u32 = 30u;
const DGGS_GEOHASH_MAX_LENGTH: u32 = 12u;
const DGGS_GEOHASH_LENGTH_BIT_OFFSET: u32 = 60u;
const DGGS_QUADKEY_MAX_LENGTH: u32 = 29u;
const DGGS_QUADKEY_LENGTH_BIT_OFFSET: u32 = 58u;
const DGGS_A5_FIRST_HILBERT_RESOLUTION: u32 = 2u;
const DGGS_A5_MAX_RESOLUTION: u32 = 30u;
const DGGS_A5_HILBERT_START_BIT: u32 = 58u;
const DGGS_PI: f32 = 3.141592653589793;
const DGGS_TWO_PI: f32 = 6.283185307179586;
const DGGS_TWO_PI_OVER_5: f32 = 1.2566370614359172;
const DGGS_PI_OVER_5: f32 = 0.6283185307179586;
const DGGS_PI_OVER_2: f32 = 1.5707963267948966;
const DGGS_A5_DISTANCE_TO_EDGE: f32 = 0.6180339887498949;
const DGGS_A5_REFLECTED_TRIANGLE_SCALE: f32 = 3.23606797749979;
const DGGS_A5_LONGITUDE_OFFSET: f32 = 93.0;
const DGGS_RADIANS_TO_DEGREES: f32 = 57.29577951308232;
const DGGS_DEGREES_TO_RADIANS: f32 = 0.017453292519943295;
const DGGS_U64_HIGH_WORD_FLOAT_SCALE: f32 = 4294967296.0;

// DGGS 64-bit helper functions use canonical word order vec2u(high, low).
// Arrow BigInt64/BigUint64 buffers are read as little-endian vec2u(low, high),
// so storage-buffer reads should pass through dggs_u64_from_little_endian_words().
fn dggs_u64_make(high: u32, low: u32) -> vec2u {
  return vec2u(high, low);
}

fn dggs_u64_from_little_endian_words(words: vec2u) -> vec2u {
  return words.yx;
}

fn dggs_u64_to_little_endian_words(value: vec2u) -> vec2u {
  return value.yx;
}

fn dggs_u64_high(value: vec2u) -> u32 {
  return value.x;
}

fn dggs_u64_low(value: vec2u) -> u32 {
  return value.y;
}

fn dggs_u64_is_zero(value: vec2u) -> bool {
  return value.x == 0u && value.y == 0u;
}

fn dggs_u64_equal(a: vec2u, b: vec2u) -> bool {
  return a.x == b.x && a.y == b.y;
}

fn dggs_u64_compare(a: vec2u, b: vec2u) -> i32 {
  if (a.x != b.x) {
    return select(-1, 1, a.x > b.x);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn dggs_u64_less(a: vec2u, b: vec2u) -> bool {
  return dggs_u64_compare(a, b) < 0;
}

fn dggs_u64_add(a: vec2u, b: vec2u) -> vec2u {
  let low = a.y + b.y;
  let carry = select(0u, 1u, low < a.y);
  return vec2u(a.x + b.x + carry, low);
}

fn dggs_u64_subtract(a: vec2u, b: vec2u) -> vec2u {
  let borrow = select(0u, 1u, a.y < b.y);
  return vec2u(a.x - b.x - borrow, a.y - b.y);
}

fn dggs_u64_to_f32(value: vec2u) -> f32 {
  return f32(value.x) * DGGS_U64_HIGH_WORD_FLOAT_SCALE + f32(value.y);
}

fn dggs_i64_from_little_endian_words(words: vec2u) -> vec2u {
  return dggs_u64_from_little_endian_words(words);
}

fn dggs_i64_to_little_endian_words(value: vec2u) -> vec2u {
  return dggs_u64_to_little_endian_words(value);
}

fn dggs_i64_is_negative(value: vec2u) -> bool {
  return (value.x & 0x80000000u) != 0u;
}

fn dggs_i64_negate(value: vec2u) -> vec2u {
  return dggs_u64_add(vec2u(~value.x, ~value.y), vec2u(0u, 1u));
}

fn dggs_i64_compare(a: vec2u, b: vec2u) -> i32 {
  let highA = bitcast<i32>(a.x);
  let highB = bitcast<i32>(b.x);
  if (highA != highB) {
    return select(-1, 1, highA > highB);
  }
  if (a.y != b.y) {
    return select(-1, 1, a.y > b.y);
  }
  return 0;
}

fn dggs_i64_less(a: vec2u, b: vec2u) -> bool {
  return dggs_i64_compare(a, b) < 0;
}

fn dggs_i64_subtract(a: vec2u, b: vec2u) -> vec2u {
  return dggs_u64_subtract(a, b);
}

fn dggs_i64_to_f32(value: vec2u) -> f32 {
  if (dggs_i64_is_negative(value)) {
    return -dggs_u64_to_f32(dggs_i64_negate(value));
  }
  return dggs_u64_to_f32(value);
}

fn dggs_u32_mask_low(bitCount: u32) -> u32 {
  if (bitCount == 0u) {
    return 0u;
  }
  if (bitCount >= 32u) {
    return 0xffffffffu;
  }
  return (1u << bitCount) - 1u;
}

fn dggs_u64_shift_left(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u((value.x << shift) | (value.y >> (32u - shift)), value.y << shift);
  }
  if (shift == 32u) {
    return vec2u(value.y, 0u);
  }
  if (shift < 64u) {
    return vec2u(value.y << (shift - 32u), 0u);
  }
  return vec2u(0u);
}

fn dggs_u64_shift_right(value: vec2u, shift: u32) -> vec2u {
  if (shift == 0u) {
    return value;
  }
  if (shift < 32u) {
    return vec2u(value.x >> shift, (value.y >> shift) | (value.x << (32u - shift)));
  }
  if (shift == 32u) {
    return vec2u(0u, value.x);
  }
  if (shift < 64u) {
    return vec2u(0u, value.x >> (shift - 32u));
  }
  return vec2u(0u);
}

fn dggs_u64_extract_bits(value: vec2u, bitOffset: u32, bitCount: u32) -> u32 {
  if (bitCount == 0u || bitOffset >= 64u) {
    return 0u;
  }
  let shifted = dggs_u64_shift_right(value, bitOffset);
  return shifted.y & dggs_u32_mask_low(bitCount);
}

fn dggs_u64_set_bits(value: vec2u, bitOffset: u32, bitCount: u32, bits: u32) -> vec2u {
  if (bitCount == 0u || bitOffset >= 64u) {
    return value;
  }
  let bitMask = dggs_u32_mask_low(bitCount);
  let fieldMask = dggs_u64_shift_left(vec2u(0u, bitMask), bitOffset);
  let fieldBits = dggs_u64_shift_left(vec2u(0u, bits & bitMask), bitOffset);
  return (value & vec2u(~fieldMask.x, ~fieldMask.y)) | fieldBits;
}

fn dggs_u64_count_trailing_zeros(value: vec2u) -> u32 {
  if (value.y != 0u) {
    return countTrailingZeros(value.y);
  }
  if (value.x != 0u) {
    return 32u + countTrailingZeros(value.x);
  }
  return 64u;
}

struct DggsA5Cell {
  origin : u32,
  segment : u32,
  resolution : u32,
  valid : u32,
  quintantShift : u32,
  hilbertResolution : u32,
};

struct DggsA5Anchor {
  q : u32,
  offset : vec2i,
  flips : vec2i,
  orientation : u32,
  quintant : u32,
};

struct DggsA5FaceTriangle {
  a : vec2f,
  b : vec2f,
  c : vec2f,
};

struct DggsA5SphericalTriangle {
  a : vec3f,
  b : vec3f,
  c : vec3f,
};

struct DggsH3FaceIJK {
  face : u32,
  coord : vec3i,
  valid : u32,
};

struct DggsH3BoundaryVertex {
  face : u32,
  coord : vec3i,
  resolution : u32,
  valid : u32,
};

fn dggs_boundary_point_to_fp64_split(point : vec2f) -> vec4f {
  return vec4f(point.x, point.y, 0.0, 0.0);
}

fn dggs_a5_positive_mod_i32(value : i32, modulus : i32) -> i32 {
  return ((value % modulus) + modulus) % modulus;
}

fn dggs_a5_has_bit(index : vec2u, bitOffset : u32) -> bool {
  return dggs_u64_extract_bits(index, bitOffset, 1u) != 0u;
}

fn dggs_a5_get_resolution(index : vec2u) -> u32 {
  if (dggs_u64_is_zero(index)) {
    return 0u;
  }
  if (
    dggs_a5_has_bit(index, 0u) ||
    dggs_u64_extract_bits(index, 0u, 3u) == 4u ||
    dggs_u64_extract_bits(index, 0u, 5u) == 16u
  ) {
    return DGGS_A5_MAX_RESOLUTION;
  }

  var resolution = DGGS_A5_MAX_RESOLUTION - 1u;
  var shifted = dggs_u64_shift_right(index, 1u);
  if (dggs_u64_is_zero(shifted)) {
    return 0u;
  }

  var remaining = shifted.y;
  if (remaining == 0u) {
    shifted = dggs_u64_shift_right(shifted, 32u);
    resolution -= 16u;
    remaining = shifted.y;
  }
  if ((remaining & 0xffffu) == 0u) {
    remaining >>= 16u;
    resolution -= 8u;
  }
  if (resolution >= 6u && (remaining & 0xffu) == 0u) {
    remaining >>= 8u;
    resolution -= 4u;
  }
  if (resolution >= 4u && (remaining & 0xfu) == 0u) {
    remaining >>= 4u;
    resolution -= 2u;
  }
  loop {
    if ((remaining & 1u) != 0u) {
      break;
    }
    if (resolution == 0u) {
      break;
    }
    resolution -= 1u;
    remaining >>= select(2u, 1u, resolution < DGGS_A5_FIRST_HILBERT_RESOLUTION);
  }
  return resolution;
}

fn dggs_a5_get_origin_first_quintant(origin : u32) -> u32 {
  let values = array<u32, 12>(
    4u, 2u, 3u, 0u, 2u, 4u, 2u, 2u, 3u, 0u, 3u, 0u
  );
  return values[min(origin, 11u)];
}

fn dggs_a5_get_origin_step(origin : u32) -> i32 {
  let values = array<i32, 12>(
    -1, 1, 1, 1, -1, 1, -1, -1, 1, 1, 1, -1
  );
  return values[min(origin, 11u)];
}

fn dggs_a5_get_origin_orientation(origin : u32, faceRelativeQuintant : u32) -> u32 {
  // Orientation codes: uv=0, vu=1, uw=2, wu=3, vw=4, wv=5.
  let values = array<u32, 60>(
    1u, 2u, 4u, 4u, 4u,
    1u, 0u, 5u, 3u, 2u,
    3u, 0u, 5u, 3u, 2u,
    3u, 0u, 5u, 3u, 2u,
    3u, 2u, 4u, 1u, 2u,
    1u, 0u, 5u, 3u, 2u,
    3u, 2u, 4u, 1u, 2u,
    3u, 2u, 4u, 1u, 2u,
    3u, 0u, 5u, 3u, 2u,
    1u, 0u, 5u, 3u, 2u,
    1u, 0u, 5u, 3u, 2u,
    3u, 2u, 4u, 1u, 2u
  );
  return values[min(origin, 11u) * 5u + min(faceRelativeQuintant, 4u)];
}

fn dggs_a5_get_origin_angle(origin : u32) -> f32 {
  if (origin == 0u || origin == 9u) {
    return 0.0;
  }
  return DGGS_PI_OVER_5;
}

fn dggs_a5_get_origin_quaternion(origin : u32) -> vec4f {
  let values = array<vec4f, 12>(
    vec4f(0.0, 0.0, 0.0, 1.0),
    vec4f(0.0, 0.525731112119, 0.0, 0.850650808352),
    vec4f(-0.5, 0.688190960236, 0.0, 0.525731112119),
    vec4f(-0.809016994375, -0.262865556060, 0.0, 0.525731112119),
    vec4f(-0.5, 0.162459848116, 0.0, 0.850650808352),
    vec4f(-0.309016994375, -0.425325404176, 0.0, 0.850650808352),
    vec4f(0.309016994375, -0.425325404176, 0.0, 0.850650808352),
    vec4f(0.809016994375, -0.262865556060, 0.0, 0.525731112119),
    vec4f(0.0, -0.850650808352, 0.0, 0.525731112119),
    vec4f(0.0, -1.0, 0.0, 0.0),
    vec4f(0.5, 0.688190960236, 0.0, 0.525731112119),
    vec4f(0.5, 0.162459848116, 0.0, 0.850650808352)
  );
  return values[min(origin, 11u)];
}

fn dggs_a5_quaternion_rotate(point : vec3f, quaternion : vec4f) -> vec3f {
  let q = quaternion.xyz;
  let t = 2.0 * cross(q, point);
  return point + quaternion.w * t + cross(q, t);
}

fn dggs_a5_deserialize(index : vec2u) -> DggsA5Cell {
  if (dggs_u64_is_zero(index)) {
    return DggsA5Cell(0u, 0u, 0u, 0u, DGGS_A5_HILBERT_START_BIT, 0u);
  }

  let resolution = dggs_a5_get_resolution(index);
  var quintantShift = DGGS_A5_HILBERT_START_BIT;
  var quintantOffset = 0u;
  if (resolution == DGGS_A5_MAX_RESOLUTION) {
    var markerBits = 5u;
    if (dggs_a5_has_bit(index, 0u)) {
      markerBits = 1u;
    } else if (dggs_a5_has_bit(index, 2u)) {
      markerBits = 3u;
    }
    quintantShift = DGGS_A5_HILBERT_START_BIT + markerBits;
    quintantOffset = select(select(40u, 32u, markerBits == 3u), 0u, markerBits == 1u);
  }

  let topBits = dggs_u64_shift_right(index, quintantShift).y + quintantOffset;
  if (resolution == 0u) {
    if (topBits >= 12u) {
      return DggsA5Cell(0u, 0u, resolution, 0u, quintantShift, 0u);
    }
    return DggsA5Cell(topBits, 0u, resolution, 1u, quintantShift, 0u);
  }

  let origin = topBits / 5u;
  if (origin >= 12u) {
    return DggsA5Cell(0u, 0u, resolution, 0u, quintantShift, 0u);
  }
  let segment = (topBits + dggs_a5_get_origin_first_quintant(origin)) % 5u;
  let hilbertResolution = select(0u, resolution - 1u, resolution >= 2u);
  return DggsA5Cell(origin, segment, resolution, 1u, quintantShift, hilbertResolution);
}

fn dggs_a5_segment_to_anchor_info(cell : DggsA5Cell) -> DggsA5Anchor {
  let firstQuintant = dggs_a5_get_origin_first_quintant(cell.origin);
  let faceRelativeQuintant = (cell.segment + 5u - firstQuintant) % 5u;
  let orientation = dggs_a5_get_origin_orientation(cell.origin, faceRelativeQuintant);
  let step = dggs_a5_get_origin_step(cell.origin);
  let quintant = u32(dggs_a5_positive_mod_i32(
    i32(firstQuintant) + step * i32(faceRelativeQuintant),
    5
  ));
  return DggsA5Anchor(0u, vec2i(0), vec2i(1), orientation, quintant);
}

fn dggs_a5_is_reverse_orientation(orientation : u32) -> bool {
  return orientation == 1u || orientation == 3u || orientation == 4u;
}

fn dggs_a5_is_invert_j_orientation(orientation : u32) -> bool {
  return orientation == 5u || orientation == 4u;
}

fn dggs_a5_is_flip_ij_orientation(orientation : u32) -> bool {
  return orientation == 3u || orientation == 2u;
}

fn dggs_a5_pattern_value(index : u32, flipIj : bool) -> u32 {
  let pattern = array<u32, 8>(0u, 1u, 3u, 4u, 5u, 6u, 7u, 2u);
  let flippedPattern = array<u32, 8>(0u, 1u, 2u, 7u, 3u, 4u, 5u, 6u);
  return select(pattern[min(index, 7u)], flippedPattern[min(index, 7u)], flipIj);
}

fn dggs_a5_quaternary_to_flips(digit : u32) -> vec2i {
  if (digit == 1u) {
    return vec2i(1, -1);
  }
  if (digit == 3u) {
    return vec2i(-1, 1);
  }
  return vec2i(1, 1);
}

fn dggs_a5_quaternary_to_kj(digit : u32, flips : vec2i) -> vec2i {
  var p = vec2i(0);
  var q = vec2i(0);
  if (flips.x == 1 && flips.y == 1) {
    p = vec2i(1, 0);
    q = vec2i(0, 1);
  } else if (flips.x == -1 && flips.y == 1) {
    p = vec2i(0, -1);
    q = vec2i(-1, 0);
  } else if (flips.x == 1 && flips.y == -1) {
    p = vec2i(0, 1);
    q = vec2i(1, 0);
  } else {
    p = vec2i(-1, 0);
    q = vec2i(0, -1);
  }

  if (digit == 1u) {
    return p;
  }
  if (digit == 2u) {
    return p + q;
  }
  if (digit == 3u) {
    return q + 2 * p;
  }
  return vec2i(0);
}

fn dggs_a5_kj_to_ij(kj : vec2i) -> vec2i {
  return vec2i(kj.x - kj.y, kj.y);
}

fn dggs_a5_shift_digits(
  digits : ptr<function, array<u32, 29>>,
  digitIndex : u32,
  flips : vec2i,
  invertJ : bool,
  flipIj : bool
) {
  if (digitIndex == 0u) {
    return;
  }
  let parentK = (*digits)[digitIndex];
  let childK = (*digits)[digitIndex - 1u];
  let flipSum = flips.x + flips.y;
  var needsShift = true;
  var first = true;
  if (invertJ != (flipSum == 0)) {
    needsShift = parentK == 1u || parentK == 2u;
    first = parentK == 1u;
  } else {
    needsShift = parentK < 2u;
    first = parentK == 0u;
  }
  if (!needsShift) {
    return;
  }
  let source = select(childK + 4u, childK, first);
  let destination = dggs_a5_pattern_value(source, flipIj);
  (*digits)[digitIndex - 1u] = destination % 4u;
  (*digits)[digitIndex] = u32(dggs_a5_positive_mod_i32(
    i32(parentK) + 4 + i32(destination / 4u) - i32(source / 4u),
    4
  ));
}

fn dggs_a5_make_anchor(index : vec2u, cell : DggsA5Cell, anchorInfo : DggsA5Anchor) -> DggsA5Anchor {
  if (cell.hilbertResolution == 0u) {
    return anchorInfo;
  }

  let reverse = dggs_a5_is_reverse_orientation(anchorInfo.orientation);
  let invertJ = dggs_a5_is_invert_j_orientation(anchorInfo.orientation);
  let flipIj = dggs_a5_is_flip_ij_orientation(anchorInfo.orientation);
  let hilbertBits = 2u * cell.hilbertResolution;
  let sBitOffset = cell.quintantShift - hilbertBits;
  var digits : array<u32, 29>;
  var digitIndex = 0u;
  loop {
    if (digitIndex >= cell.hilbertResolution) {
      break;
    }
    var digit = dggs_u64_extract_bits(index, sBitOffset + 2u * digitIndex, 2u);
    if (reverse) {
      digit = 3u - digit;
    }
    digits[digitIndex] = digit;
    digitIndex += 1u;
  }

  var flips = vec2i(1, 1);
  digitIndex = cell.hilbertResolution;
  loop {
    if (digitIndex == 0u) {
      break;
    }
    digitIndex -= 1u;
    dggs_a5_shift_digits(&digits, digitIndex, flips, invertJ, flipIj);
    flips *= dggs_a5_quaternary_to_flips(digits[digitIndex]);
  }

  flips = vec2i(1, 1);
  var offset = vec2i(0);
  digitIndex = cell.hilbertResolution;
  loop {
    if (digitIndex == 0u) {
      break;
    }
    digitIndex -= 1u;
    offset *= 2;
    offset += dggs_a5_quaternary_to_kj(digits[digitIndex], flips);
    flips *= dggs_a5_quaternary_to_flips(digits[digitIndex]);
  }

  var anchorOffset = dggs_a5_kj_to_ij(offset);
  if (flipIj) {
    let originalOffset = anchorOffset;
    anchorOffset = originalOffset.yx;
    if (flips.x == -1) {
      anchorOffset += vec2i(-1, 1);
    }
    if (flips.y == -1) {
      anchorOffset -= vec2i(-1, 1);
    }
  }
  if (invertJ) {
    let i = anchorOffset.x;
    let j = i32(1u << cell.hilbertResolution) - (i + anchorOffset.y);
    flips.x = -flips.x;
    anchorOffset.y = j;
  }

  return DggsA5Anchor(
    digits[0],
    anchorOffset,
    flips,
    anchorInfo.orientation,
    anchorInfo.quintant
  );
}

fn dggs_a5_rotate_face_point(point : vec2f, quintant : u32) -> vec2f {
  let angle = f32(quintant) * DGGS_TWO_PI_OVER_5;
  let cosine = cos(angle);
  let sine = sin(angle);
  return vec2f(point.x * cosine - point.y * sine, point.x * sine + point.y * cosine);
}

fn dggs_a5_get_base_pentagon_vertex(vertexIndex : u32) -> vec2f {
  let vertices = array<vec2f, 5>(
    vec2f(0.0, 0.0),
    vec2f(0.199381847431, 0.375413822391),
    vec2f(0.618033988750, 0.449027976580),
    vec2f(0.817415836181, 0.073614154188),
    vec2f(0.418652141319, -0.073614154188)
  );
  return vertices[min(vertexIndex, 4u)];
}

fn dggs_a5_get_base_triangle_vertex(vertexIndex : u32) -> vec2f {
  let vertices = array<vec2f, 3>(
    vec2f(0.0, 0.0),
    vec2f(0.618033988750, 0.449027976580),
    vec2f(0.618033988750, -0.449027976580)
  );
  return vertices[min(vertexIndex, 2u)];
}

fn dggs_a5_get_face_vertex(vertexIndex : u32) -> vec2f {
  return dggs_a5_rotate_face_point(dggs_a5_get_base_triangle_vertex(1u), 4u - min(vertexIndex, 4u));
}

fn dggs_a5_get_triangle_vertex(quintant : u32, vertexIndex : u32) -> vec2f {
  return dggs_a5_rotate_face_point(dggs_a5_get_base_triangle_vertex(vertexIndex), quintant);
}

fn dggs_a5_get_pentagon_vertex(
  anchor : DggsA5Anchor,
  hilbertResolution : u32,
  vertexIndex : u32
) -> vec2f {
  let flipSum = anchor.flips.x + anchor.flips.y;
  let reflectsY = ((flipSum == -2 || flipSum == 2) && anchor.q > 1u) ||
    (flipSum == 0 && (anchor.q == 0u || anchor.q == 3u));
  let sourceIndex = select(vertexIndex, 4u - vertexIndex, reflectsY);
  var point = dggs_a5_get_base_pentagon_vertex(sourceIndex);

  if (anchor.flips.x == 1 && anchor.flips.y == -1) {
    point = -point;
  }
  if (reflectsY) {
    point.y = -point.y;
  }
  if (anchor.flips.x == -1 && anchor.flips.y == -1) {
    point = -point;
  } else if (anchor.flips.x == -1) {
    point += vec2f(-0.618033988750, 0.449027976580);
  } else if (anchor.flips.y == -1) {
    point += vec2f(0.618033988750, -0.449027976580);
  }

  let translation = vec2f(
    f32(anchor.offset.x) * 0.618033988750 + f32(anchor.offset.y) * 0.618033988750,
    f32(anchor.offset.x) * 0.449027976580 + f32(anchor.offset.y) * -0.449027976580
  );
  point = (point + translation) / f32(1u << hilbertResolution);
  return dggs_a5_rotate_face_point(point, anchor.quintant);
}

fn dggs_a5_get_shape_vertex_count(cell : DggsA5Cell) -> u32 {
  return select(5u, 3u, cell.resolution == 1u);
}

fn dggs_a5_get_reversed_shape_index(vertexIndex : u32, shapeVertexCount : u32) -> u32 {
  if (vertexIndex == 0u || vertexIndex >= shapeVertexCount) {
    return 0u;
  }
  return shapeVertexCount - vertexIndex;
}

fn dggs_a5_get_cell_shape_face_point(index : vec2u, cell : DggsA5Cell, shapeIndex : u32) -> vec2f {
  let anchorInfo = dggs_a5_segment_to_anchor_info(cell);
  if (cell.resolution == 0u) {
    return dggs_a5_get_face_vertex(shapeIndex);
  }
  if (cell.resolution == 1u) {
    return dggs_a5_get_triangle_vertex(anchorInfo.quintant, shapeIndex);
  }
  let anchor = dggs_a5_make_anchor(index, cell, anchorInfo);
  return dggs_a5_get_pentagon_vertex(anchor, cell.hilbertResolution, shapeIndex);
}

fn dggs_a5_get_cell_center_face_point(index : vec2u, cell : DggsA5Cell) -> vec2f {
  let shapeVertexCount = dggs_a5_get_shape_vertex_count(cell);
  var center = vec2f(0.0);
  var vertexIndex = 0u;
  loop {
    if (vertexIndex >= shapeVertexCount) {
      break;
    }
    center += dggs_a5_get_cell_shape_face_point(index, cell, vertexIndex);
    vertexIndex += 1u;
  }
  return center / f32(shapeVertexCount);
}

fn dggs_a5_to_polar(point : vec2f) -> vec2f {
  return vec2f(length(point), atan2(point.y, point.x));
}

fn dggs_a5_to_cartesian(thetaPhi : vec2f) -> vec3f {
  let sinPhi = sin(thetaPhi.y);
  return vec3f(sinPhi * cos(thetaPhi.x), sinPhi * sin(thetaPhi.x), cos(thetaPhi.y));
}

fn dggs_a5_normalize_vec3(point : vec3f) -> vec3f {
  let magnitude = length(point);
  if (magnitude < 1.0e-12) {
    return vec3f(0.0, 0.0, 1.0);
  }
  return point / magnitude;
}

fn dggs_a5_get_face_triangle_index(polar : vec2f) -> u32 {
  return u32(dggs_a5_positive_mod_i32(i32(floor(polar.y / DGGS_PI_OVER_5)), 10));
}

fn dggs_a5_normalize_gamma(gamma : f32) -> f32 {
  let segment = gamma / DGGS_TWO_PI_OVER_5;
  return (segment - round(segment)) * DGGS_TWO_PI_OVER_5;
}

fn dggs_a5_should_reflect(polar : vec2f) -> bool {
  return polar.x * cos(dggs_a5_normalize_gamma(polar.y)) > DGGS_A5_DISTANCE_TO_EDGE;
}

fn dggs_a5_get_base_face_triangle(faceTriangleIndex : u32) -> DggsA5FaceTriangle {
  let quintant = ((faceTriangleIndex + 1u) / 2u) % 5u;
  let center = dggs_a5_get_triangle_vertex(quintant, 0u);
  let corner1 = dggs_a5_get_triangle_vertex(quintant, 1u);
  let corner2 = dggs_a5_get_triangle_vertex(quintant, 2u);
  let edgeMidpoint = (corner1 + corner2) * 0.5;
  if ((faceTriangleIndex & 1u) == 0u) {
    return DggsA5FaceTriangle(center, edgeMidpoint, corner1);
  }
  return DggsA5FaceTriangle(center, corner2, edgeMidpoint);
}

fn dggs_a5_get_face_triangle_vertex(triangle : DggsA5FaceTriangle, vertexIndex : u32) -> vec2f {
  if (vertexIndex == 0u) {
    return triangle.a;
  }
  if (vertexIndex == 1u) {
    return triangle.b;
  }
  return triangle.c;
}

fn dggs_a5_get_reflected_face_triangle(
  faceTriangleIndex : u32,
  squashed : bool
) -> DggsA5FaceTriangle {
  let baseTriangle = dggs_a5_get_base_face_triangle(faceTriangleIndex);
  let even = (faceTriangleIndex & 1u) == 0u;
  let midpoint = select(baseTriangle.c, baseTriangle.b, even);
  let scale = select(2.0, DGGS_A5_REFLECTED_TRIANGLE_SCALE, squashed);
  let reflectedA = -baseTriangle.a + midpoint * scale;
  return DggsA5FaceTriangle(reflectedA, baseTriangle.c, baseTriangle.b);
}

fn dggs_a5_get_face_triangle(
  faceTriangleIndex : u32,
  reflected : bool,
  squashed : bool
) -> DggsA5FaceTriangle {
  if (reflected) {
    return dggs_a5_get_reflected_face_triangle(faceTriangleIndex, squashed);
  }
  return dggs_a5_get_base_face_triangle(faceTriangleIndex);
}

fn dggs_a5_face_triangle_to_spherical_triangle(
  faceTriangleIndex : u32,
  origin : u32,
  reflected : bool
) -> DggsA5SphericalTriangle {
  let faceTriangle = dggs_a5_get_face_triangle(faceTriangleIndex, reflected, true);
  let originAngle = dggs_a5_get_origin_angle(origin);
  let quaternion = dggs_a5_get_origin_quaternion(origin);

  let polarA = dggs_a5_to_polar(faceTriangle.a);
  let polarB = dggs_a5_to_polar(faceTriangle.b);
  let polarC = dggs_a5_to_polar(faceTriangle.c);
  let sphericalA = dggs_a5_quaternion_rotate(
    dggs_a5_to_cartesian(vec2f(polarA.y + originAngle, atan(polarA.x))),
    quaternion
  );
  let sphericalB = dggs_a5_quaternion_rotate(
    dggs_a5_to_cartesian(vec2f(polarB.y + originAngle, atan(polarB.x))),
    quaternion
  );
  let sphericalC = dggs_a5_quaternion_rotate(
    dggs_a5_to_cartesian(vec2f(polarC.y + originAngle, atan(polarC.x))),
    quaternion
  );
  return DggsA5SphericalTriangle(
    dggs_a5_normalize_vec3(sphericalA),
    dggs_a5_normalize_vec3(sphericalB),
    dggs_a5_normalize_vec3(sphericalC)
  );
}

fn dggs_a5_face_to_barycentric(point : vec2f, triangle : DggsA5FaceTriangle) -> vec3f {
  let d31 = triangle.a - triangle.c;
  let d23 = triangle.c - triangle.b;
  let d3p = point - triangle.c;
  let determinant = d23.x * d31.y - d23.y * d31.x;
  if (abs(determinant) < 1.0e-12) {
    return vec3f(1.0, 0.0, 0.0);
  }
  let b0 = (d23.x * d3p.y - d23.y * d3p.x) / determinant;
  let b1 = (d31.x * d3p.y - d31.y * d3p.x) / determinant;
  return vec3f(b0, b1, 1.0 - (b0 + b1));
}

fn dggs_a5_triangle_area(a : vec3f, b : vec3f, c : vec3f) -> f32 {
  let midA = dggs_a5_normalize_vec3((b + c) * 0.5);
  let midB = dggs_a5_normalize_vec3((c + a) * 0.5);
  let midC = dggs_a5_normalize_vec3((a + b) * 0.5);
  let tripleProduct = dot(midA, cross(midB, midC));
  let clamped = clamp(tripleProduct, -1.0, 1.0);
  if (abs(clamped) < 1.0e-8) {
    return 2.0 * clamped;
  }
  return asin(clamped) * 2.0;
}

fn dggs_a5_spherical_triangle_area(triangle : DggsA5SphericalTriangle) -> f32 {
  return dggs_a5_triangle_area(triangle.a, triangle.b, triangle.c);
}

fn dggs_a5_vector_difference(a : vec3f, b : vec3f) -> f32 {
  let midpoint = dggs_a5_normalize_vec3((a + b) * 0.5);
  let crossProduct = cross(a, midpoint);
  let distance = length(crossProduct);
  if (distance < 1.0e-8) {
    return 0.5 * length(a - b);
  }
  return distance;
}

fn dggs_a5_slerp(a : vec3f, b : vec3f, t : f32) -> vec3f {
  let cosineGamma = clamp(dot(a, b), -1.0, 1.0);
  let gamma = acos(cosineGamma);
  if (gamma < 1.0e-8) {
    return dggs_a5_normalize_vec3(mix(a, b, t));
  }
  let sinGamma = sin(gamma);
  if (abs(sinGamma) < 1.0e-8) {
    return dggs_a5_normalize_vec3(mix(a, b, t));
  }
  let weightA = sin((1.0 - t) * gamma) / sinGamma;
  let weightB = sin(t * gamma) / sinGamma;
  return dggs_a5_normalize_vec3(weightA * a + weightB * b);
}

fn dggs_a5_safe_acos(value : f32) -> f32 {
  if (value < 1.0e-3) {
    return 2.0 * value + value * value * value / 3.0;
  }
  return acos(clamp(1.0 - 2.0 * value * value, -1.0, 1.0));
}

fn dggs_a5_polyhedral_inverse_edge(a : vec3f, b : vec3f, edgeHeight : f32) -> vec3f {
  let difference = dggs_a5_vector_difference(a, b);
  let denominator = max(dggs_a5_safe_acos(difference), 1.0e-8);
  let interpolation = dggs_a5_safe_acos(clamp(edgeHeight, 0.0, 1.0) * difference) / denominator;
  return dggs_a5_slerp(a, b, clamp(interpolation, 0.0, 1.0));
}

fn dggs_a5_polyhedral_inverse(
  facePoint : vec2f,
  faceTriangle : DggsA5FaceTriangle,
  sphericalTriangle : DggsA5SphericalTriangle
) -> vec3f {
  let barycentric = dggs_a5_face_to_barycentric(facePoint, faceTriangle);
  if (barycentric.x > 0.9999999) {
    return sphericalTriangle.a;
  }
  if (barycentric.y > 0.9999999) {
    return sphericalTriangle.b;
  }
  if (barycentric.z > 0.9999999) {
    return sphericalTriangle.c;
  }
  if (abs(barycentric.z) < 1.0e-6) {
    return dggs_a5_polyhedral_inverse_edge(
      sphericalTriangle.a,
      sphericalTriangle.b,
      1.0 - barycentric.x
    );
  }
  if (abs(barycentric.y) < 1.0e-6) {
    return dggs_a5_polyhedral_inverse_edge(
      sphericalTriangle.a,
      sphericalTriangle.c,
      1.0 - barycentric.x
    );
  }

  let crossBC = cross(sphericalTriangle.b, sphericalTriangle.c);
  let areaABC = dggs_a5_spherical_triangle_area(sphericalTriangle);
  let h = max(1.0 - barycentric.x, 1.0e-8);
  let areaRatio = barycentric.z / h;
  let alpha = areaRatio * areaABC;
  let sineAlpha = sin(alpha);
  let halfSineAlpha = sin(alpha * 0.5);
  let chordCoefficient = 2.0 * halfSineAlpha * halfSineAlpha;
  let dotAB = dot(sphericalTriangle.a, sphericalTriangle.b);
  let dotBC = dot(sphericalTriangle.b, sphericalTriangle.c);
  let dotCA = dot(sphericalTriangle.c, sphericalTriangle.a);
  let lengthBC = length(crossBC);
  let volume = dot(sphericalTriangle.a, crossBC);
  let f = sineAlpha * volume + chordCoefficient * (dotAB * dotBC - dotCA);
  let g = chordCoefficient * lengthBC * (1.0 + dotAB);
  let edgeAngle = max(acos(clamp(dotBC, -1.0, 1.0)), 1.0e-8);
  let q = 2.0 / edgeAngle * atan2(g, f);
  let pointOnBC = dggs_a5_slerp(sphericalTriangle.b, sphericalTriangle.c, q);
  let k = dggs_a5_vector_difference(sphericalTriangle.a, pointOnBC);
  let denominator = max(dggs_a5_safe_acos(k), 1.0e-8);
  let t = dggs_a5_safe_acos(h * k) / denominator;
  return dggs_a5_slerp(sphericalTriangle.a, pointOnBC, t);
}

fn dggs_a5_authalic_inverse(phi : f32) -> f32 {
  let sinPhi = sin(phi);
  let cosPhi = cos(phi);
  let coefficientX = 2.0 * (cosPhi - sinPhi) * (cosPhi + sinPhi);
  var u0 = coefficientX * 4.92842354825238055e-17 + 2.19128723067677184e-14;
  var u1 = coefficientX * u0 + 1.02018123778161003e-11;
  u0 = coefficientX * u1 - u0 + 5.08622073997266026e-9;
  u1 = coefficientX * u0 - u1 + 0.00000288319780486075558;
  u0 = coefficientX * u1 - u0 + 0.00223920899635416575;
  return phi + 2.0 * sinPhi * cosPhi * u0;
}

fn dggs_a5_normalize_longitude(longitude : f32) -> f32 {
  var result = longitude;
  loop {
    if (result < -180.0) {
      result += 360.0;
    } else {
      break;
    }
  }
  loop {
    if (result >= 180.0) {
      result -= 360.0;
    } else {
      break;
    }
  }
  return result;
}

fn dggs_a5_normalize_longitude_to_center(longitude : f32, centerLongitude : f32) -> f32 {
  var result = longitude;
  loop {
    if (result - centerLongitude > 180.0) {
      result -= 360.0;
    } else {
      break;
    }
  }
  loop {
    if (result - centerLongitude < -180.0) {
      result += 360.0;
    } else {
      break;
    }
  }
  return result;
}

fn dggs_a5_sphere_to_lnglat(cartesian : vec3f) -> vec2f {
  let point = dggs_a5_normalize_vec3(cartesian);
  let theta = atan2(point.y, point.x);
  let phi = acos(clamp(point.z, -1.0, 1.0));
  let longitude = dggs_a5_normalize_longitude(theta * DGGS_RADIANS_TO_DEGREES - DGGS_A5_LONGITUDE_OFFSET);
  let authalicLatitude = DGGS_PI_OVER_2 - phi;
  let latitude = dggs_a5_authalic_inverse(authalicLatitude) * DGGS_RADIANS_TO_DEGREES;
  return vec2f(longitude, latitude);
}

fn dggs_a5_face_to_lnglat(facePoint : vec2f, origin : u32) -> vec2f {
  let polar = dggs_a5_to_polar(facePoint);
  let faceTriangleIndex = dggs_a5_get_face_triangle_index(polar);
  let reflected = dggs_a5_should_reflect(polar);
  let faceTriangle = dggs_a5_get_face_triangle(faceTriangleIndex, reflected, false);
  let sphericalTriangle = dggs_a5_face_triangle_to_spherical_triangle(
    faceTriangleIndex,
    origin,
    reflected
  );
  return dggs_a5_sphere_to_lnglat(
    dggs_a5_polyhedral_inverse(facePoint, faceTriangle, sphericalTriangle)
  );
}

fn dggs_a5_get_boundary_point(index : vec2u, vertexIndex : u32) -> vec2f {
  let cell = dggs_a5_deserialize(index);
  if (cell.valid == 0u || dggs_u64_is_zero(index)) {
    return vec2f(0.0);
  }

  let shapeVertexCount = dggs_a5_get_shape_vertex_count(cell);
  let shapeIndex = dggs_a5_get_reversed_shape_index(vertexIndex, shapeVertexCount);
  let facePoint = dggs_a5_get_cell_shape_face_point(index, cell, shapeIndex);
  let centerPoint = dggs_a5_get_cell_center_face_point(index, cell);
  var lngLat = dggs_a5_face_to_lnglat(facePoint, cell.origin);
  let centerLngLat = dggs_a5_face_to_lnglat(centerPoint, cell.origin);
  lngLat.x = dggs_a5_normalize_longitude_to_center(lngLat.x, centerLngLat.x);
  return lngLat;
}

fn dggs_a5_get_boundary_point_fp64_split(index : vec2u, vertexIndex : u32) -> vec4f {
  return dggs_boundary_point_to_fp64_split(dggs_a5_get_boundary_point(index, vertexIndex));
}

fn dggs_h3_get_mode(index: vec2u) -> u32 {
  return dggs_u64_extract_bits(index, 59u, 4u);
}

fn dggs_h3_is_cell_mode(index: vec2u) -> bool {
  return dggs_h3_get_mode(index) == DGGS_H3_CELL_MODE;
}

fn dggs_h3_get_resolution(index: vec2u) -> u32 {
  return dggs_u64_extract_bits(index, 52u, 4u);
}

fn dggs_h3_get_base_cell(index: vec2u) -> u32 {
  return dggs_u64_extract_bits(index, 45u, 7u);
}

fn dggs_h3_digit_bit_offset(resolution: u32) -> u32 {
  return 3u * (DGGS_H3_MAX_RESOLUTION - resolution);
}

fn dggs_h3_get_digit(index: vec2u, resolution: u32) -> u32 {
  if (resolution == 0u || resolution > DGGS_H3_MAX_RESOLUTION) {
    return DGGS_H3_UNUSED_DIGIT;
  }
  return dggs_u64_extract_bits(index, dggs_h3_digit_bit_offset(resolution), 3u);
}

fn dggs_h3_is_valid_cell_id(index: vec2u) -> bool {
  let cellResolution = dggs_h3_get_resolution(index);
  if (
    !dggs_h3_is_cell_mode(index) ||
    cellResolution > DGGS_H3_MAX_RESOLUTION ||
    dggs_h3_get_base_cell(index) > DGGS_H3_MAX_BASE_CELL
  ) {
    return false;
  }

  var digitResolution = 1u;
  loop {
    if (digitResolution > DGGS_H3_MAX_RESOLUTION) {
      break;
    }

    let digit = dggs_h3_get_digit(index, digitResolution);
    if (digitResolution <= cellResolution) {
      if (digit == DGGS_H3_UNUSED_DIGIT) {
        return false;
      }
    } else if (digit != DGGS_H3_UNUSED_DIGIT) {
      return false;
    }
    digitResolution += 1u;
  }
  return true;
}

fn dggs_h3_get_parent(index: vec2u, parentResolution: u32) -> vec2u {
  let currentResolution = dggs_h3_get_resolution(index);
  let targetResolution = min(parentResolution, currentResolution);
  var parent = dggs_u64_set_bits(index, 52u, 4u, targetResolution);
  var resolution = targetResolution + 1u;
  loop {
    if (resolution > DGGS_H3_MAX_RESOLUTION) {
      break;
    }
    parent = dggs_u64_set_bits(
      parent,
      dggs_h3_digit_bit_offset(resolution),
      3u,
      DGGS_H3_UNUSED_DIGIT
    );
    resolution += 1u;
  }
  return parent;
}

fn dggs_h3_positive_angle_rads(angle: f32) -> f32 {
  var result = angle;
  if (result < 0.0) {
    result += DGGS_TWO_PI;
  }
  if (result >= DGGS_TWO_PI) {
    result -= DGGS_TWO_PI;
  }
  return result;
}

fn dggs_h3_constrain_longitude(longitude: f32) -> f32 {
  var result = longitude;
  loop {
    if (result <= DGGS_PI) {
      break;
    }
    result -= DGGS_TWO_PI;
  }
  loop {
    if (result >= -DGGS_PI) {
      break;
    }
    result += DGGS_TWO_PI;
  }
  return result;
}

fn dggs_h3_is_resolution_class_iii(resolution: u32) -> bool {
  return (resolution & 1u) != 0u;
}

fn dggs_h3_is_base_cell_pentagon(baseCell: u32) -> bool {
  return baseCell == 4u ||
    baseCell == 14u ||
    baseCell == 24u ||
    baseCell == 38u ||
    baseCell == 49u ||
    baseCell == 58u ||
    baseCell == 63u ||
    baseCell == 72u ||
    baseCell == 83u ||
    baseCell == 97u ||
    baseCell == 107u ||
    baseCell == 117u;
}

fn dggs_h3_get_base_cell_home(baseCell: u32) -> DggsH3FaceIJK {
  let values = array<vec4i, 122>(
    vec4i(1, 1, 0, 0),
    vec4i(2, 1, 1, 0),
    vec4i(1, 0, 0, 0),
    vec4i(2, 1, 0, 0),
    vec4i(0, 2, 0, 0),
    vec4i(1, 1, 1, 0),
    vec4i(1, 0, 0, 1),
    vec4i(2, 0, 0, 0),
    vec4i(0, 1, 0, 0),
    vec4i(2, 0, 1, 0),
    vec4i(1, 0, 1, 0),
    vec4i(1, 0, 1, 1),
    vec4i(3, 1, 0, 0),
    vec4i(3, 1, 1, 0),
    vec4i(11, 2, 0, 0),
    vec4i(4, 1, 0, 0),
    vec4i(0, 0, 0, 0),
    vec4i(6, 0, 1, 0),
    vec4i(0, 0, 0, 1),
    vec4i(2, 0, 1, 1),
    vec4i(7, 0, 0, 1),
    vec4i(2, 0, 0, 1),
    vec4i(0, 1, 1, 0),
    vec4i(6, 0, 0, 1),
    vec4i(10, 2, 0, 0),
    vec4i(6, 0, 0, 0),
    vec4i(3, 0, 0, 0),
    vec4i(11, 1, 0, 0),
    vec4i(4, 1, 1, 0),
    vec4i(3, 0, 1, 0),
    vec4i(0, 0, 1, 1),
    vec4i(4, 0, 0, 0),
    vec4i(5, 0, 1, 0),
    vec4i(0, 0, 1, 0),
    vec4i(7, 0, 1, 0),
    vec4i(11, 1, 1, 0),
    vec4i(7, 0, 0, 0),
    vec4i(10, 1, 0, 0),
    vec4i(12, 2, 0, 0),
    vec4i(6, 1, 0, 1),
    vec4i(7, 1, 0, 1),
    vec4i(4, 0, 0, 1),
    vec4i(3, 0, 0, 1),
    vec4i(3, 0, 1, 1),
    vec4i(4, 0, 1, 0),
    vec4i(6, 1, 0, 0),
    vec4i(11, 0, 0, 0),
    vec4i(8, 0, 0, 1),
    vec4i(5, 0, 0, 1),
    vec4i(14, 2, 0, 0),
    vec4i(5, 0, 0, 0),
    vec4i(12, 1, 0, 0),
    vec4i(10, 1, 1, 0),
    vec4i(4, 0, 1, 1),
    vec4i(12, 1, 1, 0),
    vec4i(7, 1, 0, 0),
    vec4i(11, 0, 1, 0),
    vec4i(10, 0, 0, 0),
    vec4i(13, 2, 0, 0),
    vec4i(10, 0, 0, 1),
    vec4i(11, 0, 0, 1),
    vec4i(9, 0, 1, 0),
    vec4i(8, 0, 1, 0),
    vec4i(6, 2, 0, 0),
    vec4i(8, 0, 0, 0),
    vec4i(9, 0, 0, 1),
    vec4i(14, 1, 0, 0),
    vec4i(5, 1, 0, 1),
    vec4i(16, 0, 1, 1),
    vec4i(8, 1, 0, 1),
    vec4i(5, 1, 0, 0),
    vec4i(12, 0, 0, 0),
    vec4i(7, 2, 0, 0),
    vec4i(12, 0, 1, 0),
    vec4i(10, 0, 1, 0),
    vec4i(9, 0, 0, 0),
    vec4i(13, 1, 0, 0),
    vec4i(16, 0, 0, 1),
    vec4i(15, 0, 1, 1),
    vec4i(15, 0, 1, 0),
    vec4i(16, 0, 1, 0),
    vec4i(14, 1, 1, 0),
    vec4i(13, 1, 1, 0),
    vec4i(5, 2, 0, 0),
    vec4i(8, 1, 0, 0),
    vec4i(14, 0, 0, 0),
    vec4i(9, 1, 0, 1),
    vec4i(14, 0, 0, 1),
    vec4i(17, 0, 0, 1),
    vec4i(12, 0, 0, 1),
    vec4i(16, 0, 0, 0),
    vec4i(17, 0, 1, 1),
    vec4i(15, 0, 0, 1),
    vec4i(16, 1, 0, 1),
    vec4i(9, 1, 0, 0),
    vec4i(15, 0, 0, 0),
    vec4i(13, 0, 0, 0),
    vec4i(8, 2, 0, 0),
    vec4i(13, 0, 1, 0),
    vec4i(17, 1, 0, 1),
    vec4i(19, 0, 1, 0),
    vec4i(14, 0, 1, 0),
    vec4i(19, 0, 1, 1),
    vec4i(17, 0, 1, 0),
    vec4i(13, 0, 0, 1),
    vec4i(17, 0, 0, 0),
    vec4i(16, 1, 0, 0),
    vec4i(9, 2, 0, 0),
    vec4i(15, 1, 0, 1),
    vec4i(15, 1, 0, 0),
    vec4i(18, 0, 1, 1),
    vec4i(18, 0, 0, 1),
    vec4i(19, 0, 0, 1),
    vec4i(17, 1, 0, 0),
    vec4i(19, 0, 0, 0),
    vec4i(18, 0, 1, 0),
    vec4i(18, 1, 0, 1),
    vec4i(19, 2, 0, 0),
    vec4i(19, 1, 0, 0),
    vec4i(18, 0, 0, 0),
    vec4i(19, 1, 0, 1),
    vec4i(18, 1, 0, 0)
  );
  let value = values[min(baseCell, DGGS_H3_MAX_BASE_CELL)];
  return DggsH3FaceIJK(
    u32(value.x),
    value.yzw,
    select(1u, 0u, baseCell > DGGS_H3_MAX_BASE_CELL)
  );
}

fn dggs_h3_get_face_center_geo(face: u32) -> vec2f {
  let values = array<vec2f, 20>(
    vec2f(0.803582649718989942, 1.248397419617396099),
    vec2f(1.307747883455638156, 2.536945009877921159),
    vec2f(1.054751253523952054, -1.347517358900396623),
    vec2f(0.600191595538186799, -0.450603909469755746),
    vec2f(0.491715428198773866, 0.401988202911306943),
    vec2f(0.172745327415618701, 1.678146885280433686),
    vec2f(0.605929321571350690, 2.953923329812411617),
    vec2f(0.427370518328979641, -1.888876200336285401),
    vec2f(-0.079066118549212831, -0.733429513380867741),
    vec2f(-0.230961644455383637, 0.506495587332349035),
    vec2f(0.079066118549212831, 2.408163140208925497),
    vec2f(0.230961644455383637, -2.635097066257444203),
    vec2f(-0.172745327415618701, -1.463445768309359553),
    vec2f(-0.605929321571350690, -0.187669323777381622),
    vec2f(-0.427370518328979641, 1.252716453253507838),
    vec2f(-0.600191595538186799, 2.690988744120037492),
    vec2f(-0.491715428198773866, -2.739604450678486295),
    vec2f(-0.803582649718989942, -1.893195233972397139),
    vec2f(-1.307747883455638156, -0.604647643711872080),
    vec2f(-1.054751253523952054, 1.794075294689396615)
  );
  return values[min(face, 19u)];
}

fn dggs_h3_get_face_axis_azimuths(face: u32) -> vec3f {
  let values = array<vec3f, 20>(
    vec3f(5.619958268523939882, 3.525563166130744542, 1.431168063737548730),
    vec3f(5.760339081714187279, 3.665943979320991689, 1.571548876927796127),
    vec3f(0.780213654393430055, 4.969003859179821079, 2.874608756786625655),
    vec3f(0.430469363979999913, 4.619259568766391033, 2.524864466373195467),
    vec3f(6.130269123335111400, 4.035874020941915804, 1.941478918548720291),
    vec3f(2.692877706530642877, 0.598482604137447119, 4.787272808923838195),
    vec3f(2.982963003477243874, 0.888567901084048369, 5.077358105870439581),
    vec3f(3.532912002790141181, 1.438516900396945656, 5.627307105183336758),
    vec3f(3.494305004259568154, 1.399909901866372864, 5.588700106652763840),
    vec3f(3.003214169499538391, 0.908819067106342928, 5.097609271892733906),
    vec3f(5.930472956509811562, 3.836077854116615875, 1.741682751723420374),
    vec3f(0.138378484090254847, 4.327168688876645809, 2.232773586483450311),
    vec3f(0.448714947059150361, 4.637505151845541521, 2.543110049452346120),
    vec3f(0.158629650112549365, 4.347419854898940135, 2.253024752505744869),
    vec3f(5.891865957979238535, 3.797470855586042958, 1.703075753192847583),
    vec3f(2.711123289609793325, 0.616728187216597771, 4.805518392002988683),
    vec3f(3.294508837434268316, 1.200113735041072948, 5.388903939827463911),
    vec3f(3.804819692245439833, 1.710424589852244509, 5.899214794638635174),
    vec3f(3.664438879055192436, 1.570043776661997111, 5.758833981448388027),
    vec3f(2.361378999196363184, 0.266983896803167583, 4.455774101589558636)
  );
  return values[min(face, 19u)];
}

fn dggs_h3_get_max_dim_by_cii_resolution(resolution: u32) -> i32 {
  let values = array<i32, 17>(
    2, -1, 14, -1, 98, -1, 686, -1, 4802, -1, 33614, -1, 235298, -1, 1647086, -1, 11529602
  );
  return values[min(resolution, 16u)];
}

fn dggs_h3_get_unit_vector(digit: u32) -> vec3i {
  if (digit == 1u) {
    return vec3i(0, 0, 1);
  }
  if (digit == 2u) {
    return vec3i(0, 1, 0);
  }
  if (digit == 3u) {
    return vec3i(0, 1, 1);
  }
  if (digit == 4u) {
    return vec3i(1, 0, 0);
  }
  if (digit == 5u) {
    return vec3i(1, 0, 1);
  }
  if (digit == 6u) {
    return vec3i(1, 1, 0);
  }
  return vec3i(0);
}

fn dggs_h3_ijk_normalize(coord: vec3i) -> vec3i {
  var normalized = coord;
  if (normalized.x < 0) {
    normalized.y -= normalized.x;
    normalized.z -= normalized.x;
    normalized.x = 0;
  }
  if (normalized.y < 0) {
    normalized.x -= normalized.y;
    normalized.z -= normalized.y;
    normalized.y = 0;
  }
  if (normalized.z < 0) {
    normalized.x -= normalized.z;
    normalized.y -= normalized.z;
    normalized.z = 0;
  }

  let minimumValue = min(normalized.x, min(normalized.y, normalized.z));
  if (minimumValue > 0) {
    normalized -= vec3i(minimumValue);
  }
  return normalized;
}

fn dggs_h3_neighbor(coord: vec3i, digit: u32) -> vec3i {
  if (digit > 0u && digit < DGGS_H3_UNUSED_DIGIT) {
    return dggs_h3_ijk_normalize(coord + dggs_h3_get_unit_vector(digit));
  }
  return coord;
}

fn dggs_h3_down_ap3(coord: vec3i) -> vec3i {
  let iVector = vec3i(2, 0, 1) * coord.x;
  let jVector = vec3i(1, 2, 0) * coord.y;
  let kVector = vec3i(0, 1, 2) * coord.z;
  return dggs_h3_ijk_normalize(iVector + jVector + kVector);
}

fn dggs_h3_down_ap3r(coord: vec3i) -> vec3i {
  let iVector = vec3i(2, 1, 0) * coord.x;
  let jVector = vec3i(0, 2, 1) * coord.y;
  let kVector = vec3i(1, 0, 2) * coord.z;
  return dggs_h3_ijk_normalize(iVector + jVector + kVector);
}

fn dggs_h3_down_ap7(coord: vec3i) -> vec3i {
  let iVector = vec3i(3, 0, 1) * coord.x;
  let jVector = vec3i(1, 3, 0) * coord.y;
  let kVector = vec3i(0, 1, 3) * coord.z;
  return dggs_h3_ijk_normalize(iVector + jVector + kVector);
}

fn dggs_h3_down_ap7r(coord: vec3i) -> vec3i {
  let iVector = vec3i(3, 1, 0) * coord.x;
  let jVector = vec3i(0, 3, 1) * coord.y;
  let kVector = vec3i(1, 0, 3) * coord.z;
  return dggs_h3_ijk_normalize(iVector + jVector + kVector);
}

fn dggs_h3_get_center_face_ijk(index: vec2u) -> DggsH3FaceIJK {
  if (!dggs_h3_is_valid_cell_id(index)) {
    return DggsH3FaceIJK(0u, vec3i(0), 0u);
  }

  let baseCell = dggs_h3_get_base_cell(index);
  if (dggs_h3_is_base_cell_pentagon(baseCell)) {
    return DggsH3FaceIJK(0u, vec3i(0), 0u);
  }

  var faceIJK = dggs_h3_get_base_cell_home(baseCell);
  let cellResolution = dggs_h3_get_resolution(index);
  var resolution = 1u;
  loop {
    if (resolution > cellResolution) {
      break;
    }

    if (dggs_h3_is_resolution_class_iii(resolution)) {
      faceIJK.coord = dggs_h3_down_ap7(faceIJK.coord);
    } else {
      faceIJK.coord = dggs_h3_down_ap7r(faceIJK.coord);
    }
    faceIJK.coord = dggs_h3_neighbor(faceIJK.coord, dggs_h3_get_digit(index, resolution));
    resolution += 1u;
  }

  return faceIJK;
}

fn dggs_h3_get_vertex_offset(resolution: u32, vertexIndex: u32) -> vec3i {
  let pointIndex = vertexIndex % 6u;
  if (dggs_h3_is_resolution_class_iii(resolution)) {
    let vertices = array<vec3i, 6>(
      vec3i(5, 4, 0),
      vec3i(1, 5, 0),
      vec3i(0, 5, 4),
      vec3i(0, 1, 5),
      vec3i(4, 0, 5),
      vec3i(5, 0, 1)
    );
    return vertices[pointIndex];
  }

  let vertices = array<vec3i, 6>(
    vec3i(2, 1, 0),
    vec3i(1, 2, 0),
    vec3i(0, 2, 1),
    vec3i(0, 1, 2),
    vec3i(1, 0, 2),
    vec3i(2, 0, 1)
  );
  return vertices[pointIndex];
}

fn dggs_h3_get_boundary_vertex(index: vec2u, vertexIndex: u32) -> DggsH3BoundaryVertex {
  let center = dggs_h3_get_center_face_ijk(index);
  if (center.valid == 0u) {
    return DggsH3BoundaryVertex(0u, vec3i(0), 0u, 0u);
  }

  let cellResolution = dggs_h3_get_resolution(index);
  var adjustedResolution = cellResolution;
  var centerCoord = dggs_h3_down_ap3r(dggs_h3_down_ap3(center.coord));
  if (dggs_h3_is_resolution_class_iii(cellResolution)) {
    centerCoord = dggs_h3_down_ap7r(centerCoord);
    adjustedResolution += 1u;
  }

  let vertexCoord = dggs_h3_ijk_normalize(
    centerCoord + dggs_h3_get_vertex_offset(cellResolution, vertexIndex)
  );
  let maximumDimension = dggs_h3_get_max_dim_by_cii_resolution(adjustedResolution) * 3;
  let vertexDimension = vertexCoord.x + vertexCoord.y + vertexCoord.z;
  if (vertexDimension >= maximumDimension) {
    return DggsH3BoundaryVertex(center.face, vertexCoord, adjustedResolution, 0u);
  }

  return DggsH3BoundaryVertex(center.face, vertexCoord, adjustedResolution, 1u);
}

fn dggs_h3_is_single_face_boundary(index: vec2u) -> bool {
  var vertexIndex = 0u;
  loop {
    if (vertexIndex >= 6u) {
      break;
    }
    if (dggs_h3_get_boundary_vertex(index, vertexIndex).valid == 0u) {
      return false;
    }
    vertexIndex += 1u;
  }
  return true;
}

fn dggs_h3_ijk_to_hex2d(coord: vec3i) -> vec2f {
  let i = f32(coord.x - coord.z);
  let j = f32(coord.y - coord.z);
  return vec2f(i - 0.5 * j, j * DGGS_H3_SQRT3_2);
}

fn dggs_h3_geo_az_distance_rads(center: vec2f, azimuth: f32, distance: f32) -> vec2f {
  if (distance < 1.0e-7) {
    return center;
  }

  let positiveAzimuth = dggs_h3_positive_angle_rads(azimuth);
  let latitude = asin(clamp(
    sin(center.x) * cos(distance) + cos(center.x) * sin(distance) * cos(positiveAzimuth),
    -1.0,
    1.0
  ));
  var longitude = 0.0;
  if (abs(latitude - DGGS_PI_OVER_2) < 1.0e-7) {
    return vec2f(DGGS_PI_OVER_2, 0.0);
  }
  if (abs(latitude + DGGS_PI_OVER_2) < 1.0e-7) {
    return vec2f(-DGGS_PI_OVER_2, 0.0);
  }

  let inverseCosLatitude = 1.0 / max(cos(latitude), 1.0e-8);
  let sinLongitude = clamp(
    sin(positiveAzimuth) * sin(distance) * inverseCosLatitude,
    -1.0,
    1.0
  );
  let cosLongitude = clamp(
    (cos(distance) - sin(center.x) * sin(latitude)) / max(cos(center.x), 1.0e-8) *
      inverseCosLatitude,
    -1.0,
    1.0
  );
  longitude = dggs_h3_constrain_longitude(center.y + atan2(sinLongitude, cosLongitude));
  return vec2f(latitude, longitude);
}

fn dggs_h3_hex2d_to_lnglat(point: vec2f, face: u32, resolution: u32, substrate: bool) -> vec2f {
  var radius = length(point);
  let center = dggs_h3_get_face_center_geo(face);
  if (radius < 1.0e-7) {
    return vec2f(center.y * DGGS_RADIANS_TO_DEGREES, center.x * DGGS_RADIANS_TO_DEGREES);
  }

  var theta = atan2(point.y, point.x);
  var resolutionIndex = 0u;
  loop {
    if (resolutionIndex >= resolution) {
      break;
    }
    radius *= DGGS_H3_RSQRT7;
    resolutionIndex += 1u;
  }

  if (substrate) {
    radius *= DGGS_H3_ONETHIRD;
    if (dggs_h3_is_resolution_class_iii(resolution)) {
      radius *= DGGS_H3_RSQRT7;
    }
  } else if (dggs_h3_is_resolution_class_iii(resolution)) {
    theta = dggs_h3_positive_angle_rads(theta + DGGS_H3_AP7_ROT_RADS);
  }

  radius = atan(radius * DGGS_H3_RES0_U_GNOMONIC);
  theta = dggs_h3_positive_angle_rads(dggs_h3_get_face_axis_azimuths(face).x - theta);
  let latitudeLongitude = dggs_h3_geo_az_distance_rads(center, theta, radius);
  return vec2f(
    latitudeLongitude.y * DGGS_RADIANS_TO_DEGREES,
    latitudeLongitude.x * DGGS_RADIANS_TO_DEGREES
  );
}

fn dggs_h3_get_boundary_point(index: vec2u, vertexIndex: u32) -> vec2f {
  if (!dggs_h3_is_single_face_boundary(index)) {
    return vec2f(0.0);
  }

  let vertex = dggs_h3_get_boundary_vertex(index, vertexIndex % 6u);
  let hexPoint = dggs_h3_ijk_to_hex2d(vertex.coord);
  return dggs_h3_hex2d_to_lnglat(hexPoint, vertex.face, vertex.resolution, true);
}

fn dggs_h3_get_boundary_point_fp64_split(index: vec2u, vertexIndex: u32) -> vec4f {
  return dggs_boundary_point_to_fp64_split(dggs_h3_get_boundary_point(index, vertexIndex));
}

fn dggs_s2_get_face(index: vec2u) -> u32 {
  return dggs_u64_extract_bits(index, 61u, 3u);
}

fn dggs_s2_get_level(index: vec2u) -> u32 {
  let trailingZeros = dggs_u64_count_trailing_zeros(index);
  if (trailingZeros > 60u) {
    return 0u;
  }
  return DGGS_S2_MAX_LEVEL - trailingZeros / 2u;
}

fn dggs_s2_is_valid_cell_id(index: vec2u) -> bool {
  let trailingZeros = dggs_u64_count_trailing_zeros(index);
  return !dggs_u64_is_zero(index) &&
    dggs_s2_get_face(index) <= 5u &&
    trailingZeros <= 60u &&
    trailingZeros % 2u == 0u;
}

fn dggs_s2_get_child_position(index: vec2u, level: u32) -> u32 {
  if (level == 0u || level > DGGS_S2_MAX_LEVEL) {
    return 0u;
  }
  return dggs_u64_extract_bits(index, 2u * (DGGS_S2_MAX_LEVEL - level) + 1u, 2u);
}

// Packed geohash keys store the geohash length in bits 60..63 and right-align
// the base32 character codes in the lower 60 bits, first character first.
fn dggs_geohash_get_length(index: vec2u) -> u32 {
  return min(
    dggs_u64_extract_bits(index, DGGS_GEOHASH_LENGTH_BIT_OFFSET, 4u),
    DGGS_GEOHASH_MAX_LENGTH
  );
}

fn dggs_geohash_get_character(index: vec2u, characterIndex: u32) -> u32 {
  let length = dggs_geohash_get_length(index);
  if (characterIndex >= length) {
    return 0u;
  }
  return dggs_u64_extract_bits(index, 5u * (length - characterIndex - 1u), 5u);
}

// Returns vec4(west, south, east, north) in longitude/latitude degrees.
fn dggs_geohash_get_bounds(index: vec2u) -> vec4f {
  let length = dggs_geohash_get_length(index);
  var west = -180.0;
  var east = 180.0;
  var south = -90.0;
  var north = 90.0;
  var isLongitude = true;
  var characterIndex = 0u;
  loop {
    if (characterIndex >= length) {
      break;
    }

    let character = dggs_geohash_get_character(index, characterIndex);
    var bitIndex = 0u;
    loop {
      if (bitIndex >= 5u) {
        break;
      }

      let bit = (character >> (4u - bitIndex)) & 1u;
      if (isLongitude) {
        let midpoint = (west + east) * 0.5;
        if (bit == 0u) {
          east = midpoint;
        } else {
          west = midpoint;
        }
      } else {
        let midpoint = (south + north) * 0.5;
        if (bit == 0u) {
          north = midpoint;
        } else {
          south = midpoint;
        }
      }
      isLongitude = !isLongitude;
      bitIndex += 1u;
    }
    characterIndex += 1u;
  }

  return vec4f(west, south, east, north);
}

fn dggs_bounds_get_boundary_point(bounds: vec4f, vertexIndex: u32) -> vec2f {
  let pointIndex = vertexIndex % 4u;
  if (pointIndex == 0u) {
    return vec2f(bounds.x, bounds.w);
  }
  if (pointIndex == 1u) {
    return vec2f(bounds.z, bounds.w);
  }
  if (pointIndex == 2u) {
    return vec2f(bounds.z, bounds.y);
  }
  return vec2f(bounds.x, bounds.y);
}

fn dggs_geohash_get_boundary_point(index: vec2u, vertexIndex: u32) -> vec2f {
  return dggs_bounds_get_boundary_point(dggs_geohash_get_bounds(index), vertexIndex);
}

fn dggs_geohash_get_boundary_point_fp64_split(index: vec2u, vertexIndex: u32) -> vec4f {
  return dggs_boundary_point_to_fp64_split(dggs_geohash_get_boundary_point(index, vertexIndex));
}

// Packed quadkey keys store the quadkey length in bits 58..63 and right-align
// the base4 digits in the lower 58 bits, first digit first.
fn dggs_quadkey_get_length(index: vec2u) -> u32 {
  return min(
    dggs_u64_extract_bits(index, DGGS_QUADKEY_LENGTH_BIT_OFFSET, 6u),
    DGGS_QUADKEY_MAX_LENGTH
  );
}

fn dggs_quadkey_get_digit(index: vec2u, digitIndex: u32) -> u32 {
  let length = dggs_quadkey_get_length(index);
  if (digitIndex >= length) {
    return 0u;
  }
  return dggs_u64_extract_bits(index, 2u * (length - digitIndex - 1u), 2u);
}

fn dggs_quadkey_get_tile(index: vec2u) -> vec3u {
  let length = dggs_quadkey_get_length(index);
  var tileX = 0u;
  var tileY = 0u;
  var digitIndex = 0u;
  loop {
    if (digitIndex >= length) {
      break;
    }

    let digit = dggs_quadkey_get_digit(index, digitIndex);
    let mask = 1u << (length - digitIndex - 1u);
    if ((digit & 1u) != 0u) {
      tileX |= mask;
    }
    if ((digit & 2u) != 0u) {
      tileY |= mask;
    }
    digitIndex += 1u;
  }
  return vec3u(tileX, tileY, length);
}

fn dggs_web_mercator_tile_y_to_latitude(tileY: f32, tileScale: f32) -> f32 {
  let mercatorY = DGGS_PI * (1.0 - 2.0 * tileY / tileScale);
  return (2.0 * atan(exp(mercatorY)) - DGGS_PI * 0.5) * DGGS_RADIANS_TO_DEGREES;
}

// Returns vec4(west, south, east, north) in longitude/latitude degrees.
fn dggs_quadkey_get_bounds(index: vec2u) -> vec4f {
  let tile = dggs_quadkey_get_tile(index);
  let tileScale = f32(1u << tile.z);
  let west = f32(tile.x) / tileScale * 360.0 - 180.0;
  let east = f32(tile.x + 1u) / tileScale * 360.0 - 180.0;
  let north = dggs_web_mercator_tile_y_to_latitude(f32(tile.y), tileScale);
  let south = dggs_web_mercator_tile_y_to_latitude(f32(tile.y + 1u), tileScale);
  return vec4f(west, south, east, north);
}

fn dggs_quadkey_get_boundary_point(index: vec2u, vertexIndex: u32) -> vec2f {
  return dggs_bounds_get_boundary_point(dggs_quadkey_get_bounds(index), vertexIndex);
}

fn dggs_quadkey_get_boundary_point_fp64_split(index: vec2u, vertexIndex: u32) -> vec4f {
  return dggs_boundary_point_to_fp64_split(dggs_quadkey_get_boundary_point(index, vertexIndex));
}

fn dggs_s2_digit_to_xy(digit: u32) -> vec2u {
  if (digit == 1u) {
    return vec2u(0u, 1u);
  }
  if (digit == 2u) {
    return vec2u(1u, 1u);
  }
  if (digit == 3u) {
    return vec2u(1u, 0u);
  }
  return vec2u(0u, 0u);
}

fn dggs_s2_rotate_and_flip_quadrant(size: u32, point: vec2u, digitXY: vec2u) -> vec2u {
  var result = point;
  if (digitXY.y == 0u) {
    if (digitXY.x == 1u) {
      result = vec2u(size - 1u - result.x, size - 1u - result.y);
    }
    result = result.yx;
  }
  return result;
}

fn dggs_s2_get_ij(index: vec2u) -> vec2u {
  let level = dggs_s2_get_level(index);
  var point = vec2u(0u);
  var hilbertLevel = 1u;
  loop {
    if (hilbertLevel > level) {
      break;
    }
    let digitLevel = level - hilbertLevel + 1u;
    let digitXY = dggs_s2_digit_to_xy(dggs_s2_get_child_position(index, digitLevel));
    let size = 1u << (hilbertLevel - 1u);
    point = dggs_s2_rotate_and_flip_quadrant(size, point, digitXY);
    point += size * digitXY;
    hilbertLevel += 1u;
  }
  if ((dggs_s2_get_face(index) & 1u) != 0u) {
    point = point.yx;
  }
  return point;
}

fn dggs_s2_single_st_to_uv(st: f32) -> f32 {
  if (st >= 0.5) {
    return (4.0 * st * st - 1.0) / 3.0;
  }
  return (1.0 - 4.0 * (1.0 - st) * (1.0 - st)) / 3.0;
}

fn dggs_s2_ij_to_st(ij: vec2u, level: u32, offset: vec2f) -> vec2f {
  let maxSize = f32(1u << level);
  return (vec2f(f32(ij.x), f32(ij.y)) + offset) / maxSize;
}

fn dggs_s2_st_to_uv(st: vec2f) -> vec2f {
  return vec2f(dggs_s2_single_st_to_uv(st.x), dggs_s2_single_st_to_uv(st.y));
}

fn dggs_s2_face_uv_to_xyz(face: u32, uv: vec2f) -> vec3f {
  if (face == 0u) {
    return vec3f(1.0, uv.x, uv.y);
  }
  if (face == 1u) {
    return vec3f(-uv.x, 1.0, uv.y);
  }
  if (face == 2u) {
    return vec3f(-uv.x, -uv.y, 1.0);
  }
  if (face == 3u) {
    return vec3f(-1.0, -uv.y, -uv.x);
  }
  if (face == 4u) {
    return vec3f(uv.y, -1.0, -uv.x);
  }
  return vec3f(uv.y, uv.x, -1.0);
}

fn dggs_s2_xyz_to_lnglat(xyz: vec3f) -> vec2f {
  let latitude = atan2(xyz.z, length(xyz.xy)) * DGGS_RADIANS_TO_DEGREES;
  let longitude = atan2(xyz.y, xyz.x) * DGGS_RADIANS_TO_DEGREES;
  return vec2f(longitude, latitude);
}

fn dggs_s2_get_boundary_offset(vertexIndex: u32) -> vec2f {
  let pointIndex = vertexIndex % 4u;
  if (pointIndex == 1u) {
    return vec2f(0.0, 1.0);
  }
  if (pointIndex == 2u) {
    return vec2f(1.0, 1.0);
  }
  if (pointIndex == 3u) {
    return vec2f(1.0, 0.0);
  }
  return vec2f(0.0, 0.0);
}

fn dggs_s2_get_boundary_point(index: vec2u, vertexIndex: u32) -> vec2f {
  let level = dggs_s2_get_level(index);
  let ij = dggs_s2_get_ij(index);
  let st = dggs_s2_ij_to_st(ij, level, dggs_s2_get_boundary_offset(vertexIndex));
  let uv = dggs_s2_st_to_uv(st);
  let xyz = dggs_s2_face_uv_to_xyz(dggs_s2_get_face(index), uv);
  return dggs_s2_xyz_to_lnglat(xyz);
}

fn dggs_s2_get_boundary_point_fp64_split(index: vec2u, vertexIndex: u32) -> vec4f {
  return dggs_boundary_point_to_fp64_split(dggs_s2_get_boundary_point(index, vertexIndex));
}
`;
