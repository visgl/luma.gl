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
const graphExplorerExample = readFileSync(
  new URL('../../website/content/examples/experimental/lugraph-explorer.mdx', import.meta.url),
  'utf8'
);
const deckGraphExplorerExample = readFileSync(
  new URL('../../website/content/examples/deck/lugraph-explorer.mdx', import.meta.url),
  'utf8'
);
const privateLayerDocumentation = readFileSync(
  new URL('../../modules/arrow-layers/README.md', import.meta.url),
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
    expect(experimentalOverview.match(/^## GPU-resident Graph Analytics$/gmu)).toHaveLength(1);
    expect(experimentalOverview).toContain('/docs/api-reference/experimental/lugraph');
    expect(experimentalOverview).toContain('/examples/experimental/lugraph-explorer');
    expect(packageDocumentation).toContain('/docs/api-reference/experimental/lugraph');
  });

  test('embeds an honest full-population GPU explorer and explains its practical interactions', () => {
    expect(graphDocumentation).toContain(
      "import {LuGraphExplorerExample} from '@site/src/examples';"
    );
    expect(graphDocumentation).toContain('## Explore a live GPU graph');
    expect(graphDocumentation).toContain(
      '<LuGraphExplorerExample embedded embeddedHeight={680} />'
    );

    for (const documentation of [graphDocumentation, graphExplorerExample]) {
      expect(documentation).toContain('1,024');
      expect(documentation).toContain('1,048,576');
      expect(documentation).toContain('2,097,343');
      expect(documentation).toContain('16,384');
      expect(documentation).toContain('65,536');
      expect(documentation).toContain('512 vertices');
      expect(documentation).toContain('weakly connected');
      expect(documentation).toMatch(/label.propagation/u);
      expect(documentation).toContain('PageRank');
      expect(documentation).toContain('8-byte');
      expect(documentation).toContain('`O(V² + E)`');
      expect(documentation).toContain('`O(E + 4V)`');
    }

    expect(graphExplorerExample).toContain('## Overview');
    expect(graphExplorerExample).toContain('## How to read the network');
    expect(graphExplorerExample).toContain('## Try the controls');
    expect(graphExplorerExample).toContain('## What actually stays on the GPU');
    expect(graphExplorerExample).toContain('## How scale changes the real GPU workload');
    expect(graphExplorerExample).toContain('<LuGraphExplorerExample />');
    expect(graphExplorerExample).toContain('**Choose a graph size**');
    expect(graphExplorerExample).toContain('**Choose a layout mode**');
    expect(graphExplorerExample).toContain('**Choose a node color mode**');
    expect(graphExplorerExample).toContain('**Choose a node size mode**');
    expect(graphExplorerExample).toContain('**Adjust neighborhood depth**');
    expect(graphExplorerExample).toContain('**Toggle original edges**');
    expect(graphExplorerExample).toContain('**Pause or resume the layout**');
    expect(graphExplorerExample).toContain('**Release pins**');
    expect(graphExplorerExample).toContain('**Reset layout**');
    expect(graphExplorerExample).toContain('**Hold Shift and drag**');
    expect(graphExplorerExample).toContain('nonempty, empty, and nonempty');
    expect(graphExplorerExample).toContain('/docs/api-reference/experimental/lugraph');

    for (const documentation of [graphDocumentation, graphExplorerExample]) {
      expect(documentation).toContain('**Label-propagation communities**');
      expect(documentation).toContain('**Weak components**');
      expect(documentation).toContain('**Vertex degree**');
      expect(documentation).toContain('**PageRank importance**');
      expect(documentation).toContain('**Neighborhood distance**');
      expect(documentation).toContain('inspector');
    }
    expect(graphDocumentation).toContain('CPU encoding is never mislabeled');
    expect(graphExplorerExample).toContain('fabricated GPU timing');
  });

  test('distinguishes complete graph residency, bounded visible edges, and real layout modes', () => {
    for (const documentation of [
      graphDocumentation,
      graphExplorerExample,
      deckGraphExplorerExample
    ]) {
      expect(documentation).toContain('1,024');
      expect(documentation).toContain('1,048,576');
      expect(documentation).toContain('2,097,343');
      expect(documentation).toContain('16,384');
      expect(documentation).toContain('65,536');
      expect(documentation).toContain('512 vertices');
      expect(documentation).toContain('O(E + 4V)');
      expect(documentation).toMatch(/flat.grid/u);
      expect(documentation).toMatch(/label.propagation/u);
      expect(documentation).toMatch(/convergen/u);
    }

    expect(graphDocumentation).toContain('Only rendered edge detail');
    expect(graphExplorerExample).toContain('only visible\n  original edges are capped');
    expect(deckGraphExplorerExample).toContain('Only visible original edge detail');
    expect(graphDocumentation).toContain('CPU encoding is never mislabeled');
    expect(deckGraphExplorerExample).toContain('does not invent convergence, timestamps');
    expect(deckGraphExplorerExample).toContain('as an injected callback');
    expect(privateLayerDocumentation).toContain('@deck.gl-community/arrow-layers');
    expect(privateLayerDocumentation).toContain('## Overview');
    expect(privateLayerDocumentation).toContain('## When to use graph layers');
    expect(privateLayerDocumentation).toContain('## Graph effects and layers');
    expect(privateLayerDocumentation).toContain('application-owned sampled-layout contributor');
    expect(privateLayerDocumentation).toContain('never imports application or example source');
    expect(privateLayerDocumentation).toContain('1,048,576');
    expect(privateLayerDocumentation).toContain('2,097,343');
    expect(privateLayerDocumentation).toContain('65,536');
  });

  test('documents opt-in CPU and actual WebGPU benchmarks with reproducible graph workloads', () => {
    expect(graphDocumentation).toContain(
      "import {LuGraphBenchmark} from '@site/src/components/docs/lugraph-benchmark';"
    );
    expect(graphDocumentation).toContain('## Measure real CPU and WebGPU graph workloads');
    expect(graphDocumentation).toContain('<LuGraphBenchmark />');
    expect(graphDocumentation).toContain('32, 64, 128, or 256 vertices');
    expect(graphDocumentation).toContain(
      'No benchmark GPU work runs during page rendering or hydration'
    );
    expect(graphDocumentation).toContain('### Choose a graph that resembles your application');

    for (const graphFamily of [
      '**Sparse:**',
      '**Dense:**',
      '**Scale-free:**',
      '**Disconnected:**',
      '**High-degree hub:**'
    ]) {
      expect(graphDocumentation, graphFamily).toContain(graphFamily);
    }

    expect(graphDocumentation).toContain('`V × (V - 1)` edges');
    expect(graphDocumentation).toContain('including an intentionally empty');
    expect(graphDocumentation).toContain('six genuine GPU algorithms');
    expect(graphDocumentation).toContain('not\nmillion-vertex benchmarks');
    expect(graphDocumentation).toContain("from '@luma.gl/experimental/lugraph/benchmarks';");
    expect(graphDocumentation).toContain('makeLuGraphBenchmarkDataset');
    expect(graphDocumentation).toContain('await runLuGraphBenchmark(device, {');
    expect(experimentalOverview).toContain('opt-in live benchmark');
  });

  test('distinguishes GPU submission, encoding, validation, approximation, and real convergence', () => {
    expect(graphDocumentation).toContain('### Read each timing without hiding its costs');
    expect(graphDocumentation).toContain('**CPU median**');
    expect(graphDocumentation).toContain('**CPU encode**');
    expect(graphDocumentation).toContain('**Fenced GPU median**');
    expect(graphDocumentation).toContain('explicit completion fence');
    expect(graphDocumentation).toContain('does not include the separately reported CPU encoding');
    expect(graphDocumentation).toContain('one warmup and three measured iterations');
    expect(graphDocumentation).toContain('95th-percentile');
    expect(graphDocumentation).toContain('genuinely exposes timestamp queries');
    expect(graphDocumentation).toContain('Source upload, initial command-graph compilation');
    expect(graphDocumentation).toContain('explicit correctness readback');
    expect(graphDocumentation).toContain('independently fenced spatial-grid rebuild');
    expect(graphDocumentation).toContain('measurement still includes the grid rebuild');
    expect(graphDocumentation).toContain('independently computed CPU reference');
    expect(graphDocumentation).toContain('same approximation');
    expect(graphDocumentation).toContain('exact force reference');
    expect(graphDocumentation).toContain('actual\nGPU convergence flag');
    expect(graphDocumentation).toContain('final GPU L1 residual');
    expect(graphDocumentation).toContain('does\nnot imply convergence or early termination');
    expect(graphDocumentation).toContain('they never promise a speedup');
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
    expect(graphDocumentation).toContain('**Question: Which vertices form closely connected');
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
      'LuGraphLabelPropagation',
      'LuGraphPageRank',
      'LuGraphForceLayout',
      'LuGraphSpatialForceLayout'
    ]) {
      expect(graphDocumentation, graphOperation).toContain(graphOperation);
    }

    expect(packageDocumentation).toContain('compressed adjacency');
    expect(packageDocumentation).toContain('vertex-degree queries');
    expect(packageDocumentation).toContain('breadth-first shortest paths');
    expect(packageDocumentation).toContain('weakly connected components');
    expect(packageDocumentation).toContain('deterministic label-propagation communities');
    expect(packageDocumentation).toContain('LuGraphLabelPropagation');
    expect(packageDocumentation).toContain('normalized PageRank');
    expect(packageDocumentation).toContain('progressive exact force-directed layout');
    expect(packageDocumentation).toContain('LuGraphSpatialForceLayout');
    expect(packageDocumentation).toContain('## Overview');
    expect(packageDocumentation).toContain('## When to use luGraph');
    expect(packageDocumentation).toContain('flat-grid approximation');
    expect(graphDocumentation).toContain("from '@luma.gl/experimental/lugraph';");
    expect(graphDocumentation).toContain('topology.addToGraph(workflow);');
    expect(graphDocumentation).toContain('const compiled = workflow.compile();');
    expect(graphDocumentation).toContain('compiled.encode(encoder, {parameters: undefined});');
    expect(graphDocumentation).toContain('device.submit(encoder.finish());');
  });

  test('explains deterministic GPU communities, practical use cases, and honest limitations', () => {
    expect(graphDocumentation).toContain(
      '## Discover densely connected communities with LuGraphLabelPropagation'
    );
    expect(graphDocumentation).toContain('circles of friends');
    expect(graphDocumentation).toContain('transaction accounts');
    expect(graphDocumentation).toContain('service ownership groups');
    expect(graphDocumentation).toContain('one weakly\nconnected component');
    expect(graphDocumentation).toContain('different community label');
    expect(graphDocumentation).toContain('Use weak components to find disconnected islands');
    expect(graphDocumentation).toContain('new LuGraphLabelPropagation({');
    expect(graphDocumentation).toContain('output: communityIds');
    expect(graphDocumentation).toContain('converged: communitiesConverged');
    expect(graphDocumentation).toContain('stable vertex identifier');
    expect(graphDocumentation).toContain("preceding round's complete label snapshot");
    expect(graphDocumentation).toContain('one self\nvote');
    expect(graphDocumentation).toContain('numerically\nlowest label');
    expect(graphDocumentation).toContain('Self-loops add no\nextra self votes');
    expect(graphDocumentation).toContain('duplicate edges and reciprocal directed edges');
    expect(graphDocumentation).toContain('ignored by this unweighted majority vote');
    expect(graphDocumentation).toContain('Directed graphs require both forward and reverse');
    expect(graphDocumentation).toContain('Undirected graphs reuse symmetric forward adjacency');
    expect(graphDocumentation).toContain("GPUVector<'uint32'>");
    expect(graphDocumentation).toContain('default is `32` synchronous rounds');
    expect(graphDocumentation).toContain('an integer from `1`');
    expect(graphDocumentation).toContain('through `1024`');
    expect(graphDocumentation).toContain('or early termination');
    expect(graphDocumentation).toContain('final round changes no labels');
    expect(graphDocumentation).toContain('graphs can oscillate');
    expect(graphDocumentation).toContain('An empty graph reports');
    expect(graphDocumentation).toContain('an isolated vertex retains its own identifier');
    expect(graphDocumentation).toContain('all output labels become `0xffffffff`');
    expect(graphDocumentation).toContain('`converged` becomes zero');
    expect(graphDocumentation).toContain('`O(sum(degree²))` per round');
    expect(graphDocumentation).toContain('a high-degree hub');
    expect(graphDocumentation).toContain('not Louvain or Leiden');
    expect(graphDocumentation).toContain('does not optimize modularity');
    expect(graphDocumentation).toContain('does not\nguarantee objectively correct communities');
    expect(packageDocumentation).toContain('find disconnected\nislands');
    expect(packageDocumentation).toContain('inside a connected island');
    expect(packageDocumentation).toContain('does not guarantee convergence');
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

  test('explains optional spatial approximation, practical use cases, and honest scaling', () => {
    expect(graphDocumentation).toContain(
      '## Approximate distant forces with LuGraphSpatialForceLayout'
    );
    expect(graphDocumentation).toContain('**Question: How can I make a larger relationship map');
    expect(graphDocumentation).toContain('nearby pedestrians need individual attention');
    expect(graphDocumentation).toContain('interactive dependency map');
    expect(graphDocumentation).toContain('transaction investigation');
    expect(graphDocumentation).toContain('### Accuracy and spatial controls');
    expect(graphDocumentation).toContain('### Bounds, buffers, and failure behavior');
    expect(graphDocumentation).toContain('### Cost and when acceleration helps');
    expect(graphDocumentation).toContain('population-weighted center of mass');
    expect(graphDocumentation).toContain('`cellDiagonal / distanceToCellCenter < theta`');
    expect(graphDocumentation).toContain('default `theta: 0.6`');
    expect(graphDocumentation).toContain('`theta: 0`');
    expect(graphDocumentation).toContain('`nearCellRadius`');
    expect(graphDocumentation).toContain('up to eight surrounding cells');
    expect(graphDocumentation).toContain('No distant vertex is silently dropped');
    expect(graphDocumentation).toContain('flat uniform-grid monopole approximation');
    expect(graphDocumentation).toContain('not hierarchical');
    expect(graphDocumentation).toContain('Barnes–Hut, ForceAtlas2');
    expect(graphDocumentation).toContain('not guarantee subquadratic complexity');
    expect(graphDocumentation).toContain('`Θ(V × G + P + E)`');
    expect(graphDocumentation).toContain('`Θ(V + G)` caller-owned grid storage');
    expect(graphDocumentation).toContain('worst case can return to `Θ(V² + E)`');
    expect(graphDocumentation).toContain('without floating-point atomics');
  });

  test('documents explicit spatial buffers, complete indexing, and fail-closed ownership', () => {
    expect(graphDocumentation).toContain(
      'inclusive `bounds: [minimumX, minimumY, maximumX, maximumY]`'
    );
    expect(graphDocumentation).toContain("`cellOffsets`: `GPUVector<'uint32'>`");
    expect(graphDocumentation).toContain('exactly `G + 1` rows');
    expect(graphDocumentation).toContain("`vertexIds`: `GPUVector<'uint32'>`");
    expect(graphDocumentation).toContain("`cellCenters`: `GPUVector<'float32x2'>`");
    expect(graphDocumentation).toContain('exactly `G` rows');
    expect(graphDocumentation).toContain("`count`: a one-row `GPUVector<'uint32'>`");
    expect(graphDocumentation).toContain("`overflow`: a one-row `GPUVector<'uint32'>`");
    expect(graphDocumentation).toContain('physically distinct buffer allocations');
    expect(graphDocumentation).toContain('on every spatial force iteration');
    expect(graphDocumentation).toContain('Bounds do not');
    expect(graphDocumentation).toContain('expand automatically');
    expect(graphDocumentation).toContain('`count` smaller than `vertexCount`');
    expect(graphDocumentation).toContain('it preserves every existing position and clears all');
    expect(graphDocumentation).toContain(
      'existing edge-weight columns remain intentionally unused'
    );
    expect(graphDocumentation).toContain('new LuGraphSpatialForceLayout({');
    expect(graphDocumentation).toContain('spatialLayout.addToGraph(workflow);');
    expect(graphDocumentation).toContain(
      'Replace the spatial contributor with `layout.addToGraph(workflow)`'
    );
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
