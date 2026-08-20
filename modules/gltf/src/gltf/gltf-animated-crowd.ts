// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {assert, Buffer, type Device, type RenderPass, Texture} from '@luma.gl/core';
import type {Model} from '@luma.gl/engine';
import {
  type AnimationLoopMode,
  type AnimationMixer,
  GroupNode,
  ModelNode,
  updateSkinJointMatrices
} from '@luma.gl/engine';
import {Matrix4, type NumericArray} from '@math.gl/core';
import type {ParseGLTFOptions} from '../parsers/parse-gltf';
import type {GLTFCrowdModelConfiguration, GLTFCrowdModelResources} from './create-gltf-model';
import {createScenegraphsFromGLTF, type GLTFScenegraphs} from './create-scenegraph-from-gltf';
import {type GLTFAnimationSelectionOptions, GLTFAnimator} from './gltf-animator';
import {
  createGLTFCrowdGPUAnimationLayout,
  type GLTFCrowdGPUAnimationClip,
  type GLTFCrowdGPUAnimationLayout,
  type GLTFCrowdGPUAnimationOptions,
  getGLTFCrowdGPUAnimationFrames
} from './gltf-gpu-animation';
import {generateGLTFLODLevels, getGLTFNodeLODs} from './gltf-lod';
import {GLTFSkinController} from './gltf-skin';

/** Authored or generated screen-space detail selection for independently animated crowd actors. */
export type GLTFCrowdLODOptions = {
  /** Select detail independently per actor. Defaults to false until explicitly enabled. */
  enabled?: boolean;
  /** Descending projected-height fractions for each detail level and the final culling boundary. */
  screenCoverage?: readonly number[];
  /** Relative transition dead band that prevents nearby actors flickering between levels. */
  hysteresis?: number;
  /** Generate detached lower-detail index buffers when the source has no authored levels. */
  autoGenerate?: boolean;
  /** Desired generated index-count ratios, ordered from higher to lower detail. */
  ratios?: readonly number[];
  /** Keeps open mesh boundaries fixed when generating levels. Defaults to false for glTF assets. */
  preserveBoundary?: boolean;
  /** Maximum submitted indexed vertices; zero or undefined leaves detail selection unlimited. */
  vertexBudget?: number;
};

/** Camera and viewport state used to classify crowd actors without a backend-specific pass. */
export type GLTFCrowdLODView = {
  viewMatrix: Readonly<NumericArray>;
  projectionMatrix: Readonly<NumericArray>;
  viewportWidth?: number;
  viewportHeight?: number;
};

/** Visible actors and submitted triangles at one independently selected detail level. */
export type GLTFCrowdLODLevelStats = {
  level: number;
  actors: number;
  triangles: number;
};

/** Current actor visibility, detail buckets, and actual instanced primitive work. */
export type GLTFCrowdLODStats = {
  source: 'authored' | 'generated' | 'none';
  visibleActors: number;
  culledActors: number;
  drawCount: number;
  triangles: number;
  /** Actual submitted indexed vertices across every visible actor and primitive. */
  vertices: number;
  /** Active indexed-vertex limit; omitted when vertex budgeting is unlimited. */
  vertexBudget?: number;
  /** Visible actors temporarily moved below their ideal screen-space detail level. */
  demotedActors: number;
  /** Whether the submitted indexed work fits the active limit without hiding actors. */
  budgetSatisfied: boolean;
  levels: GLTFCrowdLODLevelStats[];
};

/** Fixed shared-model and GPU-buffer configuration for an independently animated glTF crowd. */
export type GLTFAnimatedCrowdOptions = ParseGLTFOptions & {
  /** Maximum simultaneous actors; fixes GPU buffer and palette-atlas allocations. Defaults to 16. */
  capacity?: number;
  /** Optional portable per-actor authored or generated screen-space level-of-detail selection. */
  lod?: GLTFCrowdLODOptions;
  /** Optional one-time baked clip preparation followed by GPU skeletal and morph sampling. */
  gpuAnimation?: GLTFCrowdGPUAnimationOptions;
};

/** Runtime ownership and workload diagnostics for accelerated crowd animation. */
export type GLTFCrowdAnimationStats = {
  mode: 'cpu' | 'gpu';
  sampleRate?: number;
  frameCount: number;
  clipCount: number;
  morphGroupCount: number;
};

/** Initial placement and independent playback controls for one lightweight crowd actor. */
export type GLTFCrowdActorOptions = {
  id?: string;
  clip?: string;
  /** Initial clip-local time in seconds; takes precedence over normalized phase. */
  time?: number;
  /** Initial normalized clip phase. */
  phase?: number;
  speed?: number;
  loop?: AnimationLoopMode;
  repetitions?: number;
  playing?: boolean;
  /** Actor placement matrix, multiplied by independently animated authored node transforms. */
  transform?: Readonly<NumericArray>;
};

/** Crossfade and initial playback position for a lightweight crowd actor. */
export type GLTFCrowdClipSelectionOptions = GLTFAnimationSelectionOptions & {
  time?: number;
  phase?: number;
};

/** One canonical glTF primitive submitted exactly once for every compatible actor pose. */
export type GLTFCrowdPrimitiveGroup = {
  /** Source node whose animated world transform places this primitive. */
  nodeIndex: number;
  /** Source node that owns this level's immutable primitive geometry and material. */
  sourceNodeIndex: number;
  /** Zero for the original primitive, increasing for authored or generated lower detail. */
  lodLevel: number;
  /** Number of triangles submitted for one actor at this detail level. */
  triangleCount: number;
  /** Indexed vertex references submitted for one actor at this detail level. */
  vertexCount: number;
  /** One shared immutable-geometry/material model used for every actor. */
  model: Model;
  /** Four shared per-instance matrix-column vertex buffers. */
  transformBuffers: readonly Buffer[];
  /** Number of joints in the authored skin driving this primitive. */
  jointCount: number;
  /** Actor-major CPU staging palette uploaded to the shared GPU skin resource. */
  jointMatrices?: Float32Array;
  /** WebGPU read-only storage buffer or WebGL float-texture palette atlas. */
  skinJointMatrices?: Buffer | Texture;
  /** Number of source morph targets independently blended for every actor. */
  morphTargetCount: number;
  /** Immutable WebGPU storage buffer or WebGL float-texture morph target atlas. */
  morphTargetData?: Buffer | Texture;
  /** Per-instance packed morph weights for the existing CPU action-sampling mode. */
  morphWeights?: Float32Array;
  /** Immutable baked clip frames when GPU action sampling is enabled. */
  animationFrames?: Buffer | Texture;
  /** Dense per-instance current frame addresses and interpolation factors. */
  animationParameters?: Float32Array;
};

type GLTFCrowdActorNodes = {
  root: GroupNode;
  scenes: GroupNode[];
  nodesByIndex: Map<number, GroupNode>;
  nodesById: Map<string, GroupNode>;
};

/** Lightweight independent animation state targeting shared, GPU-instanced glTF primitives. */
export class GLTFCrowdActor {
  readonly id: string;
  /** Actor-local CPU node hierarchy; contains no render Models or mutable vertex buffers. */
  readonly root: GroupNode;
  /** Existing reusable glTF animator backed by one actor-local engine animation mixer. */
  readonly animator: GLTFAnimator;
  /** Existing glTF skin controller producing actor-local mesh-space joint palettes. */
  readonly skins: GLTFSkinController;

  private readonly crowd: GLTFAnimatedCrowd;
  private readonly nodesByIndex: Map<number, GroupNode>;
  private readonly nodesById: Map<string, GroupNode>;
  private isPlaying: boolean;
  private isDestroyed = false;
  private skinMatricesNeedUpdate = true;

  /** @internal Actors are created and owned by {@link GLTFAnimatedCrowd}. */
  constructor(crowd: GLTFAnimatedCrowd, id: string, options: GLTFCrowdActorOptions = {}) {
    this.crowd = crowd;
    this.id = id;
    const hierarchy = createActorNodes(crowd.scenegraphs, id);
    this.root = hierarchy.root;
    this.nodesByIndex = hierarchy.nodesByIndex;
    this.nodesById = hierarchy.nodesById;
    this.isPlaying = options.playing ?? true;

    this.skins = new GLTFSkinController({
      gltf: crowd.gltf,
      scenes: hierarchy.scenes,
      gltfNodeIndexToNodeMap: this.nodesByIndex
    });
    this.animator = new GLTFAnimator({
      animations: crowd.scenegraphs.animations.map(animation => ({
        name: animation.name,
        channels: animation.channels.filter(channel => channel.type === 'node')
      })),
      gltfNodeIdToNodeMap: this.nodesById,
      autoplay: 'first',
      onUpdate: () => {
        this.skinMatricesNeedUpdate = true;
      }
    });

    if (options.transform) {
      this.root.setMatrix(options.transform);
    }

    const clip = options.clip || this.animator.activeClip;
    if (clip) {
      this.animator.selectClip(clip);
      const action = this.mixer.getAction(clip);
      if (options.loop) {
        action?.setLoop(options.loop, options.repetitions);
      }
      if (options.time !== undefined || options.phase !== undefined) {
        this.seek(options.time ?? (options.phase || 0) * (action?.clip.duration || 0));
      } else if (!crowd.gpuAnimationEnabled) {
        this.animator.update(0);
      }
    }

    this.setSpeed(options.speed ?? 1);
    if (!this.isPlaying) {
      this.pause();
    }
  }

  get mixer(): AnimationMixer {
    return this.animator.mixer;
  }

  get activeClip(): string | undefined {
    return this.animator.activeClip;
  }

  /** Selected clip-local time in seconds. */
  get time(): number {
    return this.activeClip ? this.mixer.getAction(this.activeClip)?.time || 0 : 0;
  }

  get speed(): number {
    return this.mixer.timeScale;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Returns this actor's private authored node by glTF source index or identifier. */
  getNode(node: number | string): GroupNode | undefined {
    return typeof node === 'number' ? this.nodesByIndex.get(node) : this.nodesById.get(node);
  }

  /** Replaces actor placement without mutating another actor or shared source nodes. */
  setTransform(transform: Readonly<NumericArray>): this {
    this.root.setMatrix(transform);
    this.crowd.refresh();
    return this;
  }

  /** Selects or crossfades an authored clip independently from every neighboring actor. */
  selectClip(name: string, options: GLTFCrowdClipSelectionOptions = {}): this {
    const clip = this.animator.selectClip(name, options);
    if (options.time !== undefined || options.phase !== undefined) {
      this.seek(options.time ?? (options.phase || 0) * clip.clip.duration);
    }
    if (!this.isPlaying) {
      this.pause();
    }
    this.crowd.refresh();
    return this;
  }

  /** Seeks all active actor-local actions to seconds and updates its joint palettes once. */
  seek(timeSeconds: number): this {
    for (const clip of this.animator.getAnimations()) {
      if (clip.action.playing) {
        clip.action.setTime(timeSeconds);
      }
    }
    if (!this.crowd.gpuAnimationEnabled) {
      this.animator.update(0);
    }
    this.crowd.refresh();
    return this;
  }

  setPhase(phase: number): this {
    const duration = this.activeClip
      ? this.mixer.getAction(this.activeClip)?.clip.duration || 0
      : 0;
    return this.seek(duration * phase);
  }

  setSpeed(speed: number): this {
    this.mixer.timeScale = speed;
    return this;
  }

  setLoop(loop: AnimationLoopMode, repetitions?: number): this {
    if (this.activeClip) {
      this.mixer.getAction(this.activeClip)?.setLoop(loop, repetitions);
    }
    return this;
  }

  play(): this {
    this.isPlaying = true;
    for (const clip of this.animator.getAnimations()) {
      if (clip.action.playing) {
        clip.action.resume();
      }
    }
    return this;
  }

  pause(): this {
    this.isPlaying = false;
    for (const clip of this.animator.getAnimations()) {
      if (clip.action.playing) {
        clip.action.pause();
      }
    }
    return this;
  }

  /** Advances only this actor and immediately refreshes the existing shared instance buffers. */
  update(deltaSeconds: number): this {
    this.advance(deltaSeconds);
    this.crowd.refresh();
    return this;
  }

  /** @internal Allows the crowd to upload all actors together after one shared frame update. */
  advance(deltaSeconds: number): void {
    if (this.isPlaying && !this.isDestroyed) {
      if (this.crowd.gpuAnimationEnabled) {
        this.mixer.advance(deltaSeconds);
      } else {
        this.animator.update(deltaSeconds);
      }
    }
  }

  /** @internal Reuses the crowd's one scene traversal for both placement and joint palettes. */
  updateSkinMatrices(worldMatrices: ReadonlyMap<GroupNode, Matrix4>): void {
    if (!this.skinMatricesNeedUpdate) {
      return;
    }

    for (const binding of this.skins.bindings) {
      updateSkinJointMatrices({
        joints: binding.joints,
        meshNode: binding.node,
        worldMatrices,
        inverseBindMatrices: binding.inverseBindMatrices,
        target: binding.jointMatrices
      });
    }
    this.skinMatricesNeedUpdate = false;
  }

  /** Releases lightweight actor-local state without touching shared GPU models or source data. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.isPlaying = false;
    this.crowd.removeActor(this.id);
    this.root.destroy();
  }
}

/**
 * Draws independently animated glTF actors through one shared instanced Model per primitive.
 *
 * The source is parsed once. Every actor owns only CPU clocks, control state, and optional CPU
 * pose staging; immutable geometry, materials, pipelines, instance buffers, baked frames, and
 * draw calls are shared across the entire crowd.
 */
export class GLTFAnimatedCrowd {
  readonly device: Device;
  readonly gltf: GLTFPostprocessed;
  readonly scenegraphs: GLTFScenegraphs;
  readonly capacity: number;
  readonly primitiveGroups: readonly GLTFCrowdPrimitiveGroup[];
  readonly models: readonly Model[];
  /** Whether clip interpolation, rigid transforms, skin palettes, and morph weights are GPU-read. */
  readonly gpuAnimationEnabled: boolean;

  private readonly actorsById = new Map<string, GLTFCrowdActor>();
  private readonly actorLODLevels = new Map<string, number>();
  private readonly actorLODCoverage = new Map<string, number>();
  private readonly maximumGroupLevels = new Map<number, number>();
  private readonly lodOptions?: GLTFCrowdLODOptions;
  private readonly lodSource: GLTFCrowdLODStats['source'];
  private readonly lodScreenCoverage: readonly number[];
  private readonly maximumLODLevel: number;
  private readonly lodVertexCounts: readonly number[];
  private readonly gpuAnimationLayout: GLTFCrowdGPUAnimationLayout | null;
  private readonly gpuAnimationClips: ReadonlyMap<string, GLTFCrowdGPUAnimationClip>;
  private currentLODView: GLTFCrowdLODView | null = null;
  private currentVertexBudget?: number;
  private isLODEnabled: boolean;
  private lodBias = 1;
  private currentLODStats: GLTFCrowdLODStats;
  private nextActorIndex = 0;
  private isDestroyed = false;
  private suspendedRefreshCount = 0;

  constructor(device: Device, gltf: GLTFPostprocessed, options: GLTFAnimatedCrowdOptions = {}) {
    const {capacity = 16, lod, gpuAnimation, ...parseOptions} = options;
    // Fixed capacity keeps GPU instance and joint-palette buffers stable for the crowd lifetime.
    assert(Number.isSafeInteger(capacity) && capacity > 0);
    this.device = device;
    this.capacity = capacity;
    this.lodOptions = lod;
    this.isLODEnabled = lod?.enabled ?? false;
    // A zero budget disables the optional limit instead of unexpectedly hiding every actor.
    assert(
      lod?.vertexBudget === undefined ||
        (Number.isSafeInteger(lod.vertexBudget) && lod.vertexBudget >= 0)
    );
    this.currentVertexBudget = lod?.vertexBudget || undefined;

    const authoredLOD = Boolean(
      lod &&
        gltf.nodes.some(node => {
          const levels = getGLTFNodeLODs(gltf, node);
          return Boolean(levels && levels.length > 1);
        })
    );
    this.gltf =
      lod?.autoGenerate && !authoredLOD
        ? generateGLTFLODLevels(gltf, {
            ratios: lod.ratios,
            screenCoverage: lod.screenCoverage,
            preserveBoundary: lod.preserveBoundary
          })
        : gltf;
    this.lodSource = authoredLOD ? 'authored' : this.gltf !== gltf ? 'generated' : 'none';
    const requestedGPUAnimationLayout = gpuAnimation
      ? createGLTFCrowdGPUAnimationLayout(this.gltf, gpuAnimation)
      : null;
    const jointsPerInstance = Math.max(
      0,
      ...(this.gltf.skins || []).map(skin => skin.joints.length)
    );
    const maximumMorphTargetCount = Math.max(
      0,
      ...this.gltf.nodes.flatMap(node =>
        (node.mesh?.primitives || []).map(primitive => primitive.targets?.length || 0)
      )
    );
    const maximumAnimationFrameStride = 4 + jointsPerInstance * 4 + maximumMorphTargetCount;
    this.gpuAnimationLayout =
      requestedGPUAnimationLayout &&
      (device.type === 'webgpu' ||
        (maximumAnimationFrameStride <= device.limits.maxTextureDimension2D &&
          requestedGPUAnimationLayout.frameCount <= device.limits.maxTextureDimension2D))
        ? requestedGPUAnimationLayout
        : null;
    this.gpuAnimationEnabled = Boolean(this.gpuAnimationLayout);
    this.gpuAnimationClips = new Map(
      (this.gpuAnimationLayout?.clips || []).map(clip => [clip.name, clip])
    );
    const configuration: GLTFCrowdModelConfiguration = {
      capacity,
      jointsPerInstance,
      ...(this.gpuAnimationLayout ? {gpuAnimation: this.gpuAnimationLayout} : {})
    };
    this.scenegraphs = createScenegraphsFromGLTF(device, this.gltf, {
      ...parseOptions,
      modelOptions: {
        ...parseOptions.modelOptions,
        userData: {...parseOptions.modelOptions?.userData, gltfAnimatedCrowd: configuration}
      }
    });
    this.primitiveGroups = createPrimitiveGroups(this.scenegraphs, Boolean(lod));
    this.models = this.primitiveGroups.map(group => group.model);
    this.maximumLODLevel = Math.max(0, ...this.primitiveGroups.map(group => group.lodLevel));
    for (const group of this.primitiveGroups) {
      this.maximumGroupLevels.set(
        group.nodeIndex,
        Math.max(this.maximumGroupLevels.get(group.nodeIndex) || 0, group.lodLevel)
      );
    }
    const lodVertexCounts = Array.from({length: this.maximumLODLevel + 1}, () => 0);
    for (const group of this.primitiveGroups) {
      const maximumGroupLevel = this.getMaximumGroupLevel(group.nodeIndex);
      for (let level = 0; level < lodVertexCounts.length; level++) {
        if (Math.min(level, maximumGroupLevel) === group.lodLevel) {
          lodVertexCounts[level] += group.vertexCount;
        }
      }
    }
    this.lodVertexCounts = lodVertexCounts;
    const authoredScreenCoverage = lod ? this.getAuthoredScreenCoverage() : [0];
    this.lodScreenCoverage = lod?.screenCoverage || authoredScreenCoverage;
    this.currentLODStats = {
      source: this.lodSource,
      visibleActors: 0,
      culledActors: 0,
      drawCount: 0,
      triangles: 0,
      vertices: 0,
      ...(this.currentVertexBudget ? {vertexBudget: this.currentVertexBudget} : {}),
      demotedActors: 0,
      budgetSatisfied: true,
      levels: []
    };

    if (this.gpuAnimationLayout) {
      this.bakeGPUAnimationFrames();
    }
  }

  get actors(): readonly GLTFCrowdActor[] {
    return [...this.actorsById.values()];
  }

  get actorCount(): number {
    return this.actorsById.size;
  }

  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Whether existing authored or generated crowd levels are currently selected per actor. */
  get lodEnabled(): boolean {
    return this.isLODEnabled;
  }

  /** Current visible actor buckets and actual per-level instanced draw work. */
  get lodStats(): GLTFCrowdLODStats {
    return this.currentLODStats;
  }

  /** Current baked animation ownership, clip size, and independently deformed source groups. */
  get animationStats(): GLTFCrowdAnimationStats {
    return {
      mode: this.gpuAnimationEnabled ? 'gpu' : 'cpu',
      ...(this.gpuAnimationLayout ? {sampleRate: this.gpuAnimationLayout.sampleRate} : {}),
      frameCount: this.gpuAnimationLayout?.frameCount || 0,
      clipCount: this.gpuAnimationLayout?.clips.length || 0,
      morphGroupCount: this.primitiveGroups.filter(group => group.morphTargetCount > 0).length
    };
  }

  /** Enables or disables per-actor LOD without recreating actors, models, or GPU resources. */
  setLODEnabled(enabled: boolean): this {
    this.isLODEnabled = enabled;
    this.actorLODLevels.clear();
    this.actorLODCoverage.clear();
    this.refresh();
    return this;
  }

  /** Applies a relative projected-size bias; larger values retain higher-detail actors longer. */
  setLODBias(bias: number): this {
    // A finite positive bias keeps projected-size ordering stable across both graphics backends.
    assert(Number.isFinite(bias) && bias > 0);
    this.lodBias = bias;
    this.refresh();
    return this;
  }

  /** Sets a global indexed-vertex budget; zero or undefined restores ideal screen-space detail. */
  setLODVertexBudget(vertexBudget?: number): this {
    // Negative and fractional budgets cannot represent a submitted indexed vertex count.
    assert(vertexBudget === undefined || (Number.isSafeInteger(vertexBudget) && vertexBudget >= 0));
    this.currentVertexBudget = vertexBudget || undefined;
    this.refresh();
    return this;
  }

  /** Updates screen-space actor selection from camera matrices without allocating GPU resources. */
  setLODView(view: GLTFCrowdLODView | null): this {
    this.currentLODView = view;
    if (this.isLODEnabled) {
      this.refresh();
    }
    return this;
  }

  /** Adds independent CPU clip/node state without parsing the source or allocating GPU models. */
  addActor(options: GLTFCrowdActorOptions = {}): GLTFCrowdActor {
    // Fixed-capacity crowd buffers cannot represent additional actors after destruction or overflow.
    assert(!this.isDestroyed && this.actorsById.size < this.capacity);
    const id = options.id || `gltf-crowd-actor-${this.nextActorIndex++}`;
    // Actor identifiers are stable keys for removal and application scene integrations.
    assert(!this.actorsById.has(id));

    let actor: GLTFCrowdActor;
    this.suspendedRefreshCount++;
    try {
      actor = new GLTFCrowdActor(this, id, options);
      this.actorsById.set(id, actor);
    } finally {
      this.suspendedRefreshCount--;
    }
    this.refresh();
    return actor;
  }

  /** Adds many independently initialized actors while uploading shared GPU buffers only once. */
  addActors(options: readonly GLTFCrowdActorOptions[]): GLTFCrowdActor[] {
    // Validate fixed capacity before allocating any actor-local animation or hierarchy state.
    assert(!this.isDestroyed && this.actorsById.size + options.length <= this.capacity);
    const actors: GLTFCrowdActor[] = [];
    this.suspendedRefreshCount++;
    try {
      for (const actorOptions of options) {
        actors.push(this.addActor(actorOptions));
      }
    } finally {
      this.suspendedRefreshCount--;
      this.refresh();
    }
    return actors;
  }

  getActor(id: string): GLTFCrowdActor | undefined {
    return this.actorsById.get(id);
  }

  /** Compacts actor slots and updates every shared primitive without recreating its pipeline. */
  removeActor(id: string): boolean {
    const actor = this.actorsById.get(id);
    if (!actor) {
      return false;
    }
    this.actorsById.delete(id);
    this.actorLODLevels.delete(id);
    this.actorLODCoverage.delete(id);
    if (!actor.destroyed) {
      actor.destroy();
    }
    this.refresh();
    return true;
  }

  /** Removes and compacts many actors while uploading surviving instance slots only once. */
  removeActors(ids: readonly string[]): number {
    let removedActorCount = 0;
    this.suspendedRefreshCount++;
    try {
      for (const id of ids) {
        if (this.removeActor(id)) {
          removedActorCount++;
        }
      }
    } finally {
      this.suspendedRefreshCount--;
      this.refresh();
    }
    return removedActorCount;
  }

  /** Evaluates clips and optional camera detail selection with exactly one shared GPU upload. */
  update(deltaSeconds: number, view?: GLTFCrowdLODView): this {
    if (view) {
      this.currentLODView = view;
    }
    for (const actor of this.actorsById.values()) {
      actor.advance(deltaSeconds);
    }
    this.refresh();
    return this;
  }

  /** Issues exactly one instanced draw for each compatible source primitive. */
  draw(renderPass: RenderPass): number {
    if (this.isDestroyed || this.actorCount === 0) {
      return 0;
    }
    let drawCount = 0;
    for (const group of this.primitiveGroups) {
      if (group.model.instanceCount > 0 && group.model.draw(renderPass)) {
        drawCount++;
      }
    }
    return drawCount;
  }

  /** @internal Reuses fixed GPU buffers while packing current actor node and joint transforms. */
  refresh(): void {
    if (this.isDestroyed || this.suspendedRefreshCount > 0 || !this.primitiveGroups) {
      return;
    }

    const actors = [...this.actorsById.values()];
    const actorWorldMatrices = this.gpuAnimationEnabled
      ? []
      : actors.map(actor => {
          const worldMatrices = collectNodeWorldMatrices(actor.root);
          actor.updateSkinMatrices(worldMatrices);
          return worldMatrices;
        });
    const idealLevels = actors.map(actor => this.selectActorLOD(actor));
    const {levels: selectedLevels, demotedActors} = this.applyVertexBudget(actors, idealLevels);
    const visibleActors = selectedLevels.filter(level => level !== null).length;
    const levelStats = new Map<number, GLTFCrowdLODLevelStats>();
    for (const level of selectedLevels) {
      if (level === null) {
        continue;
      }
      const statistics = levelStats.get(level) || {level, actors: 0, triangles: 0};
      statistics.actors++;
      levelStats.set(level, statistics);
    }
    let drawCount = 0;
    let triangles = 0;
    let vertices = 0;

    for (const group of this.primitiveGroups) {
      const modelNode = findCrowdModelNode(this.scenegraphs, group.sourceNodeIndex, group.model);
      if (!modelNode) {
        continue;
      }
      const resources = modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;
      const maximumGroupLevel = this.getMaximumGroupLevel(group.nodeIndex);
      let instanceCount = 0;

      for (let actorIndex = 0; actorIndex < actors.length; actorIndex++) {
        const selectedLevel = selectedLevels[actorIndex];
        if (
          selectedLevel === null ||
          Math.min(selectedLevel, maximumGroupLevel) !== group.lodLevel
        ) {
          continue;
        }
        const actor = actors[actorIndex];
        const actorNode = actor.getNode(group.nodeIndex);
        const matrix = this.gpuAnimationEnabled
          ? actor.root.matrix
          : actorNode && actorWorldMatrices[actorIndex].get(actorNode);
        for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
          for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
            resources.transformColumns[columnIndex][instanceCount * 4 + rowIndex] =
              matrix?.[columnIndex * 4 + rowIndex] || 0;
          }
        }

        if (resources.animationParameters && resources.animationBlend) {
          this.writeGPUAnimationParameters(actor, resources, instanceCount);
        }

        if (resources.morphWeights) {
          const targetCount = resources.morphTargetCount;
          const packedTargetCount = Math.ceil(targetCount / 4);
          const offset = instanceCount * packedTargetCount * 4;
          resources.morphWeights.fill(0, offset, offset + packedTargetCount * 4);
          const weights = actorNode?.userData['morphWeights'];
          if (Array.isArray(weights)) {
            resources.morphWeights.set(weights.slice(0, targetCount), offset);
          }
        }

        if (resources.jointMatrices) {
          const jointPalette = actor.skins.getBinding(group.nodeIndex)?.jointMatrices;
          const offset = instanceCount * resources.jointsPerInstance * 16;
          resources.jointMatrices.fill(0, offset, offset + resources.jointsPerInstance * 16);
          if (jointPalette) {
            resources.jointMatrices.set(jointPalette, offset);
          }
        }
        instanceCount++;
      }

      if (instanceCount > 0) {
        for (let columnIndex = 0; columnIndex < resources.transformBuffers.length; columnIndex++) {
          resources.transformBuffers[columnIndex].write(
            resources.transformColumns[columnIndex].subarray(0, instanceCount * 4)
          );
        }
        if (resources.animationParameterBuffer && resources.animationParameters) {
          resources.animationParameterBuffer.write(
            resources.animationParameters.subarray(0, instanceCount * 4)
          );
        }
        if (resources.animationBlendBuffer && resources.animationBlend) {
          resources.animationBlendBuffer.write(
            resources.animationBlend.subarray(0, instanceCount * 4)
          );
        }
        if (resources.morphWeights && resources.morphWeightData) {
          const packedTargetCount = Math.ceil(resources.morphTargetCount / 4);
          const weights = resources.morphWeights.subarray(0, instanceCount * packedTargetCount * 4);
          if (resources.morphWeightData instanceof Buffer) {
            resources.morphWeightData.write(weights);
          } else {
            resources.morphWeightData.writeData(weights, {
              width: packedTargetCount,
              height: instanceCount
            });
          }
        }
        if (resources.jointMatrices && resources.skinJointMatrices) {
          const jointMatrices = resources.jointMatrices.subarray(
            0,
            instanceCount * resources.jointsPerInstance * 16
          );
          if (resources.skinJointMatrices instanceof Buffer) {
            resources.skinJointMatrices.write(jointMatrices);
          } else {
            resources.skinJointMatrices.writeData(jointMatrices, {
              width: resources.jointsPerInstance * 4,
              height: instanceCount
            });
          }
        }
        const groupTriangles = instanceCount * group.triangleCount;
        const statistics = levelStats.get(group.lodLevel) || {
          level: group.lodLevel,
          actors: 0,
          triangles: 0
        };
        statistics.triangles += groupTriangles;
        levelStats.set(group.lodLevel, statistics);
        triangles += groupTriangles;
        vertices += instanceCount * group.vertexCount;
        drawCount++;
      }
      group.model.setInstanceCount(instanceCount);
    }

    this.currentLODStats = {
      source: this.lodSource,
      visibleActors,
      culledActors: actors.length - visibleActors,
      drawCount,
      triangles,
      vertices,
      ...(this.currentVertexBudget ? {vertexBudget: this.currentVertexBudget} : {}),
      demotedActors,
      budgetSatisfied:
        !this.isLODEnabled || !this.currentVertexBudget || vertices <= this.currentVertexBudget,
      levels: [...levelStats.values()].sort((first, second) => first.level - second.level)
    };
  }

  private bakeGPUAnimationFrames(): void {
    const layout = this.gpuAnimationLayout;
    if (!layout) {
      return;
    }

    this.suspendedRefreshCount++;
    const bakingActor = new GLTFCrowdActor(this, '__gltf-gpu-animation-baker__', {playing: false});
    try {
      for (const clip of layout.clips) {
        const animation = bakingActor.animator.selectClip(clip.name);
        animation.action.setLoop('once', 1);
        for (let clipFrame = 0; clipFrame < clip.frameCount; clipFrame++) {
          const time = Math.min(clipFrame / layout.sampleRate, clip.duration);
          animation.action.setTime(time);
          bakingActor.animator.update(0);
          const worldMatrices = collectNodeWorldMatrices(bakingActor.root);
          bakingActor.updateSkinMatrices(worldMatrices);

          for (const group of this.primitiveGroups) {
            const modelNode = findCrowdModelNode(
              this.scenegraphs,
              group.sourceNodeIndex,
              group.model
            );
            if (!modelNode) {
              continue;
            }
            const resources = modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;
            const values = resources.animationFrameValues;
            const frameStride = resources.animationFrameStride;
            if (!values || !frameStride) {
              continue;
            }

            const frameOffset = (clip.frameOffset + clipFrame) * frameStride * 4;
            const node = bakingActor.getNode(group.nodeIndex);
            const nodeMatrix = node && worldMatrices.get(node);
            if (nodeMatrix) {
              values.set(nodeMatrix, frameOffset);
            }

            const jointPalette = bakingActor.skins.getBinding(group.nodeIndex)?.jointMatrices;
            if (jointPalette) {
              values.set(jointPalette, frameOffset + 16);
            }

            const weights = node?.userData['morphWeights'];
            if (Array.isArray(weights)) {
              for (let targetIndex = 0; targetIndex < resources.morphTargetCount; targetIndex++) {
                const offset =
                  frameOffset + (4 + resources.animationJointCount * 4 + targetIndex) * 4;
                values[offset] = Number(weights[targetIndex] || 0);
              }
            }
          }
        }
      }
    } finally {
      bakingActor.destroy();
      this.suspendedRefreshCount--;
    }

    for (const group of this.primitiveGroups) {
      const modelNode = findCrowdModelNode(this.scenegraphs, group.sourceNodeIndex, group.model);
      if (!modelNode) {
        continue;
      }
      const resources = modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;
      if (!resources.animationFrames || !resources.animationFrameValues) {
        continue;
      }
      if (resources.animationFrames instanceof Buffer) {
        resources.animationFrames.write(resources.animationFrameValues);
      } else {
        resources.animationFrames.writeData(resources.animationFrameValues, {
          width: resources.animationFrameStride,
          height: layout.frameCount
        });
      }
    }
  }

  private writeGPUAnimationParameters(
    actor: GLTFCrowdActor,
    resources: GLTFCrowdModelResources,
    instanceIndex: number
  ): void {
    const layout = this.gpuAnimationLayout;
    if (!layout || !resources.animationParameters || !resources.animationBlend) {
      return;
    }

    const animations = actor.animator
      .getAnimations()
      .filter(animation => animation.action.shouldApply && animation.action.weight > 0);
    const primary =
      animations.find(animation => animation.name === actor.activeClip) || animations[0];
    const primaryClip = (primary && this.gpuAnimationClips.get(primary.name)) || layout.clips[0];
    const primaryFrames = getGLTFCrowdGPUAnimationFrames(
      primaryClip,
      primary?.action.time || 0,
      layout.sampleRate
    );
    const offset = instanceIndex * 4;
    resources.animationParameters.set([...primaryFrames, primary?.action.weight || 1], offset);

    const secondary = animations.find(animation => animation !== primary);
    const secondaryClip = secondary && this.gpuAnimationClips.get(secondary.name);
    if (secondary && secondaryClip) {
      const frames = getGLTFCrowdGPUAnimationFrames(
        secondaryClip,
        secondary.action.time,
        layout.sampleRate
      );
      const totalWeight = (primary?.action.weight || 0) + secondary.action.weight;
      resources.animationBlend.set(
        [...frames, totalWeight > 0 ? secondary.action.weight / totalWeight : 0],
        offset
      );
    } else {
      resources.animationBlend.fill(0, offset, offset + 4);
    }
  }

  private getAuthoredScreenCoverage(): readonly number[] {
    for (let nodeIndex = 0; nodeIndex < this.gltf.nodes.length; nodeIndex++) {
      const levels = getGLTFNodeLODs(this.gltf, nodeIndex);
      if (levels && levels.length > 1) {
        return levels.map(level => level.screenCoverage);
      }
    }
    return [0];
  }

  private getMaximumGroupLevel(nodeIndex: number): number {
    return this.maximumGroupLevels.get(nodeIndex) || 0;
  }

  private applyVertexBudget(
    actors: readonly GLTFCrowdActor[],
    idealLevels: readonly (number | null)[]
  ): {levels: (number | null)[]; demotedActors: number} {
    const levels = [...idealLevels];
    if (!this.isLODEnabled || !this.currentVertexBudget || this.maximumLODLevel === 0) {
      return {levels, demotedActors: 0};
    }

    let vertices = levels.reduce<number>(
      (total, level) => total + (level === null ? 0 : this.lodVertexCounts[level]),
      0
    );
    if (vertices <= this.currentVertexBudget) {
      return {levels, demotedActors: 0};
    }

    const actorIndices = actors
      .map((actor, actorIndex) => ({actor, actorIndex}))
      .filter(({actorIndex}) => levels[actorIndex] !== null)
      .sort((first, second) => {
        const firstCoverage = this.actorLODCoverage.get(first.actor.id) ?? Number.POSITIVE_INFINITY;
        const secondCoverage =
          this.actorLODCoverage.get(second.actor.id) ?? Number.POSITIVE_INFINITY;
        return firstCoverage - secondCoverage || first.actorIndex - second.actorIndex;
      });

    let demotedActors = 0;
    for (const {actorIndex} of actorIndices) {
      if (vertices <= this.currentVertexBudget) {
        break;
      }
      let level = levels[actorIndex]!;
      let actorWasDemoted = false;
      while (vertices > this.currentVertexBudget && level < this.maximumLODLevel) {
        const nextLevel = level + 1;
        const savedVertices = this.lodVertexCounts[level] - this.lodVertexCounts[nextLevel];
        if (savedVertices < 0) {
          break;
        }
        levels[actorIndex] = nextLevel;
        vertices -= savedVertices;
        level = nextLevel;
        actorWasDemoted = true;
      }
      if (actorWasDemoted) {
        demotedActors++;
      }
    }

    return {levels, demotedActors};
  }

  private selectActorLOD(actor: GLTFCrowdActor): number | null {
    if (!this.isLODEnabled || !this.currentLODView || this.maximumLODLevel === 0) {
      this.actorLODLevels.set(actor.id, 0);
      this.actorLODCoverage.set(actor.id, Number.POSITIVE_INFINITY);
      return 0;
    }

    const {viewMatrix, projectionMatrix, viewportWidth, viewportHeight} = this.currentLODView;
    const {center, radius} = this.scenegraphs.modelBounds;
    const actorMatrix = actor.root.matrix;
    const worldX =
      actorMatrix[0] * center[0] +
      actorMatrix[4] * center[1] +
      actorMatrix[8] * center[2] +
      actorMatrix[12];
    const worldY =
      actorMatrix[1] * center[0] +
      actorMatrix[5] * center[1] +
      actorMatrix[9] * center[2] +
      actorMatrix[13];
    const worldZ =
      actorMatrix[2] * center[0] +
      actorMatrix[6] * center[1] +
      actorMatrix[10] * center[2] +
      actorMatrix[14];

    const cameraX =
      viewMatrix[0] * worldX + viewMatrix[4] * worldY + viewMatrix[8] * worldZ + viewMatrix[12];
    const cameraY =
      viewMatrix[1] * worldX + viewMatrix[5] * worldY + viewMatrix[9] * worldZ + viewMatrix[13];
    const cameraZ =
      viewMatrix[2] * worldX + viewMatrix[6] * worldY + viewMatrix[10] * worldZ + viewMatrix[14];
    const actorScale = Math.max(
      Math.hypot(actorMatrix[0], actorMatrix[1], actorMatrix[2]),
      Math.hypot(actorMatrix[4], actorMatrix[5], actorMatrix[6]),
      Math.hypot(actorMatrix[8], actorMatrix[9], actorMatrix[10])
    );
    const worldRadius = radius * actorScale;
    const clipX =
      projectionMatrix[0] * cameraX +
      projectionMatrix[4] * cameraY +
      projectionMatrix[8] * cameraZ +
      projectionMatrix[12];
    const clipY =
      projectionMatrix[1] * cameraX +
      projectionMatrix[5] * cameraY +
      projectionMatrix[9] * cameraZ +
      projectionMatrix[13];
    const clipW =
      projectionMatrix[3] * cameraX +
      projectionMatrix[7] * cameraY +
      projectionMatrix[11] * cameraZ +
      projectionMatrix[15];

    if (clipW <= 0) {
      this.actorLODLevels.delete(actor.id);
      this.actorLODCoverage.delete(actor.id);
      return null;
    }

    const normalizedRadiusX = (worldRadius * Math.abs(projectionMatrix[0])) / clipW;
    const normalizedRadiusY = (worldRadius * Math.abs(projectionMatrix[5])) / clipW;
    if (
      Math.abs(clipX / clipW) > 1 + normalizedRadiusX ||
      Math.abs(clipY / clipW) > 1 + normalizedRadiusY
    ) {
      this.actorLODLevels.delete(actor.id);
      this.actorLODCoverage.delete(actor.id);
      return null;
    }

    const viewportScale =
      viewportWidth && viewportHeight
        ? viewportHeight / Math.min(viewportWidth, viewportHeight)
        : 1;
    const coverage = normalizedRadiusY * viewportScale * this.lodBias;
    this.actorLODCoverage.set(actor.id, coverage);
    const candidateLevel = this.lodScreenCoverage.findIndex(threshold => coverage >= threshold);
    const nextLevel = candidateLevel === -1 ? null : Math.min(candidateLevel, this.maximumLODLevel);
    const previousLevel = this.actorLODLevels.get(actor.id);
    const hysteresis = Math.max(0, Math.min(this.lodOptions?.hysteresis ?? 0.1, 0.99));
    if (previousLevel !== undefined && nextLevel !== previousLevel) {
      const threshold =
        this.lodScreenCoverage[
          nextLevel === null || nextLevel > previousLevel ? previousLevel : nextLevel
        ];
      const movesToLowerDetail = nextLevel === null || nextLevel > previousLevel;
      const crossedBoundary = movesToLowerDetail
        ? coverage < threshold * (1 - hysteresis)
        : coverage >= threshold * (1 + hysteresis);
      if (!crossedBoundary) {
        return previousLevel;
      }
    }

    if (nextLevel === null) {
      this.actorLODLevels.delete(actor.id);
      this.actorLODCoverage.delete(actor.id);
    } else {
      this.actorLODLevels.set(actor.id, nextLevel);
    }
    return nextLevel;
  }

  /** Destroys actor CPU state and the one canonical source scenegraph exactly once. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    for (const actor of [...this.actorsById.values()]) {
      actor.destroy();
    }
    this.actorsById.clear();
    this.scenegraphs.destroy();
  }
}

/** Parses one source asset once and creates a shared-model GPU-instanced animation crowd. */
export function createGLTFAnimatedCrowd(
  device: Device,
  gltf: GLTFPostprocessed,
  options: GLTFAnimatedCrowdOptions = {}
): GLTFAnimatedCrowd {
  return new GLTFAnimatedCrowd(device, gltf, options);
}

function createActorNodes(scenegraphs: GLTFScenegraphs, id: string): GLTFCrowdActorNodes {
  const {gltf, gltfNodeIndexToNodeMap} = scenegraphs;
  const nodesByIndex = new Map<number, GroupNode>();
  const nodesById = new Map<string, GroupNode>();

  for (let nodeIndex = 0; nodeIndex < gltf.nodes.length; nodeIndex++) {
    const sourceNode = gltf.nodes[nodeIndex];
    const sourceRuntimeNode = gltfNodeIndexToNodeMap.get(nodeIndex);
    if (!sourceRuntimeNode) {
      continue;
    }
    const node = new GroupNode({
      id: sourceRuntimeNode.id,
      position: Array.from(sourceRuntimeNode.position),
      rotation: Array.from(sourceRuntimeNode.rotation),
      scale: Array.from(sourceRuntimeNode.scale),
      matrix: Array.from(sourceRuntimeNode.matrix),
      display: sourceRuntimeNode.display
    });
    const morphWeights = sourceRuntimeNode.userData['morphWeights'];
    if (Array.isArray(morphWeights)) {
      node.userData['morphWeights'] = [...morphWeights];
    }
    nodesByIndex.set(nodeIndex, node);
    nodesById.set(sourceNode.id, node);
  }

  for (let nodeIndex = 0; nodeIndex < gltf.nodes.length; nodeIndex++) {
    const sourceNode = gltf.nodes[nodeIndex];
    const node = nodesByIndex.get(nodeIndex);
    if (!node) {
      continue;
    }
    for (const child of sourceNode.children || []) {
      const childNode = nodesById.get(child.id);
      if (childNode) {
        node.add(childNode);
      }
    }
    if (sourceNode.mesh) {
      const mesh = new GroupNode({id: sourceNode.mesh.name || sourceNode.mesh.id});
      node.userData['gltfMesh'] = mesh;
      node.add(mesh);
    }
  }

  const scenes = gltf.scenes.map(
    (scene, sceneIndex) =>
      new GroupNode({
        id: `${id}-scene-${sceneIndex}`,
        children: (scene.nodes || []).flatMap(sourceNode => {
          const node = nodesById.get(sourceNode.id);
          return node ? [node] : [];
        })
      })
  );

  return {
    root: new GroupNode({id: `${id}-root`, children: [...scenes]}),
    scenes,
    nodesByIndex,
    nodesById
  };
}

function createPrimitiveGroups(
  scenegraphs: GLTFScenegraphs,
  includeLODLevels: boolean
): GLTFCrowdPrimitiveGroup[] {
  const groups: GLTFCrowdPrimitiveGroup[] = [];
  const reachableNodes = new Set<GroupNode>();
  for (const scene of scenegraphs.scenes) {
    scene.preorderTraversal(node => {
      if (node instanceof GroupNode) {
        reachableNodes.add(node);
      }
    });
  }

  for (const [nodeIndex, sourceNode] of scenegraphs.gltf.nodes.entries()) {
    if (!sourceNode.mesh) {
      continue;
    }
    const node = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex);
    if (!node || !reachableNodes.has(node)) {
      continue;
    }
    const skinBinding = scenegraphs.skins.getBinding(nodeIndex);
    const levels = includeLODLevels ? getGLTFNodeLODs(scenegraphs.gltf, nodeIndex) : null;
    const lodNodes = levels || [{level: 0, nodeIndex, node: sourceNode, screenCoverage: 0}];
    for (const level of lodNodes) {
      const lodNode = scenegraphs.gltfNodeIndexToNodeMap.get(level.nodeIndex);
      const mesh = lodNode?.userData['gltfMesh'];
      if (!(mesh instanceof GroupNode)) {
        continue;
      }
      for (const [primitiveIndex, child] of mesh.children.entries()) {
        if (!(child instanceof ModelNode)) {
          continue;
        }
        const resources = child.userData['gltfAnimatedCrowd'] as
          | GLTFCrowdModelResources
          | undefined;
        if (!resources) {
          continue;
        }
        const primitive = level.node.mesh?.primitives[primitiveIndex];
        const indexCount =
          primitive?.indices?.count || primitive?.indices?.value?.length || child.model.vertexCount;
        groups.push({
          nodeIndex,
          sourceNodeIndex: level.nodeIndex,
          lodLevel: level.level,
          triangleCount: Math.floor(indexCount / 3),
          vertexCount: indexCount,
          model: child.model,
          transformBuffers: resources.transformBuffers,
          jointCount: skinBinding?.joints.length || 0,
          morphTargetCount: resources.morphTargetCount,
          ...(resources.jointMatrices ? {jointMatrices: resources.jointMatrices} : {}),
          ...(resources.skinJointMatrices ? {skinJointMatrices: resources.skinJointMatrices} : {}),
          ...(resources.morphTargetData ? {morphTargetData: resources.morphTargetData} : {}),
          ...(resources.morphWeights ? {morphWeights: resources.morphWeights} : {}),
          ...(resources.animationFrames ? {animationFrames: resources.animationFrames} : {}),
          ...(resources.animationParameters
            ? {animationParameters: resources.animationParameters}
            : {})
        });
      }
    }
  }
  return groups;
}

function findCrowdModelNode(
  scenegraphs: GLTFScenegraphs,
  nodeIndex: number,
  model: Model
): ModelNode | undefined {
  const mesh = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex)?.userData['gltfMesh'];
  if (!(mesh instanceof GroupNode)) {
    return undefined;
  }
  return mesh.children.find(
    (node): node is ModelNode => node instanceof ModelNode && node.model === model
  );
}

function collectNodeWorldMatrices(root: GroupNode): Map<GroupNode, Matrix4> {
  const result = new Map<GroupNode, Matrix4>();
  root.preorderTraversal((node, {worldMatrix}) => {
    if (node instanceof GroupNode) {
      result.set(node, worldMatrix);
    }
  });
  return result;
}
