// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSceneRecord} from '@luma.gl/gpgpu/gpu-core';

export const SCENE_GRAPH_GROUPS = ['terrain', 'structures', 'signals'] as const;
export const SCENE_GRAPH_OBJECTS_PER_GROUP = 48;
export const SCENE_GRAPH_CAPACITY = SCENE_GRAPH_GROUPS.length * SCENE_GRAPH_OBJECTS_PER_GROUP;

/** The application hierarchy intentionally remains outside the flat GPUScene record contract. */
export type SceneGraphNode = {
  name: string;
  children?: SceneGraphNode[];
  record?: GPUSceneRecord;
};

/** Makes stable renderer-group branches whose leaf IDs differ from their physical scene slots. */
export function makeSceneGraphRoots(): SceneGraphNode[] {
  return SCENE_GRAPH_GROUPS.map((group, groupIndex) => ({
    name: group,
    children: Array.from({length: SCENE_GRAPH_OBJECTS_PER_GROUP}, (_, localIndex) => {
      const sceneIndex = groupIndex * SCENE_GRAPH_OBJECTS_PER_GROUP + localIndex;
      const column = localIndex % 12;
      const row = groupIndex * 4 + Math.floor(localIndex / 12);
      const centerX = -0.92 + column * 0.165;
      const centerY = -0.91 + row * 0.164;
      const halfWidth = 0.046 + ((sceneIndex * 7) % 5) * 0.005;
      const halfHeight = 0.046 + ((sceneIndex * 11) % 4) * 0.006;
      return {
        name: `${group}-${localIndex}`,
        record: {
          id: 10_000 + sceneIndex * 3,
          groupId: groupIndex,
          geometryId: 0,
          commandSlot: sceneIndex,
          bounds: {
            minimum: [centerX - halfWidth, centerY - halfHeight, 0],
            maximum: [centerX + halfWidth, centerY + halfHeight, 1]
          }
        }
      };
    })
  }));
}
