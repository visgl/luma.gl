// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma, Buffer, Texture, type Framebuffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model} from '@luma.gl/engine';
import {ScientificFlowGraph} from '@luma.gl/experimental';
import {makeField} from './fields';
import './style.css';

function element<ElementType extends HTMLElement>(identifier: string): ElementType {
  return document.querySelector<ElementType>('#' + identifier)!;
}
const canvas = element<HTMLCanvasElement>('flow');
const status = element<HTMLElement>('status');
const field = element<HTMLSelectElement>('field');
const count = element<HTMLSelectElement>('count');
const integrator = element<HTMLSelectElement>('integrator');
const speed = element<HTMLInputElement>('speed');
const exposure = element<HTMLInputElement>('exposure');
const pause = element<HTMLButtonElement>('pause');
element<HTMLButtonElement>('toggle-controls').onclick = () => {
  const opened = document.body.classList.toggle('controls-open');
  element<HTMLButtonElement>('toggle-controls').setAttribute('aria-expanded', String(opened));
};
const source = /* wgsl */ `
struct View {size: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> current: array<vec4f>;
@group(0) @binding(2) var<storage, read> previous: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {@builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) edge: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) index: u32) -> Vertex {
  let particle = current[index];
  let before = previous[index];
  let displacement = particle.xy - before.xy;
  let velocity = length(displacement) / max(view.size.z, 0.00001);
  let corner = CORNERS[vertex];
  let aspect = view.size.x / view.size.y;
  let extent = vec2f(min(1.18, 1.6 / aspect), 1.6);
  let direction = displacement * extent * view.size.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 0.001);
  var output: Vertex;
  let center = mix(before.xy, particle.xy, corner.x);
  output.position = vec4f((center - 0.5) * extent + vec2f(0.07,0) + normal * corner.y * 1.1 / view.size.xy, 0, 1);
  if (particle.z < 0.0 || particle.w != before.w) {output.position = vec4f(3,3,0,1);}
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,velocity));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,velocity));
  output.color *= view.size.w * (0.25 + 0.75 * min(particle.z, 1.0));
  output.edge = corner;
  return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
  let opacity = (1.0 - abs(input.edge.y)) * (0.35 + 0.65 * input.edge.x);
  return vec4f(input.color * opacity, 1);
}`;

try {
  const device = await luma.createDevice({
    adapters: [webgpuAdapter],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      throw error;
    }
  });
  const view = device.createBuffer({byteLength: 16, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  let history: Framebuffer;
  let historyTexture: Texture;
  let historyWidth = 0;
  let historyHeight = 0;
  const fullscreen = `
struct Vertex {@builtin(position) position: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 let corners = array<vec2f,3>(vec2f(-1,-1),vec2f(3,-1),vec2f(-1,3));
 var output: Vertex; output.position = vec4f(corners[index],0,1); return output;
}
`;
  const fade = new Model(device, {
    id: 'fade-trails',
    source:
      fullscreen +
      `
@fragment fn fragmentMain() -> @location(0) vec4f {return vec4f(0.018,0.035,0.055,0.035);}`,
    vertexCount: 3,
    parameters: {
      blend: true,
      blendColorSrcFactor: 'src-alpha',
      blendColorDstFactor: 'one-minus-src-alpha',
      depthWriteEnabled: false
    }
  });
  const present = new Model(device, {
    id: 'present-trails',
    source:
      fullscreen +
      `
@group(0) @binding(0) var history: texture_2d<f32>;
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
 return textureLoad(history, vec2i(input.position.xy), 0);
}`,
    vertexCount: 3,
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'history', type: 'texture', group: 0, location: 0}]
    }
  });
  function resizeHistory() {
    if (history && historyWidth === canvas.width && historyHeight === canvas.height) return;
    history?.destroy();
    historyTexture?.destroy();
    historyWidth = canvas.width;
    historyHeight = canvas.height;
    historyTexture = device.createTexture({
      width: historyWidth,
      height: historyHeight,
      format: 'rgba16float',
      usage: Texture.RENDER | Texture.SAMPLE
    });
    history = device.createFramebuffer({colorAttachments: [historyTexture]});
    const clear = device.beginRenderPass({
      framebuffer: history,
      clearColor: [0.018, 0.035, 0.055, 1]
    });
    clear.end();
    device.submit();
    present.setBindings({history: historyTexture});
  }
  let graph: ScientificFlowGraph;
  let particles: Model;
  let paused = false;
  let snapshotEnd = 0.25;
  let previousFrame = performance.now();
  function restart() {
    particles?.destroy();
    graph?.destroy();
    snapshotEnd = 0.25;
    previousFrame = performance.now();
    graph = new ScientificFlowGraph(device, {
      input: makeField(field.value, 0),
      ...(field.value === 'gyre'
        ? {nextInput: makeField(field.value, snapshotEnd), timeRange: [0, snapshotEnd] as const}
        : {}),
      bounds: [0, 0, 1, 1],
      particleCount: Number(count.value),
      lifetime: 45,
      seed: 17,
      integrator: integrator.value === 'rk2' ? 'rk2' : 'rk4'
    });
    particles = new Model(device, {
      id: 'scientific-flow-streaks',
      source,
      vertexCount: 6,
      instanceCount: Number(count.value),
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'view', type: 'uniform', group: 0, location: 0},
          {name: 'current', type: 'read-only-storage', group: 0, location: 1, visibility: 1},
          {name: 'previous', type: 'read-only-storage', group: 0, location: 2, visibility: 1}
        ]
      },
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one',
        depthWriteEnabled: false
      }
    });
    graph.step(0);
    element<HTMLOutputElement>('simulation-time').value = '0.00 s';
    historyWidth = 0;
    resizeHistory();
  }
  restart();
  field.onchange = count.onchange = integrator.onchange = restart;
  element<HTMLButtonElement>('reset').onclick = restart;
  pause.onclick = () => {
    paused = !paused;
    pause.textContent = paused ? 'Resume' : 'Pause';
  };
  speed.oninput = () => {
    element<HTMLOutputElement>('speed-value').value = Number(speed.value).toFixed(1) + '×';
  };
  let frames = 0;
  let lastReport = performance.now();
  let animationFrame = 0;
  let stopped = false;
  function animate(now: number) {
    if (stopped) return;
    try {
      // Discard long background-tab gaps; normal playback follows elapsed wall time.
      let deltaTime =
        Math.min(0.1, Math.max(0, (now - previousFrame) / 1000)) * Number(speed.value);
      previousFrame = now;
      if (!paused) {
        let remainingTime = deltaTime;
        while (remainingTime > 0) {
          if (field.value === 'gyre' && snapshotEnd - graph.time < 1e-10) {
            snapshotEnd += 0.25;
            graph.setNextSnapshot(makeField(field.value, snapshotEnd), snapshotEnd);
          }
          deltaTime =
            field.value === 'gyre'
              ? Math.min(remainingTime, snapshotEnd - graph.time)
              : remainingTime;
          graph.advance(deltaTime);
          remainingTime -= deltaTime;
        }
        element<HTMLOutputElement>('simulation-time').value = graph.time.toFixed(2) + ' s';
      }
      view.write(
        new Float32Array([
          canvas.width,
          canvas.height,
          deltaTime,
          (Number(exposure.value) * 1.2 * 65536) / Number(count.value)
        ])
      );
      particles.setBindings({view, current: graph.output, previous: graph.previous});
      resizeHistory();
      const pass = device.beginRenderPass({framebuffer: history, clearColor: false});
      if (!paused) {
        fade.draw(pass);
        particles.draw(pass);
      }
      pass.end();
      const screen = device.beginRenderPass({clearColor: [0.018, 0.035, 0.055, 1]});
      present.draw(screen);
      screen.end();
      device.submit();
      frames++;
      if (now - lastReport > 500) {
        status.textContent = `${Number(count.value).toLocaleString()} particles · ${Math.round((frames * 1000) / (now - lastReport))} fps · ${integrator.value.toUpperCase()}${paused ? ' · paused' : ''}`;
        frames = 0;
        lastReport = now;
      }
      animationFrame = requestAnimationFrame(animate);
    } catch (error) {
      fail(error);
    }
  }
  animationFrame = requestAnimationFrame(animate);
  window.addEventListener(
    'pagehide',
    () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      particles.destroy();
      graph.destroy();
      view.destroy();
      fade.destroy();
      present.destroy();
      history.destroy();
      historyTexture.destroy();
      device.destroy();
    },
    {once: true}
  );
} catch (error) {
  fail(error);
}

function fail(error: unknown) {
  const message = element<HTMLElement>('error');
  message.hidden = false;
  message.textContent = `The observatory requires WebGPU. Open this example in a browser with WebGPU enabled. ${String(error)}`;
  status.textContent = 'Simulation unavailable';
}
