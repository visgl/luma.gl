/* eslint-disable computed-property-spacing, brace-style, max-params, one-var */
/* eslint-disable indent, no-loop-func, max-statements, comma-spacing */
/* eslint-disable complexity, block-scoped-var */
import Model from './model';

export default class Plane extends Model {
  constructor(config = {}) {
    const type = config.type;
    const coords = type.split(',');
    // width, height
    let c1len = config[coords[0] + 'len'];
    const c2len = config[coords[1] + 'len'];
    // subdivisionsWidth, subdivisionsDepth
    const subdivisions1 = config['n' + coords[0]] || 1;
    const subdivisions2 = config['n' + coords[1]] || 1;
    const offset = config.offset;
    const flipCull = Boolean(config.flipCull);
    const numVertices = (subdivisions1 + 1) * (subdivisions2 + 1);
    const positions = new Float32Array(numVertices * 3);
    const normals = new Float32Array(numVertices * 3);
    const texCoords = new Float32Array(numVertices * 2);
    let i2 = 0, i3 = 0;

    if (flipCull) {
      c1len = -c1len;
    }

    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1,
            v = z / subdivisions2;
        if (flipCull) {
          texCoords[i2 + 0] = 1 - u;
        } else {
          texCoords[i2 + 0] = u;
        }
        texCoords[i2 + 1] = v;
        i2 += 2;

        switch (type) {
          case 'x,y':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = c2len * v - c2len * 0.5;
            positions[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            if (flipCull) {
              normals[i3 + 2] = 1;
            } else {
              normals[i3 + 2] = -1;
            }
          break;

          case 'x,z':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = offset;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            if (flipCull) {
              normals[i3 + 1] = 1;
            } else {
              normals[i3 + 1] = -1;
            }
            normals[i3 + 2] = 0;
          break;

          case 'y,z':
            positions[i3 + 0] = offset;
            positions[i3 + 1] = c1len * u - c1len * 0.5;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            if (flipCull) {
              normals[i3 + 0] = 1;
            } else {
              normals[i3 + 0] = -1;
            }
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
          break;
        default:
          break;
        }
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1,
        indices = [],
        index;

    for (z = 0; z < subdivisions2; z++) {
      for (x = 0; x < subdivisions1; x++) {
        index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
      }
    }

    var positions2, normals2, texCoords2;
    if (config.unpack) {
      positions2 = new Float32Array(indices.length * 3);
      normals2 = new Float32Array(indices.length * 3);
      texCoords2 = new Float32Array(indices.length * 2);

      const l = indices.length;
      for (x = 0; x < l; ++x) {
        index = indices[x];
        positions2[x * 3 + 0] = positions[index * 3 + 0];
        positions2[x * 3 + 1] = positions[index * 3 + 1];
        positions2[x * 3 + 2] = positions[index * 3 + 2];
        normals2[x * 3 + 0] = normals[index * 3 + 0];
        normals2[x * 3 + 1] = normals[index * 3 + 1];
        normals2[x * 3 + 2] = normals[index * 3 + 2];
        texCoords2[x * 2 + 0] = texCoords[index * 2 + 0];
        texCoords2[x * 2 + 1] = texCoords[index * 2 + 1];
      }

      config = {
        vertices: positions2,
        normals: normals2,
        texCoords: texCoords2,
        ...config
      };
    } else {
      config = {
        vertices: positions,
        normals: normals,
        texCoords: texCoords,
        indices: indices,
        ...config
      };
    }

    super(config);
  }
}
