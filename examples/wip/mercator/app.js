import {AnimationLoop, ClipSpace} from 'luma.gl';

const INFO_HTML = `
<p>
  <b>GPU raytracing, first iteration sphere mappings</b>
<p>
  Spherical projection mapping by <a href="http://twitter.com/Flexi23/">Felix
  Woitzel</a>, ported to <a href="http://senchalabs.github.com/philogl/">PhiloGL's
  post-processing API</a> - <a id="fullscreen" href="#">Go fullscreen</a><br>No
  meshes used, all calculation is in the fragment shader of a Quad.
  A luma.gl port (of the PhiloGL port)
  <div class="footer">
    2 triangles should be enough for everybody<br> more textures <a
      href="http://oera.net/How2/TextureMaps2.htm" target="textures">here.</a>
  </div>
`;

const VERTEX_SHADER = `\
attribute vec3 position;
attribute vec2 texCoord1;

uniform mat4 worldMatrix;
uniform mat4 projectionMatrix;

varying vec2 pixel;
void main(void) {
  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.);
  pixel = texCoord1;
}
`;

const FRAGMENT_SHADER = `\
precision highp float;
uniform sampler2D sampler_prev;
varying vec2 pixel;
void main(void) {
  gl_FragColor = texture2D(sampler_prev, pixel);
  gl_FragColor.a = 1.;
}
`;

const SHADER_FS_BLUR_HORIZONTAL = `\
precision highp float;

// original shader from http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
// horizontal blur fragment shader
uniform sampler2D sampler1;//src_tex;
varying vec2 pixel;
uniform vec2 pixelSize;
void main(void) // fragment
{
  float h = pixelSize.x;
  vec4 sum = vec4(0.0);
  sum += texture2D(sampler1, vec2(pixel.x - 4.0*h, pixel.y) ) * 0.05;
  sum += texture2D(sampler1, vec2(pixel.x - 3.0*h, pixel.y) ) * 0.09;
  sum += texture2D(sampler1, vec2(pixel.x - 2.0*h, pixel.y) ) * 0.12;
  sum += texture2D(sampler1, vec2(pixel.x - 1.0*h, pixel.y) ) * 0.15;
  sum += texture2D(sampler1, vec2(pixel.x + 0.0*h, pixel.y) ) * 0.16;
  sum += texture2D(sampler1, vec2(pixel.x + 1.0*h, pixel.y) ) * 0.15;
  sum += texture2D(sampler1, vec2(pixel.x + 2.0*h, pixel.y) ) * 0.12;
  sum += texture2D(sampler1, vec2(pixel.x + 3.0*h, pixel.y) ) * 0.09;
  sum += texture2D(sampler1, vec2(pixel.x + 4.0*h, pixel.y) ) * 0.05;
  gl_FragColor.xyz = sum.xyz / 0.98; // normalize
  gl_FragColor.a = 1.;
}
`;

const SHADER_FS_BLUR_VERTICAL = `\
precision highp float;

// original shader from http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
// vertical blur fragment shader
uniform sampler2D sampler1;//src_tex;
varying vec2 pixel;
uniform vec2 pixelSize;
void main(void) // fragment
{
  float v = pixelSize.y;
  vec4 sum = vec4(0.0);
  sum += texture2D(sampler1, vec2(pixel.x, - 4.0*v + pixel.y) ) * 0.05;
  sum += texture2D(sampler1, vec2(pixel.x, - 3.0*v + pixel.y) ) * 0.09;
  sum += texture2D(sampler1, vec2(pixel.x, - 2.0*v + pixel.y) ) * 0.12;
  sum += texture2D(sampler1, vec2(pixel.x, - 1.0*v + pixel.y) ) * 0.15;
  sum += texture2D(sampler1, vec2(pixel.x, + 0.0*v + pixel.y) ) * 0.16;
  sum += texture2D(sampler1, vec2(pixel.x, + 1.0*v + pixel.y) ) * 0.15;
  sum += texture2D(sampler1, vec2(pixel.x, + 2.0*v + pixel.y) ) * 0.12;
  sum += texture2D(sampler1, vec2(pixel.x, + 3.0*v + pixel.y) ) * 0.09;
  sum += texture2D(sampler1, vec2(pixel.x, + 4.0*v + pixel.y) ) * 0.05;
  gl_FragColor.xyz = sum.xyz/0.98;
  gl_FragColor.a = 1.;
}
`;

const SHADER_FS_ADVANCE = `\
precision highp float;

uniform sampler2D sampler1; // prev;
uniform sampler2D sampler2; // blur1;
uniform sampler2D sampler3; // blur2;
uniform sampler2D sampler4; // blur3;
uniform sampler2D sampler5; // blur4;
uniform sampler2D sampler6; // blur5;
uniform sampler2D sampler7; // panorama texture

varying vec2 pixel;
uniform vec2 mouse;

bool is_onscreen(vec2 uv){
  return (uv.x < 1.) && (uv.x > 0.) && (uv.y < 1.) && (uv.y > 0.);
}

void main(void) {
  vec2 c = vec2(-0.226,0.087);
  vec2 tuning =  vec2(1.77);
  vec2 complexSquaredPlusC; // One steps towards the Julia Attractor
  vec2 uv = (pixel - vec2(0.5))*tuning;
  complexSquaredPlusC.x = (uv.x * uv.x - uv.y * uv.y + c.x + 0.5);
  complexSquaredPlusC.y = (2. * uv.x * uv.y + c.y + 0.5);

  if(is_onscreen(complexSquaredPlusC)){
    vec4 old = texture2D(sampler1, complexSquaredPlusC);
    gl_FragColor = old + vec4( -.0035, .0, .0, 1.); // decrement the red channel
  }else{
    // return border color
    gl_FragColor = vec4(1., 0., 0., 1.); // out is red
  }

  // Do not dare to try a McCabeism implementation in the green or the blue channel here, Fnord.
  // http://www.wblut.com/2011/07/13/mccabeism-turning-noise-into-a-thing-of-beauty/

  gl_FragColor = texture2D(sampler7, pixel);
  gl_FragColor.a = 1.;
}
`;

const SHADER_FS_COMPOSITE = `\
precision highp float;

varying vec2 pixel;

#define pi 3.14159265
#define pi2inv 0.159154943

uniform sampler2D sampler1; // plain
uniform sampler2D sampler2; // blur1
uniform sampler2D sampler3; // blur2
uniform sampler2D sampler4; // blur3
uniform sampler2D sampler5; // blur4
uniform sampler2D sampler6; // blur5
uniform sampler2D sampler7; // earth panorama
uniform sampler2D sampler8; // milkyway panorama
uniform sampler2D sampler9; // breakfast panorama

uniform float z;
uniform float d;
uniform float zoom;
uniform float mask_apex;

uniform vec3 w1;  // each vec3( cos(w), sin(w), w )
uniform vec3 w2;  // Euler angles
uniform vec3 w3;

uniform vec2 mouse;
uniform vec4 aspect;

/**
 * Blur with a fake linearly adjustable strength. Made for a smooth transistion through the blur levels.
 * This function was considered as a simple demo and not a productive blur function first. It turned out quite nice though ^^
 * @arg blur : blur strength, 0 no blur ..1 max
 */
vec4 lerp_blur(vec2 uv, float blur) {

  vec4 plain = texture2D(sampler1,uv);
  vec4 blur1 = texture2D(sampler2,uv); // (1x) blur result from the two-pass algorithm shader program
  vec4 blur2 = texture2D(sampler3,uv); // (2x) each blur texture has half the side length of its predecessor
  vec4 blur3 = texture2D(sampler4,uv); // (4x) iteratively, we have an exponential increase of blur strength
  vec4 blur4 = texture2D(sampler5,uv); // (8x)
  vec4 blur5 = texture2D(sampler6,uv); // (16x)

  //blur = log(clamp(blur, 0., 1.)*E5+1.)/5.; // linearization of the exponential blur radius growth

  blur = clamp(blur, 0., 1.)*5.;
  if(blur < 1.){
    return mix( plain, blur1, vec4(blur)); // linear interpolation between the first two textures
  } else if(blur < 2.) {
    return mix( blur1, blur2, vec4(blur-1.)); // and so on...
  } else if(blur < 3.) {
    return mix( blur2, blur3, vec4(blur-2.)); // see, this is not a change in radius at all
  } else if(blur < 4.) {
    return mix( blur3, blur4, vec4(blur-3.)); // just blending one texture over the other
  } else {
    return mix( blur4, blur5, vec4(blur-4.)); // fakey fog magic hurrah \:D/
  }
}

vec2 factorA, factorB, product;
vec4 ret;

float atan2(float y, float x){
  if(x>0.) return atan(y/x);
  if(y>=0. && x<0.) return atan(y/x) + pi;
  if(y<0. && x<0.) return atan(y/x) - pi;
  if(y>0. && x==0.) return pi/2.;
  if(y<0. && x==0.) return -pi/2.;
  if(y==0. && x==0.) return pi/2.; // undefined usually
}

void main(void) {
  vec2 uv = pixel*vec2(-1.)+vec2(1.);
  vec2 c = vec2(zoom)*(uv-vec2(0.5))*aspect.xy;

  float camera_apex = atan2(length(c),z);

  float mask = mask_apex >= camera_apex ? 1.:.0;

  float longitude = atan2(c.x,c.y);
  float latitude = (pi - camera_apex + asin(d*sin(camera_apex)));
  
  vec2 polar = vec2(longitude,latitude);
  
  vec3 p = vec3( sin(polar.x)*sin(polar.y),cos(polar.x)*sin(polar.y),cos(polar.y));
  
  p.zy = vec2( p.z*w1.x - p.y*w1.y, p.z*w1.y + p.y*w1.x);
  p.zx = vec2( p.z*w2.x - p.x*w2.y, p.z*w2.y + p.x*w2.x);
  p.yx = vec2( p.y*w3.x - p.x*w3.y, p.y*w3.y + p.x*w3.x);
  

  polar = vec2(atan2(p.z,p.x),atan2(p.y,length(p.xz)))*pi2inv*vec2(1.,2.)+vec2(0.,0.5);
  ret = texture2D(sampler7,polar)*mask; // earth sphere 
  
  c = -(uv-vec2(0.5))*aspect.xy;//*vec2(-1.,1.);

  polar = vec2( atan2(c.x,z), atan2(c.y,z));
  p = vec3( sin(polar.x)*cos(polar.y),sin(polar.y)*cos(polar.x),cos(polar.x)*cos(polar.y));
  factorA = p.zy; factorB = vec2(w1.x,w1.y);
  product = vec2( factorA.x*factorB.x - factorA.y*factorB.y,factorA.x*factorB.y + factorA.y*factorB.x);
  p.zy = product.xy; factorA = p.zx; factorB = vec2(w2.x,w2.y);
  product = vec2( factorA.x*factorB.x - factorA.y*factorB.y,factorA.x*factorB.y + factorA.y*factorB.x);
  p.zx = product.xy; factorA = p.yx; factorB = vec2(w3.x,w3.y);
  product = vec2( factorA.x*factorB.x - factorA.y*factorB.y, factorA.x*factorB.y + factorA.y*factorB.x);
  p.yx = product.xy; polar = vec2( atan2(p.x,p.z),atan2(p.y,length(p.xz))*2.)*pi2inv + vec2(0.,0.5);

  ret = mix(ret,texture2D(sampler8,polar),(1.-mask)); // milkyway sphere
  // ret = texture2D(sampler9,polar); // breakfast sphere

  gl_FragColor = ret;
  // gl_FragColor = vec4(lerp_blur(pixel, length(mouse-pixel)*2.-0.15));
  // gl_FragColor = texture2D(sampler1, pixel);

  //  gl_FragColor = vec4(p.x)*8.;
  // gl_FragColor = vec4(latitude-3.5);
  //  gl_FragColor = vec4(mask);

  gl_FragColor.a = 1.;
}
`;

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
    return {clipSpace: new ClipSpace(gl, {fs: FRAGMENT_SHADER})};
  },

  onRender: ({gl, canvas, time, clipSpace}) => {
    clipSpace.draw({
      uniforms: {
        uTime: (time / 600) % (Math.PI * 2),
        uRatio: animationLoop.getHTMLControlValue('wavefronts', 7)
      }
    });
  },

  onAddHTML() {
    return INFO_HTML;
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}

