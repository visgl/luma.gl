// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GroupNode, type ScenegraphNode} from '../../index';
import {
  ScenegraphPhysicsInstance,
  type ScenegraphPhysicsDefinition,
  type ScenegraphPhysicsCapture
} from './scenegraph-instance';
import {ScenegraphPhysicsMotion, type ScenegraphPhysicsColliderTarget} from './scenegraph-motion';
import {ScenegraphPhysicsPublication} from './scenegraph-publication';
import {ScenegraphPhysicsProperties} from './scenegraph-properties';
import {
  ScenegraphPhysicsBehaviors,
  type ScenegraphPhysicsBehaviorProps
} from './scenegraph-behaviors';
import type {GPURigidBodyWorld} from '@luma.gl/graph/gpu-physics';

export type ScenegraphPhysicsScene = {
  roots: readonly ScenegraphNode[];
  definition: ScenegraphPhysicsDefinition;
  colliders?: readonly ScenegraphPhysicsColliderTarget[];
  properties?: (world: GPURigidBodyWorld) => ScenegraphPhysicsProperties;
  behaviors?: ScenegraphPhysicsBehaviorProps;
};
type NodeState = {
  node: ScenegraphNode;
  matrix: number[];
  position: number[];
  rotation: number[];
  scale: number[];
  display: boolean;
  children?: ScenegraphNode[];
};
export type ScenegraphPhysicsSessionCapture = {
  physics: ScenegraphPhysicsCapture;
  scene: ScenegraphPhysicsScene;
  authored: NodeState[];
  ownership: ReturnType<ScenegraphPhysicsMotion['captureOwnership']>;
  nodes: NodeState[];
};

/** Coordinates borrowed engine scenes and owned GPU worlds across edits and asynchronous work. */
export class ScenegraphPhysicsSession {
  private pending?: Promise<unknown>;
  private closing = false;
  private revisionValue = 0;
  private authored: NodeState[];
  motion: ScenegraphPhysicsMotion;
  publication: ScenegraphPhysicsPublication;
  properties: ScenegraphPhysicsProperties;
  behaviors?: ScenegraphPhysicsBehaviors;

  private constructor(
    readonly device: Device,
    private scene: ScenegraphPhysicsScene,
    private instance: ScenegraphPhysicsInstance
  ) {
    this.authored = snapshotNodes(scene.roots);
    const bindings = this.makeBindings();
    this.motion = bindings.motion;
    this.publication = bindings.publication;
    this.properties = bindings.properties;
    this.behaviors = bindings.behaviors;
  }
  static async create(
    device: Device,
    scene: ScenegraphPhysicsScene
  ): Promise<ScenegraphPhysicsSession> {
    snapshotNodes(scene.roots);
    const instance = await ScenegraphPhysicsInstance.create(
      device,
      withPublication(scene.definition)
    );
    try {
      const session = new ScenegraphPhysicsSession(device, scene, instance);
      await instance.publish();
      return session;
    } catch (error) {
      await instance.destroy();
      throw error;
    }
  }
  get world() {
    return this.instance.world;
  }
  get graph() {
    return this.instance.graph;
  }
  /** Renderer/event bindings are borrowed for exactly one revision. */
  get revision() {
    return this.revisionValue;
  }

  private makeBindings(world = this.world, scene = this.scene) {
    return {
      motion: new ScenegraphPhysicsMotion(
        world,
        scene.roots,
        scene.definition.bodies,
        scene.colliders
      ),
      publication: new ScenegraphPhysicsPublication(world, scene.roots, scene.definition.bodies),
      properties: scene.properties?.(world) ?? new ScenegraphPhysicsProperties(world, new Map()),
      behaviors: scene.behaviors
        ? new ScenegraphPhysicsBehaviors(world, scene.behaviors)
        : undefined
    };
  }
  private refreshBindings(bindings: ReturnType<ScenegraphPhysicsSession['makeBindings']>) {
    this.motion = bindings.motion;
    this.publication = bindings.publication;
    this.properties = bindings.properties;
    this.behaviors = bindings.behaviors;
    this.revisionValue++;
  }
  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.pending || this.closing) throw new Error('Physics session is busy or closed');
    const pending = Promise.resolve().then(operation);
    this.pending = pending;
    try {
      return await pending;
    } finally {
      this.pending = undefined;
    }
  }

  /** Sample/blend first; declare active transform tracks, including paused tracks, explicitly. */
  async step(
    animatedNodes: ReadonlySet<ScenegraphNode> = new Set(),
    sample?: () => void,
    encode?: Parameters<ScenegraphPhysicsInstance['advance']>[1]
  ): Promise<void> {
    return this.exclusive(() =>
      this.instance.advance(() => {
        sample?.();
        this.motion.setAnimatedNodes(animatedNodes);
        this.motion.update();
        this.publication.update();
      }, encode)
    );
  }
  /** Queries and their continuations cannot outlive the world revision they borrow. */
  async withWorld<T>(operation: (world: GPURigidBodyWorld) => Promise<T>): Promise<T> {
    return this.exclusive(() => this.instance.withWorld(operation));
  }
  async capture(): Promise<ScenegraphPhysicsSessionCapture> {
    return this.exclusive(async () => ({
      physics: await this.instance.capture(),
      scene: this.scene,
      authored: this.authored.map(state => ({
        ...state,
        matrix: [...state.matrix],
        position: [...state.position],
        rotation: [...state.rotation],
        scale: [...state.scale],
        children: state.children ? [...state.children] : undefined
      })),
      ownership: this.motion.captureOwnership(),
      nodes: snapshotNodes(this.scene.roots)
    }));
  }
  async restore(capture: ScenegraphPhysicsSessionCapture): Promise<void> {
    return this.exclusive(async () => {
      validateNodes(capture.nodes, capture.scene.roots);
      validateNodes(capture.authored, capture.scene.roots);
      await this.replaceBindings(
        capture.nodes,
        prepare => this.instance.restore(capture.physics, prepare),
        capture.scene,
        bindings => bindings.motion.restoreOwnership(capture.ownership)
      );
      this.authored = capture.authored;
    });
  }
  /** Restore authored physics and scene transforms, leaving external cameras alone. */
  async reset(): Promise<void> {
    return this.exclusive(() =>
      this.replaceBindings(this.authored, prepare => this.instance.reset(prepare))
    );
  }
  private async replaceBindings(
    nodes: NodeState[],
    replace: (prepare: (world: GPURigidBodyWorld) => void) => Promise<void>,
    scene = this.scene,
    prepareBindings?: (bindings: ReturnType<ScenegraphPhysicsSession['makeBindings']>) => void
  ) {
    const previousNodes = snapshotNodes(this.scene.roots);
    await this.behaviors?.destroy();
    let bindings: ReturnType<ScenegraphPhysicsSession['makeBindings']> | undefined;
    try {
      restoreNodes(nodes);
      await replace(world => {
        bindings = this.makeBindings(world, scene);
        prepareBindings?.(bindings);
      });
      this.scene = scene;
      this.refreshBindings(bindings!);
    } catch (error) {
      restoreNodes(previousNodes);
      this.behaviors = this.scene.behaviors
        ? new ScenegraphPhysicsBehaviors(this.world, this.scene.behaviors)
        : undefined;
      throw error;
    }
  }
  /** Explicit cooking boundary for mesh, skin, morph, topology and arbitrary scene edits. */
  async rebuild(cook: () => Promise<ScenegraphPhysicsScene>, preserveState = true): Promise<void> {
    return this.exclusive(async () => {
      const previousNodes = snapshotNodes(this.scene.roots);
      try {
        const scene = await cook();
        const authored = snapshotNodes(scene.roots);
        await this.replaceBindings(
          authored,
          prepare =>
            this.instance.rebuild(withPublication(scene.definition), preserveState, prepare),
          scene
        );
        this.authored = authored;
      } catch (error) {
        restoreNodes(previousNodes);
        throw error;
      }
    });
  }
  async destroy(): Promise<void> {
    this.closing = true;
    try {
      await this.pending;
    } catch {
      /* Rejected edits retain an owned instance. */
    }
    await this.behaviors?.destroy();
    await this.instance.destroy();
  }
}

function withPublication(definition: ScenegraphPhysicsDefinition): ScenegraphPhysicsDefinition {
  return {
    ...definition,
    world: {
      ...definition.world,
      publicationBounds:
        definition.world.publicationBounds ??
        definition.world.bodies.map(() => [
          [0, 0, 0],
          [0, 0, 0]
        ])
    }
  };
}
function snapshotNodes(roots: readonly ScenegraphNode[]): NodeState[] {
  const result: NodeState[] = [];
  const seen = new Set<ScenegraphNode>();
  const visit = (node: ScenegraphNode) => {
    if (seen.has(node)) throw new Error('Physics session scene must be a tree');
    seen.add(node);
    result.push({
      node,
      matrix: Array.from(node.matrix),
      position: Array.from(node.position),
      rotation: Array.from(node.rotation),
      scale: Array.from(node.scale),
      children: node instanceof GroupNode ? [...node.children] : undefined,
      display: node.display
    });
    if (node instanceof GroupNode) for (const child of node.children) visit(child);
  };
  roots.forEach(visit);
  return result;
}
function validateNodes(states: readonly NodeState[], roots: readonly ScenegraphNode[]) {
  const nodes = new Map(states.map(state => [state.node, state]));
  if (
    nodes.size !== states.length ||
    states.some(
      state =>
        state.matrix.length !== 16 ||
        state.position.length !== 3 ||
        state.scale.length !== 3 ||
        ![3, 4].includes(state.rotation.length) ||
        typeof state.display !== 'boolean' ||
        [...state.matrix, ...state.position, ...state.rotation, ...state.scale].some(
          value => !Number.isFinite(value)
        ) ||
        (state.node instanceof GroupNode ? !state.children : state.children !== undefined)
    )
  )
    throw new Error('Incompatible scene capture');
  const visited = new Set<ScenegraphNode>();
  const visit = (node: ScenegraphNode) => {
    const state = nodes.get(node);
    if (!state || visited.has(node)) throw new Error('Incompatible captured hierarchy');
    visited.add(node);
    state.children?.forEach(visit);
  };
  roots.forEach(visit);
  if (visited.size !== nodes.size) throw new Error('Detached captured node');
}

function restoreNodes(states: readonly NodeState[]) {
  for (const state of states) {
    state.node.setMatrixComponents({
      position: [...state.position],
      rotation: [...state.rotation],
      scale: [...state.scale],
      update: false
    });
    state.node.setMatrix(state.matrix);
    state.node.display = state.display;
    if (state.node instanceof GroupNode && state.children)
      state.node.children = [...state.children];
  }
}
