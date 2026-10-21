// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';

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
): {environment: number; weight: number} | undefined {
  let selected: {zone: GLTFAudioEnvironmentZone; volume: number; distance: number} | undefined;
  for (const zone of zones) {
    const scale = zone.worldMatrix.getScale();
    let distance: number;
    let volume: number;
    if (zone.shape.type === 'sphere') {
      const center = zone.worldMatrix.getTranslation();
      const radius = zone.shape.radius * Math.max(...scale);
      distance = radius - Math.hypot(...center.map((value, index) => value - position[index]));
      volume = (4 / 3) * Math.PI * radius ** 3;
    } else {
      const local = new Matrix4(zone.worldMatrix).invert().transformAsPoint(Array.from(position));
      const margins = zone.shape.size.map(
        (extent, index) => (extent / 2 - Math.abs(local[index])) * scale[index]
      );
      distance = Math.min(...margins);
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
      selected = {zone, volume, distance};
    }
  }
  return selected
    ? {
        environment: selected.zone.environment,
        weight: selected.zone.blendDistance
          ? Math.min(1, selected.distance / selected.zone.blendDistance)
          : 1
      }
    : undefined;
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
