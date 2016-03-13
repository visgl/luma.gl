
export default class Geometry {
  constructor(drawType = 'TRIANGLES', ...opts) {
    this.vertices = opts.vertices;
    this.normals = opts.normals;

    if (opts.texCoords) {
      this.texCoords = opts.texCoords;
    }

    this.drawType = drawType;
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

}

export class FaceGeometry extends Geometry {

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
}
