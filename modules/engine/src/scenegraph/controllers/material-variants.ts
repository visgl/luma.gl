// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RenderPipelineParameters} from '@luma.gl/core';
import type {Material} from '../../material/material';
import type {ModelNode} from '../model-node';

export type MaterialVariantBinding = PrimitiveMaterialVariants & {modelNode: ModelNode};
export type MaterialVariantsProps = {
  variants: readonly MaterialVariant[];
  bindings: readonly MaterialVariantBinding[];
};

/** A named material appearance. */
export type MaterialVariant = {
  /** Application-visible variant name. */
  name: string;
  /** Stable index used by primitive mappings. */
  index: number;
};

/** Material and pipeline state captured for one source primitive. */
export type PrimitiveMaterialVariants = {
  defaultMaterial: Material | null;
  defaultParameters: RenderPipelineParameters;
  mappings: ReadonlyMap<number, {material: Material; parameters: RenderPipelineParameters}>;
};

/** Selects authored source material variants without rebuilding scenegraph topology. */
export class MaterialVariants {
  /** Source variants in their authored order. */
  readonly variants: readonly MaterialVariant[];
  /** Application-visible source variant names. */
  readonly names: readonly string[];
  /** Currently selected variant, or `null` when source defaults are active. */
  activeVariant: string | null = null;

  private readonly bindings: readonly MaterialVariantBinding[];

  constructor(props: MaterialVariantsProps) {
    this.variants = props.variants;
    this.names = this.variants.map(variant => variant.name);
    this.bindings = props.bindings;
  }

  /** Applies one named variant atomically and restores unmapped primitives to source defaults. */
  selectVariant(variantName: string): void {
    const variant = this.variants.find(candidate => candidate.name === variantName);
    if (!variant) {
      throw new Error(`Unknown material variant: ${variantName}`);
    }

    for (const {modelNode, ...sourceVariants} of this.bindings) {
      const mapping = sourceVariants.mappings.get(variant.index);
      modelNode.model.setMaterial(mapping?.material || sourceVariants.defaultMaterial);
      modelNode.model.setParameters(mapping?.parameters || sourceVariants.defaultParameters);
    }
    this.activeVariant = variantName;
  }

  /** Restores every primitive's authored default material and pipeline parameters. */
  resetVariant(): void {
    for (const {modelNode, ...sourceVariants} of this.bindings) {
      modelNode.model.setMaterial(sourceVariants.defaultMaterial);
      modelNode.model.setParameters(sourceVariants.defaultParameters);
    }
    this.activeVariant = null;
  }
}
