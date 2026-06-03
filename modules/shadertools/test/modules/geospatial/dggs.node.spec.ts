// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {checkType} from '@luma.gl/test-utils';
import {dggs} from '@luma.gl/shadertools';
import type {ShaderModule} from '@luma.gl/shadertools';

checkType<ShaderModule>(dggs);

test('shadertools#dggs exports WGSL helpers', t => {
  t.equal(dggs.name, 'dggs', 'module has expected name');
  t.ok(dggs.source?.includes('dggs_u64_from_little_endian_words'), 'exports Uint64 helpers');
  t.ok(dggs.source?.includes('dggs_i64_less'), 'exports Int64 helpers');
  t.ok(dggs.source?.includes('dggs_geohash_get_boundary_point'), 'exports geohash helpers');
  t.ok(dggs.source?.includes('dggs_quadkey_get_boundary_point'), 'exports quadkey helpers');
  t.ok(dggs.source?.includes('dggs_h3_get_resolution'), 'exports H3 decoder helpers');
  t.ok(
    dggs.source?.includes('dggs_h3_get_boundary_point_fp64_split'),
    'exports fp64-split boundary helpers'
  );
  t.ok(dggs.source?.includes('dggs_s2_get_boundary_point'), 'exports S2 decoder helpers');
  t.end();
});
