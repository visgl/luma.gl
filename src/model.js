// A scenegraph object node
/* eslint-disable guard-for-in */

// Define some locals
import {MAX_TEXTURES} from './config';
import {
  WebGL, Buffer, Program, draw,
  checkUniformValues, getUniformsTable
} from './webgl';

import Object3D from './scenegraph/object-3d';
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
    textures,
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

    if (opts.instanced) {
      console.warn(`Warning: ` +
        `Model constructor: parameter "instanced" renamed to "isInstanced". ` +
        `This will become a hard error in a future version of luma.gl.`);
      isInstanced = isInstanced || opts.instanced;
    }

    if (textures) {
      throw new Error(`Model constructor: parameter "textures" deprecated. ` +
        `Use uniforms to set textures`);
    }

    // TODO - remove?
    this.buffers = {};
    this.userData = {};
    this.drawParams = {};
    this.dynamic = false;

    // set a custom program per o3d
    // this.program = Program.makeFrom(gl, program);
    this.program = program;
    this.material = material;

    // Attributes and buffers
    this.setGeometry(geometry);
    this.attributes = {};
    this.setAttributes(attributes);

    this.uniforms = {
      ...program.defaultUniforms,
      ...uniforms
    };

    // instanced rendering
    this.isInstanced = isInstanced;
    this.instanceCount = instanceCount;
    this.vertexCount = vertexCount;

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = pick || (() => false);

    this.onBeforeRender = onBeforeRender;
    this.onAfterRender = onAfterRender;
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

  setGeometry(geometry) {
    this.geometry = geometry;
    this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
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
    checkUniformValues(uniforms);
    Object.assign(this.uniforms, uniforms);
    return this;
  }

  setTextures(textures = []) {
    throw new Error('setTextures replaced with setUniforms');
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

    log.log(2, `Rendering model ${this.id} - setting state`, this);

    this.setProgramState();

    const drawParams = this.drawParams;
    if (drawParams.isInstanced && !this.isInstanced) {
      log.warn(0, 'Found instanced attributes on non-instanced model');
    }

    this.onBeforeRender();

    log.log(2, `Rendering model ${this.id} - calling draw`, this);
    this._log(3);

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
    // this.bindTextures();
    program.setUniforms(this.uniforms);
    this.drawParams = {};
    program.setBuffers(this.buffers, {drawParams: this.drawParams});
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

      if (attribute instanceof Buffer) {
        this.buffers[attributeName] = attribute;
      } else {
        // Autocreate a buffer
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
    }

    return this;
  }

  bindTextures(force = false) {
    const textures = splat(this.textures);
    let tex2D = 0;

    // const texCube = 0;
    for (let i = 0; i < MAX_TEXTURES; i++) {
      if (i < textures.length) {
        // rye TODO: update this when TextureCube is implemented.
        // const isCube = app.textureMemo[textures[i]].isCube;
        // if (isCube) {
        // program.setTexture(textures[i], gl['TEXTURE' + i]);
        // program.setUniforms({
        //   ['hasTextureCube' + (i + 1)]: true,
        //   [samplerCube' + (texCube + 1)]: i
        // })
        // texCube++;
        // } else {
        this.setUniforms({
          [`hasTexture${i + 1}`]: true,
          [`sampler${tex2D + 1}`]: textures[i]
        });
        tex2D++;
      } else {
        this.setUniforms({
          [`hasTextureCube${i + 1}`]: false,
          [`hasTexture${i + 1}`]: false
          // [`sampler${++tex2D}`]: i,
          // [`samplerCube${++texCube}`]: i
        });
      }
    }
    return this;
  }

  _log(priority = 3) {
    if (log.priority >= priority) {
      let table = this._getAttributesTable({
        header: `Attributes ${this.geometry.id}`,
        program: this.program,
        attributes: {
          ...this.geometry.attributes,
          ...this.attributes
        }
      });
      log.table(priority, table);

      table = getUniformsTable({
        header: `Uniforms ${this.geometry.id}`,
        program: this.program,
        uniforms: this.uniforms
      });
      log.table(priority, table);
    }
  }

  // Todo move to attributes manager
  _getAttributesTable({
    attributes,
    header = 'Attributes',
    program
  } = {}) {
    assert(program);
    const attributeLocations = program._attributeLocations;
    const table = table || {[header]: {}};

    // Add used attributes
    for (const attributeName in attributeLocations) {
      const attribute = attributes[attributeName];
      const location = attributeLocations[attributeName];
      table[attributeName] = this._getAttributeEntry(attribute, location);
    }

    // Add any unused attributes
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      if (!table[attributeName]) {
        table[attributeName] = this._getAttributeEntry(attribute, null);
      }
    }

    return table;
  }

  _getAttributeEntry(attribute, location) {
    const round = num => Math.round(num * 10) / 10;

    if (attribute) {
      if (location === null) {
        location = attribute.isIndexed ? 'ELEMENT_ARRAY_BUFFER' : 'NOT USED';
      }

      if (attribute instanceof Buffer) {
        const buffer = attribute;
        return {
          Location: location,
          Type: buffer.layout.type,
          Instanced: buffer.layout.instanced,
          Verts: round(buffer.data.length / buffer.layout.size),
          Size: buffer.layout.size,
          Bytes: buffer.data.length * buffer.data.BYTES_PER_ELEMENT
        };
      }

      return {
        Location: location,
        Type: attribute.value.constructor.name,
        Instanced: attribute.instanced,
        Verts: round(attribute.value.length / attribute.size),
        Size: attribute.size,
        Bytes: attribute.value.length * attribute.value.BYTES_PER_ELEMENT
      };
    }
    return {
      Location: location,
      Type: 'NOT PROVIDED',
      Instanced: 'N/A',
      Verts: 'N/A',
      Size: 'N/A',
      Bytes: 'N/A'
    };
  }

}
