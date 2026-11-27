// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Framebuffer, RenderPassProps} from '@luma.gl/core';
import {encodeSceneCapturePass, type SceneCapturePassDefinition} from '@luma.gl/engine';
import {expect, it} from 'vitest';

it('prepares geometry before opening the named target and closes the pass if drawing fails', () => {
  const commands: string[] = [];
  const framebuffer = {} as Framebuffer;
  const commandEncoder = {
    beginRenderPass: (props: RenderPassProps) => {
      expect(props.framebuffer).toBe(framebuffer);
      expect(props.clearColor).toBe(false);
      expect(props.parameters?.scissorRect).toEqual([0, 1, 8, 3]);
      commands.push('begin');
      return {
        end: () => {
          commands.push('end');
        }
      };
    }
  } as unknown as CommandEncoder;
  const definition = {
    name: 'capture',
    target: 'capture',
    pass: {clearColor: false},
    getPassProps: ({firstRow}) => ({parameters: {scissorRect: [0, firstRow, 8, 3]}}),
    prepare: () => {
      commands.push('prepare');
    },
    draw: () => {
      commands.push('draw');
      throw new Error('draw failed');
    }
  } as const satisfies SceneCapturePassDefinition<{firstRow: number}, 'capture'>;

  expect(() =>
    encodeSceneCapturePass(definition, {
      commandEncoder,
      framebuffers: {capture: framebuffer},
      frame: {firstRow: 1}
    })
  ).toThrow('draw failed');
  expect(commands).toEqual(['prepare', 'begin', 'draw', 'end']);
});
