// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Project the advected trail atlas onto a lit globe without smearing trails as the camera turns. */
export const GLOBE_PRESENTATION = /* wgsl */ `
@group(0) @binding(0) var history: texture_2d<f32>;
@group(0) @binding(1) var earth: texture_2d<f32>;
struct Presentation {viewport: vec4f, orbit: vec4f};
@group(0) @binding(3) var<uniform> presentation: Presentation;
const PI: f32 = 3.14159265359;
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  if (presentation.viewport.w < 0.5) {return textureLoad(history, vec2i(input.position.xy), 0);}
  let screen = (input.position.xy - presentation.viewport.xy * 0.5) / (min(presentation.viewport.x, presentation.viewport.y) * 0.41);
  let radius = length(screen);
  let background = vec3f(0.006, 0.013, 0.028);
  if (radius > 1.0) {
    let halo = exp(-max(radius - 1.0, 0.0) * 28.0) * 0.3;
    return vec4f(background + vec3f(0.08, 0.4, 0.8) * halo, 1);
  }
  let normal = vec3f(screen.x, -screen.y, sqrt(max(0.0, 1.0 - radius * radius)));
  let pitch = presentation.orbit.x;
  let surfaceNormal = vec3f(normal.x, cos(pitch) * normal.y + sin(pitch) * normal.z,
    -sin(pitch) * normal.y + cos(pitch) * normal.z);
  let longitude = atan2(surfaceNormal.x, surfaceNormal.z) + presentation.viewport.z;
  let latitude = asin(clamp(surfaceNormal.y, -1.0, 1.0));
  let coordinates = vec2f(fract(longitude / (2.0 * PI) + 0.5), 0.5 - latitude / PI);
  let surface = textureLoad(earth, clamp(vec2i(coordinates * vec2f(textureDimensions(earth))), vec2i(0), vec2i(textureDimensions(earth)) - 1), 0).rgb;
  let light = 0.2 + 0.8 * max(dot(normal, normalize(vec3f(-0.5, 0.4, 1.0))), 0.0);
  let ocean = vec3f(0.018, 0.055, 0.09);
  let land = surface * vec3f(0.25, 0.4, 0.45);
  let base = (ocean + land) * light;
  let dimensions = vec2i(textureDimensions(history));
  let grid = coordinates * vec2f(dimensions) - 0.5;
  let lower = vec2i(floor(grid));
  let fraction = fract(grid);
  let left = (lower.x + dimensions.x) % dimensions.x;
  let right = (left + 1) % dimensions.x;
  let top = clamp(lower.y, 0, dimensions.y - 1);
  let bottom = clamp(lower.y + 1, 0, dimensions.y - 1);
  let trailColor = mix(
    mix(textureLoad(history, vec2i(left, top), 0).rgb, textureLoad(history, vec2i(right, top), 0).rgb, fraction.x),
    mix(textureLoad(history, vec2i(left, bottom), 0).rgb, textureLoad(history, vec2i(right, bottom), 0).rgb, fraction.x), fraction.y);
  let trails = max(trailColor - vec3f(0.018, 0.035, 0.055), vec3f(0));
  let rim = pow(1.0 - normal.z, 4.0);
  // Compress dense HDR trails without clipping their hue or washing out the Earth.
  let peak = max(trails.r, max(trails.g, trails.b));
  let windGlow = trails * (0.38 / (0.38 + peak));
  let color = base + windGlow * (0.45 + 0.55 * light) + rim * vec3f(0.06, 0.28, 0.5);
  return vec4f(color, 1);
}`;
