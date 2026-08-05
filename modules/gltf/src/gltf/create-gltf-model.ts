// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Binding,
  Buffer,
  Device,
  log,
  type RenderPipelineParameters,
  Sampler,
  Texture,
  TextureView
} from '@luma.gl/core';
import {
  createPBRMaterial,
  createPBRMaterialFactory,
  createPBRModel,
  DynamicTexture,
  Geometry,
  Material,
  ModelNode,
  type ModelProps
} from '@luma.gl/engine';
import {skin} from '@luma.gl/shadertools';
import {type ParsedPBRMaterial} from '../pbr/pbr-material';

/** Options used to instantiate a `ModelNode` for one glTF primitive. */
export type CreateGLTFModelOptions = {
  /** Optional id assigned to the generated model. */
  id?: string;
  /** Vertex count override for non-indexed primitives. */
  vertexCount?: number;
  /** Geometry converted from the glTF primitive. */
  geometry: Geometry;
  /** Parsed PBR material state for the primitive. */
  parsedPPBRMaterial: ParsedPBRMaterial;
  /** Pre-created material aligned with the source glTF material entry, when available. */
  material?: Material | null;
  /** Additional model props merged into the generated model. */
  modelOptions?: Partial<ModelProps>;
};

export type CreateGLTFMaterialOptions = {
  id?: string;
  parsedPPBRMaterial: ParsedPBRMaterial;
  materialFactory?: ReturnType<typeof createPBRMaterialFactory>;
};

export function createGLTFMaterial(device: Device, options: CreateGLTFMaterialOptions): Material {
  const materialFactory = options.materialFactory || createPBRMaterialFactory(device);

  const pbrMaterialProps = {...options.parsedPPBRMaterial.uniforms};
  delete pbrMaterialProps.camera;
  const materialBindings = Object.fromEntries(
    Object.entries({
      ...pbrMaterialProps,
      ...options.parsedPPBRMaterial.bindings
    }).filter(
      ([name, value]) => materialFactory.ownsBinding(name) && isMaterialBindingResource(value)
    )
  ) as Record<string, Binding | DynamicTexture>;

  return createPBRMaterial(device, {
    id: options.id,
    bindings: materialBindings,
    factory: materialFactory,
    uniforms: pbrMaterialProps
  });
}

/** Creates a luma.gl Model from GLTF data*/
export function createGLTFModel(device: Device, options: CreateGLTFModelOptions): ModelNode {
  const {id, geometry, parsedPPBRMaterial, vertexCount, modelOptions = {}} = options;

  log.info(4, 'createGLTFModel defines: ', parsedPPBRMaterial.defines)();

  // Calculate managedResources
  // TODO: Implement resource management logic that will
  // not deallocate resources/textures/buffers that are shared
  const managedResources: any[] = [];
  // managedResources.push(...parsedMaterial.generatedTextures);
  // managedResources.push(...Object.values(attributes).map((attribute) => attribute.buffer));

  const parameters: RenderPipelineParameters = {
    depthWriteEnabled: true,
    depthCompare: 'less',
    depthFormat: 'depth24plus',
    cullMode: 'back'
  };

  const modelProps: ModelProps = {
    id,
    geometry,
    topology: geometry.topology,
    vertexCount,
    modules: [skin],
    ...modelOptions,

    defines: {...parsedPPBRMaterial.defines, ...modelOptions.defines},
    parameters: {...parameters, ...parsedPPBRMaterial.parameters, ...modelOptions.parameters}
  };

  const material =
    options.material ||
    createGLTFMaterial(device, {
      id: id ? `${id}-material` : undefined,
      parsedPPBRMaterial
    });
  modelProps.material = material;

  const model = createPBRModel(device, {...modelProps, material});

  const sceneShaderInputValues = {
    ...parsedPPBRMaterial.uniforms,
    ...modelOptions.uniforms,
    ...parsedPPBRMaterial.bindings,
    ...modelOptions.bindings
  };
  const sceneShaderInputProps = getSceneShaderInputProps(
    model.shaderInputs.getModules(),
    material,
    sceneShaderInputValues
  );
  model.shaderInputs.setProps(sceneShaderInputProps);
  return new ModelNode({managedResources, model});
}

function isMaterialBindingResource(value: unknown): boolean {
  return (
    value instanceof Buffer ||
    value instanceof DynamicTexture ||
    value instanceof Sampler ||
    value instanceof Texture ||
    value instanceof TextureView
  );
}

function getSceneShaderInputProps(
  modules: Array<{
    name: string;
    uniformTypes?: Readonly<Record<string, unknown>>;
    bindingLayout?: ReadonlyArray<{name: string}>;
  }>,
  material: Material,
  shaderInputValues: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  const propertyToModuleNameMap = new Map<string, string>();
  for (const module of modules) {
    for (const uniformName of Object.keys(module.uniformTypes || {})) {
      propertyToModuleNameMap.set(uniformName, module.name);
    }
    for (const binding of module.bindingLayout || []) {
      propertyToModuleNameMap.set(binding.name, module.name);
    }
  }

  const sceneShaderInputProps: Record<string, Record<string, unknown>> = {};
  for (const [propertyName, value] of Object.entries(shaderInputValues)) {
    if (value === undefined) {
      continue;
    }

    const moduleName = propertyToModuleNameMap.get(propertyName);
    if (!moduleName || material.ownsModule(moduleName)) {
      continue;
    }

    sceneShaderInputProps[moduleName] ||= {};
    sceneShaderInputProps[moduleName][propertyName] = value;
  }

  return sceneShaderInputProps;
}
