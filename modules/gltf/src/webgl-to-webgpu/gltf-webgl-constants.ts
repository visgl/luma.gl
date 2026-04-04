// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// NOTE: `@luma.gl/gltf` intentionally keeps this as a local enum subset so it
// does not need to depend on `@luma.gl/webgl` for a handful of stable WebGL values.
// eslint-disable-next-line no-shadow
export enum GLEnum {
  POINTS = 0x0,
  LINES = 0x1,
  LINE_LOOP = 0x2,
  LINE_STRIP = 0x3,
  TRIANGLES = 0x4,
  TRIANGLE_STRIP = 0x5,
  TRIANGLE_FAN = 0x6,

  ONE = 1,
  SRC_ALPHA = 0x0302,
  ONE_MINUS_SRC_ALPHA = 0x0303,
  FUNC_ADD = 0x8006,

  LINEAR = 0x2601,
  NEAREST = 0x2600,
  NEAREST_MIPMAP_NEAREST = 0x2700,
  LINEAR_MIPMAP_NEAREST = 0x2701,
  NEAREST_MIPMAP_LINEAR = 0x2702,
  LINEAR_MIPMAP_LINEAR = 0x2703,
  TEXTURE_MIN_FILTER = 0x2801,
  TEXTURE_WRAP_S = 0x2802,
  TEXTURE_WRAP_T = 0x2803,
  REPEAT = 0x2901,
  CLAMP_TO_EDGE = 0x812f,
  MIRRORED_REPEAT = 0x8370,
  UNPACK_FLIP_Y_WEBGL = 0x9240
}
