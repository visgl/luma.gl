// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {getExampleThumbnailPath} from '../../website/src/example-thumbnails';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

const EXAMPLE_IMAGES_DIRECTORY = path.join(process.cwd(), 'website/static/images/examples');
const RECOVERED_FLAGSHIP_EXAMPLES = [
  'showcase/globe',
  'showcase/billion-point-spatial-atlas',
  'showcase/postprocessing',
  'experimental/scene-playground'
] as const;
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
]);

describe('live example catalog thumbnails', () => {
  test('resolves every authoritative sidebar example to an existing gallery image', () => {
    const exampleIdentifiers = readLiveExampleIdentifiers();

    expect(exampleIdentifiers.length).toBeGreaterThan(0);
    expect(exampleIdentifiers).not.toContain('v10/gpgpu');
    expect(exampleIdentifiers).toContain('experimental/scene-playground');

    for (const exampleIdentifier of exampleIdentifiers) {
      const thumbnailPath = resolveExampleThumbnailPath(exampleIdentifier);

      expect(existsSync(thumbnailPath), `${exampleIdentifier} is missing its gallery image`).toBe(
        true
      );
      expect(statSync(thumbnailPath).isFile(), `${exampleIdentifier} must resolve to a file`).toBe(
        true
      );
      expect(
        statSync(thumbnailPath).size,
        `${exampleIdentifier} has an empty gallery image`
      ).toBeGreaterThan(0);
    }

    expect(resolveExampleThumbnailPath('experimental/scene-playground')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'experimental/scene-playground.jpg')
    );
    expect(resolveExampleThumbnailPath('experimental/gpu-trace-scene')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'experimental/gpu-trace-viewer.jpg')
    );
    expect(resolveExampleThumbnailPath('experimental/gpu-scene-graph')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'experimental/gpu-frustum-culling.jpg')
    );
    expect(resolveExampleThumbnailPath('showcase/gaussian-splat-viewer')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'showcase/gaussian-splat-viewer.jpg')
    );
    expect(resolveExampleThumbnailPath('showcase/gaussian-splat-viewer')).not.toBe(
      resolveExampleThumbnailPath('showcase/gaussian-splats')
    );
  });

  test('keeps recovered flagship posters as genuine widescreen JPEG images', () => {
    for (const exampleIdentifier of RECOVERED_FLAGSHIP_EXAMPLES) {
      expect(
        readJpegDimensions(resolveExampleThumbnailPath(exampleIdentifier)),
        `${exampleIdentifier} must use an authentic 1280×720 JPEG poster`
      ).toEqual({width: 1280, height: 720});
    }
  });

  test('keeps the HDR Globe visibly rendered with interoperable gain-map metadata', () => {
    const globeImageBytes = readFileSync(resolveExampleThumbnailPath('showcase/globe'));

    expect(
      globeImageBytes.includes(Buffer.from('urn:iso:std:iso:ts:21496:-1')),
      'The Globe poster must preserve ISO 21496-1 gain-map metadata'
    ).toBe(true);
    expect(
      globeImageBytes.includes(Buffer.from('http://ns.adobe.com/hdr-gain-map/1.0/')),
      'The Globe poster must preserve Ultra HDR XMP gain-map metadata'
    ).toBe(true);
    expect(
      countDistinctJpegScanByteValues(globeImageBytes),
      'The Globe poster must contain visibly rendered content instead of a flat-color JPEG scan'
    ).toBeGreaterThan(32);
  });
});

function readLiveExampleIdentifiers(): string[] {
  const tableOfContents = JSON.parse(
    readFileSync(
      path.join(process.cwd(), 'website/content/examples/table-of-contents.json'),
      'utf8'
    )
  ) as ExampleSidebarEntry[];
  const exampleIdentifiers: string[] = [];

  const visitEntries = (entries: ExampleSidebarEntry[]): void => {
    for (const entry of entries) {
      if (typeof entry === 'string') {
        exampleIdentifiers.push(entry);
      } else if (entry.type === 'category') {
        visitEntries(entry.items);
      } else if (entry.id !== 'index') {
        exampleIdentifiers.push(entry.id);
      }
    }
  };

  visitEntries(tableOfContents);
  return exampleIdentifiers;
}

function resolveExampleThumbnailPath(exampleIdentifier: string): string {
  return path.join(EXAMPLE_IMAGES_DIRECTORY, getExampleThumbnailPath(exampleIdentifier));
}

function countDistinctJpegScanByteValues(imageBytes: Buffer): number {
  const startOfScanOffset = imageBytes.indexOf(Buffer.from([0xff, 0xda]));
  if (startOfScanOffset < 0 || startOfScanOffset + 4 > imageBytes.length) {
    throw new Error('The JPEG image does not contain a complete scan header');
  }

  const scanHeaderLength = imageBytes.readUInt16BE(startOfScanOffset + 2);
  const scanDataOffset = startOfScanOffset + 2 + scanHeaderLength;
  const endOfImageOffset = imageBytes.indexOf(Buffer.from([0xff, 0xd9]), scanDataOffset);

  if (scanHeaderLength < 2 || endOfImageOffset <= scanDataOffset) {
    throw new Error('The JPEG image does not contain a complete image scan');
  }

  return new Set(imageBytes.subarray(scanDataOffset, endOfImageOffset)).size;
}

function readJpegDimensions(imagePath: string): {width: number; height: number} {
  const imageBytes = readFileSync(imagePath);

  if (imageBytes.length < 4 || imageBytes.readUInt16BE(0) !== 0xffd8) {
    throw new Error(`${imagePath} is not a JPEG image`);
  }

  let segmentOffset = 2;
  while (segmentOffset < imageBytes.length) {
    if (imageBytes[segmentOffset] !== 0xff) {
      throw new Error(`${imagePath} contains an invalid JPEG segment`);
    }

    while (imageBytes[segmentOffset] === 0xff) {
      segmentOffset++;
    }

    if (segmentOffset >= imageBytes.length) {
      break;
    }

    const segmentMarker = imageBytes[segmentOffset++];
    if (segmentMarker === 0xd9 || segmentMarker === 0xda) {
      break;
    }
    if (segmentMarker === 0xd8 || (segmentMarker >= 0xd0 && segmentMarker <= 0xd7)) {
      continue;
    }
    if (segmentOffset + 2 > imageBytes.length) {
      throw new Error(`${imagePath} contains a truncated JPEG segment`);
    }

    const segmentLength = imageBytes.readUInt16BE(segmentOffset);
    if (segmentLength < 2 || segmentOffset + segmentLength > imageBytes.length) {
      throw new Error(`${imagePath} contains an invalid JPEG segment length`);
    }

    if (JPEG_START_OF_FRAME_MARKERS.has(segmentMarker)) {
      if (segmentLength < 7) {
        throw new Error(`${imagePath} contains a truncated JPEG frame header`);
      }

      const height = imageBytes.readUInt16BE(segmentOffset + 3);
      const width = imageBytes.readUInt16BE(segmentOffset + 5);
      if (width === 0 || height === 0) {
        throw new Error(`${imagePath} contains an invalid JPEG frame size`);
      }
      return {width, height};
    }

    segmentOffset += segmentLength;
  }

  throw new Error(`${imagePath} does not contain a JPEG frame header`);
}
