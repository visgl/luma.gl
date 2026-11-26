// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Color
} from 'three/webgpu';

export function createObjectScene() {
  const scene = new Scene();
  scene.background = new Color(0.04, 0.06, 0.08);
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4);
  const mesh = new Mesh(new BoxGeometry(1.2, 1.2, 1.2), new MeshBasicMaterial({color: 0xe05040}));
  mesh.name = 'adaptedMesh';
  mesh.position.set(-0.35, 0, 0.25);
  const nativeGeometry = new BufferGeometry();
  nativeGeometry.setAttribute(
    'position',
    new Float32BufferAttribute([-1.3, -0.9, 0, 1.3, -0.9, 0, 0.4, 1.2, 0], 3)
  );
  const nativeMesh = new Mesh(nativeGeometry, new MeshBasicMaterial({color: 0x40b0a0}));
  nativeMesh.name = 'nativeMesh';
  scene.add(mesh, nativeMesh);
  return {
    scene,
    camera,
    mesh,
    nativeMesh,
    update: (seconds: number) => {
      mesh.rotation.y = seconds * 0.4;
      nativeMesh.position.z = Math.sin(seconds) * 1.2;
    },
    dispose: () => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      nativeGeometry.dispose();
      nativeMesh.material.dispose();
    }
  };
}
