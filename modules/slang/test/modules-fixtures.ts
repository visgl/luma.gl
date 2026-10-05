// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SlangModuleOptions} from '@luma.gl/slang';

export const MODULE_OPTIONS = {
  modules: {
    shared: 'float getScale(float value) { return value * 0.5; }',
    material: 'import shared; float getMaterial(float value) { return getScale(value); }',
    bridge: {
      declarations: `
        import shared;
        struct Payload { float value; float3 color; };
        struct Settings { float scale; };
        ConstantBuffer<Settings> settings : register(b0);
        Payload applyNative(Payload payload);
        void updateNative(inout float value, out float previous);
      `,
      imports: 'float shadePublic(float value);',
      names: {applyNative: 'applyNativePublic'},
      wgsl: `fn applyNativePublic(payload: Payload) -> Payload {
  return Payload(shadePublic(payload.value) * settings.scale, payload.color);
}
fn updateNative(value: ptr<function, f32>, previous: ptr<function, f32>) {
  *previous = *value;
  *value = *value + 0.25;
}`,
      glsl: `Payload applyNativePublic(Payload payload) {
  return Payload(shadePublic(payload.value) * settings.scale, payload.color);
}
void updateNative(inout float value, out float previous) {
  previous = value;
  value += 0.25;
}`
    }
  },
  exports: {shade: 'shadePublic'}
} as const satisfies SlangModuleOptions;

export const MODULE_HELPERS = `
import material;
import bridge;
float shade(float value) { return getMaterial(value); }
float getResult() {
  Payload payload = {0.5, float3(1, 0, 0)};
  payload = applyNative(payload);
  float previous = 0;
  updateNative(payload.value, previous);
  return payload.value + previous;
}
`;
export const MODULE_RENDER =
  MODULE_HELPERS +
  `
[shader("vertex")] float4 vertexMain(uint index : SV_VertexID) : SV_Position {
  float2 position = float2(-1, -1);
  if (index == 1u) { position = float2(3, -1); }
  if (index == 2u) { position = float2(-1, 3); }
  return float4(position, 0, 1);
}
[shader("fragment")] float4 fragmentMain() : SV_Target0 {
  return float4(getResult(), 0, 0, 1);
}
`;
export const MODULE_COMPUTE =
  MODULE_HELPERS +
  `
RWStructuredBuffer<float> output : register(u1);
[shader("compute")] [numthreads(1,1,1)] void main() {
  output[0] = getResult();
}
`;
export const NATIVE_RESOURCES = {
  modules: {
    resources: {
      declarations: `struct Settings { float scale; }; ConstantBuffer<Settings> settings : register(b0);
        RWStructuredBuffer<float> values : register(u1); void writeNative();`,
      wgsl: 'fn writeNative() { values[0] = settings.scale; }',
      glsl: 'void writeNative() { values.data[0] = settings.scale; }'
    }
  }
} as const satisfies SlangModuleOptions;
