// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Authored diagnostic: three real draft scatter materials under opposing warm/cool lights. */
const scatterDemo = {
  asset: {
    version: '2.0',
    generator: 'luma.gl authored thin-wall scatter diagnostic'
  },
  extensionsUsed: ['KHR_materials_transmission', 'KHR_materials_scatter', 'KHR_lights_punctual'],
  extensions: {
    KHR_lights_punctual: {
      lights: [
        {
          type: 'directional',
          color: [1, 0.35, 0.12],
          intensity: 2
        },
        {
          type: 'directional',
          color: [0.15, 0.4, 1],
          intensity: 2
        }
      ]
    }
  },
  scene: 0,
  scenes: [
    {
      nodes: [0, 1, 2, 3, 4]
    }
  ],
  nodes: [
    {
      mesh: 0,
      translation: [-1.8, 0, 0]
    },
    {
      mesh: 1,
      translation: [0.0, 0, 0]
    },
    {
      mesh: 2,
      translation: [1.8, 0, 0]
    },
    {
      extensions: {
        KHR_lights_punctual: {
          light: 0
        }
      }
    },
    {
      rotation: [0, 1, 0, 0],
      extensions: {
        KHR_lights_punctual: {
          light: 1
        }
      }
    }
  ],
  materials: [
    {
      name: 'Backward',
      doubleSided: true,
      pbrMetallicRoughness: {
        metallicFactor: 0,
        roughnessFactor: 0.8
      },
      extensions: {
        KHR_materials_transmission: {
          transmissionFactor: 1
        },
        KHR_materials_scatter: {
          scatterStrengthFactor: 1,
          scatterAnisotropy: -0.9,
          multiscatterColorFactor: [1, 1, 1]
        }
      }
    },
    {
      name: 'Balanced',
      doubleSided: true,
      pbrMetallicRoughness: {
        metallicFactor: 0,
        roughnessFactor: 0.8
      },
      extensions: {
        KHR_materials_transmission: {
          transmissionFactor: 1
        },
        KHR_materials_scatter: {
          scatterStrengthFactor: 1,
          scatterAnisotropy: 0,
          multiscatterColorFactor: [1, 1, 1]
        }
      }
    },
    {
      name: 'Forward',
      doubleSided: true,
      pbrMetallicRoughness: {
        metallicFactor: 0,
        roughnessFactor: 0.8
      },
      extensions: {
        KHR_materials_transmission: {
          transmissionFactor: 1
        },
        KHR_materials_scatter: {
          scatterStrengthFactor: 1,
          scatterAnisotropy: 0.9,
          multiscatterColorFactor: [1, 1, 1]
        }
      }
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
          material: 2
        }
      ]
    }
  ],
  buffers: [
    {
      uri: 'data:application/octet-stream;base64,MzMzvwAAgL8AAAAAMzMzPwAAgL8AAAAAMzMzPwAAgD8AAAAAMzMzvwAAgL8AAAAAMzMzPwAAgD8AAAAAMzMzvwAAgD8AAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/',
      byteLength: 144
    }
  ],
  bufferViews: [
    {
      buffer: 0,
      byteOffset: 0,
      byteLength: 72
    },
    {
      buffer: 0,
      byteOffset: 72,
      byteLength: 72
    }
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: 6,
      type: 'VEC3',
      min: [-0.7, -1, 0],
      max: [0.7, 1, 0]
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: 6,
      type: 'VEC3'
    }
  ]
};

export const SCATTER_DEMO_URL = `data:application/json,${encodeURIComponent(JSON.stringify(scatterDemo))}`;
