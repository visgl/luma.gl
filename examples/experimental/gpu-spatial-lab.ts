// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import './gpu-spatial-lab.css';
import {GPUCommandGraphDebugPanel} from '../gpu-command-graph-debug-panel';

import {Buffer, type Device} from '@luma.gl/core';
import {AnimationLoopTemplate, Model, OrbitControls, type AnimationProps} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  GPUCommandGraphInspector,
  GPUReduction,
  type CompiledGPUCommandGraph
} from '@luma.gl/gpgpu/gpu-core';
import {GPUMeshNormals, GPUMeshVertexNormals, GPUMeshSmoothing} from '@luma.gl/gpgpu/gpu-geometry';
import {
  GPUPointCloudVoxelDownsample,
  GPUPointCloudRadiusFilter
} from '@luma.gl/gpgpu/gpu-pointcloud';
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel,
  makeHtmlCustomPanel
} from '../example-panels';

/** Two small, deterministic datasets keep every example self-contained and reproducible. */
export function makeSpatialLabMesh(size = 32) {
  const positions = new Float32Array(size * size * 3);
  const pinned = new Uint32Array(size * size);
  const indices: number[] = [];
  const neighbors = Array.from({length: size * size}, () => new Set<number>());
  const faces = Array.from({length: size * size}, () => new Set<number>());
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const index = row * size + column;
      const horizontal = (column / (size - 1)) * 1.8 - 0.9;
      const vertical = (row / (size - 1)) * 1.8 - 0.9;
      positions.set(
        [
          horizontal,
          0.24 * Math.cos(horizontal * 3) * Math.sin(vertical * 3) + 0.09 * Math.sin(index * 17.13),
          vertical
        ],
        index * 3
      );
      pinned[index] = Number(row === 0 || column === 0 || row === size - 1 || column === size - 1);
      if (row < size - 1 && column < size - 1) {
        indices.push(index, index + size, index + 1, index + 1, index + size, index + size + 1);
      }
    }
  }
  for (let face = 0; face < indices.length / 3; face++) {
    const vertices = indices.slice(face * 3, face * 3 + 3);
    for (const vertex of vertices) {
      faces[vertex].add(face);
      for (const neighbor of vertices) if (neighbor !== vertex) neighbors[vertex].add(neighbor);
    }
  }
  function packRows(rows: Set<number>[]) {
    const offsets = new Uint32Array(rows.length + 1);
    const values: number[] = [];
    rows.forEach((row, index) => {
      offsets[index] = values.length;
      values.push(...row);
    });
    offsets[rows.length] = values.length;
    return {offsets, values: new Uint32Array(values)};
  }
  return {
    positions,
    pinned,
    indices: new Uint32Array(indices),
    neighbors: packRows(neighbors),
    faces: packRows(faces)
  };
}

export function makeSpatialLabPoints(count = 6000) {
  const positions = new Float32Array(count * 3);
  let seed = 7;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < count; index++) {
    const angle = random() * Math.PI * 2;
    const ring = 0.55 + (random() - 0.5) * 0.12;
    positions.set(
      index % 8 === 0
        ? [random() * 1.9 - 0.95, random() * 1.9 - 0.95, random() * 1.9 - 0.95]
        : [Math.cos(angle) * ring, (random() - 0.5) * 0.12, Math.sin(angle) * ring],
      index * 3
    );
  }
  return positions;
}

export function createSpatialLabTemplate(mode: 'geometry' | 'pointcloud') {
  return class SpatialLab extends AnimationLoopTemplate {
    static info = makeExamplePanelHostHtml();
    readonly device: Device;
    readonly buffers: Buffer[] = [];
    readonly models: Model[] = [];
    readonly panels: ExamplePanelManager;
    readonly graphInspector = new GPUCommandGraphInspector({maxSamples: 90});
    readonly graphDebugPanel = new GPUCommandGraphDebugPanel();
    countText = 'Source: 6,000 · Filtered: …';
    readonly viewUniforms: Buffer;
    compiled: CompiledGPUCommandGraph<void> | null = null;
    pending = true;
    rotating = true;
    sizeByPointCount = true;
    showVoxelGrid = false;
    gridSize = 16;
    neighborRadius = 0.22;
    smoothingIterations = 8;
    gridModel: Model | null = null;
    filteredCount: Buffer | null = null;
    countElement: Element | null = null;
    countGeneration = 0;
    readonly orbitControls: OrbitControls | null;
    rebuild: (value: number) => void;

    constructor({device, canvas}: AnimationProps) {
      super();
      this.device = device;
      this.orbitControls =
        canvas instanceof HTMLCanvasElement
          ? new OrbitControls(canvas, {
              yaw: -0.6,
              pitch: Math.asin(0.6),
              distance: 1,
              minDistance: 0.4,
              maxDistance: 4,
              enableRotate: true,
              autoRotate: true,
              autoRotateSpeed: -0.18
            })
          : null;
      this.viewUniforms = device.createBuffer({
        byteLength: 32,
        usage: Buffer.UNIFORM | Buffer.COPY_DST
      });
      this.rebuild = mode === 'geometry' ? this.createGeometry() : this.createPointCloud();
      const initial = mode === 'geometry' ? 8 : 0.22;
      this.rebuild(initial);
      const controlsPanel = makeHtmlCustomPanel({
        id: `gpu-${mode}-controls`,
        title: 'Controls',
        html: `<div class="spatial-controls">
<p class="hint">Left: original · Right: processed<br>Drag to orbit · Scroll or pinch to zoom</p>
${mode === 'pointcloud' ? '<p class="selection" data-counts aria-live="polite">Source: 6,000 · Filtered: …</p>' : ''}
<section class="control-card"><h2>Processing</h2>
<label><span>${mode === 'geometry' ? 'Smoothing iterations' : 'Neighbor radius'} <output data-value>${initial}</output></span>
<input aria-label="${mode === 'geometry' ? 'Smoothing iterations' : 'Neighbor radius'}" data-control type="range" min="${mode === 'geometry' ? 0 : 0.1}" max="${mode === 'geometry' ? 20 : 0.4}" step="${mode === 'geometry' ? 1 : 0.01}" value="${initial}"></label>
${mode === 'pointcloud' ? '<label><span>Grid cells per axis <output data-grid-value>16</output></span><input aria-label="Grid cells per axis" data-grid-size type="range" min="2" max="16" step="1" value="16"></label>' : ''}
<p class="hint">${mode === 'geometry' ? 'Boundary vertices stay fixed during smoothing.' : 'Keeps representatives with at least 3 neighbors within the radius.'}</p>
</section>
<section class="control-card"><h2>View</h2>
<label class="toggle">Rotate<input data-rotate type="checkbox" checked></label>
${mode === 'pointcloud' ? '<label class="toggle">Voxel grid on input<input data-grid type="checkbox"></label><label class="toggle">Size by point count<input data-size-by-count type="checkbox" checked></label><p class="hint">Radius grows gently with voxel population.</p>' : ''}
</section>
</div>`,
        onRender: root => {
          this.countElement = root.querySelector('[data-counts]');
          if (this.countElement) this.countElement.textContent = this.countText;
          const radiusControl = root.querySelector<HTMLInputElement>('[data-control]');
          if (radiusControl && mode === 'pointcloud')
            radiusControl.value = String(this.neighborRadius);
          const radiusLabel = root.querySelector('[data-value]');
          if (radiusLabel && mode === 'pointcloud')
            radiusLabel.textContent = String(this.neighborRadius);
          const gridControl = root.querySelector<HTMLInputElement>('[data-grid-size]');
          if (gridControl) gridControl.value = String(this.gridSize);
          const gridLabel = root.querySelector('[data-grid-value]');
          if (gridLabel) gridLabel.textContent = String(this.gridSize);
          for (const [selector, checked] of [
            ['[data-grid]', this.showVoxelGrid],
            ['[data-rotate]', this.rotating],
            ['[data-size-by-count]', this.sizeByPointCount]
          ] as const) {
            const input = root.querySelector<HTMLInputElement>(selector);
            if (input) input.checked = checked;
          }
          root.querySelector<HTMLInputElement>('[data-grid]')?.addEventListener('change', event => {
            if (event.target instanceof HTMLInputElement) this.showVoxelGrid = event.target.checked;
          });
          root
            .querySelector<HTMLInputElement>('[data-grid-size]')
            ?.addEventListener('input', event => {
              if (!(event.target instanceof HTMLInputElement)) return;
              this.gridSize = Number(event.target.value);
              const label = root.querySelector('[data-grid-value]');
              if (label) label.textContent = String(this.gridSize);
              this.rebuild(this.neighborRadius);
            });
          root
            .querySelector<HTMLInputElement>('[data-control]')
            ?.addEventListener('input', event => {
              const target = event.target;
              if (!(target instanceof HTMLInputElement)) return;
              const value = Number(target.value);
              const label = root.querySelector('output');
              if (label) label.textContent = String(value);
              this.rebuild(value);
            });
          root
            .querySelector<HTMLInputElement>('[data-rotate]')
            ?.addEventListener('change', event => {
              if (event.target instanceof HTMLInputElement) this.rotating = event.target.checked;
            });
          root
            .querySelector<HTMLInputElement>('[data-size-by-count]')
            ?.addEventListener('change', event => {
              if (event.target instanceof HTMLInputElement) {
                this.sizeByPointCount = event.target.checked;
              }
            });
          return () => {
            this.countElement = null;
          };
        }
      });
      this.panels = new ExamplePanelManager({
        panel: makeExampleTabbedPanel({
          id: `gpu-${mode}-tabs`,
          title:
            mode === 'geometry' ? 'GPU Geometry · Surface Lab' : 'GPU Point Cloud · Cleanup Lab',
          panels: [controlsPanel, this.graphDebugPanel.panel]
        })
      });
      this.panels.mount();
    }

    createBuffer(data: Float32Array | Uint32Array, index = false) {
      const buffer = this.device.createBuffer({
        data,
        usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_DST | (index ? Buffer.INDEX : 0),
        ...(index ? {indexType: 'uint32' as const} : {})
      });
      this.buffers.push(buffer);
      return buffer;
    }

    importView<Format extends 'float32x3' | 'uint32'>(
      graph: GPUCommandGraph<void>,
      buffer: Buffer,
      format: Format,
      length = buffer.byteLength / (format === 'float32x3' ? 12 : 4)
    ) {
      const handle = graph.importBuffer(
        {
          id: `spatial-buffer-${this.buffers.indexOf(buffer)}`,
          byteLength: buffer.byteLength,
          usage: buffer.usage
        },
        buffer
      );
      return graph.createDataView(handle, {
        format,
        length
      });
    }

    createGeometry() {
      const mesh = makeSpatialLabMesh();
      const original = this.createBuffer(mesh.positions);
      const first = this.createBuffer(new Float32Array(mesh.positions.length));
      const second = this.createBuffer(new Float32Array(mesh.positions.length));
      const indices = this.createBuffer(mesh.indices, true);
      const offsets = this.createBuffer(mesh.neighbors.offsets);
      const neighbors = this.createBuffer(mesh.neighbors.values);
      const incidenceOffsets = this.createBuffer(mesh.faces.offsets);
      const incidence = this.createBuffer(mesh.faces.values);
      const pins = this.createBuffer(mesh.pinned);
      const originalNormals = this.createBuffer(new Float32Array(mesh.positions.length));
      const processedNormals = this.createBuffer(new Float32Array(mesh.positions.length));
      const faceNormals = this.createBuffer(new Float32Array(mesh.indices.length));
      this.models.push(
        this.createModel(original, originalNormals, indices),
        this.createModel(original, processedNormals, indices)
      );
      return (iterations: number) => {
        this.smoothingIterations = iterations;
        this.compiled?.destroy();
        const graph = new GPUCommandGraph<void>(this.device, {id: `gpu-${mode}-processing`});
        const positionViews = [original, first, second].map(buffer =>
          this.importView(graph, buffer, 'float32x3')
        );
        const indexView = this.importView(graph, indices, 'uint32');
        const offsetView = this.importView(graph, offsets, 'uint32');
        const neighborView = this.importView(graph, neighbors, 'uint32');
        const pinView = this.importView(graph, pins, 'uint32');
        const faceView = this.importView(graph, faceNormals, 'float32x3');
        const incidenceOffsetView = this.importView(graph, incidenceOffsets, 'uint32');
        const incidenceView = this.importView(graph, incidence, 'uint32');
        let current = 0;
        for (let iteration = 0; iteration < iterations; iteration++) {
          const next = (iteration % 2) + 1;
          graph.add(
            new GPUMeshSmoothing({
              id: `smooth-${iteration}`,
              positions: positionViews[current],
              output: positionViews[next],
              offsets: offsetView,
              neighbors: neighborView,
              pinned: pinView
            })
          );
          current = next;
        }
        for (const [index, normalBuffer] of [originalNormals, processedNormals].entries()) {
          graph.add(
            new GPUMeshNormals({
              id: `faces-${index}`,
              positions: positionViews[index ? current : 0],
              indices: indexView,
              normals: faceView,
              areaWeighted: true
            })
          );
          graph.add(
            new GPUMeshVertexNormals({
              id: `vertices-${index}`,
              faceNormals: faceView,
              offsets: incidenceOffsetView,
              faceIndices: incidenceView,
              normals: this.importView(graph, normalBuffer, 'float32x3')
            })
          );
        }
        this.models[1].setAttributes({position: [original, first, second][current]});
        this.compiled = graph.compile();
        this.graphInspector.registerGraph(this.compiled);
        this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
        this.pending = true;
      };
    }

    createPointCloud() {
      const original = this.createBuffer(makeSpatialLabPoints());
      const filteredCount = this.device.createBuffer({
        byteLength: 4,
        usage: Buffer.STORAGE | Buffer.COPY_SRC
      });
      this.filteredCount = filteredCount;
      this.buffers.push(filteredCount);
      this.gridModel = this.createGridModel();
      const originalMask = this.createBuffer(new Uint32Array(original.byteLength / 12).fill(1));
      const output = this.createBuffer(new Float32Array(4096 * 3));
      const representatives = this.createBuffer(new Uint32Array(4096));
      const counts = this.createBuffer(new Uint32Array(4096));
      const neighborCounts = this.createBuffer(new Uint32Array(4096));
      const mask = this.createBuffer(new Uint32Array(4096));
      this.models.push(
        this.createModel(original, originalMask),
        this.createModel(output, mask, undefined, counts)
      );
      return (radius: number) => {
        this.neighborRadius = radius;
        this.countGeneration++;
        this.countText = 'Source: 6,000 · Filtered: …';
        if (this.countElement) this.countElement.textContent = this.countText;
        const voxelCount = this.gridSize ** 3;
        this.models[1].setInstanceCount(voxelCount);
        this.gridModel?.setVertexCount(6 * (this.gridSize + 1) ** 2);
        this.compiled?.destroy();
        const graph = new GPUCommandGraph<void>(this.device, {id: `gpu-${mode}-processing`});
        const outputView = this.importView(graph, output, 'float32x3', voxelCount);
        const countView = this.importView(graph, counts, 'uint32', voxelCount);
        const maskView = this.importView(graph, mask, 'uint32', voxelCount);
        graph.add(
          new GPUPointCloudVoxelDownsample({
            positions: this.importView(graph, original, 'float32x3'),
            output: outputView,
            counts: countView,
            representatives: this.importView(graph, representatives, 'uint32', voxelCount),
            origin: [-1, -1, -1],
            voxelSize: 2 / this.gridSize,
            gridSize: [this.gridSize, this.gridSize, this.gridSize]
          })
        );
        graph.add(
          new GPUPointCloudRadiusFilter({
            positions: outputView,
            validity: countView,
            counts: this.importView(graph, neighborCounts, 'uint32', voxelCount),
            mask: maskView,
            radius,
            minimumNeighbors: 3
          })
        );
        graph.add(
          new GPUReduction({
            input: maskView,
            output: this.importView(graph, filteredCount, 'uint32'),
            operation: 'sum'
          })
        );
        this.compiled = graph.compile();
        this.graphInspector.registerGraph(this.compiled);
        this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
        this.pending = true;
      };
    }

    createGridModel() {
      return new Model(this.device, {
        id: 'voxel-grid',
        source: GRID_SHADER,
        topology: 'line-list',
        vertexCount: 6 * 17 ** 2,
        bindings: {view: this.viewUniforms},
        shaderLayout: {
          attributes: [],
          bindings: [{name: 'view', group: 0, location: 0, type: 'uniform'}]
        },
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: false},
        colorAttachmentFormats: [this.device.preferredColorFormat],
        depthStencilAttachmentFormat: 'depth24plus'
      });
    }

    createModel(positions: Buffer, auxiliary: Buffer, indices?: Buffer, population?: Buffer) {
      const points = !indices;
      return new Model(this.device, {
        id: `gpu-${mode}-${this.models.length}-${positions.id}`,
        source: makeSpatialLabShader(points),
        topology: 'triangle-list',
        vertexCount: indices ? indices.byteLength / 4 : 6,
        isInstanced: points,
        instanceCount: points ? positions.byteLength / 12 : 1,
        indexBuffer: indices,
        attributes: {
          position: positions,
          auxiliary,
          ...(points ? {population: population ?? auxiliary} : {})
        },
        bufferLayout: [
          {name: 'position', format: 'float32x3', stepMode: points ? 'instance' : 'vertex'},
          {
            name: 'auxiliary',
            format: points ? 'uint32' : 'float32x3',
            stepMode: points ? 'instance' : 'vertex'
          },
          ...(points
            ? [{name: 'population', format: 'uint32' as const, stepMode: 'instance' as const}]
            : [])
        ],
        bindings: {view: this.viewUniforms},
        shaderLayout: {
          attributes: [
            {name: 'position', location: 0, type: 'vec3<f32>'},
            {name: 'auxiliary', location: 1, type: points ? 'u32' : 'vec3<f32>'},
            ...(points ? [{name: 'population', location: 2, type: 'u32' as const}] : [])
          ],
          bindings: [{name: 'view', group: 0, location: 0, type: 'uniform'}]
        },
        parameters: {depthCompare: 'less-equal', depthWriteEnabled: true},
        colorAttachmentFormats: [this.device.preferredColorFormat],
        depthStencilAttachmentFormat: 'depth24plus'
      });
    }

    override onRender({device, width, height, time}: AnimationProps) {
      if (this.pending) {
        if (this.compiled) {
          const encoding = this.compiled.encode(device.commandEncoder, {parameters: undefined});
          this.graphInspector.recordEncoding(this.compiled.id, encoding);
          this.graphDebugPanel.update(this.graphInspector.getSnapshot(), this.compiled.id);
        }
        this.pending = false;
        if (this.filteredCount) {
          device.submit();
          const generation = this.countGeneration;
          void this.filteredCount
            .readAsync()
            .then(data => {
              if (generation !== this.countGeneration) return;
              const count = new Uint32Array(data.buffer, data.byteOffset, 1)[0];
              this.countText = `Source: 6,000 · Filtered: ${count.toLocaleString()}`;
              if (this.countElement) this.countElement.textContent = this.countText;
            })
            .catch(() => {
              if (generation === this.countGeneration && this.countElement) {
                this.countElement.textContent = 'Source: 6,000 · Filtered: unavailable';
              }
            });
        }
      }
      this.orbitControls?.setAutoRotate(this.rotating);
      this.orbitControls?.update(time);
      this.viewUniforms.write(
        new Float32Array([
          -(this.orbitControls?.yaw ?? -0.6),
          Math.max(width / 2 / height, 0.1),
          Number(this.sizeByPointCount),
          this.gridSize,
          this.orbitControls?.pitch ?? Math.asin(0.6),
          1 / (this.orbitControls?.distance ?? 1),
          this.orbitControls?.roll ?? 0,
          0
        ])
      );
      const pass = device.beginRenderPass({clearColor: [0.018, 0.028, 0.055, 1], clearDepth: 1});
      const halfWidth = Math.floor(width / 2);
      pass.setParameters({viewport: [0, 0, halfWidth, height]});
      this.models[0].draw(pass);
      if (this.showVoxelGrid) this.gridModel?.draw(pass);
      pass.setParameters({viewport: [halfWidth, 0, width - halfWidth, height]});
      this.models[1].draw(pass);
      pass.end();
    }
    override onFinalize() {
      this.countGeneration++;
      this.orbitControls?.destroy();
      this.gridModel?.destroy();
      this.panels.finalize();
      this.compiled?.destroy();
      this.models.forEach(model => model.destroy());
      this.buffers.forEach(buffer => buffer.destroy());
      this.viewUniforms.destroy();
    }
  };
}

function makeSpatialLabShader(points: boolean) {
  return `struct View { angle: f32, aspect: f32, sizeByPointCount: f32, gridSize: f32, pitch: f32, zoom: f32, roll: f32, padding: f32 };
@group(0) @binding(0) var<uniform> view: View;
struct VertexOutput { @builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) corner: vec2f };
fn rotate(position: vec3f) -> vec3f {
  let horizontal = cos(view.angle) * position.x + sin(view.angle) * position.z;
  let depth = -sin(view.angle) * position.x + cos(view.angle) * position.z;
  return vec3f(horizontal, position.y * cos(view.pitch) - depth * sin(view.pitch), position.y * sin(view.pitch) + depth * cos(view.pitch));
}
@vertex fn vertexMain(@location(0) position: vec3f, @location(1) auxiliary: ${points ? 'u32' : 'vec3f'}, ${points ? '@location(2) population: u32,' : ''} @builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var output: VertexOutput;
  let rotated = rotate(position);
  output.position = vec4f((rotated.x * cos(view.roll) + rotated.y * sin(view.roll)) * view.zoom * 0.75 / max(view.aspect, 1.0), (rotated.y * cos(view.roll) - rotated.x * sin(view.roll)) * view.zoom * 0.75 * min(view.aspect, 1.0), 0.5 + rotated.z * 0.2, 1.0);
  output.corner = vec2f(0.0);
  ${
    points
      ? `let corners = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
  output.corner = corners[vertexIndex];
  let populationScale = min(2.5, 1.0 + 0.2 * log2(f32(max(population, 1u))));
  let radiusScale = select(1.0, populationScale, view.sizeByPointCount > 0.5);
  output.position = vec4f(output.position.xy + output.corner * radiusScale * vec2f(0.006 / view.aspect, 0.006), output.position.zw);
  if (auxiliary == 0u) { output.position = vec4f(2,2,2,1); }
  output.color = mix(vec3f(0.15,0.65,0.95), vec3f(1.0,0.5,0.18), clamp(position.y + 0.5, 0.0, 1.0));`
      : `let normal = rotate(auxiliary);
  let light = 0.25 + 0.75 * abs(dot(normal, normalize(vec3f(0.3,0.8,0.5))));
  output.color = vec3f(0.22,0.72,0.82) * light;`
  }
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  ${points ? 'if (dot(input.corner, input.corner) > 1.0) { discard; }' : ''}
  return vec4f(input.color, 1.0);
}`;
}

const GRID_SHADER = `struct View { angle: f32, aspect: f32, sizeByPointCount: f32, gridSize: f32, pitch: f32, zoom: f32, roll: f32, padding: f32 };
@group(0) @binding(0) var<uniform> view: View;
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let side = u32(view.gridSize) + 1u;
  let line = vertexIndex / 2u;
  let axis = line / (side * side);
  let first = f32((line % (side * side)) / side) * 2.0 / view.gridSize - 1.0;
  let second = f32(line % side) * 2.0 / view.gridSize - 1.0;
  let endpoint = f32(vertexIndex % 2u) * 2.0 - 1.0;
  var position = vec3f(endpoint, first, second);
  if (axis == 1u) { position = vec3f(first, endpoint, second); }
  if (axis == 2u) { position = vec3f(first, second, endpoint); }
  let horizontal = cos(view.angle) * position.x + sin(view.angle) * position.z;
  let depth = -sin(view.angle) * position.x + cos(view.angle) * position.z;
  let rotated = vec3f(horizontal, position.y * cos(view.pitch) - depth * sin(view.pitch), position.y * sin(view.pitch) + depth * cos(view.pitch));
  return vec4f((rotated.x * cos(view.roll) + rotated.y * sin(view.roll)) * view.zoom * 0.75 / max(view.aspect, 1.0), (rotated.y * cos(view.roll) - rotated.x * sin(view.roll)) * view.zoom * 0.75 * min(view.aspect, 1.0), 0.5 + rotated.z * 0.2, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4f {
  return vec4f(0.22, 0.22, 0.22, 1.0);
}`;
