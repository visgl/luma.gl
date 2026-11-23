// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const SAMPLE_ASSET_ROOT =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/723ffc6706725b618b8c14ceb82e3e6904b08a76/Models';

export type GLTFModelSource =
  | {modelUrl: string; models?: never}
  | {models: readonly string[]; modelUrl?: never};

export type GLTFModelOption = {name: string; url: string};

/** Limit the viewer to the page's explicit model subset; never fetch the full catalog. */
export function getGLTFModelOptions(
  models: readonly string[] = [],
  modelUrl?: string
): GLTFModelOption[] {
  if (modelUrl) {
    return [{name: 'glTF model', url: modelUrl}];
  }
  return Array.from(new Set(models), name => ({
    name,
    url: `${SAMPLE_ASSET_ROOT}/${name}/glTF/${name}.gltf`
  }));
}

/** A changed subset must not retain a previously selected, unrelated model. */
export function selectGLTFModelOption(
  models: readonly GLTFModelOption[],
  selectedUrl: string
): GLTFModelOption | undefined {
  return models.find(model => model.url === selectedUrl) || models[0];
}
