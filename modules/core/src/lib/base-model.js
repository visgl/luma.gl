/* eslint-disable complexity */
// Shared code between Model and MeshModel
import ProgramManager from '../resource-management/program-manager';
import {isWebGL, Program, VertexArray, clear} from '@luma.gl/webgl';
import {MODULAR_SHADERS} from '@luma.gl/shadertools';
import {
  getDebugTableForUniforms,
  getDebugTableForVertexArray,
  getDebugTableForProgramConfiguration
} from '@luma.gl/webgl';
import {log, uid, assert} from '../utils';

const LOG_DRAW_PRIORITY = 2;
const LOG_DRAW_TIMEOUT = 10000;

// Model abstract O3D Class
export default class BaseModel {
  constructor(gl, props = {}) {
    assert(isWebGL(gl));
    const {id = uid('base-model')} = props;
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

    const {program = null, vs, fs, modules, defines, inject, varyings, bufferMode} = props;

    this.programProps = {program, vs, fs, modules, defines, inject, varyings, bufferMode};
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

    this._setBaseModelProps(props);

    this.setUniforms(
      Object.assign(
        {},
        this.getModuleUniforms(props.moduleSettings) // Get unforms for supplied parameters
      )
    );
  }

  setProps(props) {
    this._setBaseModelProps(props);
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
    }

    this.vertexArray.delete();
  }

  // GETTERS

  getProgram() {
    return this.program;
  }

  setProgram(props) {
    this.programProps = Object.assign({}, props);
    this._programDirty = true;
  }

  getUniforms() {
    return this.uniforms;
  }

  // SETTERS

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

  /* eslint-disable max-statements  */
  drawGeometry(opts = {}) {
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

    const logPriority = this._logDrawCallStart(2);

    const drawParams = this.vertexArray.getDrawParams(this.props);
    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn('Found instanced attributes on non-instanced model', this.id)();
    }

    const {isIndexed, indexType, indexOffset} = drawParams;
    const {isInstanced, instanceCount} = this;

    const noop = () => {};
    const {onBeforeRender = noop, onAfterRender = noop} = this.props;

    onBeforeRender();

    this.program.setUniforms(this.uniforms);

    const didDraw = this.program.draw(
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
        instanceCount,
        offset: isIndexed ? indexOffset : 0
      })
    );

    onAfterRender();

    this._logDrawCallEnd(logPriority, vertexArray, framebuffer);

    return didDraw;
  }
  /* eslint-enable max-statements  */

  // PRIVATE METHODS

  // eslint-disable-next-line max-statements, complexity
  _setBaseModelProps(props) {
    Object.assign(this.props, props);

    if ('uniforms' in props) {
      this.setUniforms(props.uniforms);
    }

    if ('pickable' in props) {
      this.pickable = props.pickable;
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
        // TODO(Tarek): Are these actually used anywhere?
        vs = MODULAR_SHADERS.vs,
        fs = MODULAR_SHADERS.fs,
        modules,
        inject,
        defines,
        varyings,
        bufferMode
      } = this.programProps;
      program = this.programManager.get({vs, fs, modules, inject, defines, varyings, bufferMode});
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

    if (framebuffer) {
      framebuffer.log({priority: LOG_DRAW_PRIORITY, message: `Rendered to ${framebuffer.id}`});
    }

    log.groupEnd(LOG_DRAW_PRIORITY, `>>> DRAWING MODEL ${this.id}`)();
  }
}
