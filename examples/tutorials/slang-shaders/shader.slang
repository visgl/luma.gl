// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import geometry;
import palette;
import filmGrain;

// Public Slang helper called by the native grain implementation.
float getGrainOffset(float noise, float amount) { return (noise - 0.5) * amount; }

struct SceneUniforms {
  // Two float4 fields have the same alignment in std140 and WGSL.
  float4 animation; // time, aspect ratio, twist, palette
  float4 camera; // yaw, pitch, exposure, grain amount
};

ConstantBuffer<SceneUniforms> scene : register(b0);

struct Varyings {
  float4 position : SV_Position;
  float2 coordinates : TEXCOORD0;
};

[shader("vertex")]
Varyings vertexMain(uint vertexIndex : SV_VertexID) {
  // One oversized triangle covers the viewport without a diagonal seam.
  float2 position = float2(-1.0, -1.0);
  if (vertexIndex == 1u) { position = float2(3.0, -1.0); }
  if (vertexIndex == 2u) { position = float2(-1.0, 3.0); }
  Varyings output;
  output.position = float4(position, 0.0, 1.0);
  output.coordinates = position;
  return output;
}

float traceSculpture(float3 origin, float3 direction, float time, float twist) {
  // Start at the bounding sphere, skipping empty space and rays that miss it.
  float projection = dot(origin, direction);
  float discriminant = projection * projection - dot(origin, origin) + 1.96;
  if (discriminant < 0.0) { return 10.0; }
  float radius = sqrt(discriminant);
  float exitDistance = -projection + radius;
  if (exitDistance < 0.0) { return 10.0; }
  float distance = max(-projection - radius, 0.0);
  float stepScale = 0.65 / (1.0 + 2.88 * twist);
  for (int step = 0; step < 96; step++) {
    float surface = getSculptureDistance(origin + direction * distance, time, twist);
    if (surface < 0.0015) { return distance; }
    if (distance > exitDistance) { break; }
    // Account for the deformation's slope so rays do not jump through the rings.
    distance += surface * stepScale;
  }
  return 10.0;
}

[shader("fragment")]
float4 fragmentMain(Varyings input) : SV_Target0 {
  float time = scene.animation.x;
  float twist = scene.animation.z;
  float palette = scene.animation.w;
  float yaw = scene.camera.x;
  float pitch = scene.camera.y;
  float3 origin = 4.2 * float3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
  float3 forward = normalize(-origin);
  float3 right = normalize(cross(forward, float3(0.0, 1.0, 0.0)));
  float3 up = cross(right, forward);
  float2 coordinates = float2(input.coordinates.x * scene.animation.y, input.coordinates.y);
  float3 direction = normalize(forward * 2.1 + right * coordinates.x + up * coordinates.y);
  float distance = traceSculpture(origin, direction, time, twist);
  float3 position = origin + direction * distance;
  float halo = pow(max(dot(direction, forward), 0.0), 18.0);
  float3 color = float3(0.001, 0.002, 0.006) + halo * float3(0.006, 0.018, 0.035);

  if (distance < 9.0 && getSculptureDistance(position, time, twist) < 0.004) {
    float3 normal = getSculptureNormal(position, time, twist);
    color = shadeSculpture(position, normal, direction, time, palette);
  } else if (direction.y < -0.001) {
    float floorDistance = (-1.45 - origin.y) / direction.y;
    float3 floorPosition = origin + direction * floorDistance;
    float2 gridCoordinates = abs(frac(floorPosition.xz * 0.7) - 0.5);
    float grid = 1.0 - smoothstep(0.0, 0.018, min(gridCoordinates.x, gridCoordinates.y));
    float floorFade = exp(-0.055 * dot(floorPosition.xz, floorPosition.xz));
    color += floorFade * (float3(0.018, 0.035, 0.05) + grid * float3(0.04, 0.11, 0.15));
    float3 reflectedDirection = reflect(direction, float3(0.0, 1.0, 0.0));
    float3 reflectedOrigin = floorPosition + float3(0.0, 0.01, 0.0);
    float reflectedDistance = traceSculpture(reflectedOrigin, reflectedDirection, time, twist);
    float3 reflectedPosition = reflectedOrigin + reflectedDirection * reflectedDistance;
    if (reflectedDistance < 9.0 && getSculptureDistance(reflectedPosition, time, twist) < 0.004) {
      float3 reflectedNormal = getSculptureNormal(reflectedPosition, time, twist);
      color += shadeSculpture(reflectedPosition, reflectedNormal, reflectedDirection, time, palette)
        * 0.28 * floorFade;
    }
  }
  // Tone mapping and display gamma keep the glowing core detailed.
  color = color * scene.camera.z;
  color = color / (1.0 + color);
  color = pow(color, float3(0.4545, 0.4545, 0.4545));
  color = applyNativeGrain(color, input.position.xy, time, scene.camera.w);
  return float4(color, 1.0);
}
