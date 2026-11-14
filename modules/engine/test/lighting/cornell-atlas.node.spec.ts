// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {expect, test} from 'vitest';
import {validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {
  parseCornellScene,
  prepareCornellAtlas
} from '../../../../examples/api/lightmap-baking/cornell-scene';

test('Cornell Box placements share source UVs but receive distinct reproducible lightmap charts', async () => {
  const bytes = await readFile(
    new URL('../../../../examples/api/lightmap-baking/cornell-box.gltf', import.meta.url)
  );
  const firstSource = await parseCornellScene(Uint8Array.from(bytes).buffer);
  const secondSource = await parseCornellScene(Uint8Array.from(bytes).buffer);
  const first = prepareCornellAtlas(firstSource, 'preview');
  const second = prepareCornellAtlas(secondSource, 'preview');
  expect(firstSource.placements).toHaveLength(8);
  expect(first.atlas.charts).toHaveLength(36);
  expect(validateLightmapAtlas(first.atlas)).toEqual([]);
  expect(first.recipe).toEqual(second.recipe);
  expect(first.atlas.chartOwners).toEqual(second.atlas.chartOwners);
  const [tall, short] = first.atlas.meshes.slice(-2);
  expect(tall.geometry.attributes.TEXCOORD_0.value).toEqual(
    short.geometry.attributes.TEXCOORD_0.value
  );
  expect(tall.geometry.attributes.POSITION.value).not.toEqual(
    short.geometry.attributes.POSITION.value
  );
  expect(tall.geometry.attributes.TEXCOORD_1.value).not.toEqual(
    short.geometry.attributes.TEXCOORD_1.value
  );
  expect(first.geometry.attributes.TEXCOORD_1.value).toEqual(
    second.geometry.attributes.TEXCOORD_1.value
  );
});
