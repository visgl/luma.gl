// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type BillboardControllerProps,
  type BillboardBinding,
  type BillboardOrientation,
  type GroupNode
} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';
import {assert} from '@luma.gl/core';

export type GLTFBillboardDefinition = Omit<BillboardOrientation, 'rotationAxis'> & {
  rotationAxis?: ('X' | 'Y' | 'Z')[] | 'y';
};

export type ParseGLTFBillboardsProps = {
  allowLegacyYAxis?: boolean;
  gltf: Pick<GLTFPostprocessed, 'nodes'>;
  scenes: readonly GroupNode[];
  gltfNodeIndexToNodeMap: ReadonlyMap<number, GroupNode>;
};

/** Resolve draft KHR_billboard attachments for the engine controller. */
export function parseGLTFBillboards(props: ParseGLTFBillboardsProps): BillboardControllerProps {
  const bindings: BillboardBinding[] = [];
  props.gltf.nodes.forEach((source, index) => {
    const definition = source.extensions?.['KHR_billboard'] as GLTFBillboardDefinition | undefined;
    if (!definition) return;
    const node = props.gltfNodeIndexToNodeMap.get(index);
    assert(node);
    // Lowercase y is a compatibility spelling accepted only for opted-in legacy assets.
    const axes = definition.rotationAxis || ['X', 'Y', 'Z'];
    assert(
      axes === 'y'
        ? props.allowLegacyYAxis === true
        : axes.length === 3 &&
            new Set(axes).size === 3 &&
            axes.every(axis => ['X', 'Y', 'Z'].includes(axis))
    );
    bindings.push({
      node,
      definition: {...definition, rotationAxis: definition.rotationAxis === 'y' ? 'y' : 'all'},
      matrixAuthored: Boolean(source.matrix)
    });
  });
  return {scenes: props.scenes, bindings};
}
