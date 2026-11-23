// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const SAMPLE_COUNT = 1_048_576;
export const INCIDENT_SAMPLE = 638_983;
export const GAP_START = 798_720;
export const GAP_END = 823_296;
export const SERIES = [
  {name: 'Request latency', unit: 'ms', maximum: 400, color: [0.25, 0.86, 0.95]},
  {name: 'Queue depth', unit: 'jobs', maximum: 250, color: [0.75, 0.58, 1]},
  {name: 'Error rate', unit: '%', maximum: 20, color: [1, 0.62, 0.36]}
] as const;

/** Deterministic synthetic telemetry, including one-sample spikes and explicit sensor gaps. */
export function makeTelemetry(channel: number, sampleCount = SAMPLE_COUNT): Float32Array {
  const values = new Float32Array(sampleCount);
  for (let sample = 0; sample < sampleCount; sample++) {
    const phase = sample / SAMPLE_COUNT;
    const noise = ((Math.imul(sample + 1, 1664525) >>> 8) % 1024) / 1024;
    const wave = 0.5 + 0.5 * Math.sin(phase * 84 + channel);
    const incident = Math.exp(-(((sample - INCIDENT_SAMPLE) / 4200) ** 2));
    values[sample] =
      channel === 0
        ? 35 + wave * 24 + noise * 12 + incident * 175
        : channel === 1
          ? 12 + wave * 32 + noise * 8 + incident * 180
          : 0.3 + wave + noise * 0.6 + incident * 10;
    if (sample % 8191 === 4093) values[sample] += SERIES[channel].maximum * 0.35;
    if (sample === INCIDENT_SAMPLE) values[sample] = SERIES[channel].maximum * 0.97;
    if (sample >= GAP_START && sample < GAP_END) values[sample] = Number.NaN;
  }
  return values;
}
