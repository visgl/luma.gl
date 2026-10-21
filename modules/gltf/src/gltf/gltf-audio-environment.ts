// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {assert} from '@luma.gl/core';

export type GLTFAudioEnvironmentZone = {
  environment: number;
  worldMatrix: Matrix4;
  shape: {type: 'box'; size: [number, number, number]} | {type: 'sphere'; radius: number};
  priority?: number;
  blendDistance?: number;
};

/** Select the listener's zone; equal priority favors the smallest transformed volume. */
export function selectAudioEnvironmentZone(
  zones: readonly GLTFAudioEnvironmentZone[],
  position: ArrayLike<number>
): {environment: number; weight: number; outsideEnvironment?: number} | undefined {
  let selected:
    | {zone: GLTFAudioEnvironmentZone; volume: number; distance: number; boundary: number[]}
    | undefined;
  for (const zone of zones) {
    const scale = zone.worldMatrix.getScale();
    let distance: number;
    let volume: number;
    let boundary: number[];
    if (zone.shape.type === 'sphere') {
      const center = zone.worldMatrix.getTranslation();
      const radius = zone.shape.radius * Math.max(...scale);
      distance = radius - Math.hypot(...center.map((value, index) => value - position[index]));
      volume = (4 / 3) * Math.PI * radius ** 3;
      const offset = center.map((value, index) => position[index] - value);
      const length = Math.hypot(...offset);
      boundary = Array.from(center).map(
        (value, index) =>
          value + (length ? offset[index] / length : Number(index === 0)) * (radius + 0.00001)
      );
    } else {
      const local = new Matrix4(zone.worldMatrix).invert().transformAsPoint(Array.from(position));
      const margins = zone.shape.size.map(
        (extent, index) => (extent / 2 - Math.abs(local[index])) * scale[index]
      );
      distance = Math.min(...margins);
      const axis = margins.indexOf(distance);
      local[axis] =
        (Math.sign(local[axis]) || 1) * (zone.shape.size[axis] / 2 + 0.00001 / scale[axis]);
      boundary = Array.from(zone.worldMatrix.transformAsPoint(local));
      volume = zone.shape.size.reduce(
        (product, extent, index) => product * extent * scale[index],
        1
      );
    }
    if (distance < 0) continue;
    if (
      !selected ||
      (zone.priority ?? 0) > (selected.zone.priority ?? 0) ||
      ((zone.priority ?? 0) === (selected.zone.priority ?? 0) && volume < selected.volume)
    ) {
      selected = {zone, volume, distance, boundary};
    }
  }
  if (!selected) return undefined;
  const weight = selected.zone.blendDistance
    ? Math.min(1, selected.distance / selected.zone.blendDistance)
    : 1;
  const outside =
    weight < 1
      ? selectAudioEnvironmentZone(
          zones.filter(zone => zone !== selected.zone),
          selected.boundary
        )
      : undefined;
  return {
    environment: selected.zone.environment,
    weight,
    ...(outside ? {outsideEnvironment: outside.environment} : {})
  };
}

/** Owns an impulse-response return bus; the decoded response and destinations are borrowed. */
export class GLTFAudioReverbBus {
  readonly input: GainNode;
  convolver: ConvolverNode;
  readonly output: GainNode;
  private readonly sends: GainNode[] = [];

  constructor(
    context: BaseAudioContext,
    response: AudioBuffer,
    destination: AudioNode,
    options: {mix?: number; normalize?: boolean} = {}
  ) {
    this.input = context.createGain();
    this.convolver = context.createConvolver();
    this.output = context.createGain();
    this.convolver.normalize = options.normalize ?? true;
    this.convolver.buffer = response;
    this.output.gain.value = options.mix ?? 0.5;
    this.input.connect(this.convolver);
    this.convolver.connect(this.output);
    this.output.connect(destination);
  }

  connectSend(source: AudioNode, level: number): GainNode {
    const send = source.context.createGain();
    send.gain.value = level;
    source.connect(send);
    send.connect(this.input);
    this.sends.push(send);
    return send;
  }

  /** Replace convolution state so stopped playback cannot leak its tail into a restart. */
  reset(): void {
    const previous = this.convolver;
    this.input.disconnect(previous);
    previous.disconnect();
    this.convolver = previous.context.createConvolver();
    this.convolver.normalize = previous.normalize;
    this.convolver.buffer = previous.buffer;
    this.input.connect(this.convolver);
    this.convolver.connect(this.output);
  }

  destroy(): void {
    for (const send of this.sends) send.disconnect();
    this.sends.length = 0;
    this.input.disconnect();
    this.convolver.disconnect();
    this.output.disconnect();
  }
}

export type GLTFAudioParametricReverb = {
  preset?: string;
  decayTime?: number;
  decayHFRatio?: number;
  reflectionsGain?: number;
  reflectionsDelay?: number;
  reverbGain?: number;
  reverbDelay?: number;
  diffusion?: number;
  density?: number;
};

/** Deterministic two-band diffuse response; this is an approximation of the draft parametric model. */
export function createParametricAudioResponse(
  context: BaseAudioContext,
  parameters: GLTFAudioParametricReverb
): AudioBuffer {
  // The initial diffuse-response profile supports the default density and diffusion only.
  assert((parameters.density ?? 1) === 1 && (parameters.diffusion ?? 1) === 1);
  const presets: Record<string, [number, number, number, number]> = {
    generic: [1.49, 0.83, 0.007, 0.011],
    smallRoom: [0.4, 0.83, 0.002, 0.003],
    mediumRoom: [1.1, 0.83, 0.01, 0.011],
    largeRoom: [4.32, 0.59, 0.02, 0.03],
    bathroom: [1.49, 0.54, 0.007, 0.011],
    concertHall: [3.92, 0.7, 0.02, 0.029],
    cathedral: [5.5, 0.6, 0.025, 0.04],
    cave: [2.91, 1.3, 0.015, 0.022],
    arena: [7.24, 0.33, 0.02, 0.03],
    hangar: [10.05, 0.23, 0.02, 0.03],
    corridor: [1.79, 0.59, 0.007, 0.011],
    forest: [1.49, 0.54, 0.162, 0.088],
    underwater: [1.49, 0.1, 0.007, 0.011]
  };
  const preset = parameters.preset ? presets[parameters.preset] : undefined;
  // Unknown presets must not silently acquire generic acoustics.
  assert(!parameters.preset || preset);
  const decay = parameters.decayTime ?? preset?.[0] ?? 1.5;
  const highFrequencyDecay = decay * (parameters.decayHFRatio ?? preset?.[1] ?? 0.83);
  const earlyDelay = parameters.reflectionsDelay ?? preset?.[2] ?? 0.02;
  const tailDelay = earlyDelay + (parameters.reverbDelay ?? preset?.[3] ?? 0.04);
  assert(decay > 0 && highFrequencyDecay > 0 && earlyDelay >= 0 && tailDelay >= earlyDelay);
  const response = context.createBuffer(
    2,
    Math.ceil((tailDelay + Math.max(decay, highFrequencyDecay)) * context.sampleRate),
    context.sampleRate
  );
  for (let channel = 0; channel < 2; channel++) {
    const samples = response.getChannelData(channel);
    let state = 12345 + channel * 98765;
    let lowFrequency = 0;
    const normalization = 1 / Math.sqrt(context.sampleRate * decay);
    for (let index = Math.ceil(tailDelay * context.sampleRate); index < samples.length; index++) {
      state = (Math.imul(state, 1664525) + 1013904223) | 0;
      const noise = state / 2147483648;
      lowFrequency += 0.15 * (noise - lowFrequency);
      const time = index / context.sampleRate - tailDelay;
      samples[index] =
        (parameters.reverbGain ?? 1) *
        normalization *
        (lowFrequency * Math.exp((-Math.log(1000) * time) / decay) +
          (noise - lowFrequency) * Math.exp((-Math.log(1000) * time) / highFrequencyDecay));
    }
    samples[Math.round(earlyDelay * context.sampleRate)] += parameters.reflectionsGain ?? 1;
  }
  return response;
}
