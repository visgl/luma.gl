// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type AudioControllerOptions,
  type AudioDefinition,
  type AudioNodeBinding,
  type AudioEnvironmentDefinition
} from '@luma.gl/engine';
import type {GLTFScenegraphs} from './create-scenegraph-from-gltf';

type GraphSourceProperties = {
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

/** Draft KHR_audio_emitter definitions. */
export type GLTFAudioExtension = {
  audio: {uri?: string; bufferView?: number; mimeType?: string}[];
  sources: {
    audio?: number;
    gain?: number;
    loop?: boolean;
    autoPlay?: boolean;
    autoplay?: boolean;
    playbackRate?: number;
    extensions?: {KHR_audio_graph?: GraphSourceProperties};
  }[];
  emitters: {
    name?: string;
    type: 'global' | 'positional';
    gain?: number;
    sources?: number[];
    extensions?: {
      KHR_audio_environment?: {directLevel?: number; reverbLevel?: number; environment?: number};
    };
    positional?: {
      shapeType?: 'omnidirectional' | 'cone';
      coneInnerAngle?: number;
      coneOuterAngle?: number;
      coneOuterGain?: number;
      distanceModel?: DistanceModelType;
      maxDistance?: number;
      refDistance?: number;
      rolloffFactor?: number;
      extensions?: {
        KHR_audio_environment?: {airAbsorption?: {enabled?: boolean; cutoffAtMaxDistance?: number}};
      };
    };
  }[];
};

export type ParseGLTFAudioProps = {
  scenegraphs: GLTFScenegraphs;
  /** Borrowed context; the application resumes and closes it. No context is created implicitly. */
  audioContext: BaseAudioContext;
  /** Absolute URL of the glTF document, used to resolve external audio. */
  baseUrl: string;
  sceneIndex?: number;
  /** Authored camera node used for environment listener selection. */
  activeCameraNodeIndex?: number;
  /** Use the application viewer pose while retaining authored listener audio properties. */
  listenerPose?: 'authored' | 'viewer';
  fetch?: typeof fetch;
};

/** Convert glTF extension records into the engine audio controller's resolved inputs. */
export function parseGLTFAudio(options: ParseGLTFAudioProps): AudioControllerOptions {
  const {scenegraphs, sceneIndex = 0, activeCameraNodeIndex, ...controllerOptions} = options;
  const {gltf, gltfNodeIndexToNodeMap} = scenegraphs;
  const extension = gltf.extensions?.['KHR_audio_emitter'] as GLTFAudioExtension | undefined;
  const definition: AudioDefinition = {
    audio: (extension?.audio || []).map(audio => ({
      uri: audio.uri,
      mimeType: audio.mimeType,
      ...(audio.bufferView !== undefined
        ? {data: new Uint8Array(gltf.bufferViews[audio.bufferView].data).buffer}
        : {})
    })),
    sources: (extension?.sources || []).map(({extensions, autoplay, ...source}) => ({
      ...source,
      autoPlay: source.autoPlay ?? autoplay,
      graph: extensions?.KHR_audio_graph
    })),
    emitters: (extension?.emitters || []).map(({extensions, positional, ...emitter}) => ({
      ...emitter,
      environment: extensions?.KHR_audio_environment,
      positional: positional
        ? {
            shapeType: positional.shapeType,
            coneInnerAngle: positional.coneInnerAngle,
            coneOuterAngle: positional.coneOuterAngle,
            coneOuterGain: positional.coneOuterGain,
            distanceModel: positional.distanceModel,
            maxDistance: positional.maxDistance,
            refDistance: positional.refDistance,
            rolloffFactor: positional.rolloffFactor,
            airAbsorption: positional.extensions?.KHR_audio_environment?.airAbsorption
          }
        : undefined
    }))
  };
  const nodes: AudioNodeBinding[] = [];
  gltf.nodes.forEach((source, index) => {
    const node = gltfNodeIndexToNodeMap.get(index);
    if (!node) return;
    const attachment = source.extensions?.['KHR_audio_emitter'];
    const environment = source.extensions?.['KHR_audio_environment'];
    nodes.push({
      node,
      emitterIndices:
        attachment?.emitters ?? (attachment?.emitter === undefined ? [] : [attachment.emitter]),
      listener: environment?.listener,
      zone: environment as AudioNodeBinding['zone']
    });
  });
  const scene = gltf.scenes[sceneIndex];
  return {
    ...controllerOptions,
    scene: scenegraphs.scenes[sceneIndex],
    definition,
    nodes,
    graphs: gltf.extensions?.['KHR_audio_graph']?.['graphs'],
    emitterIndices: scene?.extensions?.['KHR_audio_emitter']?.emitters,
    environment: gltf.extensions?.['KHR_audio_environment'] as
      | AudioEnvironmentDefinition
      | undefined,
    activeListener: scene?.extensions?.['KHR_audio_environment']?.activeListener,
    defaultEnvironment: scene?.extensions?.['KHR_audio_environment']?.environment,
    activeCameraNode:
      activeCameraNodeIndex === undefined
        ? undefined
        : gltfNodeIndexToNodeMap.get(activeCameraNodeIndex)
  };
}
