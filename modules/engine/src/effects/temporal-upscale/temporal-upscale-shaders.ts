// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Inspired by AMD FSR 2 (MIT): dilate, reproject, rectify, accumulate, RCAS-style sharpen.
// Independently authored WGSL; no AMD shader source or coefficients are copied.

import {temporalMotionReprojectionWGSL} from '../passes/screen-space/temporal-frame';

/** Fullscreen triangle with top-left texture coordinates derived from fragment position. */
export const temporalUpscaleVertex = /* wgsl */ `
@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4f {
  let position = vec2f(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
  return vec4f(position * 2.0 - 1.0, 0.0, 1.0);
}
`;

/** Shared bindings, color math and rejection policy. Uniforms occupy four aligned vec4 slots. */
const TEMPORAL_COMMON = /* wgsl */ `
${temporalMotionReprojectionWGSL}
struct Settings {
  sizes: vec4f, // render width/height, output width/height
  jitterControls: vec4f, // render-pixel jitter, reset, sharpness
  controls: vec4f, // history maximum, debug mode, sample validation, kernel sharpness
  tuning: vec4f, // responsiveness, padding, padding, padding
};
@group(0) @binding(0) var<uniform> settings: Settings;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var depthTexture: texture_depth_2d;
@group(0) @binding(3) var velocityTexture: texture_2d<f32>;
@group(0) @binding(4) var historyColor: texture_2d<f32>;
@group(0) @binding(5) var historyAux: texture_2d<f32>;
@group(0) @binding(6) var linearSampler: sampler;
fn renderCoordinate(coordinate: vec2i) -> vec2i {
  return clamp(coordinate, vec2i(0), vec2i(settings.sizes.xy) - vec2i(1));
}
fn outputCoordinate(coordinate: vec2i) -> vec2i {
  return clamp(coordinate, vec2i(0), vec2i(settings.sizes.zw) - vec2i(1));
}
fn rgbToYCoCg(color: vec3f) -> vec3f {
  return vec3f(dot(color, vec3f(0.25, 0.5, 0.25)),
    dot(color, vec3f(0.5, 0.0, -0.5)), dot(color, vec3f(-0.25, 0.5, -0.25)));
}
fn yCoCgToRgb(color: vec3f) -> vec3f {
  return vec3f(color.x + color.y - color.z, color.x + color.z, color.x - color.y - color.z);
}
fn clipToBox(color: vec3f, minimum: vec3f, maximum: vec3f) -> vec3f {
  let center = (minimum + maximum) * 0.5;
  let distance = abs(color - center);
  var scale = 1.0;
  for (var component = 0; component < 3; component++) {
    if (distance[component] > 0.0) {
      scale = min(scale, (maximum[component] - minimum[component]) * 0.5 / distance[component]);
    }
  }
  return center + (color - center) * scale;
}
struct Reprojection {
  velocity: vec4f,
  previousUV: vec2f,
  depth: f32,
  count: f32,
  valid: bool,
};
fn reproject(uv: vec2f) -> Reprojection {
  // A scene point moves by +jitter pixels in the low-resolution image.
  let nearest = vec2i(floor(uv * settings.sizes.xy + settings.jitterControls.xy));
  var coordinate = renderCoordinate(nearest);
  var closest = textureLoad(depthTexture, coordinate, 0);
  for (var vertical = -1; vertical <= 1; vertical++) {
    for (var horizontal = -1; horizontal <= 1; horizontal++) {
      let candidate = renderCoordinate(nearest + vec2i(horizontal, vertical));
      let depth = textureLoad(depthTexture, candidate, 0);
      if (depth < closest) { closest = depth; coordinate = candidate; }
    }
  }
  let velocity = textureLoad(velocityTexture, coordinate, 0);
  let previousUV = temporal_reprojectMotion(uv, velocity.xy);
  let base = vec2i(floor(previousUV * settings.sizes.zw - vec2f(0.5)));
  var minimumDepth = 1.0;
  var count = 1e30;
  for (var vertical = 0; vertical <= 1; vertical++) {
    for (var horizontal = 0; horizontal <= 1; horizontal++) {
      let auxiliary = textureLoad(historyAux, outputCoordinate(base + vec2i(horizontal, vertical)), 0).rg;
      minimumDepth = min(minimumDepth, auxiliary.r);
      count = min(count, auxiliary.g);
    }
  }
  // Conservative four-tap rule: all previous surfaces must be closer to reject.
  // The absolute guard avoids dividing by zero at the far plane.
  let expected = max(0.0, velocity.z);
  let disoccluded = minimumDepth > expected + max(expected * 0.05, 0.00001);
  let valid = settings.jitterControls.z == 0.0 && velocity.w > 0.0 && count > 0.0 &&
    all(previousUV >= vec2f(0.0)) && all(previousUV <= vec2f(1.0)) && !disoccluded;
  return Reprojection(velocity, previousUV, closest, count, valid);
}
fn lanczos2(value: f32) -> f32 {
  if (abs(value) < 0.00001) { return 1.0; }
  if (abs(value) >= 2.0) { return 0.0; }
  let angle = 3.141592653589793 * value;
  return sin(angle) * sin(angle * 0.5) / (angle * angle * 0.5);
}
// Scale of the accumulation kernel, in render pixels: 1 without upscaling, 1.7 at half size.
// A larger scale gives a narrower kernel, so a sample contributes only close to its centre.
// The default factor 0.85 (kernel sharpness) makes the lobe a little wider than one output pixel. With a factor of 1, the
// neighbouring output pixels share too few samples, and edges show a one-pixel comb pattern.
fn kernelScale() -> f32 {
  let ratio = settings.sizes.zw / settings.sizes.xy;
  return clamp(min(ratio.x, ratio.y) * clamp(settings.controls.w, 0.5, 1.0), 1.0, 2.0);
}
// Weight of one render sample at a distance (in render pixels) from the output pixel centre:
// the main lobe of the Lanczos-2 kernel, narrowed by the kernel scale.
fn sampleWeight(distance: vec2f, scale: f32) -> f32 {
  return max(0.0, lanczos2(distance.x * scale)) * max(0.0, lanczos2(distance.y * scale));
}
// Largest accumulated weight. A full-weight sample then has a blend factor of 1 - historyMaximum.
fn maximumWeight() -> f32 {
  let maximum = clamp(settings.controls.x, 0.0, 0.999);
  return maximum / (1.0 - maximum);
}
// Blend factor of the current frame: its weight as a fraction of all accumulated weight.
// It is 0 when no render sample is close to this output pixel, and 1 without history.
fn currentBlend(weight: f32, reprojection: Reprojection) -> f32 {
  if (!reprojection.valid) { return 1.0; }
  let accumulated = min(reprojection.count, maximumWeight());
  return weight / max(accumulated + weight, 0.00001);
}
fn catmullRomWeights(fraction: f32) -> vec4f {
  let squared = fraction * fraction;
  let cubed = squared * fraction;
  return vec4f(-0.5 * fraction + squared - 0.5 * cubed,
    1.0 - 2.5 * squared + 1.5 * cubed,
    0.5 * fraction + 2.0 * squared - 1.5 * cubed, -0.5 * squared + 0.5 * cubed);
}
fn sampleHistory(uv: vec2f) -> vec4f {
  let position = uv * settings.sizes.zw - vec2f(0.5);
  let base = floor(position);
  let horizontal = catmullRomWeights(fract(position.x));
  let vertical = catmullRomWeights(fract(position.y));
  // Combine the positive middle coefficients with bilinear sampling: 4x4 -> 3x3 taps.
  let horizontalWeights = vec3f(horizontal.x, horizontal.y + horizontal.z, horizontal.w);
  let verticalWeights = vec3f(vertical.x, vertical.y + vertical.z, vertical.w);
  let horizontalPositions = vec3f(base.x - 0.5, base.x + 0.5 + horizontal.z / horizontalWeights.y, base.x + 2.5);
  let verticalPositions = vec3f(base.y - 0.5, base.y + 0.5 + vertical.z / verticalWeights.y, base.y + 2.5);
  var color = vec4f(0.0);
  for (var verticalIndex = 0; verticalIndex < 3; verticalIndex++) {
    for (var horizontalIndex = 0; horizontalIndex < 3; horizontalIndex++) {
      color += textureSampleLevel(historyColor, linearSampler,
        vec2f(horizontalPositions[horizontalIndex], verticalPositions[verticalIndex]) / settings.sizes.zw, 0.0) *
        horizontalWeights[horizontalIndex] * verticalWeights[verticalIndex];
    }
  }
  return max(color, vec4f(0.0));
}
`;

/** Output-sized reconstruction and temporal resolve into premultiplied RGBA and (1-depth, weight). */
export const temporalUpscaleAccumulate = /* wgsl */ `${TEMPORAL_COMMON}
// Tests whether the history explains the nearest sample of the current frame. The history has
// the output resolution, so it can be read at the exact position of the sample. If the sample
// color is inside the range of the history within one output pixel of that position, the history
// is consistent with the frame, and the fine detail in it is kept. Otherwise the scene changed
// in a way that the velocity does not describe (a moving object or new lighting), and the
// history is clipped. Returns 1 for a consistent history and 0 for an inconsistent one.
fn historyTrust(uv: vec2f, previousUV: vec2f, nearest: vec2i, sampleColor: vec4f) -> f32 {
  let sampleUV = (vec2f(nearest) + vec2f(0.5) - settings.jitterControls.xy) / settings.sizes.xy;
  let center = previousUV + sampleUV - uv;
  let texel = 1.0 / settings.sizes.zw;
  var minimum = vec3f(1e30);
  var maximum = vec3f(-1e30);
  var minimumAlpha = 1e30;
  var maximumAlpha = -1e30;
  for (var vertical = -1; vertical <= 1; vertical++) {
    for (var horizontal = -1; horizontal <= 1; horizontal++) {
      let history = textureSampleLevel(historyColor, linearSampler,
        center + vec2f(f32(horizontal), f32(vertical)) * texel, 0.0);
      let converted = rgbToYCoCg(history.rgb);
      minimum = min(minimum, converted);
      maximum = max(maximum, converted);
      minimumAlpha = min(minimumAlpha, history.a);
      maximumAlpha = max(maximumAlpha, history.a);
    }
  }
  let sample = rgbToYCoCg(sampleColor.rgb);
  let excess = max(max(minimum - sample, sample - maximum), vec3f(0.0));
  // Coverage is tested too: a change of alpha can leave the premultiplied color the same.
  let alphaExcess = max(0.0, max(minimumAlpha - sampleColor.a, sampleColor.a - maximumAlpha));
  let relative = max(
    max(excess.x, max(excess.y, excess.z)) / max(max(sample.x, maximum.x), 0.02), alphaExcess);
  return 1.0 - smoothstep(0.03, 0.12, relative);
}
struct AccumulationOutput {
  @location(0) color: vec4f,
  @location(1) auxiliary: vec2f,
};
@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> AccumulationOutput {
  let uv = fragment.xy / settings.sizes.zw;
  let position = uv * settings.sizes.xy + settings.jitterControls.xy - vec2f(0.5);
  let nearest = vec2i(floor(position + vec2f(0.5)));
  let scale = kernelScale();
  var wideSum = vec4f(0.0);
  var wideWeight = 0.0;
  var narrowSum = vec4f(0.0);
  var narrowWeight = 0.0;
  var minimum = vec4f(1e30);
  var maximum = vec4f(-1e30);
  var minimumYCoCg = vec3f(1e30);
  var maximumYCoCg = vec3f(-1e30);
  var mean = vec3f(0.0);
  var secondMoment = vec3f(0.0);
  for (var vertical = -1; vertical <= 1; vertical++) {
    for (var horizontal = -1; horizontal <= 1; horizontal++) {
      let coordinate = nearest + vec2i(horizontal, vertical);
      let color = textureLoad(colorTexture, renderCoordinate(coordinate), 0);
      let distance = vec2f(coordinate) - position;
      let wide = lanczos2(distance.x) * lanczos2(distance.y);
      wideSum += color * wide;
      wideWeight += wide;
      let narrow = sampleWeight(distance, scale);
      narrowSum += color * narrow;
      narrowWeight += narrow;
      minimum = min(minimum, color);
      maximum = max(maximum, color);
      let converted = rgbToYCoCg(color.rgb);
      minimumYCoCg = min(minimumYCoCg, converted);
      maximumYCoCg = max(maximumYCoCg, converted);
      mean += converted / 9.0;
      secondMoment += converted * converted / 9.0;
    }
  }
  // Without history: the normalized Lanczos-2 reconstruction of this frame, limited to the
  // neighbourhood range so that the negative lobes cannot ring.
  let reconstructed = max(vec4f(0.0), clamp(wideSum / wideWeight, minimum, maximum));
  // With history: only the samples close to this output pixel, with their weight. Over the
  // jitter sequence, each output pixel collects the samples that fall on it, so the result has
  // more detail than one low-resolution frame.
  var current = reconstructed;
  if (narrowWeight > 0.0001) { current = narrowSum / narrowWeight; }
  let deviation = sqrt(max(vec3f(0.0), secondMoment - mean * mean));
  let boxMinimum = max(minimumYCoCg, mean - 1.25 * deviation);
  let boxMaximum = min(maximumYCoCg, mean + 1.25 * deviation);
  var reprojection = reproject(uv);
  var color = reconstructed;
  // A pixel without history starts with the weight of an average frame.
  var weight = max(narrowWeight, 1.0 / (scale * scale));
  // Avoid reading uninitialized history color when reset (new textures are zero initialized).
  if (reprojection.valid) {
    let history = sampleHistory(reprojection.previousUV);
    // Match getLuminanceChange and getForgetting: ignore in-range history and small relative
    // fluctuations, and forget only where a sample of this frame lies close to this pixel.
    let historyY = rgbToYCoCg(history.rgb).x;
    let excess = max(0.0, max(minimumYCoCg.x - historyY, historyY - maximumYCoCg.x));
    let relative = excess / max(0.02, max(abs(historyY), max(abs(minimumYCoCg.x), abs(maximumYCoCg.x))));
    let forgetting = clamp(settings.tuning.x, 0.0, 1.0) * smoothstep(0.1, 0.3, relative) *
      smoothstep(0.5, 0.8, narrowWeight);
    reprojection.count *= 1.0 - forgetting;
    let clipped = vec4f(max(vec3f(0.0), yCoCgToRgb(clipToBox(rgbToYCoCg(history.rgb), boxMinimum, boxMaximum))),
      clamp(history.a, minimum.a, maximum.a));
    var rectified = clipped;
    if (settings.controls.z > 0.5) {
      let nearestColor = textureLoad(colorTexture, renderCoordinate(nearest), 0);
      rectified = mix(clipped, history,
        historyTrust(uv, reprojection.previousUV, nearest, nearestColor) * (1.0 - forgetting));
    }
    color = mix(rectified, current, currentBlend(narrowWeight, reprojection));
    weight = min(min(reprojection.count, maximumWeight()) + narrowWeight, maximumWeight());
  }
  return AccumulationOutput(color, vec2f(1.0 - reprojection.depth, weight));
}
`;

/** Independently derived, bounded, contrast-adaptive five-tap sharpening in the style of RCAS. Debug views never touch the history. */
export const temporalUpscaleSharpen = /* wgsl */ `${TEMPORAL_COMMON}
@group(0) @binding(7) var resolvedColor: texture_2d<f32>;
@fragment fn fragmentMain(@builtin(position) fragment: vec4f) -> @location(0) vec4f {
  let uv = fragment.xy / settings.sizes.zw;
  if (settings.controls.y > 0.0) {
    let reprojection = reproject(uv);
    let rejected = select(1.0, 0.0, reprojection.valid);
    if (settings.controls.y == 1.0) {
      // Red and green: the motion in output pixels, where 2 pixels give full intensity.
      // Blue: no valid history (disocclusion, background or first frame).
      return vec4f(abs(reprojection.velocity.xy) * settings.sizes.zw * 0.5, rejected, 1.0);
    }
    if (settings.controls.y == 2.0) { return vec4f(vec3f(rejected), 1.0); }
    // An estimate from the nearest sample. It does not include the responsiveness rule.
    let distance = fract(uv * settings.sizes.xy + settings.jitterControls.xy) - vec2f(0.5);
    return vec4f(vec3f(1.0 - currentBlend(sampleWeight(distance, kernelScale()), reprojection)), 1.0);
  }
  let coordinate = vec2i(fragment.xy);
  let center = textureLoad(resolvedColor, coordinate, 0);
  let sharpness = clamp(settings.jitterControls.w, 0.0, 1.0);
  if (sharpness == 0.0) { return center; }
  let north = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(0, -1)), 0).rgb;
  let south = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(0, 1)), 0).rgb;
  let west = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(-1, 0)), 0).rgb;
  let east = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(1, 0)), 0).rgb;
  let minimum = min(center.rgb, min(min(north, south), min(west, east)));
  let maximum = max(center.rgb, max(max(north, south), max(west, east)));
  // High-pass form: center + strength * (center - crossMean). The local contrast reduces the
  // strength, so strong edges get less than fine detail. One strength is shared by the RGB
  // channels, so the hue does not change. The result may leave the local range by a quarter
  // of that range at most, and it cannot be negative. This limit lets a thin line gain
  // contrast, and it stops visible halos.
  let detail = center.rgb - (north + south + west + east) * 0.25;
  let contrast = (maximum - minimum) / max(maximum, vec3f(0.00001));
  var strength = sharpness * 2.0 / (1.0 + max(contrast.x, max(contrast.y, contrast.z)));
  let margin = 0.25 * (maximum - minimum);
  let upper = maximum + margin;
  let lower = max(minimum - margin, vec3f(0.0));
  for (var component = 0; component < 3; component++) {
    if (detail[component] > 0.0) {
      strength = min(strength, (upper[component] - center[component]) / detail[component]);
    } else if (detail[component] < 0.0) {
      strength = min(strength, (lower[component] - center[component]) / detail[component]);
    }
  }
  // Preserve alpha; suppress sharpening across coverage edges to retain premultiplication.
  let northAlpha = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(0, -1)), 0).a;
  let southAlpha = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(0, 1)), 0).a;
  let westAlpha = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(-1, 0)), 0).a;
  let eastAlpha = textureLoad(resolvedColor, outputCoordinate(coordinate + vec2i(1, 0)), 0).a;
  if (any(vec4f(northAlpha, southAlpha, westAlpha, eastAlpha) != vec4f(center.a))) { strength = 0.0; }
  return vec4f(max(vec3f(0.0), center.rgb + strength * detail), center.a);
}
`;
