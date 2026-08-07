// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {RenderPass} from '@luma.gl/core';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test, vi} from 'vitest';

async function loadAnimatedLODFixture() {
  const source = await readFile(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));
  return postProcessGLTF(await parse(source, GLTFLoader, {gltf: {loadImages: false}}));
}

function makeLODView() {
  return {
    viewMatrix: new Matrix4(),
    projectionMatrix: new Matrix4().perspective({
      fovy: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 500
    }),
    viewportWidth: 512,
    viewportHeight: 512
  };
}

describe('portable independently animated glTF crowd LOD', () => {
  test('keeps authored alternatives dormant unless crowd LOD is explicitly configured', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {capacity: 2});

    try {
      expect(crowd.primitiveGroups).toHaveLength(1);
      expect(crowd.primitiveGroups[0]).toMatchObject({
        nodeIndex: 0,
        sourceNodeIndex: 0,
        lodLevel: 0,
        triangleCount: 8
      });
      expect(crowd.lodEnabled).toBe(false);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('densely packs independently posed actors into authored detail buckets and culls tiny actors', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const resourceCounts = device.statsManager.getStats('Resource Counts');
    const initialBuffers = resourceCounts.get('Buffers Active').count;
    const initialTextures = resourceCounts.get('Textures Active').count;
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 8,
      lod: {enabled: true, hysteresis: 0}
    });

    try {
      expect(crowd.primitiveGroups.map(group => group.lodLevel)).toEqual([0, 1, 2]);
      expect(crowd.primitiveGroups.map(group => group.sourceNodeIndex)).toEqual([0, 3, 4]);
      expect(crowd.primitiveGroups.map(group => group.triangleCount)).toEqual([8, 4, 2]);
      expect(crowd.primitiveGroups.every(group => group.nodeIndex === 0)).toBe(true);

      const [near, middle, far, culled] = crowd.addActors([
        {id: 'near', phase: 0, transform: new Matrix4().translate([0, 0, -1.5])},
        {id: 'middle', phase: 0.25, transform: new Matrix4().translate([0, 0, -4])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0, 0, -12])},
        {id: 'culled', phase: 0.75, transform: new Matrix4().translate([0, 0, -150])}
      ]);
      crowd.setLODView(makeLODView());

      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 1, 1]);
      expect(crowd.lodStats).toEqual({
        source: 'authored',
        visibleActors: 3,
        culledActors: 1,
        drawCount: 3,
        triangles: 14,
        vertices: 42,
        demotedActors: 0,
        budgetSatisfied: true,
        levels: [
          {level: 0, actors: 1, triangles: 8},
          {level: 1, actors: 1, triangles: 4},
          {level: 2, actors: 1, triangles: 2}
        ]
      });

      for (const [level, actor] of [near, middle, far].entries()) {
        const group = crowd.primitiveGroups[level];
        expect(Array.from(group.jointMatrices!.subarray(0, 32))).toEqual(
          Array.from(actor.skins.bindings[0].jointMatrices)
        );
        const matrixBytes = await group.transformBuffers[3].readAsync();
        const matrixColumn = new Float32Array(
          matrixBytes.buffer,
          matrixBytes.byteOffset,
          matrixBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
        );
        expect(matrixColumn[2]).toBeCloseTo([-1.5, -4, -12][level]);
      }
      expect(culled.skins.bindings).toHaveLength(1);

      const draws = crowd.models.map(model => vi.spyOn(model, 'draw').mockReturnValue(true));
      expect(crowd.draw({} as RenderPass)).toBe(3);
      expect(draws.every(draw => draw.mock.calls.length === 1)).toBe(true);
      draws.forEach(draw => draw.mockRestore());

      crowd.setLODEnabled(false);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([4, 0, 0]);
      expect(crowd.lodStats).toMatchObject({visibleActors: 4, culledActors: 0, drawCount: 1});
      expect(near.activeClip).toBe('Joint Bend');
      expect(crowd.getActor('middle')).toBe(middle);

      crowd.setLODEnabled(true);
      expect(crowd.lodStats.drawCount).toBe(3);
      crowd.removeActor('middle');
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 0, 1]);
      expect(crowd.lodStats).toMatchObject({visibleActors: 2, culledActors: 1, drawCount: 2});
    } finally {
      crowd.destroy();
      crowd.destroy();
      expect(resourceCounts.get('Buffers Active').count).toBe(initialBuffers);
      expect(resourceCounts.get('Textures Active').count).toBe(initialTextures);
      device.destroy();
    }
  });

  test('demotes the smallest visible actors first to satisfy a global indexed-vertex budget', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 3,
      lod: {enabled: true, hysteresis: 0, vertexBudget: 48}
    });

    try {
      const radius = crowd.scenegraphs.modelBounds.radius;
      const [near, middle, far] = crowd.addActors([
        {id: 'near', phase: 0, transform: new Matrix4().translate([0, 0, -radius / 0.9])},
        {id: 'middle', phase: 0.25, transform: new Matrix4().translate([0, 0, -radius / 0.75])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0, 0, -radius / 0.6])}
      ]);
      crowd.setLODView(makeLODView());

      expect(crowd.primitiveGroups.map(group => group.vertexCount)).toEqual([24, 12, 6]);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 1, 1]);
      expect(crowd.lodStats).toMatchObject({
        visibleActors: 3,
        culledActors: 0,
        vertices: 42,
        vertexBudget: 48,
        demotedActors: 2,
        budgetSatisfied: true
      });
      for (const [level, actor] of [near, middle, far].entries()) {
        expect(Array.from(crowd.primitiveGroups[level].jointMatrices!.subarray(0, 32))).toEqual(
          Array.from(actor.skins.bindings[0].jointMatrices)
        );
      }

      crowd.setLODVertexBudget(17);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([0, 0, 3]);
      expect(crowd.lodStats).toMatchObject({
        visibleActors: 3,
        culledActors: 0,
        vertices: 18,
        vertexBudget: 17,
        demotedActors: 3,
        budgetSatisfied: false
      });
      expect(crowd.getActor('far')).toBe(far);

      crowd.setLODVertexBudget(0);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([3, 0, 0]);
      expect(crowd.lodStats).toMatchObject({vertices: 72, demotedActors: 0, budgetSatisfied: true});
      expect(crowd.lodStats.vertexBudget).toBeUndefined();

      crowd.setLODVertexBudget(12).setLODEnabled(false);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([3, 0, 0]);
      expect(crowd.lodStats).toMatchObject({
        visibleActors: 3,
        vertices: 72,
        vertexBudget: 12,
        demotedActors: 0,
        budgetSatisfied: true
      });
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('breaks equal screen-coverage budget ties in stable actor insertion order', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 2,
      lod: {enabled: true, hysteresis: 0, vertexBudget: 36}
    });

    try {
      const radius = crowd.scenegraphs.modelBounds.radius;
      const transform = new Matrix4().translate([0, 0, -radius / 0.75]);
      const [first, second] = crowd.addActors([
        {id: 'first', phase: 0.25, transform},
        {id: 'second', phase: 0.5, transform}
      ]);
      crowd.setLODView(makeLODView());

      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 1, 0]);
      expect(crowd.lodStats).toMatchObject({vertices: 36, demotedActors: 1, budgetSatisfied: true});
      expect(Array.from(crowd.primitiveGroups[0].jointMatrices!.subarray(0, 32))).toEqual(
        Array.from(second.skins.bindings[0].jointMatrices)
      );
      expect(Array.from(crowd.primitiveGroups[1].jointMatrices!.subarray(0, 32))).toEqual(
        Array.from(first.skins.bindings[0].jointMatrices)
      );
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('keeps the nearer actor detailed and never culls when the vertex budget is impossible', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 2,
      lod: {enabled: true, hysteresis: 0, vertexBudget: 36}
    });

    try {
      const radius = crowd.scenegraphs.modelBounds.radius;
      const [near, far] = crowd.addActors([
        {id: 'near', phase: 0.25, transform: new Matrix4().translate([0, 0, -radius / 0.9])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0, 0, -radius / 0.6])}
      ]);
      crowd.setLODView(makeLODView());

      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 1, 0]);
      expect(crowd.lodStats).toMatchObject({vertices: 36, demotedActors: 1, budgetSatisfied: true});
      expect(Array.from(crowd.primitiveGroups[0].jointMatrices!.subarray(0, 32))).toEqual(
        Array.from(near.skins.bindings[0].jointMatrices)
      );
      expect(Array.from(crowd.primitiveGroups[1].jointMatrices!.subarray(0, 32))).toEqual(
        Array.from(far.skins.bindings[0].jointMatrices)
      );

      crowd.setLODVertexBudget(5);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([0, 0, 2]);
      expect(crowd.lodStats).toMatchObject({
        visibleActors: 2,
        culledActors: 0,
        vertices: 12,
        vertexBudget: 5,
        demotedActors: 2,
        budgetSatisfied: false
      });

      crowd.setLODVertexBudget(0);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([2, 0, 0]);
      expect(crowd.lodStats).toMatchObject({vertices: 48, demotedActors: 0, budgetSatisfied: true});
      expect(crowd.lodStats.vertexBudget).toBeUndefined();
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('generates lower-detail skinned levels without mutating the source asset or its accessors', async () => {
    const gltf = await loadAnimatedLODFixture();
    delete gltf.nodes[0].extensions;
    delete gltf.nodes[0].extras;
    const originalNodeCount = gltf.nodes.length;
    const originalMeshCount = gltf.meshes.length;
    const originalIndices = Array.from(gltf.nodes[0].mesh!.primitives[0].indices!.value);
    const originalPositions = gltf.nodes[0].mesh!.primitives[0].attributes['POSITION'].value;
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 3,
      lod: {enabled: false, autoGenerate: true, ratios: [0.5, 0.25], hysteresis: 0}
    });

    try {
      expect(crowd.gltf).not.toBe(gltf);
      expect(crowd.lodStats.source).toBe('generated');
      expect(gltf.nodes).toHaveLength(originalNodeCount);
      expect(gltf.meshes).toHaveLength(originalMeshCount);
      expect(gltf.nodes[0].extensions).toBeUndefined();
      expect(Array.from(gltf.nodes[0].mesh!.primitives[0].indices!.value)).toEqual(originalIndices);
      expect(crowd.gltf.nodes[0].mesh!.primitives[0].attributes['POSITION'].value).toBe(
        originalPositions
      );
      expect(crowd.primitiveGroups.map(group => group.lodLevel)).toEqual([0, 1, 2]);
      const generatedTriangleCounts = crowd.primitiveGroups.map(group => group.triangleCount);
      expect(generatedTriangleCounts[0]).toBe(8);
      expect(generatedTriangleCounts[1]).toBeLessThan(generatedTriangleCounts[0]);
      expect(generatedTriangleCounts[2]).toBeLessThan(generatedTriangleCounts[1]);

      crowd.addActors([
        {id: 'near', phase: 0, transform: new Matrix4().translate([0, 0, -1.5])},
        {id: 'middle', phase: 0.25, transform: new Matrix4().translate([0, 0, -4])},
        {id: 'far', phase: 0.5, transform: new Matrix4().translate([0, 0, -12])}
      ]);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([3, 0, 0]);

      crowd.setLODView(makeLODView()).setLODEnabled(true);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([1, 1, 1]);
      expect(crowd.lodStats).toMatchObject({
        source: 'generated',
        visibleActors: 3,
        drawCount: 3,
        triangles: generatedTriangleCounts.reduce((total, count) => total + count, 0)
      });
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('reports no generated source when simplification cannot add any levels', async () => {
    const gltf = await loadAnimatedLODFixture();
    delete gltf.nodes[0].extensions;
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 1,
      lod: {enabled: true, autoGenerate: true, ratios: []}
    });

    try {
      expect(crowd.gltf).toBe(gltf);
      expect(crowd.primitiveGroups).toHaveLength(1);
      expect(crowd.lodStats.source).toBe('none');
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('forwards explicit mesh-boundary preservation to generated crowd levels', async () => {
    const gltf = await loadAnimatedLODFixture();
    delete gltf.nodes[0].extensions;
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 1,
      lod: {enabled: true, autoGenerate: true, ratios: [0.5, 0.25], preserveBoundary: true}
    });

    try {
      expect(crowd.lodStats.source).toBe('generated');
      expect(crowd.primitiveGroups.map(group => group.triangleCount)).toEqual([8, 4, 2]);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('evaluates animation and camera LOD together with exactly one shared buffer upload', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 2,
      lod: {enabled: true, hysteresis: 0, vertexBudget: 6}
    });

    try {
      const actor = crowd.addActor({
        id: 'single-pass',
        phase: 0.25,
        transform: new Matrix4().translate([0, 0, -4])
      });
      const startingTime = actor.time;
      const refresh = vi.spyOn(crowd, 'refresh');
      const upload = vi.spyOn(crowd.primitiveGroups[2].transformBuffers[0], 'write');

      crowd.update(0.1, makeLODView());

      expect(refresh).toHaveBeenCalledOnce();
      expect(upload).toHaveBeenCalledOnce();
      expect(actor.time).toBeGreaterThan(startingTime);
      expect(crowd.primitiveGroups.map(group => group.model.instanceCount)).toEqual([0, 0, 1]);
      expect(crowd.lodStats).toMatchObject({vertices: 6, demotedActors: 1, budgetSatisfied: true});
      refresh.mockRestore();
      upload.mockRestore();
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });

  test('applies hysteresis and detail bias without recreating actor state or GPU models', async () => {
    const gltf = await loadAnimatedLODFixture();
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {
      capacity: 2,
      lod: {enabled: true, hysteresis: 0.2}
    });

    try {
      crowd.setLODView(makeLODView());
      const radius = crowd.scenegraphs.modelBounds.radius;
      const actor = crowd.addActor({
        id: 'boundary',
        phase: 0.25,
        transform: new Matrix4().translate([0, 0, -radius / 0.6])
      });
      const originalModels = [...crowd.models];
      expect(crowd.lodStats.levels.map(level => level.level)).toEqual([0]);

      actor.setTransform(new Matrix4().translate([0, 0, -radius / 0.45]));
      expect(crowd.lodStats.levels.map(level => level.level)).toEqual([0]);

      actor.setTransform(new Matrix4().translate([0, 0, -radius / 0.35]));
      expect(crowd.lodStats.levels.map(level => level.level)).toEqual([1]);

      actor.setTransform(new Matrix4().translate([0, 0, -radius / 0.55]));
      expect(crowd.lodStats.levels.map(level => level.level)).toEqual([1]);

      crowd.setLODBias(2);
      expect(crowd.lodStats.levels.map(level => level.level)).toEqual([0]);
      expect(crowd.models).toEqual(originalModels);
      expect(crowd.getActor('boundary')).toBe(actor);
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });
});
