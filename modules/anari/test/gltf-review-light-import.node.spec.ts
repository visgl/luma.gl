// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {parseGLTFLights} from '@luma.gl/gltf';
import {describe, expect, test} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/anari/gltf-to-anari';

describe('selected-scene glTF punctual-light ownership', () => {
  test('filters inactive-scene lights without losing selected-scene hierarchy', async () => {
    const assetData = await readFile(new URL('../../../test/data/box.glb', import.meta.url));
    const source = postProcessGLTF(await parse(assetData, GLTFLoader, {gltf: {loadImages: false}}));
    const selectedRoot = source.scene?.nodes?.[0] || source.scenes[0]?.nodes?.[0];
    expect(selectedRoot).toBeDefined();
    if (!selectedRoot) {
      return;
    }

    const documentWithLights = source as typeof source & {
      lights?: Array<Record<string, unknown>>;
    };
    documentWithLights.lights = [
      {type: 'point', color: [0.2, 0.4, 0.6], intensity: 3},
      {type: 'spot', color: [1, 0, 0], intensity: 17}
    ];

    const selectedLightNode = {
      id: 'selected-scene-light',
      translation: [1, 2, 3],
      extensions: {KHR_lights_punctual: {light: 0}}
    } as (typeof source.nodes)[number];
    const inactiveLightNode = {
      id: 'inactive-scene-light',
      translation: [9, 8, 7],
      extensions: {KHR_lights_punctual: {light: 1}}
    } as (typeof source.nodes)[number];
    selectedRoot.children = [...(selectedRoot.children || []), selectedLightNode];
    source.nodes.push(selectedLightNode, inactiveLightNode);
    source.scenes.push({
      id: 'inactive-light-scene',
      nodes: [inactiveLightNode]
    } as (typeof source.scenes)[number]);

    expect(parseGLTFLights(source, {useByteColors: false})).toHaveLength(2);
    expect(
      parseGLTFLights(source, {
        nodeIdentifiers: new Set([selectedLightNode.id]),
        useByteColors: false
      })
    ).toHaveLength(1);

    const retainedScene = await makeANARIJSONSceneFromGLTF(source, 'SELECTED LIGHT SCENE');
    const authoredLights = (retainedScene.lights || []).filter(light =>
      light['@@id'].startsWith('source-')
    );
    expect(authoredLights).toHaveLength(1);
    expect(authoredLights[0]['@@type']).toBe('point');
    expect(authoredLights[0].color).toEqual([0.2, 0.4, 0.6]);
    expect(authoredLights[0].intensity).toBe(3);
    expect(ANARISceneSchema.safeParse(retainedScene).success).toBe(true);
  });
});
