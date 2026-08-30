// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {assertSupportedGLTFExtensions, getRegisteredGLTFExtensions} from '@luma.gl/gltf';
import {getGLTFReferenceLedger} from '../../../../examples/showcase/gltf/gltf-reference-ledger';
import {
  getGLTFReferenceCaptureOptions,
  getGLTFReferenceDrawMetrics
} from '../../../../examples/showcase/gltf/gltf-reference-evidence';

describe('glTF reference ledger', () => {
  test('pins the Khronos assets and viewer revisions', () => {
    const ledger = getGLTFReferenceLedger();

    expect(ledger.sampleAssetsRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(ledger.sampleViewerRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(ledger.sampleViewerReleaseRevision).toMatch(/^[0-9a-f]{40}$/);
    expect(ledger.sampleAssetsSource).toContain(ledger.sampleAssetsRevision);
    expect(ledger.sampleViewerSource).toContain(ledger.sampleViewerRevision);
    expect(ledger.sampleViewerReleaseSource).toContain(ledger.sampleViewerReleaseRevision);
  });

  test('provides a licensed positive fixture for every supported extension', () => {
    const supportedEntries = getGLTFReferenceLedger().extensions.filter(
      extension => extension.supported
    );

    expect(supportedEntries).toHaveLength(26);
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

  test('parses deterministic capture options without accepting invalid numeric values', () => {
    expect(getGLTFReferenceCaptureOptions('?other=1')).toBeUndefined();
    expect(
      getGLTFReferenceCaptureOptions(
        '?gltf-reference=1&model=Triangle&variant=glTF-Binary&file=fixture.glb&yaw=0.5&pitch=bad&distance=0'
      )
    ).toEqual({
      modelName: 'Triangle',
      variant: 'glTF-Binary',
      fileName: 'fixture.glb',
      yaw: 0.5,
      pitch: -0.15,
      distanceMultiplier: 0.05
    });
    expect(
      getGLTFReferenceCaptureOptions(
        '?gltf-reference=1&model=RobotExpressive&variant=glTF-Binary&file=RobotExpressive.glb&studio=1&actors=3&actor=9&clip=Walking&animation-time=0.65&speed=1.25&loop=once&morph=Angry&morph-weight=0.6&camera=-1'
      )
    ).toEqual(
      expect.objectContaining({
        studio: {
          actorCount: 3,
          selectedActorIndex: 2,
          clipName: 'Walking',
          time: 0.65,
          speed: 1.25,
          loop: 'once',
          morphTarget: 'Angry',
          morphWeight: 0.6,
          variant: '',
          cameraIndex: null
        }
      })
    );
  });

  test('counts indexed and non-indexed submitted geometry across instances', () => {
    expect(
      getGLTFReferenceDrawMetrics([
        {
          topology: 'triangle-list',
          isInstanced: true,
          instanceCount: 2,
          vertexCount: 0,
          indexBuffer: {byteLength: 12, indexType: 'uint16'}
        },
        {
          topology: 'triangle-strip',
          instanceCount: 0,
          vertexCount: 5,
          indexBuffer: null
        }
      ])
    ).toEqual({
      drawCount: 2,
      submittedIndexReferences: 12,
      submittedVertexReferences: 5,
      triangleCount: 7
    });
  });
});
