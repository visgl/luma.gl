// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {decodeLightmapData, encodeLightmapData, type LightmapData} from '@luma.gl/engine/lighting';

const CORNELL_BAKE_MAGIC = 0x32424d4c;
const MAX_METADATA_BYTES = 4096;

export const CORNELL_BAKE_PROFILES = {
  preview: {width: 2048, height: 2048, texelsPerUnit: 64, padding: 8, samples: 192},
  high: {width: 4096, height: 4096, texelsPerUnit: 128, padding: 8, samples: 768}
} as const;

export type CornellBakeRecipe = {
  assetHash: string;
  layoutVersion: 1;
  width: number;
  height: number;
  texelsPerUnit: number;
  padding: number;
  uvSet: 1;
  placements: readonly string[];
};

function recipeKey(recipe: CornellBakeRecipe): string {
  return JSON.stringify([
    recipe.assetHash,
    recipe.layoutVersion,
    recipe.width,
    recipe.height,
    recipe.texelsPerUnit,
    recipe.padding,
    recipe.uvSet,
    recipe.placements
  ]);
}

function validatePayload(data: LightmapData, recipe: CornellBakeRecipe): void {
  if (data.width !== recipe.width || data.height !== recipe.height || data.uvSet !== recipe.uvSet) {
    throw new Error('The lightmap dimensions or UV set do not match the atlas recipe.');
  }
}

export function encodeCornellBake(data: LightmapData, recipe: CornellBakeRecipe): ArrayBuffer {
  validatePayload(data, recipe);
  const metadata = new TextEncoder().encode(recipeKey(recipe));
  if (metadata.length > MAX_METADATA_BYTES) throw new Error('Atlas recipe is too large.');
  const payload = new Uint8Array(encodeLightmapData(data));
  const output = new Uint8Array(8 + metadata.length + payload.length);
  const header = new DataView(output.buffer);
  header.setUint32(0, CORNELL_BAKE_MAGIC, true);
  header.setUint32(4, metadata.length, true);
  output.set(metadata, 8);
  output.set(payload, 8 + metadata.length);
  return output.buffer;
}

/** Validate the source and deterministic atlas recipe before decoding the irradiance payload. */
export function decodeCornellBake(buffer: ArrayBuffer, recipe: CornellBakeRecipe): LightmapData {
  if (buffer.byteLength < 8) throw new Error('Incomplete Cornell Box bake.');
  const header = new DataView(buffer);
  if (header.getUint32(0, true) !== CORNELL_BAKE_MAGIC) {
    throw new Error('Select a bake exported from the Cornell Box example.');
  }
  const metadataLength = header.getUint32(4, true);
  if (metadataLength > MAX_METADATA_BYTES || metadataLength > buffer.byteLength - 8) {
    throw new Error('Invalid Cornell Box atlas recipe.');
  }
  const metadata = new TextDecoder().decode(new Uint8Array(buffer, 8, metadataLength));
  if (metadata !== recipeKey(recipe)) {
    throw new Error('This bake belongs to a different source asset or atlas layout.');
  }
  const data = decodeLightmapData(buffer.slice(8 + metadataLength));
  validatePayload(data, recipe);
  return data;
}
