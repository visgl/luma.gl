// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {DrawCommandBufferView} from './draw-command-buffer';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {GPU_SCENE_INVALID_REFERENCE, type GPUSceneView} from './gpu-scene';

const GROUP_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Renderer-owned pipeline/resource identity and its stable indirect-command window. */
export type GPUSceneResourceGroup = {
  /** Scene groupId associated with one application-owned binding/pipeline configuration. */
  id: number;
  /** First renderer-owned indirect command in this group's fixed window. */
  firstCommand: number;
  /** Number of command slots reserved for this group. Zero explicitly represents an empty group. */
  commandCount: number;
  /** Optional required geometry reference for groups with incompatible geometry bindings. */
  geometryId?: number;
};

/** Scene fields needed to classify already-generated indirect draw commands. */
export type GPUSceneResourceGroupSource = Pick<
  GPUSceneView,
  'recordCount' | 'groupIds' | 'geometryIds'
>;

/** Inputs and caller-owned diagnostics for stable renderer resource groups. */
export type GPUSceneResourceGroupsProps = {
  id?: string;
  scene: GPUSceneResourceGroupSource;
  commands: DrawCommandBufferView;
  /** Renderer-owned group/binding order; descriptor windows must not overlap. */
  groups: readonly GPUSceneResourceGroup[];
  /** One GPU-resident active-command count per group, in descriptor order. */
  counts: GraphDataView<'uint32'>;
  /** One mismatch/command-window overflow flag per group. */
  overflows: GraphDataView<'uint32'>;
  /** Global overflow also covers active commands without a matching resource group. */
  overflow: GraphDataView<'uint32'>;
};

/** CPU-visible fixed-capacity facts for {@link GPUSceneResourceGroups}. */
export type GPUSceneResourceGroupsStats = {
  groupCount: number;
  commandCapacity: number;
  maximumGroupCommandCount: number;
  outputByteLength: number;
};

/**
 * Classifies generated indirect commands into stable renderer-owned resource groups.
 *
 * Pipeline order and slot windows remain CPU-authored binding topology; active membership,
 * geometry mismatches, misplaced slots, empty groups, and unknown groups remain GPU-resident.
 */
export class GPUSceneResourceGroups {
  readonly id: string;
  readonly scene: GPUSceneResourceGroupSource;
  readonly commands: DrawCommandBufferView;
  readonly groups: readonly Readonly<GPUSceneResourceGroup>[];
  readonly counts: GraphDataView<'uint32'>;
  readonly overflows: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly stats: Readonly<GPUSceneResourceGroupsStats>;

  constructor(props: GPUSceneResourceGroupsProps) {
    this.id = props.id ?? 'gpu-scene-resource-groups';
    this.scene = props.scene;
    this.commands = props.commands;
    this.groups = Object.freeze(props.groups.map(group => Object.freeze({...group})));
    this.counts = props.counts;
    this.overflows = props.overflows;
    this.overflow = props.overflow;

    validateScene(this);
    validateGroups(this);
    for (const [view, name] of [
      [this.counts, 'counts'],
      [this.overflows, 'overflows'],
      [this.overflow, 'overflow']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
    }
    if (
      this.counts.length < this.groups.length ||
      this.overflows.length < this.groups.length ||
      this.overflow.length < 1
    ) {
      throw new Error(`${this.id} group diagnostics must cover every group and global overflow`);
    }
    validateDisjointViews(this);

    this.stats = Object.freeze({
      groupCount: this.groups.length,
      commandCapacity: this.commands.capacity,
      maximumGroupCommandCount: Math.max(...this.groups.map(group => group.commandCount)),
      outputByteLength: (this.groups.length * 2 + 1) * UINT32_BYTE_LENGTH
    });
  }

  /** Adds deterministic diagnostic initialization and generated-command classification. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.scene.groupIds,
      this.scene.geometryIds,
      this.commands.words,
      this.counts,
      this.overflows,
      this.overflow
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    const records = graph.createDataView(this.scene.groupIds.buffer, {
      format: 'uint32',
      length: this.scene.groupIds.buffer.byteLength / UINT32_BYTE_LENGTH
    });
    addInitializePass(graph, this);
    if (this.scene.recordCount > 0) addClassifyPass(graph, this, records);
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  groups: GPUSceneResourceGroups
): void {
  const source = /* wgsl */ `
const GROUP_COUNT: u32 = ${groups.groups.length}u;
const COUNTS_OFFSET: u32 = ${getViewElementOffset(groups.counts)}u;
const OVERFLOWS_OFFSET: u32 = ${getViewElementOffset(groups.overflows)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(groups.overflow)}u;
@group(0) @binding(0) var<storage, read_write> counts: array<u32>;
@group(0) @binding(1) var<storage, read_write> overflows: array<u32>;
@group(0) @binding(2) var<storage, read_write> overflow: array<u32>;
@compute @workgroup_size(${GROUP_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3u
) {
  if (globalId.x < GROUP_COUNT) {
    counts[COUNTS_OFFSET + globalId.x] = 0u;
    overflows[OVERFLOWS_OFFSET + globalId.x] = 0u;
  }
  if (globalId.x == 0u) { overflow[OVERFLOW_OFFSET] = 0u; }
}`;
  addComputationPass(graph, {
    id: `${groups.id}-initialize`,
    source,
    resources: [
      {buffer: groups.counts, usage: 'storage-write'},
      {buffer: groups.overflows, usage: 'storage-write'},
      {buffer: groups.overflow, usage: 'storage-write'}
    ],
    bindings: {counts: groups.counts, overflows: groups.overflows, overflow: groups.overflow},
    dispatchCount: Math.ceil(groups.groups.length / GROUP_WORKGROUP_SIZE)
  });
}

function addClassifyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  groups: GPUSceneResourceGroups,
  records: GraphDataView<'uint32'>
): void {
  const recordWords = groups.commands.recordByteLength / UINT32_BYTE_LENGTH;
  const values = (project: (group: Readonly<GPUSceneResourceGroup>) => number): string =>
    groups.groups.map(group => `${project(group)}u`).join(', ');
  const source = /* wgsl */ `
const RECORD_COUNT: u32 = ${groups.scene.recordCount}u;
const COMMAND_CAPACITY: u32 = ${groups.commands.capacity}u;
const RECORD_WORDS: u32 = ${recordWords}u;
const GROUP_COUNT: u32 = ${groups.groups.length}u;
const GROUP_VECTOR_OFFSET: u32 = ${Math.floor(groups.scene.groupIds.byteOffset / 16)}u;
const GROUP_VECTOR_STRIDE: u32 = ${groups.scene.groupIds.byteStride / 16}u;
const GROUP_COMPONENT: u32 = ${(groups.scene.groupIds.byteOffset % 16) / UINT32_BYTE_LENGTH}u;
const GEOMETRY_COMPONENT: u32 = ${(groups.scene.geometryIds.byteOffset % 16) / UINT32_BYTE_LENGTH}u;
const COMMANDS_OFFSET: u32 = ${getViewElementOffset(groups.commands.words)}u;
const COUNTS_OFFSET: u32 = ${getViewElementOffset(groups.counts)}u;
const OVERFLOWS_OFFSET: u32 = ${getViewElementOffset(groups.overflows)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(groups.overflow)}u;
const GROUP_IDS = array<u32, ${groups.groups.length}>(${values(group => group.id)});
const GROUP_GEOMETRIES = array<u32, ${groups.groups.length}>(
  ${values(group => group.geometryId ?? GPU_SCENE_INVALID_REFERENCE)}
);
const FIRST_COMMANDS = array<u32, ${groups.groups.length}>(${values(group => group.firstCommand)});
const COMMAND_COUNTS = array<u32, ${groups.groups.length}>(${values(group => group.commandCount)});
@group(0) @binding(0) var<storage, read> records: array<vec4<u32>>;
@group(0) @binding(1) var<storage, read> commands: array<u32>;
@group(0) @binding(2) var<storage, read_write> counts: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> overflows: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> overflow: array<atomic<u32>>;

@compute @workgroup_size(${GROUP_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3u
) {
  let commandIndex = globalId.x;
  if (commandIndex >= COMMAND_CAPACITY) { return; }
  let commandOffset = COMMANDS_OFFSET + commandIndex * RECORD_WORDS;
  if (commands[commandOffset + 1u] == 0u) { return; }
  let sceneIndex = commands[commandOffset + RECORD_WORDS - 1u];
  if (sceneIndex >= RECORD_COUNT) {
    atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
    return;
  }

  let header = records[GROUP_VECTOR_OFFSET + sceneIndex * GROUP_VECTOR_STRIDE];
  let groupId = header[GROUP_COMPONENT];
  let geometryId = header[GEOMETRY_COMPONENT];
  for (var groupIndex = 0u; groupIndex < GROUP_COUNT; groupIndex++) {
    if (GROUP_IDS[groupIndex] != groupId) { continue; }
    let expectedGeometry = GROUP_GEOMETRIES[groupIndex];
    let firstCommand = FIRST_COMMANDS[groupIndex];
    let commandCount = COMMAND_COUNTS[groupIndex];
    if (
      (expectedGeometry != ${GPU_SCENE_INVALID_REFERENCE}u && expectedGeometry != geometryId) ||
      commandIndex < firstCommand ||
      commandIndex >= firstCommand + commandCount
    ) {
      atomicStore(&overflows[OVERFLOWS_OFFSET + groupIndex], 1u);
      atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
      return;
    }
    atomicAdd(&counts[COUNTS_OFFSET + groupIndex], 1u);
    return;
  }
  atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
}`;
  addComputationPass(graph, {
    id: `${groups.id}-classify`,
    source,
    resources: [
      {buffer: records, usage: 'storage-read'},
      {buffer: groups.commands.words, usage: 'storage-read'},
      {buffer: groups.counts, usage: 'storage-read-write'},
      {buffer: groups.overflows, usage: 'storage-read-write'},
      {buffer: groups.overflow, usage: 'storage-read-write'}
    ],
    bindings: {
      records,
      commands: groups.commands.words,
      counts: groups.counts,
      overflows: groups.overflows,
      overflow: groups.overflow
    },
    dispatchCount: Math.ceil(groups.commands.capacity / GROUP_WORKGROUP_SIZE)
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateScene(groups: GPUSceneResourceGroups): void {
  const {scene, commands} = groups;
  if (
    !Number.isSafeInteger(scene.recordCount) ||
    scene.recordCount < 0 ||
    scene.recordCount > scene.groupIds.length ||
    scene.recordCount > scene.geometryIds.length ||
    scene.groupIds.format !== 'uint32' ||
    scene.geometryIds.format !== 'uint32' ||
    scene.groupIds.buffer !== scene.geometryIds.buffer ||
    scene.groupIds.byteStride !== scene.geometryIds.byteStride ||
    scene.groupIds.byteStride % 16 !== 0 ||
    Math.floor(scene.groupIds.byteOffset / 16) !== Math.floor(scene.geometryIds.byteOffset / 16) ||
    scene.groupIds.buffer.byteLength % 16 !== 0
  ) {
    throw new Error(
      `${groups.id} scene group and geometry fields require one aligned record header`
    );
  }
  validatePackedUint32View(commands.words, `${groups.id} commands.words`);
  if (
    commands.capacity < 1 ||
    commands.words.buffer !== commands.buffer ||
    commands.words.length < (commands.capacity * commands.recordByteLength) / UINT32_BYTE_LENGTH ||
    (commands.buffer.usage & Buffer.STORAGE) === 0
  ) {
    throw new Error(`${groups.id} commands must contain readable fixed-capacity indirect records`);
  }
}

function validateGroups(groups: GPUSceneResourceGroups): void {
  if (groups.groups.length < 1) {
    throw new Error(`${groups.id} requires at least one renderer-owned resource group`);
  }
  const groupIds = new Set<number>();
  for (const group of groups.groups) {
    if (
      !Number.isSafeInteger(group.id) ||
      group.id < 0 ||
      group.id >= GPU_SCENE_INVALID_REFERENCE ||
      groupIds.has(group.id) ||
      !Number.isSafeInteger(group.firstCommand) ||
      group.firstCommand < 0 ||
      !Number.isSafeInteger(group.commandCount) ||
      group.commandCount < 0 ||
      group.firstCommand + group.commandCount > groups.commands.capacity ||
      (group.geometryId !== undefined &&
        (!Number.isSafeInteger(group.geometryId) ||
          group.geometryId < 0 ||
          group.geometryId >= GPU_SCENE_INVALID_REFERENCE))
    ) {
      throw new Error(`${groups.id} resource groups require unique IDs and bounded slot windows`);
    }
    groupIds.add(group.id);
  }
  for (let first = 0; first < groups.groups.length; first++) {
    const firstGroup = groups.groups[first]!;
    for (let second = first + 1; second < groups.groups.length; second++) {
      const secondGroup = groups.groups[second]!;
      if (
        firstGroup.commandCount > 0 &&
        secondGroup.commandCount > 0 &&
        firstGroup.firstCommand < secondGroup.firstCommand + secondGroup.commandCount &&
        secondGroup.firstCommand < firstGroup.firstCommand + firstGroup.commandCount
      ) {
        throw new Error(`${groups.id} resource-group command windows must not overlap`);
      }
    }
  }
}

function validateDisjointViews(groups: GPUSceneResourceGroups): void {
  const inputs = [groups.scene.groupIds, groups.scene.geometryIds, groups.commands.words];
  const outputs = [groups.counts, groups.overflows, groups.overflow];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const output = outputs[outputIndex]!;
    if (inputs.some(input => doGraphDataViewsOverlap(input, output))) {
      throw new Error(`${groups.id} diagnostic outputs cannot overlap scene or command inputs`);
    }
    if (outputs.slice(outputIndex + 1).some(other => doGraphDataViewsOverlap(output, other))) {
      throw new Error(`${groups.id} diagnostic outputs cannot overlap one another`);
    }
  }
}
