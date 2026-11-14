// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {Geometry} from '@luma.gl/engine';
import {postProcessGLTF} from '@luma.gl/engine/gltf';
import {createLightmapAtlas, validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {CORNELL_BAKE_PROFILES, type CornellBakeRecipe} from './cornell-bake-file';
import {Matrix4, Quaternion, Vector3} from '@math.gl/core';

type CornellGLTF = ReturnType<typeof postProcessGLTF>;
type CornellNode = CornellGLTF['nodes'][number];

export async function parseCornellScene(bytes: ArrayBuffer) {
  const [loaded, digest] = await Promise.all([
    parse(bytes, GLTFLoader, {gltf: {loadImages: false}}),
    crypto.subtle.digest('SHA-256', bytes)
  ]);
  const assetHash = [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  const gltf = postProcessGLTF(loaded);
  const placements: {id: string; geometry: Geometry}[] = [];
  const nodeIndices = new Map(gltf.nodes.map((node, index) => [node, index]));
  function visit(node: CornellNode, parent: Matrix4): void {
    const local = node.matrix
      ? new Matrix4(node.matrix)
      : new Matrix4()
          .translate(node.translation ?? [0, 0, 0])
          .multiplyRight(
            new Matrix4().fromQuaternion(new Quaternion(node.rotation ?? [0, 0, 0, 1]))
          )
          .scale(node.scale ?? [1, 1, 1]);
    const world = new Matrix4(parent).multiplyRight(local);
    const normalMatrix = new Matrix4(world).invert().transpose();
    // Keep only the linear part so transforming a normal cannot divide by a
    // homogeneous coordinate derived from the node's translation.
    normalMatrix[3] = 0;
    normalMatrix[7] = 0;
    normalMatrix[11] = 0;
    for (const [index, primitive] of (node.mesh?.primitives ?? []).entries()) {
      // This fixture is static and uses opaque, factor-only materials.
      const {POSITION, NORMAL, TEXCOORD_0} = primitive.attributes;
      const positions = POSITION.value;
      const normals = NORMAL.value;
      const coordinates = TEXCOORD_0.value;
      const indices = primitive.indices?.value;
      if (
        !(positions instanceof Float32Array) ||
        !(normals instanceof Float32Array) ||
        !(coordinates instanceof Float32Array) ||
        !(indices instanceof Uint16Array || indices instanceof Uint32Array)
      )
        throw new Error('Unexpected Cornell Box vertex layout.');
      const color = primitive.material?.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1];
      const worldPositions = new Float32Array(positions.length);
      const worldNormals = new Float32Array(normals.length);
      const colors = new Float32Array((positions.length / 3) * 4);
      for (let offset = 0; offset < positions.length; offset += 3) {
        worldPositions.set(world.transformAsPoint(positions.slice(offset, offset + 3)), offset);
        worldNormals.set(
          new Vector3(
            normalMatrix.transformAsVector(normals.slice(offset, offset + 3))
          ).normalize(),
          offset
        );
        colors.set(color, (offset / 3) * 4);
      }
      placements.push({
        id: `node/${nodeIndices.get(node)}/primitive/${index}`,
        geometry: new Geometry({
          topology: 'triangle-list',
          indices,
          attributes: {
            POSITION: {size: 3, value: worldPositions},
            NORMAL: {size: 3, value: worldNormals},
            TEXCOORD_0: {size: 2, value: coordinates},
            COLOR_0: {size: 4, value: colors}
          }
        })
      });
    }
    for (const child of node.children ?? []) visit(child, world);
  }
  const roots = (gltf.scene ?? gltf.scenes[0])?.nodes;
  if (!roots?.length) throw new Error('The Cornell Box asset does not contain a scene.');
  for (const root of roots) visit(root, new Matrix4());
  return {assetHash, placements};
}

export type CornellScene = Awaited<ReturnType<typeof parseCornellScene>>;

/** Pack each placement independently, then batch compatible fixture geometry for drawing. */
export function prepareCornellAtlas(
  scene: CornellScene,
  profile: keyof typeof CORNELL_BAKE_PROFILES
) {
  const atlas = createLightmapAtlas(scene.placements, CORNELL_BAKE_PROFILES[profile]);
  const problems = validateLightmapAtlas(atlas);
  if (problems.length) throw new Error(problems.join('; '));
  const vertexCount = atlas.meshes.reduce((count, mesh) => count + mesh.geometry.vertexCount, 0);
  const attributes = Object.fromEntries(
    Object.entries(atlas.meshes[0].geometry.attributes).map(([name, attribute]) => {
      const value = new Float32Array(vertexCount * attribute.size!);
      let offset = 0;
      for (const mesh of atlas.meshes) {
        const source = mesh.geometry.attributes[name].value;
        value.set(source, offset);
        offset += source.length;
      }
      return [name, {size: attribute.size, value}];
    })
  );
  const offsets = new Map<string, number>();
  let vertexOffset = 0;
  for (const mesh of atlas.meshes) {
    offsets.set(mesh.id, vertexOffset);
    vertexOffset += mesh.geometry.vertexCount;
  }
  const geometry = new Geometry({topology: 'triangle-list', attributes});
  const recipe: CornellBakeRecipe = {
    assetHash: scene.assetHash,
    layoutVersion: 1,
    width: atlas.width,
    height: atlas.height,
    texelsPerUnit: atlas.texelsPerUnit,
    padding: atlas.padding,
    uvSet: 1,
    placements: atlas.meshes.map(mesh => mesh.id)
  };
  return {
    geometry,
    recipe,
    atlas,
    drawCharts: atlas.charts.map(chart => ({
      ...chart,
      firstVertex: chart.firstVertex + offsets.get(chart.meshId)!
    }))
  };
}

export async function loadCornellScene(): Promise<CornellScene> {
  const response = await fetch(new URL('./cornell-box.gltf', import.meta.url));
  if (!response.ok) throw new Error('Could not load the Cornell Box asset.');
  return parseCornellScene(await response.arrayBuffer());
}
