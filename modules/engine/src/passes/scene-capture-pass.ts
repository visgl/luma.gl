// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CommandEncoder, Framebuffer, RenderPass, RenderPassProps} from '@luma.gl/core';

type SceneCapturePassProps = Omit<RenderPassProps, 'framebuffer' | 'id'>;

/**
 * A scene draw into a named framebuffer. The scene owns the framebuffer and its
 * attachments, so a definition can run against different views or slices on each frame.
 */
export type SceneCapturePassDefinition<Frame, Target extends string, DrawResult = void> = {
  /** Default GPU command label. A caller can supply a label for a particular view. */
  name: string;
  /** Name of the framebuffer bound for this draw. */
  target: Target;
  /** Static attachment clear, load, and access settings. */
  pass?: SceneCapturePassProps;
  /** Frame-dependent settings, such as a slice scissor rectangle or attachment clear value. */
  getPassProps?: (frame: Frame) => SceneCapturePassProps;
  /** Prepare GPU resources before the render pass opens. */
  prepare?: (commandEncoder: CommandEncoder, frame: Frame) => void;
  /** Records geometry using the active render pass. */
  draw: (renderPass: RenderPass, frame: Frame) => DrawResult;
};

/** Records a capture pass and returns its synchronous draw result. */
export function encodeSceneCapturePass<Frame, Target extends string, DrawResult>(
  definition: SceneCapturePassDefinition<Frame, Target, DrawResult>,
  options: {
    commandEncoder: CommandEncoder;
    framebuffers: Record<Target, Framebuffer>;
    frame: Frame;
    id?: string;
  }
): DrawResult {
  const {commandEncoder, frame} = options;
  definition.prepare?.(commandEncoder, frame);
  const renderPass = commandEncoder.beginRenderPass({
    ...definition.pass,
    ...definition.getPassProps?.(frame),
    id: options.id ?? definition.name,
    framebuffer: options.framebuffers[definition.target]
  });
  try {
    return definition.draw(renderPass, frame);
  } finally {
    renderPass.end();
  }
}
