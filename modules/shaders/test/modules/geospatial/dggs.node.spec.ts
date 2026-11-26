// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {checkType} from '@luma.gl/core/test-utils';
import {dggs} from '@luma.gl/shaders';
import type {ShaderModule} from '@luma.gl/shaders';

checkType<ShaderModule>(dggs);

it('shaders#dggs exports WGSL helpers', () => {
  expect(dggs.name, 'module has expected name').toBe('dggs');
  expect(
    Boolean(dggs.source?.includes('dggs_u64_from_little_endian_words')),
    'exports Uint64 helpers'
  ).toBe(true);
  expect(Boolean(dggs.source?.includes('dggs_i64_less')), 'exports Int64 helpers').toBe(true);
  expect(
    Boolean(dggs.source?.includes('dggs_geohash_get_boundary_point')),
    'exports geohash helpers'
  ).toBe(true);
  expect(
    Boolean(dggs.source?.includes('dggs_quadkey_get_boundary_point')),
    'exports quadkey helpers'
  ).toBe(true);
  expect(
    Boolean(dggs.source?.includes('dggs_h3_get_resolution')),
    'exports H3 decoder helpers'
  ).toBe(true);
  expect(
    Boolean(dggs.source?.includes('dggs_h3_get_boundary_point_fp64_split')),
    'exports fp64-split boundary helpers'
  ).toBe(true);
  expect(
    Boolean(dggs.source?.includes('dggs_s2_get_boundary_point')),
    'exports S2 decoder helpers'
  ).toBe(true);
  void 0;
});
