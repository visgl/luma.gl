// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Bindings, CommandEncoder, ComputePass} from '@luma.gl/core';

type ComputePipelineResources = Record<string, Binding | undefined>;
type Workgroups = readonly [number, number?, number?];

type ComputeDispatch<ResourceName extends string, KernelName extends string, Frame> = {
  kernel: KernelName;
  /** Bindings are resolved by shader binding name. Undefined optional resources are omitted. */
  bindings: Readonly<Record<string, ResourceName>>;
  workgroups: (frame: Frame) => Workgroups;
};

/**
 * Ordered compute passes and reusable GPU operations. Each compute pass groups one or more
 * dispatches. An operation can record an existing transform, such as an FFT, between passes.
 *
 * Named resources refer to bindings supplied by the caller for this execution. The caller owns
 * allocation, compilation, and command submission, and can reuse the definition across devices.
 */
export type ComputePipelineDefinition<
  Resources extends ComputePipelineResources,
  KernelName extends string,
  Frame
> = {
  name: string;
  passes: readonly (
    | {
        kind: 'compute';
        name: string;
        dispatches: readonly ComputeDispatch<Extract<keyof Resources, string>, KernelName, Frame>[];
      }
    | {
        kind: 'operation';
        name: string;
        when?: (frame: Frame) => boolean;
        encode: (commandEncoder: CommandEncoder, resources: Resources, frame: Frame) => void;
      }
  )[];
};

/** Records a definition using caller-owned kernels and bindings. */
export function encodeComputePipeline<
  Resources extends ComputePipelineResources,
  KernelName extends string,
  Frame
>(
  definition: ComputePipelineDefinition<Resources, KernelName, Frame>,
  options: {
    commandEncoder: CommandEncoder;
    id?: string;
    resources: Resources;
    frame: Frame;
    /** Optional setup for kernels that must upload and prepare bindings outside of a pass. */
    prepare?: (kernel: KernelName, bindings: Bindings) => void;
    dispatch: (
      kernel: KernelName,
      computePass: ComputePass,
      bindings: Bindings,
      workgroups: Workgroups
    ) => void;
  }
): void {
  const {commandEncoder, resources, frame, prepare, dispatch} = options;
  for (const pass of definition.passes) {
    if (pass.kind === 'operation') {
      if (!pass.when || pass.when(frame)) {
        pass.encode(commandEncoder, resources, frame);
      }
      continue;
    }

    const dispatches = pass.dispatches.map(compute => {
      const bindings: Bindings = {};
      for (const [name, resourceName] of Object.entries(compute.bindings)) {
        const binding = resources[resourceName];
        if (binding !== undefined) {
          bindings[name] = binding;
        }
      }
      prepare?.(compute.kernel, bindings);
      return {kernel: compute.kernel, bindings, workgroups: compute.workgroups(frame)};
    });

    const computePass = commandEncoder.beginComputePass({
      id: `${options.id ?? definition.name}-${pass.name}`
    });
    try {
      for (const stage of dispatches) {
        dispatch(stage.kernel, computePass, stage.bindings, stage.workgroups);
      }
    } finally {
      computePass.end();
    }
  }
}
