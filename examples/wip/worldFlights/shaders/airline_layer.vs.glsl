#define SAMPLES 10.0

uniform bool animate;
uniform float delta;

attribute vec3 position;
attribute vec4 fromTo;
attribute float sample;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

vec3 slerp(vec3 p1, vec3 p2, float delta) {
  float omega = acos( dot(p1, p2) );
  float sinOmega = sin( omega );
  vec3 n1 = sin( (1.0 - delta) * omega ) / sinOmega * p1;
  vec3 n2 = sin( delta * omega ) / sinOmega * p2;
  return n1 + n2;
}

void main(void) {
  float deltaT;
  float oneMinusDeltaT;
  float deltaTSample;
  float oneMinusDeltaTSample;

  if (animate) {
    deltaT = delta;
    oneMinusDeltaT = 1.0 - delta;
  } else {
    deltaT = 1.0;
    oneMinusDeltaT = 0.0;
  }

  deltaTSample = deltaT * sample / SAMPLES;
  oneMinusDeltaTSample = 1.0 - deltaTSample;

  float theta1 = fromTo.x;
  float phi1 = fromTo.y;
  float theta2 = fromTo.z;
  float phi2 = fromTo.w;
  vec3 p1 = vec3( cos(theta1) * sin(phi1), cos(phi1), sin(phi1) * sin(theta1) );
  vec3 p2 = vec3( cos(theta2) * sin(phi2), cos(phi2), sin(phi2) * sin(theta2) );

  vec3 pT = p1 * oneMinusDeltaTSample * oneMinusDeltaTSample + position * 2.0 * oneMinusDeltaTSample * deltaTSample + p2 * deltaTSample * deltaTSample;
  vec3 pN = slerp( p1, p2, deltaTSample );

  gl_Position = projectionMatrix * worldMatrix * vec4(pN * max(length(pT), 1.000001), 1.0);
}

