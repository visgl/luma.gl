// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type TextGlyphAlphaShaderRenderMode = {
  expression: string;
  kind: 'float' | 'uint';
};

export type TextGlyphAlphaShaderSettings = {
  renderMode: TextGlyphAlphaShaderRenderMode;
  sdfThreshold: string;
  sdfSmoothing: string;
  msdfDistanceRange: string;
};

export type TextGlyphAlphaShaderProps = {
  functionName?: string;
  fontAtlasTexture?: string;
  fontAtlasTextureSampler?: string;
  textureCoordinate: string;
  atlasPage: string;
  settings: TextGlyphAlphaShaderSettings;
};

/** Creates one GLSL bitmap/SDF/MSDF atlas-alpha sampler for a fragment shader. */
export function makeTextGlyphAlphaGlsl({
  functionName = 'getTextGlyphAlpha',
  fontAtlasTexture = 'fontAtlasTexture',
  textureCoordinate,
  atlasPage,
  settings
}: TextGlyphAlphaShaderProps): string {
  const medianFunctionName = getMedianFunctionName(functionName);
  return `\
float ${medianFunctionName}(vec3 value) {
  return max(min(value.r, value.g), min(max(value.r, value.g), value.b));
}

float ${functionName}() {
  vec4 sampledColor = texture(${fontAtlasTexture}, vec3(${textureCoordinate}, float(${atlasPage})));
  if (${settings.renderMode.expression} > 1.5) {
    vec2 atlasSize = vec2(textureSize(${fontAtlasTexture}, 0).xy);
    vec2 unitRange = vec2(${settings.msdfDistanceRange}) / atlasSize;
    vec2 screenTexSize = 1.0 / fwidth(${textureCoordinate});
    float screenPxRange = max(0.5 * dot(unitRange, screenTexSize), 1.0);
    return clamp(screenPxRange * (${medianFunctionName}(sampledColor.rgb) - 0.5) + 0.5, 0.0, 1.0);
  }
  float sampledAlpha = sampledColor.a;
  if (${settings.renderMode.expression} < 0.5) {
    return sampledAlpha;
  }
  return ${settings.sdfSmoothing} > 0.0
    ? smoothstep(
        ${settings.sdfThreshold} - ${settings.sdfSmoothing},
        ${settings.sdfThreshold} + ${settings.sdfSmoothing},
        sampledAlpha
      )
    : step(${settings.sdfThreshold}, sampledAlpha);
}
`;
}

/** Creates one WGSL bitmap/SDF/MSDF atlas-alpha sampler for a fragment shader. */
export function makeTextGlyphAlphaWgsl({
  functionName = 'getTextGlyphAlpha',
  fontAtlasTexture = 'fontAtlasTexture',
  fontAtlasTextureSampler = 'fontAtlasTextureSampler',
  textureCoordinate,
  atlasPage,
  settings
}: TextGlyphAlphaShaderProps): string {
  const medianFunctionName = getMedianFunctionName(functionName);
  const isMsdf =
    settings.renderMode.kind === 'uint'
      ? `${settings.renderMode.expression} == 2u`
      : `${settings.renderMode.expression} > 1.5`;
  const isBitmap =
    settings.renderMode.kind === 'uint'
      ? `${settings.renderMode.expression} == 0u`
      : `${settings.renderMode.expression} < 0.5`;
  return `\
fn ${medianFunctionName}(value: vec3<f32>) -> f32 {
  return max(min(value.r, value.g), min(max(value.r, value.g), value.b));
}

fn ${functionName}(inputs : FragmentInputs) -> f32 {
  let sampledColor = textureSample(
    ${fontAtlasTexture},
    ${fontAtlasTextureSampler},
    ${textureCoordinate},
    i32(${atlasPage})
  );
  if (${isMsdf}) {
    let unitRange = vec2<f32>(${settings.msdfDistanceRange}) /
      vec2<f32>(textureDimensions(${fontAtlasTexture}));
    let screenTexSize = vec2<f32>(1.0) / fwidth(${textureCoordinate});
    let screenPxRange = max(0.5 * dot(unitRange, screenTexSize), 1.0);
    return clamp(screenPxRange * (${medianFunctionName}(sampledColor.rgb) - 0.5) + 0.5, 0.0, 1.0);
  }
  let sampledAlpha = sampledColor.a;
  if (${isBitmap}) {
    return sampledAlpha;
  }
  if (${settings.sdfSmoothing} > 0.0) {
    return smoothstep(
      ${settings.sdfThreshold} - ${settings.sdfSmoothing},
      ${settings.sdfThreshold} + ${settings.sdfSmoothing},
      sampledAlpha
    );
  }
  return select(0.0, 1.0, sampledAlpha >= ${settings.sdfThreshold});
}
`;
}

function getMedianFunctionName(functionName: string): string {
  return functionName === 'getTextGlyphAlpha' ? 'getMedian' : `${functionName}Median`;
}
