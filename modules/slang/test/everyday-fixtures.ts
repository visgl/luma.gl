// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const EVERYDAY_FUNCTIONS = `
static const uint SELECT = 0xFFFFFFFFu >> 1;
int choose(int selector) {
  switch(selector) { case 0: case 1: return 3; default: return 7; }
}
int selectOnce(inout int calls, int selector) { calls += 1; return selector; }
int clauses(int selector) {
  var calls = 0;
  var total = 0;
  const int base = 0;
  switch(selectOnce(calls, selector)) {
    case base: total += 2;
    default: total += 4;
    case 1: total += 8; break;
    case 2: total = 16; break;
  }
  return total + calls * 100;
}
float control(int selector) {
  var total : int;
  total = 0;
  var count = 0;
  do {
    count += 1;
    switch(selector) {
      case 0: total += 2;
      case 1: total += 3; break;
      default: total += 7; break;
    }
    if (count < 2) { continue; }
    total += 1;
  } while(count < 3);
  for(var index = 0; index < 4; index++) {
    switch(index) {
      case 0: continue;
      case 1: total += 4; break;
      case 2:
      default: total += 5;
    }
  }
  return total;
}
bool check(inout int calls) { calls += 1; return calls < 3; }
int mandatoryReturn() { do { return 5; } while(false); }
int postTest() {
  var calls = 0;
  var count = 0;
  do { count += 1; continue; } while(check(calls));
  return count * 10 + calls;
}
float4 numeric() {
  let mixed = int2(1,-2) + float2(0.5,0.5);
  let unsignedValues = uint2(7,9) + int2(1,2);
  var mask = 1u;
  mask <<= 3;
  mask |= 2u;
  mask ^= 1u;
  let compared = all(mixed < float2(2,0));
  var fraction = -5.5;
  fraction %= 2.0;
  return float4(mixed.x, mixed.y, unsignedValues.x + mask, fraction + float(compared));
}
float2x2 makeMatrix(inout int calls) { calls += 1; return float2x2(1,2,3,4); }
float4 makeVector(inout int calls) { calls += 1; return float4(5,6,7,8); }
float conversions() {
  var calls = 0;
  let flattened = float4(makeMatrix(calls));
  let restored = float2x2(makeVector(calls));
  let converted = float2(int2(1,2));
  var condition = false;
  if(1) { condition = true; }
  return calls * 10 + flattened.y + restored[1].y + converted.y + float(condition);
}
float4 matrices() {
  var broadcast : float2x2 = 2.0;
  let rows = float2x2(int2(1,2),float2(3,4));
  let copied = float2x2(rows);
  var elements = copied * broadcast;
  elements += 1;
  elements /= 2;
  let flattened = float4(elements);
  let restored = float2x2(flattened);
  let splatted = float2x2(3.0);
  return float4(restored[0].x, restored[0].y, restored[1].x, splatted[1].y);
}
`;
export const EVERYDAY_SHADER = `${EVERYDAY_FUNCTIONS}
RWStructuredBuffer<float> results;
[shader("compute")] [numthreads(1,1,1)] void main() {
  results[0]=control(0); results[1]=control(1); results[2]=control(3);
  results[3]=clauses(0); results[4]=clauses(1); results[5]=clauses(2); results[6]=clauses(3);
  results[7]=postTest(); results[8]=choose(1); results[9]=choose(3);
  let values = numeric();
  results[10]=values.x; results[11]=values.y; results[12]=values.z; results[13]=values.w;
  let matrixValues = matrices();
  switch(uint(2147483647)) { case SELECT: results[18]=255.0; break; default: results[18]=0; }
  let maximum = 0xFFFFFFFF;
  results[19]=float(maximum >> 28);
  results[20]=float((-1u) >> 28);
  results[21]=float(-2147483648 < 0);
  results[22]=conversions();
  results[25]=mandatoryReturn();
  const int outer = 0;
  { const int outer = outer + 1; switch(1) { case outer: results[23]=9; break; default: results[23]=0; } }
  switch(2147483647u) { case -1 / 2u: results[24]=7; break; default: results[24]=0; }
  results[14]=matrixValues.x; results[15]=matrixValues.y; results[16]=matrixValues.z; results[17]=matrixValues.w;
}`;
export const EVERYDAY_RESULTS = [
  31, 25, 37, 114, 108, 116, 112, 33, 3, 7, 1.5, -1.5, 19, -0.5, 1.5, 2.5, 3.5, 3, 255, 15, 15, 1,
  33, 9, 7, 5
];
