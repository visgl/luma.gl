// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandGraph} from './gpu-command-graph';
import type {GPURenderCommandNode} from './gpu-command-node';

/** Resource declarations shared by SimpleGraph and full WebGPU graphs. */
export type GPURenderOperationResources = Pick<
  GPUCommandGraph,
  'device' | 'importBuffer' | 'importTexture' | 'createTransientTexture' | 'createTextureView'
>;

/**
 * A reusable render primitive. Each compilation creates fresh logical resources and executables.
 * Declare every buffer and texture access so the containing graph can schedule its passes.
 */
export class GPURenderOperation {
  readonly type = 'render-operation';
  readonly id: string;
  private readonly createNodes: (
    graph: GPURenderOperationResources
  ) => readonly GPURenderCommandNode[];

  constructor(props: {
    id: string;
    createNodes: (graph: GPURenderOperationResources) => readonly GPURenderCommandNode[];
  }) {
    this.id = props.id;
    this.createNodes = props.createNodes;
  }

  /** Contributes individual passes to the containing graph; never compiles or submits it. */
  getCommandNodes(graph: GPURenderOperationResources): readonly GPURenderCommandNode[] {
    return this.createNodes(graph);
  }
}
