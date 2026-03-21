// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, Framebuffer, RenderPass, Texture} from '@luma.gl/core';

const DEBUG_FRAMEBUFFER_STATE_KEY = '__debugFramebufferState';
const DEFAULT_MARGIN_PX = 8;

type DebugFramebufferOptions = {
  id: string;
  minimap?: boolean;
  opaque?: boolean;
  top?: string;
  left?: string;
  rgbaScale?: number;
};

type DebugFramebufferState = {
  flushing: boolean;
  queuedFramebuffers: Framebuffer[];
};

/**
 * Debug utility to blit queued offscreen framebuffers into the default framebuffer
 * without CPU readback. Currently implemented for WebGL only.
 */
export function debugFramebuffer(
  renderPass: RenderPass,
  source: Framebuffer | Texture | null,
  options: DebugFramebufferOptions
): void {
  if (renderPass.device.type !== 'webgl') {
    return;
  }

  const state = getDebugFramebufferState(renderPass.device);
  if (state.flushing) {
    return;
  }

  if (isDefaultRenderPass(renderPass)) {
    flushDebugFramebuffers(renderPass, options, state);
    return;
  }

  if (source && isFramebuffer(source) && source.handle !== null) {
    if (!state.queuedFramebuffers.includes(source)) {
      state.queuedFramebuffers.push(source);
    }
  }
}

function flushDebugFramebuffers(
  renderPass: RenderPass,
  options: DebugFramebufferOptions,
  state: DebugFramebufferState
): void {
  if (state.queuedFramebuffers.length === 0) {
    return;
  }

  const webglDevice = renderPass.device as Device & {gl: WebGL2RenderingContext};
  const {gl} = webglDevice;
  const previousReadFramebuffer = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
  const previousDrawFramebuffer = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
  const [targetWidth, targetHeight] = renderPass.device
    .getDefaultCanvasContext()
    .getDrawingBufferSize();

  let topPx = parseCssPixel(options.top, DEFAULT_MARGIN_PX);
  const leftPx = parseCssPixel(options.left, DEFAULT_MARGIN_PX);

  state.flushing = true;
  try {
    for (const framebuffer of state.queuedFramebuffers) {
      const [targetX0, targetY0, targetX1, targetY1, previewHeight] = getOverlayRect({
        framebuffer,
        targetWidth,
        targetHeight,
        topPx,
        leftPx,
        minimap: options.minimap
      });

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer.handle);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(
        0,
        0,
        framebuffer.width,
        framebuffer.height,
        targetX0,
        targetY0,
        targetX1,
        targetY1,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );

      topPx += previewHeight + DEFAULT_MARGIN_PX;
    }
  } finally {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, previousReadFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, previousDrawFramebuffer);
    state.flushing = false;
  }
}

function getOverlayRect(options: {
  framebuffer: Framebuffer;
  targetWidth: number;
  targetHeight: number;
  topPx: number;
  leftPx: number;
  minimap?: boolean;
}): [number, number, number, number, number] {
  const {framebuffer, targetWidth, targetHeight, topPx, leftPx, minimap} = options;
  const maxWidth = minimap ? Math.max(Math.floor(targetWidth / 4), 1) : targetWidth;
  const maxHeight = minimap ? Math.max(Math.floor(targetHeight / 4), 1) : targetHeight;
  const scale = Math.min(maxWidth / framebuffer.width, maxHeight / framebuffer.height);
  const previewWidth = Math.max(Math.floor(framebuffer.width * scale), 1);
  const previewHeight = Math.max(Math.floor(framebuffer.height * scale), 1);
  const targetX0 = leftPx;
  const targetY0 = Math.max(targetHeight - topPx - previewHeight, 0);
  const targetX1 = targetX0 + previewWidth;
  const targetY1 = targetY0 + previewHeight;
  return [targetX0, targetY0, targetX1, targetY1, previewHeight];
}

function getDebugFramebufferState(device: Device): DebugFramebufferState {
  device.userData[DEBUG_FRAMEBUFFER_STATE_KEY] ||= {
    flushing: false,
    queuedFramebuffers: []
  } satisfies DebugFramebufferState;
  return device.userData[DEBUG_FRAMEBUFFER_STATE_KEY] as DebugFramebufferState;
}

function isFramebuffer(value: Framebuffer | Texture): value is Framebuffer {
  return 'colorAttachments' in value;
}

function isDefaultRenderPass(renderPass: RenderPass): boolean {
  const framebuffer = renderPass.props.framebuffer as {handle?: unknown} | null;
  return !framebuffer || framebuffer.handle === null;
}

function parseCssPixel(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : defaultValue;
}
