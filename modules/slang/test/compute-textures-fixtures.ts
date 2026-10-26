// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const ATOMIC_SHADER = `
RWStructuredBuffer<uint> results;
groupshared uint total;
[shader("compute")] [numthreads(64,1,1)]
void main(uint identifier : SV_GroupIndex) {
  if (identifier == 0u) { total = 0u; }
  GroupMemoryBarrierWithGroupSync();
  InterlockedAdd(total, identifier + 1u);
  GroupMemoryBarrierWithGroupSync();
  if (identifier == 0u) {
    results[0] = total;
    results[1] = 7u;
    uint previous;
    InterlockedAdd(results[1], 5u, previous); results[2] = previous;
    InterlockedAnd(results[1], 10u, previous); results[3] = previous;
    InterlockedOr(results[1], 3u, previous); results[4] = previous;
    InterlockedXor(results[1], 5u, previous); results[5] = previous;
    InterlockedMin(results[1], 4u, previous); results[6] = previous;
    InterlockedMax(results[1], 9u, previous); results[7] = previous;
    InterlockedExchange(results[1], 13u, previous); results[8] = previous;
    InterlockedCompareExchange(results[1], 13u, 21u, previous); results[9] = previous;
    InterlockedCompareExchange(results[1], 13u, 99u, previous); results[10] = previous;
    InterlockedCompareStore(results[1], 21u, 42u);
  }
}`;
export const ATOMIC_RESULTS = [2080, 42, 7, 12, 8, 11, 14, 4, 9, 13, 21];

export const BYTE_ADDRESS_SHADER = `
RWByteAddressBuffer results;
[shader("compute")] [numthreads(1,1,1)] void main() {
  results.Store4(0u, uint4(1u,2u,3u,4u));
  uint4 values = results.Load4(0u);
  results.Store2(16u, values.xy + uint2(5u));
  results.Store3(24u, values.xyz + uint3(10u));
  uint previous;
  results.InterlockedAdd(0u, 7u, previous); results.Store(36u, previous);
  results.InterlockedCompareExchange(0u, 8u, 20u, previous); results.Store(40u, previous);
  results.InterlockedCompareStore(0u, 20u, 30u);
  uint byteLength; results.GetDimensions(byteLength); results.Store(44u, byteLength);
  results.Store(48u, asuint(asfloat(1065353216u)));
}`;
export const BYTE_ADDRESS_RESULTS = [30, 2, 3, 4, 6, 7, 11, 12, 13, 1, 8, 52, 1065353216];

export const FULLSCREEN_VERTEX = `
[shader("vertex")] float4 vertexMain(uint identifier : SV_VertexID) : SV_Position {
  float2 position = float2(-1,-1);
  if (identifier == 1u) { position = float2(3,-1); }
  if (identifier == 2u) { position = float2(-1,3); }
  return float4(position,0,1);
}`;
