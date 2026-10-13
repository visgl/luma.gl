// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {ThreeMeshLayer} from '@luma.gl/three/deck';
import {
  BoxGeometry,
  CircleGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene
} from 'three/webgpu';

export function createDeckScene() {
  const scene = new Scene();
  scene.background = new Color(0, 0, 0);
  const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
  const mesh = new Mesh(new BoxGeometry(1.2, 1.2, 1.2), new MeshBasicMaterial({color: 0xe05040}));
  mesh.position.set(-0.3, 0, 0.25);
  const circle = new Mesh(
    new CircleGeometry(0.9, 1024),
    new MeshBasicMaterial({color: 0x40b0a0, side: DoubleSide})
  );
  circle.position.x = 0.4;
  scene.add(mesh, circle);
  return {
    scene,
    camera,
    mesh,
    circle,
    update(seconds: number) {
      mesh.rotation.y = seconds * 0.4;
      circle.position.z = Math.sin(seconds) * 1.2;
    },
    dispose() {
      mesh.geometry.dispose();
      mesh.material.dispose();
      circle.geometry.dispose();
      circle.material.dispose();
    }
  };
}

export function createDeckLayers(scene: ReturnType<typeof createDeckScene>, reverseOrder = false) {
  const meshes = new ThreeMeshLayer({id: 'three-meshes', meshes: [scene.mesh]});
  const disks = new ScatterplotLayer({
    id: 'deck-disks',
    data: [scene.circle.position.toArray()],
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: position => position,
    getRadius: 0.9,
    radiusUnits: 'common',
    getFillColor: [64, 176, 160, 255],
    antialiasing: false,
    billboard: false,
    stroked: false,
    parameters: {depthWriteEnabled: true, depthCompare: 'less-equal'},
    getPolygonOffset: () => [0, 0]
  });
  return reverseOrder ? [disks, meshes] : [meshes, disks];
}
