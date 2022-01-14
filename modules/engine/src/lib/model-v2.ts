import type {
  Device,
  Buffer,
  RenderPipelineProps,
  RenderPass,
  Binding
} from '@luma.gl/api';
import {RenderPipeline, Shader, cast} from '@luma.gl/api';

export type ModelProps = Omit<RenderPipelineProps, 'vs' | 'fs'> & {
  // Model also accepts a string
  vs?: {glsl?: string; wgsl?: string} | Shader | string;
  fs?: {glsl?: string; wgsl?: string} | Shader | string;
  pipeline?: RenderPipeline;
};

const DEFAULT_MODEL_PROPS: Required<ModelProps> = {
  id: 'unnamed',
  handle: undefined,
  userData: {},

  ...RenderPipeline._DEFAULT_PROPS,
  vs: undefined,
  vsEntryPoint: undefined,
  vsConstants: undefined,
  fs: undefined,
  fsEntryPoint: undefined,
  fsConstants: undefined,
  pipeline: undefined,
  layout: {attributes: [], bindings: []},

  topology: 'triangle-list',
  // targets:

  vertexCount: 0,
  instanceCount: 0,
  parameters: {},

  attributes: {},
  bindings: {}
};

/** v9 API */
export default class Model {
  readonly device: Device;
  readonly pipeline: RenderPipeline;
  readonly id: string;
  readonly vs: Shader;
  readonly fs: Shader | undefined;
  props: Required<ModelProps>;

  constructor(device: Device, props: ModelProps) {
    this.props = {...DEFAULT_MODEL_PROPS, ...props};
    props = this.props;
    this.id = props.id;
    this.device = device;

    // Create the pipeline
    if (props.pipeline) {
      this.pipeline = props.pipeline;
    } else {
      this.vs = getShader(this.device, props.vs, 'vertex');
      if (props.fs) {
        this.fs = getShader(this.device, props.fs, 'fragment');
      }

      this.pipeline = this.device.createRenderPipeline({
        ...this.props,
        vs: this.vs,
        fs: this.fs,
        topology: props.topology,
        parameters: props.parameters,
        // Geometry in the vertex shader!
        layout: props.layout
      });
    }

    this.setAttributes(this.props.attributes);
    this.setBindings(this.props.bindings);
  }

  destroy(): void {
    this.pipeline.destroy();
  }

  draw(renderPass?: RenderPass) {
    this.pipeline.draw({
      renderPass,
      vertexCount: this.props.vertexCount,
      instanceCount: this.props.instanceCount
    });
  }

  setProps(props: ModelProps) {
    if (props.attributes) {
      this.setAttributes(props.attributes);
    }
    // if (props.indices) {
    //   this.setIndices(props.indices);
    // }
    if (props.bindings) {
      this.setBindings(props.bindings);
    }
  }

  setIndices(indices: Buffer) {
    // this.pipeline.setIndices(indices)
    // this._indices = indices;
  }

  setAttributes(attributes: Record<string, Buffer>) {
    this.pipeline.setAttributes(attributes);
    Object.assign(this.props.attributes, attributes);
  }

  /** Set the bindings */
  setBindings(bindings: Record<string, Binding>): void {
    this.pipeline.setBindings(bindings);
    Object.assign(this.props.bindings, bindings);
  }
}

/** Create a shader from the different overloads */
function getShader(
  device: Device,
  shader: Shader | string | {glsl?: string; wgsl?: string},
  stage: 'vertex' | 'fragment'
): Shader {
  if (shader instanceof Shader) {
    return cast<Shader>(shader);
  }

  // TODO - detect WGSL/GLSL and throw an error if not supported
  if (typeof shader === 'string') {
    return device.createShader({stage, source: shader});
  }

  switch (device.info.type) {
    case 'webgpu':
      if (shader?.wgsl) {
        return device.createShader({stage, source: shader.wgsl});
      }
      throw new Error('WebGPU does not support GLSL shaders');

    default:
      if (shader?.glsl) {
        return device.createShader({stage, source: shader.glsl});
      }
      throw new Error('WebGL does not support WGSL shaders');
  }
}
