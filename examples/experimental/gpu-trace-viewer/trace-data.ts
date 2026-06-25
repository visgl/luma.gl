// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const TRACE_DURATION = 1000;
export const TRACE_LANE_COUNT = 256;
export const TRACE_GROUPS = ['compute', 'network', 'storage'] as const;
export type TraceGroupName = (typeof TRACE_GROUPS)[number];

export type TraceGroupData = {
  name: TraceGroupName;
  groupIndex: number;
  count: number;
  data: Uint32Array;
};

const TRACE_RECORD_BYTE_LENGTH = 16;

/** Creates deterministic, storage-ready trace span records. */
export function makeTraceGroups(totalSpanCount: number): TraceGroupData[] {
  let remaining = totalSpanCount;
  return TRACE_GROUPS.map((name, groupIndex) => {
    const count =
      groupIndex === TRACE_GROUPS.length - 1
        ? remaining
        : Math.floor(totalSpanCount / TRACE_GROUPS.length);
    remaining -= count;
    const data = new ArrayBuffer(count * TRACE_RECORD_BYTE_LENGTH);
    const floatView = new Float32Array(data);
    const uintView = new Uint32Array(data);
    let randomState = (0x9e3779b9 ^ (groupIndex * 0x85ebca6b)) >>> 0;
    const random = (): number => {
      randomState ^= randomState << 13;
      randomState ^= randomState >>> 17;
      randomState ^= randomState << 5;
      return (randomState >>> 0) / 0x100000000;
    };
    for (let index = 0; index < count; index++) {
      const wordOffset = index * 4;
      const lane = Math.floor(random() * TRACE_LANE_COUNT);
      const cluster = Math.floor(random() * 20) * (TRACE_DURATION / 20);
      const start = Math.min(TRACE_DURATION - 0.05, cluster + random() * 55);
      const durationScale = groupIndex === 0 ? 5 : groupIndex === 1 ? 14 : 28;
      const duration = Math.max(0.08, Math.pow(random(), 2.6) * durationScale);
      floatView[wordOffset] = start;
      floatView[wordOffset + 1] = duration;
      uintView[wordOffset + 2] = lane;
      uintView[wordOffset + 3] = groupIndex;
    }
    return {name, groupIndex, count, data: uintView};
  });
}
