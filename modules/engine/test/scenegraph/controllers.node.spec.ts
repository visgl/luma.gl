// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  AreaLightController,
  BillboardController,
  GroupNode,
  ScenegraphNode,
  SkinController,
  MaterialVariants,
  MaterialFactory,
  Model,
  ModelNode
} from '../../src';

test('engine skin controllers update resolved joints without asset metadata', () => {
  const mesh = new GroupNode({position: [2, 0, 0]});
  const joint = new GroupNode({position: [5, 0, 0]});
  const scene = new GroupNode({children: [mesh, joint]});
  const controller = new SkinController({
    scenes: [scene],
    bindings: [{node: mesh, joints: [joint], jointMatrices: new Float32Array(16), models: []}]
  });
  expect(controller.getBinding(mesh)?.jointMatrices[12]).toBe(3);
  joint.setPosition([7, 0, 0]).updateMatrix();
  controller.update();
  expect(controller.getBinding(mesh)?.jointMatrices[12]).toBe(5);
  controller.destroy();
});

test('engine area lights use dimensions directly and follow visibility', () => {
  const node = new GroupNode({position: [1, 2, 3]});
  const scene = new GroupNode({children: [node]});
  const controller = new AreaLightController({
    scenes: [scene],
    bindings: [{node, definition: {type: 'rect', width: 4, height: 2, intensity: 100}}]
  });
  const light = controller.getLights()[0];
  expect(light.position).toEqual([1, 2, 3]);
  expect(Math.hypot(...light.halfAxisX)).toBe(2);
  expect(Math.hypot(...light.halfAxisY)).toBe(1);
  scene.display = false;
  expect(controller.getLights()).toEqual([]);
  controller.destroy();
});

test('engine billboards accept a scene node and a camera orientation directly', () => {
  const leaf = new ScenegraphNode();
  const node = new GroupNode({children: [leaf]});
  const scene = new GroupNode({children: [node]});
  const controller = new BillboardController({
    scenes: [scene],
    bindings: [{node, definition: {rotationAxis: 'y'}}]
  });
  const viewMatrix = new Matrix4().lookAt({eye: [5, 2, 0], center: [0, 0, 0], up: [0, 1, 0]});
  const entry = controller.getDrawEntries({viewMatrix})[0];
  expect(entry.node).toBe(leaf);
  expect(entry.modelMatrix[8]).toBeCloseTo(1);
  expect(entry.modelMatrix[9]).toBeCloseTo(0);
  expect(node.matrix).toEqual(new Matrix4());
  controller.destroy();
});

test('engine material variants restore unmapped models and borrowed default state', () => {
  const device = new NullDevice({});
  const factory = new MaterialFactory(device, {modules: []});
  const defaultMaterial = factory.createMaterial();
  const alternateMaterial = factory.createMaterial();
  const model = new Model(device, {
    vs: '#version 300 es\nvoid main() {gl_Position = vec4(0.0);}',
    fs: '#version 300 es\nprecision highp float;\nout vec4 color;\nvoid main() {color = vec4(1.0);}',
    material: defaultMaterial
  });
  const modelNode = new ModelNode({model});
  const variants = new MaterialVariants({
    variants: [
      {name: 'paint', index: 0},
      {name: 'plain', index: 1}
    ],
    bindings: [
      {
        modelNode,
        defaultMaterial,
        defaultParameters: {cullMode: 'back'},
        mappings: new Map([[0, {material: alternateMaterial, parameters: {cullMode: 'none'}}]])
      }
    ]
  });
  try {
    variants.selectVariant('paint');
    expect(model.material).toBe(alternateMaterial);
    expect(model.parameters.cullMode).toBe('none');
    variants.selectVariant('plain');
    expect(model.material).toBe(defaultMaterial);
    expect(model.parameters.cullMode).toBe('back');
    variants.selectVariant('paint');
    variants.resetVariant();
    expect(model.material).toBe(defaultMaterial);
    expect(variants.activeVariant).toBeNull();
  } finally {
    model.destroy();
    defaultMaterial.destroy();
    alternateMaterial.destroy();
    device.destroy();
  }
});

test('area-light orientation follows matrix-authored parent nodes', () => {
  const lightNode = new GroupNode();
  const parent = new GroupNode({matrix: new Matrix4().rotateY(Math.PI / 2), children: [lightNode]});
  const scene = new GroupNode({children: [parent]});
  const controller = new AreaLightController({
    scenes: [scene],
    matrixNodes: [parent],
    bindings: [{node: lightNode, definition: {type: 'rect'}}]
  });
  expect(controller.getLights()[0].normal[0]).toBeCloseTo(-1);
  controller.destroy();
});
