// o3d.js
// Scene Objects
/* eslint-disable guard-for-in */

// Define some locals
import {Vec3, Mat4} from '../math';
import {Buffer} from '../webgl';
import Scene from '../scene';
import {uid, splat} from '../utils';
import assert from 'assert';

const slice = Array.prototype.slice;

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

export class Material {
  constructor(opt) {

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
    shininess = 0, reflection = 0, refraction = 0,
    drawType = 'TRIANGLES',
    display = true,
    pickable,
    pickingColors, texCoords,
    uniforms, attributes,
    render, onBeforeRender, onAfterRender,
    computeNormals, computeCentroids, ...opt} = {}) {

    assert(program instanceof Program);
    this.id = opt.id || uid();

    // picking options
    this.pickable = Boolean(pickable);
    this.pick = opt.pick || (() => false);

    this.textures = opt.textures && splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.pickingColors = pickingColors || null;
    this.texCoords = opt.texCoords;

    // extra uniforms
    this.uniforms = opt.uniforms || {};
    // extra attribute descriptors
    this.attributes = opt.attributes || {};

    // whether to display the object at all
    this.display = display;

    // override the render method, before and after render callbacks
    this.render = opt.render || this.render;
    this.onBeforeRender = onBeforeRender || this.onBeforeRender;
    this.onAfterRender = onAfterRender || this.onAfterRender;

    this.geometry = geometry;

    // set a custom program per o3d
    this.program = program;

    this.buffers = {};

    if (opt.computeCentroids) {
      this.computeCentroids();
    }

    if (opt.computeNormals) {
      this.computeNormals();
    }
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  // ensure known attributes use typed arrays

  onBeforeRender() {
    const {program, attributes} = this;
    if (program) {
      program.use();
    }
    if (attributes) {
      this.setAttributes(program);
    }
  }

  onAfterRender() {
    const {program, attributes} = this;
    if (program) {
      program.use();
    }
    if (attributes) {
      this.unsetAttributes(program);
    }
  }

  get hash() {
    return this.id + ' ' + this.$pickingIndex;
  }

  setUniforms(program) {
    program.setUniforms(this.uniforms);
    return this;
  }

  // Makes sure buffers are created for all attributes
  // and that the program is updated with those buffers
  // TODO - do we need the separation between "attributes" and "buffers"
  //  couldn't apps just create buffers directly?
  setAttributes(program) {
    for (const attributeName of Object.keys(this.attributes)) {
      const attribute = this.attributes[attributeName];
      const bufferOpts = {
        attribute: attributeName,
        data: attribute.value,
        size: attribute.size,
        instanced: attribute.instanced ? 1 : 0,
        bufferType: attribute.bufferType || program.gl.ARRAY_BUFFER,
        drawType: attribute.drawType || program.gl.STATIC_DRAW
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

  unsetAttributes(program) {
    for (const attributeName of Object.keys(this.attributes)) {
      assert(this.buffers[attributeName]);
      program.unsetBuffer(this.buffers[attributeName]);
    }
    return this;
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
        drawType: gl.STATIC_DRAW,
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

  setTextures(program, force) {
    this.textures = this.textures ? splat(this.textures) : [];
    let tex2D = 0;
    let texCube = 0;
    const mtexs = Scene.MAX_TEXTURES;
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

  setState(program) {
    this.setUniforms(program);
    this.setAttributes(program);
    this.setVertices(program);
    this.setColors(program);
    this.setPickingColors(program);
    this.setNormals(program);
    this.setTextures(program);
    this.setTexCoords(program);
    this.setIndices(program);
  }

  unsetState(program) {
    const gl = program.gl;
    var attributes = program.attributes;

    // unbind the array and element buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    for (var name in attributes) {
      gl.disableVertexAttribArray(attributes[name]);
    }

  }
}

function normalizeColors(arr, len) {
  if (arr && arr.length < len) {
    const a0 = arr[0];
    const a1 = arr[1];
    const a2 = arr[2];
    const a3 = arr[3];
    const ans = [a0, a1, a2, a3];
    let times = len / arr.length;
    let index;

    while (--times) {
      index = times * 4;
      ans[index + 0] = a0;
      ans[index + 1] = a1;
      ans[index + 2] = a2;
      ans[index + 3] = a3;
    }

    return new Float32Array(ans);
  }
  return arr;
}
