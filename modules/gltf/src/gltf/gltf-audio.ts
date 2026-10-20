// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {Matrix4, Vector3} from '@math.gl/core';
import type {GroupNode} from '@luma.gl/engine';
import type {GLTFScenegraphs} from './create-scenegraph-from-gltf';

/** Draft KHR_audio_emitter definitions. */
export type GLTFAudioExtension = {
  audio: {uri?: string; bufferView?: number; mimeType?: string}[];
  sources: {audio: number; gain?: number; loop?: boolean; autoPlay?: boolean; autoplay?: boolean}[];
  emitters: {
    name?: string;
    type: 'global' | 'positional';
    gain?: number;
    sources?: number[];
    positional?: {
      shapeType?: 'omnidirectional' | 'cone';
      coneInnerAngle?: number;
      coneOuterAngle?: number;
      coneOuterGain?: number;
      distanceModel?: DistanceModelType;
      maxDistance?: number;
      refDistance?: number;
      rolloffFactor?: number;
    };
  }[];
};

export type GLTFAudioControllerOptions = {
  scenegraphs: GLTFScenegraphs;
  /** Borrowed context; the application resumes and closes it. No context is created implicitly. */
  audioContext: BaseAudioContext;
  /** Absolute URL of the glTF document, used to resolve external audio. */
  baseUrl: string;
  sceneIndex?: number;
  fetch?: typeof fetch;
};

type EmitterBinding = {
  definition: GLTFAudioExtension['emitters'][number];
  node?: GroupNode;
  gain: GainNode;
  panner?: PannerNode;
};

/** Optional Web Audio playback for the KHR_audio_emitter draft, independent of the GPU backend. */
export class GLTFAudioController {
  readonly gain: GainNode;
  readonly extension: GLTFAudioExtension;
  private readonly options: GLTFAudioControllerOptions;
  private readonly scene: GroupNode;
  private readonly emitters: EmitterBinding[] = [];
  private readonly playing = new Map<AudioBufferSourceNode, GainNode>();
  private buffers: AudioBuffer[] = [];
  private initialization?: Promise<void>;
  private readonly abortController = new AbortController();
  private destroyed = false;
  private playbackGeneration = 0;

  constructor(options: GLTFAudioControllerOptions) {
    this.options = options;
    const {scenegraphs, audioContext, sceneIndex = 0} = options;
    this.scene = scenegraphs.scenes[sceneIndex];
    // The selected scene must exist.
    assert(this.scene);
    this.extension = (scenegraphs.gltf.extensions?.['KHR_audio_emitter'] as
      | GLTFAudioExtension
      | undefined) || {
      audio: [],
      sources: [],
      emitters: []
    };
    this.gain = audioContext.createGain();
    this.gain.connect(audioContext.destination);
    const activeNodes = new Set<GroupNode>();
    this.scene.preorderTraversal(node => activeNodes.add(node as GroupNode));
    try {
      scenegraphs.gltf.nodes.forEach((node, nodeIndex) => {
        const runtimeNode = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex);
        if (runtimeNode && activeNodes.has(runtimeNode)) {
          const attachment = node.extensions?.['KHR_audio_emitter'];
          // Older draft examples use an array on nodes and lowercase autoplay.
          const indices: number[] =
            attachment?.emitters ?? (attachment?.emitter === undefined ? [] : [attachment.emitter]);
          for (const emitterIndex of indices) this.addEmitter(emitterIndex, runtimeNode);
        }
      });
      const indices: number[] =
        scenegraphs.gltf.scenes[sceneIndex]?.extensions?.['KHR_audio_emitter']?.emitters || [];
      for (const emitterIndex of indices) this.addEmitter(emitterIndex);
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
  async play(options: {autoplayOnly?: boolean} = {}): Promise<void> {
    this.stop();
    const generation = this.playbackGeneration;
    await this.initialize();
    if (this.destroyed || generation !== this.playbackGeneration) return;
    const startTime = this.options.audioContext.currentTime;
    for (const emitter of this.emitters) {
      for (const sourceIndex of emitter.definition.sources || []) {
        const definition = this.extension.sources[sourceIndex];
        if (options.autoplayOnly && !(definition.autoPlay ?? definition.autoplay)) continue;
        const source = this.options.audioContext.createBufferSource();
        const gain = this.options.audioContext.createGain();
        source.buffer = this.buffers[definition.audio];
        source.loop = definition.loop ?? false;
        gain.gain.value = definition.gain ?? 1;
        source.connect(gain);
        gain.connect(emitter.panner || emitter.gain);
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
          this.playing.delete(source);
        };
        this.playing.set(source, gain);
        source.start(startTime);
      }
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
  }

  /** Call after animation updates, with the camera's inverse view matrix. Distances are in meters. */
  update(listenerMatrix: Matrix4): void {
    if (this.destroyed) return;
    const listenerPosition = listenerMatrix.getTranslation();
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
      emitter.gain.disconnect();
    }
    this.gain.disconnect();
    this.buffers = [];
  }

  private addEmitter(index: number, node?: GroupNode): void {
    const definition = this.extension.emitters[index];
    // Positional emitters require a node; custom emitter shapes are not supported.
    assert(
      definition && (definition.type === 'global' || (definition.type === 'positional' && node))
    );
    assert(
      !definition.positional?.shapeType ||
        ['cone', 'omnidirectional'].includes(definition.positional.shapeType)
    );
    for (const sourceIndex of definition.sources || []) {
      // Every source must reference an audio payload.
      assert(this.extension.audio[this.extension.sources[sourceIndex]?.audio]);
    }
    const gain = this.options.audioContext.createGain();
    gain.gain.value = definition.gain ?? 1;
    gain.connect(this.gain);
    const binding: EmitterBinding = {definition, node, gain};
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
      panner.connect(gain);
    }
  }

  private async loadBuffers(): Promise<void> {
    const {scenegraphs, audioContext, baseUrl} = this.options;
    const buffers = await Promise.all(
      this.extension.audio.map(async definition => {
        let bytes: ArrayBuffer;
        if (definition.bufferView !== undefined) {
          const view = scenegraphs.gltf.bufferViews[definition.bufferView];
          bytes = new Uint8Array(view.data).buffer;
        } else {
          const response = await (this.options.fetch || fetch)(new URL(definition.uri!, baseUrl), {
            signal: this.abortController.signal
          });
          if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`);
          bytes = await response.arrayBuffer();
        }
        return audioContext.decodeAudioData(bytes);
      })
    );
    if (!this.destroyed) this.buffers = buffers;
  }
}

function getDistanceGain(
  positional: GLTFAudioExtension['emitters'][number]['positional'] = {},
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
