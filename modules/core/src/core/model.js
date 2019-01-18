import GL from '../constants';
import Attribute from './attribute';
import Object3D from './object-3d';
import {getDrawMode} from '../geometry/geometry';
import {Buffer, Query, Program, TransformFeedback, VertexArray, clear} from '../webgl';
import {isWebGL} from '../webgl-utils';
import {MODULAR_SHADERS} from '../shadertools/src/shaders';
import {assembleShaders} from '../shadertools/src';
import {addModel, removeModel, logModel, getOverrides} from '../debug/seer-integration';
import {getDebugTableForUniforms} from '../webgl-debug/debug-uniforms';
import {getDebugTableForVertexArray} from '../webgl-debug/debug-vertex-array';
import {getDebugTableForProgramConfiguration} from '../webgl-debug/debug-program-configuration';
import {log, isObjectEmpty} from '../utils';
import assert from '../utils/assert';

const ERR_MODEL_PARAMS = 'Model needs drawMode and vertexCount';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

// These old picking uniforms should be avoided and we should use picking module
// and set uniforms using Model class 'updateModuleSettings()'
// TODO - move to shader modules
const DEPRECATED_PICKING_UNIFORMS = ['renderPickingBuffer', 'pickingEnabled'];

// Model abstract O3D Class
export default class Model extends Object3D {
  constructor(gl, props = {}) {
    super(props);
    assert(isWebGL(gl));
    this.gl = gl;
    this.lastLogTime = 0; // TODO - move to probe.gl
    this.initialize(props);
    // intended to be subclassed, do not seal
  }

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  initialize(props = {}) {
    this.props = {};
    this.program = this._createProgram(props);

    // Create a vertex array configured after this program
    this.vertexArray = new VertexArray(this.gl, {program: this.program});

    // Initialize state
    this.userData = {};
    this.needsRedraw = true;
    // Model manages auto Buffer creation from typed arrays
    this._attributes = {}; // All attributes
    this.attributes = {}; // User defined attributes

    // Model manages uniform animation
    this.animatedUniforms = {};
    this.animated = false;
    this.animationLoop = null; // if set, used as source for animationProps

    this.timerQueryEnabled = false;
    this.timeElapsedQuery = undefined;
    this.lastQueryReturned = true;

    this.stats = {
      accumulatedFrameTime: 0,
      averageFrameTime: 0,
      profileFrameCount: 0
    };

    // picking options
    this.pickable = true;
    // this.pick = pick || (() => false);

    this.setProps(props);

    // Make sure we have some reasonable default uniforms in place
    this.setUniforms(
      Object.assign(
        {},
        this.getModuleUniforms(), // Get all default uniforms
        this.getModuleUniforms(props.moduleSettings) // Get unforms for supplied parameters
      )
    );

    // Attributes and buffers

    // geometry might have set drawMode and vertexCount
    this.isInstanced = props.isInstanced || props.instanced;

    this.onBeforeRender = props.onBeforeRender || (() => {});
    this.onAfterRender = props.onAfterRender || (() => {});

    // assert(program || program instanceof Program);
    assert(this.drawMode !== undefined && Number.isFinite(this.vertexCount), ERR_MODEL_PARAMS);
  }
  /* eslint-enable max-statements */

  setProps(props) {
    Object.assign(this.props, props);

    // params
    // if ('drawMode' in props) {
    //   this.drawMode = getDrawMode(props.drawMode);
    // }
    // if ('vertexCount' in props) {
    //   this.vertexCount = props.vertexCount;
    // }
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
    if ('uniforms' in props) {
      this.setUniforms(props.uniforms, props.samplers);
    }

    if ('pickable' in props) {
      this.pickable = props.pickable;
    }

    // Experimental props
    if ('timerQueryEnabled' in props) {
      this.timerQueryEnabled = props.timerQueryEnabled && Query.isSupported(this.gl, ['timers']);
      if (props.timerQueryEnabled && !this.timerQueryEnabled) {
        log.warn('GPU timer not supported')();
      }
    }
    if ('_feedbackBuffers' in props) {
      this._setFeedbackBuffers(props._feedbackBuffers);
    }
    if ('_animationProps' in props) {
      this._setAnimationProps(props._animationProps);
    }
    if ('_animationLoop' in props) {
      this.animationLoop = props._animationLoop;
    }
  }

  delete() {
    // delete all attributes created by this model
    // TODO - should buffer deletes be handled by vertex array?
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

  // GETTERS

  get vertexCount() {
    if (Number.isFinite(this.props.vertexCount)) {
      return this.props.vertexCount;
    }
    return this.geometry && this.geometry.getVertexCount();
  }

  get drawMode() {
    if (Number.isFinite(this.props.drawMode)) {
      return this.props.drawMode;
    }
    return this.geometry && this.geometry.drawMode;
  }

  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = false;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    if (this.geometry) {
      redraw = redraw || this.geometry.getNeedsRedraw({clearRedrawFlags});
    }
    if (this.animated) {
      redraw = redraw || `animated model ${this.id}`;
    }
    return redraw;
  }

  getDrawMode() {
    return this.drawMode;
  }

  getVertexCount() {
    return this.vertexCount;
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
    return this.program.getUniforms;
  }

  // SETTERS

  setNeedsRedraw(redraw = true) {
    this.needsRedraw = redraw;
    return this;
  }

  setDrawMode(drawMode) {
    this.props.drawMode = getDrawMode(drawMode);
    return this;
  }

  setVertexCount(vertexCount) {
    assert(Number.isFinite(vertexCount));
    this.props.vertexCount = vertexCount;
    return this;
  }

  setInstanceCount(instanceCount) {
    assert(Number.isFinite(instanceCount));
    this.instanceCount = instanceCount;
    return this;
  }

  // TODO - just set attributes, don't hold on to geometry
  setGeometry(geometry) {
    this.geometry = geometry;
    const buffers = this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
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

  // TODO - should actually set the uniforms
  setUniforms(uniforms = {}, samplers = {}) {
    // Let Seer override edited uniforms
    uniforms = Object.assign({}, uniforms);
    getOverrides(this.id, uniforms);

    // Resolve any animated uniforms so that we have an initial value
    uniforms = this._extractAnimatedUniforms(uniforms);

    this.program.setUniforms(uniforms, samplers, () => {
      // if something changed
      this._checkForDeprecatedUniforms(uniforms);
      this.setNeedsRedraw();
    });
  }

  // Updates (evaluates) all function valued uniforms based on a new set of animationProps
  // experimental
  _setAnimationProps(animationProps) {
    if (this.animated) {
      assert(animationProps, 'Model.draw(): animated uniforms but no animationProps');
      const animatedUniforms = this._evaluateAnimateUniforms(animationProps);
      this.program.setUniforms(animatedUniforms, {}, () => {
        // if something changed
        this._checkForDeprecatedUniforms(animatedUniforms);
        this.setNeedsRedraw();
      });
    }
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
      vertexArray = this.vertexArray,
      animationProps
    } = opts;

    // Update module settings

    addModel(this);

    // Update model with any just provided attributes, settings or uniforms
    this.setAttributes(attributes);
    this.updateModuleSettings(moduleSettings);
    this.setUniforms(uniforms, samplers);

    // Animate any function valued uniforms
    this._refreshAnimationProps(animationProps);

    const logPriority = this._logDrawCallStart(2);

    const drawParams = this.vertexArray.getDrawParams(this.props);
    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const {isIndexed, indexType} = drawParams;
    const {isInstanced, instanceCount} = this;

    this.onBeforeRender();
    this._timerQueryStart();

    this.program.draw(
      Object.assign({}, opts, {
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
        instanceCount
      })
    );

    this._timerQueryEnd();
    this.onAfterRender();

    this.setNeedsRedraw(false);

    this._logDrawCallEnd(logPriority, vertexArray, framebuffer);

    return this;
  }
  /* eslint-enable max-statements  */

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
    assert(arguments.length <= 1);
    // log.deprecated('Model.render()', 'Model.draw()')();
    return this.draw({uniforms});
  }

  // PRIVATE METHODS

  _createProgram({
    vs = null,
    fs = null,
    // 1: Modular shaders
    modules = null,
    defines = {},
    inject = {},
    shaderCache = null,
    // TransformFeedback
    varyings = null,
    bufferMode = GL.SEPARATE_ATTRIBS,
    program = null
  }) {
    this.getModuleUniforms = x => {};

    const id = this.id;

    if (!program) {
      // Assign default shaders if none are provided
      vs = vs || MODULAR_SHADERS.vs;
      fs = fs || MODULAR_SHADERS.fs;

      const assembleResult = assembleShaders(this.gl, {vs, fs, modules, inject, defines, log});
      ({vs, fs} = assembleResult);

      if (shaderCache) {
        program = shaderCache.getProgram(this.gl, {id, vs, fs});
      } else {
        program = new Program(this.gl, {id, vs, fs, varyings, bufferMode});
      }

      this.getModuleUniforms = assembleResult.getUniforms || (x => {});
    }

    assert(program instanceof Program, 'Model needs a program');
    return program;
  }
  /* eslint-enable complexity */

  // Uniforms

  _checkForDeprecatedUniforms(uniforms) {
    // deprecated picking uniforms
    DEPRECATED_PICKING_UNIFORMS.forEach(uniform => {
      if (uniform in uniforms) {
        log.deprecated(
          uniform,
          'use picking shader module and Model class updateModuleSettings()'
        )();
      }
    });
  }

  // Refreshes animated uniforms, attempting to get animated props from animationLoop if registered
  _refreshAnimationProps(animationProps) {
    // Try to read animationProps
    animationProps = animationProps || (this.animationLoop && this.animationLoop.animationProps);
    if (animationProps) {
      this._setAnimationProps(animationProps);
    }
  }

  // Calculate new values for any function uniforms based on supplied animationProps
  _evaluateAnimateUniforms(animationProps) {
    if (!this.animated) {
      return {};
    }
    const animatedUniforms = {};
    for (const uniformName in this.animatedUniforms) {
      const valueFunction = this.animatedUniforms[uniformName];
      animatedUniforms[uniformName] = valueFunction(animationProps);
    }
    return animatedUniforms;
  }

  // Extracts a list of function valued uniforms, so we can update them before each draw call
  // Also removes such uniforms from the returned list
  _extractAnimatedUniforms(uniforms) {
    let foundAnimated = false;

    // Keep our animatedUniforms map up-to-date
    for (const uniformName in uniforms) {
      const newValue = uniforms[uniformName];
      if (typeof newValue === 'function') {
        this.animatedUniforms[uniformName] = newValue;
        foundAnimated = true;
      } else {
        delete this.animatedUniforms[uniformName];
      }
    }

    // Update animated flag: `Model` is animated if any uniforms are animated (i.e. functions)
    this.animated = !isObjectEmpty(this.animatedUniforms);

    if (!foundAnimated) {
      return uniforms;
    }

    // If animated uniforms were found, remove them from ordinary uniform list
    // `Program` class can't (and shouldn't) handle function valued uniforms
    const staticUniforms = {};
    for (const uniformName in uniforms) {
      if (!this.animatedUniforms[uniformName]) {
        staticUniforms[uniformName] = uniforms[uniformName];
      }
    }
    return staticUniforms;
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

    this.setNeedsRedraw();

    return this;
  }

  // Timer Queries

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
        log.log(
          LOG_DRAW_PRIORITY,
          `\
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
    const {
      program: {gl}
    } = this;

    // const attributes = {};
    const buffers = {};

    for (const attributeName in attributes) {
      const descriptor = attributes[attributeName];

      let attribute = this._attributes[attributeName];

      if (descriptor instanceof Attribute) {
        attribute = descriptor;
      } else if (descriptor instanceof Buffer) {
        attribute =
          attribute ||
          new Attribute(
            gl,
            Object.assign({}, descriptor, descriptor.layout, {
              id: attributeName
            })
          );
        attribute.update({buffer: descriptor});
      } else if (attribute) {
        attribute.update(descriptor);
      } else {
        attribute = new Attribute(
          gl,
          Object.assign({}, descriptor, {
            id: attributeName
          })
        );
      }

      this._attributes[attributeName] = attribute;
      buffers[attributeName] = attribute.getValue();
    }

    return buffers;
  }

  _logDrawCallStart(priority) {
    const logDrawTimeout = priority > 3 ? 0 : LOG_DRAW_TIMEOUT;
    if (log.priority < priority || Date.now() - this.lastLogTime < logDrawTimeout) {
      return undefined;
    }

    this.lastLogTime = Date.now();

    log.group(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`, {collapsed: log.priority <= 2})();

    return priority;
  }

  _logDrawCallEnd(priority, vertexArray, uniforms, framebuffer) {
    // HACK: priority === undefined means logDrawCallStart didn't run
    if (priority === undefined) {
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
      // log.table(priority, missingTable)();
    }
    if (unusedCount > 0) {
      log.log('UNUSED UNIFORMS', Object.keys(unusedTable))();
      // log.log(priority, 'Unused uniforms ', unusedTable)();
    }

    const configTable = getDebugTableForProgramConfiguration(this.vertexArray.configuration);

    log.table(priority, attributeTable)();

    log.table(priority, uniformTable)();

    log.table(priority + 1, configTable)();

    logModel(this, uniforms);

    if (framebuffer) {
      framebuffer.log({priority: LOG_DRAW_PRIORITY, message: `Rendered to ${framebuffer.id}`});
    }

    log.groupEnd(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`)();
  }
}
