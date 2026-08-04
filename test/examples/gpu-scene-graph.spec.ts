// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import GPUSceneGraphAnimationLoopTemplate from '../../examples/experimental/gpu-scene-graph/app';
import {SCENE_GRAPH_CAPACITY} from '../../examples/experimental/gpu-scene-graph/scene-graph-data';

describe('GPU conventional scene graph explorer', () => {
  test('adapts a CPU hierarchy and preserves stable group controls and measured scene mutations', async () => {
    const device = await getWebGPUTestDevice();
    if (
      !device ||
      device.info.gpu === 'software' ||
      device.info.gpuType === 'cpu' ||
      device.info.fallback
    ) {
      return;
    }

    const host = document.createElement('div');
    host.id = 'example-panel-host';
    document.body.append(host);
    let explorer: GPUSceneGraphAnimationLoopTemplate | null = null;
    try {
      explorer = new GPUSceneGraphAnimationLoopTemplate({device} as AnimationProps);
      const state = explorer as unknown as {
        resources: {
          compiled: {stats: {nodeOrder: string[]}};
          scene: {
            activeCount: number;
            getRecordIndex: (id: number) => number | undefined;
          };
          commands: {capacity: number};
        };
        enabledGroups: number;
        selectedObjectId: number;
      };
      expect(state.resources.scene.activeCount).toBe(SCENE_GRAPH_CAPACITY);
      expect(state.resources.scene.getRecordIndex(10_003)).toBe(1);
      expect(state.resources.commands.capacity).toBe(SCENE_GRAPH_CAPACITY);
      expect(state.resources.compiled.stats.nodeOrder).toContain('scene-graph-visibility');
      expect(state.resources.compiled.stats.nodeOrder).toContain('scene-graph-picking');
      expect(state.resources.compiled.stats.nodeOrder).toContain(
        'scene-graph-resource-groups-classify'
      );

      const structures = host.querySelector<HTMLInputElement>('[data-group="1"]');
      expect(structures).not.toBeNull();
      structures!.checked = false;
      structures!.dispatchEvent(new Event('change', {bubbles: true}));
      expect(state.enabledGroups).toBe(0b101);

      state.selectedObjectId = 10_003;
      host.querySelector<HTMLButtonElement>('[data-move]')!.click();
      expect(host.querySelector('[data-scene-graph-mutation]')?.textContent).toContain('bytes');
      host.querySelector<HTMLButtonElement>('[data-remove]')!.click();
      expect(state.resources.scene.activeCount).toBe(SCENE_GRAPH_CAPACITY - 1);
      expect(state.resources.scene.getRecordIndex(10_003)).toBeUndefined();
      expect(explorer.graphInspector.getSnapshot().graphs).toHaveLength(1);
    } finally {
      explorer?.onFinalize();
      host.remove();
    }
  });
});
