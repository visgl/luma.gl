// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';

export type GLTFAudioGraphNode = {
  kind:
    | 'gain'
    | 'delay'
    | 'compressor'
    | 'waveshaper'
    | BiquadFilterType
    | 'splitter'
    | 'channelmerger'
    | 'channelmixer'
    | 'audiomixer';
  bypass?: boolean;
  params: {
    gain?: number;
    frequency?: number;
    qualityFactor?: number;
    delayTime?: number;
    maxDelayTime?: number;
    threshold?: number;
    knee?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    amount?: number;
    curve?: number[];
    oversample?: OverSampleType;
    outputChannels?: number;
    channelInterpretation?: ChannelInterpretation;
    interpolation?: 'linear' | 'custom';
    duration?: number;
  };
};
export type GLTFAudioGraphDefinition = {
  nodes: GLTFAudioGraphNode[];
  connections: {from: {node: number; output?: number}; to: {node: number; input?: number}}[];
  inputs?: {source: number; node: number; input?: number}[];
  outputs?: {node: number; output?: number; emitter: number}[];
};

/** Owns only processing nodes. Scheduled sources and destination nodes remain caller-owned. */
export class GLTFAudioGraph {
  readonly nodes: AudioNode[] = [];
  constructor(
    readonly definition: GLTFAudioGraphDefinition,
    context: BaseAudioContext,
    destination: AudioNode,
    getEmitterInputs: (index: number) => readonly AudioNode[]
  ) {
    // Multi-port routing processors cannot be replaced by a one-port bypass gain.
    for (const node of definition.nodes)
      assert(!node.bypass || (node.kind !== 'splitter' && node.kind !== 'channelmerger'));
    // Validate graph topology before allocating Web Audio resources.
    const validateEndpoint = (index: number, port = 0): void => {
      // Graph endpoints must name an existing node and a nonnegative integer port.
      assert(Number.isInteger(index) && Boolean(definition.nodes[index]));
      assert(Number.isInteger(port) && port >= 0);
    };
    for (const edge of definition.connections) {
      validateEndpoint(edge.from.node, edge.from.output);
      validateEndpoint(edge.to.node, edge.to.input);
    }
    for (const input of definition.inputs || []) {
      validateEndpoint(input.node, input.input);
      // Source indices are resolved by the owning audio controller.
      assert(Number.isInteger(input.source) && input.source >= 0);
    }
    for (const output of definition.outputs || []) {
      validateEndpoint(output.node, output.output);
      assert(Number.isInteger(output.emitter) && output.emitter >= 0);
    }
    const visiting = new Set<number>();
    const visited = new Set<number>();
    const visit = (index: number): void => {
      assert(definition.nodes[index] && !visiting.has(index));
      if (visited.has(index)) return;
      visiting.add(index);
      for (const edge of definition.connections) if (edge.from.node === index) visit(edge.to.node);
      visiting.delete(index);
      visited.add(index);
    };
    definition.nodes.forEach((_, index) => visit(index));
    try {
      definition.nodes.forEach((node, index) =>
        this.nodes.push(
          createProcessor(
            context,
            node,
            Math.max(
              1,
              ...definition.connections
                .filter(edge => edge.from.node === index)
                .map(edge => (edge.from.output ?? 0) + 1),
              ...(definition.outputs || [])
                .filter(output => output.node === index)
                .map(output => (output.output ?? 0) + 1)
            ),
            Math.max(
              1,
              ...definition.connections
                .filter(edge => edge.to.node === index)
                .map(edge => (edge.to.input ?? 0) + 1),
              ...(definition.inputs || [])
                .filter(input => input.node === index)
                .map(input => (input.input ?? 0) + 1)
            )
          )
        )
      );
      for (const edge of definition.connections) {
        this.nodes[edge.from.node].connect(
          this.nodes[edge.to.node],
          edge.from.output ?? 0,
          this.getInputPort(edge.to.node, edge.to.input ?? 0)
        );
      }
      if (definition.outputs) {
        for (const output of definition.outputs) {
          for (const input of getEmitterInputs(output.emitter))
            this.nodes[output.node].connect(input, output.output ?? 0);
        }
      } else {
        definition.nodes.forEach((_, index) => {
          if (!definition.connections.some(edge => edge.from.node === index))
            this.nodes[index].connect(destination);
        });
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  connectSource(index: number, source: AudioNode): void {
    for (const input of this.definition.inputs || []) {
      if (input.source === index)
        source.connect(this.nodes[input.node], 0, this.getInputPort(input.node, input.input ?? 0));
    }
  }

  /** Apply a scene-driven gain change using the authored transition shape. */
  setGain(index: number, gain: number, time = this.nodes[index].context.currentTime): void {
    const definition = this.definition.nodes[index];
    // Gain transitions apply only to active gain processors and nonnegative targets.
    assert(definition.kind === 'gain' && !definition.bypass && gain >= 0);
    const parameter = (this.nodes[index] as GainNode).gain;
    const duration = definition.params.duration ?? 0;
    const initialGain = parameter.value;
    parameter.cancelAndHoldAtTime(time);
    parameter.setValueAtTime(initialGain, time);
    if (duration <= 0) {
      parameter.setValueAtTime(gain, time);
    } else if (definition.params.interpolation === 'custom') {
      const curve = definition.params.curve;
      // Custom transition samples are normalized gain factors.
      assert(curve && curve.length >= 2 && curve.every(value => value >= 0 && value <= 1));
      parameter.setValueCurveAtTime(
        Float32Array.from(curve, value => value * gain),
        time,
        duration
      );
    } else {
      parameter.linearRampToValueAtTime(gain, time + duration);
    }
  }

  destroy(): void {
    for (const node of this.nodes) node.disconnect();
    this.nodes.length = 0;
  }

  private getInputPort(index: number, port: number): number {
    return this.definition.nodes[index].kind === 'audiomixer' ? 0 : port;
  }
}

function createProcessor(
  context: BaseAudioContext,
  definition: GLTFAudioGraphNode,
  outputs: number,
  inputs: number
): AudioNode {
  const parameters = definition.params;
  if (definition.bypass) return context.createGain();
  switch (definition.kind) {
    case 'gain': {
      const node = context.createGain();
      node.gain.value = parameters.gain ?? 1;
      return node;
    }
    case 'delay': {
      const node = context.createDelay(parameters.maxDelayTime ?? 1);
      node.delayTime.value = parameters.delayTime ?? 0;
      return node;
    }
    case 'compressor': {
      const node = context.createDynamicsCompressor();
      node.threshold.value = parameters.threshold ?? -24;
      node.knee.value = parameters.knee ?? 30;
      node.ratio.value = parameters.ratio ?? 12;
      node.attack.value = parameters.attack ?? 0.003;
      node.release.value = parameters.release ?? 0.25;
      return node;
    }
    case 'waveshaper': {
      const node = context.createWaveShaper();
      const drive = 1 + 20 * (parameters.amount ?? 0);
      node.curve = parameters.curve
        ? new Float32Array(parameters.curve)
        : Float32Array.from(
            {length: 4097},
            (_, index) => Math.tanh((index / 2048 - 1) * drive) / Math.tanh(drive)
          );
      node.oversample = parameters.oversample ?? 'none';
      return node;
    }
    case 'splitter': {
      const node = context.createChannelSplitter(outputs);
      node.channelInterpretation = parameters.channelInterpretation ?? 'discrete';
      return node;
    }
    case 'channelmerger': {
      const node = context.createChannelMerger(inputs);
      node.channelInterpretation = parameters.channelInterpretation ?? 'discrete';
      return node;
    }
    case 'channelmixer': {
      const node = context.createGain();
      node.channelCountMode = 'explicit';
      node.channelCount = parameters.outputChannels!;
      node.channelInterpretation = parameters.channelInterpretation ?? 'speakers';
      return node;
    }
    case 'audiomixer': {
      const node = context.createGain();
      node.channelInterpretation = parameters.channelInterpretation ?? 'speakers';
      return node;
    }
    default: {
      const node = context.createBiquadFilter();
      node.type = definition.kind;
      node.frequency.value = parameters.frequency!;
      node.Q.value = parameters.qualityFactor ?? 1;
      node.gain.value = parameters.gain ?? 0;
      return node;
    }
  }
}
