// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {luma, Buffer, Texture, type Framebuffer} from '@luma.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Model, loadImageBitmap} from '@luma.gl/engine';
import earthTextureUrl from '../../showcase/globe/earth.jpg';
import {GLOBE_PRESENTATION} from './globe';
import {
  ScientificFlowGraph,
  ScientificFlowTracer,
  type ScientificFlowTraceResult
} from '@luma.gl/graph/experimental/simulation';
import {makeField} from './fields';
import {ObservatoryControlPanel} from './control-panel';
import './style.css';

function element<ElementType extends HTMLElement>(identifier: string): ElementType {
  return document.querySelector<ElementType>('#' + identifier)!;
}
const canvas = element<HTMLCanvasElement>('flow');
const status = element<HTMLElement>('status');
const source = /* wgsl */ `
struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> current: array<vec4f>;
@group(0) @binding(2) var<storage, read> previous: array<vec4f>;
@group(0) @binding(3) var<storage, read> diagnostics: array<vec4f>;
const CORNERS = array<vec2f, 6>(vec2f(0,-1),vec2f(1,-1),vec2f(0,1),vec2f(0,1),vec2f(1,-1),vec2f(1,1));
struct Vertex {@builtin(position) position: vec4f, @location(0) color: vec3f, @location(1) edge: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Vertex {
  let particleCount = arrayLength(&current);
  let index = instance % particleCount;
  var wrapOffset = 0.0;
  if (instance >= particleCount) {wrapOffset = select(-1.0, 1.0, previous[index].x < 0.5);}
  let particle = current[index];
  let before = previous[index];
  var displacement = particle.xy - before.xy;
  if (view.options.z > 0.5) {displacement.x -= round(displacement.x);}
  let velocity = length(displacement) / max(particle.z - before.z, 0.00001) * select(1.0, 3.0, view.options.z > 0.5);
  let corner = CORNERS[vertex];
  let aspect = view.size.x / view.size.y;
  let extent = select(1.8 * vec2f(min(1.0, 1.0 / aspect), min(1.0, aspect)), vec2f(2.0), view.options.z > 0.5);
  let direction = displacement * extent * view.size.xy;
  let normal = vec2f(-direction.y, direction.x) / max(length(direction), 0.001);
  var output: Vertex;
  let center = before.xy + displacement * corner.x + vec2f(wrapOffset, 0);
  output.position = vec4f((center - 0.5) * extent + normal * corner.y * 1.1 / view.size.xy, 0, 1);
  if (particle.z < 0.0 || particle.w != before.w) {output.position = vec4f(3,3,0,1);}
  let cold = mix(vec3f(0.05,0.16,0.42),vec3f(0.07,0.8,0.85),smoothstep(0.0,0.15,velocity));
  output.color = mix(cold,vec3f(1.0,0.68,0.3),smoothstep(0.15,0.3,velocity));
  if (view.options.y > 0.5) {
    let particleDiagnostics = diagnostics[index];
    if (view.options.x > 0.5 && view.options.x < 1.5) {
      let stepScale = clamp(log2(max(particleDiagnostics.w, 0.0001) / 0.0001) / log2(10000.0), 0.0, 1.0);
      output.color = mix(vec3f(0.7,0.12,0.7), vec3f(0.2,1.0,0.65), stepScale);
    }
    if (particleDiagnostics.z > 0.5) {
      output.position = vec4f((particle.xy + vec2f(wrapOffset, 0) - 0.5) * extent + vec2f((corner.x - 0.5) * 2.0, corner.y) * 3.0 / view.size.xy, 0, 1);
      output.color = vec3f(1.0,0.45,0.12);
      if (particleDiagnostics.z == 1.0) {output.color = vec3f(0.5);}
      if (particleDiagnostics.z == 3.0) {output.color = vec3f(0.85,0.2,0.85);}
      if (particleDiagnostics.z >= 4.0) {output.color = vec3f(1.0,0.1,0.15);}
    } else if (view.options.x > 1.5) {output.color = vec3f(0.2,1.0,0.65);}
  }
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
    optionalFeatures: ['timestamp-query'],
    createCanvasContext: {canvas, autoResize: true},
    onError: error => {
      throw error;
    }
  });
  const view = device.createBuffer({byteLength: 32, usage: Buffer.UNIFORM | Buffer.COPY_DST});
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
    shaderLayout: {
      attributes: [],
      bindings: [{name: 'view', type: 'uniform', group: 0, location: 0}]
    },
    bindings: {view},
    source:
      fullscreen +
      `
struct View {size: vec4f, options: vec4f};
@group(0) @binding(0) var<uniform> view: View;
@fragment fn fragmentMain() -> @location(0) vec4f {return vec4f(0.018,0.035,0.055,select(0.035,0.014,view.options.z > 0.5));}`,
    vertexCount: 3,
    parameters: {
      blend: true,
      blendColorSrcFactor: 'src-alpha',
      blendColorDstFactor: 'one-minus-src-alpha',
      depthWriteEnabled: false
    }
  });
  const earthImage = await loadImageBitmap(earthTextureUrl);
  const earthTexture = device.createTexture({
    id: 'weather-earth',
    width: earthImage.width,
    height: earthImage.height,
    data: earthImage,
    format: 'rgba8unorm',
    usage: Texture.SAMPLE | Texture.COPY_DST | Texture.RENDER,
    sampler: {
      minFilter: 'linear',
      magFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge'
    }
  });
  earthImage.close();
  const presentation = device.createBuffer({
    byteLength: 32,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const present = new Model(device, {
    id: 'present-trails',
    source: fullscreen + GLOBE_PRESENTATION,
    vertexCount: 3,
    shaderLayout: {
      attributes: [],
      bindings: [
        {name: 'history', type: 'texture', group: 0, location: 0},
        {name: 'earth', type: 'texture', group: 0, location: 1},
        {name: 'presentation', type: 'uniform', group: 0, location: 3}
      ]
    },
    bindings: {earth: earthTexture, presentation}
  });
  let globeLongitude = -0.4;
  let globeLatitude = 0;
  let dragPosition: {horizontal: number; vertical: number} | undefined;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', event => {
    if (controls.settings.field !== 'weather') return;
    dragPosition = {horizontal: event.clientX, vertical: event.clientY};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (dragPosition === undefined) return;
    globeLongitude -= (event.clientX - dragPosition.horizontal) * 0.006;
    globeLatitude = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, globeLatitude + (event.clientY - dragPosition.vertical) * 0.006)
    );
    dragPosition = {horizontal: event.clientX, vertical: event.clientY};
  });
  const finishDrag = () => {
    dragPosition = undefined;
  };
  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);
  canvas.addEventListener('lostpointercapture', finishDrag);
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
  let graph: ScientificFlowGraph | ScientificFlowTracer;
  let activeField = 'gyre';
  let activeIntegrator = 'rk4';
  let activeCount = 262144;
  let restartRequested = false;
  let queuedTime = 0;
  let graphSamples = 0;
  let traceResult: ScientificFlowTraceResult | undefined;
  let particles: Model;
  const controls = new ObservatoryControlPanel(
    element<HTMLElement>('observatory-panels'),
    restart => {
      restartRequested ||= restart;
      updateLegend();
    },
    () => {
      restartRequested = true;
    }
  );
  function updateLegend() {
    const mode = activeIntegrator === 'rk45' ? controls.settings.coloring : 'speed';
    element<HTMLElement>('legend-low').textContent =
      mode === 'step' ? 'SHORT STEP' : mode === 'status' ? 'ACTIVE' : 'LOW VELOCITY';
    element<HTMLElement>('legend-high').textContent =
      mode === 'step' ? 'LONG STEP' : mode === 'status' ? 'STOPPED' : 'HIGH';
    element<HTMLElement>('legend-ramp').style.background =
      mode === 'step'
        ? 'linear-gradient(90deg,#b31fb3,#33ffa6)'
        : mode === 'status'
          ? 'linear-gradient(90deg,#33ffa6,#888,#ff731f,#d933d9,#ff1a26)'
          : 'linear-gradient(90deg,#164d9b,#24d8db,#c7e9a0,#ffb365)';
  }
  let snapshotEnd = 0.25;
  let previousFrame = performance.now();
  function restart() {
    controls.resetGraphDiagnostics();
    graphSamples = 0;
    particles?.destroy();
    graph?.destroy();
    snapshotEnd = 0.25;
    previousFrame = performance.now();
    activeField = controls.settings.field;
    activeIntegrator = controls.settings.integrator;
    activeCount = controls.settings.particleCount;
    queuedTime = 0;
    traceResult = undefined;
    const fields = {
      input: makeField(activeField, 0),
      ...(activeField === 'gyre' || activeField === 'weather'
        ? {nextInput: makeField(activeField, snapshotEnd), timeRange: [0, snapshotEnd] as const}
        : {}),
      bounds: [0, 0, 1, 1] as const,
      periodicLongitude: activeField === 'weather',
      lifetime: 45
    };
    if (activeIntegrator === 'rk45') {
      const positions = new Float32Array(activeCount * 2);
      const side = Math.ceil(Math.sqrt(activeCount));
      for (let index = 0; index < activeCount; index++) {
        positions[index * 2] = ((index % side) + 0.5) / side;
        positions[index * 2 + 1] = (Math.floor(index / side) + 0.5) / side;
      }
      graph = new ScientificFlowTracer(device, {
        ...fields,
        positions,
        tolerance: controls.settings.tolerance,
        maximumAttempts: 16
      });
    } else {
      graph = new ScientificFlowGraph(device, {
        ...fields,
        particleCount: activeCount,
        seed: 17,
        integrator: activeIntegrator === 'rk2' ? 'rk2' : 'rk4'
      });
      graph.step(0);
    }
    controls.updateTelemetry({
      time: graph.time,
      queuedTime,
      particleCount: activeCount,
      integrator: activeIntegrator,
      framesPerSecond: 0,
      traceResult
    });
    updateLegend();
    particles = new Model(device, {
      id: 'scientific-flow-streaks',
      source,
      vertexCount: 6,
      instanceCount: controls.settings.particleCount * (activeField === 'weather' ? 2 : 1),
      shaderLayout: {
        attributes: [],
        bindings: [
          {name: 'view', type: 'uniform', group: 0, location: 0},
          {name: 'current', type: 'read-only-storage', group: 0, location: 1, visibility: 1},
          {name: 'previous', type: 'read-only-storage', group: 0, location: 2, visibility: 1},
          {name: 'diagnostics', type: 'read-only-storage', group: 0, location: 3, visibility: 1}
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
    historyWidth = 0;
    resizeHistory();
  }
  restart();
  let frames = 0;
  let lastReport = performance.now();
  let animationFrame = 0;
  let stopped = false;
  let currentFrame: Promise<void> | undefined;
  async function animate(now: number) {
    if (stopped) return;
    try {
      if (restartRequested) {
        restart();
        restartRequested = false;
      }
      // Discard long background-tab gaps; normal playback follows elapsed wall time.
      const frameSeconds = Math.min(0.1, Math.max(0, (now - previousFrame) / 1000));
      let deltaTime = frameSeconds * controls.settings.timeScale;
      previousFrame = now;
      resizeHistory();
      controls.redraw();
      if (!controls.settings.paused) {
        queuedTime += deltaTime;
        let firstSegment = true;
        while (queuedTime > 0 || (graph instanceof ScientificFlowTracer && graph.hasPendingWork)) {
          if (
            (activeField === 'gyre' || activeField === 'weather') &&
            graph.remainingTime === 0 &&
            !(graph instanceof ScientificFlowTracer && graph.hasPendingWork)
          ) {
            snapshotEnd += 0.25;
            graph.setNextSnapshot(makeField(activeField, snapshotEnd), snapshotEnd);
          }
          deltaTime =
            activeField === 'gyre' || activeField === 'weather'
              ? Math.min(queuedTime, graph.remainingTime)
              : queuedTime;
          if (graph instanceof ScientificFlowTracer) {
            if (graph.hasPendingWork) traceResult = await graph.continue();
            else {
              queuedTime -= deltaTime;
              traceResult = await graph.advance(deltaTime);
            }
            controls.diagnostics.record(graph.commandGraph, traceResult.encoding);
          } else {
            const substeps = Math.max(1, Math.ceil(deltaTime / graph.simulation.maximumTimeStep));
            const querySet =
              graphSamples++ % 60 === 0 && device.features.has('timestamp-query')
                ? device.createQuerySet({type: 'timestamp', count: 2})
                : undefined;
            try {
              const encoder = device.createCommandEncoder({timeProfilingQuerySet: querySet});
              const encoding = graph.record(encoder, deltaTime / substeps, substeps);
              device.submit(encoder.finish());
              controls.diagnostics.record(graph.commandGraph, encoding, querySet);
            } catch (error) {
              querySet?.destroy();
              throw error;
            }
            queuedTime -= deltaTime;
          }
          if (stopped) return;
          view.write(
            new Float32Array([
              canvas.width,
              canvas.height,
              deltaTime,
              (controls.settings.exposure * 1.2 * 65536) / activeCount,
              controls.settings.coloring === 'step'
                ? 1
                : controls.settings.coloring === 'status'
                  ? 2
                  : 0,
              activeIntegrator === 'rk45' ? 1 : 0,
              activeField === 'weather' ? 1 : 0,
              0
            ])
          );
          particles.setBindings({
            view,
            current: graph.output,
            previous: graph.previous,
            diagnostics: graph instanceof ScientificFlowTracer ? graph.diagnostics : graph.output
          });
          const pass = device.beginRenderPass({framebuffer: history, clearColor: false});
          if (firstSegment) fade.draw(pass);
          particles.draw(pass);
          pass.end();
          // Submit this segment before the next advance reuses its state and uniform buffers.
          device.submit();
          firstSegment = false;
          if (graph instanceof ScientificFlowTracer) break; // One bounded dispatch per animation frame.
        }
      }
      if (
        activeField === 'weather' &&
        controls.settings.rotateGlobe &&
        !controls.settings.paused &&
        dragPosition === undefined
      ) {
        globeLongitude += frameSeconds * 0.06;
      }
      presentation.write(
        new Float32Array([
          canvas.width,
          canvas.height,
          globeLongitude,
          activeField === 'weather' ? 1 : 0,
          globeLatitude,
          0,
          0,
          0
        ])
      );
      const screen = device.beginRenderPass({clearColor: [0.018, 0.035, 0.055, 1]});
      present.draw(screen);
      screen.end();
      device.submit();
      frames++;
      if (now - lastReport > 500) {
        status.textContent = `${activeCount.toLocaleString()} particles · ${Math.round((frames * 1000) / (now - lastReport))} fps · ${activeIntegrator.toUpperCase()}${activeField === 'weather' ? ' · synthetic winds · drag to rotate' : ''}${controls.settings.paused ? ' · paused' : ''}`;
        controls.updateTelemetry({
          time: graph.time,
          queuedTime,
          particleCount: activeCount,
          integrator: activeIntegrator,
          framesPerSecond: Math.round((frames * 1000) / (now - lastReport)),
          traceResult
        });
        frames = 0;
        lastReport = now;
      }
      animationFrame = requestAnimationFrame(now => {
        currentFrame = animate(now);
      });
    } catch (error) {
      fail(error);
    }
  }
  animationFrame = requestAnimationFrame(now => {
    currentFrame = animate(now);
  });
  window.addEventListener(
    'pagehide',
    () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      // Await the sole in-flight counter readback before releasing GPU resources.
      void (currentFrame ?? Promise.resolve()).then(() => {
        controls.destroy();
        particles.destroy();
        graph.destroy();
        view.destroy();
        fade.destroy();
        present.destroy();
        presentation.destroy();
        earthTexture.destroy();
        history.destroy();
        historyTexture.destroy();
        device.destroy();
      });
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
