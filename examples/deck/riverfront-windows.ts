// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shaders';

/** View-dependent sky color and direct sun glare for recessed glass panes. */
export const riverfrontWindows = {
  name: 'riverfrontWindows',
  source: /* wgsl */ `
fn riverfrontWindowCoverage(facade: vec3f) -> f32 {
  let edge = abs(fract(facade.xy) - vec2f(0.5));
  let width = clamp(fwidth(facade.xy), vec2f(0.001), vec2f(0.2));
  let pane = vec2f(1.0) - smoothstep(vec2f(0.32, 0.29) - width, vec2f(0.32, 0.29) + width, edge);
  return pane.x * pane.y * facade.z;
}

fn riverfrontWindowSunGlare(normal: vec3f, toCamera: vec3f, sunDirection: vec3f) -> f32 {
  let unitNormal = normalize(normal);
  let ray = reflect(-normalize(toCamera), unitNormal);
  let alignment = dot(ray.xy, sunDirection.xy) /
    max(length(ray.xy) * length(sunDirection.xy), 0.001);
  let elevationDelta = ray.z - sunDirection.z;
  // The stretched lobe approximates glare on vertically textured architectural glass.
  let glare = pow(max(alignment, 0.0), 14.0) * exp(-3.0 * elevationDelta * elevationDelta);
  let reflection = pow(max(dot(ray, sunDirection), 0.0), 96.0);
  return max(glare, reflection) * smoothstep(0.0, 0.35, dot(unitNormal, sunDirection));
}

fn riverfrontWindowReflection(
  surfaceColor: vec3f, normal: vec3f, toCamera: vec3f, skyLight: vec3f, coverage: f32
) -> vec3f {
  let view = normalize(toCamera);
  let unitNormal = normalize(normal);
  let ray = reflect(-view, unitNormal);
  let elevation = clamp(ray.z * 2.3 + 0.52, 0.0, 1.0);
  let sky = mix(vec3f(0.075, 0.16, 0.23), vec3f(0.53, 0.69, 0.85), elevation);
  let fresnel = pow(1.0 - clamp(abs(dot(view, unitNormal)), 0.0, 1.0), 4.0);
  let glass = (sky * (0.58 + 0.42 * fresnel) + vec3f(0.025, 0.047, 0.065)) * skyLight;
  return mix(surfaceColor, glass, coverage);
}
`,
  fs: /* glsl */ `
float riverfrontWindowCoverage(vec3 facade) {
  vec2 edge = abs(fract(facade.xy) - vec2(0.5));
  vec2 width = clamp(fwidth(facade.xy), vec2(0.001), vec2(0.2));
  vec2 pane = vec2(1.0) - smoothstep(vec2(0.32, 0.29) - width, vec2(0.32, 0.29) + width, edge);
  return pane.x * pane.y * facade.z;
}

float riverfrontWindowSunGlare(vec3 normal, vec3 toCamera, vec3 sunDirection) {
  vec3 unitNormal = normalize(normal);
  vec3 ray = reflect(-normalize(toCamera), unitNormal);
  float alignment = dot(ray.xy, sunDirection.xy) /
    max(length(ray.xy) * length(sunDirection.xy), 0.001);
  float elevationDelta = ray.z - sunDirection.z;
  float glare = pow(max(alignment, 0.0), 14.0) * exp(-3.0 * elevationDelta * elevationDelta);
  float reflection = pow(max(dot(ray, sunDirection), 0.0), 96.0);
  return max(glare, reflection) * smoothstep(0.0, 0.35, dot(unitNormal, sunDirection));
}

vec3 riverfrontWindowReflection(
  vec3 surfaceColor, vec3 normal, vec3 toCamera, vec3 skyLight, float coverage
) {
  vec3 view = normalize(toCamera);
  vec3 unitNormal = normalize(normal);
  vec3 ray = reflect(-view, unitNormal);
  float elevation = clamp(ray.z * 2.3 + 0.52, 0.0, 1.0);
  vec3 sky = mix(vec3(0.075, 0.16, 0.23), vec3(0.53, 0.69, 0.85), elevation);
  float fresnel = pow(1.0 - clamp(abs(dot(view, unitNormal)), 0.0, 1.0), 4.0);
  vec3 glass = (sky * (0.58 + 0.42 * fresnel) + vec3(0.025, 0.047, 0.065)) * skyLight;
  return mix(surfaceColor, glass, coverage);
}
`
} as const satisfies ShaderModule;
