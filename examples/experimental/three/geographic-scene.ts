// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PolygonLayer} from '@deck.gl/layers';
import {ThreeSceneLayer} from '@luma.gl/three/deck';
import type {ThreeSceneAdapter} from '@luma.gl/three/objects';
import {
  BoxGeometry,
  Box3,
  Color,
  CanvasTexture,
  SRGBColorSpace,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Renderer
} from 'three/webgpu';
import {createDeckLanternScene} from './deck-lantern-scene';

export const GEOGRAPHIC_ORIGIN: [number, number, number] = [-122.4194, 37.7749, 0];
export const GEOGRAPHIC_OBJECTS = [
  {id: 'lantern-west', position: [-16, 0, 0], heading: -25, scale: 4},
  {id: 'lantern-center', position: [0, 0, 2], heading: 0, scale: 4},
  {id: 'lantern-east', position: [16, 0, 0], heading: 35, scale: 3}
];
const buildings = [
  {id: 'west-building', position: [-16, 10, 0], width: 12, depth: 8, height: 9},
  {id: 'east-building', position: [16, -9, 0], width: 12, depth: 8, height: 7}
];

export async function createGeographicScene(renderer: Renderer) {
  const fixture = await createDeckLanternScene(renderer);
  const content = fixture.scene.children.find(object => object instanceof Group)!;
  const source = content.children.find(object => object instanceof Group)!;
  content.remove(source);
  fixture.ground.visible = false;
  // Mapped nameplates preserve the Lantern asset's original PBR maps and UVs.
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 128;
  const labelContext = labelCanvas.getContext('2d')!;
  labelContext.fillStyle = '#f5f0da';
  labelContext.fillRect(0, 0, 512, 128);
  labelContext.fillStyle = '#12313d';
  labelContext.font = 'bold 86px sans-serif';
  labelContext.textAlign = 'center';
  labelContext.textBaseline = 'middle';
  labelContext.fillText('THREE.js', 256, 68);
  const labelTexture = new CanvasTexture(labelCanvas);
  labelTexture.colorSpace = SRGBColorSpace;
  const labelGeometry = new BoxGeometry(2.4, 0.6, 0.6);
  const models = GEOGRAPHIC_OBJECTS.map(object => {
    const root = new Group();
    const model = source.clone(true);
    model.traverse(child => {
      if (child instanceof Mesh) {
        child.material = Array.isArray(child.material)
          ? child.material.map(material => material.clone())
          : child.material.clone();
      }
    });
    // Normalize the actual cloned bounds, including any source/pedestal offsets.
    model.position.y -= new Box3().setFromObject(model).min.y;
    // Lantern source is Y-up; geographic placement is east/north/up.
    root.add(model);
    const label = new Mesh(
      labelGeometry,
      new MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.65,
        metalness: 0
      })
    );
    label.position.set(0, 0.4, 0);
    root.add(label);
    root.rotation.x = Math.PI / 2;
    // Apply heading about the geographic up axis through an outer placement group.
    const placement = new Group();
    placement.add(root);
    placement.rotation.z = (object.heading * Math.PI) / 180;
    placement.position.set(object.position[0], object.position[1], object.position[2]);
    placement.scale.setScalar(object.scale);
    placement.userData['geographicId'] = object.id;
    fixture.scene.add(placement);
    return placement;
  });
  const referenceContext = new Group();
  const ground = new Mesh(new BoxGeometry(70, 50, 0.1), new MeshBasicMaterial({color: 0x233540}));
  ground.position.z = -0.05;
  ground.name = 'ground';
  referenceContext.add(ground);
  for (const building of buildings) {
    const mesh = new Mesh(
      new BoxGeometry(building.width, building.depth, building.height),
      new MeshBasicMaterial({color: 0x426375})
    );
    mesh.position.set(building.position[0], building.position[1], building.height / 2);
    mesh.name = building.id;
    referenceContext.add(mesh);
  }
  const emissiveColors = new Map<MeshStandardMaterial, Color>();
  for (const model of models)
    model.traverse(child => {
      if (child instanceof Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials)
          if (material instanceof MeshStandardMaterial)
            emissiveColors.set(material, material.emissive.clone());
      }
    });
  let disposed = false;
  let selectedId: string | undefined;
  function select(id?: string) {
    selectedId = id;
    referenceContext.traverse(child => {
      if (child instanceof Mesh && child.material instanceof MeshBasicMaterial)
        child.material.color.setHex(
          child.name === id ? 0xa38c39 : child.name === 'ground' ? 0x233540 : 0x426375
        );
    });
    models.forEach(model =>
      model.traverse(child => {
        if (child instanceof Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const material of materials)
            if (material instanceof MeshStandardMaterial) {
              material.emissive.copy(emissiveColors.get(material)!);
              if (model.userData['geographicId'] === id) material.emissive.add(new Color(0x695200));
            }
        }
      })
    );
  }
  return {
    ...fixture,
    models,
    referenceContext,
    get selectedId() {
      return selectedId;
    },
    select,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const model of models)
        model.traverse(child => {
          if (child instanceof Mesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => material.dispose());
          }
        });
      referenceContext.traverse(child => {
        if (child instanceof Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      labelTexture.dispose();
      labelGeometry.dispose();
      fixture.dispose();
    }
  };
}

export function createGeographicLayers(
  fixture: Awaited<ReturnType<typeof createGeographicScene>>,
  adapter: ThreeSceneAdapter,
  reverseOrder = false
) {
  const scene = new ThreeSceneLayer({
    id: 'geographic-lanterns',
    scene: fixture.scene,
    camera: fixture.camera,
    adapter,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 190, 70, 110],
    pickingObjects: fixture.models.map(model => ({
      id: String(model.userData['geographicId']),
      object: model
    })),
    coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
    coordinateOrigin: GEOGRAPHIC_ORIGIN
  });
  const context = new PolygonLayer({
    id: 'geographic-buildings',
    data: [{id: 'ground', position: [0, 0, -0.1], width: 70, depth: 50, height: 0.1}, ...buildings],
    coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
    coordinateOrigin: GEOGRAPHIC_ORIGIN,
    getPolygon: building => [
      [
        building.position[0] - building.width / 2,
        building.position[1] - building.depth / 2,
        building.position[2]
      ],
      [
        building.position[0] + building.width / 2,
        building.position[1] - building.depth / 2,
        building.position[2]
      ],
      [
        building.position[0] + building.width / 2,
        building.position[1] + building.depth / 2,
        building.position[2]
      ],
      [
        building.position[0] - building.width / 2,
        building.position[1] + building.depth / 2,
        building.position[2]
      ]
    ],
    getElevation: building => building.height,
    getFillColor: building =>
      fixture.selectedId === building.id
        ? [163, 140, 57, 255]
        : building.id === 'ground'
          ? [35, 53, 64, 255]
          : [66, 99, 117, 255],
    updateTriggers: {getFillColor: fixture.selectedId},
    material: {ambient: 1, diffuse: 0, shininess: 0, specularColor: [0, 0, 0]},
    extruded: true,
    stroked: false,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 190, 70, 110],
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'},
    getPolygonOffset: () => [0, 0]
  });
  return reverseOrder ? [context, scene] : [scene, context];
}
