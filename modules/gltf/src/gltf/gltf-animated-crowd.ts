// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {assert, Buffer, type Device, type RenderPass, Texture} from '@luma.gl/core';
import {
  type AnimationLoopMode,
  type AnimationMixer,
  GroupNode,
  ModelNode,
  updateSkinJointMatrices
} from '@luma.gl/engine';
import type {Model} from '@luma.gl/engine';
import {Matrix4, type NumericArray} from '@math.gl/core';
import type {ParseGLTFOptions} from '../parsers/parse-gltf';
import {createScenegraphsFromGLTF, type GLTFScenegraphs} from './create-scenegraph-from-gltf';
import type {GLTFCrowdModelConfiguration, GLTFCrowdModelResources} from './create-gltf-model';
import {type GLTFAnimationSelectionOptions, GLTFAnimator} from './gltf-animator';
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
  levels: GLTFCrowdLODLevelStats[];
};

/** Fixed shared-model and GPU-buffer configuration for an independently animated glTF crowd. */
export type GLTFAnimatedCrowdOptions = ParseGLTFOptions & {
  /** Maximum simultaneous actors; fixes GPU buffer and palette-atlas allocations. Defaults to 16. */
  capacity?: number;
  /** Optional portable per-actor authored or generated screen-space level-of-detail selection. */
  lod?: GLTFCrowdLODOptions;
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
      } else {
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
    this.animator.update(0);
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
      this.animator.update(deltaSeconds);
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
 * The source is parsed once. Every actor owns only CPU transforms, animation actions, and joint
 * staging palettes; immutable geometry, materials, pipelines, instance buffers, and draw calls
 * are shared across the entire crowd.
 */
export class GLTFAnimatedCrowd {
  readonly device: Device;
  readonly gltf: GLTFPostprocessed;
  readonly scenegraphs: GLTFScenegraphs;
  readonly capacity: number;
  readonly primitiveGroups: readonly GLTFCrowdPrimitiveGroup[];
  readonly models: readonly Model[];

  private readonly actorsById = new Map<string, GLTFCrowdActor>();
  private readonly actorLODLevels = new Map<string, number>();
  private readonly lodOptions?: GLTFCrowdLODOptions;
  private readonly lodSource: GLTFCrowdLODStats['source'];
  private readonly lodScreenCoverage: readonly number[];
  private readonly maximumLODLevel: number;
  private currentLODView: GLTFCrowdLODView | null = null;
  private isLODEnabled: boolean;
  private lodBias = 1;
  private currentLODStats: GLTFCrowdLODStats;
  private nextActorIndex = 0;
  private isDestroyed = false;
  private suspendedRefreshCount = 0;

  constructor(device: Device, gltf: GLTFPostprocessed, options: GLTFAnimatedCrowdOptions = {}) {
    const {capacity = 16, lod, ...parseOptions} = options;
    // Fixed capacity keeps GPU instance and joint-palette buffers stable for the crowd lifetime.
    assert(Number.isSafeInteger(capacity) && capacity > 0);
    this.device = device;
    this.capacity = capacity;
    this.lodOptions = lod;
    this.isLODEnabled = lod?.enabled ?? false;

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

    const jointsPerInstance = Math.max(
      0,
      ...(this.gltf.skins || []).map(skin => skin.joints.length)
    );
    const configuration: GLTFCrowdModelConfiguration = {capacity, jointsPerInstance};
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
    const authoredScreenCoverage = lod ? this.getAuthoredScreenCoverage() : [0];
    this.lodScreenCoverage = lod?.screenCoverage || authoredScreenCoverage;
    this.currentLODStats = {
      source: this.lodSource,
      visibleActors: 0,
      culledActors: 0,
      drawCount: 0,
      triangles: 0,
      levels: []
    };
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

  /** Enables or disables per-actor LOD without recreating actors, models, or GPU resources. */
  setLODEnabled(enabled: boolean): this {
    this.isLODEnabled = enabled;
    this.actorLODLevels.clear();
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
    const actorWorldMatrices = actors.map(actor => {
      const worldMatrices = collectNodeWorldMatrices(actor.root);
      actor.updateSkinMatrices(worldMatrices);
      return worldMatrices;
    });
    const selectedLevels = actors.map(actor => this.selectActorLOD(actor));
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
        const matrix = actorNode && actorWorldMatrices[actorIndex].get(actorNode);
        for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
          for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
            resources.transformColumns[columnIndex][instanceCount * 4 + rowIndex] =
              matrix?.[columnIndex * 4 + rowIndex] || 0;
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
      levels: [...levelStats.values()].sort((first, second) => first.level - second.level)
    };
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
    let maximumLevel = 0;
    for (const group of this.primitiveGroups) {
      if (group.nodeIndex === nodeIndex) {
        maximumLevel = Math.max(maximumLevel, group.lodLevel);
      }
    }
    return maximumLevel;
  }

  private selectActorLOD(actor: GLTFCrowdActor): number | null {
    if (!this.isLODEnabled || !this.currentLODView || this.maximumLODLevel === 0) {
      this.actorLODLevels.set(actor.id, 0);
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
      return null;
    }

    const normalizedRadiusX = (worldRadius * Math.abs(projectionMatrix[0])) / clipW;
    const normalizedRadiusY = (worldRadius * Math.abs(projectionMatrix[5])) / clipW;
    if (
      Math.abs(clipX / clipW) > 1 + normalizedRadiusX ||
      Math.abs(clipY / clipW) > 1 + normalizedRadiusY
    ) {
      this.actorLODLevels.delete(actor.id);
      return null;
    }

    const viewportScale =
      viewportWidth && viewportHeight
        ? viewportHeight / Math.min(viewportWidth, viewportHeight)
        : 1;
    const coverage = normalizedRadiusY * viewportScale * this.lodBias;
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
          model: child.model,
          transformBuffers: resources.transformBuffers,
          jointCount: skinBinding?.joints.length || 0,
          ...(resources.jointMatrices ? {jointMatrices: resources.jointMatrices} : {}),
          ...(resources.skinJointMatrices ? {skinJointMatrices: resources.skinJointMatrices} : {})
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
