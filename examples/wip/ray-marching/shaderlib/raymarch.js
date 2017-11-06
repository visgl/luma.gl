// A shadertools module that performs ray marching

// Based on the following work
// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import shadertoy from './shadertoy';

// TODO - stop relying on shadertoy uniforms
const DEFAULT_MODULE_OPTIONS = {};

function getUniforms(opts = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};
  return uniforms;
}

const fs = `\
#define AA 1   // make this 1 if your machine is too slow

//------------------------------------------------------------------

// NEEDS TO BE SUPPLIED BY APPLICATION
vec2 raymarch_scene( in vec3 pos );


//------------------------------------------------------------------
// Render utilities, scene independent

mat3 raymarch_setCamera( in vec3 rayOrigin, in vec3 ta, float cr )
{
  vec3 cw = normalize(ta - rayOrigin);
  vec3 cp = vec3(sin(cr), cos(cr), 0.0);
  vec3 cu = normalize( cross(cw,cp) );
  vec3 cv = normalize( cross(cu,cw) );
  return mat3( cu, cv, cw );
}

vec3 raymarch_filterGamma(vec3 color) {
  return pow( color, vec3(0.4545) );
}

vec3 raymarch_getMaterialColor(vec3 pos, float material) {
  vec3 color = 0.45 + 0.35 * sin(vec3(0.05, 0.08, 0.10) * (material - 1.0));
  if (material < 1.5) {
    float f = mod( floor(5.0 * pos.z) + floor(5.0 * pos.x), 2.0);
    color = 0.3 + 0.1 * f * vec3(1.0);
  }
  return color;
}

//------------------------------------------------------------------
// Render utilities, scene dependent: Normals and lighting

vec3 raymarch_calculateNormal(in vec3 pos)
{
#if 1
  vec2 e = vec2(1.0,-1.0) * 0.5773 * 0.0005;
  return normalize(
    e.xyy * raymarch_scene( pos + e.xyy ).x +
    e.yyx * raymarch_scene( pos + e.yyx ).x +
    e.yxy * raymarch_scene( pos + e.yxy ).x +
    e.xxx * raymarch_scene( pos + e.xxx ).x
  );
#else
  vec3 eps = vec3( 0.0005, 0.0, 0.0 );
  vec3 nor = vec3(
    raymarch_scene(pos+eps.xyy).x - raymarch_scene(pos-eps.xyy).x,
    raymarch_scene(pos+eps.yxy).x - raymarch_scene(pos-eps.yxy).x,
    raymarch_scene(pos+eps.yyx).x - raymarch_scene(pos-eps.yyx).x );
  return normalize(nor);
#endif
}

float raymarch_softshadow(in vec3 rayOrigin, in vec3 rayDirection, in float mint, in float tmax)
{
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 16; i++)
  {
    float h = raymarch_scene(rayOrigin + rayDirection * t ).x;
    res = min( res, 8.0*h/t );
    t += clamp( h, 0.02, 0.10 );
    if( h<0.001 || t>tmax ) {
      break;
    }
  }
  return clamp( res, 0.0, 1.0 );
}

float raymarch_ambientOcclusion(in vec3 pos, in vec3 normal)
{
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++)
  {
    float hr = 0.01 + 0.12 * float(i) / 4.0;
    vec3 aopos =  normal * hr + pos;
    float dd = raymarch_scene( aopos ).x;
    occ += -(dd - hr) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

vec3 raymarch_filterLightingColor(
  vec3 color, vec3 pos, vec3 rayDirection, vec3 normal, float occlusion
) {
  vec3 reflection = reflect( rayDirection, normal );

  vec3  light = normalize( vec3(-0.4, 0.7, -0.6) );
  float ambient = clamp( 0.5 + 0.5 * normal.y, 0.0, 1.0 );
  float diffuse = clamp( dot(normal, light), 0.0, 1.0 );
  float bac =
    clamp( dot( normal, normalize(vec3(-light.x, 0.0, -light.z))), 0.0, 1.0 ) *
    clamp( 1.0-pos.y, 0.0, 1.0);
  float dom = smoothstep( -0.1, 0.1, reflection.y );
  float fre = pow( clamp(1.0 + dot(normal, rayDirection), 0.0, 1.0), 2.0 );
  float specular = pow(clamp( dot( reflection, light ), 0.0, 1.0 ),16.0);

  diffuse *= raymarch_softshadow( pos, light, 0.02, 2.5 );
  dom *= raymarch_softshadow( pos, reflection, 0.02, 2.5 );

  vec3 lin = vec3(0.0);
  lin += 1.30 * diffuse * vec3(1.00, 0.80, 0.55);
  lin += 2.00 * specular * vec3(1.00, 0.90, 0.70) * diffuse;
  lin += 0.40 * ambient * vec3(0.40, 0.60, 1.00) * occlusion;
  lin += 0.50 * dom * vec3(0.40, 0.60, 1.00) * occlusion;
  lin += 0.50 * bac * vec3(0.25, 0.25, 0.25) * occlusion;
  lin += 0.25 * fre * vec3(1.00, 1.00, 1.00) * occlusion;
  color = color * lin;

  return color;
}

//------------------------------------------------------------------
// RAY CASTING CODE

// casts a ray, returning distance and material
vec2 raymarch_castRay( in vec3 ro, in vec3 rayDirection )
{
  float tmin = 1.0;
  float tmax = 20.0;

#if 1
  // bounding volume
  float tp1 = (0.0 - ro.y) / rayDirection.y;
  if( tp1>0.0 ) {
    tmax = min( tmax, tp1 );
  }
  float tp2 = (1.6-ro.y) / rayDirection.y;
  if( tp2>0.0 ) {
    if( ro.y>1.6 ) {
      tmin = max( tmin, tp2 );
    } else {
      tmax = min( tmax, tp2 );
    }
  }
#endif

  // Raymarch
  float t = tmin;
  float material = -1.0;
  for (int i=0; i < 64; i++)
  {
    float precis = 0.0005*t;
    vec2 res = raymarch_scene(ro + rayDirection * t);
    if (res.x < precis || t > tmax) {
      break;
    }
    t += res.x;
    material = res.y;
  }

  // Clear material if we didn't hit anything
  if (t > tmax) {
    material = -1.0;
  }
  return vec2(t, material);
}

// renders the results of a cast ray
vec3 raymarch_renderRay( in vec3 rayOrigin, in vec3 rayDirection )
{
  vec2 res = raymarch_castRay(rayOrigin, rayDirection);
  float t = res.x;
  float material = res.y;

  vec3 color = vec3(0.7, 0.9, 1.0) + rayDirection.y * 0.8;
  if (material > -0.5)
  {
    vec3 pos = rayOrigin + t * rayDirection;

    color = raymarch_getMaterialColor(pos, material);

    vec3 normal = raymarch_calculateNormal(pos);
    float occlusion = raymarch_ambientOcclusion(pos, normal);
    color = raymarch_filterLightingColor(color, pos, rayDirection, normal, occlusion);

    color = mix( color, vec3(0.8, 0.9, 1.0), 1.0 - exp( -0.000 * t * t * t ) );
  }

  return clamp(color, 0.0, 1.0);
}

// sets up camera and ray
void raymarch_renderScene(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 mouse = iMouse.xy / iResolution.xy;
  float time = 15.0 + iTime;

  // camera
  vec3 rayOrigin = vec3(
    -0.5+3.5 * cos(0.1 * time + 6.0 * mouse.x),
    1.0 + 2.0 * mouse.y,
    0.5 + 4.0 * sin(0.1 * time + 6.0 * mouse.x)
  );
  vec3 ta = vec3( -0.5, -0.4, 0.5 );

  // camera-to-world transformation
  mat3 ca = raymarch_setCamera(rayOrigin, ta, 0.0);

  vec3 totalColor = vec3(0.0);
  for (int m=0; m<AA; m++) {
    for (int n=0; n<AA; n++) {
      // pixel coordinates
      vec2 aaOffset = vec2(float(m),float(n)) / float(AA) - 0.5;
      vec2 pixel = (-iResolution.xy + 2.0*(fragCoord + aaOffset)) / iResolution.y;
      vec3 rayDirection = ca * normalize( vec3(pixel.xy, 2.0) );
      vec3 color = raymarch_renderRay(rayOrigin, rayDirection);
      color = raymarch_filterGamma(color);
      totalColor += color;
    }
  }
  totalColor /= float(AA*AA);

  fragColor = vec4(totalColor, 1.0);
}
`;

// TODO - this should be built into assembleShaders
function injectShaderCode(opts) {
  const INJECT_DECLARATIONS = /^/;
  const INJECT_CODE = /}[^{}]*$/;

  const source = opts.source;
  for (const key in opts) {
    switch (key) {
    case 'source': break;
    case 'declarations':
      source = source.replace(INJECT_DECLARATIONS, opts[key]);
      break;
    case 'code':
      source = source.replace(INJECT_CODE, opts[key].concat('\n}\n'));
      break;
    default:
      const insert = `\
// BEGIN INJECTED ${key.toUpperCase()}\n
${opts[key]}\n
// END INJECTED ${key.toUpperCase()}`;
      source.replace(key, `// INJECT_${key.toUpperCase()}`, insert);
    }
  }
  return source;
}

export default {
  name: 'raymarch',
  dependencies: [shadertoy],
  vs: null,
  fs,
  injector: injectShaderCode,
  getUniforms
};
