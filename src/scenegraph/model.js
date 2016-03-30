// A scenegraph object node
/* eslint-disable guard-for-in */

// Define some locals
import {Program, Buffer, draw} from '../webgl';
import {splat} from '../utils';
import assert from 'assert';
import Object3D from './object-3d';
import {MAX_TEXTURES} from '../config';

// Model repository
// map attribute names to property names
// TODO(nico): textures are treated separately.
/*
const attributeMap = {
  'position': 'vertices',
  'normal': 'normals',
  'pickingColor': 'pickingColors',
  'colors': 'color'
};
*/

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
    material, shininess = 0, reflection = 0, refraction = 0,
    // Enable instanced rendering (requires shader support and extra attributes)
    instanced = false, instanceCount = 0,
    pickable, pick,
    // Extra uniforms and attributes (beyond geometry, material, camera)
    uniforms = {},
    attributes = {}, pickingColors, texCoords,
    textures,
    render, onBeforeRender, onAfterRender,
    ...opts} = {}) {

    assert(!program || program instanceof Program);

    super(opts);

    // set a custom program per o3d
    this.program = program;
    this.geometry = geometry;
    this.material = material;

    // instanced rendering
    this.instanced = instanced;
    this.instanceCount = instanceCount;

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = pick || (() => false);

    // this.textures = textures && splat(textures);
    // this.colors = opt.colors;
    // this.indices = opt.indices;
    // this.pickingColors = pickingColors || null;
    // this.texCoords = opt.texCoords;

    // extra uniforms and attribute descriptors
    this.uniforms = uniforms;
    this.attributes = attributes;

    // override the render method, before and after render callbacks
    this.render = render || this.render;
    this.onBeforeRender = onBeforeRender || this.onBeforeRender;
    this.onAfterRender = onAfterRender || this.onAfterRender;

    this.buffers = {};
    this.userData = {};

    this.textures = [];
    // TODO - remove?
    this.dynamic = false;

    Object.seal(this);
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  get hash() {
    return this.id + ' ' + this.$pickingIndex;
  }

  setInstanceCount(instanceCount) {
    assert(instanceCount !== undefined);
    this.instanceCount = instanceCount;
  }

  getProgram() {
    return this.program;
  }

  isPickable() {
    return this.pickable;
  }

  setPickable(pickable = true) {
    this.pickable = Boolean(pickable);
  }

  getUniforms() {
    return this.uniforms;
  }

  setUniforms(uniforms = {}) {
    Object.assign(this.uniforms, uniforms);
  }

  onBeforeRender() {
    const {program, attributes} = this;
    program.use();
    this.setAttributes(attributes);
  }

  render(gl, {viewMatrix}) {
    const {program} = this;
    program.setUniforms(this.getCoordinateUniforms(viewMatrix));

    const {geometry, instanced, instanceCount} = this;
    const {drawMode, attributes} = geometry;
    const {indices, vertices} = attributes;
    const vertexCount = indices ? indices.length : vertices.length / 3;
    draw(gl, {
      drawMode,
      vertexCount,
      indexed: Boolean(indices),
      instanced,
      instanceCount
    });
  }

  onAfterRender() {
    const {program, attributes} = this;
    program.use();
    this.unsetAttributes(attributes);
  }

  setProgramState() {
    const {program} = this;
    program.setUniforms(this.uniforms);
    this.setAttributes(this.attributes);
    this.setAttributes(this.geometry.attributes);
    this.setTextures(program);

    // this.setVertices(program);
    // this.setColors(program);
    // this.setPickingColors(program);
    // this.setNormals(program);
    // this.setTexCoords(program);
    // this.setIndices(program);
  }

  unsetProgramState() {
    const {program} = this;
    const gl = program.gl;

    // unbind the array and element buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    var attributes = program.attributes;
    for (var name in attributes) {
      gl.disableVertexAttribArray(attributes[name]);
    }
  }

  // Makes sure buffers are created for all attributes
  // and that the program is updated with those buffers
  // TODO - do we need the separation between "attributes" and "buffers"
  //  couldn't apps just create buffers directly?
  setAttributes(attributes) {
    assert(attributes);
    const {program} = this;
    for (const attributeName of Object.keys(attributes)) {
      const attribute = attributes[attributeName];
      const bufferOpts = {
        attribute: attributeName,
        data: attribute.value,
        size: attribute.size,
        instanced: attribute.instanced ? 1 : 0,
        bufferType: attribute.bufferType || program.gl.ARRAY_BUFFER,
        drawMode: attribute.drawMode || program.gl.STATIC_DRAW
      };
      if (!this.buffers[attributeName]) {
        this.buffers[attributeName] = new Buffer(program.gl, bufferOpts);
      } else {
        this.buffers[attributeName].update(bufferOpts);
      }
      program.setBuffer(this.buffers[attributeName]);
    }
    return this;
  }

  unsetAttributes(attributes) {
    assert(attributes);
    const {program} = this;
    for (const attributeName of Object.keys(attributes)) {
      assert(this.buffers[attributeName]);
      program.unsetBuffer(this.buffers[attributeName]);
    }
    return this;
  }

  setTextures(force = false) {
    const {program} = this;
    this.textures = this.textures ? splat(this.textures) : [];
    let tex2D = 0;
    let texCube = 0;
    const mtexs = MAX_TEXTURES;
    for (let i = 0, texs = this.textures, l = texs.length; i < mtexs; i++) {
      if (i < l) {
        // rye TODO: update this when TextureCube is implemented.
        // const isCube = app.textureMemo[texs[i]].isCube;
        // if (isCube) {
        //   program.setUniform('hasTextureCube' + (i + 1), true);
        //   program.setTexture(texs[i], gl['TEXTURE' + i]);
        //   program.setUniform('samplerCube' + (texCube + 1), i);
        //   texCube++;
        // } else {
        program.setUniform('hasTexture' + (i + 1), true);
        program.setTexture(texs[i], tex2D);
        program.setUniform('sampler' + (tex2D + 1), i);
        tex2D++;
        // }
      } else {
        program.setUniform('hasTextureCube' + (i + 1), false);
        program.setUniform('hasTexture' + (i + 1), false);
        program.setUniform('sampler' + (++tex2D), i);
        program.setUniform('samplerCube' + (++texCube), i);
      }
    }
  }

  // TODO - remove
  /*
  setTexCoords(program) {
    if (!this.$texCoords) {
      return;
    }

    const gl = program.gl;
    const multi = this.$texCoords.constructor.name === 'Object';
    let tex;

    if (!this.buffers.texCoords) {
      if (multi) {
        this.buffers.texCoords = {};
        for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
          tex = txs[i];
          this.buffers.texCoords['texCoord' + (i + 1)] = new Buffer(gl, {
            attribute: 'texCoord' + (i + 1),
            data: this.$texCoords[tex],
            size: 2
          });
        }
      } else {
        this.buffers.texCoords = new Buffer(gl, {
          attribute: 'texCoord1',
          data: this.$texCoords,
          size: 2
        });
      }
    } else if (this.dynamic) {
      if (multi) {
        for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
          tex = txs[i];
          this.buffers.texCoords['texCoord' + (i + 1)].update({
            data: this.$texCoords[tex]
          });
        }
      } else {
        this.buffers.texCoords.update({
          data: this.$texCoords
        });
      }
    }

    if (multi) {
      for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
        tex = txs[i];
        program.setBuffer(this.buffers.texCoords['texCoord' + (i + 1)]);
      }
    } else {
      program.setBuffer(this.buffers.texCoords);
    }
  }

  setVertices(program) {
    if (!this.$vertices) {
      return;
    }
    if (!this.buffers.position) {
      this.buffers.position = new Buffer(program.gl, {
        attribute: 'position',
        data: this.$vertices,
        size: 3
      });
    } else if (this.dynamic) {
      this.buffers.position.update({
        data: this.$vertices
      });
    }

    program.setBuffer(this.buffers.position);
  }

  setNormals(program) {
    if (!this.$normals) {
      return;
    }

    if (!this.buffers.normal) {
      this.buffers.normal = new Buffer(program.gl, {
        attribute: 'normal',
        data: this.$normals,
        size: 3
      });
    } else if (this.dynamic) {
      this.buffers.normal.update({
        data: this.$normals
      });
    }

    program.setBuffer(this.buffers.normal);
  }

  setIndices(program) {
    if (!this.$indices) {
      return;
    }

    const gl = program.gl;

    if (!this.buffers.indices) {
      this.buffers.indices = new Buffer(program.gl, {
        bufferType: gl.ELEMENT_ARRAY_BUFFER,
        drawMode: gl.STATIC_DRAW,
        data: this.$indices,
        size: 1
      });
    } else if (this.dynamic) {
      this.buffers.indices.update({
        data: this.$indices
      });
    }

    program.setBuffer(this.buffers.indices);
  }

  setPickingColors(program) {
    if (!this.$pickingColors) {
      return;
    }

    if (!this.buffers.pickingColors) {
      this.buffers.pickingColors = new Buffer(program.gl, {
        attribute: 'pickingColor',
        data: this.$pickingColors,
        size: 4
      });
    } else if (this.dynamic) {
      this.buffers.pickingColors.update({
        data: this.$pickingColors
      });
    }

    program.setBuffer(this.buffers.pickingColors);
  }

  setColors(program) {
    if (!this.$colors) {
      return;
    }

    if (!this.buffers.colors) {
      this.buffers.colors = new Buffer(program.gl, {
        attribute: 'color',
        data: this.$colors,
        size: 4
      });
    } else if (this.dynamic) {
      this.buffers.colors.update({
        data: this.$colors
      });
    }

    program.setBuffer(this.buffers.colors);
  }
  */
}
