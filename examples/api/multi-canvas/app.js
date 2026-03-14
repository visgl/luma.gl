// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import React from 'react';
import { createRoot } from 'react-dom/client';
import { luma } from '@luma.gl/core';
import { Model, ShaderInputs } from '@luma.gl/engine';
import { webgl2Adapter } from '@luma.gl/webgl';
import { webgpuAdapter } from '@luma.gl/webgpu';
const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 280;
const FULLSCREEN_POSITIONS = new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]);
const appShaderModule = {
    name: 'app',
    uniformTypes: {
        resolution: 'vec2<f32>',
        time: 'f32',
        speed: 'f32'
    }
};
const VISUALIZATIONS = [
    {
        title: 'Concentric Waves',
        description: 'A radial shader rendered into its own PresentationContext-backed canvas.',
        clearColor: [0.02, 0.03, 0.05, 1],
        speed: 1.0,
        fragmentShaderWGSL: /* wgsl */ `\
@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  var centered = inputs.uv * 2.0 - vec2<f32>(1.0, 1.0);
  centered.x *= app.resolution.x / max(app.resolution.y, 1.0);

  let radius = length(centered);
  let angle = atan2(centered.y, centered.x);
  let rings = 0.5 + 0.5 * cos(28.0 * radius - app.time * 5.0 * app.speed);
  let spokes = 0.5 + 0.5 * sin(6.0 * angle + app.time * 2.5 * app.speed);
  let vignette = smoothstep(1.15, 0.2, radius);

  var color = mix(vec3<f32>(0.08, 0.12, 0.18), vec3<f32>(1.0, 0.64, 0.18), rings);
  color = mix(color, vec3<f32>(0.14, 0.7, 1.0), 0.35 * spokes);

  return vec4<f32>(color * vignette, 1.0);
}
`,
        fragmentShaderGLSL: /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform appUniforms {
  vec2 resolution;
  float time;
  float speed;
} app;

void main(void) {
  vec2 centered = vUV * 2.0 - vec2(1.0);
  centered.x *= app.resolution.x / max(app.resolution.y, 1.0);

  float radius = length(centered);
  float angle = atan(centered.y, centered.x);
  float rings = 0.5 + 0.5 * cos(28.0 * radius - app.time * 5.0 * app.speed);
  float spokes = 0.5 + 0.5 * sin(6.0 * angle + app.time * 2.5 * app.speed);
  float vignette = smoothstep(1.15, 0.2, radius);

  vec3 color = mix(vec3(0.08, 0.12, 0.18), vec3(1.0, 0.64, 0.18), rings);
  color = mix(color, vec3(0.14, 0.7, 1.0), 0.35 * spokes);

  fragColor = vec4(color * vignette, 1.0);
}
`
    },
    {
        title: 'Animated Noise',
        description: 'A second visualization presented through a different PresentationContext on the same Device.',
        clearColor: [0.01, 0.02, 0.02, 1],
        speed: 1.4,
        fragmentShaderWGSL: /* wgsl */ `\
fn hash(point: vec2<f32>) -> f32 {
  return fract(sin(dot(point, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

fn noise(point: vec2<f32>) -> f32 {
  let cell = floor(point);
  let local = fract(point);
  let blend = local * local * (3.0 - 2.0 * local);

  let a = hash(cell);
  let b = hash(cell + vec2<f32>(1.0, 0.0));
  let c = hash(cell + vec2<f32>(0.0, 1.0));
  let d = hash(cell + vec2<f32>(1.0, 1.0));

  let x1 = mix(a, b, blend.x);
  let x2 = mix(c, d, blend.x);
  return mix(x1, x2, blend.y);
}

@fragment
fn fragmentMain(inputs: FragmentOutput) -> @location(0) vec4<f32> {
  let scaledUv = inputs.uv * (app.resolution / 120.0);
  let drift = vec2<f32>(app.time * 0.28 * app.speed, app.time * 0.18 * app.speed);
  let grain = noise(scaledUv + drift);
  let scan = 0.5 + 0.5 * sin((inputs.uv.y + app.time * 0.03 * app.speed) * app.resolution.y * 0.12);

  let baseColor = mix(vec3<f32>(0.04, 0.05, 0.05), vec3<f32>(0.18, 0.95, 0.72), grain);
  let color = baseColor * (0.55 + 0.45 * scan);
  return vec4<f32>(color, 1.0);
}
`,
        fragmentShaderGLSL: /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

layout(std140) uniform appUniforms {
  vec2 resolution;
  float time;
  float speed;
} app;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);

  float a = hash(cell);
  float b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0));
  float d = hash(cell + vec2(1.0, 1.0));

  float x1 = mix(a, b, blend.x);
  float x2 = mix(c, d, blend.x);
  return mix(x1, x2, blend.y);
}

void main(void) {
  vec2 scaledUv = vUV * (app.resolution / 120.0);
  vec2 drift = vec2(app.time * 0.28 * app.speed, app.time * 0.18 * app.speed);
  float grain = noise(scaledUv + drift);
  float scan = 0.5 + 0.5 * sin((vUV.y + app.time * 0.03 * app.speed) * app.resolution.y * 0.12);

  vec3 baseColor = mix(vec3(0.04, 0.05, 0.05), vec3(0.18, 0.95, 0.72), grain);
  vec3 color = baseColor * (0.55 + 0.45 * scan);
  fragColor = vec4(color, 1.0);
}
`
    }
];
const FULLSCREEN_SOURCE = /* wgsl */ `\
struct AppUniforms {
  resolution: vec2<f32>,
  time: f32,
  speed: f32,
};

@group(0) @binding(0) var<uniform> app : AppUniforms;

struct VertexInput {
  @location(0) position: vec2<f32>,
}

struct FragmentOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> FragmentOutput {
  var output: FragmentOutput;
  output.position = vec4<f32>(input.position, 0.0, 1.0);
  output.uv = input.position * 0.5 + vec2<f32>(0.5, 0.5);
  return output;
}
`;
const FULLSCREEN_VERTEX_SHADER = /* glsl */ `\
#version 300 es
layout(location = 0) in vec2 position;

out vec2 vUV;

void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
  vUV = position * 0.5 + vec2(0.5, 0.5);
}
`;
class MultiCanvasRenderer {
    device;
    visualizations;
    animationFrame = null;
    startTime = 0;
    constructor(device, canvases) {
        this.device = device;
        this.visualizations = canvases.map((canvas, index) => createVisualizationRenderer(device, canvas, VISUALIZATIONS[index]));
    }
    start() {
        this.startTime = performance.now();
        this.animationFrame = requestAnimationFrame(this.animate);
    }
    destroy() {
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        for (const visualization of this.visualizations) {
            visualization.model.destroy();
            visualization.buffer.destroy();
            visualization.presentationContext.destroy();
        }
    }
    animate = (timestamp) => {
        const time = (timestamp - this.startTime) / 1000;
        for (const visualization of this.visualizations) {
            renderVisualization(this.device, visualization, time);
        }
        this.animationFrame = requestAnimationFrame(this.animate);
    };
}
export default class App extends React.PureComponent {
    static defaultProps = {
        deviceType: 'webgl'
    };
    canvasRefs = [
        React.createRef(),
        React.createRef()
    ];
    device = null;
    renderer = null;
    constructor(props) {
        super(props);
        this.state = {
            initializationError: null,
            isReady: false
        };
    }
    async componentDidMount() {
        const { deviceType = 'webgl' } = this.props;
        try {
            if (typeof OffscreenCanvas === 'undefined') {
                throw new Error('This example requires OffscreenCanvas support.');
            }
            const canvases = this.canvasRefs.map(ref => ref.current);
            if (canvases.some(canvas => !canvas)) {
                throw new Error('Multi-context canvases were not mounted.');
            }
            this.device = await luma.createDevice({
                adapters: [webgl2Adapter, webgpuAdapter],
                type: deviceType,
                createCanvasContext: {
                    canvas: new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT),
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    autoResize: false,
                    useDevicePixels: false
                }
            });
            this.renderer = new MultiCanvasRenderer(this.device, canvases);
            this.renderer.start();
            this.setState({ initializationError: null, isReady: true });
        }
        catch (error) {
            this.setState({
                initializationError: error instanceof Error ? error.message : String(error),
                isReady: false
            });
        }
    }
    componentWillUnmount() {
        this.renderer?.destroy();
        this.device?.destroy();
    }
    render() {
        const { initializationError, isReady } = this.state;
        return (React.createElement("div", { style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 20
            } },
            React.createElement("div", null,
                React.createElement("p", null,
                    "Rendering to two examples using one shared luma.gl ",
                    React.createElement("code", null, "Device"),
                    "."),
                React.createElement("p", null,
                    "On WebGL rendering happens in an offscreen canvas, then results are copied into the target canvases via two separate PresentationContexts using",
                    ' ',
                    React.createElement("code", null, "presentationContext.present()"),
                    "."),
                initializationError ? React.createElement("p", { style: { color: '#b00020' } }, initializationError) : null),
            React.createElement("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 20,
                    alignItems: 'start'
                } }, VISUALIZATIONS.map((visualization, index) => (React.createElement("div", { key: visualization.title, style: {
                    display: 'grid',
                    gridTemplateRows: 'minmax(92px, auto) auto',
                    gap: 10
                } },
                React.createElement("div", { style: {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        paddingBottom: 2
                    } },
                    React.createElement("h3", { style: { marginTop: 0, marginBottom: 6 } }, visualization.title),
                    React.createElement("p", { style: { margin: 0, lineHeight: 1.45 } }, visualization.description)),
                React.createElement("canvas", { ref: this.canvasRefs[index], width: CANVAS_WIDTH, height: CANVAS_HEIGHT, style: {
                        width: '100%',
                        maxWidth: CANVAS_WIDTH,
                        height: 'auto',
                        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
                        border: '1px solid #1f192c',
                        background: '#000',
                        opacity: isReady ? 1 : 0.5
                    } })))))));
    }
}
function createVisualizationRenderer(device, canvas, spec) {
    const buffer = device.createBuffer({ data: FULLSCREEN_POSITIONS });
    const shaderInputs = new ShaderInputs({
        app: appShaderModule
    });
    const presentationContext = device.createPresentationContext({
        canvas,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        autoResize: false,
        useDevicePixels: false
    });
    const model = new Model(device, {
        id: `${spec.title.toLowerCase().replace(/\s+/g, '-')}-model`,
        source: `${FULLSCREEN_SOURCE}\n${spec.fragmentShaderWGSL}`,
        vs: FULLSCREEN_VERTEX_SHADER,
        fs: spec.fragmentShaderGLSL,
        bufferLayout: [{ name: 'position', format: 'float32x2' }],
        attributes: {
            position: buffer
        },
        vertexCount: 4,
        topology: 'triangle-strip',
        shaderInputs
    });
    return { buffer, model, presentationContext, shaderInputs, spec };
}
function renderVisualization(device, visualization, time) {
    const framebuffer = visualization.presentationContext.getCurrentFramebuffer({
        depthStencilFormat: false
    });
    const [width, height] = visualization.presentationContext.getDrawingBufferSize();
    visualization.shaderInputs.setProps({
        app: {
            resolution: [width, height],
            time,
            speed: visualization.spec.speed
        }
    });
    visualization.model.updateShaderInputs();
    const renderPass = device.beginRenderPass({
        framebuffer,
        clearColor: visualization.spec.clearColor
    });
    visualization.model.draw(renderPass);
    renderPass.end();
    visualization.presentationContext.present();
}
export function renderToDOM(container, props = {}) {
    const root = createRoot(container);
    root.render(React.createElement(App, { ...props }));
    return () => {
        queueMicrotask(() => root.unmount());
    };
}
