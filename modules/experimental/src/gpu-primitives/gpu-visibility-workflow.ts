// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {
  addGPUCompactionToGraphWithDispatchLimit,
  GPUCompaction,
  type GPUCompactionInput
} from './gpu-compaction';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from './gpu-dispatch-utils';
import {addGPUMaskToGraphWithDispatchLimit, GPUMask} from './gpu-mask';
import {
  createTransientVectorView,
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const VISIBILITY_WORKGROUP_SIZE = 256;
const MAXIMUM_UINT32 = 0xffffffff;

/** Fixed semantic role of one source-aligned visibility predicate. */
export type GPUVisibilityPredicateKind = 'time-range' | 'bounds' | 'lod' | 'selection';

/** One source-aligned mask consumed by {@link GPUVisibilityWorkflow}. */
export type GPUVisibilityPredicate = {
  /** Semantic role or fused roles used by consumers and diagnostics. */
  kind: GPUVisibilityPredicateKind | readonly GPUVisibilityPredicateKind[];
  /** Nonzero values accept the corresponding source row. */
  mask: GPUCompactionInput;
};

/** Properties for one renderer-independent visibility workflow. */
export type GPUVisibilityWorkflowProps = {
  /** Prefix for generated resources and graph nodes. */
  id?: string;
  /** Source-aligned predicate masks composed with intersection semantics. */
  predicates: readonly GPUVisibilityPredicate[];
  /** Destination for stable visible source IDs. */
  output: GPUCompactionInput;
  /** Destination for the visible count, often an indirect command's instance-count field. */
  count: GraphDataView<'uint32'>;
  /** Optional caller-visible destination for the canonical composed mask. */
  outputMask?: GPUCompactionInput;
  /** Optional explicit stable source IDs. Identity IDs are generated when omitted. */
  sourceIds?: GPUCompactionInput;
  /** First generated identity ID. Defaults to zero and is invalid with explicit source IDs. */
  firstSourceIndex?: number;
};

/**
 * Composes fixed-contract visibility masks and publishes stable IDs, a count, and indirect-ready
 * output without CPU synchronization.
 *
 * Time-range, bounds, LOD, and selection predicates all use the same source-aligned zero/nonzero
 * mask contract. The workflow intersects those masks, creates stable identity IDs when the caller
 * does not supply IDs, and delegates scan and stable scatter to {@link GPUCompaction}. The count
 * may point directly at an imported {@link DrawCommandBuffer} instance-count word.
 */
export class GPUVisibilityWorkflow {
  /** Prefix for generated resources and graph nodes. */
  readonly id: string;
  /** Source-aligned visibility predicates in composition order. */
  readonly predicates: readonly GPUVisibilityPredicate[];
  /** Stable compacted visible IDs. */
  readonly output: GPUCompactionInput;
  /** Visible count or indirect instance-count destination. */
  readonly count: GraphDataView<'uint32'>;
  /** Optional caller-visible canonical mask. */
  readonly outputMask?: GPUCompactionInput;
  /** Optional explicit source IDs. */
  readonly sourceIds?: GPUCompactionInput;
  /** First generated identity ID. */
  readonly firstSourceIndex: number;

  constructor(props: GPUVisibilityWorkflowProps) {
    this.id = props.id ?? 'gpu-visibility';
    this.predicates = props.predicates;
    this.output = props.output;
    this.count = props.count;
    this.outputMask = props.outputMask;
    this.sourceIds = props.sourceIds;
    this.firstSourceIndex = props.firstSourceIndex ?? 0;

    if (this.predicates.length === 0) {
      throw new Error(`${this.id} requires at least one visibility predicate`);
    }
    const template = this.predicates[0].mask;
    validateVisibilityInput(template, `${this.id} predicate 0`);
    for (const [predicateIndex, predicate] of this.predicates.entries()) {
      validateVisibilityInput(predicate.mask, `${this.id} predicate ${predicateIndex}`);
      validateMatchingVisibilityTopology(
        template,
        predicate.mask,
        `${this.id} predicate ${predicateIndex}`
      );
    }
    validateVisibilityInput(this.output, `${this.id} output`);
    validateVisibilityOutput(template, this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    if (this.count.length < 1) {
      throw new Error(`${this.id} count must contain one uint32 row`);
    }
    if (this.outputMask) {
      validateVisibilityInput(this.outputMask, `${this.id} output mask`);
      validateMatchingVisibilityTopology(template, this.outputMask, `${this.id} output mask`);
    }
    if (this.sourceIds) {
      validateVisibilityInput(this.sourceIds, `${this.id} source IDs`);
      validateMatchingVisibilityTopology(template, this.sourceIds, `${this.id} source IDs`);
      if (props.firstSourceIndex !== undefined) {
        throw new Error(`${this.id} firstSourceIndex cannot be used with explicit source IDs`);
      }
    }
    if (!Number.isSafeInteger(this.firstSourceIndex) || this.firstSourceIndex < 0) {
      throw new Error(`${this.id} firstSourceIndex must be a nonnegative safe integer`);
    }
    const finalSourceIndex = this.firstSourceIndex + Math.max(template.length - 1, 0);
    if (!Number.isSafeInteger(finalSourceIndex) || finalSourceIndex > MAXIMUM_UINT32) {
      throw new Error(`${this.id} generated source IDs exceed uint32 range`);
    }
  }

  /**
   * Adds mask composition, identity generation, scan, scatter, and count publication to a graph.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addGPUVisibilityWorkflowToGraphWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Adds the complete visibility workflow using one explicit dispatch limit. @internal */
export function addGPUVisibilityWorkflowToGraphWithDispatchLimit<Parameters>(
  workflow: GPUVisibilityWorkflow,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const template = workflow.predicates[0].mask;
  for (const view of [
    ...workflow.predicates.flatMap(predicate => getVisibilityChunks(predicate.mask)),
    ...getVisibilityChunks(workflow.output),
    ...(workflow.outputMask ? getVisibilityChunks(workflow.outputMask) : []),
    ...(workflow.sourceIds ? getVisibilityChunks(workflow.sourceIds) : []),
    workflow.count
  ]) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${workflow.id} views must belong to the target graph`);
    }
  }

  const finalMask =
    workflow.outputMask ?? createTransientVisibilityInput(graph, `${workflow.id}-mask`, template);
  if (finalMask !== template || workflow.predicates.length > 1) {
    const mask = new GPUMask({
      id: `${workflow.id}-compose`,
      inputs: workflow.predicates.map(predicate => predicate.mask),
      output: finalMask
    });
    addGPUMaskToGraphWithDispatchLimit(mask, graph, maxComputeWorkgroupsPerDimension);
  }

  const sourceIds =
    workflow.sourceIds ??
    createTransientVisibilityInput(graph, `${workflow.id}-source-ids`, template);
  if (!workflow.sourceIds) {
    addIdentityPasses(
      graph,
      `${workflow.id}-identity`,
      sourceIds,
      workflow.firstSourceIndex,
      maxComputeWorkgroupsPerDimension
    );
  }

  const compaction = new GPUCompaction({
    id: `${workflow.id}-compact`,
    input: sourceIds,
    flags: finalMask,
    output: workflow.output,
    count: workflow.count
  });
  addGPUCompactionToGraphWithDispatchLimit(compaction, graph, maxComputeWorkgroupsPerDimension);
}

/** Creates graph-owned storage with the same atomic or vector topology as a visibility input. */
function createTransientVisibilityInput<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  template: GPUCompactionInput
): GPUCompactionInput {
  return template instanceof GraphVectorView
    ? createTransientVectorView(graph, id, template)
    : createTransientView(graph, id, 'uint32', template.length);
}

/** Adds one stable identity-generation pass per nonempty chunk. */
function addIdentityPasses<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  output: GPUCompactionInput,
  firstSourceIndex: number,
  maxComputeWorkgroupsPerDimension: number
): void {
  let chunkSourceOffset = firstSourceIndex;
  for (const [chunkIndex, chunk] of getVisibilityChunks(output).entries()) {
    if (chunk.length > 0) {
      addIdentityPass(graph, {
        id: output instanceof GraphVectorView ? `${id}-chunk-${chunkIndex}` : id,
        output: chunk,
        firstSourceIndex: chunkSourceOffset,
        dispatchLayout: getBoundedDispatchLayout(
          'GPUVisibilityWorkflow',
          chunk.length,
          VISIBILITY_WORKGROUP_SIZE,
          maxComputeWorkgroupsPerDimension
        )
      });
    }
    chunkSourceOffset += chunk.length;
  }
}

/** Writes consecutive uint32 source IDs into one packed view. */
function addIdentityPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    output: GraphDataView<'uint32'>;
    firstSourceIndex: number;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const source = /* wgsl */ `
const ELEMENT_COUNT: u32 = ${props.output.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const FIRST_SOURCE_INDEX: u32 = ${props.firstSourceIndex}u;
@group(0) @binding(0) var<storage, read_write> outputIds: array<u32>;

@compute @workgroup_size(${VISIBILITY_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(props.dispatchLayout, VISIBILITY_WORKGROUP_SIZE)}
  if (index < ELEMENT_COUNT) {
    outputIds[OUTPUT_OFFSET + index] = FIRST_SOURCE_INDEX + index;
  }
}`;
  graph.addComputePass({
    id: props.id,
    resources: [{buffer: props.output, usage: 'storage-write'}],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source,
        shaderLayout: {
          bindings: [{name: 'outputIds', type: 'storage', group: 0, location: 0}]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            outputIds: getViewBinding(props.output, getBuffer)
          };
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Returns ordered atomic chunks without repacking vector-backed masks. */
function getVisibilityChunks(input: GPUCompactionInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

/** Validates every atomic chunk accepted by the workflow. */
function validateVisibilityInput(input: GPUCompactionInput, name: string): void {
  for (const chunk of getVisibilityChunks(input)) {
    validatePackedUint32View(chunk, name);
  }
}

/** Validates source-aligned mask or source-ID topology. */
function validateMatchingVisibilityTopology(
  template: GPUCompactionInput,
  input: GPUCompactionInput,
  name: string
): void {
  if (template instanceof GraphVectorView && input instanceof GraphVectorView) {
    validateMatchingVectorTopology(template, input, name);
  } else if (template instanceof GraphVectorView !== input instanceof GraphVectorView) {
    throw new Error(`${name} must use the same view kind`);
  } else if (template.length !== input.length) {
    throw new Error(`${name} length must match visibility predicates`);
  }
}

/** Validates compacted output capacity and required vector topology. */
function validateVisibilityOutput(
  template: GPUCompactionInput,
  output: GPUCompactionInput,
  name: string
): void {
  if (template instanceof GraphVectorView && output instanceof GraphVectorView) {
    validateMatchingVectorTopology(template, output, name);
  } else if (template instanceof GraphVectorView !== output instanceof GraphVectorView) {
    throw new Error(`${name} must use the same view kind`);
  } else if (output.length < template.length) {
    throw new Error(`${name} must contain at least one row per source`);
  }
}
