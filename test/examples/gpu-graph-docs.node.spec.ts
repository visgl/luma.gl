// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {describe, expect, test} from 'vitest';

const graphOverviewDocumentation = readFileSync(
  new URL('../../docs/api-reference/experimental/gpu-graph.md', import.meta.url),
  'utf8'
);
const graphOperationsDocumentation = [
  'gpu-graph-operations.md',
  'gpu-graph-topology.md',
  'gpu-graph-traversal.md',
  'gpu-graph-connectivity.md',
  'gpu-graph-metrics.md',
  'gpu-graph-layouts.md'
]
  .map(fileName =>
    readFileSync(
      new URL(`../../docs/api-reference/experimental/${fileName}`, import.meta.url),
      'utf8'
    )
  )
  .join('\n');
const graphDocumentation = `${graphOverviewDocumentation}\n${graphOperationsDocumentation}`;
const packageDocumentation = readFileSync(
  new URL('../../modules/gpgpu/src/gpu-graph/README.md', import.meta.url),
  'utf8'
);
const experimentalOverview = readFileSync(
  new URL('../../docs/api-reference/experimental/README.md', import.meta.url),
  'utf8'
);
const capabilitiesDocumentation = readFileSync(
  new URL('../../docs/capabilities/gpu-data-compute.mdx', import.meta.url),
  'utf8'
);
const graphExplorerExample = readFileSync(
  new URL('../../website/content/examples/experimental/gpu-graph-explorer.mdx', import.meta.url),
  'utf8'
);
const deckGraphExplorerExample = readFileSync(
  new URL('../../website/content/examples/deck/gpu-graph-explorer.mdx', import.meta.url),
  'utf8'
);
const privateLayerDocumentation = readFileSync(
  new URL('../../modules/deck-arrow-layers/README.md', import.meta.url),
  'utf8'
);
const sidebar = readFileSync(new URL('../../docs/table-of-contents.json', import.meta.url), 'utf8');
const experimentalTabs = readFileSync(
  new URL('../../website/src/components/docs/experimental-docs-catalog.ts', import.meta.url),
  'utf8'
);

describe('GPU Graph GPU-resident graph analytics documentation', () => {
  test('publishes one canonical guide in the experimental sidebar, overview, and tabs', () => {
    expect(graphDocumentation).toContain('# GPU Graph');
    expect(graphDocumentation).toContain('<ExperimentalDocsTabs active="gpu-graph" />');
    expect(sidebar.match(/"api-reference\/experimental\/gpu-graph"[,\]]/gu)).toHaveLength(1);
    expect(sidebar).toMatch(
      /"label": "GPU Graph"[\s\S]*?"api-reference\/experimental\/gpu-graph"/u
    );
    expect(experimentalTabs).toContain("| 'gpu-graph'");
    expect(experimentalTabs).toContain("href: '/docs/api-reference/experimental/gpu-graph'");
    expect(experimentalOverview).toContain('### GPU Core and GPU analytics');
    expect(experimentalOverview).toContain(
      '| [`@luma.gl/gpgpu/gpu-graph`](/docs/api-reference/experimental/gpu-graph) |'
    );
    expect(experimentalOverview).toContain('/docs/api-reference/experimental/gpu-graph');
    expect(packageDocumentation).toContain('/docs/api-reference/experimental/gpu-graph');
  });

  test('embeds an honest full-population GPU explorer and explains its practical interactions', () => {
    expect(graphDocumentation).toContain(
      "import {GPUGraphExplorerExample} from '@site/src/examples';"
    );
    expect(graphDocumentation).toContain('## Explore a live GPU graph');
    expect(graphDocumentation).toContain(
      '<GPUGraphExplorerExample embedded embeddedHeight={680} />'
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
    expect(graphExplorerExample).toContain('<GPUGraphExplorerExample />');
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
    expect(graphExplorerExample).toContain('/docs/api-reference/experimental/gpu-graph');

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
      "import {GPUGraphBenchmark} from '@site/src/components/docs/gpu-graph-benchmark';"
    );
    expect(graphDocumentation).toContain('## Measure real CPU and WebGPU graph workloads');
    expect(graphDocumentation).toContain('<GPUGraphBenchmark />');
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
    expect(graphDocumentation).toContain('nine genuine GPU');
    expect(graphDocumentation).toContain('weighted single-source shortest paths');
    expect(graphDocumentation).toContain('local clustering coefficients');
    expect(graphDocumentation).toContain('label-propagation communities');
    expect(graphDocumentation).toContain('six Graphalytics workload families');
    expect(graphDocumentation).toContain('not\nmillion-vertex benchmarks');
    expect(graphDocumentation).toContain("from '@luma.gl/gpgpu/gpu-graph/benchmarks';");
    expect(graphDocumentation).toContain('makeGPUGraphBenchmarkDataset');
    expect(graphDocumentation).toContain('await runGPUGraphBenchmark(device, {');
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
    expect(graphDocumentation).toContain('## When to use it');
    expect(graphDocumentation).toContain('Social and communication networks');
    expect(graphDocumentation).toContain('Software and service dependencies');
    expect(graphDocumentation).toContain('Transaction and fraud investigations');
    expect(graphDocumentation).toContain('Transport and infrastructure maps');
    expect(graphDocumentation).toContain('Knowledge and citation graphs');
    expect(graphDocumentation).toContain('A small, CPU-resident, one-off analysis');
    expect(graphDocumentation).toContain('**Question: How many direct relationships');
    expect(graphDocumentation).toContain('**Question: Which vertices stay connected');
    expect(graphDocumentation).toContain("**Question: Do this vertex's neighbors actually connect");
    expect(graphDocumentation).toContain('**Question: Which entities can I reach');
    expect(graphDocumentation).toContain('**Question: Which route from my starting vertex costs');
    expect(graphDocumentation).toContain('**Question: Which vertices belong to the same connected');
    expect(graphDocumentation).toContain('**Question: Which vertices form closely connected');
    expect(graphDocumentation).toContain('**Question: Which actual community reassignment');
    expect(graphDocumentation).toContain('**Question: Does an existing community grouping');
    expect(graphDocumentation).toContain('**Question: Which vertices receive influence');
    expect(graphDocumentation).toContain('**Question: How can I position connected entities');
  });

  test('introduces every available operation and composes its actual optional entry point', () => {
    for (const graphOperation of [
      'GPUGraph',
      'GPUGraphTopology',
      'GPUGraphDegree',
      'GPUGraphCoreNumber',
      'GPUGraphLocalClusteringCoefficient',
      'GPUGraphBreadthFirstSearch',
      'GPUGraphSingleSourceShortestPath',
      'GPUGraphConnectedComponents',
      'GPUGraphLabelPropagation',
      'GPUGraphModularityOptimization',
      'GPUGraphModularity',
      'GPUGraphPageRank',
      'GPUGraphForceLayout',
      'GPUGraphSpatialForceLayout'
    ]) {
      expect(graphDocumentation, graphOperation).toContain(graphOperation);
    }

    expect(packageDocumentation).toContain('compressed adjacency');
    expect(packageDocumentation).toContain('vertex-degree queries');
    expect(packageDocumentation).toContain('GPUGraphCoreNumber');
    expect(packageDocumentation).toContain('breadth-first shortest paths');
    expect(packageDocumentation).toContain('nonnegative weighted single-source routes');
    expect(packageDocumentation).toContain('GPUGraphSingleSourceShortestPath');
    expect(packageDocumentation).toContain('local clustering coefficients');
    expect(packageDocumentation).toContain('GPUGraphLocalClusteringCoefficient');
    expect(packageDocumentation).toContain('weakly connected components');
    expect(packageDocumentation).toContain('deterministic label-propagation communities');
    expect(packageDocumentation).toContain('GPUGraphLabelPropagation');
    expect(packageDocumentation).toContain('GPUGraphModularityOptimization');
    expect(packageDocumentation).toContain('GPUGraphModularity');
    expect(packageDocumentation).toContain('normalized PageRank');
    expect(packageDocumentation).toContain('progressive exact force-directed layout');
    expect(packageDocumentation).toContain('GPUGraphSpatialForceLayout');
    expect(packageDocumentation).toContain('## Overview');
    expect(packageDocumentation).toContain('## When to use GPU Graph');
    expect(packageDocumentation).toContain('## Graph Data Council and Graphalytics');
    expect(packageDocumentation).toContain('## Weighted routes and local neighborhoods');
    expect(packageDocumentation).toContain('## Durable cores and community quality');
    expect(packageDocumentation).toContain('flat-grid approximation');
    expect(graphDocumentation).toContain("from '@luma.gl/gpgpu/gpu-graph';");
    expect(graphDocumentation).toContain('topology.addToGraph(workflow);');
    expect(graphDocumentation).toContain('const compiled = workflow.compile();');
    expect(graphDocumentation).toContain('compiled.encode(encoder, {parameters: undefined});');
    expect(graphDocumentation).toContain('device.submit(encoder.finish());');
  });

  test('explains complete Graphalytics workload coverage without overstating benchmark conformance', () => {
    expect(graphDocumentation).toContain(
      '## What does complete Graphalytics workload coverage mean?'
    );
    expect(graphDocumentation).toContain('breadth-first search (BFS)');
    expect(graphDocumentation).toContain('single-source shortest');
    expect(graphDocumentation).toContain('paths (SSSP)');
    expect(graphDocumentation).toContain('weakly connected components (WCC)');
    expect(graphDocumentation).toContain('community detection by label propagation');
    expect(graphDocumentation).toContain('(CDLP)');
    expect(graphDocumentation).toContain('local clustering coefficient (LCC)');
    expect(graphDocumentation).toContain('PageRank (PR)');
    expect(graphDocumentation).toContain('not a claim of official Graphalytics certification');
    expect(graphDocumentation).toContain('comparable published scores');
    expect(packageDocumentation).toContain('Graphalytics workload');
    expect(packageDocumentation).toContain('does not');
    expect(packageDocumentation).toContain('official benchmark certification');
  });

  test('links official Graph Data Council definitions, datasets, rules, and benchmark boundaries', () => {
    const councilHomepage = 'https://ldbcouncil.org/';
    const graphalyticsOverview = 'https://ldbcouncil.org/benchmarks/graphalytics/';
    const graphalyticsAlgorithms = `${graphalyticsOverview}algorithms/`;
    const graphalyticsDatasets = `${graphalyticsOverview}datasets/`;
    const graphalyticsRules = `${graphalyticsOverview}rules/`;

    for (const documentation of [graphDocumentation, packageDocumentation]) {
      expect(documentation).toContain(`[Graph Data Council (GDC)](${councilHomepage})`);
      expect(documentation).toContain(graphalyticsOverview);
      expect(documentation).toContain(graphalyticsAlgorithms);
      expect(documentation).toContain(graphalyticsDatasets);
      expect(documentation).toContain(graphalyticsRules);
      expect(documentation).toContain('https://github.com/ldbc/ldbc_graphalytics');
      expect(documentation).toContain('https://github.com/ldbc/ldbc_graphalytics_docs');
      expect(documentation).toContain('Linked Data Benchmark Council (LDBC)');
      expect(documentation).toContain('2025');
      expect(documentation).toContain('Parquet');
      expect(documentation).toContain('reference outputs');
      expect(documentation).toContain('repeated runs');
      expect(documentation).toContain('not');
      expect(documentation).toContain('published Graphalytics score');
    }

    expect(graphDocumentation).toContain('organizer review and reproducibility');
    expect(graphDocumentation).toContain('single-node, GPU-based, and partial implementations');
    expect(graphDocumentation).toContain('core decomposition and modularity scoring');
    expect(graphDocumentation).toContain('**beyond** those six standardized workload families');
    expect(packageDocumentation).toContain('**beyond** the six Graphalytics workload families');
    expect(packageDocumentation).toContain('does not become a seventh official workload');
    expect(capabilitiesDocumentation).toContain(councilHomepage);
    expect(capabilitiesDocumentation).toContain(graphalyticsAlgorithms);
    expect(capabilitiesDocumentation).toContain('beyond its');
    expect(capabilitiesDocumentation).toContain('six standardized workload families');
  });

  test('explains singleton refinement, weighted rounding limits, and bounded modularity optimization', () => {
    expect(graphDocumentation).toContain(
      '## Improve weighted community partitions with GPUGraphModularityOptimization'
    );
    expect(graphDocumentation).toContain(
      'social grouping should reflect actual interaction strength'
    );
    expect(graphDocumentation).toContain('fraud ring');
    expect(graphDocumentation).toContain('weighted service');
    expect(graphDocumentation).toContain('Three community questions are related but distinct');
    expect(graphDocumentation).toContain('new GPUGraphModularityOptimization({');
    expect(graphDocumentation).toContain('output: improvedCommunityIds');
    expect(graphDocumentation).toContain('modularity: optimizedModularity');
    expect(graphDocumentation).toContain('initialCommunities: proposedCommunityIds');
    expect(graphDocumentation).toContain('resolution: 1');
    expect(graphDocumentation).toContain('iterations: 32');
    expect(graphDocumentation).toContain('minimumGain: 0');
    expect(graphDocumentation).toContain('converged: optimizationConverged');
    expect(graphDocumentation).toContain('valid: optimizationValid');
    expect(graphDocumentation).toContain(
      'every vertex initially belongs to its own stable-identifier'
    );
    expect(graphDocumentation).toContain('`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`');
    expect(graphDocumentation).toContain('`Q = Σc [Lc / W - γ × (Kc / (2W))²]`');
    expect(graphDocumentation).toContain(
      '`ΔQ = Q(partition after moving the vertex) - Q(current partition)`'
    );
    expect(graphDocumentation).toContain('exactly **one**');
    expect(graphDocumentation).toContain('globally best move per round');
    expect(graphDocumentation).toContain('strictly positive and strictly greater than');
    expect(graphDocumentation).toContain('lowest genuinely unused stable community identifier');
    expect(graphDocumentation).toContain('Occupancy\ncounts every vertex');
    expect(graphDocumentation).toContain('zero-degree isolates');
    expect(graphDocumentation).toContain('over-merged warm start split');
    expect(graphDocumentation).toContain('`[0, 0]` can become `[1, 0]`');
    expect(graphDocumentation).toContain('improving modularity from zero to `0.5`');
    expect(graphDocumentation).toContain('lowest stable vertex identifier');
    expect(graphDocumentation).toContain('lowest\ncandidate community identifier');
    expect(graphDocumentation).toContain('deterministic for a fixed snapshot');
    expect(graphDocumentation).toContain('unordered atomic additions');
    expect(graphDocumentation).toContain('floating-point\naddition is not associative');
    expect(graphDocumentation).toContain('GPU execution orders or\nadapters');
    expect(graphDocumentation).toContain('Near-tied gains, strict `minimumGain` decisions');
    expect(graphDocumentation).toContain('selected community labels');
    expect(graphDocumentation).toContain('weighted partitions are not\nguaranteed to be identical');
    expect(graphDocumentation).toContain('never intentionally accepts a modularity regression');
    expect(graphDocumentation).toContain('`iterations` defaults to `32`');
    expect(graphDocumentation).toContain('integer from `0` through `1024`');
    expect(graphDocumentation).toContain('finite, nonnegative value representable as `float32`');
    expect(graphDocumentation).toContain('Zero rounds preserve');
    expect(graphDocumentation).toContain('convergence zero for a valid nonempty graph');
    expect(graphDocumentation).toContain('convergence remains zero: a bounded');
    expect(graphDocumentation).toContain('not necessarily the globally best partition');
    expect(graphDocumentation).toContain('Directed graphs require both forward and reverse CSR');
    expect(graphDocumentation).toContain('Parallel source edges, reciprocal directed edges');
    expect(graphDocumentation).toContain('same weighted');
    expect(graphDocumentation).toContain('an invalid warm-start label');
    expect(graphDocumentation).toContain('Every output label then becomes `0xffffffff`');
    expect(graphDocumentation).toContain('validity zero, and convergence one');
    expect(graphDocumentation).toContain('final `GPUGraphModularity` scoring');
    expect(graphDocumentation).toContain('`O(K × (V + E + sum(degree²)))`');
    expect(graphDocumentation).toContain('`O(V + E)` graph-owned packed scratch');
    expect(graphDocumentation).toContain('linear per-round community occupancy and vacancy checks');
    expect(graphDocumentation).toContain('**single-level Louvain-style local moving**');
    expect(graphDocumentation).toContain('not the complete multilevel');
    expect(graphDocumentation).toContain('Leiden refinement');
    expect(graphDocumentation).toContain('community coarsening');
    expect(graphDocumentation).toContain('a seventh Graphalytics workload');
    expect(packageDocumentation).toContain(
      'single globally largest strictly positive modularity gain'
    );
    expect(packageDocumentation).toContain('single-level Louvain-style local moving');
    expect(packageDocumentation).toContain('lowest genuinely unused\ncommunity label');
    expect(packageDocumentation).toContain('occupancy includes zero-degree isolates');
    expect(packageDocumentation).toContain('unordered\natomic `float32` additions');
    expect(packageDocumentation).toContain('weighted partitions can vary');
    expect(packageDocumentation).toContain('not full');
    expect(capabilitiesDocumentation).toContain(
      '| Single-level modularity optimization | Experimental |'
    );
    expect(capabilitiesDocumentation).toContain('empty-label splits, and stable tie-breaking');
    expect(capabilitiesDocumentation).toContain('weighted floating-point rounding can vary');
  });

  test('explains bounded simple-weak core decomposition, useful backbones, and exactness limits', () => {
    expect(graphDocumentation).toContain(
      '## Find durable network backbones with GPUGraphCoreNumber'
    );
    expect(graphDocumentation).toContain('many fragile spokes');
    expect(graphDocumentation).toContain('100 followers');
    expect(graphDocumentation).toContain('core number one');
    expect(graphDocumentation).toContain('four-person clique');
    expect(graphDocumentation).toContain('core number three');
    expect(graphDocumentation).toContain('resilient social backbones');
    expect(graphDocumentation).toContain('tightly sustained fraud rings');
    expect(graphDocumentation).toContain('new GPUGraphCoreNumber({');
    expect(graphDocumentation).toContain('output: coreNumbers');
    expect(graphDocumentation).toContain('converged: coresConverged');
    expect(graphDocumentation).toContain('degeneracy: maximumCoreNumber');
    expect(graphDocumentation).toContain('simple undirected weak graph');
    expect(graphDocumentation).toContain('reciprocal directed edges and parallel edges');
    expect(graphDocumentation).toContain('self-loops do not make a vertex support itself');
    expect(graphDocumentation).toContain('in-degree-plus-out-degree convention');
    expect(graphDocumentation).toContain(
      'Directed\ngraphs require complete forward and reverse CSR'
    );
    expect(graphDocumentation).toContain('H-index of its neighbors');
    expect(graphDocumentation).toContain('`iterations` may be any integer from `0` through `1024`');
    expect(graphDocumentation).toContain('Zero rounds publish the');
    expect(graphDocumentation).toContain(
      'both the per-vertex values and the maximum are **upper bounds**'
    );
    expect(graphDocumentation).toContain('convergence one, and optional degeneracy zero');
    expect(graphDocumentation).toContain('degeneracy become `0xffffffff`');
    expect(graphDocumentation).toContain('`O(K × sum(d² × log(d + 1)))`');
    expect(graphDocumentation).toContain('`O(V)` graph-owned scratch');
    expect(packageDocumentation).toContain('simple undirected weak');
    expect(packageDocumentation).toContain(
      'otherwise both core numbers and degeneracy are upper bounds'
    );
    expect(capabilitiesDocumentation).toContain('| Structural graph core numbers | Experimental |');
  });

  test('explains weighted directed partition modularity without claiming community optimization', () => {
    expect(graphDocumentation).toContain('## Evaluate community quality with GPUGraphModularity');
    expect(graphDocumentation).toContain('degree-matched random network');
    expect(graphDocumentation).toContain('compare rival social-network groupings');
    expect(graphDocumentation).toContain('fraud ring concentrates transaction weight');
    expect(graphDocumentation).toContain('new GPUGraphModularity({');
    expect(graphDocumentation).toContain('communities: communityIds');
    expect(graphDocumentation).toContain('output: modularityScore');
    expect(graphDocumentation).toContain('resolution: 1');
    expect(graphDocumentation).toContain('communityContributions');
    expect(graphDocumentation).toContain('valid: modularityValid');
    expect(graphDocumentation).toContain('`Q = Σc [Lc / W - γ × Kout,c × Kin,c / W²]`');
    expect(graphDocumentation).toContain('`Q = Σc [Lc / W - γ × (Kc / (2W))²]`');
    expect(graphDocumentation).toContain(
      'self-loop contributes once to `W` and `Lc` but twice to `Kc`'
    );
    expect(graphDocumentation).toContain('Parallel source edges');
    expect(graphDocumentation).toContain('retain their original multiplicity');
    expect(graphDocumentation).toContain('must be a finite, nonnegative value');
    expect(graphDocumentation).toContain('Edges with invalid endpoints are excluded');
    expect(graphDocumentation).toContain('floating-point accumulation');
    expect(graphDocumentation).toContain('constructing or requiring forward or reverse CSR');
    expect(graphDocumentation).toContain('concurrent atomic accumulation');
    expect(graphDocumentation).toContain('`O(V + E)`');
    expect(graphDocumentation).toContain(
      '**not** Louvain, Leiden, automatic community optimization'
    );
    expect(packageDocumentation).toContain('community-quality measurement, not Louvain, Leiden');
    expect(capabilitiesDocumentation).toContain('| Weighted community modularity | Experimental |');
  });

  test('explains unique weak-neighborhood triangles and honest local clustering complexity', () => {
    expect(graphDocumentation).toContain(
      '## Measure neighborhood density with GPUGraphLocalClusteringCoefficient'
    );
    expect(graphDocumentation).toContain('tightly connected friend circle');
    expect(graphDocumentation).toContain('mutually connected transaction accounts');
    expect(graphDocumentation).toContain('new GPUGraphLocalClusteringCoefficient({');
    expect(graphDocumentation).toContain('output: clusteringCoefficients');
    expect(graphDocumentation).toContain('triangles: incidentTriangleCounts');
    expect(graphDocumentation).toContain("GPUVector<'float32'>");
    expect(graphDocumentation).toContain("GPUVector<'uint32'>");
    expect(graphDocumentation).toContain('`2 × T / (d × (d - 1))`');
    expect(graphDocumentation).toContain('fewer than two distinct neighbors');
    expect(graphDocumentation).toContain('**weak**, neighborhood');
    expect(graphDocumentation).toContain('both forward and reverse CSR');
    expect(graphDocumentation).toContain('Self-loops never make a vertex its own neighbor');
    expect(graphDocumentation).toContain('`C / (d × (d - 1))`');
    expect(graphDocumentation).toContain('Reciprocal neighbor relationships count as two');
    expect(graphDocumentation).toContain('repeated copies of the');
    expect(graphDocumentation).toContain('not silently collapsed');
    expect(graphDocumentation).toContain('cannot fit in `uint32`');
    expect(graphDocumentation).toContain('allocating a graph-owned scratch buffer');
    expect(graphDocumentation).toContain('fails closed to zero');
    expect(graphDocumentation).toContain('triangle counts become `0xffffffff`');
    expect(graphDocumentation).toContain('`O(sum(degree³))`');
    expect(graphDocumentation).toContain('not a claim of constant-time triangle counting');
  });

  test('distinguishes nonnegative weighted routes from unweighted hops and documents failures', () => {
    expect(graphDocumentation).toContain(
      '## Find least-cost routes with GPUGraphSingleSourceShortestPath'
    );
    expect(graphDocumentation).toContain('40 minutes');
    expect(graphDocumentation).toContain('20 minutes');
    expect(graphDocumentation).toContain('travel-time maps');
    expect(graphDocumentation).toContain('communication latency');
    expect(graphDocumentation).toContain('service-dependency recovery costs');
    expect(graphDocumentation).toContain('new GPUGraphSingleSourceShortestPath({');
    expect(graphDocumentation).toContain('sourceVertex: selectedVertex');
    expect(graphDocumentation).toContain('distances: routeCosts');
    expect(graphDocumentation).toContain('predecessors: routeParents');
    expect(graphDocumentation).toContain('maxIterations: 64');
    expect(graphDocumentation).toContain('converged: shortestPathsConverged');
    expect(graphDocumentation).toContain('invalidWeightCount');
    expect(graphDocumentation).toContain('positive infinity (`+Infinity`)');
    expect(graphDocumentation).toContain('predecessor `0xffffffff`');
    expect(graphDocumentation).toContain('the one with fewer hops wins');
    expect(graphDocumentation).toContain('lowest stable predecessor identifier wins');
    expect(graphDocumentation).toContain('Zero-weight edges are\nvalid');
    expect(graphDocumentation).toContain('every edge then costs one');
    expect(graphDocumentation).toContain('Negative weights, `NaN`, positive infinity');
    expect(graphDocumentation).toContain('number of invalid **source edges**');
    expect(graphDocumentation).toContain(
      'Directed `incoming` or `both` routing requires reverse CSR'
    );
    expect(graphDocumentation).toContain('bounded Bellman–Ford-style synchronized relaxation');
    expect(graphDocumentation).toContain('from `0` through `1024`');
    expect(graphDocumentation).toContain('`min(max(vertexCount - 1, 0), 1024)`');
    expect(graphDocumentation).toContain('partially relaxed routes');
    expect(graphDocumentation).toContain('`O(K × (V + E))`');
    expect(graphDocumentation).toContain('`O(V)` graph-owned scratch');
    expect(graphDocumentation).toContain('new GPUGraphLocalClusteringCoefficient({');
    expect(graphDocumentation).toContain('}).addToGraph(workflow);');
    expect(graphDocumentation).not.toContain(
      'Choose another tool when the application needs weighted shortest paths'
    );
    expect(graphDocumentation).not.toContain(
      'weighted shortest paths, or a CPU execution fallback'
    );
  });

  test('explains deterministic GPU communities, practical use cases, and honest limitations', () => {
    expect(graphDocumentation).toContain(
      '## Discover densely connected communities with GPUGraphLabelPropagation'
    );
    expect(graphDocumentation).toContain('circles of friends');
    expect(graphDocumentation).toContain('transaction accounts');
    expect(graphDocumentation).toContain('service ownership groups');
    expect(graphDocumentation).toContain('one weakly\nconnected component');
    expect(graphDocumentation).toContain('different community label');
    expect(graphDocumentation).toContain('Use weak components to find disconnected islands');
    expect(graphDocumentation).toContain('new GPUGraphLabelPropagation({');
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
    expect(graphDocumentation).toContain('## Reveal relationships with GPUGraphForceLayout');
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
    expect(graphDocumentation).toContain('new GPUGraphForceLayout({');
  });

  test('explains optional spatial approximation, practical use cases, and honest scaling', () => {
    expect(graphDocumentation).toContain(
      '## Approximate distant forces with GPUGraphSpatialForceLayout'
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
    expect(graphDocumentation).toContain('new GPUGraphSpatialForceLayout({');
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
