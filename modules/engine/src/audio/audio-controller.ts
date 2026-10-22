// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Matrix4, Vector3} from '@math.gl/core';
import type {GroupNode} from '../scenegraph/group-node';
import {AudioGraph, type AudioGraphDefinition} from './audio-graph';
import {
  AudioReverbBus,
  createParametricAudioResponse,
  type AudioParametricReverb,
  selectAudioEnvironmentZone,
  type AudioEnvironmentZone
} from './audio-environment';

export type AudioSourceProperties = {
  when?: number;
  duration?: number;
  offset?: number;
  loopStart?: number;
  loopEnd?: number;
  channelInterpretation?: ChannelInterpretation;
  oscillator?: {
    type: OscillatorType;
    frequency?: number;
    detune?: number;
    pulseWidth?: number;
    periodicWave?: {real: number[]; imag: number[]};
  };
};

/** Source-independent audio assets, scheduled sources, and spatial emitters. */
export type AudioDefinition = {
  audio: {uri?: string; data?: ArrayBuffer; mimeType?: string}[];
  sources: {
    audio?: number;
    gain?: number;
    loop?: boolean;
    autoPlay?: boolean;
    playbackRate?: number;
    graph?: AudioSourceProperties;
  }[];
  emitters: {
    name?: string;
    type: 'global' | 'positional';
    gain?: number;
    sources?: number[];
    environment?: {directLevel?: number; reverbLevel?: number; environment?: number};
    positional?: {
      shapeType?: 'omnidirectional' | 'cone';
      coneInnerAngle?: number;
      coneOuterAngle?: number;
      coneOuterGain?: number;
      distanceModel?: DistanceModelType;
      maxDistance?: number;
      refDistance?: number;
      rolloffFactor?: number;
      airAbsorption?: {enabled?: boolean; cutoffAtMaxDistance?: number};
    };
  }[];
};

export type AudioControllerOptions = {
  scene: GroupNode;
  definition: AudioDefinition;
  graphs?: readonly AudioGraphDefinition[];
  nodes?: readonly AudioNodeBinding[];
  emitterIndices?: readonly number[];
  environment?: AudioEnvironmentDefinition;
  activeListener?: number;
  defaultEnvironment?: number;
  /** Borrowed context; the application resumes and closes it. No context is created implicitly. */
  audioContext: BaseAudioContext;
  /** Absolute base URL, used to resolve external audio. */
  baseUrl: string;
  /** Authored camera node used for environment listener selection. */
  activeCameraNode?: GroupNode;
  /** Use the application viewer pose while retaining authored listener audio properties. */
  listenerPose?: 'authored' | 'viewer';
  fetch?: typeof fetch;
};

export type AudioNodeBinding = {
  node: GroupNode;
  emitterIndices?: readonly number[];
  listener?: number;
  zone?: Omit<AudioEnvironmentZone, 'worldMatrix'>;
};
export type AudioEnvironmentDefinition = {
  listeners?: {gain?: number; spatializationModel?: string}[];
  environments?: {
    reverb?: AudioParametricReverb & {
      type?: string;
      audio?: number;
      mix?: number;
      normalize?: boolean;
    };
  }[];
};

type EmitterBinding = {
  index: number;
  definition: AudioDefinition['emitters'][number];
  node?: GroupNode;
  gain: GainNode;
  panner?: PannerNode;
  airFilter?: BiquadFilterNode;
};

/** Scene-bound Web Audio playback, independent of the asset format and GPU backend. */
export class AudioController {
  readonly gain: GainNode;
  readonly definition: AudioDefinition;
  private readonly options: AudioControllerOptions;
  private readonly scene: GroupNode;
  private readonly nodeBindings = new Map<GroupNode, AudioNodeBinding>();
  private readonly listenerGain: GainNode;
  private readonly emitters: EmitterBinding[] = [];
  private readonly graphs = new Map<number, AudioGraph>();
  private readonly reverbBuses = new Map<number, AudioReverbBus>();
  private readonly directGains: GainNode[] = [];
  private readonly environmentSends: {
    gain: GainNode;
    environment: number;
    forced?: number;
    level: number;
  }[] = [];
  private readonly graphSources = new Set<number>();
  private readonly graphEmitters = new Set<number>();
  private readonly playing = new Map<AudioScheduledSourceNode, GainNode>();
  private buffers = new Map<number, AudioBuffer>();
  private initialization?: Promise<void>;
  private readonly abortController = new AbortController();
  private destroyed = false;
  private playbackGeneration = 0;
  private audioClockStart?: number;

  constructor(options: AudioControllerOptions) {
    this.options = options;
    const {audioContext} = options;
    this.scene = options.scene;
    this.definition = options.definition;
    const graphDefinitions = options.graphs;
    this.gain = audioContext.createGain();
    this.listenerGain = audioContext.createGain();
    this.gain.connect(this.listenerGain);
    this.listenerGain.connect(audioContext.destination);
    const activeNodes = new Set<GroupNode>();
    this.scene.preorderTraversal(node => activeNodes.add(node as GroupNode));
    const activeEmitters = new Set<number>(options.emitterIndices);
    for (const binding of options.nodes || []) {
      if (!activeNodes.has(binding.node)) continue;
      for (const emitter of binding.emitterIndices || []) activeEmitters.add(emitter);
    }
    const activeGraphs = new Map<number, AudioGraphDefinition>();
    graphDefinitions?.forEach((graph, index) => {
      if (!graph.outputs?.some(output => activeEmitters.has(output.emitter))) return;
      activeGraphs.set(index, graph);
      for (const input of graph.inputs || []) this.graphSources.add(input.source);
      for (const output of graph.outputs || []) this.graphEmitters.add(output.emitter);
    });
    try {
      for (const binding of options.nodes || []) {
        if (!activeNodes.has(binding.node)) continue;
        this.nodeBindings.set(binding.node, binding);
        for (const emitterIndex of binding.emitterIndices || [])
          this.addEmitter(emitterIndex, binding.node);
      }
      for (const emitterIndex of options.emitterIndices || []) this.addEmitter(emitterIndex);
      for (const [graphIndex, definition] of activeGraphs) {
        this.graphs.set(
          graphIndex,
          new AudioGraph(definition, audioContext, this.gain, index =>
            this.emitters
              .filter(emitter => emitter.index === index)
              .map(emitter => emitter.panner || emitter.gain)
          )
        );
      }
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  /** Fetch and decode once. Safe to call repeatedly; does not start playback. */
  initialize(): Promise<void> {
    if (this.destroyed) return Promise.reject(new Error('Audio controller destroyed'));
    this.initialization ||= this.loadBuffers().catch(error => {
      this.initialization = undefined;
      throw error;
    });
    return this.initialization;
  }

  /** Restart sources. Resume the application's AudioContext from a user gesture first. */
  async play(
    options: {autoplayOnly?: boolean; sourceIndices?: readonly number[]; restart?: boolean} = {}
  ): Promise<void> {
    if (options.restart !== false) this.stop();
    const generation = this.playbackGeneration;
    await this.initialize();
    if (this.destroyed || generation !== this.playbackGeneration) return;
    const startTime = this.options.audioContext.currentTime;
    if (options.restart !== false || this.audioClockStart === undefined)
      this.audioClockStart = startTime;
    for (const emitter of this.emitters) {
      if (this.graphEmitters.has(emitter.index)) continue;
      for (const sourceIndex of emitter.definition.sources || []) {
        if (options.sourceIndices && !options.sourceIndices.includes(sourceIndex)) continue;
        this.startSource(sourceIndex, startTime, options.autoplayOnly, gain =>
          gain.connect(emitter.panner || emitter.gain)
        );
      }
    }
    for (const sourceIndex of this.graphSources) {
      if (options.sourceIndices && !options.sourceIndices.includes(sourceIndex)) continue;
      this.startSource(sourceIndex, startTime, options.autoplayOnly, gain => {
        for (const graph of this.graphs.values()) graph.connectSource(sourceIndex, gain);
      });
    }
  }

  /** Change a graph gain using its authored interpolation and duration. */
  setGraphGain(graphIndex: number, nodeIndex: number, gain: number): void {
    // Graph and node indices follow the resolved processing graph arrays.
    const graph = this.graphs.get(graphIndex);
    assert(!this.destroyed && graph);
    graph.setGain(nodeIndex, gain);
  }

  private startSource(
    sourceIndex: number,
    startTime: number,
    autoplayOnly: boolean | undefined,
    connect: (gain: GainNode) => void
  ): void {
    const definition = this.definition.sources[sourceIndex];
    assert(definition);
    if (autoplayOnly && !definition.autoPlay) return;
    const context = this.options.audioContext;
    const extended = definition.graph;
    const oscillator = extended?.oscillator;
    assert(!(definition.audio !== undefined && oscillator));
    let source: AudioBufferSourceNode | OscillatorNode;
    if (oscillator) {
      const node = context.createOscillator();
      node.frequency.value = oscillator.frequency ?? 440;
      node.detune.value = oscillator.detune ?? 0;
      // The initial procedural profile supports the standard square duty cycle.
      assert(oscillator.pulseWidth === undefined || oscillator.pulseWidth === 0.5);
      if (oscillator.type === 'custom') {
        assert(oscillator.periodicWave);
        node.setPeriodicWave(
          context.createPeriodicWave(
            new Float32Array(oscillator.periodicWave.real),
            new Float32Array(oscillator.periodicWave.imag)
          )
        );
      } else node.type = oscillator.type;
      source = node;
    } else {
      const node = context.createBufferSource();
      assert(definition.audio !== undefined);
      node.buffer = this.buffers.get(definition.audio)!;
      node.loop = definition.loop ?? false;
      node.loopStart = extended?.loopStart ?? 0;
      node.loopEnd = extended?.loopEnd ?? 0;
      node.playbackRate.value = definition.playbackRate ?? 1;
      source = node;
    }
    if (extended?.channelInterpretation)
      source.channelInterpretation = extended.channelInterpretation;
    const gain = this.options.audioContext.createGain();
    gain.gain.value = definition.gain ?? 1;
    source.connect(gain);
    connect(gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      this.playing.delete(source);
    };
    this.playing.set(source, gain);
    const scheduledTime =
      extended?.when === undefined
        ? startTime
        : Math.max(startTime, this.audioClockStart! + extended.when);
    if (source instanceof AudioBufferSourceNode) {
      if (extended?.duration === undefined) source.start(scheduledTime, extended?.offset ?? 0);
      else source.start(scheduledTime, extended.offset ?? 0, extended.duration);
    } else {
      source.start(scheduledTime);
      if (extended?.duration !== undefined) source.stop(scheduledTime + extended.duration);
    }
  }

  stop(): void {
    this.playbackGeneration++;
    for (const [source, gain] of this.playing) {
      source.onended = null;
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    this.playing.clear();
    for (const bus of this.reverbBuses.values()) bus.reset();
  }

  /** Call after animation updates, with the camera's inverse view matrix. Distances are in meters. */
  update(listenerMatrix: Matrix4): void {
    if (this.destroyed) return;
    const environmentDefinition = this.options.environment;
    if (environmentDefinition) {
      const bindings: {index: number; node: GroupNode; matrix: Matrix4}[] = [];
      this.scene.preorderTraversal((runtimeNode, {worldMatrix}) => {
        const binding = this.nodeBindings.get(runtimeNode as GroupNode);
        if (binding?.listener !== undefined)
          bindings.push({
            index: binding.listener,
            node: binding.node,
            matrix: new Matrix4(worldMatrix)
          });
      });
      const selected =
        bindings.find(binding => binding.index === this.options.activeListener) ??
        bindings.find(binding => binding.node === this.options.activeCameraNode) ??
        bindings[0];
      const listenerDefinition = selected
        ? environmentDefinition.listeners?.[selected.index]
        : undefined;
      if (selected && listenerDefinition && this.options.listenerPose !== 'viewer')
        listenerMatrix = selected.matrix;
      this.listenerGain.gain.value = listenerDefinition?.gain ?? 1;
      for (const emitter of this.emitters) {
        if (emitter.panner)
          emitter.panner.panningModel =
            listenerDefinition?.spatializationModel === 'HRTF' ? 'HRTF' : 'equalpower';
      }
    }
    const listenerPosition = listenerMatrix.getTranslation();
    const zones: AudioEnvironmentZone[] = [];
    this.scene.preorderTraversal((runtimeNode, {worldMatrix}) => {
      const zone = this.nodeBindings.get(runtimeNode as GroupNode)?.zone;
      if (zone?.shape) zones.push({...zone, worldMatrix: new Matrix4(worldMatrix)});
    });
    const selectedZone = selectAudioEnvironmentZone(zones, listenerPosition);
    const defaultEnvironment = this.options.defaultEnvironment;
    for (const send of this.environmentSends) {
      const environment = send.forced ?? selectedZone?.environment ?? defaultEnvironment;
      const weight = send.forced !== undefined ? 1 : (selectedZone?.weight ?? 1);
      const outside = selectedZone?.outsideEnvironment ?? defaultEnvironment;
      send.gain.gain.value =
        send.level *
        ((send.environment === environment ? weight : 0) +
          (send.forced === undefined && send.environment === outside ? 1 - weight : 0));
    }
    const listenerForward = new Vector3(0, 0, -1).transformAsVector(listenerMatrix).normalize();
    const listenerUp = new Vector3(0, 1, 0).transformAsVector(listenerMatrix).normalize();
    const listener = this.options.audioContext.listener;
    listener.positionX.value = listenerPosition[0];
    listener.positionY.value = listenerPosition[1];
    listener.positionZ.value = listenerPosition[2];
    listener.forwardX.value = listenerForward[0];
    listener.forwardY.value = listenerForward[1];
    listener.forwardZ.value = listenerForward[2];
    listener.upX.value = listenerUp[0];
    listener.upY.value = listenerUp[1];
    listener.upZ.value = listenerUp[2];
    this.scene.preorderTraversal((node, {worldMatrix}) => {
      for (const emitter of this.emitters) {
        if (emitter.node !== node || !emitter.panner) continue;
        const position = worldMatrix.getTranslation();
        const direction = new Vector3(0, 0, -1).transformAsVector(worldMatrix).normalize();
        const panner = emitter.panner;
        panner.positionX.value = position[0];
        panner.positionY.value = position[1];
        panner.positionZ.value = position[2];
        panner.orientationX.value = direction[0];
        panner.orientationY.value = direction[1];
        panner.orientationZ.value = direction[2];
        const distance = Math.hypot(
          ...position.map((value, index) => value - listenerPosition[index])
        );
        if (emitter.airFilter) {
          const positional = emitter.definition.positional!;
          const fraction = Math.min(
            1,
            Math.max(
              0,
              (distance - (positional.refDistance ?? 1)) /
                (positional.maxDistance! - (positional.refDistance ?? 1))
            )
          );
          const cutoff = positional.airAbsorption?.cutoffAtMaxDistance ?? 5000;
          emitter.airFilter.frequency.value = Math.exp(
            Math.log(20000) + fraction * (Math.log(Math.max(1, cutoff)) - Math.log(20000))
          );
        }
        emitter.gain.gain.value =
          (emitter.definition.gain ?? 1) * getDistanceGain(emitter.definition.positional, distance);
      }
    });
  }

  /** Disconnect owned nodes and cancel pending loads; never closes the borrowed context. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController.abort();
    this.stop();
    for (const emitter of this.emitters) {
      emitter.panner?.disconnect();
      emitter.airFilter?.disconnect();
      emitter.gain.disconnect();
    }
    for (const graph of this.graphs.values()) graph.destroy();
    for (const bus of this.reverbBuses.values()) bus.destroy();
    this.reverbBuses.clear();
    for (const direct of this.directGains) direct.disconnect();
    this.gain.disconnect();
    this.listenerGain.disconnect();
    this.buffers.clear();
  }

  private addEmitter(index: number, node?: GroupNode): void {
    const definition = this.definition.emitters[index];
    // Positional emitters require a node; custom emitter shapes are not supported.
    assert(
      definition && (definition.type === 'global' || (definition.type === 'positional' && node))
    );
    assert(
      !definition.positional?.shapeType ||
        ['cone', 'omnidirectional'].includes(definition.positional.shapeType)
    );
    for (const sourceIndex of this.graphEmitters.has(index) ? [] : definition.sources || []) {
      // Every source must reference an audio payload.
      const source = this.definition.sources[sourceIndex];
      assert(
        source &&
          (source.audio !== undefined
            ? this.definition.audio[source.audio]
            : source.graph?.oscillator)
      );
    }
    const gain = this.options.audioContext.createGain();
    gain.gain.value = definition.gain ?? 1;
    const direct = this.options.audioContext.createGain();
    direct.gain.value = definition.environment?.directLevel ?? 1;
    gain.connect(direct);
    direct.connect(this.gain);
    this.directGains.push(direct);
    const binding: EmitterBinding = {index, definition, node, gain};
    this.emitters.push(binding);
    if (definition.type === 'positional') {
      const panner = this.options.audioContext.createPanner();
      binding.panner = panner;
      panner.panningModel = 'HRTF';
      // Compute draft distance attenuation explicitly: maxDistance=0 means unbounded.
      panner.rolloffFactor = 0;
      const positional = definition.positional;
      if (positional?.shapeType === 'cone') {
        panner.coneInnerAngle = ((positional.coneInnerAngle ?? Math.PI * 2) * 180) / Math.PI;
        panner.coneOuterAngle = ((positional.coneOuterAngle ?? Math.PI * 2) * 180) / Math.PI;
        panner.coneOuterGain = positional.coneOuterGain ?? 0;
      }
      const airAbsorption = positional?.airAbsorption;
      if (
        airAbsorption?.enabled &&
        (positional?.maxDistance ?? 0) > (positional?.refDistance ?? 1)
      ) {
        const filter = this.options.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = Math.SQRT1_2;
        filter.frequency.value = 20000;
        binding.airFilter = filter;
        panner.connect(filter);
        filter.connect(gain);
      } else panner.connect(gain);
    }
  }

  private async loadBuffers(): Promise<void> {
    const {audioContext, baseUrl} = this.options;
    const sourceIndices = new Set([
      ...this.graphSources,
      ...this.emitters
        .filter(emitter => !this.graphEmitters.has(emitter.index))
        .flatMap(emitter => emitter.definition.sources || [])
    ]);
    const audioIndices = new Set(
      [...sourceIndices].map(index => {
        const source = this.definition.sources[index];
        assert(
          source &&
            (source.audio !== undefined
              ? this.definition.audio[source.audio]
              : source.graph?.oscillator)
        );
        return source.audio;
      })
    );
    const environments = this.options.environment?.environments;
    for (const environment of environments || []) {
      if (environment.reverb?.type === 'impulseResponse' && environment.reverb.audio !== undefined)
        audioIndices.add(environment.reverb.audio);
    }
    const buffers = await Promise.all(
      [...audioIndices]
        .filter((index): index is number => index !== undefined)
        .map(async audioIndex => {
          const definition = this.definition.audio[audioIndex];
          let bytes: ArrayBuffer;
          if (definition.data !== undefined) {
            bytes = definition.data.slice(0);
          } else {
            const response = await (this.options.fetch || fetch)(
              new URL(definition.uri!, baseUrl),
              {
                signal: this.abortController.signal
              }
            );
            if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`);
            bytes = await response.arrayBuffer();
          }
          return [audioIndex, await audioContext.decodeAudioData(bytes)] as const;
        })
    );
    if (!this.destroyed) {
      this.buffers = new Map(buffers);
      environments?.forEach((environment, index) => {
        const reverb = environment.reverb;
        if (!reverb) return;
        const response =
          reverb.type === 'impulseResponse'
            ? this.buffers.get(reverb.audio!)
            : createParametricAudioResponse(audioContext, reverb);
        assert(response);
        const bus = new AudioReverbBus(audioContext, response, this.gain, {
          ...reverb,
          normalize: reverb.type === 'impulseResponse' ? reverb.normalize : false
        });
        this.reverbBuses.set(index, bus);
        const defaultEnvironment = this.options.defaultEnvironment;
        for (const emitter of this.emitters) {
          const send = emitter.definition.environment;
          const level = send?.reverbLevel ?? (emitter.definition.type === 'positional' ? 1 : 0);
          const gain = bus.connectSend(
            emitter.gain,
            (send?.environment ?? defaultEnvironment) === index ? level : 0
          );
          this.environmentSends.push({gain, environment: index, forced: send?.environment, level});
        }
      });
    }
  }
}

function getDistanceGain(
  positional: AudioDefinition['emitters'][number]['positional'] = {},
  distance: number
): number {
  const reference = positional.refDistance ?? 1;
  const maximum = positional.maxDistance || Infinity;
  const clamped = Math.max(reference, Math.min(distance, maximum));
  const rolloff = positional.rolloffFactor ?? 1;
  switch (positional.distanceModel) {
    case 'linear':
      return maximum <= reference
        ? distance <= reference
          ? 1
          : 0
        : Math.max(0, 1 - (rolloff * (clamped - reference)) / (maximum - reference));
    case 'exponential':
      return (clamped / reference) ** -rolloff;
    default:
      return reference / (reference + rolloff * (clamped - reference));
  }
}
