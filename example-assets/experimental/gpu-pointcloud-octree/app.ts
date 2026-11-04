// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import '../gpu-spatial-lab.css';
import {Buffer, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {GPUCommandGraph, GPUCommandGraphInspector} from '@luma.gl/graph/gpu-core';
import {GPUPointCloudOctree} from '@luma.gl/graph/gpu-pointcloud';
import {GPUCommandGraphDebugPanel} from '../../gpu-command-graph-debug-panel';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../../example-panels';

export const title = 'Additive Octree · Point Cloud Tiles';
const POINT_COUNT = 32768;
const MAXIMUM_DEPTH = 5;

/** A reproducible, volumetric torus with fine surface ripples. */
function makePoints() {
  const positions = new Float32Array(POINT_COUNT * 3);
  let seed = 42;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < POINT_COUNT; index++) {
    const angle = random() * Math.PI * 2;
    const tubeAngle = random() * Math.PI * 2;
    const tubeRadius = 0.18 + 0.035 * Math.sin(angle * 12) + random() * 0.025;
    positions.set(
      [
        (0.61 + tubeRadius * Math.cos(tubeAngle)) * Math.cos(angle),
        tubeRadius * Math.sin(tubeAngle),
        (0.61 + tubeRadius * Math.cos(tubeAngle)) * Math.sin(angle)
      ],
      index * 3
    );
  }
  return positions;
}

export default class OctreeExample extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();
  readonly buffers: Buffer[] = [];
  readonly inspector = new GPUCommandGraphInspector();
  readonly debugPanel = new GPUCommandGraphDebugPanel({inspector: this.inspector});
  readonly panels: ExamplePanelManager;
  readonly orbit: OrbitControls | null;
  readonly view: Buffer;
  readonly compiled;
  readonly pointModel: Model;
  readonly tileModel: Model;
  readonly status: Buffer;
  readonly nodes: Buffer;
  records: Uint32Array = new Uint32Array(0);
  counts = new Array<number>(MAXIMUM_DEPTH + 1).fill(0);
  detail = 2;
  showTiles = true;
  rotating = true;
  progressive = false;
  lastReveal = 0;
  pending = true;
  ready = false;
  destroyed = false;
  controls: HTMLElement | null = null;
  message = 'Building octree on the GPU…';

  constructor({device, canvas}: AnimationProps) {
    super();
    const createBuffer = (data: Float32Array | Uint32Array) => {
      const buffer = device.createBuffer({
        data,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      this.buffers.push(buffer);
      return buffer;
    };
    const positions = createBuffer(makePoints());
    const pointIndices = createBuffer(new Uint32Array(POINT_COUNT));
    this.nodes = createBuffer(new Uint32Array(POINT_COUNT * 8));
    this.status = createBuffer(new Uint32Array(4));
    this.view = device.createBuffer({byteLength: 32, usage: Buffer.UNIFORM | Buffer.COPY_DST});
    this.orbit =
      canvas instanceof HTMLCanvasElement
        ? new OrbitControls(canvas, {
            yaw: -0.6,
            pitch: 0.65,
            distance: 1,
            minDistance: 0.4,
            maxDistance: 4,
            autoRotate: true,
            autoRotateSpeed: -0.12
          })
        : null;
    const graph = new GPUCommandGraph<void>(device, {id: 'additive-pointcloud-octree'});
    const importView = <Format extends 'float32x3' | 'uint32'>(buffer: Buffer, format: Format) =>
      graph.createDataView(
        graph.importBuffer(
          {id: buffer.id, byteLength: buffer.byteLength, usage: buffer.usage},
          buffer
        ),
        {
          format,
          length: buffer.byteLength / (format === 'float32x3' ? 12 : 4)
        }
      );
    graph.add(
      new GPUPointCloudOctree({
        positions: importView(positions, 'float32x3'),
        pointIndices: importView(pointIndices, 'uint32'),
        nodes: importView(this.nodes, 'uint32'),
        status: importView(this.status, 'uint32'),
        origin: [-1, -1, -1],
        size: 2,
        maximumDepth: MAXIMUM_DEPTH,
        nodePointLimit: 64
      })
    );
    this.compiled = graph.compile();
    this.inspector.registerGraph(this.compiled);
    this.debugPanel.update(this.inspector.getSnapshot(), this.compiled.id);
    this.pointModel = this.makeModel(device, false, positions, pointIndices);
    this.tileModel = this.makeModel(device, true, positions, pointIndices);
    const controls = makeHtmlCustomPanel({
      id: 'octree-controls',
      title: 'Controls',
      html: `<div class="spatial-controls">
<p class="hint">Drag to orbit · Scroll or pinch to zoom</p>
<p class="selection" data-counts aria-live="polite"></p>
<section class="control-card"><h2>Progressive detail</h2>
<label><span>Detail depth <output data-depth-value></output></span><input aria-label="Detail depth" data-depth type="range" min="0" max="${MAXIMUM_DEPTH}" step="1"></label>
<label class="toggle">Progressive reveal<input data-progressive type="checkbox"></label>
<p class="hint">Each level adds new points. Ancestor points stay visible; every source point belongs to exactly one tile.</p>
<p class="hint">Point colors: gold → coral → violet → blue → teal → green, from root to finest level.</p>
</section><section class="control-card"><h2>View</h2>
<label class="toggle">Tile bounds<input data-tiles type="checkbox"></label>
<label class="toggle">Rotate<input data-rotate type="checkbox"></label>
<p class="hint">Boxes show the current frontier, including leaves that end earlier. Positions stay in the original GPU buffer.</p>
</section></div>`,
      onRender: root => {
        this.controls = root;
        this.updateControls();
        root.querySelector<HTMLInputElement>('[data-depth]')?.addEventListener('input', event => {
          if (!(event.target instanceof HTMLInputElement)) return;
          this.detail = Number(event.target.value);
          this.progressive = false;
          this.updateControls();
        });
        for (const [selector, property] of [
          ['data-progressive', 'progressive'],
          ['data-tiles', 'showTiles'],
          ['data-rotate', 'rotating']
        ] as const) {
          root
            .querySelector<HTMLInputElement>(`[${selector}]`)
            ?.addEventListener('change', event => {
              if (!(event.target instanceof HTMLInputElement)) return;
              this[property] = event.target.checked;
              this.lastReveal = 0;
              if (property === 'progressive' && this.progressive) this.detail = 0;
              this.updateControls();
            });
        }
        return () => {
          this.controls = null;
        };
      }
    });
    this.panels = new ExamplePanelManager({
      panel: makeExampleTabbedPanel({
        id: 'octree-tabs',
        title,
        panels: [controls, this.debugPanel.panel]
      })
    });
    this.panels.mount();
  }

  updateControls() {
    const root = this.controls;
    if (!root) return;
    const depth = root.querySelector<HTMLInputElement>('[data-depth]');
    if (depth) depth.value = String(this.detail);
    const label = root.querySelector('[data-depth-value]');
    if (label) label.textContent = String(this.detail);
    for (const [selector, checked] of [
      ['data-progressive', this.progressive],
      ['data-tiles', this.showTiles],
      ['data-rotate', this.rotating]
    ] as const) {
      const input = root.querySelector<HTMLInputElement>(`[${selector}]`);
      if (input) input.checked = checked;
    }
    let frontier = 0;
    for (let offset = 0; offset < this.records.length; offset += 8) {
      const level = this.records[offset + 1];
      if (level === this.detail || (level < this.detail && this.records[offset + 4] === 0))
        frontier++;
    }
    const counts = root.querySelector('[data-counts]');
    if (counts)
      counts.textContent = this.ready
        ? `Source: ${POINT_COUNT.toLocaleString()} · Visible: ${this.counts[this.detail].toLocaleString()} · Frontier tiles: ${frontier.toLocaleString()}`
        : this.message;
  }

  async readMetadata() {
    try {
      const result = await this.status.readAsync();
      if (this.destroyed) return;
      const status = new Uint32Array(result.buffer, result.byteOffset, 4);
      if (status[3] || status[2] || status[1] !== POINT_COUNT) throw new Error('Incomplete octree');
      const data = await this.nodes.readAsync(0, status[0] * 32);
      if (this.destroyed) return;
      this.records = new Uint32Array(data.buffer, data.byteOffset, status[0] * 8);
      for (let offset = 0; offset < this.records.length; offset += 8) {
        for (let level = this.records[offset + 1]; level <= MAXIMUM_DEPTH; level++)
          this.counts[level] += this.records[offset + 6];
      }
      this.tileModel.setInstanceCount(status[0]);
      this.ready = true;
      this.updateControls();
    } catch {
      if (!this.destroyed) {
        this.message = 'Octree construction failed. Check the GPU Graph tab and console.';
        this.updateControls();
      }
    }
  }

  makeModel(device: Device, tiles: boolean, positions: Buffer, pointIndices: Buffer) {
    return new Model(device, {
      id: tiles ? 'octree-tile-bounds' : 'octree-points',
      source: makeShader(tiles),
      topology: tiles ? 'line-list' : 'triangle-list',
      vertexCount: tiles ? 24 : 6,
      isInstanced: true,
      instanceCount: 0,
      bindings: {view: this.view, nodes: this.nodes, ...(tiles ? {} : {positions, pointIndices})},
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'view', group: 0, location: 0, type: 'uniform'},
          {name: 'nodes', group: 0, location: 1, type: 'read-only-storage'},
          ...(tiles
            ? []
            : [
                {
                  name: 'positions',
                  group: 0,
                  location: 2,
                  type: 'read-only-storage' as const
                },
                {
                  name: 'pointIndices',
                  group: 0,
                  location: 3,
                  type: 'read-only-storage' as const
                }
              ])
        ]
      },
      parameters: {depthCompare: 'less-equal', depthWriteEnabled: !tiles},
      colorAttachmentFormats: [device.preferredColorFormat],
      depthStencilAttachmentFormat: 'depth24plus'
    });
  }

  override onRender({device, canvas, width, height, time}: AnimationProps) {
    if (this.pending) {
      const encoding = this.compiled.encode(device.commandEncoder, {parameters: undefined});
      this.inspector.recordEncoding(this.compiled.id, encoding);
      this.debugPanel.update(this.inspector.getSnapshot(), this.compiled.id);
      this.pending = false;
      device.submit();
      void this.readMetadata();
    }
    if (this.ready && this.progressive && time - this.lastReveal > 1800) {
      if (this.lastReveal) this.detail = (this.detail + 1) % (MAXIMUM_DEPTH + 1);
      this.lastReveal = time;
      this.updateControls();
    }
    this.orbit?.setAutoRotate(this.rotating);
    this.orbit?.update(time);
    const canvasWidth = canvas instanceof HTMLCanvasElement ? canvas.clientWidth : width;
    const viewportLeft = canvasWidth > 760 ? Math.round((360 * width) / canvasWidth) : 0;
    const viewportWidth = width - viewportLeft;
    this.view.write(
      new Float32Array([
        -(this.orbit?.yaw ?? -0.6),
        this.orbit?.pitch ?? 0.65,
        viewportWidth / Math.max(height, 1),
        1 / (this.orbit?.distance ?? 1),
        this.detail,
        this.records.length / 8,
        this.orbit?.roll ?? 0,
        0
      ])
    );
    this.pointModel.setInstanceCount(this.counts[this.detail]);
    const pass = device.beginRenderPass({clearColor: [0.018, 0.028, 0.055, 1], clearDepth: 1});
    pass.setParameters({viewport: [viewportLeft, 0, viewportWidth, height]});
    if (this.ready) {
      this.pointModel.draw(pass);
      if (this.showTiles) this.tileModel.draw(pass);
    }
    pass.end();
  }

  override onFinalize() {
    this.destroyed = true;
    this.panels.finalize();
    this.orbit?.destroy();
    this.compiled.destroy();
    this.pointModel.destroy();
    this.tileModel.destroy();
    this.view.destroy();
    this.buffers.forEach(buffer => buffer.destroy());
  }
}

function makeShader(tiles: boolean) {
  return `struct View { angle: f32, pitch: f32, aspect: f32, zoom: f32, detail: f32, nodeCount: f32, roll: f32, padding: f32 };
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> nodes: array<u32>;
${tiles ? '' : '@group(0) @binding(2) var<storage, read> positions: array<f32>;\n@group(0) @binding(3) var<storage, read> pointIndices: array<u32>;'}
struct VertexOutput { @builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) corner: vec2f };
fn project(position: vec3f) -> vec4f {
  let horizontal = cos(view.angle) * position.x + sin(view.angle) * position.z;
  let depth = -sin(view.angle) * position.x + cos(view.angle) * position.z;
  let rotated = vec3f(horizontal, position.y * cos(view.pitch) - depth * sin(view.pitch), position.y * sin(view.pitch) + depth * cos(view.pitch));
  return vec4f((rotated.x * cos(view.roll) + rotated.y * sin(view.roll)) * view.zoom * 0.75 / max(view.aspect, 1.0), (rotated.y * cos(view.roll) - rotated.x * sin(view.roll)) * view.zoom * 0.75 * min(view.aspect, 1.0), 0.5 + rotated.z * 0.2, 1.0);
}
fn color(level: u32) -> vec3f {
  let colors = array<vec3f,6>(vec3f(1,.76,.28),vec3f(1,.43,.35),vec3f(.7,.46,1),vec3f(.25,.65,1),vec3f(.16,.82,.8),vec3f(.4,.9,.5));
  return colors[min(level,5u)];
}
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> VertexOutput {
  var output: VertexOutput;
  output.corner = vec2f(0);
  ${
    tiles
      ? `let level = nodes[instance * 8u + 1u];
  let prefix = nodes[instance * 8u];
  var minimum = vec3f(-1);
  var size = 2.0;
  for (var depth = 0u; depth < level; depth++) {
    size *= 0.5;
    let octant = (prefix >> ((level - depth - 1u) * 3u)) & 7u;
    minimum += vec3f(f32((octant >> 2u) & 1u), f32((octant >> 1u) & 1u), f32(octant & 1u)) * size;
  }
  let edge = vertex / 2u;
  let axis = edge / 4u;
  var corner = vec3f(f32(vertex % 2u), f32((edge % 4u) / 2u), f32(edge % 2u));
  if (axis == 1u) { corner = corner.yxz; }
  if (axis == 2u) { corner = corner.yzx; }
  output.position = project(minimum + corner * size);
  let frontier = level == u32(view.detail) || (level < u32(view.detail) && nodes[instance * 8u + 4u] == 0u);
  if (!frontier) { output.position = vec4f(2,2,2,1); }
  output.color = mix(vec3f(.22), color(level), .18);`
      : `let source = pointIndices[instance] * 3u;
  output.position = project(vec3f(positions[source], positions[source+1u], positions[source+2u]));
  var lower = 0u;
  var upper = u32(view.nodeCount);
  // Node ranges are ordered, disjoint and nonempty.
  while (lower + 1u < upper) {
    let middle = (lower + upper) / 2u;
    if (nodes[middle * 8u + 5u] <= instance) { lower = middle; } else { upper = middle; }
  }
  output.color = color(nodes[lower * 8u + 1u]);
  let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
  output.corner = corners[vertex];
  output.position = vec4f(output.position.xy + output.corner * vec2f(.003 / view.aspect,.003), output.position.zw);`
  }
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  ${tiles ? '' : 'if (dot(input.corner,input.corner) > 1.0) { discard; }'}
  return vec4f(input.color,1);
}`;
}
