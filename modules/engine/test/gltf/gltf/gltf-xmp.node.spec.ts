// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {postProcessGLTF, createScenegraphsFromGLTF} from '@luma.gl/engine/gltf';
import {parseGLTFMetadata} from '../../../src/gltf/parsers/parse-gltf-metadata';

const packet = {
  '@context': {dc: 'https://purl.org/dc/elements/1.1/'},
  'dc:creator': ['A', 'B'],
  'custom:object': {value: 3}
};
const reference = {KHR_xmp_json_ld: {packet: 0}};

/** Creates a small metadata-only source document. */
function makeSource() {
  return {
    asset: {version: '2.0', extensions: reference},
    extensionsUsed: ['KHR_xmp_json_ld'],
    extensionsRequired: ['KHR_xmp_json_ld'],
    extensions: {KHR_xmp_json_ld: {packets: [packet]}},
    scenes: [{nodes: [], extensions: reference}],
    nodes: [{extensions: reference}],
    meshes: [{primitives: [], extensions: reference}],
    materials: [{extensions: reference}],
    images: [{uri: 'unused.png', extensions: reference}],
    animations: [{channels: [], samplers: [], extensions: reference}]
  };
}

describe('glTF XMP scene metadata', () => {
  test('resolves shared metadata for every permitted object type without changing packets', () => {
    const source = makeSource();
    const gltf = postProcessGLTF({json: source, buffers: [], images: []} as any);
    const metadata = parseGLTFMetadata(gltf);
    for (const category of ['asset', 'scene', 'node', 'mesh', 'material', 'image', 'animation']) {
      expect(metadata.get(category)).toBe(packet);
      expect(metadata.get(category)).toEqual(packet);
    }
    expect(metadata.get('node', 1)).toBeUndefined();
    expect(source.extensions.KHR_xmp_json_ld.packets[0]).toEqual(packet);
  });

  test.each([-1, 1, 0.5])('rejects an invalid packet index %s before GPU allocation', index => {
    const source = makeSource();
    source.asset.extensions = {KHR_xmp_json_ld: {packet: index}};
    const gltf = postProcessGLTF({json: source, buffers: [], images: []} as any);
    const device = new NullDevice({});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    expect(() => createScenegraphsFromGLTF(device, gltf, {strictExtensions: true})).toThrow(
      /invalid XMP packet index/
    );
    expect(createBuffer).not.toHaveBeenCalled();
    device.destroy();
  });

  test('exposes required XMP through the generic scene metadata collection', () => {
    const source = makeSource();
    source.nodes = [];
    source.meshes = [];
    source.materials = [];
    source.images = [];
    source.animations = [];
    const gltf = postProcessGLTF({json: source, buffers: [], images: []} as any);
    const device = new NullDevice({});
    const result = createScenegraphsFromGLTF(device, gltf, {strictExtensions: true});
    expect(result.metadata.get('asset')).toEqual(packet);
    expect(result.metadata.get('scene')).toBe(result.metadata.get('asset'));
    result.destroy();
    device.destroy();
  });

  test('populates scene node and material metadata on shared engine objects', () => {
    const source = makeSource();
    source.scenes[0].nodes = [0];
    source.nodes[0] = {...source.nodes[0], mesh: 0} as any;
    source.images = [];
    source.animations = [];
    const gltf = postProcessGLTF({json: source, buffers: [], images: []} as any);
    const device = new NullDevice({});
    const result = createScenegraphsFromGLTF(device, gltf, {strictExtensions: true});
    expect(result.scenes[0].metadata.xmp).toBe(packet);
    expect(result.gltfNodeIndexToNodeMap.get(0)?.metadata.xmp).toBe(packet);
    expect(result.gltfMeshIdToNodeMap.get(gltf.meshes[0].id)?.metadata.xmp).toBe(packet);
    expect(result.materials[0].metadata.xmp).toBe(packet);
    result.destroy();
    device.destroy();
  });

  test('populates per-scene FB geometry metadata without replacing live bounds', () => {
    const first = {
      vertexCount: 8,
      primitiveCount: 12,
      sceneBounds: {min: [-1, -2, -3], max: [1, 2, 3]}
    };
    const second = {
      vertexCount: 4,
      primitiveCount: 2,
      sceneBounds: {min: [0, 0, 0], max: [1, 1, 0]}
    };
    const source = {
      asset: {version: '2.0'},
      extensionsUsed: ['FB_geometry_metadata', 'KHR_xmp_json_ld'],
      extensions: {KHR_xmp_json_ld: {packets: [packet]}},
      scenes: [
        {nodes: [], extensions: {FB_geometry_metadata: first, ...reference}},
        {nodes: [], extensions: {FB_geometry_metadata: second}}
      ],
      nodes: []
    };
    const gltf = postProcessGLTF({json: source, buffers: [], images: []} as any);
    const device = new NullDevice({});
    const result = createScenegraphsFromGLTF(device, gltf);
    expect(result.scenes[0].metadata['fb:geometry']).toBe(first);
    expect(result.scenes[0].metadata.xmp).toBe(packet);
    expect(result.scenes[1].metadata['fb:geometry']).toBe(second);
    expect(result.sceneBounds[0].bounds).toBeNull();
    result.destroy();
    device.destroy();
  });
});
