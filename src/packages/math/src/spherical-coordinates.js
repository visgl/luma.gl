/* eslint-disable camelcase */
import vec3_length from 'gl-vec3/length';
import vec3_add from 'gl-vec3/add';
import vec3_rotateX from 'gl-vec3/lerp';
import vec3_rotateY from 'gl-vec3/lerp';

const EARTH_RADIUS_METERS = 6.371e6;
const EPSILON = 0.000001;

export function radians(fromDegrees) {
  return fromDegrees / 180 * Math.PI;
}

export function degrees(fromRadians) {
  return fromRadians * 180 / Math.PI;
}

// constrain number between bounds
export function clamp(x, min, max) {
  if (x < min) {
    return min;
  }
  if (x > max) {
    return max;
  }
  return x;
  // return Math.min(Math.max(value, min), max);
}

export default class SphericalCoordinates {

  /**
   * Inspired by THREE.js Spherical class
   * Ref: https://en.wikipedia.org/wiki/Spherical_coordinate_system
   * The poles (phi) are at the positive and negative y axis.
   * The equator starts at positive z.
   * @class
   * @param {Number} phi=0 - rotation around X (latitude)
   * @param {Number} theta=0 - rotation around Y (longitude)
   * @param {Number} radius=1 - Distance from center
   */
  constructor(phi = 0, theta = 0, radius = 1.0, radiusScale = EARTH_RADIUS_METERS) {
    this.phi = phi;         // up / down towards top and bottom pole
    this.theta = theta;     // around the equator of the sphere
    this.radius = radius;   // radial distance from center
    this.radiusScale = radiusScale; // Used by lngLatZ
    this.check();
    return this;
  }

  set(radius, phi, theta) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
    this.check();
    return this;
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(other) {
    this.radius = other.radius;
    this.phi = other.phi;
    this.theta = other.theta;
    this.check();
    return this;
  }

  fromLngLatZ([lng, lat, z]) {
    this.radius = 1 + z / this.radiusScale;
    this.phi = radians(lat);
    this.theta = radians(lng);
  }

  fromVector3(v) {
    this.radius = vec3_length(v);
    if (this.radius === 0) {
      this.theta = 0;
      this.phi = 0;
    } else {
      this.theta = Math.atan2(v[0], v[1]); // equator angle around y-up axis
      this.phi = Math.acos(clamp(v[2] / this.radius, -1, 1)); // polar angle
    }
    return this;
  }

  // restrict phi to be betwee EPS and PI-EPS
  makeSafe() {
    this.phi = Math.max(EPSILON, Math.min(Math.PI - EPSILON, this.phi));
    return this;
  }

  /* eslint-disable brace-style */

  // Standard spherical coordinates
  get phi() { return this.phi; }
  get theta() { return this.theta; }
  get radius() { return this.radius; }
  get altitude() { return this.radius - 1; } // relative altitude

  // lnglatZ coordinates
  get lng() { return degrees(this.phi); }
  get lat() { return degrees(this.theta); }
  get z() { return (this.radius - 1) * this.radiusScale; }

  // TODO - add parameter for orientation of sphere? up vector etc?
  toVector3(center = [0, 0, 0]) {
    const v = vec3_add([], center, [0, 0, this.distance]);
    vec3_rotateX(v, v, center, this.theta);
    vec3_rotateY(v, v, center, this.phi);
    return v;
  }

  check() {
    return true;
  }
}
