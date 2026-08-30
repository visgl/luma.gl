// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const IMPLICIT_SURFACE_RENDERER_WGSL = /* wgsl */ `\
const IMPLICIT_SAMPLE_COUNT: u32 = 112u;
const ROOT_REFINEMENT_COUNT: u32 = 12u;
const NEWTON_REFINEMENT_COUNT: u32 = 7u;
const NO_HIT: f32 = 1e20;

fn intersectBoundingSphere(origin: vec3f, direction: vec3f, radius: f32) -> vec2f {
  let originProjection = dot(origin, direction);
  let discriminant = originProjection * originProjection - dot(origin, origin) + radius * radius;
  if (discriminant < 0.0) {
    return vec2f(NO_HIT, -NO_HIT);
  }
  let root = sqrt(discriminant);
  return vec2f(max(0.0, -originProjection - root), -originProjection + root);
}

fn normalizedResidual(field: vec4f) -> f32 {
  return abs(field.w) / max(length(field.xyz), 1e-5);
}

fn refineSignChange(
  origin: vec3f,
  direction: vec3f,
  nearDistance: f32,
  farDistance: f32
) -> f32 {
  var lowerDistance = nearDistance;
  var upperDistance = farDistance;
  var lowerValue = evaluateImplicitField(origin + direction * lowerDistance).w;
  var upperValue = evaluateImplicitField(origin + direction * upperDistance).w;

  for (var iteration = 0u; iteration < ROOT_REFINEMENT_COUNT; iteration++) {
    let width = upperDistance - lowerDistance;
    let midpoint = 0.5 * (lowerDistance + upperDistance);
    let denominator = upperValue - lowerValue;
    var candidate = midpoint;
    if (abs(denominator) > 1e-8) {
      candidate = lowerDistance - lowerValue * width / denominator;
    }
    candidate = clamp(candidate, lowerDistance + 0.1 * width, upperDistance - 0.1 * width);
    let candidateValue = evaluateImplicitField(origin + direction * candidate).w;
    if ((lowerValue <= 0.0 && candidateValue >= 0.0) ||
        (lowerValue >= 0.0 && candidateValue <= 0.0)) {
      upperDistance = candidate;
      upperValue = candidateValue;
    } else {
      lowerDistance = candidate;
      lowerValue = candidateValue;
    }
  }
  return 0.5 * (lowerDistance + upperDistance);
}

fn refineNearRoot(
  origin: vec3f,
  direction: vec3f,
  initialDistance: f32,
  nearDistance: f32,
  farDistance: f32
) -> vec2f {
  var distance = initialDistance;
  let maximumStep = max((farDistance - nearDistance) * 0.08, 1e-4);
  for (var iteration = 0u; iteration < NEWTON_REFINEMENT_COUNT; iteration++) {
    let field = evaluateImplicitField(origin + direction * distance);
    let rayDerivative = dot(field.xyz, direction);
    if (abs(rayDerivative) < 1e-7) {
      break;
    }
    let step = clamp(field.w / rayDerivative, -maximumStep, maximumStep);
    distance = clamp(distance - step, nearDistance, farDistance);
  }
  let field = evaluateImplicitField(origin + direction * distance);
  return vec2f(distance, normalizedResidual(field));
}

fn intersectImplicitSurface(origin: vec3f, direction: vec3f, radius: f32) -> f32 {
  let interval = intersectBoundingSphere(origin, direction, radius);
  if (interval.y <= interval.x) {
    return NO_HIT;
  }

  let sampleStep = (interval.y - interval.x) / f32(IMPLICIT_SAMPLE_COUNT);
  var bestDistance = NO_HIT;
  var previousPreviousResidual = NO_HIT;
  var previousResidual = NO_HIT;
  var previousDistance = interval.x;
  var previousField = evaluateImplicitField(origin + direction * previousDistance);

  for (var sampleIndex = 1u; sampleIndex <= IMPLICIT_SAMPLE_COUNT; sampleIndex++) {
    let distance = interval.x + f32(sampleIndex) * sampleStep;
    let field = evaluateImplicitField(origin + direction * distance);
    let residual = normalizedResidual(field);

    if ((previousField.w <= 0.0 && field.w >= 0.0) ||
        (previousField.w >= 0.0 && field.w <= 0.0)) {
      let refinedDistance = refineSignChange(
        origin,
        direction,
        previousDistance,
        distance
      );
      if (refinedDistance < bestDistance) {
        bestDistance = refinedDistance;
      }
    }

    if (previousResidual < previousPreviousResidual &&
        previousResidual <= residual &&
        previousResidual < sampleStep * 0.35) {
      let refined = refineNearRoot(
        origin,
        direction,
        previousDistance,
        max(interval.x, previousDistance - sampleStep),
        min(interval.y, previousDistance + sampleStep)
      );
      if (refined.y < max(2e-4, sampleStep * 0.012) && refined.x < bestDistance) {
        bestDistance = refined.x;
      }
    }

    previousPreviousResidual = previousResidual;
    previousResidual = residual;
    previousDistance = distance;
    previousField = field;
  }
  return bestDistance;
}

fn materialColor(index: f32, point: vec3f) -> vec3f {
  let shimmer = 0.08 * sin(vec3f(2.1, 2.7, 3.2) * dot(point, vec3f(1.1, 0.8, 1.3)));
  if (index < 1.5) {
    return vec3f(0.18, 0.55, 1.15) + shimmer;
  } else if (index < 3.5) {
    return vec3f(0.85, 0.2, 0.72) + shimmer;
  } else if (index < 5.5) {
    return vec3f(0.15, 0.85, 0.68) + shimmer;
  } else if (index < 7.5) {
    return vec3f(1.05, 0.24, 0.34) + shimmer;
  }
  return vec3f(0.68, 0.34, 1.12) + shimmer;
}

fn acesFilm(color: vec3f) -> vec3f {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), vec3f(0.0), vec3f(1.0));
}

fn shadeSurface(point: vec3f, rayDirection: vec3f, field: vec4f) -> vec3f {
  var normal = normalize(field.xyz);
  if (dot(normal, rayDirection) > 0.0) {
    normal = -normal;
  }
  let viewDirection = -rayDirection;
  let keyDirection = normalize(vec3f(-0.55, 0.72, 0.42));
  let rimDirection = normalize(vec3f(0.72, 0.2, -0.65));
  let halfDirection = normalize(keyDirection + viewDirection);
  let diffuse = max(dot(normal, keyDirection), 0.0);
  let fill = 0.22 + 0.22 * max(dot(normal, rimDirection), 0.0);
  let fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 4.0);
  let specular = pow(max(dot(normal, halfDirection), 0.0), 96.0) * 7.5;
  let broadSpecular = pow(max(dot(normal, halfDirection), 0.0), 18.0) * 0.9;
  let baseColor = materialColor(implicitSurface.variety.x, point);
  var color = baseColor * (fill + 1.2 * diffuse);
  color += vec3f(1.0, 0.9, 1.15) * specular;
  color += vec3f(0.35, 0.65, 1.2) * (broadSpecular + 0.75 * fresnel);

  if (implicitSurface.variety.w > 0.5) {
    let gradientMagnitude = length(field.xyz);
    let singularity = 1.0 - smoothstep(0.025, 0.12, gradientMagnitude);
    color = mix(color, vec3f(5.0, 0.03, 0.08), singularity * 0.9);
  }
  return color * implicitSurface.lighting.x;
}

fn backgroundColor(direction: vec3f) -> vec3f {
  let horizon = pow(max(0.0, 1.0 - abs(direction.y)), 3.0);
  let glow = pow(max(dot(direction, normalize(vec3f(-0.4, 0.45, -0.8))), 0.0), 24.0);
  return vec3f(0.002, 0.004, 0.012) + horizon * vec3f(0.012, 0.025, 0.06) +
    glow * vec3f(0.12, 0.06, 0.18);
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let farPosition = implicitSurface.inverseViewProjectionMatrix * vec4f(inputs.position, 1.0, 1.0);
  let farWorld = farPosition.xyz / farPosition.w;
  let origin = implicitSurface.cameraPosition.xyz;
  let direction = normalize(farWorld - origin);
  let distance = intersectImplicitSurface(origin, direction, implicitSurface.variety.z);

  var linearColor = backgroundColor(direction);
  if (distance < NO_HIT * 0.5) {
    let point = origin + direction * distance;
    let field = evaluateImplicitField(point);
    linearColor = shadeSurface(point, direction, field);
  }
  let displayColor = pow(acesFilm(linearColor), vec3f(1.0 / 2.2));
  return vec4f(displayColor, 1.0);
}
`;

/**
 * Assembles a generic implicit-surface raycaster with a caller-supplied WGSL field function.
 *
 * The supplied source must define evaluateImplicitField(point), returning gradient.xyz and f in w.
 */
export function buildImplicitSurfaceShader(fieldSource: string): string {
  return `${fieldSource}\n${IMPLICIT_SURFACE_RENDERER_WGSL}`;
}
