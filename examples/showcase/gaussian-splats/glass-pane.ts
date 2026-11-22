// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture, type Device, type Framebuffer} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {SplatRenderer, type GPUSplatData, type SplatRendererProps} from '@luma.gl/engine/splats';
import {Matrix4} from '@math.gl/core';

/** Shared geometry for the pane depth and color draws. */
const PANE_VERTEX_SHADER = /* wgsl */ `
@group(0) @binding(auto) var<uniform> paneTransform: mat4x4<f32>;

struct PaneVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) local: vec2<f32>,
};

@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> PaneVertex {
  let local = vec2f(select(-1.0, 1.0, (index & 1u) != 0u), select(-1.0, 1.0, index >= 2u));
  return PaneVertex(paneTransform * vec4f(local * vec2f(2.65, 1.95), 0.0, 1.0), local);
}

`;

/** Translucent tint with a brighter rim to show the pane edge. */
const PANE_COLOR_SHADER = /* wgsl */ `
@fragment fn fragmentMain(input: PaneVertex) -> @location(0) vec4<f32> {
  let edge = max(abs(input.local.x), abs(input.local.y));
  let rim = smoothstep(0.965, 0.995, edge);
  return vec4f(mix(vec3f(0.07, 0.64, 0.9), vec3f(0.55, 0.9, 1.0), rim), mix(0.26, 0.8, rim));
}
`;

/** Composites a moving transparent pane with WebGPU splats. */
export class GaussianSplatGlassPane {
  /** World-to-clip matrix shared by both pane models. */
  private readonly transform: Buffer;
  /** Writes the moving pane depth to the sampled attachment. */
  private readonly depthPane: Model;
  /** Blends the pane tint into the presentation framebuffer. */
  private readonly colorPane: Model;
  /** Shares one sort and source batches across both depth intervals. */
  private readonly splats: SplatRenderer;
  /** Depth-only framebuffer sized to the current canvas. */
  private depthFramebuffer?: Framebuffer;
  /** Owned depth bound sampled by both filtered splat draws. */
  private depthTexture?: Texture;

  /** Creates the pane models and the single-sample filtered splat renderer. */
  constructor(private readonly device: Device) {
    this.transform = device.createBuffer({byteLength: 64, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    const paneProps = {
      topology: 'triangle-strip' as const,
      bindings: {paneTransform: this.transform},
      vertexCount: 4
    };
    this.depthPane = new Model(device, {
      ...paneProps,
      source: PANE_VERTEX_SHADER + '\n@fragment fn fragmentMain() {}',
      colorAttachmentFormats: [],
      depthStencilAttachmentFormat: 'depth32float',
      parameters: {depthWriteEnabled: true, depthCompare: 'always'}
    });
    this.colorPane = new Model(device, {
      ...paneProps,
      source: PANE_VERTEX_SHADER + PANE_COLOR_SHADER,
      parameters: {
        depthWriteEnabled: false,
        depthCompare: 'always',
        blend: true,
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha'
      }
    });
    this.splats = new SplatRenderer(device, {depthIntervalSamples: 1});
  }

  /**
   * Borrows the scene batches, renders the pane depth, then draws behind splats, glass, and front splats.
   */
  draw(
    batches: readonly GPUSplatData[],
    props: SplatRendererProps & {modelViewProjectionMatrix: readonly number[]},
    elapsedMilliseconds: number,
    clearColor: [number, number, number, number],
    {center, scale, zUp}: {center: [number, number, number]; scale: number; zUp?: boolean}
  ): void {
    const {device, splats} = this;
    const framebuffer = device.getCanvasContext().getCurrentFramebuffer();
    const {width, height} = framebuffer.colorAttachments[0]!.texture;
    if (this.depthTexture?.width !== width || this.depthTexture?.height !== height) {
      this.depthFramebuffer?.destroy();
      this.depthTexture?.destroy();
      this.depthTexture = device.createTexture({
        width,
        height,
        format: 'depth32float',
        usage: Texture.RENDER_ATTACHMENT | Texture.TEXTURE
      });
      this.depthFramebuffer = device.createFramebuffer({
        width,
        height,
        depthStencilAttachment: this.depthTexture
      });
    }

    const phase = elapsedMilliseconds * 0.00065;
    const transform = new Matrix4(props.modelViewProjectionMatrix)
      .translate(center)
      .rotateX(zUp ? Math.PI / 2 : 0)
      .scale(scale)
      .translate([1.8 * Math.sin(phase), 0, 1.25 * Math.cos(phase)])
      .rotateY(0.7 * Math.sin(phase))
      .rotateZ(0.17 * Math.sin(phase));
    this.transform.write(new Float32Array(transform));

    // The transparent surface depth is sampled only after its render pass ends.
    const depthPass = device.beginRenderPass({framebuffer: this.depthFramebuffer, clearDepth: 1});
    this.depthPane.draw(depthPass);
    depthPass.end();

    for (const batch of batches.slice(splats.batches.length)) {
      splats.appendData(batch);
    }
    splats.setProps({...props, data: undefined});
    splats.predraw(device.commandEncoder);

    const colorPass = device.beginRenderPass({framebuffer, clearColor, clearDepth: 1});
    splats.setDepthInterval({bound: this.depthTexture, compare: 'greater'});
    splats.draw(colorPass);
    this.colorPane.draw(colorPass);
    splats.setDepthInterval({bound: this.depthTexture, compare: 'less-equal'});
    splats.draw(colorPass);
    colorPass.end();
  }

  /** Releases demo resources. The example owns the source batches and canvas. */
  destroy(): void {
    this.splats.destroy();
    this.colorPane.destroy();
    this.depthPane.destroy();
    this.transform.destroy();
    this.depthFramebuffer?.destroy();
    this.depthTexture?.destroy();
  }
}
