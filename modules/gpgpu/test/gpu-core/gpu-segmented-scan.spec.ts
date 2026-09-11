// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUCommandGraph, GPUSegmentedScan} from '../../src/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

// Full GPU execution coverage is added alongside public export integration; keep constructor
// contracts covered here so the primitive's CSR-style shape is explicit from the first PR.
describe('GPUSegmentedScan', () => {
  it('constructs exclusive and inclusive segmented scans', async () => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    const graph = new GPUCommandGraph(device, {id: 'segmented-scan-test'});
    const input = graph.createBuffer({id:'input',byteLength:16});
    const offsets = graph.createBuffer({id:'offsets',byteLength:12});
    const output = graph.createBuffer({id:'output',byteLength:16});
    const inputView = graph.createDataView(input,{format:'uint32',length:4});
    const offsetView = graph.createDataView(offsets,{format:'uint32',length:3});
    const outputView = graph.createDataView(output,{format:'uint32',length:4});
    expect(new GPUSegmentedScan({input:inputView,segmentOffsets:offsetView,output:outputView}).mode).toBe('exclusive');
    expect(new GPUSegmentedScan({input:inputView,segmentOffsets:offsetView,output:outputView,mode:'inclusive'}).mode).toBe('inclusive');
  });
});
