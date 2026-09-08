// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SettingsSchema} from '@deck.gl-community/panels';

export const DEFERRED_RENDERING_BACKGROUND_HTML = `
<p><b>Why deferred rendering scales:</b> forward shading repeats material work for every light that touches every draw. Here the geometry pass writes base color, metalness, roughness, emissive, normal, velocity, and depth once; the fullscreen resolve reuses those screen-space values for lighting.</p>
<p><b>Illumination Lab vs. Visualization City:</b> this example concentrates on advanced deferred light transport: compute-clustered point lights, physically based material response, higher-quality GTAO, colored diffuse bounce, shared screen-space reflections, and clustered participating media. <b>Visualization City</b> instead emphasizes breadth, with directional/spot/point shadow maps, contact shadows, lower-cost SSAO, simple fog, outlines, temporal AA, and motion blur. Both reuse the same SSR implementation.</p>
<p><b>Why clustering wins:</b> a WebGPU compute stage projects each view-space light sphere into a <code>16 × 9 × 24</code> screen/log-depth grid. Each pixel reconstructs its view position from depth, finds one cluster, and normally evaluates only that short local list instead of all 512 lights; a saturated cluster scans all active lights to preserve opaque direct-light correctness.</p>
<p><b>Why GTAO belongs after lighting:</b> a configurable-resolution analytic horizon integral reuses the same depth and view normals to estimate ambient visibility around contacts. G-buffer velocity reprojects the previous AO result, depth rejects disocclusions, and a depth-aware blur removes remaining noise before the AO affects only the isolated ambient contribution, preserving direct light and emissive surfaces.</p>
<p><b>Where colored bounce comes from:</b> cosine-weighted hemisphere rays gather already-lit radiance from nearby visible surfaces. Cyan, magenta, and amber emitter panels transfer their color onto neighboring walls, floors, and matte materials; velocity, linear-depth rejection, and bilateral filtering stabilize the diffuse bounce.</p>
<p><b>Where the reflections come from:</b> stochastic screen-space rays bounce from the same view normals into already-lit scene color. Rough surfaces widen the reflection cone; velocity and depth history stabilize animated highlights, while depth/normal-aware denoising preserves sharp mirrors and produces soft glossy lobes.</p>
<p><b>Why light becomes visible in the air:</b> configurable-resolution view rays integrate exponential height fog, Beer-Lambert extinction, anisotropic directional scattering, and the same compute-clustered point lights used by the opaque resolve. Radial camera-depth visibility follows the projected scene sun to reveal crepuscular god rays behind occluders; camera-aware reprojection, surface velocity, and linear-depth history stabilize the colored light volumes.</p>
<p><b>Why HDR changes the image:</b> floating-point G-buffer and lighting passes retain radiance above SDR white. On compatible displays, a Display P3, <code>rgba16float</code>, extended-tone-mapping canvas preserves those concentrated specular highlights and emissive panels instead of clipping them.</p>
<p><b>Why the highlights feel cinematic:</b> a GPU-resident logarithmic luminance pyramid meters the scene without CPU readback, while persistent exposure history adapts at separate brightening and darkening rates. A successively low-pass-filtered half/quarter/eighth-resolution HDR bloom pyramid spreads emissive and specular energy before the final ACES-style tone map.</p>
<p><b>Work changes shape:</b> the common path becomes roughly geometry + visible pixels × lights in the local cluster, instead of objects × every light. The same G-buffer also feeds GTAO, diffuse global illumination, SSR, and clustered volumes without redrawing material geometry.</p>
<p><b>Correctness at the limit:</b> candidate bits are compacted in stable light-index order. A saturated opaque-lighting cluster falls back to scanning all active lights so direct illumination stays complete. Volumetric integration deliberately remains bounded to a ranked set from each retained cluster list, so overflowed lights can be absent from the participating medium; <b>Cluster Occupancy</b>, <b>Indirect Lighting</b>, <b>Bounce Confidence</b>, <b>Reflections</b>, <b>Volumetric Lighting</b>, <b>Volume Transmittance</b>, and <b>God Rays</b> reveal where transport work, uncertain screen-space hits, atmospheric extinction, or directional light shafts accumulate.</p>
`;

export function makeDeferredRenderingSettingsSchema(
  maximumPointLightCount: number
): SettingsSchema {
  return {
    title: 'Illumination Effects',
    sections: [
      {
        id: 'inspect',
        name: 'G-buffer & Diagnostics',
        description: 'Inspect the actual material, lighting, and transport buffers.',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'debugView',
            label: 'Debug View',
            type: 'select',
            persist: 'none',
            options: [
              'Final',
              'Base Color',
              'Normals',
              'Roughness',
              'Metallic',
              'Emissive',
              'Depth',
              'Cluster Occupancy',
              'Ambient Occlusion',
              'Indirect Lighting',
              'Bounce Confidence',
              'Reflections',
              'Reflection Confidence',
              'Volumetric Lighting',
              'Volume Transmittance',
              'God Rays',
              'HDR Luminance'
            ]
          },
          {
            name: 'exposure',
            label: 'Exposure',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 2.5,
            step: 0.05
          },
          {
            name: 'highlightBoost',
            label: 'HDR Highlight Boost',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 4,
            step: 0.05
          }
        ]
      },
      {
        id: 'camera',
        name: 'Camera',
        description: 'Orbit and inspect the lighting laboratory.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'autoOrbitCamera',
            label: 'Auto Orbit',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'lighting',
        name: 'Clustered Deferred Lighting',
        description: 'One geometry pass, one sun, and hundreds of nearby point lights.',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'pointLightCount',
            label: 'Point Lights',
            type: 'number',
            persist: 'none',
            min: 0,
            max: maximumPointLightCount,
            step: 1
          },
          {
            name: 'sunIntensity',
            label: 'Sun Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'animate',
            label: 'Animate Lights',
            type: 'boolean',
            persist: 'none'
          }
        ]
      },
      {
        id: 'auto-exposure',
        name: 'Adaptive HDR Exposure',
        description: 'GPU luminance metering and temporally adapted camera exposure.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'autoExposureEnabled',
            label: 'Enable Auto Exposure',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'exposureKeyValue',
            label: 'Middle Gray',
            type: 'number',
            persist: 'none',
            min: 0.08,
            max: 1.5,
            step: 0.02
          },
          {
            name: 'minimumExposure',
            label: 'Minimum Exposure',
            type: 'number',
            persist: 'none',
            min: 0.05,
            max: 2,
            step: 0.05
          },
          {
            name: 'maximumExposure',
            label: 'Maximum Exposure',
            type: 'number',
            persist: 'none',
            min: 0.5,
            max: 6,
            step: 0.1
          },
          {
            name: 'exposureBrightenSpeed',
            label: 'Adapt to Darkness',
            type: 'number',
            persist: 'none',
            min: 0.1,
            max: 8,
            step: 0.1
          },
          {
            name: 'exposureDarkenSpeed',
            label: 'Adapt to Light',
            type: 'number',
            persist: 'none',
            min: 0.1,
            max: 8,
            step: 0.1
          }
        ]
      },
      {
        id: 'cinematic-bloom',
        name: 'Cinematic HDR Bloom',
        description: 'Multiscale, unclipped glow from emissive and specular highlights.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'bloomEnabled',
            label: 'Enable Bloom',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'bloomThreshold',
            label: 'Highlight Threshold',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          },
          {
            name: 'bloomIntensity',
            label: 'Glow Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'bloomRadius',
            label: 'Glow Radius',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 24,
            step: 1
          },
          {
            name: 'bloomResolution',
            label: 'Pyramid Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          }
        ]
      },
      {
        id: 'ambient-occlusion',
        name: 'Ground-truth Ambient Occlusion · GTAO',
        description: 'Horizon-based contact visibility with temporal stabilization.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'ambientOcclusionEnabled',
            label: 'Enable GTAO',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'ambientOcclusionResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'ambientOcclusionRadius',
            label: 'GTAO Radius',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 8,
            step: 0.1
          },
          {
            name: 'ambientOcclusionIntensity',
            label: 'GTAO Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 8,
            step: 0.1
          },
          {
            name: 'ambientOcclusionStrength',
            label: 'GTAO Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.02
          }
        ]
      },
      {
        id: 'global-illumination',
        name: 'Diffuse Global Illumination · SSGI',
        description: 'Colored light bouncing between visible surfaces.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'globalIlluminationEnabled',
            label: 'Enable Diffuse Bounce',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'globalIlluminationResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'globalIlluminationRadius',
            label: 'Bounce Radius',
            type: 'number',
            persist: 'none',
            min: 0.5,
            max: 12,
            step: 0.1
          },
          {
            name: 'globalIlluminationIntensity',
            label: 'Bounce Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'globalIlluminationStrength',
            label: 'Bounce Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'globalIlluminationRayCount',
            label: 'Bounce Rays',
            type: 'number',
            persist: 'none',
            min: 1,
            max: 12,
            step: 1
          },
          {
            name: 'globalIlluminationStepCount',
            label: 'Ray Steps',
            type: 'number',
            persist: 'none',
            min: 2,
            max: 12,
            step: 1
          },
          {
            name: 'globalIlluminationHistoryWeight',
            label: 'Bounce History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      },
      {
        id: 'atmosphere',
        name: 'Clustered Volumetric Lighting',
        description: 'Colored light halos, directional shafts, and atmospheric extinction.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'atmosphereEnabled',
            label: 'Enable Volumetric Lighting',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'atmosphereResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'atmosphereDensity',
            label: 'Fog Density',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.2,
            step: 0.005
          },
          {
            name: 'atmosphereHeightFalloff',
            label: 'Height Falloff',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1.5,
            step: 0.05
          },
          {
            name: 'atmosphereAnisotropy',
            label: 'Scattering Direction',
            type: 'number',
            persist: 'none',
            min: -0.7,
            max: 0.8,
            step: 0.05
          },
          {
            name: 'atmospherePointLightIntensity',
            label: 'Light Halos',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
            step: 0.1
          },
          {
            name: 'atmosphereSunIntensity',
            label: 'Sun Shafts',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 5,
            step: 0.1
          },
          {
            name: 'atmosphereShadowStrength',
            label: 'Shaft Shadows',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.05
          },
          {
            name: 'atmosphereStrength',
            label: 'Atmosphere Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'atmosphereSampleCount',
            label: 'Volume Steps',
            type: 'number',
            persist: 'none',
            min: 3,
            max: 20,
            step: 1
          },
          {
            name: 'atmosphereHistoryWeight',
            label: 'Volume History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      },
      {
        id: 'god-rays',
        name: 'Crepuscular God Rays',
        description: 'Depth-occluded sunlight shafts through the participating medium.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'godRaysEnabled',
            label: 'Enable God Rays',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'godRayIntensity',
            label: 'Ray Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 6,
            step: 0.1
          },
          {
            name: 'godRayDensity',
            label: 'Ray Reach',
            type: 'number',
            persist: 'none',
            min: 0.2,
            max: 1.2,
            step: 0.05
          },
          {
            name: 'godRayDecay',
            label: 'Ray Persistence',
            type: 'number',
            persist: 'none',
            min: 0.7,
            max: 1,
            step: 0.01
          },
          {
            name: 'godRaySampleCount',
            label: 'Ray Samples',
            type: 'number',
            persist: 'none',
            min: 3,
            max: 32,
            step: 1
          }
        ]
      },
      {
        id: 'reflections',
        name: 'Screen-space Reflections · SSR',
        description: 'Temporally stabilized mirror and glossy reflections.',
        initiallyCollapsed: true,
        settings: [
          {
            name: 'reflectionEnabled',
            label: 'Enable Reflections',
            type: 'boolean',
            persist: 'none'
          },
          {
            name: 'reflectionResolution',
            label: 'Buffer Resolution',
            type: 'number',
            persist: 'none',
            min: 0.25,
            max: 1,
            step: 0.25
          },
          {
            name: 'reflectionStrength',
            label: 'SSR Strength',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 2,
            step: 0.05
          },
          {
            name: 'reflectionIntensity',
            label: 'SSR Intensity',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 3,
            step: 0.05
          },
          {
            name: 'reflectionMaxDistance',
            label: 'SSR Distance',
            type: 'number',
            persist: 'none',
            min: 4,
            max: 80,
            step: 1
          },
          {
            name: 'reflectionSampleCount',
            label: 'SSR Samples',
            type: 'number',
            persist: 'none',
            min: 8,
            max: 96,
            step: 1
          },
          {
            name: 'reflectionHistoryWeight',
            label: 'SSR History',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 0.97,
            step: 0.01
          }
        ]
      }
    ]
  };
}
