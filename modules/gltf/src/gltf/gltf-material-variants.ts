// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RenderPipelineParameters} from '@luma.gl/core';
import {GroupNode, Material, ModelNode} from '@luma.gl/engine';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

/** One source-authored `KHR_materials_variants` definition. */
export type GLTFMaterialVariant = {
  /** Application-visible variant name. */
  name: string;
  /** Variant index in the source glTF extension. */
  index: number;
};

/** Material and pipeline state captured for one source primitive. */
export type GLTFPrimitiveMaterialVariants = {
  defaultMaterial: Material | null;
  defaultParameters: RenderPipelineParameters;
  mappings: ReadonlyMap<number, {material: Material; parameters: RenderPipelineParameters}>;
};

/** Selects authored glTF material variants without rebuilding scenegraph topology. */
export class GLTFMaterialVariants {
  /** Source variants in their authored order. */
  readonly variants: readonly GLTFMaterialVariant[];
  /** Application-visible source variant names. */
  readonly names: readonly string[];
  /** Currently selected variant, or `null` when source defaults are active. */
  activeVariant: string | null = null;

  private readonly modelNodes: ModelNode[];

  constructor(gltf: GLTFPostprocessed, scenes: readonly GroupNode[]) {
    const sourceVariants = gltf.extensions?.['KHR_materials_variants']?.['variants'] || [];
    this.variants = sourceVariants.map((variant: {name?: string}, index: number) => ({
      name: variant.name || `Variant-${index}`,
      index
    }));
    this.names = this.variants.map(variant => variant.name);

    const visitedModelNodes = new Set<ModelNode>();
    for (const scene of scenes) {
      scene.preorderTraversal(node => {
        if (node instanceof ModelNode && node.userData['gltfMaterialVariants']) {
          visitedModelNodes.add(node);
        }
      });
    }
    this.modelNodes = Array.from(visitedModelNodes);
  }

  /** Applies one named variant atomically and restores unmapped primitives to source defaults. */
  selectVariant(variantName: string): void {
    const variant = this.variants.find(candidate => candidate.name === variantName);
    if (!variant) {
      throw new Error(`Unknown glTF material variant: ${variantName}`);
    }

    for (const modelNode of this.modelNodes) {
      const sourceVariants = modelNode.userData[
        'gltfMaterialVariants'
      ] as GLTFPrimitiveMaterialVariants;
      const mapping = sourceVariants.mappings.get(variant.index);
      modelNode.model.setMaterial(mapping?.material || sourceVariants.defaultMaterial);
      modelNode.model.setParameters(mapping?.parameters || sourceVariants.defaultParameters);
    }
    this.activeVariant = variantName;
  }

  /** Restores every primitive's authored default material and pipeline parameters. */
  resetVariant(): void {
    for (const modelNode of this.modelNodes) {
      const sourceVariants = modelNode.userData[
        'gltfMaterialVariants'
      ] as GLTFPrimitiveMaterialVariants;
      modelNode.model.setMaterial(sourceVariants.defaultMaterial);
      modelNode.model.setParameters(sourceVariants.defaultParameters);
    }
    this.activeVariant = null;
  }
}
