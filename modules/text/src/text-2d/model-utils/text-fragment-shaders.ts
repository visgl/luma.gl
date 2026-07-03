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
};

export type TextGlyphAlphaShaderProps = {
  functionName?: string;
  fontAtlasTexture?: string;
  fontAtlasTextureSampler?: string;
  textureCoordinate: string;
  atlasPage: string;
  settings: TextGlyphAlphaShaderSettings;
};

/** Creates one GLSL bitmap/SDF atlas-alpha sampler for a fragment shader. */
export function makeTextGlyphAlphaGlsl({
  functionName = 'getTextGlyphAlpha',
  fontAtlasTexture = 'fontAtlasTexture',
  textureCoordinate,
  atlasPage,
  settings
}: TextGlyphAlphaShaderProps): string {
  return `\
float ${functionName}() {
  vec4 sampledColor = texture(${fontAtlasTexture}, vec3(${textureCoordinate}, float(${atlasPage})));
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

/** Creates one WGSL bitmap/SDF atlas-alpha sampler for a fragment shader. */
export function makeTextGlyphAlphaWgsl({
  functionName = 'getTextGlyphAlpha',
  fontAtlasTexture = 'fontAtlasTexture',
  fontAtlasTextureSampler = 'fontAtlasTextureSampler',
  textureCoordinate,
  atlasPage,
  settings
}: TextGlyphAlphaShaderProps): string {
  const isBitmap =
    settings.renderMode.kind === 'uint'
      ? `${settings.renderMode.expression} == 0u`
      : `${settings.renderMode.expression} < 0.5`;
  return `\
fn ${functionName}(inputs : FragmentInputs) -> f32 {
  let sampledColor = textureSample(
    ${fontAtlasTexture},
    ${fontAtlasTextureSampler},
    ${textureCoordinate},
    i32(${atlasPage})
  );
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
