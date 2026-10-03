// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

float3 getPaletteColor(float2 coordinates) {
  float wave = 0.5 + 0.5 * sin(coordinates.x * 12.0 + coordinates.y * 8.0);
  float3 base = lerp(float3(0.16, 0.28, 0.84), float3(0.94, 0.28, 0.16), coordinates.y);
  return lerp(base, float3(0.98, 0.84, 0.26), wave * 0.35);
}
