// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Declares the shared vertex outputs. */
export const header = `struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}
`;

/** Emits a fullscreen triangle with normalized texture coordinates. */
export const triangle = `@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  let corner = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  return VertexOutput(vec4f(corner * 2.0 - 1.0, 0, 1), corner);
}
`;

/** Declares per-draw settings for the mask and relief pipelines. */
export const settings = `@group(0) @binding(0) var<uniform> settings: vec4f;
`;

/** Draws the river, city, and culverts for each stencil region. */
export const river = `fn line(distanceToLine: f32, width: f32) -> f32 {
  return 1.0 - smoothstep(width, width + fwidth(distanceToLine), distanceToLine);
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let uv=input.uv; let lens=settings.xy; let mode=settings.z; let time=settings.w;
  var p =  (uv - 0.5) * vec2f(1.6,1.0);
  if (mode < 0.0) {
    if (length(p-lens) > 0.245) { discard; }
    return vec4f(1);
  }
  var street =  mat2x2f(0.88,0.48,-0.48,0.88) * p * vec2f(13.0,19.0);
  var block =  fract(street)-0.5;
  var seed =  fract(sin(dot(floor(street),vec2f(17.13,43.7)))*4375.1);
  var roof =  max(abs(block.x)*1.15,abs(block.y)*1.22);
  var city =  mix(vec3f(0.045,0.085,0.13),vec3f(0.18,0.24,0.31)+seed*0.12,line(roof,0.39));
  city += vec3f(0.85,0.43,0.10)*line(abs(block.y-0.32),0.019)*step(abs(block.x),0.29)*seed;
  var water =  p.y - 0.18*sin(6.0*p.x+0.28)-0.045*sin(18.0*p.x);
  var pipe =  min(abs(block.x)/13.0,abs(block.y)/19.0);
  var paint =  city;
  if (mode == 1.0 || mode == 3.0) {
    var contours =  line(abs(fract((abs(water)+0.009*sin(p.x*30.0))*63.0)-0.5),0.038);
    paint = mix(vec3f(0.80,0.68,0.44)-contours*0.19,vec3f(0.08,0.42,0.47),line(abs(water),0.045));
  }
  if (mode == 2.0 || mode == 3.0) {
    if (mode == 2.0) {paint = city*0.28;}
    paint = mix(paint,vec3f(0.77,0.49,0.25),line(pipe,0.0032));
    var pulse =  pow(0.5+0.5*cos(38.0*p.x+31.0*p.y-time*3.0),12.0);
    paint += vec3f(0.18,0.73,0.92)*pulse*line(pipe,0.0018);
  }
  return vec4f(paint,1);
}`;

/** Captures the canyon landscape into color and projected depth. */
export const canyon = `fn terrain(p: vec2f) -> f32 {
  var bend =  p.x - 2.0*sin(0.2*p.y);
  var rim =  smoothstep(1.5,5.0,abs(bend));
  return -2.6 + rim*(3.5+0.7*sin(0.7*p.y)+0.4*cos(2.8*p.x)) + 0.13*sin(5.0*p.y);
}
fn scene(p: vec3f) -> f32 {
  var arch =  max(max(abs(p.z-8.0)-0.48,abs(p.x)-6.0),max(p.y-1.7,1.35-p.y-0.06*p.x*p.x));
  return min(p.y-terrain(p.xz),arch);
}
struct Capture { @location(0) color: vec4f, @builtin(frag_depth) depth: f32 }
@fragment fn fragmentMain(input: VertexOutput) -> Capture {
  let uv=input.uv;
  var screen =  (uv*2.0-1.0)*vec2f(1.6,1.0);
  var ray =  normalize(vec3f(screen.x,screen.y-0.22,1.55));
  var camera =  vec3f(0.0,2.8,-4.0);
  var travel =  0.0;
  for (var stepIndex=0;stepIndex<220;stepIndex++) {
    var gap =  scene(camera+ray*travel);
    if (gap < 0.006 || travel>75.0) {break;}
    travel += max(0.004,gap*0.37);
  }
  var p =  camera+ray*travel;
  var sky =  mix(vec3f(0.51,0.38,0.45),vec3f(0.045,0.065,0.16),clamp(ray.y*2.0+0.2,0.0,1.0));
  sky += vec3f(0.96,0.85,0.64)*(1.0-smoothstep(0.049,0.052,length(screen-vec2f(0.65,0.45))));
  if (travel>75.0 || scene(p)>0.018) {return Capture(vec4f(sky,1),1);}
  var e = vec2f(0.015,0.0);
  var normal = normalize(vec3f(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
  var strata = 0.5+0.5*sin(16.0*p.y+0.7*sin(p.z));
  var rock = mix(vec3f(0.28,0.13,0.16),vec3f(0.74,0.41,0.32),strata*0.45+0.2);
  if(p.y< -2.36) {rock=vec3f(0.06,0.26,0.34);}
  let color=vec4f(mix(rock*(0.42+max(dot(normal,normalize(vec3f(-0.5,0.8,-0.4))),0.0)),sky,1.0-exp(-travel*0.016)),1);
  var z = travel*ray.z;
  return Capture(color,clamp((80.0-8.0/z)/79.9,0.0,1.0));
}`;

/** Loads and reconstructs a point from captured depth. */
export const points = `@group(0) @binding(2) var capturedDepth: texture_depth_2d;
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> VertexOutput {
  let pixel = vec2i(i32(index % 640u),i32(index / 640u));
  let uv = (vec2f(pixel)+0.5)/vec2f(640,400);
  let depth = textureLoad(capturedDepth,vec2i(pixel.x,399-pixel.y),0);
  let distance = 8.0/(80.0-79.9*depth);
  let screen = (uv*2.0-1.0)*vec2f(1.6,1);
  let point = vec3f(screen.x*distance/1.55,(screen.y-0.22)*distance/1.55,distance);
  let angle = settings.x;
  let rotated = mat2x2f(cos(angle),sin(angle),-sin(angle),cos(angle))*vec2f(point.x,point.z-12.0);
  let z=rotated.y+12.0;
  var clip=vec4f(rotated.x*1.55/1.6,point.y*1.55+0.22*z,(80.0*z-8.0)/79.9,z);
  if(depth>=1.0){clip=vec4f(3,3,3,1);}
  return VertexOutput(clip,uv);
}
`;

/** Looks up the captured color at the original sample coordinates. */
export const color = `@group(0) @binding(1) var capturedImage: texture_2d<f32>;
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let size = vec2i(textureDimensions(capturedImage));
  let pixel = clamp(vec2i(vec2f(input.uv.x,1.0-input.uv.y)*vec2f(size)),vec2i(0),size-1);
  return textureLoad(capturedImage,pixel,0);
}
`;
