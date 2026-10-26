// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Retain preferred source metadata while exposing the complete standard asset catalog. */
export function mergeGLTFModelCatalog<Model extends {name: string}>(
  preferredModels: readonly Model[],
  catalogModels: readonly Model[]
): Model[] {
  const modelsByName = new Map<string, Model>();
  for (const model of [...preferredModels, ...catalogModels]) {
    if (!modelsByName.has(model.name)) modelsByName.set(model.name, model);
  }
  return Array.from(modelsByName.values());
}
