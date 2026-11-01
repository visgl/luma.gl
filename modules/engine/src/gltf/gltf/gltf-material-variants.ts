// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GroupNode,
  ModelNode,
  type MaterialVariantsProps,
  type MaterialVariant,
  type MaterialVariantBinding,
  type PrimitiveMaterialVariants
} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '../types/gltf-postprocessed-schema';

/** Resolve glTF variant declarations and primitive mappings for the engine runtime. */
export function parseGLTFMaterialVariants(
  gltf: GLTFPostprocessed,
  scenes: readonly GroupNode[]
): MaterialVariantsProps {
  const sourceVariants = gltf.extensions?.['KHR_materials_variants']?.['variants'] || [];
  const variants: MaterialVariant[] = sourceVariants.map(
    (variant: {name?: string}, index: number) => ({
      name: variant.name || `Variant-${index}`,
      index
    })
  );
  const visited = new Set<ModelNode>();
  const bindings: MaterialVariantBinding[] = [];
  for (const scene of scenes) {
    scene.preorderTraversal(node => {
      if (!(node instanceof ModelNode) || visited.has(node)) return;
      const mapping = node.userData['gltfMaterialVariants'] as
        | PrimitiveMaterialVariants
        | undefined;
      if (mapping) {
        visited.add(node);
        bindings.push({modelNode: node, ...mapping});
      }
    });
  }
  return {variants, bindings};
}
