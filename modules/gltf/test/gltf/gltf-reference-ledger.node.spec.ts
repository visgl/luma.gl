// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {assertSupportedGLTFExtensions, getRegisteredGLTFExtensions} from '@luma.gl/gltf';
import {getGLTFReferenceLedger} from '../../../../examples/showcase/gltf/gltf-reference-ledger';

describe('glTF reference ledger', () => {
  test('pins the Khronos assets and viewer revisions', () => {
    const ledger = getGLTFReferenceLedger();

    expect(ledger.sampleAssetsRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(ledger.sampleViewerRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(ledger.sampleAssetsSource).toContain(ledger.sampleAssetsRevision);
    expect(ledger.sampleViewerSource).toContain(ledger.sampleViewerRevision);
  });

  test('provides a licensed positive fixture for every supported extension', () => {
    const supportedEntries = getGLTFReferenceLedger().extensions.filter(
      extension => extension.supported
    );

    expect(supportedEntries).toHaveLength(25);
    expect(
      supportedEntries
        .filter(extension => !extension.positiveFixture)
        .map(extension => extension.extensionName)
    ).toEqual([]);

    for (const extension of supportedEntries) {
      const fixture = extension.positiveFixture!;
      expect(fixture.licenseLocation).toBeTruthy();
      if (fixture.source === 'khronos-sample-assets') {
        expect(fixture.sourceRevision).toMatch(/^[0-9a-f]{40}$/);
        expect(fixture.assetLocation).toContain(fixture.sourceRevision);
        expect(fixture.licenseLocation).toContain(fixture.sourceRevision);
      } else {
        expect(existsSync(fixture.assetLocation)).toBe(true);
      }
    }
  });

  test('keeps the unsupported-required fixture synchronized with the registry', () => {
    const ledger = getGLTFReferenceLedger();
    const fixture = JSON.parse(
      readFileSync(ledger.unsupportedRequiredFixture.assetLocation, 'utf8')
    ) as GLTFPostprocessed;
    const unsupportedExtensionNames = getRegisteredGLTFExtensions()
      .filter(extension => extension.supportLevel === 'none')
      .map(extension => extension.extensionName);

    expect(fixture.extensionsRequired).toEqual(unsupportedExtensionNames);
    expect(ledger.unsupportedRequiredFixture.extensionNames).toEqual(unsupportedExtensionNames);
    expect(() => assertSupportedGLTFExtensions(fixture)).toThrow(
      `Unsupported required glTF extensions: ${unsupportedExtensionNames.join(', ')}`
    );
  });
});
