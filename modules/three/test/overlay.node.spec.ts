// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Group,
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
  WebGLCoordinateSystem,
  WebGPUCoordinateSystem
} from 'three';
import {makeDeckViewportFromThreeCamera} from '../src/overlay';

for (const orthographic of [false, true]) {
  for (const coordinateSystem of [WebGLCoordinateSystem, WebGPUCoordinateSystem]) {
    for (const reversedDepth of [false, true]) {
      test(`Three camera snapshot (${orthographic}, ${coordinateSystem}, reversed=${reversedDepth})`, () => {
        const camera = orthographic
          ? new OrthographicCamera(-4, 4, 2, -2, 0.1, 100)
          : new PerspectiveCamera(53, 2, 0.1, 100);
        camera.coordinateSystem = coordinateSystem;
        Object.defineProperty(camera, 'reversedDepth', {value: reversedDepth});
        camera.zoom = 1.3;
        camera.setViewOffset(400, 200, 30, 10, 300, 160);
        camera.updateProjectionMatrix();
        const parent = new Group();
        parent.position.set(2, -1, 3);
        parent.rotation.set(0.1, 0.2, -0.1);
        parent.add(camera);
        camera.position.set(4, 3, 9);
        camera.lookAt(0, 0, 0);
        camera.updateWorldMatrix(true, false);
        const before = camera.toJSON();
        const viewport = makeDeckViewportFromThreeCamera(camera, 400, 200);
        expect(viewport.isGeospatial).toBe(false);
        for (const position of [
          [0, 0, 0],
          [1, -1, 2],
          [-1, 0.5, -2]
        ]) {
          const normalized = new Vector3(...position).project(camera);
          const projected = viewport.project(position);
          let depth = normalized.z;
          if (coordinateSystem === WebGPUCoordinateSystem || reversedDepth) depth = depth * 2 - 1;
          if (reversedDepth) depth = -depth;
          expect(projected[0]).toBeCloseTo((normalized.x + 1) * 200, 9);
          expect(projected[1]).toBeCloseTo((1 - normalized.y) * 100, 9);
          expect(projected[2]).toBeCloseTo(depth, 9);
          viewport
            .unproject(projected)
            .forEach((value, index) => expect(value).toBeCloseTo(position[index], 8));
        }
        expect(camera.toJSON()).toEqual(before);
        const previousMatrix = Array.from(viewport.viewProjectionMatrix);
        camera.position.x += 3;
        camera.updateWorldMatrix(true, false);
        expect(Array.from(viewport.viewProjectionMatrix)).toEqual(previousMatrix);
        expect(makeDeckViewportFromThreeCamera(camera, 400, 200).viewProjectionMatrix).not.toEqual(
          previousMatrix
        );
      });
    }
  }
}

test('pixel units are calibrated at the borrowed Three target without moving the camera', () => {
  const camera = new PerspectiveCamera(60, 2, 0.1, 100);
  camera.position.z = 10;
  camera.updateWorldMatrix(true, false);
  const target = new Vector3(0, 0, 0);
  const first = makeDeckViewportFromThreeCamera(camera, 400, 200, target);
  expect(first.focalDistance).toBe(10);
  expect(first.scale).toBeCloseTo((100 * camera.projectionMatrix.elements[5]) / 10, 10);
  target.z = -10;
  const second = makeDeckViewportFromThreeCamera(camera, 400, 200, target);
  expect(second.focalDistance).toBe(20);
  expect(second.scale).toBeCloseTo(first.scale / 2, 10);
  second
    .project([1, 2, 3])
    .forEach((value, index) => expect(value).toBeCloseTo(first.project([1, 2, 3])[index], 10));
  expect(camera.position.z).toBe(10);
  expect(target.z).toBe(-10);
});
