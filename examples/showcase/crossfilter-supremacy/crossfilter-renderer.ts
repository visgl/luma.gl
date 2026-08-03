// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type CanvasContext, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {CROSS_FILTER_DOMAINS, CROSS_FILTER_MAP_DOMAIN} from './crossfilter-data';

/** Canvas-backed rectangle expressed in physical pixels from the upper-left corner. */
export type CrossfilterViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Borrowed GPU-resident source columns shared by both linked point-cloud views. */
export type CrossfilterRendererSources = {
  rowCount: number;
  longitude: Buffer;
  latitude: Buffer;
  value: Buffer;
  risk: Buffer;
  category: Buffer;
  selectionMask: Buffer;
};

/** Linked view rectangles rendered into one canvas acquisition and one render pass. */
export type CrossfilterRenderOptions = {
  canvasContext?: CanvasContext;
  mapViewport: CrossfilterViewport;
  scatterViewport: CrossfilterViewport;
  clearColor?: [number, number, number, number];
};

const CROSSFILTER_POINT_SHADER = /* wgsl */ `
struct RenderUniforms {
  display: vec4f,
  domain: vec4f,
};

@group(0) @binding(0) var<storage, read> longitudeValues: array<f32>;
@group(0) @binding(1) var<storage, read> latitudeValues: array<f32>;
@group(0) @binding(2) var<storage, read> transactionValues: array<f32>;
@group(0) @binding(3) var<storage, read> transactionRisks: array<f32>;
@group(0) @binding(4) var<storage, read> transactionCategories: array<u32>;
@group(0) @binding(5) var<storage, read> selectionMask: array<u32>;
@group(0) @binding(6) var<uniform> uniforms: RenderUniforms;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) pointCoordinate: vec2f,
  @location(1) color: vec4f,
};

fn getCorner(vertexIndex: u32) -> vec2f {
  switch vertexIndex {
    case 0u: { return vec2f(-1.0, -1.0); }
    case 1u: { return vec2f(1.0, -1.0); }
    case 2u: { return vec2f(-1.0, 1.0); }
    case 3u: { return vec2f(-1.0, 1.0); }
    case 4u: { return vec2f(1.0, -1.0); }
    default: { return vec2f(1.0, 1.0); }
  }
}

fn getCategoryColor(category: u32) -> vec3f {
  switch category {
    case 0u: { return vec3f(0.11, 0.96, 0.83); }
    case 1u: { return vec3f(0.35, 0.70, 1.00); }
    case 2u: { return vec3f(0.99, 0.74, 0.28); }
    case 3u: { return vec3f(0.60, 0.54, 1.00); }
    case 4u: { return vec3f(1.00, 0.30, 0.58); }
    default: { return vec3f(1.00, 0.46, 0.21); }
  }
}

@vertex fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let scatterView = uniforms.display.z > 0.5;
  let sourcePosition = select(
    vec2f(longitudeValues[instanceIndex], latitudeValues[instanceIndex]),
    vec2f(transactionValues[instanceIndex], transactionRisks[instanceIndex]),
    scatterView
  );
  let normalized =
    (sourcePosition - uniforms.domain.xy) / max(uniforms.domain.zw - uniforms.domain.xy, vec2f(0.0001));
  let selected = selectionMask[instanceIndex] != 0u;
  let corner = getCorner(vertexIndex);
  let pointRadius = select(0.76, select(1.18, 1.42, scatterView), selected);
  let pointOffset = corner * pointRadius * 2.0 / max(uniforms.display.xy, vec2f(1.0));
  let center = normalized * 2.0 - vec2f(1.0);
  let categoryColor = getCategoryColor(transactionCategories[instanceIndex]);
  let selectedColor = mix(categoryColor, vec3f(1.0, 0.28, 0.38), transactionRisks[instanceIndex] * 0.2);

  var output: VertexOutput;
  output.position = vec4f(center + pointOffset, 0.0, 1.0);
  output.pointCoordinate = corner;
  output.color = vec4f(
    select(vec3f(0.17, 0.25, 0.37), selectedColor, selected),
    select(0.032, select(0.15, 0.20, scatterView), selected)
  );
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let radiusSquared = dot(input.pointCoordinate, input.pointCoordinate);
  if (radiusSquared > 1.0) {
    discard;
  }
  let coverage = 1.0 - smoothstep(0.24, 1.0, radiusSquared);
  return vec4f(input.color.rgb, input.color.a * coverage);
}
`;

/** Draws map and scatterplot points directly from source buffers and the shared selection mask. */
export class CrossfilterRenderer {
  private readonly device: Device;
  private readonly mapUniformBuffer: Buffer;
  private readonly scatterUniformBuffer: Buffer;
  private readonly mapModel: Model;
  private readonly scatterModel: Model;
  private destroyed = false;

  /** Creates two lightweight model bindings over the same resident columns and WGSL pipeline. */
  constructor(device: Device, sources: CrossfilterRendererSources) {
    this.device = device;
    this.mapUniformBuffer = createUniformBuffer(device, 'crossfilter-map-uniforms');
    this.scatterUniformBuffer = createUniformBuffer(device, 'crossfilter-scatter-uniforms');
    this.mapModel = this.createModel('map', sources, this.mapUniformBuffer);
    this.scatterModel = this.createModel('scatter', sources, this.scatterUniformBuffer);
  }

  /** Acquires the canvas once, clears the backdrop, and renders both clipped viewports. */
  render(options: CrossfilterRenderOptions): void {
    if (this.destroyed) return;

    const canvasContext = options.canvasContext ?? this.device.getDefaultCanvasContext();
    // Model's WebGPU pipelines retain the canvas depth format even with depth writes disabled.
    const framebuffer = canvasContext.getCurrentFramebuffer();
    const [canvasWidth, canvasHeight] = canvasContext.getDrawingBufferSize();
    const mapViewport = constrainViewport(options.mapViewport, canvasWidth, canvasHeight);
    const scatterViewport = constrainViewport(options.scatterViewport, canvasWidth, canvasHeight);

    if (mapViewport) {
      this.mapUniformBuffer.write(
        Float32Array.from([
          mapViewport.width,
          mapViewport.height,
          0,
          0,
          CROSS_FILTER_MAP_DOMAIN.x[0],
          CROSS_FILTER_MAP_DOMAIN.y[0],
          CROSS_FILTER_MAP_DOMAIN.x[1],
          CROSS_FILTER_MAP_DOMAIN.y[1]
        ])
      );
    }
    if (scatterViewport) {
      this.scatterUniformBuffer.write(
        Float32Array.from([
          scatterViewport.width,
          scatterViewport.height,
          1,
          0,
          CROSS_FILTER_DOMAINS.value[0],
          CROSS_FILTER_DOMAINS.risk[0],
          CROSS_FILTER_DOMAINS.value[1],
          CROSS_FILTER_DOMAINS.risk[1]
        ])
      );
    }

    const commandEncoder = this.device.createCommandEncoder({id: 'crossfilter-render'});
    this.mapModel.predraw(commandEncoder);
    this.scatterModel.predraw(commandEncoder);
    const renderPass = commandEncoder.beginRenderPass({
      id: 'crossfilter-linked-views',
      framebuffer,
      clearColor: options.clearColor ?? [0.008, 0.014, 0.032, 1],
      clearDepth: 1,
      clearStencil: false
    });

    if (mapViewport) {
      setViewport(renderPass, mapViewport);
      this.mapModel.draw(renderPass);
    }
    if (scatterViewport) {
      setViewport(renderPass, scatterViewport);
      this.scatterModel.draw(renderPass);
    }

    renderPass.end();
    this.device.submit(commandEncoder.finish());
  }

  /** Releases model-owned pipelines and uniforms without touching borrowed source columns. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.mapModel.destroy();
    this.scatterModel.destroy();
    this.mapUniformBuffer.destroy();
    this.scatterUniformBuffer.destroy();
  }

  private createModel(
    kind: 'map' | 'scatter',
    sources: CrossfilterRendererSources,
    uniforms: Buffer
  ) {
    return new Model(this.device, {
      id: `crossfilter-${kind}-point-model`,
      source: CROSSFILTER_POINT_SHADER,
      topology: 'triangle-list',
      vertexCount: 6,
      instanceCount: sources.rowCount,
      isInstanced: true,
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'longitudeValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'latitudeValues', type: 'read-only-storage', group: 0, location: 1},
          {name: 'transactionValues', type: 'read-only-storage', group: 0, location: 2},
          {name: 'transactionRisks', type: 'read-only-storage', group: 0, location: 3},
          {name: 'transactionCategories', type: 'read-only-storage', group: 0, location: 4},
          {name: 'selectionMask', type: 'read-only-storage', group: 0, location: 5},
          {name: 'uniforms', type: 'uniform', group: 0, location: 6}
        ]
      },
      bindings: {
        longitudeValues: sources.longitude,
        latitudeValues: sources.latitude,
        transactionValues: sources.value,
        transactionRisks: sources.risk,
        transactionCategories: sources.category,
        selectionMask: sources.selectionMask,
        uniforms
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendAlphaOperation: 'add',
        blendColorSrcFactor: 'src-alpha',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha',
        depthCompare: 'always',
        depthWriteEnabled: false
      }
    });
  }
}

function createUniformBuffer(device: Device, id: string): Buffer {
  return device.createBuffer({
    id,
    data: new Float32Array(8),
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
}

function constrainViewport(
  viewport: CrossfilterViewport,
  canvasWidth: number,
  canvasHeight: number
): CrossfilterViewport | null {
  const minimumX = Math.max(0, Math.floor(viewport.x));
  const minimumY = Math.max(0, Math.floor(viewport.y));
  const maximumX = Math.min(canvasWidth, Math.ceil(viewport.x + viewport.width));
  const maximumY = Math.min(canvasHeight, Math.ceil(viewport.y + viewport.height));
  const width = maximumX - minimumX;
  const height = maximumY - minimumY;
  if (width <= 0 || height <= 0) return null;
  return {x: minimumX, y: minimumY, width, height};
}

function setViewport(
  renderPass: ReturnType<Device['beginRenderPass']>,
  viewport: CrossfilterViewport
): void {
  const rectangle: [number, number, number, number] = [
    viewport.x,
    viewport.y,
    viewport.width,
    viewport.height
  ];
  renderPass.setParameters({viewport: rectangle, scissorRect: rectangle});
}
