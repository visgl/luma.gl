// Vec3, Mat4 and Quat classes
// TODO - clean up linting and remove some of these exceptions
/* eslint-disable */
/* eslint-disable computed-property-spacing, brace-style, max-params, one-var */
/* eslint-disable indent, no-loop-func */

const sqrt = Math.sqrt;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const pi = Math.PI;
const slice = Array.prototype.slice;

// Vec3 Class
export class Vec3 extends Array {

  constructor(x = 0, y = 0, z = 0) {
    super(3);
    this[0] = x;
    this[1] = y;
    this[2] = z;
  }

  // fast Vec3 create.
  static create() {
    return new Vec3(3);
  }

  get x() {
    return this[0];
  }

  set x(value) {
    return (this[0] = value);
  }

  get y() {
    return this[1];
  }

  set y(value) {
    return (this[1] = value);
  }

  get z() {
    return this[2];
  }

  set z(value) {
    return (this[2] = value);
  }
}

var generics = {

  setVec3(dest, vec) {
    dest[0] = vec[0];
    dest[1] = vec[1];
    dest[2] = vec[2];
    return dest;
  },

  set(dest, x, y, z) {
    dest[0] = x;
    dest[1] = y;
    dest[2] = z;
    return dest;
  },

  add(dest, vec) {
    return new Vec3(dest[0] + vec[0],
                    dest[1] + vec[1],
                    dest[2] + vec[2]);
  },

  $add(dest, vec) {
    dest[0] += vec[0];
    dest[1] += vec[1];
    dest[2] += vec[2];
    return dest;
  },

  add2(dest, a, b) {
    dest[0] = a[0] + b[0];
    dest[1] = a[1] + b[1];
    dest[2] = a[2] + b[2];
    return dest;
  },

  sub(dest, vec) {
    return new Vec3(dest[0] - vec[0],
                    dest[1] - vec[1],
                    dest[2] - vec[2]);
  },

  $sub(dest, vec) {
    dest[0] -= vec[0];
    dest[1] -= vec[1];
    dest[2] -= vec[2];
    return dest;
  },

  sub2(dest, a, b) {
    dest[0] = a[0] - b[0];
    dest[1] = a[1] - b[1];
    dest[2] = a[2] - b[2];
    return dest;
  },

  scale(dest, s) {
    return new Vec3(dest[0] * s,
                    dest[1] * s,
                    dest[2] * s);
  },

  $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    return dest;
  },

  neg(dest) {
    return new Vec3(-dest[0],
                    -dest[1],
                    -dest[2]);
  },

  $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  },

  unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.scale(dest, 1 / len);
    }
    return Vec3.clone(dest);
  },

  $unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.$scale(dest, 1 / len);
    }
    return dest;
  },

  cross(dest, vec) {
    var dx = dest[0],
      dy = dest[1],
      dz = dest[2],
      vx = vec[0],
      vy = vec[1],
      vz = vec[2];

    return new Vec3(dy * vz - dz * vy,
                    dz * vx - dx * vz,
                    dx * vy - dy * vx);
  },

  $cross(dest, vec) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2],
        vx = vec[0],
        vy = vec[1],
        vz = vec[2];

    dest[0] = dy * vz - dz * vy;
    dest[1] = dz * vx - dx * vz;
    dest[2] = dx * vy - dy * vx;
    return dest;
  },

  distTo(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return sqrt(dx * dx +
                dy * dy +
                dz * dz);
  },

  distToSq(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return dx * dx + dy * dy + dz * dz;
  },

  norm(dest) {
    var dx = dest[0], dy = dest[1], dz = dest[2];

    return sqrt(dx * dx + dy * dy + dz * dz);
  },

  normSq(dest) {
    var dx = dest[0], dy = dest[1], dz = dest[2];

    return dx * dx + dy * dy + dz * dz;
  },

  dot(dest, vec) {
    return dest[0] * vec[0] + dest[1] * vec[1] + dest[2] * vec[2];
  },

  clone(dest) {
    if (dest instanceof Vec3) {
      return new Vec3(dest[0], dest[1], dest[2]);
    }
    return Vec3.setVec3(new Float32Array(3), dest);
  },

  toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) {
      return dest;
    }

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];

    return ans;
  }
};

// add generics and instance methods
var proto = Vec3.prototype;
for (var method in generics) {
  Vec3[method] = generics[method];
  proto[method] = (function _(m) {
    return function() {
      var args = slice.call(arguments);
      args.unshift(this);
      return Vec3[m].apply(Vec3, args);
    };
 }(method));
}

// Mat4 Class
export class Mat4 extends Array {

  constructor(n11, n12, n13, n14,
              n21, n22, n23, n24,
              n31, n32, n33, n34,
              n41, n42, n43, n44) {

    super(16);

    this.length = 16;

    if (typeof n11 === 'number') {

      this.set(n11, n12, n13, n14,
               n21, n22, n23, n24,
               n31, n32, n33, n34,
               n41, n42, n43, n44);

    } else {
      this.id();
    }

    this.typedContainer = new Float32Array(16);
  }

  static create() {
    return new Array(16);
  }

  copy(src) {
    for (var i = 0; i < 16; ++i) {
      this[i] = src[i];
    }
    return this;
  }

  get n11() { return this[0]; }
  get n12() { return this[4]; }
  get n13() { return this[8]; }
  get n14() { return this[12]; }
  get n21() { return this[1]; }
  get n22() { return this[5]; }
  get n23() { return this[9]; }
  get n24() { return this[13]; }
  get n31() { return this[2]; }
  get n32() { return this[6]; }
  get n33() { return this[10]; }
  get n34() { return this[14]; }
  get n41() { return this[3]; }
  get n42() { return this[7]; }
  get n43() { return this[11]; }
  get n44() { return this[15]; }

  set n11(val) { this[0] = val; }
  set n12(val) { this[4] = val; }
  set n13(val) { this[8] = val; }
  set n14(val) { this[12] = val; }
  set n21(val) { this[1] = val; }
  set n22(val) { this[5] = val; }
  set n23(val) { this[9] = val; }
  set n24(val) { this[13] = val; }
  set n31(val) { this[2] = val; }
  set n32(val) { this[6] = val; }
  set n33(val) { this[10] = val; }
  set n34(val) { this[14] = val; }
  set n41(val) { this[3] = val; }
  set n42(val) { this[7] = val; }
  set n43(val) { this[11] = val; }
  set n44(val) { this[15] = val; }

}

generics = {

  id(dest) {

    dest[0 ] = 1;
    dest[1 ] = 0;
    dest[2 ] = 0;
    dest[3 ] = 0;
    dest[4 ] = 0;
    dest[5 ] = 1;
    dest[6 ] = 0;
    dest[7 ] = 0;
    dest[8 ] = 0;
    dest[9 ] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;

    return dest;
  },

  clone(dest) {
    if (dest instanceof Mat4) {
      return new Mat4(dest[0], dest[4], dest[8], dest[12],
                      dest[1], dest[5], dest[9], dest[13],
                      dest[2], dest[6], dest[10], dest[14],
                      dest[3], dest[7], dest[11], dest[15]);
    }
    return new typedArray(dest);
  },

  set(dest, n11, n12, n13, n14,
            n21, n22, n23, n24,
            n31, n32, n33, n34,
            n41, n42, n43, n44) {

    dest[0 ] = n11;
    dest[4 ] = n12;
    dest[8 ] = n13;
    dest[12] = n14;
    dest[1 ] = n21;
    dest[5 ] = n22;
    dest[9 ] = n23;
    dest[13] = n24;
    dest[2 ] = n31;
    dest[6 ] = n32;
    dest[10] = n33;
    dest[14] = n34;
    dest[3 ] = n41;
    dest[7 ] = n42;
    dest[11] = n43;
    dest[15] = n44;

    return dest;
  },

  mulVec3(dest, vec) {
    var ans = Vec3.clone(vec);
    return Mat4.$mulVec3(dest, ans);
  },

  $mulVec3(dest, vec) {
    var vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        d = 1 / (dest[3] * vx + dest[7] * vy + dest[11] * vz + dest[15]);

    vec[0] = (dest[0] * vx + dest[4] * vy + dest[8 ] * vz + dest[12]) * d;
    vec[1] = (dest[1] * vx + dest[5] * vy + dest[9 ] * vz + dest[13]) * d;
    vec[2] = (dest[2] * vx + dest[6] * vy + dest[10] * vz + dest[14]) * d;

    return vec;
  },

  mulMat42(dest, a, b) {
    var a11 = a[0 ], a12 = a[1 ], a13 = a[2 ], a14 = a[3 ],
        a21 = a[4 ], a22 = a[5 ], a23 = a[6 ], a24 = a[7 ],
        a31 = a[8 ], a32 = a[9 ], a33 = a[10], a34 = a[11],
        a41 = a[12], a42 = a[13], a43 = a[14], a44 = a[15],
        b11 = b[0 ], b12 = b[1 ], b13 = b[2 ], b14 = b[3 ],
        b21 = b[4 ], b22 = b[5 ], b23 = b[6 ], b24 = b[7 ],
        b31 = b[8 ], b32 = b[9 ], b33 = b[10], b34 = b[11],
        b41 = b[12], b42 = b[13], b43 = b[14], b44 = b[15];

    dest[0 ] = b11 * a11 + b12 * a21 + b13 * a31 + b14 * a41;
    dest[1 ] = b11 * a12 + b12 * a22 + b13 * a32 + b14 * a42;
    dest[2 ] = b11 * a13 + b12 * a23 + b13 * a33 + b14 * a43;
    dest[3 ] = b11 * a14 + b12 * a24 + b13 * a34 + b14 * a44;

    dest[4 ] = b21 * a11 + b22 * a21 + b23 * a31 + b24 * a41;
    dest[5 ] = b21 * a12 + b22 * a22 + b23 * a32 + b24 * a42;
    dest[6 ] = b21 * a13 + b22 * a23 + b23 * a33 + b24 * a43;
    dest[7 ] = b21 * a14 + b22 * a24 + b23 * a34 + b24 * a44;

    dest[8 ] = b31 * a11 + b32 * a21 + b33 * a31 + b34 * a41;
    dest[9 ] = b31 * a12 + b32 * a22 + b33 * a32 + b34 * a42;
    dest[10] = b31 * a13 + b32 * a23 + b33 * a33 + b34 * a43;
    dest[11] = b31 * a14 + b32 * a24 + b33 * a34 + b34 * a44;

    dest[12] = b41 * a11 + b42 * a21 + b43 * a31 + b44 * a41;
    dest[13] = b41 * a12 + b42 * a22 + b43 * a32 + b44 * a42;
    dest[14] = b41 * a13 + b42 * a23 + b43 * a33 + b44 * a43;
    dest[15] = b41 * a14 + b42 * a24 + b43 * a34 + b44 * a44;
    return dest;
  },

  mulMat4(a, b) {
    var m = Mat4.clone(a);
    return Mat4.mulMat42(m, a, b);
  },

  $mulMat4(a, b) {
    return Mat4.mulMat42(a, a, b);
  },

  add(dest, m) {
    var copy = Mat4.clone(dest);
    return Mat4.$add(copy, m);
  },

  $add(dest, m) {
    dest[0 ] += m[0];
    dest[1 ] += m[1];
    dest[2 ] += m[2];
    dest[3 ] += m[3];
    dest[4 ] += m[4];
    dest[5 ] += m[5];
    dest[6 ] += m[6];
    dest[7 ] += m[7];
    dest[8 ] += m[8];
    dest[9 ] += m[9];
    dest[10] += m[10];
    dest[11] += m[11];
    dest[12] += m[12];
    dest[13] += m[13];
    dest[14] += m[14];
    dest[15] += m[15];

    return dest;
  },

  transpose(dest) {
    var m = Mat4.clone(dest);
    return Mat4.$transpose(m);
  },

  $transpose(dest) {
    var n4 = dest[4], n8 = dest[8], n12 = dest[12],
        n1 = dest[1], n9 = dest[9], n13 = dest[13],
        n2 = dest[2], n6 = dest[6], n14 = dest[14],
        n3 = dest[3], n7 = dest[7], n11 = dest[11];

    dest[1] = n4;
    dest[2] = n8;
    dest[3] = n12;
    dest[4] = n1;
    dest[6] = n9;
    dest[7] = n13;
    dest[8] = n2;
    dest[9] = n6;
    dest[11] = n14;
    dest[12] = n3;
    dest[13] = n7;
    dest[14] = n11;

    return dest;
  },

  rotateAxis(dest, theta, vec) {
    var m = Mat4.clone(dest);
    return Mat4.$rotateAxis(m, theta, vec);
  },

  $rotateAxis(dest, theta, vec) {
    var s = sin(theta),
        c = cos(theta),
        nc = 1 - c,
        vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        m11 = vx * vx * nc + c,
        m12 = vx * vy * nc + vz * s,
        m13 = vx * vz * nc - vy * s,
        m21 = vy * vx * nc - vz * s,
        m22 = vy * vy * nc + c,
        m23 = vy * vz * nc + vx * s,
        m31 = vx * vz * nc + vy * s,
        m32 = vy * vz * nc - vx * s,
        m33 = vz * vz * nc + c,
        d11 = dest[0],
        d12 = dest[1],
        d13 = dest[2],
        d14 = dest[3],
        d21 = dest[4],
        d22 = dest[5],
        d23 = dest[6],
        d24 = dest[7],
        d31 = dest[8],
        d32 = dest[9],
        d33 = dest[10],
        d34 = dest[11],
        d41 = dest[12],
        d42 = dest[13],
        d43 = dest[14],
        d44 = dest[15];

    dest[0 ] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1 ] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2 ] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3 ] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4 ] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5 ] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6 ] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7 ] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8 ] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9 ] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },

  rotateXYZ(dest, rx, ry, rz) {
    var ans = Mat4.clone(dest);
    return Mat4.$rotateXYZ(ans, rx, ry, rz);
  },

  $rotateXYZ(dest, rx, ry, rz) {
    var d11 = dest[0 ],
        d12 = dest[1 ],
        d13 = dest[2 ],
        d14 = dest[3 ],
        d21 = dest[4 ],
        d22 = dest[5 ],
        d23 = dest[6 ],
        d24 = dest[7 ],
        d31 = dest[8 ],
        d32 = dest[9 ],
        d33 = dest[10],
        d34 = dest[11],
        crx = cos(rx),
        cry = cos(ry),
        crz = cos(rz),
        srx = sin(rx),
        sry = sin(ry),
        srz = sin(rz),
        m11 =  cry * crz,
        m21 = -crx * srz + srx * sry * crz,
        m31 =  srx * srz + crx * sry * crz,
        m12 =  cry * srz,
        m22 =  crx * crz + srx * sry * srz,
        m32 = -srx * crz + crx * sry * srz,
        m13 = -sry,
        m23 =  srx * cry,
        m33 =  crx * cry;

    dest[0 ] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1 ] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2 ] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3 ] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4 ] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5 ] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6 ] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7 ] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8 ] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9 ] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },

  translate(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$translate(m, x, y, z);
  },

  $translate(dest, x, y, z) {
    dest[12] = dest[0 ] * x + dest[4 ] * y + dest[8 ] * z + dest[12];
    dest[13] = dest[1 ] * x + dest[5 ] * y + dest[9 ] * z + dest[13];
    dest[14] = dest[2 ] * x + dest[6 ] * y + dest[10] * z + dest[14];
    dest[15] = dest[3 ] * x + dest[7 ] * y + dest[11] * z + dest[15];

    return dest;
  },

  scale(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$scale(m, x, y, z);
  },

  $scale(dest, x, y, z) {
    dest[0 ] *= x;
    dest[1 ] *= x;
    dest[2 ] *= x;
    dest[3 ] *= x;
    dest[4 ] *= y;
    dest[5 ] *= y;
    dest[6 ] *= y;
    dest[7 ] *= y;
    dest[8 ] *= z;
    dest[9 ] *= z;
    dest[10] *= z;
    dest[11] *= z;

    return dest;
  },

  // Method based on PreGL https:// github.com/deanm/pregl/ (c) Dean McNamee.
  invert(dest) {
    var m = Mat4.clone(dest);
    return  Mat4.$invert(m);
  },

  $invert(dest) {
    var x0 = dest[0],  x1 = dest[1],  x2 = dest[2],  x3 = dest[3],
        x4 = dest[4],  x5 = dest[5],  x6 = dest[6],  x7 = dest[7],
        x8 = dest[8],  x9 = dest[9], x10 = dest[10], x11 = dest[11],
        x12 = dest[12], x13 = dest[13], x14 = dest[14], x15 = dest[15];

    var a0 = x0 * x5 - x1 * x4,
        a1 = x0 * x6 - x2 * x4,
        a2 = x0 * x7 - x3 * x4,
        a3 = x1 * x6 - x2 * x5,
        a4 = x1 * x7 - x3 * x5,
        a5 = x2 * x7 - x3 * x6,
        b0 = x8 * x13 - x9 * x12,
        b1 = x8 * x14 - x10 * x12,
        b2 = x8 * x15 - x11 * x12,
        b3 = x9 * x14 - x10 * x13,
        b4 = x9 * x15 - x11 * x13,
        b5 = x10 * x15 - x11 * x14;

    var invdet = 1 /
      (a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0);

    dest[0 ] = (+ x5 * b5 - x6 * b4 + x7 * b3) * invdet;
    dest[1 ] = (- x1 * b5 + x2 * b4 - x3 * b3) * invdet;
    dest[2 ] = (+ x13 * a5 - x14 * a4 + x15 * a3) * invdet;
    dest[3 ] = (- x9 * a5 + x10 * a4 - x11 * a3) * invdet;
    dest[4 ] = (- x4 * b5 + x6 * b2 - x7 * b1) * invdet;
    dest[5 ] = (+ x0 * b5 - x2 * b2 + x3 * b1) * invdet;
    dest[6 ] = (- x12 * a5 + x14 * a2 - x15 * a1) * invdet;
    dest[7 ] = (+ x8 * a5 - x10 * a2 + x11 * a1) * invdet;
    dest[8 ] = (+ x4 * b4 - x5 * b2 + x7 * b0) * invdet;
    dest[9 ] = (- x0 * b4 + x1 * b2 - x3 * b0) * invdet;
    dest[10] = (+ x12 * a4 - x13 * a2 + x15 * a0) * invdet;
    dest[11] = (- x8 * a4 + x9 * a2 - x11 * a0) * invdet;
    dest[12] = (- x4 * b3 + x5 * b1 - x6 * b0) * invdet;
    dest[13] = (+ x0 * b3 - x1 * b1 + x2 * b0) * invdet;
    dest[14] = (- x12 * a3 + x13 * a1 - x14 * a0) * invdet;
    dest[15] = (+ x8 * a3 - x9 * a1 + x10 * a0) * invdet;

    return dest;

  },
  // TODO(nico) breaking convention here...
  // because I don't think it's useful to add
  // two methods for each of these.
  lookAt(dest, eye, center, up) {
    var z = Vec3.sub(eye, center);
    z.$unit();
    var x = Vec3.cross(up, z);
    x.$unit();
    var y = Vec3.cross(z, x);
    y.$unit();
    return Mat4.set(dest, x[0], x[1], x[2], -x.dot(eye),
                          y[0], y[1], y[2], -y.dot(eye),
                          z[0], z[1], z[2], -z.dot(eye),
                          0, 0, 0, 1);
  },

  frustum(dest, left, right, bottom, top, near, far) {
    var rl = right - left,
        tb = top - bottom,
        fn = far - near;

    dest[0] = (near * 2) / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = (near * 2) / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = (right + left) / rl;
    dest[9] = (top + bottom) / tb;
    dest[10] = -(far + near) / fn;
    dest[11] = -1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = -(far * near * 2) / fn;
    dest[15] = 0;

    return dest;
  },

  perspective(dest, fov, aspect, near, far) {
    var ymax = near * tan(fov * pi / 360),
        ymin = -ymax,
        xmin = ymin * aspect,
        xmax = ymax * aspect;

    return Mat4.frustum(dest, xmin, xmax, ymin, ymax, near, far);
  },

  ortho(dest, left, right, top, bottom, near, far) {
    var te = this.elements,
        w = right - left,
        h = top - bottom,
        p = far - near,
        x = (right + left) / w,
        y = (top + bottom) / h,
        z = (far + near) / p;

    dest[0] = 2 / w;	dest[4] = 0;	dest[8] = 0;	dest[12] = -x;
    dest[1] = 0;	dest[5] = 2 / h;	dest[9] = 0;	dest[13] = -y;
    dest[2] = 0;	dest[6] = 0;	dest[10] = -2 / p;	dest[14] = -z;
    dest[3] = 0;	dest[7] = 0;	dest[11] = 0;	dest[15] = 1;

    return dest;
	},

  toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) {
      return dest;
    }

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];
    ans[3] = dest[3];
    ans[4] = dest[4];
    ans[5] = dest[5];
    ans[6] = dest[6];
    ans[7] = dest[7];
    ans[8] = dest[8];
    ans[9] = dest[9];
    ans[10] = dest[10];
    ans[11] = dest[11];
    ans[12] = dest[12];
    ans[13] = dest[13];
    ans[14] = dest[14];
    ans[15] = dest[15];

    return ans;
  }

};

// add generics and instance methods
proto = Mat4.prototype;
for (method in generics) {
  Mat4[method] = generics[method];
  proto[method] = (function (m) {
    return function() {
      var args = slice.call(arguments);

      args.unshift(this);
      return Mat4[m].apply(Mat4, args);
    };
 })(method);
}

// Quaternion class
export class Quat extends Array {
  constructor(x, y, z, w) {
    super(4);
    this[0] = x || 0;
    this[1] = y || 0;
    this[2] = z || 0;
    this[3] = w || 0;

    this.typedContainer = new Float32Array(4);
  }

  static create() {
    return new Array(4);
  }

  static fromVec3(v, r) {
    return new Quat(v[0], v[1], v[2], r || 0);
  }

  static fromMat4(m) {
    var u;
    var v;
    var w;

    // Choose u, v, and w such that u is the index of the biggest diagonal entry
    // of m, and u v w is an even permutation of 0 1 and 2.
    if (m[0] > m[5] && m[0] > m[10]) {
      u = 0;
      v = 1;
      w = 2;
    } else if (m[5] > m[0] && m[5] > m[10]) {
      u = 1;
      v = 2;
      w = 0;
    } else {
      u = 2;
      v = 0;
      w = 1;
    }

    var r = sqrt(1 + m[u * 5] - m[v * 5] - m[w * 5]);
    var q = new Quat;

    q[u] = 0.5 * r;
    q[v] = 0.5 * (m['n' + v + '' + u] + m['n' + u + '' + v]) / r;
    q[w] = 0.5 * (m['n' + u + '' + w] + m['n' + w + '' + u]) / r;
    q[3] = 0.5 * (m['n' + v + '' + w] - m['n' + w + '' + v]) / r;

    return q;
  }

  static fromXRotation(angle) {
    return new Quat(sin(angle / 2), 0, 0, cos(angle / 2));
  }

  static fromYRotation(angle) {
    return new Quat(0, sin(angle / 2), 0, cos(angle / 2));
  }

  static fromZRotation(angle) {
    return new Quat(0, 0, sin(angle / 2), cos(angle / 2));
  }

  static fromAxisRotation(vec, angle) {
    var x = vec[0],
        y = vec[1],
        z = vec[2],
        d = 1 / sqrt(x * x + y * y + z * z),
        s = sin(angle / 2),
        c = cos(angle / 2);

    return new Quat(s * x * d, s * y * d, s * z * d, c);
  }

}

generics = {

  setQuat(dest, q) {
    dest[0] = q[0];
    dest[1] = q[1];
    dest[2] = q[2];
    dest[3] = q[3];

    return dest;
  },

  set(dest, x, y, z, w) {
    dest[0] = x || 0;
    dest[1] = y || 0;
    dest[2] = z || 0;
    dest[3] = w || 0;

    return dest;
  },

  clone(dest) {
    if (dest instanceof Quat) {
      return new Quat(dest[0], dest[1], dest[2], dest[3]);
    }
    return Quat.setQuat(new typedArray(4), dest);
  },

  neg(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], -dest[3]);
  },

  $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    dest[3] = -dest[3];

    return dest;
  },

  add(dest, q) {
    return new Quat(dest[0] + q[0],
                    dest[1] + q[1],
                    dest[2] + q[2],
                    dest[3] + q[3]);
  },

  $add(dest, q) {
    dest[0] += q[0];
    dest[1] += q[1];
    dest[2] += q[2];
    dest[3] += q[3];

    return dest;
  },

  sub(dest, q) {
    return new Quat(dest[0] - q[0],
                    dest[1] - q[1],
                    dest[2] - q[2],
                    dest[3] - q[3]);
  },

  $sub(dest, q) {
    dest[0] -= q[0];
    dest[1] -= q[1];
    dest[2] -= q[2];
    dest[3] -= q[3];

    return dest;
  },

  scale(dest, s) {
    return new Quat(dest[0] * s,
                    dest[1] * s,
                    dest[2] * s,
                    dest[3] * s);
  },

  $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    dest[3] *= s;

    return dest;
  },

  mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    return new Quat(aW * bX + aX * bW + aY * bZ - aZ * bY,
                    aW * bY + aY * bW + aZ * bX - aX * bZ,
                    aW * bZ + aZ * bW + aX * bY - aY * bX,
                    aW * bW - aX * bX - aY * bY - aZ * bZ);
  },

  $mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    dest[0] = aW * bX + aX * bW + aY * bZ - aZ * bY;
    dest[1] = aW * bY + aY * bW + aZ * bX - aX * bZ;
    dest[2] = aW * bZ + aZ * bW + aX * bY - aY * bX;
    dest[3] = aW * bW - aX * bX - aY * bY - aZ * bZ;

    return dest;
  },

  divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    return new Quat((aX * bW - aW * bX - aY * bZ + aZ * bY) * d,
                    (aX * bZ - aW * bY + aY * bW - aZ * bX) * d,
                    (aY * bX + aZ * bW - aW * bZ - aX * bY) * d,
                    (aW * bW + aX * bX + aY * bY + aZ * bZ) * d);
  },

  $divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    dest[0] = (aX * bW - aW * bX - aY * bZ + aZ * bY) * d;
    dest[1] = (aX * bZ - aW * bY + aY * bW - aZ * bX) * d;
    dest[2] = (aY * bX + aZ * bW - aW * bZ - aX * bY) * d;
    dest[3] = (aW * bW + aX * bX + aY * bY + aZ * bZ) * d;

    return dest;
  },

  invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    return new Quat(-q0 * d, -q1 * d, -q2 * d, q3 * d);
  },

  $invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    dest[0] = -q0 * d;
    dest[1] = -q1 * d;
    dest[2] = -q2 * d;
    dest[3] = q3 * d;

    return dest;
  },

  norm(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return sqrt(a * a + b * b + c * c + d * d);
  },

  normSq(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return a * a + b * b + c * c + d * d;
  },

  unit(dest) {
    return Quat.scale(dest, 1 / Quat.norm(dest));
  },

  $unit(dest) {
    return Quat.$scale(dest, 1 / Quat.norm(dest));
  },

  conjugate(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], dest[3]);
  },

  $conjugate(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  }
};

// add generics and instance methods

proto = Quat.prototype;

for (method in generics) {
  Quat[method] = generics[method];
  proto[method] = (function (m) {
    return function() {
      var args = slice.call(arguments);

      args.unshift(this);
      return Quat[m].apply(Quat, args);
    };
 })(method);
}

// Add static methods
Vec3.fromQuat = function(q) {
  return new Vec3(q[0], q[1], q[2]);
};

Mat4.fromQuat = function(q) {
  var a = q[3],
      b = q[0],
      c = q[1],
      d = q[2];

  return new Mat4(
    a * a + b * b - c * c - d * d,
    2 * b * c - 2 * a * d,
    2 * b * d + 2 * a * c,
    0,

    2 * b * c + 2 * a * d,
    a * a - b * b + c * c - d * d,
    2 * c * d - 2 * a * b,
    0,

    2 * b * d - 2 * a * c,
    2 * c * d + 2 * a * b,
    a * a - b * b - c * c + d * d,
    0,

    0, 0, 0, 1);
};
