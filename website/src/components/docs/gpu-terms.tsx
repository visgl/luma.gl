import React, {type ReactNode, useId} from 'react';

export const GPU_DOCUMENTATION_TERMS = {
  resource: 'A GPU object or logical value that work reads or writes, such as a buffer, texture, pipeline, or graph allocation.',
  binding: 'The connection that makes a buffer, texture, sampler, or uniform block available to shader code.',
  layout: 'A declaration of how values are arranged in memory or exposed to shader stages.',
  pipeline: 'Compiled shader stages plus fixed GPU state used for rendering or compute work.',
  pass: 'A related sequence of render or compute commands recorded against a defined set of outputs.',
  encoder: 'An object that records GPU commands before they are submitted together.',
  submission: 'Sending recorded command buffers to the GPU queue for execution.',
  ownership: 'The responsibility for destroying a GPU resource and deciding how long it remains valid.',
  redraw: 'A request to render another frame because visible state changed; it is not necessarily a continuous loop.',
  'shader module': 'Reusable shader behavior with source, dependencies, typed props or bindings, and optional injection points.',
  hook: 'A named extension point in shader source that modules or plugins may call or implement.',
  injection: 'Shader source inserted at a declared hook or source location during assembly.',
  plugin: 'A configurable shader extension that selects modules, bindings, and source changes for a rendering feature.',
  hazard: 'A conflicting resource access that requires ordering, such as a write that must finish before a later read.',
  node: 'One declared unit of compute, copy, or render work in a command graph.',
  contributor: 'Reusable logic that adds resources and nodes to a caller-owned graph without owning compilation or submission.',
  transient: 'Temporary graph-owned storage that may share an allocation with non-overlapping lifetimes.',
  compilation: 'Validation, dependency derivation, scheduling, lifetime planning, allocation, and callback compilation for a graph topology.',
  chunk: 'A durable partition of source data or GPU storage, distinct from a frame-budget execution slice.',
  'execution slice': 'A legal bounded portion of resumable graph work selected to run in the current frame.',
  'indirect command': 'Draw or dispatch arguments stored in GPU memory so GPU results can control later work without CPU readback.'
} as const;

export type GPUTermName = keyof typeof GPU_DOCUMENTATION_TERMS;

/** Keyboard-accessible inline terminology shared by Core, Engine, Shadertools, and GPU Core docs. */
export function GPUTerm({children, term}: {children?: ReactNode; term: GPUTermName}): ReactNode {
  const tooltipIdentifier = useId();
  return (
    <span className="gpu-core-term" tabIndex={0} aria-describedby={tooltipIdentifier}>
      {children ?? term}
      <span className="gpu-core-term__tooltip" id={tooltipIdentifier} role="tooltip">
        {GPU_DOCUMENTATION_TERMS[term]}
      </span>
    </span>
  );
}
