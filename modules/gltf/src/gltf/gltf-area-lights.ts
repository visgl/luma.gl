// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  type AreaLightControllerProps,
  type AreaLightDefinition,
  type AreaLightBinding,
  type GroupNode
} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';
import {assert} from '@luma.gl/core';

export type ParseGLTFAreaLightsProps = {
  gltf: GLTFPostprocessed;
  scenes: readonly GroupNode[];
  gltfNodeIndexToNodeMap: ReadonlyMap<number, GroupNode>;
};

/** Resolve EXT_lights_area definitions for the format-independent runtime. */
export function parseGLTFAreaLights({
  gltf,
  scenes,
  gltfNodeIndexToNodeMap
}: ParseGLTFAreaLightsProps): AreaLightControllerProps {
  const lights = gltf.extensions?.['EXT_lights_area']?.['lights'] as
    | (Omit<AreaLightDefinition, 'width' | 'height'> & {size?: number; rect?: {aspect?: number}})[]
    | undefined;
  const bindings: AreaLightBinding[] = [];
  gltf.nodes.forEach((source, index) => {
    const node = gltfNodeIndexToNodeMap.get(index);
    const lightIndex = source.extensions?.['EXT_lights_area']?.['light'];
    if (!node || lightIndex === undefined) return;
    const definition = lights?.[lightIndex];
    // Referenced area-light definitions must exist.
    assert(definition);
    bindings.push({
      node,
      definition: {
        type: definition.type,
        color: definition.color,
        intensity: definition.intensity,
        height: definition.size ?? 1,
        width:
          (definition.size ?? 1) * (definition.type === 'rect' ? (definition.rect?.aspect ?? 1) : 1)
      },
      matrixAuthored: Boolean(source.matrix)
    });
  });
  const matrixNodes = gltf.nodes.flatMap((source, index) => {
    const node = gltfNodeIndexToNodeMap.get(index);
    return source.matrix && node ? [node] : [];
  });
  return {scenes, bindings, matrixNodes};
}
