// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

type GLTFExportTypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Uint32Array
  | Float32Array;

type GLTFExportAccessorSize = 1 | 2 | 3 | 4 | 9 | 16;

/** Typed attribute or animation samples preserved without lossy numeric conversion. */
export type GLTFExportAccessor = {
  data: GLTFExportTypedArray | readonly number[];
  size: GLTFExportAccessorSize;
  normalized?: boolean;
  min?: readonly number[];
  max?: readonly number[];
  sparse?: {
    indices: Uint8Array | Uint16Array | Uint32Array;
    values: GLTFExportTypedArray | readonly number[];
  };
};

/** One glTF primitive, retaining authored semantics and morph-target displacement. */
export type GLTFExportPrimitive = {
  attributes: Readonly<Record<string, GLTFExportAccessor>>;
  indices?: GLTFExportAccessor;
  material?: number;
  mode?: number;
  targets?: readonly Readonly<Record<string, GLTFExportAccessor>>[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Reusable source-faithful glTF mesh. */
export type GLTFExportMesh = {
  name?: string;
  primitives: readonly GLTFExportPrimitive[];
  weights?: readonly number[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Hierarchical glTF node with optional existing GPU-instancing attributes. */
export type GLTFExportNode = {
  name?: string;
  mesh?: number;
  skin?: number;
  camera?: number;
  children?: readonly number[];
  matrix?: readonly number[];
  translation?: readonly number[];
  rotation?: readonly number[];
  scale?: readonly number[];
  weights?: readonly number[];
  instances?: Readonly<Record<string, GLTFExportAccessor>>;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Existing joint hierarchy and inverse-bind matrices owned by an exported glTF skin. */
export type GLTFExportSkin = {
  name?: string;
  joints: readonly number[];
  skeleton?: number;
  inverseBindMatrices?: GLTFExportAccessor;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Existing glTF animation sampler; morph outputs retain their authored SCALAR layout. */
export type GLTFExportAnimationSampler = {
  input: GLTFExportAccessor;
  output: GLTFExportAccessor;
  interpolation?: 'STEP' | 'LINEAR' | 'CUBICSPLINE';
};

/** Core transform/morph target or standards-native KHR_animation_pointer target. */
export type GLTFExportAnimationChannel = {
  sampler: number;
  target:
    | {
        node: number;
        path: 'translation' | 'rotation' | 'scale' | 'weights';
        extensions?: Record<string, unknown>;
      }
    | {
        path: 'pointer';
        pointer: string;
      };
};

/** Named animation clip with independently retained sampler data. */
export type GLTFExportAnimation = {
  name?: string;
  samplers: readonly GLTFExportAnimationSampler[];
  channels: readonly GLTFExportAnimationChannel[];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Caller-owned image bytes or authored URI. */
export type GLTFExportImage = {
  name?: string;
  uri?: string;
  data?: Uint8Array;
  mimeType?: string;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** Format-owned asset description with no dependency on a renderer or ANARI facade. */
export type GLTFExportScene = {
  name?: string;
  scene?: number;
  scenes?: readonly {name?: string; nodes: readonly number[]}[];
  nodes?: readonly GLTFExportNode[];
  meshes?: readonly GLTFExportMesh[];
  materials?: readonly Record<string, unknown>[];
  textures?: readonly Record<string, unknown>[];
  images?: readonly GLTFExportImage[];
  samplers?: readonly Record<string, unknown>[];
  cameras?: readonly Record<string, unknown>[];
  skins?: readonly GLTFExportSkin[];
  animations?: readonly GLTFExportAnimation[];
  extensions?: Record<string, unknown>;
  extensionsUsed?: readonly string[];
  extensionsRequired?: readonly string[];
  extras?: unknown;
  generator?: string;
};

/** JSON or binary serialization options. */
export type GLTFExportOptions = {
  binary?: boolean;
  pretty?: boolean;
};

type GLTFJSONRecord = Record<string, unknown>;

const ARRAY_BUFFER_TARGET = 34962;
const ELEMENT_ARRAY_BUFFER_TARGET = 34963;
const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BINARY_CHUNK = 0x004e4942;

/** Serializes source-faithful glTF 2.0 scenes into embedded JSON assets. */
export function exportGLTF(
  scene: GLTFExportScene,
  options?: GLTFExportOptions & {binary?: false}
): string;
/** Serializes source-faithful glTF 2.0 scenes into aligned binary GLB assets. */
export function exportGLTF(
  scene: GLTFExportScene,
  options: GLTFExportOptions & {binary: true}
): ArrayBuffer;
export function exportGLTF(
  scene: GLTFExportScene,
  options: GLTFExportOptions = {}
): string | ArrayBuffer {
  const writer = new GLTFExportWriter(scene, options);
  return writer.write();
}

class GLTFExportWriter {
  private readonly scene: GLTFExportScene;
  private readonly options: GLTFExportOptions;
  private readonly binary = new GLTFBinaryBuilder();
  private readonly bufferViews: GLTFJSONRecord[] = [];
  private readonly accessors: GLTFJSONRecord[] = [];

  constructor(scene: GLTFExportScene, options: GLTFExportOptions) {
    this.scene = scene;
    this.options = options;
  }

  write(): string | ArrayBuffer {
    const document: GLTFJSONRecord = {
      asset: {
        version: '2.0',
        generator: this.scene.generator || '@luma.gl/gltf'
      },
      scene: this.scene.scene ?? 0
    };

    if (this.scene.nodes?.length) {
      document['nodes'] = this.scene.nodes.map(node => this.writeNode(node));
    }
    document['scenes'] = this.scene.scenes?.length
      ? this.scene.scenes.map(scene => ({...scene, nodes: [...scene.nodes]}))
      : [{...(this.scene.name ? {name: this.scene.name} : {}), nodes: this.collectRootNodes()}];

    if (this.scene.meshes?.length) {
      document['meshes'] = this.scene.meshes.map(mesh => this.writeMesh(mesh));
    }
    if (this.scene.materials?.length) {
      document['materials'] = this.scene.materials.map(material => ({...material}));
    }
    if (this.scene.textures?.length) {
      document['textures'] = this.scene.textures.map(texture => ({...texture}));
    }
    if (this.scene.images?.length) {
      document['images'] = this.scene.images.map(image => this.writeImage(image));
    }
    if (this.scene.samplers?.length) {
      document['samplers'] = this.scene.samplers.map(sampler => ({...sampler}));
    }
    if (this.scene.cameras?.length) {
      document['cameras'] = this.scene.cameras.map(camera => ({...camera}));
    }
    if (this.scene.skins?.length) {
      document['skins'] = this.scene.skins.map(skin => this.writeSkin(skin));
    }
    if (this.scene.animations?.length) {
      document['animations'] = this.scene.animations.map(animation =>
        this.writeAnimation(animation)
      );
    }
    if (this.scene.extensions) {
      document['extensions'] = {...this.scene.extensions};
    }
    if (this.scene.extras !== undefined) {
      document['extras'] = this.scene.extras;
    }

    if (this.bufferViews.length) {
      document['bufferViews'] = this.bufferViews;
    }
    if (this.accessors.length) {
      document['accessors'] = this.accessors;
    }

    const binary = this.binary.finish();
    if (binary.byteLength > 0) {
      document['buffers'] = [
        {
          byteLength: binary.byteLength,
          ...(!this.options.binary
            ? {uri: `data:application/octet-stream;base64,${encodeGLTFBase64(binary)}`}
            : {})
        }
      ];
    }

    const extensionsUsed = new Set(this.scene.extensionsUsed || []);
    collectExtensionNames(document, extensionsUsed);
    if (extensionsUsed.size > 0) {
      document['extensionsUsed'] = [...extensionsUsed];
    }
    if (this.scene.extensionsRequired?.length) {
      document['extensionsRequired'] = [...this.scene.extensionsRequired];
    }

    return this.options.binary
      ? makeGLB(document, binary)
      : JSON.stringify(document, null, this.options.pretty === false ? undefined : 2);
  }

  private collectRootNodes(): number[] {
    const childNodes = new Set<number>();
    for (const node of this.scene.nodes || []) {
      for (const child of node.children || []) {
        childNodes.add(child);
      }
    }
    return (this.scene.nodes || []).flatMap((_node, index) =>
      childNodes.has(index) ? [] : [index]
    );
  }

  private writeNode(node: GLTFExportNode): GLTFJSONRecord {
    const {instances, ...properties} = node;
    const result: GLTFJSONRecord = {...properties};
    if (node.children) {
      result['children'] = [...node.children];
    }
    if (node.weights) {
      result['weights'] = [...node.weights];
    }
    if (instances && Object.keys(instances).length > 0) {
      const attributes: Record<string, number> = {};
      for (const [name, accessor] of Object.entries(instances)) {
        attributes[name] = this.writeAccessor(accessor);
      }
      result['extensions'] = {
        ...node.extensions,
        EXT_mesh_gpu_instancing: {attributes}
      };
    }
    return result;
  }

  private writeMesh(mesh: GLTFExportMesh): GLTFJSONRecord {
    return {
      ...(mesh.name ? {name: mesh.name} : {}),
      primitives: mesh.primitives.map(primitive => this.writePrimitive(primitive)),
      ...(mesh.weights ? {weights: [...mesh.weights]} : {}),
      ...(mesh.extensions ? {extensions: {...mesh.extensions}} : {}),
      ...(mesh.extras !== undefined ? {extras: mesh.extras} : {})
    };
  }

  private writePrimitive(primitive: GLTFExportPrimitive): GLTFJSONRecord {
    const attributes: Record<string, number> = {};
    for (const [name, accessor] of Object.entries(primitive.attributes)) {
      attributes[name] = this.writeAccessor(accessor, {
        target: ARRAY_BUFFER_TARGET,
        includeBounds: name === 'POSITION'
      });
    }
    const result: GLTFJSONRecord = {attributes};
    if (primitive.indices) {
      result['indices'] = this.writeAccessor(primitive.indices, {
        target: ELEMENT_ARRAY_BUFFER_TARGET
      });
    }
    if (primitive.material !== undefined) {
      result['material'] = primitive.material;
    }
    if (primitive.mode !== undefined) {
      result['mode'] = primitive.mode;
    }
    if (primitive.targets?.length) {
      result['targets'] = primitive.targets.map(target =>
        Object.fromEntries(
          Object.entries(target).map(([name, accessor]) => [
            name,
            this.writeAccessor(accessor, {
              target: ARRAY_BUFFER_TARGET,
              includeBounds: name === 'POSITION'
            })
          ])
        )
      );
    }
    if (primitive.extensions) {
      result['extensions'] = {...primitive.extensions};
    }
    if (primitive.extras !== undefined) {
      result['extras'] = primitive.extras;
    }
    return result;
  }

  private writeSkin(skin: GLTFExportSkin): GLTFJSONRecord {
    const {inverseBindMatrices, joints, ...properties} = skin;
    return {
      ...properties,
      joints: [...joints],
      ...(inverseBindMatrices ? {inverseBindMatrices: this.writeAccessor(inverseBindMatrices)} : {})
    };
  }

  private writeAnimation(animation: GLTFExportAnimation): GLTFJSONRecord {
    return {
      ...(animation.name ? {name: animation.name} : {}),
      samplers: animation.samplers.map(sampler => ({
        input: this.writeAccessor(sampler.input, {includeBounds: true}),
        output: this.writeAccessor(sampler.output),
        ...(sampler.interpolation ? {interpolation: sampler.interpolation} : {})
      })),
      channels: animation.channels.map(channel => ({
        sampler: channel.sampler,
        target:
          channel.target.path === 'pointer'
            ? {
                path: 'pointer',
                extensions: {KHR_animation_pointer: {pointer: channel.target.pointer}}
              }
            : {...channel.target}
      })),
      ...(animation.extensions ? {extensions: {...animation.extensions}} : {}),
      ...(animation.extras !== undefined ? {extras: animation.extras} : {})
    };
  }

  private writeImage(image: GLTFExportImage): GLTFJSONRecord {
    const {data, ...properties} = image;
    if (!data) {
      return {...properties};
    }
    const mimeType = image.mimeType || 'image/png';
    if (!this.options.binary) {
      return {...properties, uri: `data:${mimeType};base64,${encodeGLTFBase64(data)}`};
    }
    const bufferView = this.writeBufferView(data);
    return {...properties, bufferView, mimeType};
  }

  private writeAccessor(
    accessor: GLTFExportAccessor,
    options: {target?: number; includeBounds?: boolean} = {}
  ): number {
    const data = toGLTFTypedArray(accessor.data);
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const result: GLTFJSONRecord = {
      bufferView: this.writeBufferView(bytes, options.target),
      componentType: getGLTFComponentType(data),
      count: data.length / accessor.size,
      type: getGLTFAccessorType(accessor.size),
      ...(accessor.normalized ? {normalized: true} : {})
    };

    if (accessor.min) {
      result['min'] = [...accessor.min];
    } else if (options.includeBounds) {
      result['min'] = getGLTFExtrema(data, accessor.size, Math.min);
    }
    if (accessor.max) {
      result['max'] = [...accessor.max];
    } else if (options.includeBounds) {
      result['max'] = getGLTFExtrema(data, accessor.size, Math.max);
    }

    if (accessor.sparse) {
      const indices = accessor.sparse.indices;
      const values = toGLTFTypedArray(accessor.sparse.values);
      result['sparse'] = {
        count: indices.length,
        indices: {
          bufferView: this.writeBufferView(
            new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength)
          ),
          componentType: getGLTFComponentType(indices)
        },
        values: {
          bufferView: this.writeBufferView(
            new Uint8Array(values.buffer, values.byteOffset, values.byteLength)
          )
        }
      };
    }

    this.accessors.push(result);
    return this.accessors.length - 1;
  }

  private writeBufferView(bytes: Uint8Array, target?: number): number {
    const byteOffset = this.binary.append(bytes);
    this.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: bytes.byteLength,
      ...(target ? {target} : {})
    });
    return this.bufferViews.length - 1;
  }
}

class GLTFBinaryBuilder {
  private readonly chunks: Uint8Array[] = [];
  private byteLength = 0;

  append(values: Uint8Array): number {
    const padding = (4 - (this.byteLength % 4)) % 4;
    if (padding > 0) {
      this.chunks.push(new Uint8Array(padding));
      this.byteLength += padding;
    }
    const offset = this.byteLength;
    this.chunks.push(values);
    this.byteLength += values.byteLength;
    return offset;
  }

  finish(): Uint8Array {
    const bytes = new Uint8Array(this.byteLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  }
}

function toGLTFTypedArray(data: GLTFExportTypedArray | readonly number[]): GLTFExportTypedArray {
  return Array.isArray(data) ? new Float32Array(data) : (data as GLTFExportTypedArray);
}

function getGLTFComponentType(data: GLTFExportTypedArray): number {
  if (data instanceof Int8Array) return 5120;
  if (data instanceof Uint8Array) return 5121;
  if (data instanceof Int16Array) return 5122;
  if (data instanceof Uint16Array) return 5123;
  if (data instanceof Uint32Array) return 5125;
  return 5126;
}

function getGLTFAccessorType(size: GLTFExportAccessorSize): string {
  if (size === 1) return 'SCALAR';
  if (size === 9) return 'MAT3';
  if (size === 16) return 'MAT4';
  return `VEC${size}`;
}

function getGLTFExtrema(
  data: GLTFExportTypedArray,
  size: GLTFExportAccessorSize,
  operation: (first: number, second: number) => number
): number[] {
  const extrema = Array.from(data.subarray(0, size));
  for (let offset = size; offset < data.length; offset += size) {
    for (let component = 0; component < size; component++) {
      extrema[component] = operation(extrema[component], data[offset + component]);
    }
  }
  return extrema;
}

function collectExtensionNames(value: unknown, result: Set<string>): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  for (const [name, child] of Object.entries(value)) {
    if (name === 'extensions' && child && typeof child === 'object') {
      for (const extension of Object.keys(child)) {
        result.add(extension);
      }
    }
    collectExtensionNames(child, result);
  }
}

function makeGLB(document: GLTFJSONRecord, binary: Uint8Array): ArrayBuffer {
  const json = new TextEncoder().encode(JSON.stringify(document));
  const jsonPadding = (4 - (json.byteLength % 4)) % 4;
  const binaryPadding = (4 - (binary.byteLength % 4)) % 4;
  const jsonChunkLength = json.byteLength + jsonPadding;
  const binaryChunkLength = binary.byteLength + binaryPadding;
  const totalLength =
    12 + 8 + jsonChunkLength + (binary.byteLength > 0 ? 8 + binaryChunkLength : 0);
  const result = new ArrayBuffer(totalLength);
  const bytes = new Uint8Array(result);
  const view = new DataView(result);
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonChunkLength, true);
  view.setUint32(16, GLB_JSON_CHUNK, true);
  bytes.set(json, 20);
  bytes.fill(0x20, 20 + json.byteLength, 20 + jsonChunkLength);

  if (binary.byteLength > 0) {
    const binaryHeaderOffset = 20 + jsonChunkLength;
    view.setUint32(binaryHeaderOffset, binaryChunkLength, true);
    view.setUint32(binaryHeaderOffset + 4, GLB_BINARY_CHUNK, true);
    bytes.set(binary, binaryHeaderOffset + 8);
  }
  return result;
}

function encodeGLTFBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}
