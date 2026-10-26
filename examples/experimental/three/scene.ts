// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Scene,
  PerspectiveCamera,
  Mesh,
  BoxGeometry,
  MeshBasicNodeMaterial,
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
  LinearFilter,
  StorageBufferAttribute,
  Color
} from 'three/webgpu';
import {
  texture,
  uniform,
  positionLocal,
  vec3,
  sin,
  Fn,
  storage,
  instanceIndex,
  float
} from 'three/tsl';

/** Shared deterministic scene used by the example and parity tests. */
export function createScene() {
  const scene = new Scene();
  scene.background = new Color(0.04, 0.06, 0.08);
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 4;
  const image = new DataTexture(
    new Uint8Array([255, 80, 40, 255, 40, 180, 255, 255, 40, 180, 255, 255, 255, 80, 40, 255]),
    2,
    2,
    RGBAFormat,
    UnsignedByteType
  );
  image.generateMipmaps = false;
  image.minFilter = LinearFilter;
  image.magFilter = LinearFilter;
  image.needsUpdate = true;
  const phase = uniform(0);
  const material = new MeshBasicNodeMaterial();
  material.colorNode = texture(image).rgb.mul(phase.sin().mul(0.25).add(0.75));
  material.positionNode = positionLocal.add(
    vec3(0, sin(positionLocal.x.mul(3).add(phase)).mul(0.15), 0)
  );
  const geometry = new BoxGeometry(1.5, 1.5, 1.5, 8, 8, 8);
  const mesh = new Mesh(geometry, material);
  mesh.rotation.set(0.3, 0.5, 0);
  scene.add(mesh);
  const attribute = new StorageBufferAttribute(new Float32Array(16), 1);
  const values = storage(attribute, 'float', 16);
  const compute = Fn(() => {
    values.element(instanceIndex).assign(float(instanceIndex).mul(2).add(1));
  })().compute(16);
  return {
    scene,
    camera,
    phase,
    attribute,
    compute,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      image.dispose();
      compute.dispose();
    }
  };
}
