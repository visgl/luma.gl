// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Small authored glTF fixture with real rectangular and disk extension records. */
const areaLightDemo = {
  asset: {
    version: '2.0',
    generator: 'luma.gl area light demonstration'
  },
  extensionsUsed: ['EXT_lights_area', 'KHR_materials_emissive_strength'],
  extensions: {
    EXT_lights_area: {
      lights: [
        {
          type: 'rect',
          size: 1,
          rect: {
            aspect: 1.4
          },
          intensity: 300,
          color: [1, 0.7, 0.35]
        },
        {
          type: 'disk',
          size: 1.1,
          intensity: 300,
          color: [0.35, 0.65, 1]
        }
      ]
    }
  },
  scene: 0,
  scenes: [
    {
      nodes: [0, 1, 2, 3, 4, 5, 6, 7]
    }
  ],
  nodes: [
    {
      name: 'Floor',
      mesh: 0,
      translation: [0, -0.1, 0],
      scale: [6, 0.2, 5]
    },
    {
      name: 'Backdrop',
      mesh: 6,
      translation: [0, 1.4, -2.4],
      scale: [6, 3, 0.2]
    },
    {
      name: 'Warm receiver',
      mesh: 1,
      translation: [-1, 0.5, 0],
      scale: [1, 1, 1]
    },
    {
      name: 'Cool receiver',
      mesh: 2,
      translation: [1, 0.75, 0],
      scale: [1, 1.5, 1]
    },
    {
      name: 'Rectangle emitter',
      mesh: 3,
      translation: [-1.4, 2.8, 0],
      scale: [1.4, 0.025, 1]
    },
    {
      name: 'Disk light',
      translation: [1.4, 2.8, 0],
      rotation: [-0.7071067811865476, 0, 0, 0.7071067811865476],
      extensions: {
        EXT_lights_area: {
          light: 1
        }
      }
    },
    {
      name: 'Rectangle light',
      translation: [-1.4, 2.8, 0],
      rotation: [-0.7071067811865476, 0, 0, 0.7071067811865476],
      extensions: {
        EXT_lights_area: {
          light: 0
        }
      }
    },
    {
      name: 'Disk emitter',
      mesh: 5,
      translation: [1.4, 2.8, 0]
    }
  ],
  meshes: [
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1
          },
          indices: 2,
          material: 0
        }
      ]
    },
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1
          },
          indices: 2,
          material: 1
        }
      ]
    },
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1
          },
          indices: 2,
          material: 2
        }
      ]
    },
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1
          },
          indices: 2,
          material: 3
        }
      ]
    },
    {
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1
          },
          indices: 2,
          material: 4
        }
      ]
    },
    {
      primitives: [
        {
          attributes: {
            POSITION: 3,
            NORMAL: 4
          },
          indices: 5,
          material: 4
        }
      ]
    }
  ],
  materials: [
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.65, 0.65, 0.65, 1],
        metallicFactor: 0,
        roughnessFactor: 0.6
      }
    },
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.65, 0.12, 0.07, 1],
        metallicFactor: 0,
        roughnessFactor: 0.6
      }
    },
    {
      pbrMetallicRoughness: {
        baseColorFactor: [0.08, 0.25, 0.65, 1],
        metallicFactor: 0,
        roughnessFactor: 0.6
      }
    },
    {
      doubleSided: true,
      emissiveFactor: [1, 0.7, 0.35],
      pbrMetallicRoughness: {
        baseColorFactor: [1, 0.7, 0.35, 1],
        metallicFactor: 0,
        roughnessFactor: 0.6
      },
      extensions: {
        KHR_materials_emissive_strength: {emissiveStrength: 50}
      }
    },
    {
      doubleSided: true,
      emissiveFactor: [0.35, 0.65, 1],
      pbrMetallicRoughness: {
        baseColorFactor: [0.35, 0.65, 1, 1],
        metallicFactor: 0,
        roughnessFactor: 0.6
      },
      extensions: {
        KHR_materials_emissive_strength: {emissiveStrength: 50}
      }
    }
  ],
  buffers: [
    {
      uri: 'data:application/octet-stream;base64,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',
      byteLength: 1656
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: 288
    },
    {
      buffer: 0,
      byteOffset: 288,
      byteLength: 288
    },
    {
      buffer: 0,
      byteOffset: 576,
      byteLength: 72
    },
    {
      buffer: 0,
      byteOffset: 648,
      byteLength: 408
    },
    {
      buffer: 0,
      byteOffset: 1056,
      byteLength: 408
    },
    {
      buffer: 0,
      byteOffset: 1464,
      byteLength: 192
    }
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 24,
      type: 'VEC3',
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5]
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: 24,
      type: 'VEC3'
    },
    {
      bufferView: 2,
      componentType: 5123,
      count: 36,
      type: 'SCALAR'
    },
    {
      bufferView: 3,
      componentType: 5126,
      count: 34,
      type: 'VEC3',
      min: [-0.55, 0, -0.55],
      max: [0.55, 0, 0.55]
    },
    {
      bufferView: 4,
      componentType: 5126,
      count: 34,
      type: 'VEC3'
    },
    {
      bufferView: 5,
      componentType: 5123,
      count: 96,
      type: 'SCALAR'
    }
  ]
};

// Independent mesh nodes share accessors while retaining separate scenegraph ownership.
areaLightDemo.meshes.push({
  primitives: [{attributes: {POSITION: 0, NORMAL: 1}, indices: 2, material: 0}]
});

export const AREA_LIGHT_DEMO_URL = `data:application/json,${encodeURIComponent(JSON.stringify(areaLightDemo))}`;
