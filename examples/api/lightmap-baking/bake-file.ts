// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {encodeLightmapData, decodeLightmapData, type LightmapData} from '@luma.gl/engine/lighting';
import type {BakingScene} from './scenes';

/** Example file envelope. The embedded LML payload retains the public engine format. */
export function encodeSceneBake(data: LightmapData, scene: BakingScene): ArrayBuffer {
  const metadata = new TextEncoder().encode(JSON.stringify({scene, layoutVersion: 1}));
  const payload = new Uint8Array(encodeLightmapData(data));
  const bytes = new Uint8Array(8 + metadata.length + payload.length);
  const header = new DataView(bytes.buffer);
  header.setUint32(0, 0x31424d4c, true);
  header.setUint32(4, metadata.length, true);
  bytes.set(metadata, 8);
  bytes.set(payload, 8 + metadata.length);
  return bytes.buffer;
}

/** Reject another scene or atlas revision before uploading any GPU resource. */
export function decodeSceneBake(buffer: ArrayBuffer, scene: BakingScene): LightmapData {
  if (buffer.byteLength < 8 || new DataView(buffer).getUint32(0, true) !== 0x31424d4c)
    throw new Error('Select a scene bake exported by this example (.lmb).');
  const metadataLength = new DataView(buffer).getUint32(4, true);
  if (metadataLength > buffer.byteLength - 8) throw new Error('Incomplete scene bake.');
  const metadata: unknown = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 8, metadataLength))
  );
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('scene' in metadata) ||
    metadata.scene !== scene ||
    !('layoutVersion' in metadata) ||
    metadata.layoutVersion !== 1
  )
    throw new Error('This bake belongs to a different scene or atlas layout.');
  return decodeLightmapData(buffer.slice(8 + metadataLength));
}
