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

// Model abstract O3D Class
export default class Model {

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  constructor(opt = {}) {
    this.id = opt.id || uid();
    // picking options
    this.pickable = Boolean(opt.pickable);
    this.pick = opt.pick || (() => false);

    this.vertices = opt.vertices;
    this.normals = opt.normals;
    this.textures = opt.textures && splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.shininess = opt.shininess || 0;
    this.reflection = opt.reflection || 0;
    this.refraction = opt.refraction || 0;

    if (opt.pickingColors) {
      this.pickingColors = opt.pickingColors;
    }

    if (opt.texCoords) {
      this.texCoords = opt.texCoords;
    }

    // extra uniforms
    this.uniforms = opt.uniforms || {};
    // extra attribute descriptors
    this.attributes = opt.attributes || {};
    // override the render method
    this.render = opt.render;
    // whether to render as triangles, lines, points, etc.
    this.drawType = opt.hasOwnProperty('drawType') ? opt.drawType : 'TRIANGLES';
    // whether to display the object at all
    this.display = 'display' in opt ? opt.display : true;
    // before and after render callbacks
    this.onBeforeRender = opt.onBeforeRender || this.onBeforeRender;
    this.onAfterRender = opt.onAfterRender || this.onAfterRender;
    // set a custom program per o3d
    if (opt.program) {
      this.program = opt.program;
    }

    // model position, rotation, scale and all in all matrix
    this.position = new Vec3();
    this.rotation = new Vec3();
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4();
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

  isPickable() {
    return this.pickable;
  }

  setPickable(pickable) {
    this.pickable = Boolean(pickable);
  }

  setRenderFunction(render) {
    this.render = render;
  }

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

  set vertices(val) {
    if (!val) {
      delete this.$vertices;
      delete this.$verticesLength;
      return;
    }
    const vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$vertices = val;
    } else if (this.$verticesLength === vlen) {
      this.$vertices.set(val);
    } else {
      this.$vertices = new Float32Array(val);
    }
    this.$verticesLength = vlen;
  }

  get vertices() {
    return this.$vertices;
  }

  set normals(val) {
    if (!val) {
      delete this.$normals;
      delete this.$normalsLength;
      return;
    }
    const vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$normals = val;
    } else if (this.$normalsLength === vlen) {
      this.$normals.set(val);
    } else {
      this.$normals = new Float32Array(val);
    }
    this.$normalsLength = vlen;
  }

  get normals() {
    return this.$normals;
  }

  set colors(val) {
    if (!val) {
      delete this.$colors;
      delete this.$colorsLength;
      return;
    }
    const vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$colors = val;
    } else if (this.$colorsLength === vlen) {
      this.$colors.set(val);
    } else {
      this.$colors = new Float32Array(val);
    }
    if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
      this.$colors =
        normalizeColors(slice.call(this.$colors), this.$verticesLength / 3 * 4);
    }
    this.$colorsLength = this.$colors.length;
  }

  get colors() {
    return this.$colors;
  }

  set pickingColors(val) {
    if (!val) {
      delete this.$pickingColors;
      delete this.$pickingColorsLength;
      return;
    }
    const vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$pickingColors = val;
    } else if (this.$pickingColorsLength === vlen) {
      this.$pickingColors.set(val);
    } else {
      this.$pickingColors = new Float32Array(val);
    }
    if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
      this.$pickingColors = normalizeColors(
        slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
    }
    this.$pickingColorsLength = this.$pickingColors.length;
  }

  get pickingColors() {
    return this.$pickingColors;
  }

  set texCoords(val) {
    if (!val) {
      delete this.$texCoords;
      delete this.$texCoordsLength;
      return;
    }
    if (val.constructor.name === 'Object') {
      var ans = {};
      for (var prop in val) {
        var texCoordArray = val[prop];
        ans[prop] = texCoordArray.BYTES_PER_ELEMENT ?
          texCoordArray : new Float32Array(texCoordArray);
      }
      this.$texCoords = ans;
    } else {
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$texCoords = val;
      } else if (this.$texCoordsLength === vlen) {
        this.$texCoords.set(val);
      } else {
        this.$texCoords = new Float32Array(val);
      }
      this.$texCoordsLength = vlen;
    }
  }

  get texCoords() {
    return this.$texCoords;
  }

  set indices(val) {
    if (!val) {
      delete this.$indices;
      delete this.$indicesLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$indices = val;
    } else if (this.$indicesLength === vlen) {
      this.$indices.set(val);
    } else {
      this.$indices = new Uint16Array(val);
    }
    this.$indicesLength = vlen;
  }

  get indices() {
    return this.$indices;
  }

  update() {
    const pos = this.position;
    const rot = this.rotation;
    const scale = this.scale;

    this.matrix.id();
    this.matrix.$translate(pos.x, pos.y, pos.z);
    this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
    this.matrix.$scale(scale.x, scale.y, scale.z);
  }

  computeCentroids() {
    const faces = this.faces;
    const vertices = this.vertices;
    const centroids = [];

    faces.forEach(face => {
      const centroid = [0, 0, 0];
      let acum = 0;

      face.forEach(idx => {
        const vertex = vertices[idx];
        centroid[0] += vertex[0];
        centroid[1] += vertex[1];
        centroid[2] += vertex[2];
        acum++;
      });

      centroid[0] /= acum;
      centroid[1] /= acum;
      centroid[2] /= acum;

      centroids.push(centroid);
    });

    this.centroids = centroids;
  }

  computeNormals() {
    const faces = this.faces;
    const vertices = this.vertices;
    const normals = [];

    faces.forEach(face => {
      const v1 = vertices[face[0]];
      const v2 = vertices[face[1]];
      const v3 = vertices[face[2]];
      const dir1 = {
        x: v3[0] - v2[0],
        y: v3[1] - v2[1],
        z: v3[1] - v2[2]
      };
      const dir2 = {
        x: v1[0] - v2[0],
        y: v1[1] - v2[1],
        z: v1[2] - v2[2]
      };

      Vec3.$cross(dir2, dir1);

      if (Vec3.norm(dir2) > 1e-6) {
        Vec3.unit(dir2);
      }

      normals.push([dir2.x, dir2.y, dir2.z]);
    });

    this.normals = normals;
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
