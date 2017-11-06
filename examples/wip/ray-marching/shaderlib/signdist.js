// A module that injects fragment shader uniforms provided by shadertoy
// allowing shadertoy shaders to run directly in luma.gl

const DEFAULT_MODULE_OPTIONS = {
};

function getUniforms(opts = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};
  return uniforms;
}

// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// A list of useful distance function to simple primitives, and an example on how to
// do some interesting boolean operations, repetition and displacement.
// More info here: http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

const fs = `\
#define AA 1   // make this 1 if your machine is too slow

//------------------------------------------------------------------
// Internal helper functions

float signdist_length2(vec2 p)
{
  return sqrt(p.x * p.x + p.y * p.y);
}

float signdist_length6(vec2 p)
{
  p = p*p*p;
  p = p*p;
  return pow(p.x + p.y, 1.0 / 6.0);
}

float signdist_length8(vec2 p)
{
  p = p*p;
  p = p*p;
  p = p*p;
  return pow(p.x + p.y, 1.0 / 8.0);
}

//------------------------------------------------------------------
// Primitives

float signdist_Plane( vec3 p )
{
  return p.y;
}

float signdist_Sphere( vec3 p, float s )
{
  return length(p) - s;
}

float signdist_Box( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float signdist_Ellipsoid( in vec3 p, in vec3 r )
{
  return (length( p/r ) - 1.0) * min(min(r.x, r.y), r.z);
}

float signdist_uRoundBox( vec3 p, vec3 b, float r )
{
  return length(max(abs(p) - b, 0.0)) - r;
}

float signdist_Torus( vec3 p, vec2 t )
{
  return length( vec2(length(p.xz) - t.x, p.y) ) - t.y;
}

float signdist_HexPrism( vec3 p, vec2 h )
{
  vec3 q = abs(p);
#if 0
  return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
#else
  float d1 = q.z-h.y;
  float d2 = max((q.x*0.866025+q.y*0.5),q.y)-h.x;
  return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
#endif
}

float signdist_Capsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p-a;
  vec3 ba = b-a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}

float signdist_EquilateralTriangle(  in vec2 p )
{
  const float k = sqrt(3.0);
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0/k;
  if( p.x + k*p.y > 0.0 ) p = vec2( p.x - k*p.y, -k*p.x - p.y )/2.0;
  p.x += 2.0 - 2.0*clamp( (p.x+2.0)/2.0, 0.0, 1.0 );
  return -length(p)*sign(p.y);
}

float signdist_TriPrism( vec3 p, vec2 h )
{
  vec3 q = abs(p);
  float d1 = q.z-h.y;
#if 1
  // distance bound
  float d2 = max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5;
#else
  // correct distance
  h.x *= 0.866025;
  float d2 = signdist_EquilateralTriangle(p.xy/h.x)*h.x;
#endif
  return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float signdist_Cylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float signdist_Cone( in vec3 p, in vec3 c )
{
  vec2 q = vec2( length(p.xz), p.y );
  float d1 = -q.y-c.z;
  float d2 = max( dot(q,c.xy), q.y);
  return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

float signdist_ConeSection( in vec3 p, in float h, in float r1, in float r2 )
{
  float d1 = -p.y - h;
  float q = p.y - h;
  float si = 0.5*(r1-r2)/h;
  float d2 = max( sqrt( dot(p.xz,p.xz)*(1.0-si*si)) + q*si - r2, q );
  return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

// h = { cos a, sin a, height }
float signdist_Pyramid4(vec3 p, vec3 h )
{
  // Tetrahedron = Octahedron - Cube
  float box = signdist_Box( p - vec3(0, -2.0 * h.z, 0), vec3(2.0 * h.z) );

  float d = 0.0;
  d = max( d, abs( dot(p, vec3( -h.x, h.y, 0 )) ));
  d = max( d, abs( dot(p, vec3(  h.x, h.y, 0 )) ));
  d = max( d, abs( dot(p, vec3(  0, h.y, h.x )) ));
  d = max( d, abs( dot(p, vec3(  0, h.y,-h.x )) ));
  float octa = d - h.z;
  return max(-box, octa); // Subtraction
}

float signdist_Torus82( vec3 p, vec2 t )
{
  vec2 q = vec2(signdist_length2(p.xz) - t.x, p.y);
  return signdist_length8(q) - t.y;
}

float signdist_Torus88( vec3 p, vec2 t )
{
  vec2 q = vec2(signdist_length8(p.xz) - t.x, p.y);
  return signdist_length8(q) - t.y;
}

float signdist_Cylinder6( vec3 p, vec2 h )
{
  return max( signdist_length6(p.xz) - h.x, abs(p.y) - h.y );
}

//------------------------------------------------------------------
// Operations: Composing primitives

float signdist_subtract( float d1, float d2 )
{
  return max(-d2, d1);
}

vec2 signdist_union( vec2 d1, vec2 d2 )
{
  return (d1.x<d2.x) ? d1 : d2;
}

vec3 signdist_repeat( vec3 p, vec3 c )
{
  return mod(p,c)-0.5*c;
}

vec3 signdist_twist( vec3 p )
{
  float c = cos(10.0 * p.y + 10.0);
  float s = sin(10.0 * p.y + 10.0);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xz, p.y);
}
`;

export default {
  name: 'signdist',
  vs: null,
  fs,
  getUniforms
};
