/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }]*/
// A scenegraph object node
import GL from '../constants';
import Attribute from './attribute';
import Object3D from './object-3d';
import {getDrawMode} from '../geometry/geometry';
import {Buffer, Program, VertexArray, TransformFeedback, Query, clear} from '../webgl';
import {checkUniformValues} from '../webgl';
import {isWebGL} from '../webgl-utils';
import {getUniformsTable, areUniformsEqual} from '../webgl/uniforms';
import {MODULAR_SHADERS} from '../shadertools/src/shaders';
import {assembleShaders} from '../shadertools/src';
import {addModel, removeModel, logModel, getOverrides} from '../debug/seer-integration';
import {log, isObjectEmpty} from '../utils';
import assert from '../utils/assert';

const MSG_INSTANCED_PARAM_DEPRECATED = `\
Warning: Model constructor: parameter "instanced" renamed to "isInstanced".
This will become a hard error in a future version of luma.gl.`;

const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

// These old picking uniforms should be avoided and we should use picking module
// and set uniforms using Model class 'updateModuleSettings()'
const DEPRECATED_PICKING_UNIFORMS = ['renderPickingBuffer', 'pickingEnabled'];

// Model abstract O3D Class
export default class Model extends Object3D {
  constructor(gl, opts = {}) {
    super(opts);
    assert(isWebGL(gl));
    this.gl = gl;
    this.lastLogTime = 0; // TODO - move to probe.gl

    this.init(opts);
  }

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  init({
    vs = null,
    fs = null,

    // 1: Modular shaders
    modules = null,
    defines = {},
    inject = {},
    moduleSettings = {},
    shaderCache = null,

    // 2: Legacy shaders
    defaultUniforms,

    // 3: Pre-created program
    program = null,

    isInstanced = false, // Enables instanced rendering
    instanced, // deprecated
    vertexCount = undefined,
    instanceCount = 0,

    // Extra uniforms and attributes (beyond geometry, material, camera)
    drawMode,
    uniforms = {},
    attributes = {},
    geometry = null,

    // Picking
    pickable = true,
    pick = null,
    render = null,
    onBeforeRender = () => {},
    onAfterRender = () => {},

    // TransformFeedback
    varyings = null,
    bufferMode = GL.SEPARATE_ATTRIBS,

    // Other opts
    timerQueryEnabled = false
  } = {}) {
    this._initializeProgram({
      vs,
      fs,
      modules,
      defines,
      inject,
      moduleSettings,
      defaultUniforms,
      program,
      shaderCache,
      varyings,
      bufferMode
    });

    this.uniforms = {};
    this.samplers = {};

    // Make sure we have some reasonable default uniforms in place
    uniforms = Object.assign({}, this.program.defaultUniforms, uniforms);
    this.setUniforms(uniforms);
    // Get all default uniforms
    this.setUniforms(this.getModuleUniforms());
    // Get unforms for supplied parameters
    this.setUniforms(this.getModuleUniforms(moduleSettings));

    if (instanced) {
      /* global console */
      /* eslint-disable no-console */
      console.warn(MSG_INSTANCED_PARAM_DEPRECATED);
      isInstanced = isInstanced || instanced;
    }

    // All attributes
    this._attributes = {};
    // User defined attributes
    this.attributes = {};
    this.samplers = {};
    this.userData = {};
    this.drawParams = {};
    this.dynamic = false;
    this.needsRedraw = true;

    // Attributes and buffers
    if (geometry) {
      this.setGeometry(geometry);
    }

    this.setAttributes(attributes);

    // geometry might have set drawMode and vertexCount
    if (drawMode !== undefined) {
      this.drawMode = getDrawMode(drawMode);
    }
    if (vertexCount !== undefined) {
      this.vertexCount = vertexCount;
    }
    this.isInstanced = isInstanced;
    this.instanceCount = instanceCount;

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = pick || (() => false);

    this.onBeforeRender = onBeforeRender;
    this.onAfterRender = onAfterRender;

    // assert(program || program instanceof Program);
    assert(this.drawMode !== undefined && Number.isFinite(this.vertexCount), ERR_MODEL_PARAMS);

    this.timerQueryEnabled = false;
    this.timeElapsedQuery = undefined;
    this.lastQueryReturned = true;

    this.stats = {
      accumulatedFrameTime: 0,
      averageFrameTime: 0,
      profileFrameCount: 0
    };
  }
  /* eslint-enable max-statements */

  delete() {
    // delete all attributes created by this model
    // TODO - should be handled by vertex array
    for (const key in this._attributes) {
      if (this._attributes[key] !== this.attributes[key]) {
        this._attributes[key].delete();
      }
    }

    this.program.delete();
    this.vertexArray.delete();

    removeModel(this.id);
  }

  destroy() {
    this.delete();
  }

  setProps(props) {
    if ('attributes' in props) {
      this.setAttributes(props.attributes);
    }
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms, props.samplers);
    }

    // Experimental props
    if ('timerQueryEnabled' in props) {
      this.timerQueryEnabled = props.timerQueryEnabled && Query.isSupported(this.gl, ['timers']);
      if (props.timerQueryEnabled && !this.timerQueryEnabled) {
        log.warn('GPU timer not supported')();
      }
    }
    if ('feedbackBuffers' in props) {
      this.setFeedbackBuffers(props.feedbackBuffers);
    }
  }

  setNeedsRedraw(redraw = true) {
    this.needsRedraw = redraw;
    return this;
  }

  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = false;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    if (this.geometry) {
      redraw = redraw || this.geometry.getNeedsRedraw({clearRedrawFlags});
    }
    return redraw;
  }

  setDrawMode(drawMode) {
    this.drawMode = getDrawMode(drawMode);
    return this;
  }

  getDrawMode() {
    return this.drawMode;
  }

  setVertexCount(vertexCount) {
    assert(Number.isFinite(vertexCount));
    this.vertexCount = vertexCount;
    return this;
  }

  getVertexCount() {
    return this.vertexCount;
  }

  setInstanceCount(instanceCount) {
    assert(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  getProgram() {
    return this.program;
  }

  getAttributes() {
    return this.attributes;
  }

  getUniforms() {
    return this.uniforms;
  }

  // TODO - just set attributes, don't hold on to geometry
  setGeometry(geometry) {
    this.geometry = geometry;
    this.vertexCount = geometry.getVertexCount();
    this.drawMode = geometry.drawMode;
    const buffers = this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
    // Object.assign(this.attributes, buffers);
    this.vertexArray.setAttributes(buffers);
    this.setNeedsRedraw();
    return this;
  }

  setAttributes(attributes = {}) {
    // Avoid setting needsRedraw if no attributes
    if (isObjectEmpty(attributes)) {
      return this;
    }

    Object.assign(this.attributes, attributes);
    const buffers = this._createBuffersFromAttributeDescriptors(attributes);

    // Object.assign(this.attributes, buffers);
    this.vertexArray.setAttributes(buffers);
    this.setNeedsRedraw();

    return this;
  }

  setFeedbackBuffers(feedbackBuffers = {}) {
    // Avoid setting needsRedraw if no feedbackBuffers
    if (isObjectEmpty(feedbackBuffers)) {
      return this;
    }

    const {gl} = this.program;
    this.transformFeedback = this.transformFeedback || new TransformFeedback(gl, {
      program: this.program
    });

    this.transformFeedback.setBuffers(feedbackBuffers);

    this.setNeedsRedraw();

    return this;
  }

  // TODO - should actually set the uniforms
  setUniforms(uniforms = {}, samplers = {}) {
    uniforms = Object.assign({}, uniforms);

    // Let Seer override edited uniforms
    getOverrides(this.id, uniforms);
    // this.setUniforms(opts);

    // Simple change detection
    let somethingChanged = false;
    for (const key in uniforms) {
      if (!areUniformsEqual(this.uniforms[key], uniforms[key])) {
        somethingChanged = true;
        break;
      }
    }

    if (somethingChanged) {
      this._checkForDeprecatedUniforms(uniforms);
      checkUniformValues(uniforms, this.id);

      Object.assign(this.uniforms, uniforms);
      Object.assign(this.samplers, samplers);

      this.setNeedsRedraw();
    }

    // TODO - should only set updated uniforms
    this.program.setUniforms(this.uniforms, this.samplers);

    return this;
  }

  // getModuleUniforms (already on object)

  updateModuleSettings(opts) {
    const uniforms = this.getModuleUniforms(opts || {});
    return this.setUniforms(uniforms);
  }

  setSamplers(samplers) {
    Object.assign(this.samplers, samplers);
  }

  clear(opts) {
    clear(this.program.gl, opts);
    return this;
  }

  /* eslint-disable max-statements  */
  draw(opts = {}) {
    const {
      moduleSettings = null,
      framebuffer,
      uniforms = {},
      attributes = {},
      samplers = {},
      transformFeedback = this.transformFeedback,
      parameters = {},
      vertexArray = this.vertexArray
    } = opts;

    // Update module settings

    addModel(this);

    this.setAttributes(attributes);
    this.updateModuleSettings(moduleSettings);
    this.setUniforms(uniforms, samplers);

    const logPriority = this._logDrawCallStart(2);

    const drawParams = this.vertexArray.drawParams;
    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const {isIndexed, indexType} = drawParams;
    const {isInstanced, instanceCount} = this;

    this.onBeforeRender();
    this._timerQueryStart();

    this.program.draw(Object.assign(opts, {
      logPriority,
      framebuffer,
      parameters,
      drawMode: this.getDrawMode(),
      vertexCount: this.getVertexCount(),
      vertexArray,
      transformFeedback,
      isIndexed,
      indexType,
      isInstanced,
      instanceCount
    }));

    this._timerQueryEnd();
    this.onAfterRender();

    this.setNeedsRedraw(false);

    this._logDrawCallEnd(logPriority, this.vertexArray, this.uniforms, framebuffer);

    return this;
  }
  /* eslint-enable max-statements  */

  // Draw call for transform feedback
  transform(opts = {}) {
    const {
      discard = true,
      feedbackBuffers
    } = opts;

    let {
      parameters
    } = opts;

    if (feedbackBuffers) {
      this.setFeedbackBuffers(feedbackBuffers);
    }

    if (discard) {
      parameters = Object.assign({}, parameters, {[GL.RASTERIZER_DISCARD]: discard});
    }

    return this.draw(Object.assign({}, opts, {parameters}));
  }

  // DEPRECATED METHODS

  render(uniforms = {}) {
    assert(arguments.length <= 1);
    // log.deprecated('Model.render()', 'Model.draw()')();
    return this.draw({uniforms});
  }

  // PRIVATE METHODS

  _initializeProgram({
    vs,
    fs,
    modules,
    defines,
    moduleSettings,
    defaultUniforms,
    program,
    shaderCache,
    varyings,
    bufferMode
  }) {

    this.getModuleUniforms = x => {};

    if (!program) {
      // Assign default shaders if none are provided
      if (!vs) {
        vs = MODULAR_SHADERS.vs;
      }
      if (!fs) {
        fs = MODULAR_SHADERS.fs;
      }

      const assembleResult = assembleShaders(this.gl, {vs, fs, modules, defines, log});
      ({vs, fs} = assembleResult);

      if (shaderCache) {
        program = shaderCache.getProgram(this.gl, {vs, fs, id: this.id});
      } else {
        program = new Program(this.gl, {vs, fs, varyings, bufferMode});
      }

      const {getUniforms} = assembleResult;
      this.getModuleUniforms = getUniforms || (x => {});
    }

    this.program = program;
    assert(this.program instanceof Program, 'Model needs a program');

    // Create a vertex array configured after this program
    this.vertexArray = new VertexArray(this.gl, {program});
  }
  /* eslint-enable complexity */

  _checkForDeprecatedUniforms(uniforms) {
    // deprecated picking uniforms
    DEPRECATED_PICKING_UNIFORMS.forEach((uniform) => {
      if (uniform in uniforms) {
        log.deprecated(uniform,
          'use picking shader module and Model class updateModuleSettings()')();
      }
    });
  }

  _timerQueryStart() {
    if (this.timerQueryEnabled === true) {
      if (!this.timeElapsedQuery) {
        this.timeElapsedQuery = new Query(this.gl);
      }
      if (this.lastQueryReturned) {
        this.lastQueryReturned = false;
        this.timeElapsedQuery.beginTimeElapsedQuery();
      }
    }
  }

  _timerQueryEnd() {
    if (this.timerQueryEnabled === true) {
      this.timeElapsedQuery.end();
      // TODO: Skip results if 'gl.getParameter(this.ext.GPU_DISJOINT_EXT)' returns false
      // should this be incorporated into Query object?
      if (this.timeElapsedQuery.isResultAvailable()) {
        this.lastQueryReturned = true;
        const elapsedTime = this.timeElapsedQuery.getResult();

        // Update stats (e.g. for seer)
        this.stats.lastFrameTime = elapsedTime;
        this.stats.accumulatedFrameTime += elapsedTime;
        this.stats.profileFrameCount++;
        this.stats.averageFrameTime =
          this.stats.accumulatedFrameTime / this.stats.profileFrameCount;

        // Log stats
        log.log(LOG_DRAW_PRIORITY, `\
GPU time ${this.program.id}: ${this.stats.lastFrameTime}ms \
average ${this.stats.averageFrameTime}ms \
accumulated: ${this.stats.accumulatedFrameTime}ms \
count: ${this.stats.profileFrameCount}`
        )();
      }
    }
  }

  // Makes sure buffers are created for all attributes
  // and that the program is updated with those buffers
  // TODO - do we need the separation between "attributes" and "buffers"
  // couldn't apps just create buffers directly?
  _createBuffersFromAttributeDescriptors(attributes) {
    const {program: {gl}} = this;

    // const attributes = {};
    const buffers = {};

    for (const attributeName in attributes) {

      const descriptor = attributes[attributeName];

      let attribute = this._attributes[attributeName];

      if (descriptor instanceof Attribute) {
        attribute = descriptor;
      } else if (descriptor instanceof Buffer) {
        attribute = attribute || new Attribute(gl, Object.assign({}, descriptor.layout, {
          id: attributeName
        }));
        attribute.update({isGeneric: false, buffer: descriptor});
      } else if (attribute) {
        attribute.update(descriptor);
      } else {
        attribute = new Attribute(gl, descriptor);
      }

      // attributes[attributeName] = attribute;
      buffers[attributeName] = attribute.getValue();
    }

    return buffers;
  }

  _logDrawCallStart(priority) {
    const logDrawTimeout = priority > 3 ? 0 : LOG_DRAW_TIMEOUT;
    if (log.priority < priority || (Date.now() - this.lastLogTime < logDrawTimeout)) {
      return undefined;
    }

    this.lastLogTime = Date.now();

    log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {collapsed: log.priority <= 2})();

    return priority;
  }

  _logDrawCallEnd(priority, vertexArray, uniforms, framebuffer) {
    if (priority === undefined) {
      return;
    }

    const attributeTable = vertexArray._getDebugTable({
      header: `${this.id} attributes`,
      attributes: this._attributes
    });

    const {table: uniformTable, unusedTable, unusedCount} = getUniformsTable({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.uniforms, uniforms)
    });

    // log missing uniforms
    const {table: missingTable, count: missingCount} = getUniformsTable({
      header: `${this.id} uniforms`,
      program: this.program,
      uniforms: Object.assign({}, this.uniforms, uniforms),
      undefinedOnly: true
    });

    if (missingCount > 0) {
      log.log('MISSING UNIFORMS', Object.keys(missingTable))();
      // log.table(priority, missingTable)();
    }
    if (unusedCount > 0) {
      log.log('UNUSED UNIFORMS', Object.keys(unusedTable))();
      // log.log(priority, 'Unused uniforms ', unusedTable)();
    }

    log.table(priority, attributeTable)();

    log.table(priority, uniformTable)();

    logModel(this, uniforms);

    if (framebuffer) {
      framebuffer.log({priority: LOG_DRAW_PRIORITY, message: `Rendered to ${framebuffer.id}`});
    }

    log.groupEnd(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`)();
  }

  // DEPRECATED / REMOVED
  isPickable() {
    return this.pickable;
  }

  setPickable(pickable = true) {
    this.pickable = Boolean(pickable);
    return this;
  }

  getGeometry() {
    return this.geometry;
  }
}
