// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLBWriter, GLTFLoader} from '@loaders.gl/scene/gltf/bundled';
import {parseGLTFPhysics, type GLTFPhysicsDocument} from '@luma.gl/engine/gltf-physics';
import {NullDevice} from '@luma.gl/core/test-utils';
import {createComposedScenegraphsFromGLTF, type GLTFWithBuffers} from '@luma.gl/engine/gltf';
import {expect, test} from 'vitest';

test('glTF 2.1 mounts only default scenes and preserves scoped state for repeated subtrees', () => {
  /** References to an asset without a default scene add no nodes. */
  const empty: GLTFWithBuffers = {
    json: {asset: {version: '2.1'}, nodes: [{name: 'Hidden'}], scenes: [{nodes: [0]}]},
    buffers: []
  };
  /** Include an ordinary child and a nested reference on the same node. */
  const part: GLTFWithBuffers = {
    json: {
      asset: {version: '2.1'},
      scene: 1,
      scenes: [{nodes: [2]}, {nodes: [0]}],
      nodes: [{name: 'Puppet', children: [1], externalAsset: 0}, {name: 'Bone'}, {name: 'Unused'}],
      externalAssets: [{file: 0}],
      files: [{uri: 'empty.gltf', mimeType: 'model/gltf+json'}]
    },
    buffers: [],
    externalAssets: [empty]
  };
  /** Two mount nodes refer to one decoded document. */
  const source: GLTFWithBuffers = {
    json: {
      asset: {version: '2.1'},
      scene: 0,
      scenes: [{nodes: [0, 1]}],
      nodes: [
        {name: 'Left', externalAsset: 0, translation: [1, 2, 3], boundingVolume: {shape: 0}},
        {name: 'Right', externalAsset: 0, translation: [-1, 0, 0]}
      ],
      shapes: [{type: 'sphere', sphere: {radius: 2}}],
      externalAssets: [{file: 0}],
      files: [{uri: 'puppet.gltf', mimeType: 'model/gltf+json'}]
    },
    buffers: [],
    externalAssets: [part]
  };
  /** Resolve both mounts using one loaned source document. */
  const composition = createComposedScenegraphsFromGLTF(new NullDevice({}), source);
  try {
    /** Resolve the first identity through its outer mount. */
    const first = composition.root.scene.findNode('Left/Puppet/Bone')!;
    /** Resolve the second copy through its distinct outer mount. */
    const second = composition.root.scene.findNode('Right/Puppet/Bone')!;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first).not.toBe(second);
    first.setPosition([5, 0, 0]).updateMatrix();
    expect(second.matrix[12]).toBe(0);
    expect(composition.root.scene.findNode('Unused')).toBeUndefined();
    expect(composition.root.scene.findNode('Hidden')).toBeUndefined();
    expect(composition.root.scene.findNode('Left')?.metadata['boundingVolume']).toEqual({
      volume: {shape: 0},
      shape: {type: 'sphere', sphere: {radius: 2}}
    });
    expect(composition.instances).toHaveLength(3);
    expect(source.json.nodes![0].children).toBeUndefined();
  } finally {
    composition.destroy();
  }
  expect(composition.instances).toHaveLength(0);
});

test('glTF 2.1 rejects unresolved references and manually linked asset cycles', () => {
  /** A manual dependency graph can contain cycles before any loader gets involved. */
  const source: GLTFWithBuffers = {
    json: {
      asset: {version: '2.1'},
      scene: 0,
      scenes: [{nodes: [0]}],
      nodes: [{externalAsset: 0}],
      externalAssets: [{file: 0}],
      files: [{uri: 'cycle.gltf', mimeType: 'model/gltf+json'}]
    },
    buffers: []
  };
  /** No GPU resources are needed to verify composition errors. */
  const device = new NullDevice({});
  expect(() => createComposedScenegraphsFromGLTF(device, source)).toThrow('unresolved');
  source.externalAssets = [source];
  expect(() => createComposedScenegraphsFromGLTF(device, source)).toThrow('cycle');
});

test('the authored glTF 2.1 marionette keeps valid release modes and body-to-body joints', async () => {
  /** The offline fixture is the same character used by the browser theater. */
  const source = JSON.parse(
    await readFile(
      new URL(
        '../../../../../examples/gltf/authored-scene-stress/assets/puppet-theater/marionette.gltf',
        import.meta.url
      ),
      'utf8'
    )
  ) as GLTFPhysicsDocument;
  /** A scenegraph session claims these authored dynamic modes during playback. */
  const description = parseGLTFPhysics(source, {
    animationOwnership: 'scenegraph',
    preserveAnimatedBodyModes: true
  });
  expect(description.issues).toEqual([]);
  expect(description.animatedBodyIndices).toHaveLength(10);
  expect(description.bodies.filter(body => body.body.mode === 'dynamic')).toHaveLength(10);
  const drives = description.joints.filter(({joint}) => joint.type === 'general' && joint.drive);
  expect(drives).toHaveLength(27);
  expect(drives.filter(({joint}) => joint.id === 'Left elbow joint')).toHaveLength(3);
  expect(description.joints.length - drives.length).toBe(36);
  expect(description.joints.every(({joint}) => joint.first !== joint.second)).toBe(true);
});

test('composes an embedded external glTF from a second binary chunk in GLB v3', async () => {
  /** The child scene is embedded as ordinary glTF JSON bytes. */
  const child = new TextEncoder().encode(
    JSON.stringify({
      asset: {version: '2.1'},
      scene: 0,
      scenes: [{nodes: [0]}],
      nodes: [{name: 'Embedded'}]
    })
  );
  /** GLB uses a 64-bit envelope and explicit chunk references starting after JSON. */
  const source = GLBWriter.encodeSync(
    {
      version: 3,
      json: {
        asset: {version: '2.1'},
        scene: 0,
        scenes: [{nodes: [0]}],
        nodes: [{name: 'Mount', externalAsset: 0}],
        buffers: [{chunk: 2, byteLength: child.byteLength}],
        bufferViews: [{buffer: 0, byteLength: child.byteLength}],
        files: [{bufferView: 0, mimeType: 'model/gltf+json'}],
        externalAssets: [{file: 0}]
      },
      chunks: [
        {type: 0x004e4942, arrayBuffer: new ArrayBuffer(8)},
        {type: 0x004e4942, arrayBuffer: child.buffer}
      ]
    },
    {glb: {version: 3}}
  );
  /** The engine borrows decoded loader resources and owns all runtime instances. */
  const decoded = await parse(source, GLTFLoader, {gltf: {loadExternalAssets: true}});
  /** Attach the embedded scene using the ordinary glTF scenegraph path. */
  const composition = createComposedScenegraphsFromGLTF(new NullDevice({}), decoded);
  try {
    expect(composition.root.scene.findNode('Mount/Embedded')).toBeDefined();
    expect(composition.instances).toHaveLength(2);
  } finally {
    composition.destroy();
  }
});
