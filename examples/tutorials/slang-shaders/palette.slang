// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Reusable iridescent material, shared by the sculpture and its floor reflection.
float3 getPaletteColor(float phase, float palette) {
  float3 offsets = float3(0.0, 0.18, 0.38);
  if (palette > 0.5) { offsets = float3(0.0, 0.08, 0.18); }
  if (palette > 1.5) { offsets = float3(0.28, 0.12, 0.0); }
  return 0.52 + 0.48 * cos(6.283185 * (phase + offsets));
}

float3 shadeSculpture(float3 position, float3 normal, float3 direction, float time, float palette) {
  float3 light = normalize(float3(-0.6, 0.9, 1.2));
  float diffuse = max(dot(normal, light), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, -direction), 0.0), 3.0);
  float highlight = pow(max(dot(reflect(-light, normal), -direction), 0.0), 48.0);
  float phase = position.y * 0.18 + position.x * 0.12 + time * 0.035;
  float3 material = getPaletteColor(phase, palette);
  float3 color = material * (0.07 + diffuse * 0.8) + highlight * float3(1.0, 0.9, 0.8);
  color += fresnel * float3(0.08, 0.32, 0.55);
  if (length(position) < 0.5) {
    color = getPaletteColor(time * 0.045 + 0.55, palette) * (1.5 + fresnel);
  }
  return color;
}
