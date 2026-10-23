// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUGraph} from './gpu-command-graph';
import type {GPURenderCommandNode} from './gpu-command-node';

/** Resource declarations shared by SimpleGraph and full WebGPU graphs. */
export type GPURenderOperationResources<Parameters = unknown> = Pick<
  GPUGraph<Parameters>,
  'device' | 'importBuffer' | 'importTexture' | 'createTransientTexture' | 'createTextureView'
>;

/**
 * A reusable render primitive. Each compilation creates fresh logical resources and executables.
 * Declare every buffer and texture access so the containing graph can schedule its passes.
 * Omit the parameter type for passes that do not inspect application parameters.
 */
export class GPURenderOperation<Parameters = unknown> {
  readonly type = 'render-operation';
  readonly id: string;
  private readonly createNodes: (
    graph: GPURenderOperationResources<Parameters>
  ) => readonly GPURenderCommandNode<Parameters>[];

  constructor(props: {
    id: string;
    createNodes: (
      graph: GPURenderOperationResources<Parameters>
    ) => readonly GPURenderCommandNode<Parameters>[];
  }) {
    this.id = props.id;
    this.createNodes = props.createNodes;
  }

  /** Contributes individual passes to the containing graph; never compiles or submits it. */
  getCommandNodes(
    graph: GPURenderOperationResources<Parameters>
  ): readonly GPURenderCommandNode<Parameters>[] {
    return this.createNodes(graph);
  }
}
