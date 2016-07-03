// A scenegraph object node
/* eslint-disable guard-for-in */

// Define some locals
import {glGet} from './webgl/context';
import {MAX_TEXTURES} from './config';
import Object3D from './scenegraph/object-3d';
import {WebGL, Buffer, Program, draw, Texture2D} from './webgl';
import Geometry from './geometry';
import {log, splat} from './utils';
import assert from 'assert';

// TODO - experimental, not yet used
export class Material {
  constructor({shininess = 0, reflection = 0, refraction = 0} = {}) {
    this.shininess = shininess;
    this.reflection = reflection;
    this.refraction = refraction;
  }
}

// Model abstract O3D Class
export default class Model extends Object3D {

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  constructor({
    program,
    geometry,
    material = null,
    textures = [],
    // Enables instanced rendering (needs shader support and extra attributes)
    isInstanced = false,
    instanceCount = 0,
    vertexCount = undefined,
    // Picking
    pickable = false, pick = null,
    // Extra uniforms and attributes (beyond geometry, material, camera)
    uniforms = {},
    attributes = {},
    render = null,
    onBeforeRender = () => {},
    onAfterRender = () => {},
    ...opts
  } = {}) {
    // assert(program || program instanceof Program);
    assert(program instanceof Program, 'Model needs a program');
    assert(geometry instanceof Geometry, 'Model needs a geometry');

    super(opts);

    // set a custom program per o3d
    // this.program = Program.makeFrom(gl, program);
    this.program = program;
    this.geometry = geometry;
    this.material = material;

    if (opts.instanced) {
      console.warn(`Warning: ` +
        `Model constructor: parameter instanced renamed to isInstanced. ` +
        `This will become a hard error in a future version of luma.gl.`);
    }

    // instanced rendering
    this.isInstanced = isInstanced || opts.instanced;
    this.instanceCount = instanceCount;
    this.vertexCount = vertexCount;

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = pick || (() => false);

    // override the render method, before and after render callbacks
    this.render = render || this.render;
    this.onBeforeRender = onBeforeRender;
    this.onAfterRender = onAfterRender;

    this.textures = splat(textures);

    // TODO - remove?
    this.buffers = {};
    this.userData = {};
    this.drawParams = {};
    this.dynamic = false;

    // extra uniforms and attribute descriptors
    this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
    this.attributes = {};
    this.setAttributes(attributes);
    this.uniforms = uniforms;
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  get hash() {
    return this.id + ' ' + this.$pickingIndex;
  }

  setInstanceCount(instanceCount) {
    assert(instanceCount !== undefined);
    this.instanceCount = instanceCount;
    return this;
  }

  getInstanceCount() {
    return this.instanceCount;
  }

  setVertexCount(vertexCount) {
    this.vertexCount = vertexCount;
    return this;
  }

  getVertexCount() {
    return this.vertexCount === undefined ?
      this.geometry.getVertexCount() : this.vertexCount;
  }

  isPickable() {
    return this.pickable;
  }

  setPickable(pickable = true) {
    this.pickable = Boolean(pickable);
    return this;
  }

  getProgram() {
    return this.program;
  }

  getGeometry() {
    return this.geometry;
  }

  getAttributes() {
    return this.attributes;
  }

  setAttributes(attributes = {}) {
    Object.assign(this.attributes, attributes);
    this._createBuffersFromAttributeDescriptors(attributes);
    return this;
  }

  getUniforms() {
    return this.uniforms;
  }

  setUniforms(uniforms = {}) {
    this._checkUniforms(uniforms);
    Object.assign(this.uniforms, uniforms);
    return this;
  }

  setTextures(textures = []) {
    assert(textures.every(tex => tex instanceof Texture2D), 'setTextures');
    this.textures = textures;
    return this;
  }

  /*
   * @param {Camera} opt.camera=
   * @param {Camera} opt.viewMatrix=
   */
  render({camera, viewMatrix} = {}) {
    // Camera exposes uniforms that can be used directly in shaders
    if (camera) {
      this.setUniforms(camera.getUniforms());
    }
    if (viewMatrix) {
      this.setUniforms(this.getCoordinateUniforms(viewMatrix));
    }

    this._log();

    this.setProgramState();
    const drawParams = this.drawParams;
    if (drawParams.isInstanced && !this.isInstanced) {
      console.warn('Found instanced attributes on non-instanced model');
    }

    this.onBeforeRender();

    const {gl} = this.program;
    const {geometry, isInstanced, instanceCount} = this;
    const {isIndexed, indexType} = drawParams;
    draw(gl, {
      drawMode: geometry.drawMode,
      vertexCount: this.getVertexCount(),
      isIndexed: isIndexed,
      indexType: indexType,
      isInstanced,
      instanceCount
    });

    this.onAfterRender();

    this.unsetProgramState();

    return this;
  }

  setProgramState() {
    const {program} = this;
    program.use();
    program.setUniforms(this.uniforms);
    this.drawParams = {};
    program.setBuffers(this.buffers, {drawParams: this.drawParams});
    this.bindTextures();
    return this;
  }

  unsetProgramState() {
    // Ensures all vertex attributes are disabled and ELEMENT_ARRAY_BUFFER
    // is unbound
    this.program.unsetBuffers();
    return this;
  }

  // Makes sure buffers are created for all attributes
  // and that the program is updated with those buffers
  // TODO - do we need the separation between "attributes" and "buffers"
  // couldn't apps just create buffers directly?
  _createBuffersFromAttributeDescriptors(attributes) {
    const {program: {gl}} = this;

    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];

      this.buffers[attributeName] =
        this.buffers[attributeName] || new Buffer(gl);

      const buffer = this.buffers[attributeName];
      buffer.setData({
        ...attribute,
        data: attribute.value,
        target: attribute.isIndexed ?
          WebGL.ELEMENT_ARRAY_BUFFER : WebGL.ARRAY_BUFFER
      });
    }

    return this;
  }

  bindTextures(force = false) {
    const {program} = this;
    this.textures = this.textures ? splat(this.textures) : [];
    let tex2D = 0;
    let texCube = 0;
    const mtexs = MAX_TEXTURES;
    const texs = this.textures;
    const l = texs.length;
    for (let i = 0; i < mtexs; i++) {
      if (i < l) {
        // rye TODO: update this when TextureCube is implemented.
        // const isCube = app.textureMemo[texs[i]].isCube;
        // if (isCube) {
        // program.setTexture(texs[i], gl['TEXTURE' + i]);
        // program.setUniforms({
        //   ['hasTextureCube' + (i + 1)]: true,
        //   [samplerCube' + (texCube + 1)]: i
        // })
        // texCube++;
        // } else {
        program.setTexture(texs[i], tex2D);
        program.setUniforms({
          [`hasTexture${i + 1}`]: true,
          [`sampler${tex2D + 1}`]: i
        });
        tex2D++;
      } else {
        program.setUniforms({
          [`hasTextureCube${i + 1}`]: false,
          [`hasTexture${i + 1}`]: false,
          [`sampler${++tex2D}`]: i,
          [`samplerCube${++texCube}`]: i
        });
      }
    }
    return this;
  }

  // TODO - Move into uniforms manager
  _checkUniforms(uniformMap) {
    for (const key in uniformMap) {
      const value = uniformMap[key];
      this._checkUniformValue(key, value);
    }
    return this;
  }

  _checkUniformValue(uniform, value) {
    function isNumber(v) {
      return !isNaN(v) && Number(v) === v && v !== undefined;
    }

    let ok = true;
    if (Array.isArray(value) || value instanceof Float32Array) {
      for (const element of value) {
        if (!isNumber(element)) {
          ok = false;
        }
      }
    } else if (!isNumber(value)) {
      ok = false;
    }
    if (!ok) {
      /* eslint-disable no-console */
      /* global console */
      // Value could be unprintable so write the object on console
      console.error(`${this.id} Bad uniform ${uniform}`, value);
      /* eslint-enable no-console */
      throw new Error(`${this.id} Bad uniform ${uniform}`);
    }
    return this;
  }

  _log() {
    if (log.priority >= 3) {
      let table = this._getAttributesTable(this.geometry.attributes, {
        header: `Attributes for ${this.geometry.id}`,
        program: this.program
      });
      table = this._getAttributesTable(this.attributes, {
        table,
        program: this.program
      });
      log.table(3, table);

      table = this._getUniformsTable(this.uniforms, {
        header: `Uniforms for ${this.geometry.id}`
      });
      log.table(3, table);
    }
  }

  // Todo move to attributes manager
  _getAttributesTable(attributes, {
      header = 'Attributes',
      table = null,
      program
    } = {}) {
    assert(program);

    table = table || {[header]: {}};
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      let location = program && program._attributeLocations[attributeName];
      if (location === undefined && attribute.isIndexed) {
        location = 'ELEMENT_ARRAY_BUFFER';
      }
      table = table || {};
      table[attributeName] = {
        Name: attribute.value.constructor.name,
        Instanced: attribute.instanced,
        Verts: attribute.value.length / attribute.size,
        Size: attribute.size,
        Bytes: attribute.value.length * attribute.value.BYTES_PER_ELEMENT,
        Location: location
      };
    }
    return table;
  }

  // TODO - Move to uniforms manager
  _getUniformsTable(uniforms, {header = 'Uniforms', table = null} = {}) {
    table = table || {[header]: {}};
    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName];
      table[uniformName] = {
        Type: uniform,
        Value: uniform.toString()
      };
    }
    return table;
  }
}
