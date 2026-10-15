// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';

const SHARED = /* wgsl */ `
struct View {extent: vec4f};
@group(0) @binding(0) var<uniform> view: View;
const CORNERS = array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
const POCKETS = array<vec2f,6>(vec2f(-6,-3),vec2f(0,-3.13),vec2f(6,-3),vec2f(-6,3),vec2f(0,3.13),vec2f(6,3));
`;
const TABLE =
  SHARED +
  /* wgsl */ `
struct Vertex {@builtin(position) position: vec4f, @location(0) point: vec2f};
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> Vertex {
 var output: Vertex; output.position = vec4f(CORNERS[index], 0, 1); output.point = CORNERS[index] * view.extent.xy; return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
 let point = input.point; let absolute = abs(point);
 var color = vec3f(0.10, 0.18, 0.16);
 if (absolute.x < 6.65 && absolute.y < 3.65) {
   let grain = 0.025 * sin(point.x * 5.0 + sin(point.y * 23.0));
   color = vec3f(0.26 + grain, 0.15 + grain * 0.5, 0.095);
 }
 if (absolute.x < 6.3 && absolute.y < 3.3) {color = vec3f(0.055, 0.22, 0.16);}
 if (absolute.x < 6.0 && absolute.y < 3.0) {
   let vignette = 1.0 - 0.12 * length(point / vec2f(6,3));
   color = vec3f(0.08, 0.36, 0.27) * vignette;
   // Subtle cloth detail and the head string.
   color += 0.004 * sin(point.x * 430.0) * sin(point.y * 430.0);
   if (abs(point.x + 3.0) < 0.008) {color += vec3f(0.015);}
 }
 for (var index = 0u; index < 6u; index++) {
   let distance = length(point - POCKETS[index]);
   if (distance < 0.47) {color = vec3f(0.17,0.12,0.07);}
   if (distance < 0.39) {color = vec3f(0.016,0.025,0.022);}
 }
 // Inlaid rail diamonds.
 if (abs(absolute.y - 3.46) < 0.045 && abs(fract((point.x + 0.75) / 1.5) - 0.5) < 0.025 && absolute.x < 5.5) {color = vec3f(0.68,0.60,0.42);}
 return vec4f(color, 1);
}`;
const SPHERES =
  SHARED +
  /* wgsl */ `
@group(0) @binding(1) var<storage, read> positions: array<vec4f>;
@group(0) @binding(2) var<storage, read> orientations: array<vec4f>;
struct Vertex {@builtin(position) position: vec4f, @location(0) corner: vec2f, @location(1) @interpolate(flat) index: u32, @location(2) @interpolate(flat) orientation: vec4f};
@vertex fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) index: u32) -> Vertex {
 let sphere = positions[index]; var output: Vertex;
 output.corner = CORNERS[vertex]; output.index = index; output.orientation = orientations[index];
 output.position = vec4f((sphere.xy + output.corner * sphere.w) / view.extent.xy, 0, 1);
 if (sphere.w <= 0.0) {output.position = vec4f(3,3,0,1);}
 return output;
}
@fragment fn fragmentMain(input: Vertex) -> @location(0) vec4f {
 let squared = dot(input.corner,input.corner); if (squared > 1.0) {discard;}
 let normal = vec3f(input.corner, sqrt(1.0-squared));
 let conjugate = -input.orientation.xyz;
 let local = normal + 2.0 * cross(conjugate, cross(conjugate, normal) + input.orientation.w * normal);
 let colors = array<vec3f,8>(vec3f(0.035),vec3f(0.96,0.69,0.08),vec3f(0.08,0.30,0.76),vec3f(0.83,0.12,0.10),vec3f(0.39,0.16,0.61),vec3f(0.97,0.36,0.06),vec3f(0.08,0.46,0.25),vec3f(0.51,0.10,0.15));
 var base = colors[input.index % 8u];
 let band = 1.0 - smoothstep(0.38-fwidth(local.z),0.38+fwidth(local.z),abs(local.z));
 if (input.index > 8u) {base = mix(vec3f(0.94,0.91,0.80),base,band);}
 if (input.index == 0u) {
   let cueBand = 1.0 - smoothstep(0.09,0.13,abs(local.z));
   base = mix(vec3f(0.97,0.94,0.84),vec3f(0.23,0.34,0.30),cueBand);
 }
 let light = 0.45 + 0.55 * max(dot(normal,normalize(vec3f(-0.4,0.5,1))),0.0);
 let highlight = pow(max(dot(normal, normalize(vec3f(-0.3,0.4,1))),0.0),40.0) * 0.35;
 return vec4f(base * light + highlight,1);
}`;

export function createPoolRenderer(device: Device, positions: Buffer, orientations: Buffer) {
  const view = device.createBuffer({byteLength: 16, usage: Buffer.UNIFORM | Buffer.COPY_DST});
  const uniform = {name: 'view', type: 'uniform' as const, group: 0, location: 0};
  const table = new Model(device, {
    id: 'pool-table',
    source: TABLE,
    vertexCount: 6,
    bindings: {view},
    shaderLayout: {attributes: [], bindings: [uniform]}
  });
  const spheres = new Model(device, {
    id: 'pool-balls',
    source: SPHERES,
    vertexCount: 6,
    instanceCount: 16,
    bindings: {view, positions, orientations},
    shaderLayout: {
      attributes: [],
      bindings: [
        uniform,
        {name: 'positions', type: 'read-only-storage', group: 0, location: 1, visibility: 1},
        {name: 'orientations', type: 'read-only-storage', group: 0, location: 2, visibility: 1}
      ]
    }
  });
  return {
    draw(extent: [number, number]) {
      view.write(new Float32Array([...extent, 0, 0]));
      const pass = device.beginRenderPass({clearColor: [0.1, 0.18, 0.16, 1]});
      table.draw(pass);
      spheres.draw(pass);
      pass.end();
      device.submit();
    },
    destroy() {
      table.destroy();
      spheres.destroy();
      view.destroy();
    }
  };
}
