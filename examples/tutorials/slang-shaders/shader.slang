// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

struct Varyings {
  float4 position : SV_Position;
  float2 coordinates : TEXCOORD0;
};

[shader("vertex")]
Varyings vertexMain(uint vertexIndex : SV_VertexID) {
  float2 position = float2(0.0, 0.72);
  if (vertexIndex == 1u) { position = float2(-0.8, -0.64); }
  if (vertexIndex == 2u) { position = float2(0.8, -0.64); }
  Varyings output;
  output.position = float4(position, 0.0, 1.0);
  output.coordinates = position * 0.5 + 0.5;
  return output;
}

[shader("fragment")]
float4 fragmentMain(Varyings input) : SV_Target0 {
  return float4(getPaletteColor(input.coordinates), 1.0);
}
