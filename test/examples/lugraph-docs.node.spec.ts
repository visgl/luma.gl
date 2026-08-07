// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const graphDocumentation = readFileSync(
  new URL('../../docs/api-reference/experimental/lugraph.md', import.meta.url),
  'utf8'
);
const packageDocumentation = readFileSync(
  new URL('../../modules/experimental/src/lugraph/README.md', import.meta.url),
  'utf8'
);
const experimentalOverview = readFileSync(
  new URL('../../docs/api-reference/experimental/README.md', import.meta.url),
  'utf8'
);
const sidebar = readFileSync(new URL('../../docs/table-of-contents.json', import.meta.url), 'utf8');
const experimentalTabs = readFileSync(
  new URL('../../website/src/components/docs/experimental-docs-tabs.tsx', import.meta.url),
  'utf8'
);

describe('luGraph GPU-resident graph analytics documentation', () => {
  test('publishes one canonical guide in both experimental sidebars, overview, and tabs', () => {
    expect(graphDocumentation).toContain('# luGraph: GPU-Resident Graph Analytics');
    expect(graphDocumentation).toContain('<ExperimentalDocsTabs active="lugraph" />');
    expect(sidebar.match(/"api-reference\/experimental\/lugraph"/gu)).toHaveLength(2);
    expect(experimentalTabs).toContain("| 'lugraph'");
    expect(experimentalTabs).toContain("href: '/docs/api-reference/experimental/lugraph'");
    expect(experimentalOverview).toContain('## GPU-resident Graph Analytics');
    expect(experimentalOverview).toContain('/docs/api-reference/experimental/lugraph');
    expect(packageDocumentation).toContain('/docs/api-reference/experimental/lugraph');
  });

  test('explains graph motivation, appropriate workloads, and concrete application use cases', () => {
    expect(graphDocumentation).toContain('## Overview');
    expect(graphDocumentation).toContain('## Why keep a graph on the GPU?');
    expect(graphDocumentation).toContain('## When should I use luGraph?');
    expect(graphDocumentation).toContain('Social and communication networks');
    expect(graphDocumentation).toContain('Software and service dependencies');
    expect(graphDocumentation).toContain('Transaction and fraud investigations');
    expect(graphDocumentation).toContain('Transport and infrastructure maps');
    expect(graphDocumentation).toContain('Knowledge and citation graphs');
    expect(graphDocumentation).toContain('A small, CPU-resident, one-off analysis');
    expect(graphDocumentation).toContain('**Question: How many direct relationships');
    expect(graphDocumentation).toContain('**Question: Which entities can I reach');
    expect(graphDocumentation).toContain('**Question: Which vertices belong to the same connected');
    expect(graphDocumentation).toContain('**Question: Which vertices receive influence');
  });

  test('introduces every available operation and composes its actual optional entry point', () => {
    for (const graphOperation of [
      'LuGraph',
      'LuGraphTopology',
      'LuGraphDegree',
      'LuGraphBreadthFirstSearch',
      'LuGraphConnectedComponents',
      'LuGraphPageRank'
    ]) {
      expect(graphDocumentation, graphOperation).toContain(graphOperation);
    }

    expect(packageDocumentation).toContain('compressed adjacency');
    expect(packageDocumentation).toContain('vertex-degree queries');
    expect(packageDocumentation).toContain('breadth-first shortest paths');
    expect(packageDocumentation).toContain('weakly connected components');
    expect(packageDocumentation).toContain('normalized PageRank');
    expect(graphDocumentation).toContain("from '@luma.gl/experimental/lugraph';");
    expect(graphDocumentation).toContain('topology.addToGraph(workflow);');
    expect(graphDocumentation).toContain('const compiled = workflow.compile();');
    expect(graphDocumentation).toContain('compiled.encode(encoder, {parameters: undefined});');
    expect(graphDocumentation).toContain('device.submit(encoder.finish());');
  });

  test('documents overflow, direction, probability, iteration, and ownership boundaries honestly', () => {
    expect(graphDocumentation).toContain('`vertexCount + 1` rows');
    expect(graphDocumentation).toContain(
      'Neighbor order within each vertex is intentionally unspecified'
    );
    expect(graphDocumentation).toContain('Degrees come from complete CSR offsets');
    expect(graphDocumentation).toContain('Directed weak components use forward adjacency');
    expect(graphDocumentation).toContain('Directed graphs require reverse CSR');
    expect(graphDocumentation).toContain('dangling vertices with no outgoing edges');
    expect(graphDocumentation).toContain('default damping is `0.85`');
    expect(graphDocumentation).toContain('85% chance of following an outgoing link');
    expect(graphDocumentation).toContain('15% chance of jumping to a uniformly chosen vertex');
    expect(graphDocumentation).toContain('default bounded iteration count is `40`');
    expect(graphDocumentation).toContain("final iteration's L1 score change");
    expect(graphDocumentation).toContain('absolute differences between the last two normalized');
    expect(graphDocumentation).toContain('not an automatic convergence threshold');
    expect(graphDocumentation).toContain('physically distinct GPU buffer allocations');
    expect(graphDocumentation).toContain('does not imply distributed or multi-GPU execution');
  });

  test('preserves independent MIT ownership and accurate NVIDIA RAPIDS inspiration', () => {
    for (const documentation of [graphDocumentation, packageDocumentation]) {
      expect(documentation).toContain('NVIDIA RAPIDS cuGraph');
      expect(documentation).toContain('https://github.com/rapidsai/cugraph');
      expect(documentation).toContain('Apache License 2.0');
      expect(documentation).toContain('MIT-licensed');
      expect(documentation).toContain('does not copy or translate cuGraph source code');
      expect(documentation).toMatch(/endorse(?:d|ment)/u);
    }
  });
});
