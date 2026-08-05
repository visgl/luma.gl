// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as luGraphModule from '@luma.gl/experimental/lugraph';
import {describe, expect, test} from 'vitest';

import {createLuGraphExplorerDeck} from '../../../../examples/deck/lugraph-explorer/app';
import {
  LUGRAPH_DECK_EDGE_SHADER,
  LuGraphEdgeLayer
} from '../../../../examples/deck/lugraph-explorer/lugraph-edge-layer';
import {LuGraphDeckEffect} from '../../../../examples/deck/lugraph-explorer/lugraph-effect';
import {
  LUGRAPH_DECK_NODE_SHADER,
  LuGraphNodeLayer
} from '../../../../examples/deck/lugraph-explorer/lugraph-node-layer';
import {makeGraphExplorerDataset} from '../../../../examples/experimental/lugraph-explorer/graph-data';
import {getExampleThumbnailPath} from '../../../../website/src/example-thumbnails';

type ExampleContentsEntry = {
  type: string;
  label?: string;
  id?: string;
  items?: Array<string | ExampleContentsEntry>;
};

describe('optional luGraph deck.gl integration package isolation', () => {
  test('keeps deck.gl entirely outside graph production imports and dependencies', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    for (const dependencies of [
      packageJson.dependencies,
      packageJson.peerDependencies,
      packageJson.optionalDependencies
    ]) {
      expect(Object.keys(dependencies ?? {}).some(name => name.startsWith('@deck.gl/'))).toBe(
        false
      );
    }
    expect('LuGraphDeckEffect' in experimentalModule).toBe(false);
    expect('LuGraphDeckEffect' in luGraphModule).toBe(false);
    expect('LuGraphNodeLayer' in luGraphModule).toBe(false);
    expect('LuGraphEdgeLayer' in luGraphModule).toBe(false);
  });

  test('does not create an example workspace, package manifest, or integration dependency', () => {
    expect(
      existsSync(
        new URL('../../../../examples/deck/lugraph-explorer/package.json', import.meta.url)
      )
    ).toBe(false);
    expect(typeof createLuGraphExplorerDeck).toBe('function');
    expect(typeof LuGraphDeckEffect).toBe('function');
  });
});

describe('luGraph native deck.gl resident layers', () => {
  test('exposes actual deck.gl node and original-partition edge layer classes', () => {
    expect(LuGraphNodeLayer.layerName).toBe('LuGraphNodeLayer');
    expect(LuGraphEdgeLayer.layerName).toBe('LuGraphEdgeLayer');

    const dataset = makeGraphExplorerDataset();
    expect(dataset.sourceChunks.map(chunk => chunk.length)).toEqual(
      dataset.targetChunks.map(chunk => chunk.length)
    );
    expect(dataset.sourceChunks).toHaveLength(3);
    expect(dataset.sourceChunks[1]).toHaveLength(0);
    expect(dataset.sourceChunks.filter(chunk => chunk.length > 0)).toHaveLength(2);
  });

  test('fetches actual position vertices, GPU analytics, and stable original picking identifiers', () => {
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('@location(0) nodePosition: vec2<f32>');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('importance: array<f32>');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('components: array<u32>');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('distances: array<u32>');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('selectionMask: array<u32>');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('vertex + 1u');
    expect(LUGRAPH_DECK_NODE_SHADER).toContain('geometry.pickingColor');
    expect(LUGRAPH_DECK_NODE_SHADER).not.toMatch(/atomic\s*<\s*f32\s*>/);
  });

  test('reads source and target edge chunks directly without concatenation or CPU staging', () => {
    expect(LUGRAPH_DECK_EDGE_SHADER).toContain('sourceVertices: array<u32>');
    expect(LUGRAPH_DECK_EDGE_SHADER).toContain('targetVertices: array<u32>');
    expect(LUGRAPH_DECK_EDGE_SHADER).toContain('positions: array<vec2<f32>>');

    const effectSource = readFileSync(
      new URL('../../../../examples/deck/lugraph-explorer/lugraph-effect.ts', import.meta.url),
      'utf8'
    );
    expect(effectSource).toContain('this.device.commandEncoder');
    expect(effectSource).not.toMatch(/\bdevice\.submit\s*\(/);
    expect(effectSource).not.toMatch(/\.readAsync\s*\(/);
  });
});

describe('optional luGraph deck.gl gallery and API guide', () => {
  test('registers lazy loading and a WebGPU-only GPGPU gallery destination', () => {
    const examples = readFileSync(
      new URL('../../../../website/src/examples.tsx', import.meta.url),
      'utf8'
    );
    const contents = JSON.parse(
      readFileSync(
        new URL('../../../../website/content/examples/table-of-contents.json', import.meta.url),
        'utf8'
      )
    ) as ExampleContentsEntry[];
    const gpuCategory = contents.find(category => category.label === 'GPGPU');
    const graphModulesCategory = gpuCategory?.items?.find(
      (item): item is ExampleContentsEntry =>
        typeof item !== 'string' && item.label === 'GPGPU Graph Modules'
    );

    expect(examples).toContain(
      "const loadLuGraphExplorerDeckExample = () => import('../../examples/deck/lugraph-explorer/app')"
    );
    expect(examples).toContain('useDeferredExampleModule(loadLuGraphExplorerDeckExample)');
    expect(examples).toContain('createDeck: module.createLuGraphExplorerDeck');
    expect(examples).not.toMatch(/^import\s+\{createLuGraphExplorerDeck\}\s+from/m);
    expect(
      graphModulesCategory?.items?.some(
        item => typeof item !== 'string' && item.id === 'deck/lugraph-explorer'
      )
    ).toBe(true);
  });

  test('provides curated WebGPU metadata, an existing network thumbnail, and optional API guidance', () => {
    const examplePage = readFileSync(
      new URL('../../../../website/content/examples/deck/lugraph-explorer.mdx', import.meta.url),
      'utf8'
    );
    const apiGuide = readFileSync(
      new URL('../../../../docs/api-reference/experimental/lugraph.md', import.meta.url),
      'utf8'
    );
    const topics = examplePage
      .match(/topics:\s*\[([^\]]+)\]/)?.[1]
      .split(',')
      .map(topic => topic.trim());

    expect(examplePage).toContain('backends: [webgpu]');
    expect(examplePage).toContain('<DeckLuGraphExplorerExample />');
    expect(topics?.length).toBeGreaterThanOrEqual(2);
    expect(topics?.length).toBeLessThanOrEqual(5);
    expect(new Set(topics).size).toBe(topics?.length);
    expect(getExampleThumbnailPath('deck/lugraph-explorer')).toBe('showcase/packet-spraying.jpg');
    expect(apiGuide).toContain('/examples/deck/lugraph-explorer');
    expect(apiGuide).toContain("deck.gl's own command");
    expect(apiGuide).toContain('without concatenation, buffer copies, or per-frame graph readback');
  });

  test('explains when deck.gl graph integration is useful and how to explore it', () => {
    const examplePage = readFileSync(
      new URL('../../../../website/content/examples/deck/lugraph-explorer.mdx', import.meta.url),
      'utf8'
    );

    for (const section of [
      '## Overview',
      '## Why combine luGraph and deck.gl?',
      '## When should I use this integration?',
      '## How the GPU-resident frame works',
      '## Try the controls',
      '## What actually stays on the GPU',
      '## Boundaries and performance'
    ]) {
      expect(examplePage, section).toContain(section);
    }

    for (const useCase of [
      'Social and communication networks',
      'Service and package dependencies',
      'Transaction and fraud investigations',
      'Knowledge and citation maps'
    ]) {
      expect(examplePage, useCase).toContain(useCase);
    }

    for (const control of [
      '**Hover a node**',
      '**Click a node**',
      '**Adjust neighborhood depth**',
      '**Drag a node**',
      '**Release pins**',
      '**Reset layout**',
      '**Pan and zoom**'
    ]) {
      expect(examplePage, control).toContain(control);
    }

    expect(examplePage).toContain('128-vertex');
    expect(examplePage).toContain('`O(V² + E)`');
    expect(examplePage).toContain('not a large-graph');
    expect(examplePage).toContain('does not enable the optional spatial approximation');
    expect(examplePage).toContain('/docs/api-reference/experimental/lugraph');
    expect(examplePage).toContain('/examples/experimental/lugraph-explorer');
  });

  test('documents direct GPU frame ownership and honest asynchronous deck.gl picking', () => {
    const examplePage = readFileSync(
      new URL('../../../../website/content/examples/deck/lugraph-explorer.mdx', import.meta.url),
      'utf8'
    );
    const apiGuide = readFileSync(
      new URL('../../../../docs/api-reference/experimental/lugraph.md', import.meta.url),
      'utf8'
    );

    expect(examplePage).toContain('Upload the demonstration fixture once');
    expect(examplePage).toContain('intentionally empty batch');
    expect(examplePage).toContain('LuGraphDeckEffect');
    expect(examplePage).toContain('LuGraphNodeLayer');
    expect(examplePage).toContain('LuGraphEdgeLayer');
    expect(examplePage).toContain('not\n   community-detection results');
    expect(examplePage).toContain('deck.gl owns queue');
    expect(examplePage).toContain('`Buffer.STORAGE` and `Buffer.VERTEX`');
    expect(examplePage).toContain('returns a requested selected-vertex result to JavaScript');
    expect(examplePage).toContain('`PickingInfo.index`');
    expect(examplePage).toContain('deck.gl owns that picking implementation and its transfer size');

    expect(apiGuide).toContain('## Overview');
    expect(apiGuide).toContain('## Why keep a graph on the GPU?');
    expect(apiGuide).toContain('## When should I use luGraph?');
    expect(apiGuide).toContain('<LuGraphExplorerExample embedded embeddedHeight={680} />');
    expect(apiGuide).toContain('<LuGraphBenchmark />');
    expect(apiGuide).toContain('## Approximate distant forces with LuGraphSpatialForceLayout');
    expect(apiGuide).toContain('### Use luGraph from deck.gl without copying graph buffers');
    expect(apiGuide).toContain("separate from the native explorer's custom **8-byte**");
    expect(apiGuide).toContain('The deterministic example fixture is uploaded once');
  });
});
