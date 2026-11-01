// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {BillboardController} from '@luma.gl/engine';
import {
  parseGLTFBillboards,
  type GLTFBillboardDefinition,
  type GLTFPostprocessed
} from '@luma.gl/engine/gltf';
import {describe, expect, test} from 'vitest';
import {GroupNode, ScenegraphNode} from '@luma.gl/engine';
import {Matrix4, Vector3} from '@math.gl/core';

function makeController(definition: GLTFBillboardDefinition = {}, allowLegacyYAxis = false) {
  const leaf = new ScenegraphNode();
  const billboard = new GroupNode({children: [leaf], scale: [2, 3, 4]});
  const parent = new GroupNode({
    children: [billboard],
    position: [1, 0, 0],
    rotation: [0, Math.PI / 2, 0],
    scale: [5, 5, 5]
  });
  const scene = new GroupNode([parent]);
  const gltf = {nodes: [{extensions: {KHR_billboard: definition}}]} as unknown as GLTFPostprocessed;
  const controller = new BillboardController(
    parseGLTFBillboards({
      gltf,
      allowLegacyYAxis,
      scenes: [scene],
      gltfNodeIndexToNodeMap: new Map([[0, billboard]])
    })
  );
  return {controller, scene, parent, billboard, leaf};
}

function view(eye = [1, 0, 10]): Matrix4 {
  return new Matrix4().lookAt({eye, center: [1, 0, 0], up: [0, 1, 0]});
}

describe('KHR_billboard full-axis profile', () => {
  test('discards parent rotation and scale while preserving translation and local scale', () => {
    const {controller, billboard} = makeController();
    const original = [...billboard.matrix];
    const entry = controller.getDrawEntries({viewMatrix: view()})[0];
    expect(entry.modelMatrix.getTranslation()).toEqual([1, 0, 0]);
    expect(entry.modelMatrix.getScale()).toEqual([2, 3, 4]);
    expect(new Vector3(0, 0, 1).transformAsVector(entry.modelMatrix).normalize()).toEqual(
      new Vector3(0, 0, 1)
    );
    controller.getDrawEntries({viewMatrix: view([11, 0, 0])});
    expect([...billboard.matrix]).toEqual(original);
  });

  test('respects nonstandard forward/up vectors and camera roll', () => {
    const {controller} = makeController({viewDirection: [1, 0, 0], up: [0, 1, 0]});
    const entry = controller.getDrawEntries({viewMatrix: view()})[0];
    const direction = new Vector3(1, 0, 0).transformAsVector(entry.modelMatrix).normalize();
    expect(direction[2]).toBeCloseTo(1);
    const rolledView = new Matrix4(view()).rotateZ(Math.PI / 2);
    const rolled = controller.getDrawEntries({viewMatrix: rolledView})[0];
    expect(
      Math.abs(new Vector3(0, 1, 0).transformAsVector(rolled.modelMatrix).normalize()[0])
    ).toBeCloseTo(1);
  });

  test('tracks independent camera reference depths and clears removed billboards', () => {
    const {controller, scene, parent} = makeController({scaleWithDistance: true});
    expect(
      controller.getDrawEntries({viewMatrix: view()})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(2);
    expect(
      controller.getDrawEntries({viewMatrix: view([1, 0, 20])})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(4);
    expect(
      controller
        .getDrawEntries({viewMatrix: view([1, 0, 20]), cameraId: 'second'})[0]
        .modelMatrix.getScale()[0]
    ).toBeCloseTo(2);
    scene.remove(parent);
    expect(controller.getDrawEntries({viewMatrix: view()})).toEqual([]);
    scene.add(parent);
    expect(
      controller.getDrawEntries({viewMatrix: view([1, 0, 20])})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(2);
  });

  test('children inherit final transforms and overlays follow ordinary leaves', () => {
    const {controller, scene, leaf} = makeController({overlay: true});
    leaf.setMatrix(new Matrix4().translate([0, 1, 0]));
    const ordinary = new ScenegraphNode();
    scene.add(ordinary);
    const entries = controller.getDrawEntries({viewMatrix: view()});
    expect(entries[0].node).toBe(ordinary);
    expect(entries[1].node).toBe(leaf);
    expect(entries[1].overlay).toBe(true);
    expect(entries[1].modelMatrix.getTranslation()[1]).toBeCloseTo(3);
  });

  test('accepts the source demo legacy y axis only through explicit opt-in', () => {
    expect(() => makeController({rotationAxis: 'y'})).toThrow();
    const {controller} = makeController({rotationAxis: 'y'}, true);
    const entry = controller.getDrawEntries({viewMatrix: view([11, 10, 10])})[0];
    const up = new Vector3(0, 1, 0).transformAsVector(entry.modelMatrix).normalize();
    expect(up[1]).toBeCloseTo(1);
    expect(up[0]).toBeCloseTo(0);
    expect(up[2]).toBeCloseTo(0);
  });

  test('captures a usable depth after the eye plane and preserves winding across it', () => {
    const {controller} = makeController({scaleWithDistance: true});
    const eyePlane = new Matrix4().translate([-1, 0, 0]);
    expect(
      controller.getDrawEntries({viewMatrix: eyePlane})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(2);
    expect(
      controller.getDrawEntries({viewMatrix: view()})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(2);
    expect(
      controller.getDrawEntries({viewMatrix: view([1, 0, 20])})[0].modelMatrix.getScale()[0]
    ).toBeCloseTo(4);
    controller.resetCamera();
    controller.getDrawEntries({viewMatrix: new Matrix4().translate([-1, 0, 10])});
    const visible = controller.getDrawEntries({viewMatrix: view([1, 0, 20])})[0].modelMatrix;
    expect(visible.determinant()).toBeGreaterThan(0);
    expect(visible.getScale()[0]).toBeCloseTo(4);
  });

  test('retains a finite facing basis when flattening makes authored axes parallel', () => {
    const {controller, billboard} = makeController({
      viewDirection: [1, 0, 1],
      up: [1, 0, -1]
    });
    billboard.scale = new Vector3(1, 1, 0);
    const entry = controller.getDrawEntries({viewMatrix: view()})[0];
    expect([...entry.modelMatrix].every(Number.isFinite)).toBe(true);
    const scales = entry.modelMatrix.getScale();
    expect(scales[0]).toBeCloseTo(1);
    expect(scales[1]).toBeCloseTo(1);
    expect(scales[2]).toBeCloseTo(0);
  });

  test('faces a diagonally authored direction after unequal local scaling', () => {
    const {controller} = makeController({viewDirection: [1, 0, 1]});
    const matrix = controller.getDrawEntries({viewMatrix: view()})[0].modelMatrix;
    const forward = new Vector3(1, 0, 1).transformAsVector(matrix).normalize();
    expect(forward[0]).toBeCloseTo(0);
    expect(forward[2]).toBeCloseTo(1);
  });

  test('sorts children of an overlay billboard by their completed depth', () => {
    const {controller, billboard, leaf} = makeController({overlay: true});
    leaf.setMatrix(new Matrix4().translate([0, 0, 1]));
    const farther = new ScenegraphNode({matrix: new Matrix4().translate([0, 0, -1])});
    billboard.add(farther);
    const entries = controller.getDrawEntries({viewMatrix: view()});
    expect(entries.map(entry => entry.node)).toEqual([farther, leaf]);
  });

  test('rejects ambiguous constrained-axis profiles and invalid local bases', () => {
    expect(() => makeController({rotationAxis: ['Y']})).toThrow();
    expect(() => makeController({viewDirection: [0, 1, 0], up: [0, 1, 0]})).toThrow();
  });
});
