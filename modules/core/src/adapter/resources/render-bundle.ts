// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TextureFormatColor,
  TextureFormatDepthStencil
} from '../../shadertypes/texture-types/texture-formats';
import type {Device} from '../device';
import type {RenderPassParameters} from '../types/parameters';
import {RenderPass, RenderPassProps} from './render-pass';
import {Resource, ResourceProps} from './resource';

/** Properties used to configure a {@link RenderBundleEncoder}. */
export type RenderBundleEncoderProps = ResourceProps & {
  /**
   * Color attachment formats required by render passes that execute the finished bundle.
   * @defaultValue `[device.preferredColorFormat]`
   */
  colorAttachmentFormats?: (TextureFormatColor | null)[];
  /**
   * Depth/stencil attachment format required by render passes that execute the finished bundle.
   * Set to `false` when the bundle does not use a depth/stencil attachment.
   * @defaultValue `device.preferredDepthFormat`
   */
  depthStencilAttachmentFormat?: TextureFormatDepthStencil | false;
  /**
   * Sample count required by render passes that execute the finished bundle.
   * @defaultValue `1`
   */
  sampleCount?: number;
  /**
   * Whether the depth component is read-only while the bundle executes.
   * @defaultValue `false`
   */
  depthReadOnly?: boolean;
  /**
   * Whether the stencil component is read-only while the bundle executes.
   * @defaultValue `false`
   */
  stencilReadOnly?: boolean;
};

/**
 * Immutable reusable WebGPU render commands recorded by a {@link RenderBundleEncoder}.
 *
 * @remarks
 * Applications obtain a render bundle by calling {@link RenderBundleEncoder.finish}; render
 * bundles are not constructed directly. A render bundle inherits its encoder's `id` and
 * `userData`, and can be replayed more than once by compatible render passes.
 */
export abstract class RenderBundle extends Resource<ResourceProps> {
  override get [Symbol.toStringTag](): string {
    return 'RenderBundle';
  }

  constructor(device: Device, props: ResourceProps) {
    super(device, props, RenderBundle.defaultProps);
  }

  static override defaultProps: Required<ResourceProps> = {
    ...Resource.defaultProps
  };
}

/**
 * Records reusable WebGPU draw commands without beginning a render pass.
 *
 * @remarks
 * Call {@link RenderBundleEncoder.finish} to create an immutable {@link RenderBundle}. The
 * attachment formats and sample count supplied when creating the encoder must match every
 * {@link RenderPass} that executes the finished bundle.
 */
export abstract class RenderBundleEncoder extends RenderPass {
  override get [Symbol.toStringTag](): string {
    return 'RenderBundleEncoder';
  }

  protected override getStatsName(): string {
    return 'RenderBundleEncoder';
  }

  constructor(device: Device, props: RenderBundleEncoderProps = {}) {
    validateRenderBundleEncoderProps(props);
    super(
      device,
      normalizeRenderBundleEncoderProps(device, props),
      RenderBundleEncoder.bundleDefaultProps
    );
  }

  /**
   * Completes recording and invalidates this encoder.
   * @returns An immutable reusable bundle that inherits this encoder's `id` and `userData`.
   */
  abstract finish(): RenderBundle;

  /**
   * Render bundle encoders cannot be ended like render passes.
   * @throws Always throws. Call {@link RenderBundleEncoder.finish} instead.
   */
  override end(): void {
    throw new Error('RenderBundleEncoder.end() is not supported; call finish() instead');
  }

  /**
   * Render bundle encoders do not support render-pass dynamic state.
   * @throws Always throws.
   */
  override setParameters(_parameters: RenderPassParameters): void {
    throw new Error('RenderBundleEncoder.setParameters() is not supported');
  }

  /**
   * Render bundle encoders cannot begin occlusion queries.
   * @throws Always throws.
   */
  override beginOcclusionQuery(_queryIndex: number): void {
    throw new Error('RenderBundleEncoder.beginOcclusionQuery() is not supported');
  }

  /**
   * Render bundle encoders cannot end occlusion queries.
   * @throws Always throws.
   */
  override endOcclusionQuery(): void {
    throw new Error('RenderBundleEncoder.endOcclusionQuery() is not supported');
  }

  private static bundleDefaultProps: Required<RenderPassProps> &
    Required<RenderBundleEncoderProps> = {
    ...RenderPass.defaultProps,
    colorAttachmentFormats: undefined!,
    depthStencilAttachmentFormat: undefined!,
    sampleCount: 1,
    depthReadOnly: false,
    stencilReadOnly: false
  };
}

function validateRenderBundleEncoderProps(props: RenderBundleEncoderProps): void {
  const renderPassProps = props as RenderBundleEncoderProps & Partial<RenderPassProps>;
  const invalidPropNames = [
    renderPassProps.framebuffer !== undefined && renderPassProps.framebuffer !== null
      ? 'framebuffer'
      : null,
    renderPassProps.parameters !== undefined ? 'parameters' : null,
    renderPassProps.clearColor !== undefined ? 'clearColor' : null,
    renderPassProps.clearColors !== undefined ? 'clearColors' : null,
    renderPassProps.clearDepth !== undefined ? 'clearDepth' : null,
    renderPassProps.clearStencil !== undefined ? 'clearStencil' : null,
    renderPassProps.discard !== undefined ? 'discard' : null,
    renderPassProps.occlusionQuerySet !== undefined ? 'occlusionQuerySet' : null,
    renderPassProps.timestampQuerySet !== undefined ? 'timestampQuerySet' : null,
    renderPassProps.beginTimestampIndex !== undefined ? 'beginTimestampIndex' : null,
    renderPassProps.endTimestampIndex !== undefined ? 'endTimestampIndex' : null
  ].filter(Boolean);

  if (invalidPropNames.length > 0) {
    throw new Error(
      `RenderBundleEncoder does not support render pass props: ${invalidPropNames.join(', ')}`
    );
  }
}

function normalizeRenderBundleEncoderProps(
  device: Device,
  props: RenderBundleEncoderProps
): RenderBundleEncoderProps {
  return {
    ...props,
    colorAttachmentFormats: props.colorAttachmentFormats ?? [device.preferredColorFormat],
    depthStencilAttachmentFormat:
      props.depthStencilAttachmentFormat === undefined
        ? (device.preferredDepthFormat as TextureFormatDepthStencil)
        : props.depthStencilAttachmentFormat
  };
}
