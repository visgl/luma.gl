// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Device} from '@luma.gl/core';
import type {LayerContext} from '@deck.gl/core';
import type {DrawCommandBuffer} from '@luma.gl/experimental';
import {describe, expect, test} from 'vitest';
import {LuSpatialPointLayer} from '../../examples/deck/luspatial-taxi/luspatial-point-layer';
import {LuSpatialTaxiQueryEffect} from '../../examples/deck/luspatial-taxi/luspatial-query-effect';
import type {LuSpatialTaxiData} from '../../examples/deck/luspatial-taxi/taxi-data';

describe('luSpatial taxi runtime resource safety', () => {
  test('releases every completed effect allocation after a mid-construction failure', () => {
    const destroyedResourceIds: string[] = [];
    let bufferCreateCount = 0;
    const device = {
      type: 'webgpu',
      createBuffer: ({id}: {id?: string}) => {
        bufferCreateCount++;
        if (bufferCreateCount === 3) throw new Error('injected buffer allocation failure');
        const resourceId = id ?? `buffer-${bufferCreateCount}`;
        return {
          destroy: () => destroyedResourceIds.push(resourceId)
        };
      }
    } as unknown as Device;
    const taxiData: LuSpatialTaxiData = {
      pointCount: 1,
      corpusPointCount: 1,
      longitudeLatitudes: new Float32Array([-73.99, 40.73]),
      sourceBounds: [-74, 40.72, -73.94, 40.78],
      projectedBounds: [-1, -1, 1, 1],
      sourceKind: 'synthetic',
      sourceLabel: 'test fixture'
    };

    expect(() => new LuSpatialTaxiQueryEffect(device, taxiData)).toThrow(
      'injected buffer allocation failure'
    );
    expect(destroyedResourceIds).toEqual([
      'luspatial-taxi-projected-positions',
      'luspatial-taxi-longitude-latitudes'
    ]);
  });

  test('releases layer resources and withholds readiness after model initialization fails', () => {
    let styleBufferDestroyCount = 0;
    let readinessCount = 0;
    const device = {
      type: 'webgpu',
      createBuffer: () => ({
        destroy: () => styleBufferDestroyCount++
      })
    } as unknown as Device;
    const layer = new LuSpatialPointLayer({
      id: 'injected-layer-failure',
      data: [],
      longitudeLatitudes: {} as Buffer,
      visibleIds: {} as Buffer,
      drawCommands: {} as DrawCommandBuffer,
      commandIndex: 0,
      color: [255, 255, 255, 255],
      radiusPixels: 1,
      onResourcesReady: () => readinessCount++,
      onBeforeModelInitialization: () => {
        throw new Error('injected model initialization failure');
      }
    });

    expect(() => layer.initializeState({device} as LayerContext)).toThrow(
      'injected model initialization failure'
    );
    expect(styleBufferDestroyCount).toBe(1);
    expect(readinessCount).toBe(0);
  });
});
