// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {DrawCommandBufferView} from './draw-command-buffer';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {GPU_SCENE_ACTIVE_FLAG, GPU_SCENE_INVALID_REFERENCE, type GPUSceneView} from './gpu-scene';
import {getGPUShaderSubgroupStrategy, getSubgroupBallotHelpersWGSL} from './gpu-subgroup-utils';

const SCENE_DRAW_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

type DispatchLayout = {x: number; y: number; z: number};

/** Scene fields required for indirect draw-command generation. */
export type GPUSceneDrawSource = Pick<GPUSceneView, 'recordCount' | 'flags' | 'commandSlots'>;

/** Properties for one fixed-capacity scene draw-command publication workflow. */
export type GPUSceneDrawGenerationProps = {
  id?: string;
  /** Active flags and explicit command slots from one scene partition. */
  scene: GPUSceneDrawSource;
  /** Optional packed source-aligned visibility flags. Nonzero rows are visible. */
  visibility?: GraphDataView<'uint32'>;
  /** Imported indirect records whose geometry fields are already initialized. */
  commands: DrawCommandBufferView;
  /** Number of active visible records requesting a non-invalid command slot. */
  requiredCount: GraphDataView<'uint32'>;
  /** Number of unique in-range command slots published successfully. */
  publishedCount: GraphDataView<'uint32'>;
  /** Nonzero when a requested slot is out of range or claimed by more than one record. */
  overflow: GraphDataView<'uint32'>;
};

/** CPU-visible storage and dispatch facts for {@link GPUSceneDrawGeneration}. */
export type GPUSceneDrawGenerationStats = {
  recordCount: number;
  recordCapacity: number;
  commandCapacity: number;
  commandRecordByteLength: number;
  transientByteLength: number;
  outputByteLength: number;
};

/**
 * Publishes visible scene rows into explicit indirect-command slots without CPU draw selection.
 *
 * Geometry fields remain caller-authored. The workflow clears and writes only `instanceCount` and
 * `firstInstance`. The lowest scene row deterministically owns a colliding slot; required and
 * published counts plus overflow keep the incomplete result observable.
 */
export class GPUSceneDrawGeneration {
  readonly id: string;
  readonly scene: GPUSceneDrawSource;
  readonly visibility?: GraphDataView<'uint32'>;
  readonly commands: DrawCommandBufferView;
  readonly requiredCount: GraphDataView<'uint32'>;
  readonly publishedCount: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly stats: GPUSceneDrawGenerationStats;

  constructor(props: GPUSceneDrawGenerationProps) {
    this.id = props.id ?? 'gpu-scene-draw-generation';
    this.scene = props.scene;
    this.visibility = props.visibility;
    this.commands = props.commands;
    this.requiredCount = props.requiredCount;
    this.publishedCount = props.publishedCount;
    this.overflow = props.overflow;

    validateSceneSource(this.id, this.scene, this.visibility);
    validateCommandView(this.id, this.commands);
    for (const [view, name] of [
      [this.requiredCount, 'requiredCount'],
      [this.publishedCount, 'publishedCount'],
      [this.overflow, 'overflow']
    ] as const) {
      validatePackedUint32View(view, `${this.id} ${name}`);
      if (view.length < 1) throw new Error(`${this.id} ${name} requires one uint32 row`);
    }
    validateDisjointStorage(this);

    this.stats = Object.freeze({
      recordCount: this.scene.recordCount,
      recordCapacity: this.scene.flags.length,
      commandCapacity: this.commands.capacity,
      commandRecordByteLength: this.commands.recordByteLength,
      transientByteLength: (this.commands.capacity + this.scene.flags.length) * UINT32_BYTE_LENGTH,
      outputByteLength:
        this.commands.capacity * this.commands.recordByteLength + 3 * UINT32_BYTE_LENGTH
    });
  }

  /** Adds deterministic initialize, eligibility, claim, and publish passes to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (!graph.device.features.has('indirect-first-instance')) {
      throw new Error(`${this.id} requires the indirect-first-instance device feature`);
    }
    const views = [
      this.scene.flags,
      this.scene.commandSlots,
      ...(this.visibility ? [this.visibility] : []),
      this.commands.words,
      this.requiredCount,
      this.publishedCount,
      this.overflow
    ];
    for (const view of views) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }

    const owners = createTransientView(
      graph,
      `${this.id}-owners`,
      'uint32',
      this.commands.capacity
    );
    const eligibility = createTransientView(
      graph,
      `${this.id}-eligibility`,
      'uint32',
      this.scene.flags.length
    );
    const sceneRecords = graph.createDataView(this.scene.flags.buffer, {
      format: 'uint32',
      length: this.scene.flags.buffer.byteLength / UINT32_BYTE_LENGTH
    });
    addInitializePass(graph, this, owners);
    addEligibilityPass(graph, this, sceneRecords, eligibility);
    addClaimPass(graph, this, eligibility, owners);
    addPublishPass(graph, this, eligibility, owners);
  }
}

function addEligibilityPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  generation: GPUSceneDrawGeneration,
  sceneRecords: GraphDataView<'uint32'>,
  eligibility: GraphDataView<'uint32'>
): void {
  const dispatch = getDispatchLayout(
    generation.scene.flags.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const visibilityDeclaration = generation.visibility
    ? '@group(0) @binding(1) var<storage, read> visibility: array<u32>;'
    : '';
  const visibilityFilter = generation.visibility
    ? `if (visibility[${getViewElementOffset(generation.visibility)}u + index] == 0u) {
    eligible = 0u;
  }`
    : '';
  const eligibilityBinding = generation.visibility ? 2 : 1;
  addComputationPass(graph, {
    id: `${generation.id}-eligibility`,
    source: `${makeDispatchConstants(dispatch)}
const RECORD_COUNT: u32 = ${generation.scene.flags.length}u;
const FLAGS_VECTOR_OFFSET: u32 = ${Math.floor(generation.scene.flags.byteOffset / 16)}u;
const FLAGS_VECTOR_STRIDE: u32 = ${generation.scene.flags.byteStride / 16}u;
const FLAGS_COMPONENT: u32 = ${(generation.scene.flags.byteOffset % 16) / UINT32_BYTE_LENGTH}u;
const ELIGIBILITY_OFFSET: u32 = ${getViewElementOffset(eligibility)}u;
@group(0) @binding(0) var<storage, read> sceneRecords: array<vec4<u32>>;
${visibilityDeclaration}
@group(0) @binding(${eligibilityBinding}) var<storage, read_write> eligibility: array<u32>;
@compute @workgroup_size(${SCENE_DRAW_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = getLinearIndex(globalId);
  if (index >= RECORD_COUNT) { return; }
  let flags = sceneRecords[FLAGS_VECTOR_OFFSET + index * FLAGS_VECTOR_STRIDE][FLAGS_COMPONENT];
  var eligible = flags & ${GPU_SCENE_ACTIVE_FLAG}u;
  ${visibilityFilter}
  eligibility[ELIGIBILITY_OFFSET + index] = eligible;
}`,
    resources: [
      {buffer: sceneRecords, usage: 'storage-read'},
      ...(generation.visibility
        ? [{buffer: generation.visibility, usage: 'storage-read'} as const]
        : []),
      {buffer: eligibility, usage: 'storage-write'}
    ],
    bindings: {
      sceneRecords,
      ...(generation.visibility ? {visibility: generation.visibility} : {}),
      eligibility
    },
    dispatch
  });
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  generation: GPUSceneDrawGeneration,
  owners: GraphDataView<'uint32'>
): void {
  const recordWords = generation.commands.recordByteLength / UINT32_BYTE_LENGTH;
  const firstInstanceWord = recordWords - 1;
  const dispatch = getDispatchLayout(
    Math.max(generation.commands.capacity, 1),
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  addComputationPass(graph, {
    id: `${generation.id}-initialize`,
    source: `${makeDispatchConstants(dispatch)}
const COMMAND_CAPACITY: u32 = ${generation.commands.capacity}u;
const RECORD_WORDS: u32 = ${recordWords}u;
const FIRST_INSTANCE_WORD: u32 = ${firstInstanceWord}u;
const OWNERS_OFFSET: u32 = ${getViewElementOffset(owners)}u;
const COMMANDS_OFFSET: u32 = ${getViewElementOffset(generation.commands.words)}u;
const REQUIRED_OFFSET: u32 = ${getViewElementOffset(generation.requiredCount)}u;
const PUBLISHED_OFFSET: u32 = ${getViewElementOffset(generation.publishedCount)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(generation.overflow)}u;
@group(0) @binding(0) var<storage, read_write> owners: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> commands: array<u32>;
@group(0) @binding(2) var<storage, read_write> requiredCount: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> publishedCount: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> overflow: array<atomic<u32>>;
@compute @workgroup_size(${SCENE_DRAW_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let index = getLinearIndex(globalId);
  if (index < COMMAND_CAPACITY) {
    atomicStore(&owners[OWNERS_OFFSET + index], ${GPU_SCENE_INVALID_REFERENCE}u);
    let commandOffset = COMMANDS_OFFSET + index * RECORD_WORDS;
    commands[commandOffset + 1u] = 0u;
    commands[commandOffset + FIRST_INSTANCE_WORD] = 0u;
  }
  if (index == 0u) {
    atomicStore(&requiredCount[REQUIRED_OFFSET], 0u);
    atomicStore(&publishedCount[PUBLISHED_OFFSET], 0u);
    atomicStore(&overflow[OVERFLOW_OFFSET], 0u);
  }
}`,
    resources: [
      {buffer: owners, usage: 'storage-write'},
      {buffer: generation.commands.buffer, usage: 'storage-write'},
      {buffer: generation.requiredCount, usage: 'storage-write'},
      {buffer: generation.publishedCount, usage: 'storage-write'},
      {buffer: generation.overflow, usage: 'storage-write'}
    ],
    bindings: {
      owners,
      commands: generation.commands.words,
      requiredCount: generation.requiredCount,
      publishedCount: generation.publishedCount,
      overflow: generation.overflow
    },
    dispatch
  });
}

function addClaimPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  generation: GPUSceneDrawGeneration,
  eligibility: GraphDataView<'uint32'>,
  owners: GraphDataView<'uint32'>
): void {
  const useSubgroups = getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const dispatch = getDispatchLayout(
    generation.scene.flags.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  addComputationPass(graph, {
    id: `${generation.id}-claim`,
    source: `${useSubgroups ? 'enable subgroups;' : ''}
${makeDispatchConstants(dispatch)}
const RECORD_COUNT: u32 = ${generation.scene.flags.length}u;
const COMMAND_CAPACITY: u32 = ${generation.commands.capacity}u;
const SLOTS_OFFSET: u32 = ${getViewElementOffset(generation.scene.commandSlots)}u;
const SLOTS_STRIDE: u32 = ${generation.scene.commandSlots.byteStride / UINT32_BYTE_LENGTH}u;
const ELIGIBILITY_OFFSET: u32 = ${getViewElementOffset(eligibility)}u;
const OWNERS_OFFSET: u32 = ${getViewElementOffset(owners)}u;
const REQUIRED_OFFSET: u32 = ${getViewElementOffset(generation.requiredCount)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(generation.overflow)}u;
@group(0) @binding(0) var<storage, read> commandSlots: array<u32>;
@group(0) @binding(1) var<storage, read> eligibility: array<u32>;
@group(0) @binding(2) var<storage, read_write> owners: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> requiredCount: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> overflow: array<atomic<u32>>;
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}
@compute @workgroup_size(${SCENE_DRAW_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
${
  useSubgroups
    ? `  let index = getLinearIndex(globalId);
  var slot = ${GPU_SCENE_INVALID_REFERENCE}u;
  var accepted = false;
  if (index < RECORD_COUNT) {
    slot = commandSlots[SLOTS_OFFSET + index * SLOTS_STRIDE];
    accepted = eligibility[ELIGIBILITY_OFFSET + index] != 0u &&
      slot != ${GPU_SCENE_INVALID_REFERENCE}u;
  }
  let acceptedBallot = subgroupBallot(accepted);
  let acceptedCount = getBallotLaneCount(acceptedBallot);
  let leaderInvocation = getFirstBallotLane(acceptedBallot);
  if (acceptedCount != 0u && subgroupInvocationId == leaderInvocation) {
    atomicAdd(&requiredCount[REQUIRED_OFFSET], acceptedCount);
  }
  if (!accepted) { return; }
  if (slot >= COMMAND_CAPACITY) {
    atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
    return;
  }
  atomicMin(&owners[OWNERS_OFFSET + slot], index);`
    : `  let index = getLinearIndex(globalId);
  if (index >= RECORD_COUNT) { return; }
  let slot = commandSlots[SLOTS_OFFSET + index * SLOTS_STRIDE];
  if (eligibility[ELIGIBILITY_OFFSET + index] == 0u || slot == ${GPU_SCENE_INVALID_REFERENCE}u) {
    return;
  }
  atomicAdd(&requiredCount[REQUIRED_OFFSET], 1u);
  if (slot >= COMMAND_CAPACITY) {
    atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
    return;
  }
  atomicMin(&owners[OWNERS_OFFSET + slot], index);
  `
}
}`,
    resources: [
      {buffer: generation.scene.commandSlots, usage: 'storage-read'},
      {buffer: eligibility, usage: 'storage-read'},
      {buffer: owners, usage: 'storage-read-write'},
      {buffer: generation.requiredCount, usage: 'storage-read-write'},
      {buffer: generation.overflow, usage: 'storage-read-write'}
    ],
    bindings: {
      commandSlots: generation.scene.commandSlots,
      eligibility,
      owners,
      requiredCount: generation.requiredCount,
      overflow: generation.overflow
    },
    dispatch
  });
}

function addPublishPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  generation: GPUSceneDrawGeneration,
  eligibility: GraphDataView<'uint32'>,
  owners: GraphDataView<'uint32'>
): void {
  const useSubgroups = getGPUShaderSubgroupStrategy(graph.device) === 'subgroups';
  const recordWords = generation.commands.recordByteLength / UINT32_BYTE_LENGTH;
  const firstInstanceWord = recordWords - 1;
  const dispatch = getDispatchLayout(
    generation.scene.flags.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  addComputationPass(graph, {
    id: `${generation.id}-publish`,
    source: `${useSubgroups ? 'enable subgroups;' : ''}
${makeDispatchConstants(dispatch)}
const RECORD_COUNT: u32 = ${generation.scene.flags.length}u;
const COMMAND_CAPACITY: u32 = ${generation.commands.capacity}u;
const RECORD_WORDS: u32 = ${recordWords}u;
const FIRST_INSTANCE_WORD: u32 = ${firstInstanceWord}u;
const SLOTS_OFFSET: u32 = ${getViewElementOffset(generation.scene.commandSlots)}u;
const SLOTS_STRIDE: u32 = ${generation.scene.commandSlots.byteStride / UINT32_BYTE_LENGTH}u;
const ELIGIBILITY_OFFSET: u32 = ${getViewElementOffset(eligibility)}u;
const OWNERS_OFFSET: u32 = ${getViewElementOffset(owners)}u;
const COMMANDS_OFFSET: u32 = ${getViewElementOffset(generation.commands.words)}u;
const PUBLISHED_OFFSET: u32 = ${getViewElementOffset(generation.publishedCount)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(generation.overflow)}u;
@group(0) @binding(0) var<storage, read> commandSlots: array<u32>;
@group(0) @binding(1) var<storage, read> eligibility: array<u32>;
@group(0) @binding(2) var<storage, read_write> owners: array<atomic<u32>>;
@group(0) @binding(3) var<storage, read_write> commands: array<u32>;
@group(0) @binding(4) var<storage, read_write> publishedCount: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> overflow: array<atomic<u32>>;
${useSubgroups ? getSubgroupBallotHelpersWGSL() : ''}
@compute @workgroup_size(${SCENE_DRAW_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>${useSubgroups ? ',\n  @builtin(subgroup_invocation_id) subgroupInvocationId: u32' : ''}
) {
${
  useSubgroups
    ? `  let index = getLinearIndex(globalId);
  var slot = ${GPU_SCENE_INVALID_REFERENCE}u;
  var candidate = false;
  if (index < RECORD_COUNT) {
    slot = commandSlots[SLOTS_OFFSET + index * SLOTS_STRIDE];
    candidate = eligibility[ELIGIBILITY_OFFSET + index] != 0u &&
      slot != ${GPU_SCENE_INVALID_REFERENCE}u && slot < COMMAND_CAPACITY;
  }
  var published = false;
  if (candidate) {
    published = atomicLoad(&owners[OWNERS_OFFSET + slot]) == index;
  }
  let collision = candidate && !published;
  let collisionBallot = subgroupBallot(collision);
  let publishedBallot = subgroupBallot(published);
  let collisionLeader = getFirstBallotLane(collisionBallot);
  let publishedLeader = getFirstBallotLane(publishedBallot);
  let publishedTotal = getBallotLaneCount(publishedBallot);
  if (any(collisionBallot != vec4<u32>(0u)) && subgroupInvocationId == collisionLeader) {
    atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
  }
  if (publishedTotal != 0u && subgroupInvocationId == publishedLeader) {
    atomicAdd(&publishedCount[PUBLISHED_OFFSET], publishedTotal);
  }
  if (!published) { return; }
  let commandOffset = COMMANDS_OFFSET + slot * RECORD_WORDS;
  commands[commandOffset + 1u] = 1u;
  commands[commandOffset + FIRST_INSTANCE_WORD] = index;`
    : `  let index = getLinearIndex(globalId);
  if (index >= RECORD_COUNT) { return; }
  let slot = commandSlots[SLOTS_OFFSET + index * SLOTS_STRIDE];
  if (
    eligibility[ELIGIBILITY_OFFSET + index] == 0u ||
    slot == ${GPU_SCENE_INVALID_REFERENCE}u ||
    slot >= COMMAND_CAPACITY
  ) {
    return;
  }
  if (atomicLoad(&owners[OWNERS_OFFSET + slot]) != index) {
    atomicStore(&overflow[OVERFLOW_OFFSET], 1u);
    return;
  }
  let commandOffset = COMMANDS_OFFSET + slot * RECORD_WORDS;
  commands[commandOffset + 1u] = 1u;
  commands[commandOffset + FIRST_INSTANCE_WORD] = index;
  atomicAdd(&publishedCount[PUBLISHED_OFFSET], 1u);
  `
}
}`,
    resources: [
      {buffer: generation.scene.commandSlots, usage: 'storage-read'},
      {buffer: eligibility, usage: 'storage-read'},
      {buffer: owners, usage: 'storage-read-write'},
      {buffer: generation.commands.buffer, usage: 'storage-write'},
      {buffer: generation.publishedCount, usage: 'storage-read-write'},
      {buffer: generation.overflow, usage: 'storage-read-write'}
    ],
    bindings: {
      commandSlots: generation.scene.commandSlots,
      eligibility,
      owners,
      commands: generation.commands.words,
      publishedCount: generation.publishedCount,
      overflow: generation.overflow
    },
    dispatch
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatch: DispatchLayout;
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
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateSceneSource(
  id: string,
  scene: GPUSceneDrawSource,
  visibility?: GraphDataView<'uint32'>
): void {
  if (
    !Number.isSafeInteger(scene.recordCount) ||
    scene.recordCount < 0 ||
    scene.recordCount > scene.flags.length ||
    scene.recordCount > scene.commandSlots.length ||
    scene.flags.length !== scene.commandSlots.length
  ) {
    throw new Error(`${id} scene recordCount must fit its field views`);
  }
  validateSceneField(scene.flags, `${id} scene.flags`);
  validateSceneField(scene.commandSlots, `${id} scene.commandSlots`);
  if (
    scene.flags.buffer !== scene.commandSlots.buffer ||
    scene.flags.buffer.byteLength % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${id} scene fields must share one uint32-aligned record buffer`);
  }
  if (visibility) {
    validatePackedUint32View(visibility, `${id} visibility`);
    if (visibility.length < scene.flags.length) {
      throw new Error(`${id} visibility must contain one row per scene capacity`);
    }
  }
}

function validateSceneField(view: GraphDataView, name: string): void {
  if (
    view.format !== 'uint32' ||
    view.rowByteLength !== UINT32_BYTE_LENGTH ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0 ||
    view.byteStride % 16 !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned, vec4-strided scene storage`);
  }
}

function validateCommandView(id: string, commands: DrawCommandBufferView): void {
  const recordWords = commands.type === 'draw-indexed' ? 5 : 4;
  if (
    !Number.isSafeInteger(commands.capacity) ||
    commands.capacity < 1 ||
    commands.recordByteLength !== recordWords * UINT32_BYTE_LENGTH ||
    commands.words.buffer !== commands.buffer ||
    commands.words.length < commands.capacity * recordWords
  ) {
    throw new Error(`${id} commands must describe complete indirect records`);
  }
  validatePackedUint32View(commands.words, `${id} commands.words`);
  if (
    (commands.buffer.usage & (Buffer.STORAGE | Buffer.INDIRECT)) !==
    (Buffer.STORAGE | Buffer.INDIRECT)
  ) {
    throw new Error(`${id} commands require storage and indirect buffer usage`);
  }
}

function validateDisjointStorage(generation: GPUSceneDrawGeneration): void {
  const inputs = [
    generation.scene.flags,
    generation.scene.commandSlots,
    ...(generation.visibility ? [generation.visibility] : [])
  ];
  const outputs = [
    generation.commands.words,
    generation.requiredCount,
    generation.publishedCount,
    generation.overflow
  ];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    const output = outputs[outputIndex]!;
    if (inputs.some(input => doGraphDataViewsOverlap(input, output))) {
      throw new Error(`${generation.id} writable outputs cannot overlap scene inputs`);
    }
    if (
      outputs
        .slice(outputIndex + 1)
        .some(otherOutput => doGraphDataViewsOverlap(output, otherOutput))
    ) {
      throw new Error(`${generation.id} writable outputs cannot overlap one another`);
    }
  }
}

function getDispatchLayout(elementCount: number, maximumDimension: number): DispatchLayout {
  const maximum = Math.floor(maximumDimension);
  const workgroupCount = Math.max(1, Math.ceil(elementCount / SCENE_DRAW_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) throw new Error('GPU scene draw generation exceeds the device dispatch limit');
  return {x, y, z};
}

function makeDispatchConstants(dispatch: DispatchLayout): string {
  return `const DISPATCH_X: u32 = ${dispatch.x * SCENE_DRAW_WORKGROUP_SIZE}u;
const DISPATCH_Y: u32 = ${dispatch.y}u;
fn getLinearIndex(globalId: vec3<u32>) -> u32 {
  return globalId.x + globalId.y * DISPATCH_X + globalId.z * DISPATCH_X * DISPATCH_Y;
}`;
}
