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
import {GLTFSkinController} from './gltf-skin';

/** Fixed shared-model and GPU-buffer configuration for an independently animated glTF crowd. */
export type GLTFAnimatedCrowdOptions = ParseGLTFOptions & {
  /** Maximum simultaneous actors; fixes GPU buffer and palette-atlas allocations. Defaults to 16. */
  capacity?: number;
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
  private nextActorIndex = 0;
  private isDestroyed = false;
  private suspendedRefreshCount = 0;

  constructor(device: Device, gltf: GLTFPostprocessed, options: GLTFAnimatedCrowdOptions = {}) {
    const {capacity = 16, ...parseOptions} = options;
    // Fixed capacity keeps GPU instance and joint-palette buffers stable for the crowd lifetime.
    assert(Number.isSafeInteger(capacity) && capacity > 0);
    this.device = device;
    this.gltf = gltf;
    this.capacity = capacity;

    const jointsPerInstance = Math.max(0, ...(gltf.skins || []).map(skin => skin.joints.length));
    const configuration: GLTFCrowdModelConfiguration = {capacity, jointsPerInstance};
    this.scenegraphs = createScenegraphsFromGLTF(device, gltf, {
      ...parseOptions,
      modelOptions: {
        ...parseOptions.modelOptions,
        userData: {...parseOptions.modelOptions?.userData, gltfAnimatedCrowd: configuration}
      }
    });
    this.primitiveGroups = createPrimitiveGroups(this.scenegraphs);
    this.models = this.primitiveGroups.map(group => group.model);
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

  /** Evaluates independent clips in seconds and uploads all actor transforms/palettes once. */
  update(deltaSeconds: number): this {
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
      if (group.model.draw(renderPass)) {
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

    for (const group of this.primitiveGroups) {
      const modelNode = findCrowdModelNode(this.scenegraphs, group.nodeIndex, group.model);
      if (!modelNode) {
        continue;
      }
      const resources = modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;

      for (let actorIndex = 0; actorIndex < actors.length; actorIndex++) {
        const actor = actors[actorIndex];
        const actorNode = actor.getNode(group.nodeIndex);
        const matrix = actorNode && actorWorldMatrices[actorIndex].get(actorNode);
        for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
          for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
            resources.transformColumns[columnIndex][actorIndex * 4 + rowIndex] =
              matrix?.[columnIndex * 4 + rowIndex] || 0;
          }
        }

        if (resources.jointMatrices) {
          const jointPalette = actor.skins.getBinding(group.nodeIndex)?.jointMatrices;
          const offset = actorIndex * resources.jointsPerInstance * 16;
          resources.jointMatrices.fill(0, offset, offset + resources.jointsPerInstance * 16);
          if (jointPalette) {
            resources.jointMatrices.set(jointPalette, offset);
          }
        }
      }

      if (actors.length > 0) {
        for (let columnIndex = 0; columnIndex < resources.transformBuffers.length; columnIndex++) {
          resources.transformBuffers[columnIndex].write(
            resources.transformColumns[columnIndex].subarray(0, actors.length * 4)
          );
        }
        if (resources.jointMatrices && resources.skinJointMatrices) {
          const jointMatrices = resources.jointMatrices.subarray(
            0,
            actors.length * resources.jointsPerInstance * 16
          );
          if (resources.skinJointMatrices instanceof Buffer) {
            resources.skinJointMatrices.write(jointMatrices);
          } else {
            resources.skinJointMatrices.writeData(jointMatrices, {
              width: resources.jointsPerInstance * 4,
              height: actors.length
            });
          }
        }
      }
      group.model.setInstanceCount(actors.length);
    }
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

function createPrimitiveGroups(scenegraphs: GLTFScenegraphs): GLTFCrowdPrimitiveGroup[] {
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
    const mesh = node.userData['gltfMesh'];
    if (!(mesh instanceof GroupNode)) {
      continue;
    }
    const skinBinding = scenegraphs.skins.getBinding(nodeIndex);
    for (const child of mesh.children) {
      if (!(child instanceof ModelNode)) {
        continue;
      }
      const resources = child.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources | undefined;
      if (!resources) {
        continue;
      }
      groups.push({
        nodeIndex,
        model: child.model,
        transformBuffers: resources.transformBuffers,
        jointCount: skinBinding?.joints.length || 0,
        ...(resources.jointMatrices ? {jointMatrices: resources.jointMatrices} : {}),
        ...(resources.skinJointMatrices ? {skinJointMatrices: resources.skinJointMatrices} : {})
      });
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
