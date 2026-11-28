// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared world-vector interpolation, tested independently of integration. */
export const SPHERICAL_FLOW_SAMPLING = /* wgsl */ `
const PI: f32 = 3.141592653589793;
fn sampleSnapshot(field: texture_2d<f32>, position: vec3f) -> vec3f {
  // Longitude is immaterial at an exact pole: all samples there are identical.
  var longitude = 0.0;
  if (dot(position.xy, position.xy) > 1e-20) {longitude = atan2(position.y, position.x);}
  let coordinates = vec2f(fract(longitude / (2.0 * PI) + 0.5), 0.5 + atan2(position.z, length(position.xy)) / PI);
  let dimensions = vec2i(textureDimensions(field));
  let grid = coordinates * vec2f(dimensions - 1);
  let lower = vec2i(floor(grid));
  let upper = min(lower + 1, dimensions - 1);
  let fraction = fract(grid);
  return mix(mix(textureLoad(field, lower, 0).xyz, textureLoad(field, vec2i(upper.x, lower.y), 0).xyz, fraction.x),
    mix(textureLoad(field, vec2i(lower.x, upper.y), 0).xyz, textureLoad(field, upper, 0).xyz, fraction.x), fraction.y);
}
`;
