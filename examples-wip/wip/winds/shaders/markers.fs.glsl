#ifdef GL_ES
precision highp float;
#endif

#define PI 3.1415926535
#define EPSILON .001

varying vec2 vTexCoord;
varying vec3 vColor;
varying float vAngle;
varying float vRadius;

uniform bool picking;
uniform vec3 pickColor;
uniform bool selected;
uniform int markerType;

float distanceToLine(vec2 p1, vec2 p2) {
  return abs(p1.x * p2.y - p1.y * p2.x);
}

void main(void) {
  vec2 center   = vec2(.5, .5);
  vec2 coord    = vTexCoord - center;
  vec2 bound    = vec2(cos (vAngle), sin (vAngle));

  float dist = length(coord);
  
  if (markerType == 0) {
    if (dist <= .5) {
      if (picking) {
        gl_FragColor = vec4(pickColor, 1);
        return;
      }
      if (vAngle != -1. && 
        cos(vAngle - atan(coord.y, coord.x)) > 0. && 
        distanceToLine(bound, coord) < EPSILON / vRadius) {

        gl_FragColor = vec4(1. - vColor, .5);
      } else {
        if (dist > 0.) {
          if (selected) {
            gl_FragColor = vec4(1., 1., 1., dist * dist + .7);
          } else {
            gl_FragColor = vec4(vColor, dist * dist + .2);
          }
        } else {
          gl_FragColor = vec4(0);
        }
      }
    } else {
      gl_FragColor = vec4(0, 0, 0, 0);
    }

  } else if (markerType == 1) {
    if (dist <= .5) {
      if (picking) {
        gl_FragColor = vec4(pickColor, 1);
        return;
      }
      if (vAngle != -1. && 
        cos(vAngle - atan(coord.y, coord.x)) > 0. && 
        distanceToLine(bound, coord) < EPSILON / vRadius) {

        gl_FragColor = vec4(1. - vColor, .5);
      } else {
        if (dist > 0.4) {
          if (selected) {
            gl_FragColor = vec4(1., 1., 1., dist * dist + .7);
          } else {
            gl_FragColor = vec4(vColor, dist * dist + .2);
          }
        } else {
          gl_FragColor = vec4(0);
        }
      }
    } else {
      gl_FragColor = vec4(0, 0, 0, 0);
    }

  } else {
    if (dist <= .5) {
      if (picking) {
        gl_FragColor = vec4(pickColor, 1);
        return;
      }
      if (vAngle != -1. && 
        cos(vAngle - atan(coord.y, coord.x)) > 0. && 
        distanceToLine(bound, coord) < EPSILON / vRadius) {

        gl_FragColor = vec4(1. - dist, 0, dist, 1);
      } else {
        gl_FragColor = vec4(0);
      }
    } else {
      gl_FragColor = vec4(0, 0, 0, 0);
    }

  }


}

