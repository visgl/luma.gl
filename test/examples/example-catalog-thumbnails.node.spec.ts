// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

const EXAMPLE_IMAGES_DIRECTORY = path.join(process.cwd(), 'website/static/images/examples');
const RECOVERED_FLAGSHIP_EXAMPLES = [
  'showcase/billion-point-spatial-atlas',
  'deck/luspatial-taxi',
  'deck/gpu-culled-trace',
  'showcase/postprocessing',
  'experimental/anari-playground'
] as const;
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
]);

describe('live example catalog thumbnails', () => {
  test('resolves every authoritative sidebar example to an existing gallery image', () => {
    const exampleIdentifiers = readLiveExampleIdentifiers();

    expect(exampleIdentifiers.length).toBeGreaterThan(0);
    expect(exampleIdentifiers).toContain('v10/gpgpu');
    expect(exampleIdentifiers).toContain('experimental/anari-playground');

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

    expect(resolveExampleThumbnailPath('v10/gpgpu')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'gpu-tables/gpu-vector-storage-particles.jpg')
    );
    expect(resolveExampleThumbnailPath('experimental/anari-playground')).toBe(
      path.join(EXAMPLE_IMAGES_DIRECTORY, 'experimental/anari-playground.jpg')
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
  const thumbnailName =
    exampleIdentifier === 'v10/gpgpu'
      ? 'gpu-tables/gpu-vector-storage-particles.jpg'
      : `${exampleIdentifier}.jpg`;

  return path.join(EXAMPLE_IMAGES_DIRECTORY, thumbnailName);
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
