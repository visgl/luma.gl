
import type {Shader, RenderPipeline} from '@luma.gl/api';
import {cast} from '@luma.gl/api';
import WebGPUDevice from '../adapter/webgpu-device';
import WebGPURenderPipeline from '../adapter/webgpu-render-pipeline';
// import glslangModule from '../glslang';

export type ModelProps = {
  vs?: string | Shader;
  fs?: string | Shader;
  pipeline?: RenderPipeline;
}
export default class Model {
  device: WebGPUDevice;
  pipeline: WebGPURenderPipeline;

  constructor(device: WebGPUDevice, props: ModelProps) {
    this.device = device;
    this.pipeline = cast<WebGPURenderPipeline>(props.pipeline);
    // this.vsModule = createShaderModule(device, SingleShaderStage::Vertex, options.vs.c_str());
    // this.fsModule = createShaderModule(device, SingleShaderStage::Fragment, options.fs.c_str());
    // this.primitiveTopology = "triangle-list";
  }

  draw(vertexCount: number, instanceCount: number = 1, firstVertex: number = 0, firstInstance: number = 0) {
    const renderPass = this.device.getActiveRenderPass();
    renderPass.setPipeline(this.pipeline.handle);
    renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);
  }

  // draw(passEncoder) {
  //   passEncoder.setPipeline(this.pipeline);
  //   passEncoder.setBindGroup(0, this.uniformBindGroup);
  //   passEncoder.setVertexBuffer(0, this.verticesBuffer);
  //   passEncoder.draw(36, 1, 0, 0);
  // };


  /*
  setIndices(indices) {
    this._indices = indices;
  }

  setAttributes(attributes) {
    this._attributeTable = attributes;
  }

  setInstancedAttributes(attributes) {
    this._instancedAttributeTable = attributes;
  }

  setBindings(bindings: []) {

  }

  setUniformBuffer(binding, buffer, byteOffset, byteLength) {
    this._bindings[binding] = {binding, resource: {buffer, offset: byteOffset, size: byteLength}};
  }

  setUniformTexture(binding, textureView) {
    this._bindings[binding] = {binding, resource: textureView};
  }

  setUniformSampler(binding, sampler) {
    this._bindings[binding] = {binding, resource: sampler};
  }
  */

  /*
  _setBinding(uint32_t binding, const BindingInitializationHelper& initHelper) {
    this._bindings[binding] = initHelper;

    // Make sure all uniforms are set before trying to create a bind group
    std::vector<BindingInitializationHelper> bindings;
    for (auto const& binding : this._bindings) {
      if (binding) {
        bindings.push_back(binding.value());
      } else {
        return;
      }
    }

    // Update the bind group
    this.bindGroup = utils::makeBindGroup(this._device, this.uniformBindGroupLayout, bindings);

  wgpu::BindGroupDescriptor descriptor;
  descriptor.layout = layout;
  descriptor.bindingCount = static_cast<uint32_t>(bindings.size());
  descriptor.bindings = bindings.data();

  return device.CreateBindGroup(&descriptor);  }

  _createRenderPipeLine() {
    const device = this.device.handle;

    const bindGroupLayout = device.createBindGroupLayout({
      entries: [{
        // Transform
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        type: "uniform-buffer"
      }, {
        // Sampler
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        type: "sampler"
      }, {
        // Texture view
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        type: "sampled-texture"
      }]
    });

    const {primitiveTopology = "triangle-list"} = this;

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });

    this.pipeline = device.createRenderPipeline({
      layout: pipelineLayout,

      vertexStage: {
        module: vertexShaderModule,
        entryPoint: "main",
      },

      fragmentStage: {
        module: fragmentShaderModule,
        entryPoint: "main",
      },

      primitiveTopology: "triangle-list",

      vertexState: {
        vertexBuffers: [
          {
            arrayStride: cubeVertexSize,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: cubePositionOffset,
                format: "float4",
              },
              {
                // uv
                shaderLocation: 1,
                offset: cubeUVOffset,
                format: "float2",
              },
            ],
          },
        ],
      },

      depthStencilState: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
      },

      rasterizationState: {
        cullMode: "back",
      },

      colorStates: [
        {
          format: "bgra8unorm",
          // colorBlend.srcFactor = wgpu::BlendFactor::SrcAlpha;
          // colorBlend.dstFactor = wgpu::BlendFactor::OneMinusSrcAlpha;
          // alphaBlend.srcFactor = wgpu::BlendFactor::SrcAlpha;
          // alphaBlend.dstFactor = wgpu::BlendFactor::OneMinusSrcAlpha;
        },
      ],
    });

    this.uniformBindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [],
    });
  }
    */

}



/*
 private:
  void _initializeVertexState(utils::ComboVertexStateDescriptor* descriptor,
                              const std::shared_ptr<garrow::Schema>& attributeSchema,
                              const std::shared_ptr<garrow::Schema>& instancedAttributeSchema);
  auto _createBindGroupLayout(wgpu::Device device, const std::vector<UniformDescriptor>& uniforms)
      -> wgpu::BindGroupLayout;

  void _setBinding(uint32_t binding, const utils::BindingInitializationHelper& initHelper);
  void _setVertexBuffers(wgpu::RenderPassEncoder pass);

  wgpu::Device _device;
  std::shared_ptr<garrow::Schema> _attributeSchema;
  std::shared_ptr<garrow::Schema> _instancedAttributeSchema;
  std::shared_ptr<garrow::Table> _attributeTable;
  std::shared_ptr<garrow::Table> _instancedAttributeTable;
  std::shared_ptr<garrow::Array> _indices;
  std::vector<UniformDescriptor> _uniformDescriptors;
  std::vector<std::optional<utils::BindingInitializationHelper>> _bindings;
};

/*
#include "luma.gl/garrow/src/util/webgpu-utils.h"
#include "luma.gl/webgpu.h"
#include "math.gl/core.h"
#include "probe.gl/core.h"

Model::Model(wgpu::Device device, const Model::Options& options) {
  this._device = device;
  this._uniformDescriptors = options.uniforms;
  this._attributeSchema = options.attributeSchema;
  this._instancedAttributeSchema = options.instancedAttributeSchema;

  this.vsModule = createShaderModule(device, SingleShaderStage::Vertex, options.vs.c_str());
  this.fsModule = createShaderModule(device, SingleShaderStage::Fragment, options.fs.c_str());

  this._initializeVertexState(&descriptor.cVertexState, options.attributeSchema, options.instancedAttributeSchema);

  // Initialize uniform cache
  this._bindings = std::vector<std::optional<BindingInitializationHelper>>{options.uniforms.size()};

  this.uniformBindGroupLayout = this._createBindGroupLayout(device, options.uniforms);
  descriptor.layout = makeBasicPipelineLayout(device, &this.uniformBindGroupLayout);

  this.pipeline = device.CreateRenderPipeline(&descriptor);

  // TODO(ilija@unfolded.ai): Is there a more elegant way of doing this, other than divering from arrow API and
  // providing a simple way to initialize an empty table?
  auto schema = std::make_shared<garrow::Schema>(std::vector<std::shared_ptr<garrow::Field>>{});
  this._attributeTable = std::make_shared<garrow::Table>(schema, std::vector<std::shared_ptr<garrow::Array>>{});
  this._instancedAttributeTable =
      std::make_shared<garrow::Table>(schema, std::vector<std::shared_ptr<garrow::Array>>{});
}

draw(wgpu::RenderPassEncoder pass) {
  pass.SetPipeline(this.pipeline);
  this._setVertexBuffers(pass);
  // The last two arguments are used for specifying dynamic offsets, which is not something we support right now
  pass.SetBindGroup(0, this.bindGroup, 0, nullptr);

  auto vertexCount = static_cast<uint32_t>(this._attributeTable->num_rows());
  // Make sure at least one instance is being drawn in case no instanced attributes are present
  uint32_t minimumInstances = 1;
  auto instanceCount = std::max(static_cast<uint32_t>(this._instancedAttributeTable->num_rows()), minimumInstances);

  if (this._indices) {
    pass.SetIndexBuffer(this._indices->buffer());
    pass.DrawIndexed(static_cast<uint32_t>(this._indices->length()), instanceCount);
  } else {
    pass.Draw(vertexCount, instanceCount);
  }
}

_initializeVertexState(
  utils::ComboVertexStateDescriptor* descriptor,
  const std::shared_ptr<garrow::Schema>& attributeSchema,
  const std::shared_ptr<garrow::Schema>& instancedAttributeSchema
) {
  descriptor->vertexBufferCount =
      static_cast<uint32_t>(attributeSchema->num_fields() + instancedAttributeSchema->num_fields());

  int location = 0;
  for (auto const& field : attributeSchema->fields()) {
    descriptor->cVertexBuffers[location].arrayStride = lumagl::garrow::getVertexFormatSize(field->type());
    descriptor->cVertexBuffers[location].stepMode = wgpu::InputStepMode::Vertex;
    descriptor->cVertexBuffers[location].attributeCount = 1;
    descriptor->cVertexBuffers[location].attributes = &descriptor->cAttributes[location];

    descriptor->cAttributes[location].shaderLocation = location;
    descriptor->cAttributes[location].format = field->type();

    location++;
  }

  for (auto const& field : instancedAttributeSchema->fields()) {
    descriptor->cVertexBuffers[location].arrayStride = lumagl::garrow::getVertexFormatSize(field->type());
    descriptor->cVertexBuffers[location].stepMode = wgpu::InputStepMode::Instance;
    descriptor->cVertexBuffers[location].attributeCount = 1;
    descriptor->cVertexBuffers[location].attributes = &descriptor->cAttributes[location];

    descriptor->cAttributes[location].shaderLocation = location;
    descriptor->cAttributes[location].format = field->type();

    location++;
  }
}

auto Model::_createBindGroupLayout(wgpu::Device device, const std::vector<UniformDescriptor>& uniforms)
    -> wgpu::BindGroupLayout {
  std::vector<wgpu::BindGroupLayoutBinding> bindings;
  for (uint32_t i = 0; i < uniforms.size(); i++) {
    auto binding =
        wgpu::BindGroupLayoutBinding{i, uniforms[i].shaderStage, uniforms[i].bindingType, uniforms[i].isDynamic};
    bindings.push_back(binding);
  }

  return utils::makeBindGroupLayout(device, bindings);
}


_setVertexBuffers(wgpu::RenderPassEncoder pass) {
  int location = 0;
  for (auto const& attribute : this._attributeTable->columns()) {
    pass.SetVertexBuffer(location, attribute->buffer());
    location++;
  }

  for (auto const& attribute : this._instancedAttributeTable->columns()) {
    pass.SetVertexBuffer(location, attribute->buffer());
    location++;
  }
}
*/

/*
import GL from '@luma.gl/constants';
import {isWebGL} from '@luma.gl/gltools';
import ProgramManager from './program-manager';
import {
  Program,
  VertexArray,
  clear,
  TransformFeedback,
  Buffer,
  log,
  isObjectEmpty,
  uid,
  assert
} from '@luma.gl/webgl';
import {
  getDebugTableForUniforms,
  getDebugTableForVertexArray,
  getDebugTableForProgramConfiguration
} from '@luma.gl/webgl';
import {getBuffersFromGeometry} from './model-utils';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';

const NOOP = () => {};
const DRAW_PARAMS = {};

export default class Model {
  constructor(gl, props = {}) {
    // Deduce a helpful id
    const {id = uid('model')} = props;
    assert(isWebGL(gl));
    this.id = id;
    this.gl = gl;
    this.id = props.id || uid('Model');
    this.lastLogTime = 0; // TODO - move to probe.gl
    this.initialize(props);
  }

  initialize(props) {
    this.props = {};

    this.programManager = props.programManager || ProgramManager.getDefaultProgramManager(this.gl);
    this._programManagerState = -1;
    this._managedProgram = false;

    const {
      program = null,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    } = props;

    this.programProps = {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    };
    this.program = null;
    this.vertexArray = null;
    this._programDirty = true;

    // Initialize state
    this.userData = {};
    this.needsRedraw = true;

    // Attributes and buffers
    // Model manages auto Buffer creation from typed arrays
    this._attributes = {}; // All attributes
    this.attributes = {}; // User defined attributes

    // Model manages uniform animation
    this.uniforms = {};

    // picking options
    this.pickable = true;

    this._checkProgram();

    this.setUniforms(
      Object.assign(
        {},
        this.getModuleUniforms(props.moduleSettings) // Get unforms for supplied parameters
      )
    );

    this.drawMode = props.drawMode !== undefined ? props.drawMode : GL.TRIANGLES;
    this.vertexCount = props.vertexCount || 0;

    // Track buffers created by setGeometry
    this.geometryBuffers = {};

    // geometry might have set drawMode and vertexCount
    this.isInstanced = props.isInstanced || props.instanced || props.instanceCount > 0;

    this._setModelProps(props);

    // TODO - just to unbreak deck.gl 7.0-beta, remove as soon as updated
    this.geometry = {};

    // assert(program || program instanceof Program);
    assert(this.drawMode !== undefined && Number.isFinite(this.vertexCount), ERR_MODEL_PARAMS);
  }

  setProps(props) {
    this._setModelProps(props);
  }

  delete() {
    // delete all attributes created by this model
    // TODO - should buffer deletes be handled by vertex array?
    for (const key in this._attributes) {
      if (this._attributes[key] !== this.attributes[key]) {
        this._attributes[key].delete();
      }
    }

    if (this._managedProgram) {
      this.programManager.release(this.program);
      this._managedProgram = false;
    }

    this.vertexArray.delete();

    this._deleteGeometryBuffers();
  }

  // GETTERS

  getDrawMode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  getAttributes() {
    return this.attributes;
  }

  getProgram() {
    return this.program;
  }

  setProgram(props) {
    const {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    } = props;
    this.programProps = {
      program,
      vs,
      fs,
      modules,
      defines,
      inject,
      varyings,
      bufferMode,
      transpileToGLSL100
    };
    this._programDirty = true;
  }

  getUniforms() {
    return this.uniforms;
  }

  // SETTERS

  setDrawMode(drawMode) {
    this.drawMode = drawMode;
    return this;
  }

  setVertexCount(vertexCount) {
    assert(Number.isFinite(vertexCount));
    this.vertexCount = vertexCount;
    return this;
  }

  setInstanceCount(instanceCount) {
    assert(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  setGeometry(geometry) {
    this.drawMode = geometry.drawMode;
    this.vertexCount = geometry.getVertexCount();

    this._deleteGeometryBuffers();

    this.geometryBuffers = getBuffersFromGeometry(this.gl, geometry);
    this.vertexArray.setAttributes(this.geometryBuffers);
    return this;
  }

  setAttributes(attributes = {}) {
    // Avoid setting needsRedraw if no attributes
    if (isObjectEmpty(attributes)) {
      return this;
    }

    const normalizedAttributes = {};
    for (const name in attributes) {
      const attribute = attributes[name];
      // The `getValue` call provides support for deck.gl `Attribute` class
      // TODO - remove once deck refactoring completes
      normalizedAttributes[name] = attribute.getValue ? attribute.getValue() : attribute;
    }

    this.vertexArray.setAttributes(normalizedAttributes);
    return this;
  }

  // TODO - should actually set the uniforms
  setUniforms(uniforms = {}) {
    Object.assign(this.uniforms, uniforms);

    return this;
  }

  getModuleUniforms(opts) {
    this._checkProgram();

    const getUniforms = this.programManager.getUniforms(this.program);

    if (getUniforms) {
      return getUniforms(opts);
    }

    return {};
  }

  updateModuleSettings(opts) {
    const uniforms = this.getModuleUniforms(opts || {});
    return this.setUniforms(uniforms);
  }

  // DRAW CALLS

  clear(opts) {
    clear(this.program.gl, opts);
    return this;
  }

  draw(opts = {}) {
    // Lazy update program and vertex array
    this._checkProgram();

    const {
      moduleSettings = null,
      framebuffer,
      uniforms = {},
      attributes = {},
      transformFeedback = this.transformFeedback,
      parameters = {},
      vertexArray = this.vertexArray
    } = opts;

    // Update model with any just provided attributes, settings or uniforms
    this.setAttributes(attributes);
    this.updateModuleSettings(moduleSettings);
    this.setUniforms(uniforms);

    let logPriority;

    if (log.priority >= LOG_DRAW_PRIORITY) {
      logPriority = this._logDrawCallStart(LOG_DRAW_PRIORITY);
    }

    const drawParams = this.vertexArray.getDrawParams();
    const {
      isIndexed = drawParams.isIndexed,
      indexType = drawParams.indexType,
      indexOffset = drawParams.indexOffset,
      vertexArrayInstanced = drawParams.isInstanced
    } = this.props;

    if (vertexArrayInstanced && !this.isInstanced) {
      log.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const {isInstanced, instanceCount} = this;

    const {onBeforeRender = NOOP, onAfterRender = NOOP} = this.props;

    onBeforeRender();

    this.program.setUniforms(this.uniforms);

    const didDraw = this.program.draw(
      Object.assign(DRAW_PARAMS, opts, {
        logPriority,
        uniforms: null, // Already set (may contain "function values" not understood by Program)
        framebuffer,
        parameters,
        drawMode: this.getDrawMode(),
        vertexCount: this.getVertexCount(),
        vertexArray,
        transformFeedback,
        isIndexed,
        indexType,
        isInstanced,
        instanceCount,
        offset: isIndexed ? indexOffset : 0
      })
    );

    onAfterRender();

    if (log.priority >= LOG_DRAW_PRIORITY) {
      this._logDrawCallEnd(logPriority, vertexArray, framebuffer);
    }

    return didDraw;
  }

  // Draw call for transform feedback
  transform(opts = {}) {
    const {discard = true, feedbackBuffers, unbindModels = []} = opts;

    let {parameters} = opts;

    if (feedbackBuffers) {
      this._setFeedbackBuffers(feedbackBuffers);
    }

    if (discard) {
      parameters = Object.assign({}, parameters, {[GL.RASTERIZER_DISCARD]: discard});
    }

    unbindModels.forEach(model => model.vertexArray.unbindBuffers());
    try {
      this.draw(Object.assign({}, opts, {parameters}));
    } finally {
      unbindModels.forEach(model => model.vertexArray.bindBuffers());
    }

    return this;
  }

  // DEPRECATED METHODS

  render(uniforms = {}) {
    log.warn('Model.render() is deprecated. Use Model.setUniforms() and Model.draw()')();
    return this.setUniforms(uniforms).draw();
  }

  // PRIVATE METHODS

  _setModelProps(props) {
    Object.assign(this.props, props);

    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }

    if ('pickable' in props) {
      this.pickable = props.pickable;
    }

    if ('instanceCount' in props) {
      this.instanceCount = props.instanceCount;
    }
    if ('geometry' in props) {
      this.setGeometry(props.geometry);
    }

    // webgl settings
    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }
    if ('_feedbackBuffers' in props) {
      this._setFeedbackBuffers(props._feedbackBuffers);
    }
  }

  _checkProgram(shaderCache = null) {
    const needsUpdate =
      this._programDirty || this.programManager.stateHash !== this._programManagerState;

    if (!needsUpdate) {
      return;
    }

    let {program} = this.programProps;

    if (program) {
      this._managedProgram = false;
    } else {
      const {
        vs,
        fs,
        modules,
        inject,
        defines,
        varyings,
        bufferMode,
        transpileToGLSL100
      } = this.programProps;
      program = this.programManager.get({
        vs,
        fs,
        modules,
        inject,
        defines,
        varyings,
        bufferMode,
        transpileToGLSL100
      });
      if (this.program && this._managedProgram) {
        this.programManager.release(this.program);
      }
      this._programManagerState = this.programManager.stateHash;
      this._managedProgram = true;
    }

    assert(program instanceof Program, 'Model needs a program');

    this._programDirty = false;

    if (program === this.program) {
      return;
    }

    this.program = program;

    if (this.vertexArray) {
      this.vertexArray.setProps({program: this.program, attributes: this.vertexArray.attributes});
    } else {
      this.vertexArray = new VertexArray(this.gl, {program: this.program});
    }

    // Make sure we have some reasonable default uniforms in place
    this.setUniforms(
      Object.assign(
        {},
        this.getModuleUniforms() // Get all default uniforms,
      )
    );
  }

  _deleteGeometryBuffers() {
    for (const name in this.geometryBuffers) {
      // Buffer is raw value (for indices) or first element of [buffer, accessor] pair
      const buffer = this.geometryBuffers[name][0] || this.geometryBuffers[name];
      if (buffer instanceof Buffer) {
        buffer.delete();
      }
    }
  }

  // Updates (evaluates) all function valued uniforms based on a new set of animationProps
  // experimental
  _setAnimationProps(animationProps) {
    if (this.animated) {
      assert(animationProps, 'Model.draw(): animated uniforms but no animationProps');
      const animatedUniforms = this._evaluateAnimateUniforms(animationProps);
      Object.assign(this.uniforms, animatedUniforms);
    }
  }

  // Transform Feedback

  _setFeedbackBuffers(feedbackBuffers = {}) {
    // Avoid setting needsRedraw if no feedbackBuffers
    if (isObjectEmpty(feedbackBuffers)) {
      return this;
    }

    const {gl} = this.program;
    this.transformFeedback =
      this.transformFeedback ||
      new TransformFeedback(gl, {
        program: this.program
      });

    this.transformFeedback.setBuffers(feedbackBuffers);
    return this;
  }

  _logDrawCallStart(logLevel) {
    const logDrawTimeout = logLevel > 3 ? 0 : LOG_DRAW_TIMEOUT;
    if (Date.now() - this.lastLogTime < logDrawTimeout) {
      return undefined;
    }

    this.lastLogTime = Date.now();

    log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {collapsed: log.level <= 2})();

    return logLevel;
  }

  _logDrawCallEnd(logLevel, vertexArray, uniforms, framebuffer) {
    // HACK: logLevel === undefined means logDrawCallStart didn't run
    if (logLevel === undefined) {
      return;
    }

    const attributeTable = getDebugTableForVertexArray({
      vertexArray,
      header: `${this.id} attributes`,
      attributes: this._attributes
    });

    const {table: uniformTable, unusedTable, unusedCount} = getDebugTableForUniforms({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms)
    });

    // log missing uniforms
    const {table: missingTable, count: missingCount} = getDebugTableForUniforms({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.program.uniforms, uniforms),
      undefinedOnly: true
    });

    if (missingCount > 0) {
      log.log('MISSING UNIFORMS', Object.keys(missingTable))();
      // log.table(logLevel, missingTable)();
    }
    if (unusedCount > 0) {
      log.log('UNUSED UNIFORMS', Object.keys(unusedTable))();
      // log.log(logLevel, 'Unused uniforms ', unusedTable)();
    }

    const configTable = getDebugTableForProgramConfiguration(this.vertexArray.configuration);

    log.table(logLevel, attributeTable)();

    log.table(logLevel, uniformTable)();

    log.table(logLevel + 1, configTable)();

    if (framebuffer) {
      framebuffer.log({logLevel: LOG_DRAW_PRIORITY, message: `Rendered to ${framebuffer.id}`});
    }

    log.groupEnd(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`)();
  }
}
*/
