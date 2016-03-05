import Model from './model';
import {Vec3} from '../math';
// TODO - clean up linting and remove some of thes exceptions
/* eslint-disable computed-property-spacing, brace-style, max-params, one-var */
/* eslint-disable indent, no-loop-func, max-statements, comma-spacing */
/* eslint-disable complexity, block-scoped-var */

export default class IcoSphere extends Model {
  constructor(opt = {}) {
    var iterations = opt.iterations || 0,
        vertices = [],
        indices = [],
        sqrt = Math.sqrt,
        acos = Math.acos,
        atan2 = Math.atan2,
        pi = Math.PI,
        pi2 = pi * 2;

    // Add a callback for when a vertex is created
    opt.onAddVertex = opt.onAddVertex || function() {};

    vertices.push(-1,0,0, 0,1,0, 0,0,-1, 0,0,1, 0,-1,0, 1,0,0);
    indices.push(3,4,5,3,5,1,3,1,0,3,0,4,4,0,2,4,2,5,2,0,1,5,2,1);

    var getMiddlePoint = (function() {
      var pointMemo = {};

      return function(i1, i2) {
        i1 *= 3;
        i2 *= 3;
        var mini = i1 < i2 ? i1 : i2,
            maxi = i1 > i2 ? i1 : i2,
            key = mini + '|' + maxi;

        if (key in pointMemo) {
          return pointMemo[key];
        }

        var x1 = vertices[i1],
            y1 = vertices[i1 + 1],
            z1 = vertices[i1 + 2],
            x2 = vertices[i2],
            y2 = vertices[i2 + 1],
            z2 = vertices[i2 + 2],
            xm = (x1 + x2) / 2,
            ym = (y1 + y2) / 2,
            zm = (z1 + z2) / 2,
            len = sqrt(xm * xm + ym * ym + zm * zm);

        xm /= len;
        ym /= len;
        zm /= len;

        vertices.push(xm, ym, zm);

        return (pointMemo[key] = (vertices.length / 3 - 1));
      };
    }());

    for (let i = 0; i < iterations; i++) {
      var indices2 = [];
      for (var j = 0, l = indices.length; j < l; j += 3) {
        var a = getMiddlePoint(indices[j + 0], indices[j + 1]),
            b = getMiddlePoint(indices[j + 1], indices[j + 2]),
            c = getMiddlePoint(indices[j + 2], indices[j + 0]);

        indices2.push(
          c, indices[j + 0], a,
          a, indices[j + 1], b,
          b, indices[j + 2], c,
          a, b, c);
      }
      indices = indices2;
    }

    // Calculate texCoords and normals
    l = indices.length;
    var normals = new Array(l * 3),
        texCoords = new Array(l * 2);

    for (let i = l - 3; i >= 0; i -= 3) {
      var i1 = indices[i + 0],
          i2 = indices[i + 1],
          i3 = indices[i + 2],
          in1 = i1 * 3,
          in2 = i2 * 3,
          in3 = i3 * 3,
          iu1 = i1 * 2,
          iu2 = i2 * 2,
          iu3 = i3 * 2,
          x1 = vertices[in1 + 0],
          y1 = vertices[in1 + 1],
          z1 = vertices[in1 + 2],
          theta1 = acos(z1 / sqrt(x1 * x1 + y1 * y1 + z1 * z1)),
          phi1 = atan2(y1, x1) + pi,
          v1 = theta1 / pi,
          u1 = 1 - phi1 / pi2,
          x2 = vertices[in2 + 0],
          y2 = vertices[in2 + 1],
          z2 = vertices[in2 + 2],
          theta2 = acos(z2 / sqrt(x2 * x2 + y2 * y2 + z2 * z2)),
          phi2 = atan2(y2, x2) + pi,
          v2 = theta2 / pi,
          u2 = 1 - phi2 / pi2,
          x3 = vertices[in3 + 0],
          y3 = vertices[in3 + 1],
          z3 = vertices[in3 + 2],
          theta3 = acos(z3 / sqrt(x3 * x3 + y3 * y3 + z3 * z3)),
          phi3 = atan2(y3, x3) + pi,
          v3 = theta3 / pi,
          u3 = 1 - phi3 / pi2,
          vec1 = [
            x3 - x2,
            y3 - y2,
            z3 - z2
          ],
          vec2 = [
            x1 - x2,
            y1 - y2,
            z1 - z2
          ],
          normal = Vec3.cross(vec1, vec2).$unit(),
          newIndex;

      if ((u1 === 0 || u2 === 0 || u3 === 0) &&
          (u1 === 0 || u1 > 0.5) &&
            (u2 === 0 || u2 > 0.5) &&
              (u3 === 0 || u3 > 0.5)) {

          vertices.push(
            vertices[in1 + 0],
            vertices[in1 + 1],
            vertices[in1 + 2]
          );
          newIndex = vertices.length / 3 - 1;
          indices.push(newIndex);
          texCoords[newIndex * 2 + 0] = 1;
          texCoords[newIndex * 2 + 1] = v1;
          normals[newIndex * 3 + 0] = normal.x;
          normals[newIndex * 3 + 1] = normal.y;
          normals[newIndex * 3 + 2] = normal.z;

          vertices.push(
            vertices[in2 + 0],
            vertices[in2 + 1],
            vertices[in2 + 2]
          );
          newIndex = vertices.length / 3 - 1;
          indices.push(newIndex);
          texCoords[newIndex * 2 + 0] = 1;
          texCoords[newIndex * 2 + 1] = v2;
          normals[newIndex * 3 + 0] = normal.x;
          normals[newIndex * 3 + 1] = normal.y;
          normals[newIndex * 3 + 2] = normal.z;

          vertices.push(
            vertices[in3 + 0],
            vertices[in3 + 1],
            vertices[in3 + 2]
          );
          newIndex = vertices.length / 3 - 1;
          indices.push(newIndex);
          texCoords[newIndex * 2 + 0] = 1;
          texCoords[newIndex * 2 + 1] = v3;
          normals[newIndex * 3 + 0] = normal.x;
          normals[newIndex * 3 + 1] = normal.y;
          normals[newIndex * 3 + 2] = normal.z;
      }

      normals[in1 + 0] = normals[in2 + 0] = normals[in3 + 0] = normal.x;
      normals[in1 + 1] = normals[in2 + 1] = normals[in3 + 1] = normal.y;
      normals[in1 + 2] = normals[in2 + 2] = normals[in3 + 2] = normal.z;

      texCoords[iu1 + 0] = u1;
      texCoords[iu1 + 1] = v1;

      texCoords[iu2 + 0] = u2;
      texCoords[iu2 + 1] = v2;

      texCoords[iu3 + 0] = u3;
      texCoords[iu3 + 1] = v3;
    }

    super({
      vertices: vertices,
      indices: indices,
      normals: normals,
      texCoords: texCoords,
      ...opt
    });
  }
}
