// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

struct Particle { float4 position; float4 velocity; };
struct Scene { float4 clock; float4 motion; float4 attractor; };
StructuredBuffer<Particle> previousParticles;
RWStructuredBuffer<Particle> nextParticles;
ConstantBuffer<Scene> scene;
groupshared float3 tilePositions[64];
groupshared uint movingParticles;

[shader("compute")] [numthreads(64,1,1)]
void simulate(uint3 identifier : SV_DispatchThreadID, uint localIndex : SV_GroupIndex) {
  Particle particle = previousParticles[identifier.x];
  tilePositions[localIndex] = particle.position.xyz;
  if (localIndex == 0u) { movingParticles = 0u; }
  GroupMemoryBarrierWithGroupSync();
  if (length(particle.velocity.xyz) > 0.15) { InterlockedAdd(movingParticles,1u); }
  GroupMemoryBarrierWithGroupSync();
  float3 center = float3(0);
  for (uint index=0u; index<64u; index++) { center += tilePositions[index]; }
  center /= 64.0;
  float3 position = particle.position.xyz;
  float radius = length(position.xy);
  float targetRadius = 0.2 + particle.position.w*0.6;
  float3 tangent = float3(-position.y,position.x,0);
  float3 desired = tangent * scene.motion.x;
  float3 acceleration = (desired - particle.velocity.xyz) * 1.2;
  acceleration += float3(position.xy * (targetRadius-radius) * 1.5, -position.z*0.6);
  acceleration += (center-position) * scene.motion.y;
  acceleration += sin(float3(position.y*5.0,position.x*4.0,position.x*3.0) + float3(scene.clock.x*0.3)) * 0.12;
  acceleration += float3(scene.attractor.xy-position.xy,0) * scene.attractor.z * 1.5;
  particle.velocity.xyz += acceleration * scene.clock.y;
  particle.position.xyz += particle.velocity.xyz * scene.clock.y;
  particle.velocity.w = float(movingParticles) / 64.0;
  nextParticles[identifier.x] = particle;
}

struct VertexOutput { float4 position : SV_Position; float2 coordinates : TEXCOORD0; float3 color : COLOR0; };
[shader("vertex")]
VertexOutput vertexMain(uint vertex : SV_VertexID, uint instance : SV_InstanceID) {
  Particle particle = previousParticles[instance];
  float2 corner = float2(-1,-1);
  if (vertex == 1u || vertex == 4u) { corner = float2(1,-1); }
  if (vertex == 2u || vertex == 3u) { corner = float2(-1,1); }
  if (vertex == 5u) { corner = float2(1,1); }
  float angle = scene.clock.x * 0.08;
  float3 position = particle.position.xyz;
  float2 rotated = float2(position.x*cos(angle)-position.y*sin(angle),position.x*sin(angle)+position.y*cos(angle));
  float2 projected = float2(rotated.x,rotated.y*0.65 + position.z*0.6);
  float size = scene.clock.w * (1.0 + particle.position.w*0.6);
  VertexOutput output;
  float viewScale = 0.75 * min(1.0,scene.clock.z);
  output.position = float4((projected.x + corner.x*size)*viewScale/scene.clock.z, (projected.y + corner.y*size)*viewScale,0,1);
  output.coordinates = corner;
  float phase = particle.position.w*6.283 + length(particle.velocity.xyz)*2.0;
  output.color = 0.55 + 0.45*cos(float3(phase,phase+2.1,phase+4.2));
  output.color *= 0.18 + particle.velocity.w*0.12;
  return output;
}
[shader("fragment")]
float4 fragmentMain(VertexOutput input) : SV_Target {
  float radiusSquared = dot(input.coordinates,input.coordinates);
  if (radiusSquared > 1.0) { discard; }
  float glow = exp(-radiusSquared*3.5);
  return float4(input.color*glow,glow);
}
