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
    expect(graphDocumentation).toContain('**Question: How can I position connected entities');
  });

  test('introduces every available operation and composes its actual optional entry point', () => {
    for (const graphOperation of [
      'LuGraph',
      'LuGraphTopology',
      'LuGraphDegree',
      'LuGraphBreadthFirstSearch',
      'LuGraphConnectedComponents',
      'LuGraphPageRank',
      'LuGraphForceLayout'
    ]) {
      expect(graphDocumentation, graphOperation).toContain(graphOperation);
    }

    expect(packageDocumentation).toContain('compressed adjacency');
    expect(packageDocumentation).toContain('vertex-degree queries');
    expect(packageDocumentation).toContain('breadth-first shortest paths');
    expect(packageDocumentation).toContain('weakly connected components');
    expect(packageDocumentation).toContain('normalized PageRank');
    expect(packageDocumentation).toContain('progressive exact force-directed layout');
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

  test('explains exact render-ready force layout, interaction controls, and scalability limits', () => {
    expect(graphDocumentation).toContain('## Reveal relationships with LuGraphForceLayout');
    expect(graphDocumentation).toContain('a social graph');
    expect(graphDocumentation).toContain('service dependencies');
    expect(graphDocumentation).toContain('transaction investigation');
    expect(graphDocumentation).toContain("GPUVector<'float32x2'>");
    expect(graphDocumentation).toContain('`Buffer.STORAGE` and\n`Buffer.VERTEX`');
    expect(graphDocumentation).toContain('an application can bind as a');
    expect(graphDocumentation).toContain('render vertex attribute');
    expect(graphDocumentation).toContain('requires both forward and reverse adjacency');
    expect(graphDocumentation).toContain('intentionally ignored by this unweighted');
    expect(graphDocumentation).toContain('`pinned` row to any nonzero value');
    expect(graphDocumentation).toContain('one-row `uint32` `reset` vector');
    expect(graphDocumentation).toContain('clearing it');
    expect(graphDocumentation).toContain('warm-start from the');
    expect(graphDocumentation).toContain('`seed: 0`, `iterationsPerFrame: 4`');
    expect(graphDocumentation).toContain('`repulsion: 1`, `attraction: 0.1`');
    expect(graphDocumentation).toContain('`gravity: 0.01`, `damping: 0.9`');
    expect(graphDocumentation).toContain('`maxVelocity: 1`, and `timeStep: 1`');
    expect(graphDocumentation).toContain('`O(V² + E)`');
    expect(graphDocumentation).toContain('doubling the vertex count roughly quadruples');
    expect(graphDocumentation).toContain(
      'preserves\nevery existing position and clears all velocities'
    );
    expect(graphDocumentation).toContain('does not approximate pairwise interactions');
    expect(graphDocumentation).toContain('ForceAtlas2 or Barnes–Hut');
    expect(graphDocumentation).toContain('new LuGraphForceLayout({');
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
