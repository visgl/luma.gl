import {Buffer, type Device, type Framebuffer, Texture} from '@luma.gl/core';
import {bloomShaderPassPipeline} from '@luma.gl/effects';
import {
  ConeGeometry,
  CylinderGeometry,
  Geometry,
  Material,
  MaterialFactory,
  Model,
  PlaneGeometry,
  ShaderInputs,
  ShaderPassRenderer,
  SphereGeometry
} from '@luma.gl/engine';
import {type Light, lighting} from '@luma.gl/shadertools';
import {Matrix4, type NumberArray9} from '@math.gl/core';
import {
  ANARIArray,
  ANARIGroup,
  type ANARICamera,
  type ANARIFrame,
  type ANARIGeometry,
  type ANARIInstance,
  type ANARILight,
  type ANARIMaterial,
  type ANARISampler,
  type ANARISurface,
  type ANARIWorld
} from './anari-objects';
import {
  ANARI_FRAGMENT_SHADER,
  ANARI_VERTEX_SHADER,
  ANARI_WGSL_SHADER,
  anariAppModule,
  anariMaterialModule,
  type ANARIAppUniforms,
  type ANARIMaterialUniforms
} from './anari-shaders';
import type {ANARIFrameStatistics, ANARIVector3} from './anari-types';

type CompiledSurface = {
  surface: ANARISurface;
  geometry: ANARIGeometry;
  geometryVersion: number;
  materialVersion: number;
  placementCount: number;
  model: Model;
  material: Material<{anariMaterial: ANARIMaterialUniforms}, ANARIMaterialBindings>;
  transformBuffers: Buffer[];
  transforms: Float32Array[];
  triangleCount: number;
  textureSignature: string;
};

type ANARIMaterialBindings = {
  anariBaseColorTexture: Texture;
  anariNormalTexture: Texture;
  anariMetallicRoughnessTexture: Texture;
  anariEmissiveTexture: Texture;
  anariOcclusionTexture: Texture;
  anariClearcoatTexture: Texture;
  anariTransmissionTexture: Texture;
  anariSheenColorTexture: Texture;
};

type SurfacePlacement = {
  surface: ANARISurface;
  transform: readonly number[];
};

type FrameResources = {
  compiledSurfaces: Map<string, CompiledSurface>;
  framebuffer: Framebuffer | null;
  colorTexture: Texture | null;
  bloomRenderer: ShaderPassRenderer | null;
};

const IDENTITY_MATRIX = new Matrix4();
const IDENTITY_UV_TRANSFORM = [1, 0, 0, 0, 1, 0, 0, 0, 1] as const;

export class ANARIRenderingRuntime {
  private readonly device: Device;
  private readonly materialFactory: MaterialFactory<
    {anariMaterial: ANARIMaterialUniforms},
    ANARIMaterialBindings
  >;
  private readonly fallbackWhiteTexture: Texture;
  private readonly fallbackNormalTexture: Texture;
  private readonly fallbackBlackTexture: Texture;
  private readonly frames = new Map<ANARIFrame, FrameResources>();

  constructor(device: Device) {
    this.device = device;
    this.materialFactory = new MaterialFactory(device, {modules: [anariMaterialModule]});
    this.fallbackWhiteTexture = createFallbackTexture(device, 'white', [255, 255, 255, 255]);
    this.fallbackNormalTexture = createFallbackTexture(device, 'normal', [128, 128, 255, 255]);
    this.fallbackBlackTexture = createFallbackTexture(device, 'black', [0, 0, 0, 255]);
  }

  render(frame: ANARIFrame): ANARIFrameStatistics {
    const world = frame.getParameter('world');
    const camera = frame.getParameter('camera');
    const renderer = frame.getParameter('renderer');
    if (!world || !camera || !renderer) {
      return {surfaceCount: 0, instanceCount: 0, drawCount: 0, triangleCount: 0};
    }

    const frameResources = this.getFrameResources(frame);
    const placements = collectSurfacePlacements(world);
    const placementsBySurface = groupPlacementsBySurface(placements);
    const lights = collectLights(world, renderer.getParameter('ambientRadiance') ?? 0.12);
    const cameraUniforms = getCameraUniforms(camera, frame);
    const rendererSubtype = renderer.subtype;
    const renderMode =
      rendererSubtype === 'debugNormals' ? 1 : rendererSubtype === 'debugDepth' ? 2 : 0;
    const appUniforms: ANARIAppUniforms = {
      ...cameraUniforms,
      exposure: renderer.getParameter('exposure') ?? 1.35,
      fogColor: renderer.getParameter('fogColor') ?? [0.025, 0.035, 0.075],
      fogDensity: renderer.getParameter('fogDensity') ?? 0,
      renderMode,
      highDynamicRange: this.device.preferredColorFormat === 'rgba16float' ? 1 : 0,
      time: typeof performance !== 'undefined' ? performance.now() * 0.001 : 0
    };

    const liveSurfaceIdentifiers = new Set<string>();
    let triangleCount = 0;
    for (const [surface, surfacePlacements] of placementsBySurface) {
      const compiledSurface = this.getCompiledSurface(frameResources, surface, surfacePlacements);
      liveSurfaceIdentifiers.add(surface.id);
      updateTransforms(compiledSurface, surfacePlacements);
      updateMaterial(compiledSurface.material, surface.getParameter('material')!);
      compiledSurface.model.shaderInputs.setProps({
        anariApp: appUniforms,
        lighting: {lights, useByteColors: false}
      });
      compiledSurface.model.predraw(this.device.commandEncoder);
      triangleCount += compiledSurface.triangleCount * surfacePlacements.length;
    }

    for (const [surfaceIdentifier, compiledSurface] of frameResources.compiledSurfaces) {
      if (!liveSurfaceIdentifiers.has(surfaceIdentifier)) {
        destroyCompiledSurface(compiledSurface);
        frameResources.compiledSurfaces.delete(surfaceIdentifier);
      }
    }

    const bloomIntensity = renderMode === 0 ? (renderer.getParameter('bloomIntensity') ?? 0) : 0;
    const framebuffer = bloomIntensity > 0 ? this.getFramebuffer(frame, frameResources) : undefined;
    const background = renderer.getParameter('background') ?? [0.015, 0.018, 0.038, 1];
    const renderPass = this.device.beginRenderPass({
      id: `anari-${frame.id}`,
      framebuffer,
      clearColor: [background[0], background[1], background[2], background[3]],
      clearDepth: 1
    });
    let drawCount = 0;
    for (const compiledSurface of frameResources.compiledSurfaces.values()) {
      if (compiledSurface.model.draw(renderPass)) {
        drawCount++;
      }
    }
    renderPass.end();

    if (framebuffer && bloomIntensity > 0) {
      const bloomRenderer = this.getBloomRenderer(frameResources);
      const size = getFrameSize(frame, this.device);
      bloomRenderer.resize(size);
      bloomRenderer.renderToScreen({
        sourceTexture: framebuffer.colorAttachments[0].texture,
        uniforms: {
          bloomExtract: {threshold: renderer.getParameter('bloomThreshold') ?? 0.62},
          bloomBlur: {radius: renderer.getParameter('bloomRadius') ?? 7},
          bloomComposite: {intensity: bloomIntensity}
        }
      });
    }

    return {
      surfaceCount: placementsBySurface.size,
      instanceCount: placements.length,
      drawCount,
      triangleCount
    };
  }

  destroyFrame(frame: ANARIFrame): void {
    const frameResources = this.frames.get(frame);
    if (!frameResources) {
      return;
    }
    for (const compiledSurface of frameResources.compiledSurfaces.values()) {
      destroyCompiledSurface(compiledSurface);
    }
    frameResources.framebuffer?.destroy();
    frameResources.colorTexture?.destroy();
    frameResources.bloomRenderer?.destroy();
    this.frames.delete(frame);
  }

  destroy(): void {
    for (const frame of Array.from(this.frames.keys())) {
      this.destroyFrame(frame);
    }
    this.fallbackWhiteTexture.destroy();
    this.fallbackNormalTexture.destroy();
    this.fallbackBlackTexture.destroy();
  }

  private getFrameResources(frame: ANARIFrame): FrameResources {
    let frameResources = this.frames.get(frame);
    if (!frameResources) {
      frameResources = {
        compiledSurfaces: new Map(),
        framebuffer: null,
        colorTexture: null,
        bloomRenderer: null
      };
      this.frames.set(frame, frameResources);
    }
    return frameResources;
  }

  private getCompiledSurface(
    frameResources: FrameResources,
    surface: ANARISurface,
    placements: SurfacePlacement[]
  ): CompiledSurface {
    const geometry = surface.getParameter('geometry')!;
    const material = surface.getParameter('material')!;
    let compiledSurface = frameResources.compiledSurfaces.get(surface.id);
    if (
      compiledSurface &&
      (compiledSurface.geometry !== geometry ||
        compiledSurface.geometryVersion !== geometry.version ||
        compiledSurface.textureSignature !== getMaterialTextureSignature(material) ||
        compiledSurface.placementCount !== placements.length)
    ) {
      destroyCompiledSurface(compiledSurface);
      frameResources.compiledSurfaces.delete(surface.id);
      compiledSurface = undefined;
    }

    if (!compiledSurface) {
      const engineGeometry = makeEngineGeometry(geometry);
      const transformBuffers: Buffer[] = [];
      const transforms: Float32Array[] = [];
      const attributes: Record<string, Buffer> = {};
      const bufferLayout = [];
      for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
        const transformData = new Float32Array(placements.length * 4);
        const transformBuffer = this.device.createBuffer({
          id: `${surface.id}-instance-column-${columnIndex}`,
          data: transformData,
          usage: Buffer.VERTEX | Buffer.COPY_DST
        });
        const attributeName = `instanceModelMatrixCol${columnIndex}`;
        attributes[attributeName] = transformBuffer;
        bufferLayout.push({
          name: attributeName,
          format: 'float32x4',
          stepMode: 'instance'
        } as const);
        transformBuffers.push(transformBuffer);
        transforms.push(transformData);
      }

      const engineMaterial = this.materialFactory.createMaterial({
        id: `${material.id}-material`,
        bindings: this.getMaterialBindings(material)
      });
      updateMaterial(engineMaterial, material);
      const shaderInputs = new ShaderInputs<{
        anariApp: ANARIAppUniforms;
        lighting: typeof lighting.props;
      }>({anariApp: anariAppModule, lighting});
      const opacity = getMaterialOpacity(material);
      const model = new Model(this.device, {
        id: `${surface.id}-model`,
        source: ANARI_WGSL_SHADER,
        vs: ANARI_VERTEX_SHADER,
        fs: ANARI_FRAGMENT_SHADER,
        modules: [anariMaterialModule],
        shaderInputs,
        material: engineMaterial,
        geometry: engineGeometry,
        attributes,
        bufferLayout,
        instanceCount: placements.length,
        parameters: {
          cullMode: 'none',
          depthWriteEnabled: opacity >= 1,
          depthCompare: 'less-equal',
          blend: opacity < 1,
          blendColorSrcFactor: 'src-alpha',
          blendColorDstFactor: 'one-minus-src-alpha',
          blendAlphaSrcFactor: 'one',
          blendAlphaDstFactor: 'one-minus-src-alpha'
        }
      });

      compiledSurface = {
        surface,
        geometry,
        geometryVersion: geometry.version,
        materialVersion: material.version,
        placementCount: placements.length,
        model,
        material: engineMaterial,
        transformBuffers,
        transforms,
        triangleCount: (engineGeometry.indices?.value.length ?? engineGeometry.vertexCount) / 3,
        textureSignature: getMaterialTextureSignature(material)
      };
      frameResources.compiledSurfaces.set(surface.id, compiledSurface);
    }
    return compiledSurface;
  }

  private getMaterialBindings(material: ANARIMaterial): ANARIMaterialBindings {
    const parameters = material.getParameters();
    return {
      anariBaseColorTexture: getSamplerTexture(
        parameters.baseColorTexture,
        this.fallbackWhiteTexture
      ),
      anariNormalTexture: getSamplerTexture(parameters.normalTexture, this.fallbackNormalTexture),
      anariMetallicRoughnessTexture: getSamplerTexture(
        parameters.metallicRoughnessTexture,
        this.fallbackWhiteTexture
      ),
      anariEmissiveTexture: getSamplerTexture(
        parameters.emissiveTexture,
        this.fallbackBlackTexture
      ),
      anariOcclusionTexture: getSamplerTexture(
        parameters.occlusionTexture,
        this.fallbackWhiteTexture
      ),
      anariClearcoatTexture: getSamplerTexture(
        parameters.clearcoatTexture,
        this.fallbackWhiteTexture
      ),
      anariTransmissionTexture: getSamplerTexture(
        parameters.transmissionTexture,
        this.fallbackWhiteTexture
      ),
      anariSheenColorTexture: getSamplerTexture(
        parameters.sheenColorTexture,
        this.fallbackWhiteTexture
      )
    };
  }

  private getFramebuffer(frame: ANARIFrame, frameResources: FrameResources): Framebuffer {
    const [width, height] = getFrameSize(frame, this.device);
    if (
      frameResources.framebuffer &&
      (frameResources.framebuffer.width !== width || frameResources.framebuffer.height !== height)
    ) {
      frameResources.framebuffer.destroy();
      frameResources.colorTexture?.destroy();
      frameResources.framebuffer = null;
      frameResources.colorTexture = null;
    }
    if (!frameResources.framebuffer) {
      frameResources.colorTexture = this.device.createTexture({
        id: `anari-${frame.id}-color-texture`,
        width,
        height,
        format: this.device.preferredColorFormat,
        usage: Texture.RENDER_ATTACHMENT | Texture.SAMPLE
      });
      frameResources.framebuffer = this.device.createFramebuffer({
        id: `anari-${frame.id}-color`,
        width,
        height,
        colorAttachments: [frameResources.colorTexture],
        depthStencilAttachment: 'depth24plus'
      });
    }
    return frameResources.framebuffer;
  }

  private getBloomRenderer(frameResources: FrameResources): ShaderPassRenderer {
    frameResources.bloomRenderer ||= new ShaderPassRenderer(this.device, {
      shaderPasses: [bloomShaderPassPipeline]
    });
    return frameResources.bloomRenderer;
  }
}

function collectSurfacePlacements(world: ANARIWorld): SurfacePlacement[] {
  const placements: SurfacePlacement[] = [];
  const worldParameters = world.getParameters();
  const directSurfaces = resolveObjectArray(worldParameters.surface, worldParameters.surfaces);
  for (const surface of directSurfaces) {
    placements.push({surface, transform: IDENTITY_MATRIX});
  }

  const instances = resolveObjectArray(worldParameters.instance, worldParameters.instances);
  for (const instance of instances) {
    collectInstancePlacements(instance, placements);
  }
  return placements;
}

function collectInstancePlacements(instance: ANARIInstance, placements: SurfacePlacement[]): void {
  const parameters = instance.getParameters();
  const groups =
    parameters.group instanceof ANARIArray
      ? parameters.group.data
      : Array.isArray(parameters.group)
        ? parameters.group
        : parameters.group
          ? [parameters.group]
          : [];
  for (const group of groups) {
    if (!(group instanceof ANARIGroup)) {
      continue;
    }
    const surfaces = getGroupSurfaces(group);
    for (const surface of surfaces) {
      placements.push({surface, transform: parameters.transform || IDENTITY_MATRIX});
    }
  }
}

function getGroupSurfaces(group: ANARIGroup): ANARISurface[] {
  const parameters = group.getParameters();
  return resolveObjectArray(parameters.surface, parameters.surfaces);
}

function groupPlacementsBySurface(
  placements: SurfacePlacement[]
): Map<ANARISurface, SurfacePlacement[]> {
  const groups = new Map<ANARISurface, SurfacePlacement[]>();
  for (const placement of placements) {
    const surfacePlacements = groups.get(placement.surface) || [];
    surfacePlacements.push(placement);
    groups.set(placement.surface, surfacePlacements);
  }
  return groups;
}

function resolveObjectArray<ObjectType extends ANARISurface | ANARIInstance | ANARILight>(
  canonicalValue: readonly ObjectType[] | ANARIArray | undefined,
  friendlyValue: readonly ObjectType[] | undefined
): ObjectType[] {
  const value = canonicalValue || friendlyValue || [];
  if (value instanceof ANARIArray) {
    const data = value.data;
    if (ArrayBuffer.isView(data)) {
      return [];
    }
    return data.filter(
      (item): item is ObjectType => typeof item === 'object' && item !== null && 'type' in item
    );
  }
  return Array.from(value);
}

function collectLights(world: ANARIWorld, ambientRadiance: number): Light[] {
  const lights: Light[] = [{type: 'ambient', color: [1, 1, 1], intensity: ambientRadiance}];
  const parameters = world.getParameters();
  const worldLights = resolveObjectArray(parameters.light, parameters.lights);
  for (const light of worldLights) {
    addLight(light, lights);
  }

  for (const instance of resolveObjectArray(parameters.instance, parameters.instances)) {
    const groupValue = instance.getParameter('group');
    const groups =
      groupValue instanceof ANARIArray
        ? groupValue.data
        : Array.isArray(groupValue)
          ? groupValue
          : groupValue
            ? [groupValue]
            : [];
    for (const group of groups) {
      if (!(group instanceof ANARIGroup)) {
        continue;
      }
      const groupParameters = group.getParameters();
      for (const light of resolveObjectArray<ANARILight>(
        groupParameters.light,
        groupParameters.lights
      )) {
        addLight(light, lights);
      }
    }
  }
  return lights;
}

function addLight(light: ANARILight, lights: Light[]): void {
  const parameters = light.getParameters();
  const color = parameters.color || [1, 1, 1];
  switch (light.subtype) {
    case 'ambient':
      lights.push({
        type: 'ambient',
        color,
        intensity: parameters.radiance ?? parameters.intensity ?? 1
      });
      break;
    case 'directional':
      lights.push({
        type: 'directional',
        color,
        direction: parameters.direction || [0, -1, -1],
        intensity: parameters.irradiance ?? parameters.intensity ?? 1
      });
      break;
    case 'point':
      lights.push({
        type: 'point',
        color,
        position: parameters.position || [0, 0, 0],
        intensity: parameters.intensity ?? 1,
        attenuation: [1, 0, 0.025]
      });
      break;
    case 'spot':
      lights.push({
        type: 'spot',
        color,
        position: parameters.position || [0, 0, 0],
        direction: parameters.direction || [0, -1, 0],
        intensity: parameters.intensity ?? 1,
        attenuation: [1, 0, 0.018],
        innerConeAngle: (parameters.openingAngle ?? 0.5) * 0.7,
        outerConeAngle: parameters.openingAngle ?? 0.5
      });
      break;
  }
}

function getCameraUniforms(
  camera: ANARICamera,
  frame: ANARIFrame
): Pick<ANARIAppUniforms, 'viewMatrix' | 'projectionMatrix' | 'cameraPosition'> {
  const parameters = camera.getParameters();
  const position = parameters.position || [0, 0, 5];
  const direction = parameters.direction || [0, 0, -1];
  const center: ANARIVector3 = [
    position[0] + direction[0],
    position[1] + direction[1],
    position[2] + direction[2]
  ];
  const [width, height] = getFrameSize(frame, camera.device.device);
  const aspect = parameters.aspect || width / Math.max(height, 1);
  const near = parameters.near ?? 0.05;
  const far = parameters.far ?? 500;
  const projectionMatrix =
    camera.subtype === 'orthographic'
      ? new Matrix4().ortho({
          left: -(parameters.height ?? 12) * aspect * 0.5,
          right: (parameters.height ?? 12) * aspect * 0.5,
          bottom: -(parameters.height ?? 12) * 0.5,
          top: (parameters.height ?? 12) * 0.5,
          near,
          far
        })
      : new Matrix4().perspective({fovy: parameters.fovy ?? Math.PI / 3, aspect, near, far});
  return {
    projectionMatrix,
    viewMatrix: new Matrix4().lookAt({eye: position, center, up: parameters.up || [0, 1, 0]}),
    cameraPosition: position
  };
}

function getFrameSize(frame: ANARIFrame, device: Device): [number, number] {
  const size = frame.getParameter('size');
  if (size) {
    return [size[0], size[1]];
  }
  return device.getDefaultCanvasContext().getDrawingBufferSize();
}

function makeEngineGeometry(geometry: ANARIGeometry): Geometry {
  const parameters = geometry.getParameters();
  const segments = parameters.segments ?? 32;
  let sourceGeometry: Geometry;
  switch (geometry.subtype) {
    case 'sphere':
      sourceGeometry = new SphereGeometry({
        radius: parameters.radius ?? 1,
        nlat: segments,
        nlong: segments * 2
      });
      break;
    case 'cylinder':
      sourceGeometry = new CylinderGeometry({
        radius: parameters.radius ?? 1,
        height: parameters.height ?? 1,
        nradial: segments,
        nvertical: 1,
        topCap: true,
        bottomCap: true
      });
      break;
    case 'cone':
      sourceGeometry = new ConeGeometry({
        radius: parameters.radius ?? 1,
        height: parameters.height ?? 1,
        nradial: segments,
        nvertical: 1,
        cap: true
      });
      break;
    case 'quad':
      sourceGeometry = new PlaneGeometry({
        type: 'x,z',
        xlen: parameters.width ?? 1,
        zlen: parameters.height ?? parameters.width ?? 1,
        flipCull: true
      });
      break;
    case 'triangle': {
      const positions = unwrapArray(parameters['vertex.position']);
      const normals = unwrapArray(parameters['vertex.normal']);
      const textureCoordinates = unwrapArray(parameters['vertex.attribute1']);
      const indices = unwrapArray(parameters['primitive.index']);
      if (!(positions instanceof Float32Array)) {
        throw new Error('Triangle geometry requires vertex.position');
      }
      sourceGeometry = new Geometry({
        topology: 'triangle-list',
        attributes: {
          POSITION: {size: 3, value: positions},
          NORMAL: {
            size: 3,
            value: normals instanceof Float32Array ? normals : makeVertexNormals(positions)
          },
          TEXCOORD_0: {
            size: 2,
            value:
              textureCoordinates instanceof Float32Array
                ? textureCoordinates
                : new Float32Array((positions.length / 3) * 2)
          }
        },
        indices:
          indices instanceof Uint16Array || indices instanceof Uint32Array ? indices : undefined
      });
      break;
    }
  }

  const positions = sourceGeometry.attributes['POSITION']?.value;
  const vertexCount = positions ? positions.length / 3 : sourceGeometry.vertexCount;
  const attributes = unwrapArray(parameters['vertex.attribute0']);
  const vertexColors =
    attributes instanceof Float32Array ? attributes : new Float32Array(vertexCount * 3).fill(1);
  const textureCoordinates = sourceGeometry.attributes['TEXCOORD_0']?.value;

  return new Geometry({
    topology: sourceGeometry.topology || 'triangle-list',
    attributes: {
      ...sourceGeometry.attributes,
      COLOR_0: {size: 3, value: vertexColors},
      TEXCOORD_0: {
        size: 2,
        value:
          textureCoordinates instanceof Float32Array
            ? textureCoordinates
            : new Float32Array(vertexCount * 2)
      }
    },
    indices: sourceGeometry.indices
  });
}

function unwrapArray(value: unknown): unknown {
  return value instanceof ANARIArray ? value.data : value;
}

function makeVertexNormals(positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let vertexIndex = 0; vertexIndex < positions.length; vertexIndex += 9) {
    const firstEdgeX = positions[vertexIndex + 3] - positions[vertexIndex];
    const firstEdgeY = positions[vertexIndex + 4] - positions[vertexIndex + 1];
    const firstEdgeZ = positions[vertexIndex + 5] - positions[vertexIndex + 2];
    const secondEdgeX = positions[vertexIndex + 6] - positions[vertexIndex];
    const secondEdgeY = positions[vertexIndex + 7] - positions[vertexIndex + 1];
    const secondEdgeZ = positions[vertexIndex + 8] - positions[vertexIndex + 2];
    const normalX = firstEdgeY * secondEdgeZ - firstEdgeZ * secondEdgeY;
    const normalY = firstEdgeZ * secondEdgeX - firstEdgeX * secondEdgeZ;
    const normalZ = firstEdgeX * secondEdgeY - firstEdgeY * secondEdgeX;
    const normalLength = Math.hypot(normalX, normalY, normalZ) || 1;
    for (let cornerIndex = 0; cornerIndex < 3; cornerIndex++) {
      normals[vertexIndex + cornerIndex * 3] = normalX / normalLength;
      normals[vertexIndex + cornerIndex * 3 + 1] = normalY / normalLength;
      normals[vertexIndex + cornerIndex * 3 + 2] = normalZ / normalLength;
    }
  }
  return normals;
}

function updateTransforms(compiledSurface: CompiledSurface, placements: SurfacePlacement[]): void {
  for (let placementIndex = 0; placementIndex < placements.length; placementIndex++) {
    const transform = placements[placementIndex].transform;
    for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
      for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
        compiledSurface.transforms[columnIndex][placementIndex * 4 + componentIndex] =
          transform[columnIndex * 4 + componentIndex];
      }
    }
  }
  for (let columnIndex = 0; columnIndex < 4; columnIndex++) {
    compiledSurface.transformBuffers[columnIndex].write(compiledSurface.transforms[columnIndex]);
  }
}

function updateMaterial(
  engineMaterial: Material<{anariMaterial: ANARIMaterialUniforms}, ANARIMaterialBindings>,
  material: ANARIMaterial
): void {
  const parameters = material.getParameters();
  const color = parameters.baseColor || parameters.color || [0.8, 0.8, 0.8];
  const emissive = parameters.emissive || [0, 0, 0];
  const emissiveStrength = parameters.emissiveStrength ?? 1;
  engineMaterial.setProps({
    anariMaterial: {
      baseColor: [color[0], color[1], color[2]],
      emissiveColor: [
        emissive[0] * emissiveStrength,
        emissive[1] * emissiveStrength,
        emissive[2] * emissiveStrength
      ],
      sheenColor: parameters.sheenColor || [0, 0, 0],
      metallic: material.subtype === 'matte' ? 0 : (parameters.metallic ?? 0),
      roughness: material.subtype === 'matte' ? 0.92 : (parameters.roughness ?? 0.38),
      opacity: getMaterialOpacity(material),
      clearcoat: parameters.clearcoat ?? 0,
      clearcoatRoughness: parameters.clearcoatRoughness ?? 0.18,
      iridescence: parameters.iridescence ?? 0,
      transmission: parameters.transmission ?? 0,
      indexOfRefraction: parameters.indexOfRefraction ?? 1.5,
      sheenRoughness: parameters.sheenRoughness ?? 0.5,
      normalScale: parameters.normalScale ?? 1,
      occlusionStrength: parameters.occlusionStrength ?? 1,
      baseColorTextureEnabled: parameters.baseColorTexture ? 1 : 0,
      normalTextureEnabled: parameters.normalTexture ? 1 : 0,
      metallicRoughnessTextureEnabled: parameters.metallicRoughnessTexture ? 1 : 0,
      emissiveTextureEnabled: parameters.emissiveTexture ? 1 : 0,
      occlusionTextureEnabled: parameters.occlusionTexture ? 1 : 0,
      clearcoatTextureEnabled: parameters.clearcoatTexture ? 1 : 0,
      transmissionTextureEnabled: parameters.transmissionTexture ? 1 : 0,
      sheenColorTextureEnabled: parameters.sheenColorTexture ? 1 : 0,
      baseColorUVTransform: getSamplerTransform(parameters.baseColorTexture),
      normalUVTransform: getSamplerTransform(parameters.normalTexture),
      metallicRoughnessUVTransform: getSamplerTransform(parameters.metallicRoughnessTexture),
      emissiveUVTransform: getSamplerTransform(parameters.emissiveTexture),
      occlusionUVTransform: getSamplerTransform(parameters.occlusionTexture),
      clearcoatUVTransform: getSamplerTransform(parameters.clearcoatTexture),
      transmissionUVTransform: getSamplerTransform(parameters.transmissionTexture),
      sheenColorUVTransform: getSamplerTransform(parameters.sheenColorTexture)
    }
  });
}

function getSamplerTexture(sampler: ANARISampler | undefined, fallback: Texture): Texture {
  return sampler?.getParameter('image') || fallback;
}

function getSamplerTransform(sampler: ANARISampler | undefined): Readonly<NumberArray9> {
  return sampler?.getParameter('transform') || IDENTITY_UV_TRANSFORM;
}

function getMaterialOpacity(material: ANARIMaterial): number {
  const parameters = material.getParameters();
  const color = parameters.baseColor || parameters.color;
  const explicitOpacity = parameters.opacity ?? (color && color.length > 3 ? (color[3] ?? 1) : 1);
  return Math.min(explicitOpacity, 1 - (parameters.transmission || 0) * 0.68);
}

function getMaterialTextureSignature(material: ANARIMaterial): string {
  const parameters = material.getParameters();
  return [
    parameters.baseColorTexture,
    parameters.normalTexture,
    parameters.metallicRoughnessTexture,
    parameters.emissiveTexture,
    parameters.occlusionTexture,
    parameters.clearcoatTexture,
    parameters.transmissionTexture,
    parameters.sheenColorTexture
  ]
    .map(sampler => sampler?.id || '')
    .join(':');
}

function createFallbackTexture(
  device: Device,
  identifier: string,
  color: readonly [number, number, number, number]
): Texture {
  return device.createTexture({
    id: `anari-${identifier}-texture`,
    width: 1,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array(color),
    sampler: {minFilter: 'linear', magFilter: 'linear'}
  });
}

function destroyCompiledSurface(compiledSurface: CompiledSurface): void {
  compiledSurface.model.destroy();
  compiledSurface.material.destroy();
  for (const transformBuffer of compiledSurface.transformBuffers) {
    transformBuffer.destroy();
  }
}
