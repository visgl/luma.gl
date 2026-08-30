// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GLTFExtensionStandardStatus, GLTFExtensionSupportLevel} from '@luma.gl/gltf';

import {
  getGLTFReferenceLedger,
  type GLTFReferenceFixture,
  type GLTFReferenceLedger
} from './gltf-reference-ledger';

export type GLTFStudioFeature = {
  extensionName: string;
  supportLevel: GLTFExtensionSupportLevel;
  standardStatus: GLTFExtensionStandardStatus;
  supported: boolean;
};

/** One gallery asset whose compatibility labels come from the executable reference ledger. */
export type GLTFStudioAsset = {
  name: string;
  label: string;
  category: 'animation' | 'materials' | 'native-extensions';
  description: string;
  features: readonly GLTFStudioFeature[];
  license: 'CC0-1.0';
  licenseLocation: string;
  sourceRevision: string;
  source: 'khronos-sample-assets' | 'luma.gl' | 'three.js';
  model: GLTFReferenceFixture['model'];
};

export const ROBOT_EXPRESSIVE_SOURCE_REVISION = '24595fb65bb662ea1e70984bb18301af06637b07';
export const ROBOT_EXPRESSIVE_SOURCE_URL = `https://github.com/mrdoob/three.js/tree/${ROBOT_EXPRESSIVE_SOURCE_REVISION}/examples/models/gltf/RobotExpressive`;

const CURATED_EXTENSION_ORDER = [
  'KHR_materials_variants',
  'KHR_animation_pointer',
  'KHR_node_visibility',
  'EXT_mesh_gpu_instancing',
  'MSFT_lod',
  'KHR_materials_transmission',
  'KHR_materials_iridescence',
  'KHR_materials_sheen',
  'KHR_materials_diffuse_transmission',
  'KHR_materials_volume_scatter',
  'EXT_materials_bump'
] as const;

const ROBOT_EXPRESSIVE_ASSET: GLTFStudioAsset = {
  name: 'RobotExpressive',
  label: 'Expressive Robot · 14 Clips',
  category: 'animation',
  description: 'Fourteen named clips, two 43-joint skins, and three facial morph targets.',
  features: [],
  license: 'CC0-1.0',
  licenseLocation: `${ROBOT_EXPRESSIVE_SOURCE_URL}/README.md`,
  sourceRevision: ROBOT_EXPRESSIVE_SOURCE_REVISION,
  source: 'three.js',
  model: {
    name: 'RobotExpressive',
    label: 'Expressive Robot · 14 Clips',
    variant: 'glTF-Binary',
    fileName: 'RobotExpressive.glb'
  }
};

/**
 * Builds the studio gallery from the landed compatibility ledger plus one explicitly licensed
 * offline hero asset. The studio does not maintain a second runtime-support manifest.
 */
export function getGLTFStudioAssets(
  ledger: GLTFReferenceLedger = getGLTFReferenceLedger()
): readonly GLTFStudioAsset[] {
  const entriesByExtension = new Map(
    ledger.extensions.map(extension => [extension.extensionName, extension])
  );
  const assetsByName = new Map<string, GLTFStudioAsset>([
    [ROBOT_EXPRESSIVE_ASSET.name, ROBOT_EXPRESSIVE_ASSET]
  ]);

  for (const extensionName of CURATED_EXTENSION_ORDER) {
    const extension = entriesByExtension.get(extensionName);
    const fixture = extension?.positiveFixture;
    if (!extension || !fixture) {
      continue;
    }

    const feature: GLTFStudioFeature = {
      extensionName: extension.extensionName,
      supportLevel: extension.supportLevel,
      standardStatus: extension.standardStatus,
      supported: extension.supported
    };
    const existingAsset = assetsByName.get(fixture.model.name);
    if (existingAsset) {
      assetsByName.set(fixture.model.name, {
        ...existingAsset,
        features: [...existingAsset.features, feature]
      });
      continue;
    }

    assetsByName.set(fixture.model.name, {
      name: fixture.model.name,
      label: fixture.model.label,
      category: getStudioAssetCategory(extension.extensionName),
      description: extension.comment,
      features: [feature],
      license: 'CC0-1.0',
      licenseLocation: fixture.licenseLocation,
      sourceRevision: fixture.sourceRevision,
      source: fixture.source,
      model: fixture.model
    });
  }

  return [...assetsByName.values()];
}

export const GLTF_STUDIO_ASSETS = getGLTFStudioAssets();

export function getGLTFStudioAsset(name: string): GLTFStudioAsset | undefined {
  return GLTF_STUDIO_ASSETS.find(asset => asset.name === name);
}

function getStudioAssetCategory(
  extensionName: string
): 'animation' | 'materials' | 'native-extensions' {
  if (
    extensionName === 'KHR_animation_pointer' ||
    extensionName === 'KHR_node_visibility' ||
    extensionName === 'MSFT_lod'
  ) {
    return 'animation';
  }
  return extensionName.includes('_materials_') ? 'materials' : 'native-extensions';
}
