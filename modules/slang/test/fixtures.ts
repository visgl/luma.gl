// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const RENDER_SHADER = `
struct Varyings {
  float4 position : SV_Position;
  float2 coordinates : TEXCOORD0;
  nointerpolation uint identifier : COLOR0;
};
struct Material { float4 tint; };
[[PLACEHOLDER]]
[shader("vertex")]
Varyings vertexMain(float3 position : POSITION, uint identifier : SV_VertexID) {
  Varyings result;
  float3x3 transform = float3x3(1, 0, 0, 0, 1, 0, 0, 0, 1);
  result.position = float4(mul(transform, position), 1);
  result.coordinates = position.xy * 0.5 + 0.5;
  result.identifier = identifier;
  return result;
}
float4 shade(float2 coordinates) {
  float4 sampled = colorTexture.Sample(colorSampler, coordinates);
  sampled *= material.tint;
  return saturate(sampled);
}
[shader("fragment")]
float4 fragmentMain(Varyings input) : SV_Target0 {
  if (input.identifier > 100u) { discard; }
  return shade(input.coordinates);
}
`.replace(
  '[[PLACEHOLDER]]',
  `
[vk::binding(0, 0)] ConstantBuffer<Material> material;
[vk::binding(1, 0)] Texture2D<float4> colorTexture;
[vk::binding(2, 0)] SamplerState colorSampler;
`
);

export const COMPUTE_SHADER = `
[vk::binding(0, 0)] RWStructuredBuffer<float> values;
[shader("compute")]
[numthreads(4, 1, 1)]
void computeMain(uint3 thread : SV_DispatchThreadID) {
  if (thread.x >= 4u) { return; }
  float accumulated = 0;
  for (int index = 0; index < 4; index++) {
    if (index == 2) { continue; }
    accumulated += float(index);
  }
  values[thread.x] = accumulated + float(thread.x);
}
`;

export const MATRIX_SHADER = `
[vk::binding(0, 0)] RWStructuredBuffer<float> values;
[shader("compute")]
[numthreads(1, 1, 1)]
void computeMain() {
  float2x3 transform = float2x3(1, 2, 3, 4, 5, 6);
  float2 projected = mul(transform, float3(1, 2, 3));
  float3 transposed = mul(float2(1, 2), transform);
  values[0] = projected.x;
  values[1] = projected.y;
  values[2] = transposed.x;
  values[3] = transposed.y;
  values[4] = transposed.z;
}
`;

export const MATH_SHADER = `
[vk::binding(0,0)] RWStructuredBuffer<float> values;
[shader("compute")] [numthreads(1,1,1)]
void main() {
  values[0] = step(0.5, float2(0.25,0.75)).y;
  values[1] = smoothstep(0.0,1.0,float2(0.25,0.5)).y;
  values[2] = lerp(float2(1,3),float2(5,7),0.5).x;
  values[3] = 2 + 0.5;
  values[4] = float(0xFF);
}
`;
