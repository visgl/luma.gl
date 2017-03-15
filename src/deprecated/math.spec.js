/* eslint-disable max-statements */
import {Vec3, Mat4, Quat} from './math';
import test from 'tape-catch';

const abs = Math.abs;
const delta = 0.001;

test('Math#types', t => {
  t.equals(typeof Vec3, 'function');
  t.equals(typeof Mat4, 'function');
  t.equals(typeof Quat, 'function');
  t.end();
});

test('Vec3#members and methods', t => {
  const v = new Vec3();
  t.equals(v.x, 0);
  t.equals(v.y, 0);
  t.equals(v.z, 0);
  t.equals(typeof v.add, 'function');
  t.equals(typeof v.add2, 'function');
  t.equals(typeof v.clone, 'function');
  t.equals(typeof v.cross, 'function');
  t.equals(typeof v.distTo, 'function');
  t.equals(typeof v.distToSq, 'function');
  t.equals(typeof v.dot, 'function');
  t.equals(typeof v.neg, 'function');
  t.equals(typeof v.norm, 'function');
  t.equals(typeof v.normSq, 'function');
  t.equals(typeof v.scale, 'function');
  t.equals(typeof v.setVec3, 'function');
  t.equals(typeof v.sub, 'function');
  t.equals(typeof v.sub2, 'function');
  t.equals(typeof v.unit, 'function');
  t.end();
});

test('Mat4#getters and setters', t => {
  const m = new Mat4();
  t.equals(m.n11, 1);
  t.equals(m.n12, 0);
  t.equals(m.n13, 0);
  t.equals(m.n14, 0);
  t.equals(m.n21, 0);
  t.equals(m.n22, 1);
  t.equals(m.n23, 0);
  t.equals(m.n24, 0);
  t.equals(m.n31, 0);
  t.equals(m.n32, 0);
  t.equals(m.n33, 1);
  t.equals(m.n34, 0);
  t.equals(m.n41, 0);
  t.equals(m.n42, 0);
  t.equals(m.n43, 0);
  t.equals(m.n44, 1);
  t.end();
});

test('Mat4#id (identity matrix)', t => {
  t.equals(typeof Mat4.id, 'function');
  const m = new Mat4();
  m.id();
  t.equals(m[0], 1);
  t.equals(m[1], 0);
  t.equals(m[2], 0);
  t.equals(m[3], 0);
  t.equals(m[4], 0);
  t.equals(m[5], 1);
  t.equals(m[6], 0);
  t.equals(m[7], 0);
  t.equals(m[8], 0);
  t.equals(m[9], 0);
  t.equals(m[10], 1);
  t.equals(m[11], 0);
  t.equals(m[12], 0);
  t.equals(m[13], 0);
  t.equals(m[14], 0);
  t.equals(m[15], 1);
  t.end();
});

test('Mat4#set', t => {
  t.equals(typeof Mat4.set, 'function');
  const m = new Mat4();
  m.id();
  m.set(1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16);
  t.equals(m[0], 1);
  t.equals(m[1], 5);
  t.equals(m[2], 9);
  t.equals(m[3], 13);
  t.equals(m[4], 2);
  t.equals(m[5], 6);
  t.equals(m[6], 10);
  t.equals(m[7], 14);
  t.equals(m[8], 3);
  t.equals(m[9], 7);
  t.equals(m[10], 11);
  t.equals(m[11], 15);
  t.equals(m[12], 4);
  t.equals(m[13], 8);
  t.equals(m[14], 12);
  t.equals(m[15], 16);
  t.end();
});

test('Mat4.add', t => {
  t.equals(typeof Mat4.add, 'function');
  let m = new Mat4();
  m.id();
  m = m.add(m);
  t.equals(m[0], 2);
  t.equals(m[1], 0);
  t.equals(m[2], 0);
  t.equals(m[3], 0);
  t.equals(m[4], 0);
  t.equals(m[5], 2);
  t.equals(m[6], 0);
  t.equals(m[7], 0);
  t.equals(m[8], 0);
  t.equals(m[9], 0);
  t.equals(m[10], 2);
  t.equals(m[11], 0);
  t.equals(m[12], 0);
  t.equals(m[13], 0);
  t.equals(m[14], 0);
  t.equals(m[15], 2);
  t.end();
});

test('Mat4.transpose', t => {
  t.equals(typeof Mat4.transpose, 'function');
  const m = new Mat4();
  m.id();
  m.set(1, 5, 9, 13,
        2, 6, 10, 14,
        3, 7, 11, 15,
        4, 8, 12, 16);

  const ans = m.transpose();

  t.ok(abs(ans.n11 - 1) < delta);
  t.ok(abs(ans.n12 - 2) < delta);
  t.ok(abs(ans.n13 - 3) < delta);
  t.ok(abs(ans.n14 - 4) < delta);
  t.ok(abs(ans.n21 - 5) < delta);
  t.ok(abs(ans.n22 - 6) < delta);
  t.ok(abs(ans.n23 - 7) < delta);
  t.ok(abs(ans.n24 - 8) < delta);
  t.ok(abs(ans.n31 - 9) < delta);
  t.ok(abs(ans.n32 - 10) < delta);
  t.ok(abs(ans.n33 - 11) < delta);
  t.ok(abs(ans.n34 - 12) < delta);
  t.ok(abs(ans.n41 - 13) < delta);
  t.ok(abs(ans.n42 - 14) < delta);
  t.ok(abs(ans.n43 - 15) < delta);
  t.ok(abs(ans.n44 - 16) < delta);
  t.end();
});

test('Mat4.mulMat42', t => {
  t.equals(typeof Mat4.mulMat42, 'function');
  const m1 = new Mat4();
  m1.set(1, 2, 3, 4,
         5, 6, 7, 8,
         9, 10, 11, 12,
         13, 14, 15, 16);

  const m2 = new Mat4();
  m2.set(1, 2, 3, 4,
         5, 6, 7, 8,
         9, 10, 11, 12,
         13, 14, 15, 16).$transpose();

  const ans = new Mat4();
  ans.mulMat42(m1, m2);
  t.ok(abs(ans.n11 - 30) < delta);
  t.ok(abs(ans.n12 - 70) < delta);
  t.ok(abs(ans.n13 - 110) < delta);
  t.ok(abs(ans.n14 - 150) < delta);
  t.ok(abs(ans.n21 - 70) < delta);
  t.ok(abs(ans.n22 - 174) < delta);
  t.ok(abs(ans.n23 - 278) < delta);
  t.ok(abs(ans.n24 - 382) < delta);
  t.ok(abs(ans.n31 - 110) < delta);
  t.ok(abs(ans.n32 - 278) < delta);
  t.ok(abs(ans.n33 - 446) < delta);
  t.ok(abs(ans.n34 - 614) < delta);
  t.ok(abs(ans.n41 - 150) < delta);
  t.ok(abs(ans.n42 - 382) < delta);
  t.ok(abs(ans.n43 - 614) < delta);
  t.ok(abs(ans.n44 - 846) < delta);
  t.end();
});

test('Mat4.rotateAxis', t => {
  t.equals(typeof Mat4.rotateAxis, 'function');
  const v = [1, 2, 3];
  const len = Math.sqrt(1 * 1 + 2 * 2 + 3 * 3);
  const theta = Math.PI / 4;
  const m = new Mat4();

  v[0] /= len;
  v[1] /= len;
  v[2] /= len;

  const ans = m.rotateAxis(theta, v);
  t.ok(abs(ans.n11 - 0.7280277013778687) < delta);
  t.ok(abs(ans.n12 - -0.525104820728302) < delta);
  t.ok(abs(ans.n13 - 0.4407272934913635) < delta);
  t.ok(abs(ans.n14 - 0) < delta);
  t.ok(abs(ans.n21 - 0.6087885979157627) < delta);
  t.ok(abs(ans.n22 - 0.7907905578613281) < delta);
  t.ok(abs(ans.n23 - -0.06345657259225845) < delta);
  t.ok(abs(ans.n24 - 0) < delta);
  t.ok(abs(ans.n31 - -0.3152016404063445) < delta);
  t.ok(abs(ans.n32 - 0.3145079017103789) < delta);
  t.ok(abs(ans.n33 - 0.8953952789306641) < delta);
  t.ok(abs(ans.n34 - 0) < delta);
  t.ok(abs(ans.n41 - 0) < delta);
  t.ok(abs(ans.n42 - 0) < delta);
  t.ok(abs(ans.n43 - 0) < delta);
  t.ok(abs(ans.n44 - 1) < delta);
  t.end();
});

test('Mat4.rotateXYZ', t => {
  t.equals(typeof Mat4.rotateXYZ, 'function');
  const m = new Mat4();
  m.id();
  const ans = m.rotateXYZ(1, 2, 3);
  t.ok(abs(ans.n11 - 0.411982245665683) < delta);
  t.ok(abs(ans.n12 - -0.8337376517741568) < delta);
  t.ok(abs(ans.n13 - -0.36763046292489926) < delta);
  t.ok(abs(ans.n14 - 0) < delta);
  t.ok(abs(ans.n21 - -0.05872664492762098) < delta);
  t.ok(abs(ans.n22 - -0.42691762127620736) < delta);
  t.ok(abs(ans.n23 - 0.9023815854833308) < delta);
  t.ok(abs(ans.n24 - 0) < delta);
  t.ok(abs(ans.n31 - -0.9092974268256817) < delta);
  t.ok(abs(ans.n32 - -0.35017548837401463) < delta);
  t.ok(abs(ans.n33 - -0.2248450953661529) < delta);
  t.ok(abs(ans.n34 - 0) < delta);
  t.ok(abs(ans.n41 - 0) < delta);
  t.ok(abs(ans.n42 - 0) < delta);
  t.ok(abs(ans.n43 - 0) < delta);
  t.ok(abs(ans.n44 - 1) < delta);
  t.end();
});

test('Mat4.scale', t => {
  t.equals(typeof Mat4.scale, 'function');
  const m = new Mat4();
  m.id();
  const ans = m.scale(1, 2, 3);

  t.equals(ans[0], 1);
  t.equals(ans[1], 0);
  t.equals(ans[2], 0);
  t.equals(ans[3], 0);
  t.equals(ans[4], 0);
  t.equals(ans[5], 2);
  t.equals(ans[6], 0);
  t.equals(ans[7], 0);
  t.equals(ans[8], 0);
  t.equals(ans[9], 0);
  t.equals(ans[10], 3);
  t.equals(ans[11], 0);
  t.equals(ans[12], 0);
  t.equals(ans[13], 0);
  t.equals(ans[14], 0);
  t.equals(ans[15], 1);
  t.end();
});

test('Mat4.translate', t => {
  t.equals(typeof Mat4.translate, 'function');
  const m = new Mat4();
  m.id();
  const ans = m.translate(1, 2, 3);
  t.ok(abs(ans.n11 - 1) < delta);
  t.ok(abs(ans.n12 - 0) < delta);
  t.ok(abs(ans.n13 - 0) < delta);
  t.ok(abs(ans.n14 - 1) < delta);
  t.ok(abs(ans.n21 - 0) < delta);
  t.ok(abs(ans.n22 - 1) < delta);
  t.ok(abs(ans.n23 - 0) < delta);
  t.ok(abs(ans.n24 - 2) < delta);
  t.ok(abs(ans.n31 - 0) < delta);
  t.ok(abs(ans.n32 - 0) < delta);
  t.ok(abs(ans.n33 - 1) < delta);
  t.ok(abs(ans.n34 - 3) < delta);
  t.ok(abs(ans.n41 - 0) < delta);
  t.ok(abs(ans.n42 - 0) < delta);
  t.ok(abs(ans.n43 - 0) < delta);
  t.ok(abs(ans.n44 - 1) < delta);
  t.end();
});

test('Mat4.frustum', t => {
  t.equals(typeof Mat4.frustum, 'function');
  const m = new Mat4();
  m.id();
  const ans = m.frustum(-1, 1, -1, 1, 0.1, 100);
  t.ok(abs(ans.n11 - 0.1) < delta);
  t.ok(abs(ans.n12 - 0) < delta);
  t.ok(abs(ans.n13 - 0) < delta);
  t.ok(abs(ans.n14 - 0) < delta);
  t.ok(abs(ans.n21 - 0) < delta);
  t.ok(abs(ans.n22 - 0.1) < delta);
  t.ok(abs(ans.n23 - 0) < delta);
  t.ok(abs(ans.n24 - 0) < delta);
  t.ok(abs(ans.n31 - 0) < delta);
  t.ok(abs(ans.n32 - 0) < delta);
  t.ok(abs(ans.n33 - -1.002002002002002) < delta);
  t.ok(abs(ans.n34 - -0.20020020020020018) < delta);
  t.ok(abs(ans.n41 - 0) < delta);
  t.ok(abs(ans.n42 - 0) < delta);
  t.ok(abs(ans.n43 - -1) < delta);
  t.ok(abs(ans.n44 - 0) < delta);
  t.end();
});

test('Mat4.invert', t => {
  t.equals(typeof Mat4.invert, 'function');
  const m = new Mat4();
  m.id();
  const ans = m.frustum(-1, 1, -1, 1, 0.1, 100).invert();
  t.ok(abs(ans.n11 - 9.99999999) < delta);
  t.ok(abs(ans.n12 - 0) < delta);
  t.ok(abs(ans.n13 - 0) < delta);
  t.ok(abs(ans.n14 - 0) < delta);
  t.ok(abs(ans.n21 - 0) < delta);
  t.ok(abs(ans.n22 - 9.99999999) < delta);
  t.ok(abs(ans.n23 - 0) < delta);
  t.ok(abs(ans.n24 - 0) < delta);
  t.ok(abs(ans.n31 - 0) < delta);
  t.ok(abs(ans.n32 - 0) < delta);
  t.ok(abs(ans.n33 - 0) < delta);
  t.ok(abs(ans.n34 - -1) < delta);
  t.ok(abs(ans.n41 - 0) < delta);
  t.ok(abs(ans.n42 - 0) < delta);
  t.ok(abs(ans.n43 - -4.995) < delta);
  t.ok(abs(ans.n44 - 5.005) < delta);
  t.end();
});

test('Mat4.lookAt', t => {
  t.equals(typeof Mat4.lookAt, 'function');
  t.end();
});

test('Mat4.mulVec3', t => {
  t.equals(typeof Mat4.mulVec3, 'function');
  const v = new Vec3(1, 1, 1);
  const m = new Mat4();
  const ans = m.mulVec3(v);

  t.equals(ans[0], 1);
  t.equals(ans[1], 1);
  t.equals(ans[2], 1);
  t.end();
});

test('Mat4.$mulVec3', t => {
  t.equals(typeof Mat4.$mulVec3, 'function');
  const v = new Vec3(1, 1, 1);
  const m = new Mat4();

  m.$mulVec3(v);

  t.equals(v[0], 1);
  t.equals(v[1], 1);
  t.equals(v[2], 1);
  t.end();
});

test('Mat4.perspective', t => {
  t.equals(typeof Mat4.perspective, 'function');
  t.end();
});

test('Mat4.toFloat32Array', t => {
  t.equals(typeof Mat4.toFloat32Array, 'function');
  const m = new Mat4();
  m.id();
  t.equals(m.toFloat32Array().BYTES_PER_ELEMENT, 4);
  t.end();
});

test('Quat#methods', t => {
  const q = new Quat();
  t.equals(q[0], 0);
  t.equals(q[1], 0);
  t.equals(q[2], 0);
  t.equals(q[3], 0);
  // t.equals(typeof q.add, 'function');
  // t.equals(typeof q.clone, 'function');
  // t.equals(typeof q.conjugate, 'function');
  // t.equals(typeof q.divQuat, 'function');
  // t.equals(typeof q.invert, 'function');
  // t.equals(typeof q.mulQuat, 'function');
  // t.equals(typeof q.neg, 'function');
  // t.equals(typeof q.norm, 'function');
  // t.equals(typeof q.normSq, 'function');
  // t.equals(typeof q.scale, 'function');
  // t.equals(typeof q.set, 'function');
  // t.equals(typeof q.setQuat, 'function');
  // t.equals(typeof q.sub, 'function');
  // t.equals(typeof q.unit, 'function');
  t.end();
});

test('Quat.fromAxisRotation', t => {
  let q = Quat.fromAxisRotation(new Vec3(0, 0, 1), Math.PI);
  t.equals(q[0], 0);
  t.equals(q[1], 0);
  t.equals(q[2], 1);
  t.equals(q[3], Math.cos(Math.PI / 2));

  q = Quat.fromAxisRotation(new Vec3(0, 1, 0), Math.PI);
  t.equals(q[0], 0);
  t.equals(q[1], 1);
  t.equals(q[2], 0);
  t.equals(q[3], Math.cos(Math.PI / 2));

  q = Quat.fromAxisRotation(new Vec3(1, 0, 0), Math.PI);
  t.equals(q[0], 1);
  t.equals(q[1], 0);
  t.equals(q[2], 0);
  t.equals(q[3], Math.cos(Math.PI / 2));

  // const q1 = Quat.fromAxisRotation(new Vec3(5, 0, -2), Math.PI / 3);
  // const q2 = Quat.fromAxisRotation(new Vec3(1, 3, 0), Math.PI / 4);
  // q1.$mulQuat(q2);
  // t.equals(q1[0], 0.6011183144537015);
  // t.equals(q1[1], 0.29193457751898655);
  // t.equals(q1[2], -0.0030205353559888126);
  // t.equals(q1[3], 0.7439232829017486);
  t.end();
});
