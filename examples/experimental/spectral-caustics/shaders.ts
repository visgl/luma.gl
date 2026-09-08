// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const ARCHITECTURE_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
  @location(2) instancePositions: vec3f,
  @location(3) instanceScales: vec3f,
  @location(4) instanceBaseColors: vec3f,
  @location(5) instanceEmissiveColors: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) baseColor: vec3f,
  @location(3) emissiveColor: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * inputs.instanceScales + inputs.instancePositions;
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize(inputs.normals / max(inputs.instanceScales, vec3f(0.0001)));
  output.baseColor = inputs.instanceBaseColors;
  output.emissiveColor = inputs.instanceEmissiveColors;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let lightOffset = prismCathedralScene.lightPosition - inputs.worldPosition;
  let lightDistance = length(lightOffset);
  let lightDirection = lightOffset / max(lightDistance, 0.0001);
  let direct = max(dot(normal, lightDirection), 0.0) * 3.2 / (1.0 + lightDistance * 0.18);
  let upwardFill = max(normal.y, 0.0) * 0.045;
  let edge = pow(1.0 - abs(dot(normalize(prismCathedralScene.cameraPosition - inputs.worldPosition), normal)), 3.0);
  let stone = inputs.baseColor * (0.035 + upwardFill + direct);
  let coldEdge = vec3f(0.04, 0.09, 0.18) * edge;
  return vec4f(stone + coldEdge + inputs.emissiveColor, 1.0);
}
`;

export const RECEIVER_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let worldPosition = inputs.positions * vec3f(10.0, 0.12, 14.0) + vec3f(0.0, -0.12, 0.0);
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize(inputs.normals / vec3f(10.0, 0.12, 14.0));
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let groutX = 1.0 - smoothstep(0.018, 0.055, abs(fract(inputs.worldPosition.x * 0.5 + 0.5) - 0.5));
  let groutZ = 1.0 - smoothstep(0.018, 0.055, abs(fract(inputs.worldPosition.z * 0.5 + 0.5) - 0.5));
  let tileLine = max(groutX, groutZ);
  let stone = mix(vec3f(0.013, 0.018, 0.03), vec3f(0.032, 0.038, 0.055), tileLine * 0.45);
  let caustic = spectralCaustics_getLinearSRGB(inputs.worldPosition);
  let grazing = pow(1.0 - max(dot(normalize(prismCathedralScene.cameraPosition - inputs.worldPosition), normal), 0.0), 4.0);
  let horizon = vec3f(0.018, 0.026, 0.05) * grazing;
  return vec4f(stone + horizon + caustic * 1.1, 1.0);
}
`;

export const CRYSTAL_CAPTURE_SHADER = /* wgsl */ `\
struct PrismCathedralCrystalUniforms {
  rotationMatrix: mat4x4f,
  center: vec3f,
  scale: vec3f,
};
struct PrismCathedralCaptureUniforms {
  lightViewProjectionMatrix: mat4x4f,
};
@group(0) @binding(auto) var<uniform> prismCathedralCrystal: PrismCathedralCrystalUniforms;
@group(0) @binding(auto) var<uniform> prismCathedralCapture: PrismCathedralCaptureUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldNormal: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rotatedPosition = (prismCathedralCrystal.rotationMatrix * vec4f(inputs.positions * prismCathedralCrystal.scale, 0.0)).xyz;
  let worldPosition = rotatedPosition + prismCathedralCrystal.center;
  let localNormal = inputs.normals / max(prismCathedralCrystal.scale, vec3f(0.0001));
  var output: FragmentInputs;
  output.position = prismCathedralCapture.lightViewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldNormal = normalize((prismCathedralCrystal.rotationMatrix * vec4f(localNormal, 0.0)).xyz);
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  return vec4f(normalize(inputs.worldNormal) * 0.5 + 0.5, 1.0);
}
`;

export const CRYSTAL_BEAUTY_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
struct PrismCathedralCrystalUniforms {
  rotationMatrix: mat4x4f,
  center: vec3f,
  scale: vec3f,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;
@group(0) @binding(auto) var<uniform> prismCathedralCrystal: PrismCathedralCrystalUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
  @location(1) normals: vec3f,
};

struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) worldNormal: vec3f,
  @location(2) localPosition: vec3f,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let rotatedPosition = (prismCathedralCrystal.rotationMatrix * vec4f(inputs.positions * prismCathedralCrystal.scale, 0.0)).xyz;
  let worldPosition = rotatedPosition + prismCathedralCrystal.center;
  let localNormal = inputs.normals / max(prismCathedralCrystal.scale, vec3f(0.0001));
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.worldNormal = normalize((prismCathedralCrystal.rotationMatrix * vec4f(localNormal, 0.0)).xyz);
  output.localPosition = inputs.positions;
  return output;
}

fn spectralFacetColor(value: f32) -> vec3f {
  let red = smoothstep(0.38, 0.72, value) * (1.0 - smoothstep(0.82, 1.0, value));
  let green = smoothstep(0.14, 0.48, value) * (1.0 - smoothstep(0.68, 0.93, value));
  let blue = (1.0 - smoothstep(0.42, 0.75, value)) + smoothstep(0.86, 1.0, value) * 0.3;
  return vec3f(red, green, blue);
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normal = normalize(inputs.worldNormal);
  let viewDirection = normalize(prismCathedralScene.cameraPosition - inputs.worldPosition);
  let lightDirection = normalize(prismCathedralScene.lightPosition - inputs.worldPosition);
  let fresnel = pow(1.0 - abs(dot(viewDirection, normal)), 3.0);
  let reflectedLight = reflect(-lightDirection, normal);
  let glint = pow(max(dot(reflectedLight, viewDirection), 0.0), 42.0);
  let facetPhase = fract(dot(abs(normal), vec3f(0.19, 0.37, 0.53)) + prismCathedralScene.time * 0.018);
  let spectrum = spectralFacetColor(facetPhase);
  let core = vec3f(0.008, 0.025, 0.055);
  let rim = mix(vec3f(0.08, 0.46, 1.2), spectrum * 2.7, 0.58) * (0.15 + fresnel * 1.85);
  let highlight = vec3f(8.5, 6.2, 3.8) * glint;
  let internalFlash = spectrum * pow(max(1.0 - length(inputs.localPosition) * 0.68, 0.0), 4.0) * 0.55;
  return vec4f(core + rim + highlight + internalFlash, 0.78);
}
`;

export const LIGHT_BEAM_SHADER = /* wgsl */ `\
struct PrismCathedralSceneUniforms {
  viewProjectionMatrix: mat4x4f,
  cameraPosition: vec3f,
  lightPosition: vec3f,
  time: f32,
};
@group(0) @binding(auto) var<uniform> prismCathedralScene: PrismCathedralSceneUniforms;

struct VertexInputs {
  @location(0) positions: vec3f,
};
struct FragmentInputs {
  @builtin(position) position: vec4f,
  @location(0) worldPosition: vec3f,
  @location(1) beamHeight: f32,
};

@vertex fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  let beamCosine = 0.8668;
  let beamSine = 0.4987;
  let rotatedPosition = vec3f(
    inputs.positions.x,
    inputs.positions.y * beamCosine + inputs.positions.z * beamSine,
    -inputs.positions.y * beamSine + inputs.positions.z * beamCosine
  );
  let worldPosition = rotatedPosition + vec3f(0.0, 7.025, -2.0);
  var output: FragmentInputs;
  output.position = prismCathedralScene.viewProjectionMatrix * vec4f(worldPosition, 1.0);
  output.worldPosition = worldPosition;
  output.beamHeight = inputs.positions.y / 8.02 + 0.5;
  return output;
}

@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let normalizedHeight = clamp(inputs.beamHeight, 0.0, 1.0);
  let pulse = 0.82 + sin(prismCathedralScene.time * 0.7) * 0.08;
  let color = mix(vec3f(0.045, 0.08, 0.16), vec3f(0.35, 0.24, 0.09), normalizedHeight);
  return vec4f(color * pulse, 0.055 + normalizedHeight * 0.035);
}
`;
