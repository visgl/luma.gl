import {z} from 'zod';

const numberSchema = z.number().finite();
const nonnegativeNumberSchema = numberSchema.nonnegative();
const unitNumberSchema = numberSchema.min(0).max(1);
const positiveNumberSchema = numberSchema.positive();
const identifierSchema = z.string().min(1);

export const ANARIVector3Schema = z
  .tuple([numberSchema, numberSchema, numberSchema])
  .describe('Three-component XYZ position, direction, scale, or linear RGB color.');

export const ANARIVector4Schema = z
  .tuple([numberSchema, numberSchema, numberSchema, numberSchema])
  .describe('Four-component RGBA color.');

export const ANARIMatrix4Schema = z
  .array(numberSchema)
  .length(16)
  .describe('A 4×4 transform matrix stored in column-major order.');

export const ANARIGeometryGeneratorSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({
      '@@type': z.literal('torus'),
      majorRadius: positiveNumberSchema.optional(),
      minorRadius: positiveNumberSchema.optional(),
      majorSegments: z.number().int().min(3).optional(),
      minorSegments: z.number().int().min(3).optional()
    }),
    z.strictObject({
      '@@type': z.literal('crystal'),
      radius: positiveNumberSchema.optional(),
      height: positiveNumberSchema.optional(),
      sides: z.number().int().min(3).optional()
    }),
    z.strictObject({
      '@@type': z.literal('prism'),
      radius: positiveNumberSchema.optional(),
      height: positiveNumberSchema.optional(),
      sides: z.number().int().min(3).optional(),
      bevel: nonnegativeNumberSchema.optional()
    })
  ])
  .describe('Optional procedural triangle-mesh generator.');

export const ANARIGeometrySchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({
      '@@type': z.literal('triangle'),
      'vertex.position': z.array(numberSchema).optional(),
      'vertex.normal': z.array(numberSchema).optional(),
      'vertex.attribute0': z.array(numberSchema).optional(),
      'vertex.attribute1': z.array(numberSchema).optional(),
      'primitive.index': z.array(z.number().int().nonnegative()).optional(),
      generator: ANARIGeometryGeneratorSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('sphere'),
      radius: positiveNumberSchema.optional(),
      segments: z.number().int().min(3).optional()
    }),
    z.strictObject({
      '@@type': z.literal('cylinder'),
      radius: positiveNumberSchema.optional(),
      height: positiveNumberSchema.optional(),
      segments: z.number().int().min(3).optional()
    }),
    z.strictObject({
      '@@type': z.literal('cone'),
      radius: positiveNumberSchema.optional(),
      height: positiveNumberSchema.optional(),
      segments: z.number().int().min(3).optional()
    }),
    z.strictObject({
      '@@type': z.literal('quad'),
      width: positiveNumberSchema.optional(),
      height: positiveNumberSchema.optional()
    })
  ])
  .describe('ANARI geometry declaration selected by its @@type subtype.');

const materialProperties = {
  color: z.union([ANARIVector3Schema, ANARIVector4Schema]).optional(),
  baseColor: z.union([ANARIVector3Schema, ANARIVector4Schema]).optional(),
  emissive: ANARIVector3Schema.optional(),
  emissiveStrength: nonnegativeNumberSchema.optional(),
  metallic: unitNumberSchema.optional(),
  roughness: unitNumberSchema.optional(),
  opacity: unitNumberSchema.optional(),
  alphaMode: z.enum(['opaque', 'blend']).optional(),
  clearcoat: unitNumberSchema.optional(),
  clearcoatRoughness: unitNumberSchema.optional(),
  iridescence: unitNumberSchema.optional(),
  transmission: unitNumberSchema.optional(),
  indexOfRefraction: positiveNumberSchema.optional(),
  sheenColor: ANARIVector3Schema.optional(),
  sheenRoughness: unitNumberSchema.optional(),
  normalScale: nonnegativeNumberSchema.optional(),
  occlusionStrength: unitNumberSchema.optional(),
  baseColorTexture: identifierSchema.optional(),
  normalTexture: identifierSchema.optional(),
  metallicRoughnessTexture: identifierSchema.optional(),
  emissiveTexture: identifierSchema.optional(),
  occlusionTexture: identifierSchema.optional(),
  clearcoatTexture: identifierSchema.optional(),
  transmissionTexture: identifierSchema.optional(),
  sheenColorTexture: identifierSchema.optional()
};

export const ANARITextureSchema = z
  .strictObject({
    source: identifierSchema,
    colorSpace: z.enum(['srgb', 'linear']).optional(),
    transform: z
      .tuple([
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema,
        numberSchema
      ])
      .optional()
  })
  .describe('A retained 2D image sampler with optional color space and UV transform.');

export const ANARIMaterialSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({'@@type': z.literal('matte'), ...materialProperties}),
    z.strictObject({'@@type': z.literal('physicallyBased'), ...materialProperties})
  ])
  .describe('Matte or physically based ANARI material properties.');

export const ANARIAnimationSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({
      '@@type': z.literal('orbit'),
      center: ANARIVector3Schema.optional(),
      radius: nonnegativeNumberSchema.optional(),
      speed: numberSchema.optional(),
      phase: numberSchema.optional(),
      height: numberSchema.optional(),
      inclination: numberSchema.optional(),
      verticalFrequency: numberSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('bob'),
      amplitude: numberSchema.optional(),
      speed: numberSchema.optional(),
      phase: numberSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('spin'),
      axis: z.enum(['x', 'y', 'z']).optional(),
      speed: numberSchema.optional(),
      phase: numberSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('wobble'),
      axis: z.enum(['x', 'y', 'z']).optional(),
      amplitude: numberSchema.optional(),
      speed: numberSchema.optional(),
      phase: numberSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('pulse'),
      amplitude: numberSchema.optional(),
      speed: numberSchema.optional(),
      phase: numberSchema.optional()
    }),
    z.strictObject({
      '@@type': z.literal('follow'),
      target: identifierSchema,
      offset: ANARIVector3Schema.optional()
    })
  ])
  .describe('A retained instance or light animation.');

const lightProperties = {
  '@@id': identifierSchema,
  color: ANARIVector3Schema.optional(),
  direction: ANARIVector3Schema.optional(),
  position: ANARIVector3Schema.optional(),
  intensity: nonnegativeNumberSchema.optional(),
  irradiance: nonnegativeNumberSchema.optional(),
  radiance: nonnegativeNumberSchema.optional(),
  openingAngle: positiveNumberSchema.optional(),
  falloffAngle: nonnegativeNumberSchema.optional(),
  animation: ANARIAnimationSchema.optional()
};

export const ANARILightSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({'@@type': z.literal('ambient'), ...lightProperties}),
    z.strictObject({'@@type': z.literal('directional'), ...lightProperties}),
    z.strictObject({'@@type': z.literal('point'), ...lightProperties}),
    z.strictObject({'@@type': z.literal('spot'), ...lightProperties})
  ])
  .describe('Ambient, directional, point, or spot ANARI lighting.');

const cameraProperties = {
  position: ANARIVector3Schema.optional(),
  direction: ANARIVector3Schema.optional(),
  target: ANARIVector3Schema.optional(),
  up: ANARIVector3Schema.optional(),
  aspect: positiveNumberSchema.optional(),
  fovy: positiveNumberSchema.optional(),
  height: positiveNumberSchema.optional(),
  near: positiveNumberSchema.optional(),
  far: positiveNumberSchema.optional(),
  orbit: z.strictObject({speed: numberSchema.optional()}).optional()
};

export const ANARICameraSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({'@@type': z.literal('perspective'), ...cameraProperties}),
    z.strictObject({'@@type': z.literal('orthographic'), ...cameraProperties})
  ])
  .describe('Perspective or orthographic camera and optional orbital behavior.');

const rendererProperties = {
  background: ANARIVector4Schema.optional(),
  ambientRadiance: nonnegativeNumberSchema.optional(),
  exposure: positiveNumberSchema.optional(),
  bloomIntensity: nonnegativeNumberSchema.optional(),
  bloomThreshold: nonnegativeNumberSchema.optional(),
  bloomRadius: nonnegativeNumberSchema.optional(),
  fogColor: ANARIVector3Schema.optional(),
  fogDensity: nonnegativeNumberSchema.optional()
};

export const ANARIRendererSchema = z
  .discriminatedUnion('@@type', [
    z.strictObject({'@@type': z.literal('default'), ...rendererProperties}),
    z.strictObject({'@@type': z.literal('debugNormals'), ...rendererProperties}),
    z.strictObject({'@@type': z.literal('debugDepth'), ...rendererProperties})
  ])
  .describe('Beauty or diagnostic renderer settings, including HDR and bloom controls.');

export const ANARISurfaceSchema = z
  .strictObject({geometry: identifierSchema, material: identifierSchema})
  .describe('A named geometry/material pairing.');

export const ANARIGroupSchema = z
  .strictObject({
    surfaces: z.array(identifierSchema),
    lights: z.array(identifierSchema).optional()
  })
  .describe('Reusable retained surfaces and optional lights.');

export const ANARIInstanceSchema = z
  .strictObject({
    '@@id': identifierSchema,
    group: identifierSchema.optional(),
    surface: identifierSchema.optional(),
    position: ANARIVector3Schema.optional(),
    rotation: ANARIVector3Schema.optional(),
    scale: ANARIVector3Schema.optional(),
    matrix: ANARIMatrix4Schema.optional(),
    animation: ANARIAnimationSchema.optional(),
    animations: z.array(ANARIAnimationSchema).optional()
  })
  .describe('One retained transform instance referencing a surface or reusable group.');

export const ANARIStarfieldSchema = z
  .strictObject({
    '@@id': identifierSchema,
    '@@type': z.literal('starfield'),
    surface: identifierSchema,
    count: z.number().int().nonnegative(),
    radius: positiveNumberSchema,
    seed: z.number().int().optional()
  })
  .describe('A deterministic distribution of retained background-star instances.');

const ANARIWorldSchema = z.strictObject({
  surfaces: z.array(identifierSchema).optional(),
  instances: z.array(identifierSchema).optional(),
  lights: z.array(identifierSchema).optional()
});

export const ANARISceneSchema = z
  .strictObject({
    version: z.literal(1).describe('ANARI JSON scene format version.'),
    name: identifierSchema.describe('Human-readable scene title.'),
    description: z.string().optional(),
    camera: ANARICameraSchema,
    renderer: ANARIRendererSchema,
    geometries: z.record(identifierSchema, ANARIGeometrySchema),
    textures: z.record(identifierSchema, ANARITextureSchema).optional(),
    materials: z.record(identifierSchema, ANARIMaterialSchema),
    surfaces: z.record(identifierSchema, ANARISurfaceSchema),
    groups: z.record(identifierSchema, ANARIGroupSchema).optional(),
    instances: z.array(ANARIInstanceSchema).optional(),
    distributions: z.array(ANARIStarfieldSchema).optional(),
    lights: z.array(ANARILightSchema).optional(),
    world: ANARIWorldSchema.optional()
  })
  .superRefine((scene, context) => {
    const textureNames = [
      'baseColorTexture',
      'normalTexture',
      'metallicRoughnessTexture',
      'emissiveTexture',
      'occlusionTexture',
      'clearcoatTexture',
      'transmissionTexture',
      'sheenColorTexture'
    ] as const;
    for (const [identifier, material] of Object.entries(scene.materials)) {
      for (const textureName of textureNames) {
        const textureIdentifier = material[textureName];
        if (textureIdentifier && !(textureIdentifier in (scene.textures || {}))) {
          context.addIssue({
            code: 'custom',
            path: ['materials', identifier, textureName],
            message: `Unknown texture "${textureIdentifier}".`
          });
        }
      }
    }

    for (const [identifier, surface] of Object.entries(scene.surfaces)) {
      if (!(surface.geometry in scene.geometries)) {
        context.addIssue({
          code: 'custom',
          path: ['surfaces', identifier, 'geometry'],
          message: `Unknown geometry "${surface.geometry}".`
        });
      }
      if (!(surface.material in scene.materials)) {
        context.addIssue({
          code: 'custom',
          path: ['surfaces', identifier, 'material'],
          message: `Unknown material "${surface.material}".`
        });
      }
    }

    const lightIdentifiers = new Set((scene.lights || []).map(light => light['@@id']));
    for (const [identifier, group] of Object.entries(scene.groups || {})) {
      for (const [surfaceIndex, surface] of group.surfaces.entries()) {
        if (!(surface in scene.surfaces)) {
          context.addIssue({
            code: 'custom',
            path: ['groups', identifier, 'surfaces', surfaceIndex],
            message: `Unknown surface "${surface}".`
          });
        }
      }
      for (const [lightIndex, light] of (group.lights || []).entries()) {
        if (!lightIdentifiers.has(light)) {
          context.addIssue({
            code: 'custom',
            path: ['groups', identifier, 'lights', lightIndex],
            message: `Unknown light "${light}".`
          });
        }
      }
    }

    const instanceIdentifiers = new Set<string>();
    for (const [instanceIndex, instance] of (scene.instances || []).entries()) {
      if (instanceIdentifiers.has(instance['@@id'])) {
        context.addIssue({
          code: 'custom',
          path: ['instances', instanceIndex, '@@id'],
          message: `Duplicate instance "${instance['@@id']}".`
        });
      }
      instanceIdentifiers.add(instance['@@id']);

      if (!instance.group && !instance.surface) {
        context.addIssue({
          code: 'custom',
          path: ['instances', instanceIndex],
          message: 'Instances must reference a group or surface.'
        });
      }
      if (instance.group && !(instance.group in (scene.groups || {}))) {
        context.addIssue({
          code: 'custom',
          path: ['instances', instanceIndex, 'group'],
          message: `Unknown group "${instance.group}".`
        });
      }
      if (instance.surface && !(instance.surface in scene.surfaces)) {
        context.addIssue({
          code: 'custom',
          path: ['instances', instanceIndex, 'surface'],
          message: `Unknown surface "${instance.surface}".`
        });
      }
    }

    for (const [distributionIndex, distribution] of (scene.distributions || []).entries()) {
      if (!(distribution.surface in scene.surfaces)) {
        context.addIssue({
          code: 'custom',
          path: ['distributions', distributionIndex, 'surface'],
          message: `Unknown surface "${distribution.surface}".`
        });
      }
    }

    for (const [lightIndex, light] of (scene.lights || []).entries()) {
      if (
        light.animation?.['@@type'] === 'follow' &&
        !instanceIdentifiers.has(light.animation.target)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['lights', lightIndex, 'animation', 'target'],
          message: `Unknown follow target "${light.animation.target}".`
        });
      }
    }
  })
  .describe('A complete retained ANARI scene expressed as editable JSON.');

export const ANARI_SCENE_JSON_SCHEMA = {
  $id: 'https://luma.gl/schemas/anari-scene.json',
  title: 'Experimental luma.gl ANARI scene',
  ...z.toJSONSchema(ANARISceneSchema, {target: 'draft-07', reused: 'ref'})
};

export type ANARISceneDescription = z.infer<typeof ANARISceneSchema>;
