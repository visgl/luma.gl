// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

export const windStreak = {
  name: 'windStreak',
  source: `struct WindStreakUniforms { bounds: vec4<f32>, boundsLow: vec4<f32>, appearance: vec4<f32>, color: vec4<f32> };
  @group(3) @binding(0) var<uniform> windStreak: WindStreakUniforms;
  @group(3) @binding(1) var<storage, read> windState: array<vec4<f32>>;
  @group(3) @binding(2) var<storage, read> windPreviousState: array<vec4<f32>>;`,
  bindingLayout: [
    {name: 'windStreak', group: 3},
    {name: 'windState', group: 3, visibility: 1},
    {name: 'windPreviousState', group: 3, visibility: 1}
  ],
  uniformTypes: {
    bounds: 'vec4<f32>',
    boundsLow: 'vec4<f32>',
    appearance: 'vec4<f32>',
    color: 'vec4<f32>'
  },
  defaultUniforms: {
    bounds: [0, 0, 1, 1],
    boundsLow: [0, 0, 0, 0],
    appearance: [1.5, 1, 1, 1],
    color: [0.4, 0.9, 1, 0.9]
  }
} as const satisfies ShaderModule;

export const SOURCE = /* wgsl */ `struct WindVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) pickingColor: vec3<f32>,
  @location(1) coordinates: vec2<f32>,
  @location(2) visible: f32,
};
fn projectParticle(position: vec2<f32>) -> vec4<f32> {
  let delta = position * windStreak.bounds.zw;
  let high = windStreak.bounds.xy + delta;
  let virtualDelta = high - windStreak.bounds.xy;
  let low = (windStreak.bounds.xy - (high - virtualDelta)) + (delta - virtualDelta)
    + windStreak.boundsLow.xy + position * windStreak.boundsLow.zw;
  return project_position_to_clipspace(vec3<f32>(high, windStreak.appearance.z), vec3<f32>(low, 0.0), vec3<f32>(0.0));
}
@vertex fn vertexMain(@location(0) corner: vec2<f32>, @builtin(instance_index) identifier: u32) -> WindVertex {
  let particle = windState[identifier];
  let previous = windPreviousState[identifier];
  let currentClip = projectParticle(particle.xy);
  let previousClip = projectParticle(previous.xy);
  let currentScreen = currentClip.xy / max(currentClip.w, 0.00001);
  let sameParticle = particle.w == previous.w && previous.z >= 0.0 && previousClip.w > 0.0 && abs(particle.x - previous.x) < 0.5;
  // Extrapolated short streaks use age deltas; respawns and wrapped jumps draw heads only.
  let tailClip = projectParticle(select(particle.xy, mix(particle.xy, previous.xy, min(30.0, windStreak.appearance.y / max(particle.z - previous.z, 0.0001))), sameParticle));
  let tailScreen = tailClip.xy / max(tailClip.w, 0.00001);
  let motion = (currentScreen - tailScreen) * project.viewportSize * 0.5;
  let distance = length(motion);
  let direction = select(vec2<f32>(0.0, 1.0), motion / max(distance, 0.00001), distance > 0.00001);
  let width = max(windStreak.appearance.x, 0.0) * project.devicePixelRatio;
  let centerClip = mix(tailClip, currentClip, corner.x);
  let offset = direction * (width * 0.5 - (1.0 - corner.x) * max(0.0, width - distance)) + vec2<f32>(-direction.y, direction.x) * corner.y * width * 0.5;
  var output: WindVertex;
  output.position = vec4<f32>(centerClip.xy + offset * 2.0 / project.viewportSize * centerClip.w, centerClip.zw);
  output.coordinates = corner;
  output.visible = select(0.0, 1.0, particle.z >= 0.0 && currentClip.w > 0.0 && width > 0.0);
  output.pickingColor = picking_getPickingColorFromIndex(identifier);
  return output;
}
@fragment fn fragmentMain(input: WindVertex) -> @location(0) vec4<f32> {
  if (input.visible < 0.5) { discard; }
  if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor, 1.0); }
  let coverage = 1.0 - smoothstep(0.6, 1.0, abs(input.coordinates.y));
  var color = windStreak.color.rgb;
  if (picking.isHighlightActive > 0.5 && distance(input.pickingColor, picking_normalizeColor(picking.highlightedObjectColor)) < 0.00001) {
    color = mix(color, picking.highlightColor.rgb, picking.highlightColor.a);
  }
  return vec4<f32>(color, windStreak.color.a * windStreak.appearance.w * coverage * mix(0.25, 1.0, input.coordinates.x));
}
`;
