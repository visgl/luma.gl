// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SceneMetadata} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';

/** Populates shared scene metadata from glTF XMP packet references. */
export function parseGLTFMetadata(gltf: GLTFPostprocessed): SceneMetadata {
  const metadata = new SceneMetadata();
  const rootExtension = gltf.extensions?.['KHR_xmp_json_ld'] as {packets?: unknown[]} | undefined;
  const packets = rootExtension?.packets || [];
  const categories: [string, readonly unknown[]][] = [
    ['asset', [gltf.asset]],
    ['scene', gltf.scenes || []],
    ['node', gltf.nodes || []],
    ['mesh', gltf.meshes || []],
    ['material', gltf.materials || []],
    ['image', gltf.images || []],
    ['animation', gltf.animations || []]
  ];
  for (const [category, objects] of categories) {
    objects.forEach((object, index) => {
      const reference = (object as {extensions?: Record<string, {packet?: number}>} | undefined)
        ?.extensions?.['KHR_xmp_json_ld'];
      if (!reference) return;
      const packetIndex = reference.packet;
      // A packet reference must point to an object in the document's packet array.
      if (!Number.isInteger(packetIndex) || packetIndex! < 0 || packetIndex! >= packets.length) {
        throw new Error(`glTF: invalid XMP packet index ${packetIndex}`);
      }
      const packet = packets[packetIndex!];
      if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
        throw new Error(`glTF: invalid XMP packet ${packetIndex}`);
      }
      metadata.set(category, index, packet as Record<string, unknown>);
    });
  }
  return metadata;
}
