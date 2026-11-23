// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  getRegisteredGLTFExtensions,
  type GLTFRegisteredExtensionSupport
} from '@luma.gl/engine/gltf';

import {GLTF_EXTENSION_DEMOS, type GLTFExtensionDemoModel} from './gltf-extension-demos';
import {
  GLTF_SAMPLE_ASSETS_FILE_URL,
  GLTF_SAMPLE_ASSETS_MODEL_URL,
  GLTF_SAMPLE_ASSETS_REVISION,
  GLTF_SAMPLE_ASSETS_SOURCE_URL,
  GLTF_SAMPLE_VIEWER_RELEASE_REVISION,
  GLTF_SAMPLE_VIEWER_RELEASE_SOURCE_URL,
  GLTF_SAMPLE_VIEWER_REVISION,
  GLTF_SAMPLE_VIEWER_SOURCE_URL
} from './gltf-reference-source';

export type GLTFReferenceFixture = {
  model: GLTFExtensionDemoModel;
  assetLocation: string;
  licenseLocation: string;
  sourceRevision: string;
  source: 'khronos-sample-assets' | 'omi-gltf-extensions' | 'luma.gl';
};

export type GLTFReferenceLedgerEntry = GLTFRegisteredExtensionSupport & {
  positiveFixture?: GLTFReferenceFixture;
};

export type GLTFReferenceLedger = {
  sampleAssetsRevision: string;
  sampleAssetsSource: string;
  sampleViewerRevision: string;
  sampleViewerSource: string;
  sampleViewerReleaseRevision: string;
  sampleViewerReleaseSource: string;
  extensions: GLTFReferenceLedgerEntry[];
  unsupportedRequiredFixture: {
    assetLocation: string;
    extensionNames: string[];
  };
};

const LOCAL_FIXTURES: Record<
  string,
  Pick<GLTFReferenceFixture, 'assetLocation' | 'licenseLocation' | 'sourceRevision' | 'source'>
> = {
  BumpMaterial: {
    assetLocation: 'modules/engine/test/gltf/data/BumpMaterial.gltf',
    licenseLocation: 'modules/engine/test/gltf/data/README.md',
    sourceRevision: 'repository',
    source: 'luma.gl'
  },
  CubeVisibility: {
    assetLocation: 'modules/engine/test/gltf/data/CubeVisibility.glb',
    licenseLocation: 'modules/engine/test/gltf/data/README.md',
    sourceRevision: '2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf',
    source: 'luma.gl'
  },
  LightVisibility: {
    assetLocation: 'modules/engine/test/gltf/data/LightVisibility.glb',
    licenseLocation: 'modules/engine/test/gltf/data/README.md',
    sourceRevision: '2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf',
    source: 'luma.gl'
  },
  SimpleInstancing: {
    assetLocation: 'modules/engine/test/gltf/data/SimpleInstancing.glb',
    licenseLocation: 'modules/engine/test/gltf/data/README.md',
    sourceRevision: '2bac6f8c57bf471df0d2a1e8a8ec023c7801dddf',
    source: 'luma.gl'
  },
  SimpleSkinLOD: {
    assetLocation: 'modules/engine/test/gltf/data/SimpleSkinLOD.gltf',
    licenseLocation: 'modules/engine/test/gltf/data/README.md',
    sourceRevision: 'repository',
    source: 'luma.gl'
  }
};

/**
 * Builds the executable compatibility ledger from the runtime registry and showcase fixtures.
 * Missing positive fixtures remain visible so tests and tooling can report the exact gap.
 */
export function getGLTFReferenceLedger(): GLTFReferenceLedger {
  const demosByExtension = new Map(
    GLTF_EXTENSION_DEMOS.map(extensionDemo => [extensionDemo.extensionName, extensionDemo])
  );
  const extensions = getRegisteredGLTFExtensions().map(extension => {
    const model = demosByExtension.get(extension.extensionName)?.models[0];
    return {
      ...extension,
      positiveFixture:
        extension.extensionName === 'KHR_audio_emitter'
          ? {
              model: {
                name: 'BoomBoxAudio',
                label: 'Boom Box spatial audio',
                fileName: 'boom_box.gltf'
              },
              assetLocation:
                'https://raw.githubusercontent.com/omigroup/gltf-extensions/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter/examples/boom_box/boom_box.gltf',
              licenseLocation:
                'https://github.com/omigroup/gltf-extensions/blob/4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692/extensions/2.0/KHR_audio_emitter/examples/boom_box/boom_box.gltf',
              sourceRevision: '4f1fe73bff65ed5ca97dace7eb60ffdb64e2e692',
              source: 'omi-gltf-extensions' as const
            }
          : model
            ? getReferenceFixture(model)
            : undefined
    };
  });
  const unsupportedRequiredExtensionNames = extensions
    .filter(extension => extension.supportLevel === 'none')
    .map(extension => extension.extensionName);

  return {
    sampleAssetsRevision: GLTF_SAMPLE_ASSETS_REVISION,
    sampleAssetsSource: GLTF_SAMPLE_ASSETS_SOURCE_URL,
    sampleViewerRevision: GLTF_SAMPLE_VIEWER_REVISION,
    sampleViewerSource: GLTF_SAMPLE_VIEWER_SOURCE_URL,
    sampleViewerReleaseRevision: GLTF_SAMPLE_VIEWER_RELEASE_REVISION,
    sampleViewerReleaseSource: GLTF_SAMPLE_VIEWER_RELEASE_SOURCE_URL,
    extensions,
    unsupportedRequiredFixture: {
      assetLocation: 'modules/engine/test/gltf/data/UnsupportedRequiredExtensions.gltf',
      extensionNames: unsupportedRequiredExtensionNames
    }
  };
}

function getReferenceFixture(model: GLTFExtensionDemoModel): GLTFReferenceFixture {
  const localFixture = LOCAL_FIXTURES[model.name];
  if (localFixture) {
    return {model, ...localFixture};
  }

  const variant = model.variant || 'glTF';
  const fileName = model.fileName || `${model.name}.gltf`;
  return {
    model,
    assetLocation: `${GLTF_SAMPLE_ASSETS_MODEL_URL}/${model.name}/${variant}/${fileName}`,
    licenseLocation: `${GLTF_SAMPLE_ASSETS_FILE_URL}/${model.name}/README.md`,
    sourceRevision: GLTF_SAMPLE_ASSETS_REVISION,
    source: 'khronos-sample-assets'
  };
}
