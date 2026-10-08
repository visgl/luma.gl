// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Reusable signed-distance functions. No mesh or vertex buffers are needed.
float3 rotateAroundX(float3 position, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return float3(position.x, cosine * position.y - sine * position.z,
    sine * position.y + cosine * position.z);
}

float3 rotateAroundY(float3 position, float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);
  return float3(cosine * position.x + sine * position.z, position.y,
    -sine * position.x + cosine * position.z);
}

float getRingDistance(float3 position) {
  return length(float2(length(position.xy) - 1.05, position.z)) - 0.13;
}

float getSculptureDistance(float3 position, float time, float twist) {
  float3 rotated = rotateAroundY(position, time * 0.22);
  rotated = rotateAroundX(rotated, 0.35 + time * 0.13);
  float deformation = twist * sin(rotated.y * 2.4 + time * 0.7);
  rotated = rotateAroundY(rotated, deformation);
  float firstRing = getRingDistance(rotated);
  float secondRing = getRingDistance(rotateAroundX(rotated, 1.570796));
  float thirdRing = getRingDistance(rotateAroundY(rotated, 1.570796));
  float core = length(position) - 0.43;
  return min(core, min(firstRing, min(secondRing, thirdRing)));
}

float3 getSculptureNormal(float3 position, float time, float twist) {
  float offset = 0.002;
  float horizontal = getSculptureDistance(position + float3(offset, 0.0, 0.0), time, twist)
    - getSculptureDistance(position - float3(offset, 0.0, 0.0), time, twist);
  float vertical = getSculptureDistance(position + float3(0.0, offset, 0.0), time, twist)
    - getSculptureDistance(position - float3(0.0, offset, 0.0), time, twist);
  float depth = getSculptureDistance(position + float3(0.0, 0.0, offset), time, twist)
    - getSculptureDistance(position - float3(0.0, 0.0, offset), time, twist);
  return normalize(float3(horizontal, vertical, depth));
}
