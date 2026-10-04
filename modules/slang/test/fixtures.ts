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

export const LANGUAGE_SHADER = `
struct Pair { float first; float second; };
[vk::binding(0,0)] RWStructuredBuffer<float> values;
float adjust(float value) { return value + 1; }
float2 adjust(float2 value) { return value + 1; }
float update(inout float value, out float previous) { previous = value; value += 1; return value; }
bool advance(inout int counter) { counter += 1; return counter < 4; }
[shader("compute")] [numthreads(1,1,1)] void main() {
  float items[2] = {2, 3};
  Pair pair = {4, 5};
  float previous = 0;
  float chosen = true ? update(items[0], previous) : update(items[1], previous);
  values[0] = chosen;
  values[1] = items[1];
  values[2] = previous;
  int counter = 0;
  bool skipped = false && advance(counter);
  float accumulated = 0;
  for (int index = 0; advance(counter); index++) {
    if (index == 1) { continue; }
    accumulated += 1;
  }
  values[3] = float(counter);
  values[4] = accumulated;
  float2 coordinates = {1, 2};
  coordinates.yx = float2(6, 7);
  values[5] = coordinates.x;
  values[6] = adjust(coordinates).y;
  values[7] = adjust(pair.first);
  values[8] = lerp(update(items[0], previous), 8.0, 0.5);
  values[9] = items[0];
  counter = 0;
  while (advance(counter)) { if (counter == 2) { continue; } }
  values[10] = float(counter);
}
`;
export const LANGUAGE_VALUES = [3, 3, 2, 4, 2, 7, 7, 5, 6, 4, 4];
export const UNIFORM_DECLARATIONS = `
struct Inner { float scale; bool enabled; float2 offset; };
struct Settings { float bias; Inner inner; float weights[3]; float2x2 transform; bool flags[2]; };
[vk::binding(0,0)] ConstantBuffer<Settings> settings;
`;
export const UNIFORM_SHADER =
  UNIFORM_DECLARATIONS +
  `
[vk::binding(1,0)] RWStructuredBuffer<float> values;
[shader("compute")] [numthreads(1,1,1)] void main() {
  values[0] = settings.bias + settings.inner.scale;
  values[1] = settings.weights[2];
  float2 projected = mul(settings.transform, float2(1, 2));
  values[2] = projected.x;
  values[3] = projected.y;
  values[4] = settings.flags[0] && !settings.flags[1] && settings.inner.enabled ? settings.inner.offset.y : 0.0;
}
`;
export const UNIFORM_VALUES = {
  bias: 1,
  inner: {scale: 2, enabled: true, offset: [3, 4]},
  weights: [5, 6, 7],
  transform: [1, 2, 3, 4],
  flags: [true, false]
};
export const UNIFORM_RESULTS = [3, 7, 5, 11, 4];

export const OUTPUT_RENDER_SHADER = `
float adjust(inout float value) { value += 1.0; return value > 0.0 ? value : 0.0; }
[shader("vertex")] void vertexMain(uint identifier : SV_VertexID, out float4 position : SV_Position, out float2 coordinates : TEXCOORD0) {
  float2 point = float2(-1,-1);
  if (identifier == 1u) { point = float2(3,-1); }
  if (identifier == 2u) { point = float2(-1,3); }
  position = float4(point,0,1);
  coordinates = point * 0.5 + 0.5;
  float unused = 0.0;
  unused = adjust(unused);
}
[shader("fragment")] void fragmentMain(float2 coordinates : TEXCOORD0, out float4 color : SV_Target) {
  float value = 0.0;
  value = adjust(value);
  color = float4(coordinates,0.25,value);
}
`;
