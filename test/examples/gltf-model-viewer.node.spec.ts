// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@luma.gl/gltf';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';
import GLTFViewer from '../../examples/tutorials/hello-gltf/app';

test('glTF viewer teardown releases the registered scenegraphs and notifies controls once', async () => {
  const source = await readFile(
    new URL('../../modules/gltf/test/data/SimpleInstancing.glb', import.meta.url)
  );
  const gltf = postProcessGLTF(await parse(source, GLTFLoader, {gltf: {loadImages: false}}));
  const device = new NullDevice({});
  const scenegraphs = createScenegraphsFromGLTF(device, gltf);
  const onUnload = vi.fn();
  const modelNodes: ModelNode[] = [];
  for (const scene of scenegraphs.scenes) {
    scene.traverse(node => {
      if (node instanceof ModelNode) {
        modelNodes.push(node);
      }
    });
  }
  const destroyModels = modelNodes.map(node => vi.spyOn(node.model, 'destroy'));

  // Exercise teardown without starting browser input handlers or an asset fetch.
  const viewer: GLTFViewer = Object.create(GLTFViewer.prototype);
  Object.assign(viewer, {
    orbitControls: {destroy() {}},
    scenegraphsFromGLTF: scenegraphs,
    modelLights: [],
    viewerOptions: {onUnload}
  });

  try {
    viewer.onFinalize();
    expect(viewer.scenegraphsFromGLTF).toBeUndefined();
    expect(onUnload).toHaveBeenCalledTimes(1);
    expect(onUnload).toHaveBeenCalledWith(scenegraphs);
    expect(destroyModels.length).toBeGreaterThan(0);
    for (const destroyModel of destroyModels) {
      expect(destroyModel).toHaveBeenCalledTimes(1);
    }

    viewer.onFinalize();
    expect(onUnload).toHaveBeenCalledTimes(1);
  } finally {
    device.destroy();
  }
});
