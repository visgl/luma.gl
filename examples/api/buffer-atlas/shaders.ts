// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const triangle = `#version 300 es
out vec2 uv;
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  uv = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0, 1);
}`;

export const river = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform vec2 lens;
uniform float mode;
uniform float time;
float line(float distanceToLine, float width) {
  return 1.0 - smoothstep(width, width + fwidth(distanceToLine), distanceToLine);
}
void main() {
  vec2 p = (uv - 0.5) * vec2(1.6,1.);
  if (mode < 0.) {
    if (length(p-lens) > .245) discard;
    color = vec4(1); return;
  }
  vec2 street = mat2(.88,.48,-.48,.88) * p * vec2(13.,19.);
  vec2 block = fract(street)-.5;
  float seed = fract(sin(dot(floor(street),vec2(17.13,43.7)))*4375.1);
  float roof = max(abs(block.x)*1.15,abs(block.y)*1.22);
  vec3 city = mix(vec3(.045,.085,.13),vec3(.18,.24,.31)+seed*.12,line(roof,.39));
  city += vec3(.85,.43,.10)*line(abs(block.y-.32),.019)*step(abs(block.x),.29)*seed;
  float water = p.y - .18*sin(6.*p.x+.28)-.045*sin(18.*p.x);
  float pipe = min(abs(block.x)/13.,abs(block.y)/19.);
  vec3 paint = city;
  if (mode == 1. || mode == 3.) {
    float contours = line(abs(fract((abs(water)+.009*sin(p.x*30.))*63.)-.5),.038);
    paint = mix(vec3(.80,.68,.44)-contours*.19,vec3(.08,.42,.47),line(abs(water),.045));
  }
  if (mode == 2. || mode == 3.) {
    if (mode == 2.) paint = city*.28;
    paint = mix(paint,vec3(.77,.49,.25),line(pipe,.0032));
    float pulse = pow(.5+.5*cos(38.*p.x+31.*p.y-time*3.),12.);
    paint += vec3(.18,.73,.92)*pulse*line(pipe,.0018);
  }
  color = vec4(paint,1);
}`;

export const canyon = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
float terrain(vec2 p) {
  float bend = p.x - 2.*sin(.2*p.y);
  float rim = smoothstep(1.5,5.,abs(bend));
  return -2.6 + rim*(3.5+.7*sin(.7*p.y)+.4*cos(2.8*p.x)) + .13*sin(5.*p.y);
}
float scene(vec3 p) {
  float arch = max(max(abs(p.z-8.)-.48,abs(p.x)-6.),max(p.y-1.7,1.35-p.y-.06*p.x*p.x));
  return min(p.y-terrain(p.xz),arch);
}
void main() {
  vec2 screen = (uv*2.-1.)*vec2(1.6,1.);
  vec3 ray = normalize(vec3(screen.x,screen.y-.22,1.55));
  vec3 camera = vec3(0.,2.8,-4.);
  float travel = 0.;
  for (int stepIndex=0;stepIndex<220;stepIndex++) {
    float gap = scene(camera+ray*travel);
    if (gap < .006 || travel>75.) break;
    travel += max(.004,gap*.37);
  }
  vec3 p = camera+ray*travel;
  vec3 sky = mix(vec3(.51,.38,.45),vec3(.045,.065,.16),clamp(ray.y*2.+.2,0.,1.));
  sky += vec3(.96,.85,.64)*(1.-smoothstep(.049,.052,length(screen-vec2(.65,.45))));
  if (travel>75. || scene(p)>.018) {color=vec4(sky,1); gl_FragDepth=1.; return;}
  vec2 e=vec2(.015,0.);
  vec3 normal=normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
  float strata=.5+.5*sin(16.*p.y+.7*sin(p.z));
  vec3 rock=mix(vec3(.28,.13,.16),vec3(.74,.41,.32),strata*.45+.2);
  if(p.y< -2.36) rock=vec3(.06,.26,.34);
  color=vec4(mix(rock*(.42+max(dot(normal,normalize(vec3(-.5,.8,-.4))),0.)),sky,1.-exp(-travel*.016)),1);
  float z=travel*ray.z;
  gl_FragDepth=clamp((80.-8./z)/79.9,0.,1.);
}`;

export const relief = `#version 300 es
precision highp float;
uniform sampler2D capturedDepth;
uniform float angle;
out vec2 uv;
void main(){
  ivec2 pixel=ivec2(gl_VertexID%640,gl_VertexID/640);
  uv=(vec2(pixel)+.5)/vec2(640,400);
  float d=texelFetch(capturedDepth,pixel,0).r;
  float z=8./(80.-79.9*d);
  vec2 s=(uv*2.-1.)*vec2(1.6,1.);
  vec3 p=vec3(s.x*z/1.55,(s.y-.22)*z/1.55,z);
  p.z-=12.;
  p.xz=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*p.xz;
  p.z+=12.;
  gl_Position=vec4(p.x*1.55/1.6,p.y*1.55+.22*p.z,(80.1*p.z-16.)/79.9,p.z);
  if(d>=1.) gl_Position=vec4(3,3,3,1);
  gl_PointSize=1.8;
}`;

export const capturedColor = `#version 300 es
precision highp float;
uniform sampler2D capturedImage;
in vec2 uv;
out vec4 color;
void main(){color=texture(capturedImage,uv);}`;
