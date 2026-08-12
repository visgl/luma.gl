// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  makeSceneGraphRoots,
  SCENE_GRAPH_CAPACITY,
  SCENE_GRAPH_GROUPS,
  SCENE_GRAPH_OBJECTS_PER_GROUP
} from '../../examples/experimental/gpu-scene-graph/scene-graph-data';
import {
  getSceneGraphPickingShader,
  getSceneGraphVisibilityShader,
  SCENE_GRAPH_RENDER_SHADER
} from '../../examples/experimental/gpu-scene-graph/scene-graph-shaders';

describe('GPU scene graph application model', () => {
  test('preserves application hierarchy, stable object identity, and renderer-owned group windows', () => {
    const roots = makeSceneGraphRoots();
    const leaves = roots.flatMap(root => root.children ?? []);

    expect(roots.map(root => root.name)).toEqual(SCENE_GRAPH_GROUPS);
    expect(leaves).toHaveLength(SCENE_GRAPH_CAPACITY);
    expect(new Set(leaves.map(leaf => leaf.record!.id)).size).toBe(SCENE_GRAPH_CAPACITY);
    for (const [sceneIndex, leaf] of leaves.entries()) {
      expect(leaf.record!.id).toBe(10_000 + sceneIndex * 3);
      expect(leaf.record!.commandSlot).toBe(sceneIndex);
      expect(leaf.record!.groupId).toBe(Math.floor(sceneIndex / SCENE_GRAPH_OBJECTS_PER_GROUP));
    }
  });

  test('consumes only generic scene headers, bounds, active flags, and stable source rows', () => {
    const visibility = getSceneGraphVisibilityShader(144);
    const picking = getSceneGraphPickingShader(144);

    expect(SCENE_GRAPH_RENDER_SHADER).toContain('header.x == view.options.x');
    expect(visibility).toContain('sceneIndex >= 144u');
    expect(visibility).toContain('(header.y & 1u) != 0u');
    expect(visibility).toContain('(view.options.y & (1u << header.z)) != 0u');
    expect(picking).toContain('visibility[sceneIndex] == 0u');
    expect(picking).toContain('request.enabled == 0u');
    expect(picking).not.toContain('active: u32');
    expect(picking).toContain('atomicMin(&result, sceneIndex)');
  });
});
