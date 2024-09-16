import { describe, it } from '../mocha-support.js';
import {
    makeShaderDataDefinitions,
    makeBindGroupLayoutDescriptors,
} from '../../dist/1.x/webgpu-utils.module.js';
import { assertDeepEqual, assertEqual, assertFalsy, assertTruthy } from '../assert.js';

describe('data-definition-tests', () => {

    it('generates expected types, bindings, groups', () => {
        const shader = `
    struct VSUniforms {
        foo: u32,
    };
    @group(4) @binding(1) var<uniform> uni1: f32;
    @group(3) @binding(2) var<uniform> uni2: array<f32, 5>;
    @group(2) @binding(3) var<uniform> uni3: VSUniforms;
    @group(1) @binding(4) var<uniform> uni4: array<VSUniforms, 6>;

      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
        `;
        const d = makeShaderDataDefinitions(shader);
        const defs = d.uniforms;
        assertEqual(defs.uni1.typeDefinition.type, 'f32');
        assertFalsy(defs.uni1.typeDefinition.numElements);
        assertEqual(defs.uni2.typeDefinition.elementType.type, 'f32');
        assertEqual(defs.uni2.typeDefinition.numElements, 5);
        assertEqual(defs.uni3.typeDefinition.fields.foo.type.type, 'u32');
        assertFalsy(defs.uni3.typeDefinition.fields.foo.numElements);
        assertEqual(defs.uni4.typeDefinition.numElements, 6);
        assertEqual(defs.uni4.typeDefinition.elementType.fields.foo.type.type, 'u32');

        assertEqual(defs.uni1.binding, 1);
        assertEqual(defs.uni2.binding, 2);
        assertEqual(defs.uni3.binding, 3);
        assertEqual(defs.uni4.binding, 4);

        assertEqual(defs.uni1.group, 4);
        assertEqual(defs.uni2.group, 3);
        assertEqual(defs.uni3.group, 2);
        assertEqual(defs.uni4.group, 1);
    });

    it('generates expected offsets', () => {
      const code = `
        struct VSUniforms {
            foo: u32,
            bar: f32,
            moo: vec3f,
            brp: bool,   // bool is not valid in WGSL 1 for storage/uniforms but can appear internally
            mrp: i32,
        };
        @group(4) @binding(1) var<uniform> uni1: VSUniforms;
      `;
      const d = makeShaderDataDefinitions(code);
      const def = d.uniforms.uni1;
      assertTruthy(def);
      assertEqual(def.typeDefinition.size, 32);
      assertEqual(def.typeDefinition.fields.foo.offset, 0);
      assertEqual(def.typeDefinition.fields.bar.offset, 4);
      assertEqual(def.typeDefinition.fields.moo.offset, 16);
      assertEqual(def.typeDefinition.fields.mrp.offset, 28);
    });

    it('works with alias', () => {
      const code = `
        alias material_index = u32;
        alias color = vec3f;

        struct Material {
            index: material_index,
            diffuse: color,
        };

        @group(0) @binding(1) var<storage> material: Material;
      `;
      const d = makeShaderDataDefinitions(code);
      const defs = d.storages;
      assertTruthy(defs);
      assertTruthy(defs.material);
      assertEqual(defs.material.size, 32);
      assertEqual(defs.material.typeDefinition.fields.index.offset, 0);
      assertEqual(defs.material.typeDefinition.fields.index.type.size, 4);
      assertEqual(defs.material.typeDefinition.fields.diffuse.offset, 16);
      assertEqual(defs.material.typeDefinition.fields.diffuse.type.size, 12);
    });

    it('works with arrays of arrays', () => {
        const code = `
            struct InnerUniforms {
                bar: u32,
                pad0: u32,
                pad1: u32,
                pad2: u32,
            };

            struct VSUniforms {
                foo: u32,
                moo: InnerUniforms,
                pad0: u32,
                pad1: u32,
                pad2: u32,
            };
            @group(0) @binding(0) var<uniform> foo0: vec3f;
            @group(0) @binding(1) var<uniform> foo1: array<vec3f, 5>;
            @group(0) @binding(2) var<uniform> foo2: array<array<vec3f, 5>, 6>;
            @group(0) @binding(3) var<uniform> foo3: array<array<array<vec3f, 5>, 6>, 7>;

            @group(0) @binding(4) var<uniform> foo4: VSUniforms;
            @group(0) @binding(5) var<uniform> foo5: array<VSUniforms, 5>;
            @group(0) @binding(6) var<uniform> foo6: array<array<VSUniforms, 5>, 6>;
            @group(0) @binding(7) var<uniform> foo7: array<array<array<VSUniforms, 5>, 6>, 7>;
        `;

        const d = makeShaderDataDefinitions(code);
        assertTruthy(d);
        assertEqual(d.uniforms.foo0.typeDefinition.numElements, undefined);
        assertEqual(d.uniforms.foo0.typeDefinition.type, 'vec3f');

        assertEqual(d.uniforms.foo1.typeDefinition.numElements, 5);
        assertEqual(d.uniforms.foo1.typeDefinition.size, 80);
        assertEqual(d.uniforms.foo1.typeDefinition.elementType.type, 'vec3f');

        assertEqual(d.uniforms.foo2.typeDefinition.numElements, 6);
        assertEqual(d.uniforms.foo2.typeDefinition.size, 80 * 6);
        assertEqual(d.uniforms.foo2.typeDefinition.elementType.numElements, 5);
        assertEqual(d.uniforms.foo2.typeDefinition.elementType.elementType.type, 'vec3f');

        assertEqual(d.uniforms.foo3.typeDefinition.numElements, 7);
        assertEqual(d.uniforms.foo3.typeDefinition.size, 80 * 6 * 7);
        assertEqual(d.uniforms.foo3.typeDefinition.elementType.numElements, 6);
        assertEqual(d.uniforms.foo3.typeDefinition.elementType.elementType.numElements, 5);
        assertEqual(d.uniforms.foo3.typeDefinition.elementType.elementType.elementType.type, 'vec3f');

        assertEqual(d.uniforms.foo4.typeDefinition.numElements, undefined);
        assertEqual(d.uniforms.foo4.typeDefinition.size, 32);
        assertEqual(d.uniforms.foo4.typeDefinition.fields.foo.type.type, 'u32');

        assertEqual(d.uniforms.foo5.typeDefinition.numElements, 5);
        assertEqual(d.uniforms.foo5.typeDefinition.size, 32 * 5);
        assertEqual(d.uniforms.foo5.typeDefinition.elementType.fields.foo.type.type, 'u32');

        assertEqual(d.uniforms.foo6.typeDefinition.numElements, 6);
        assertEqual(d.uniforms.foo6.typeDefinition.size, 32 * 5 * 6);
        assertEqual(d.uniforms.foo6.typeDefinition.elementType.numElements, 5);
        assertEqual(d.uniforms.foo6.typeDefinition.elementType.elementType.fields.foo.type.type, 'u32');

        assertEqual(d.uniforms.foo7.typeDefinition.numElements, 7);
        assertEqual(d.uniforms.foo7.typeDefinition.size, 32 * 5 * 6 * 7);
        assertEqual(d.uniforms.foo7.typeDefinition.elementType.numElements, 6);
        assertEqual(d.uniforms.foo7.typeDefinition.elementType.elementType.numElements, 5);
        assertEqual(d.uniforms.foo7.typeDefinition.elementType.elementType.elementType.fields.foo.type.type, 'u32');

    });

    it('generates correct info with unsized arrays', () => {
        const code = `
            struct InnerUniforms {
                bar: u32,
                pad0: u32,
                pad1: u32,
                pad2: u32,
            };

            struct VSUniforms {
                foo: u32,
                moo: InnerUniforms,
                pad0: u32,
                pad1: u32,
                pad2: u32,
            };
            @group(0) @binding(1) var<storage> foo1: array<vec3f>;
            @group(0) @binding(2) var<storage> foo2: array<array<vec3f, 5> >;

            @group(0) @binding(5) var<storage> foo5: array<VSUniforms>;
            @group(0) @binding(6) var<storage> foo6: array<array<VSUniforms, 5> >;
        `;

        const d = makeShaderDataDefinitions(code);
        assertTruthy(d);

        assertEqual(d.storages.foo1.typeDefinition.numElements, 0);
        assertEqual(d.storages.foo1.typeDefinition.elementType.type, 'vec3f');

        assertEqual(d.storages.foo2.typeDefinition.numElements, 0);
        assertEqual(d.storages.foo2.typeDefinition.elementType.elementType.type, 'vec3f');
        assertEqual(d.storages.foo2.typeDefinition.elementType.numElements, 5);

        assertEqual(d.storages.foo5.typeDefinition.numElements, 0);
        assertTruthy(d.storages.foo5.typeDefinition.elementType.fields);

        assertEqual(d.storages.foo6.typeDefinition.numElements, 0);
        assertEqual(d.storages.foo6.typeDefinition.elementType.numElements, 5);
        assertTruthy(d.storages.foo6.typeDefinition.elementType.elementType.fields);
    });

    it('handles various resources', () => {
      const code = `
      // TODO: unfiltered-float???
      // These 3 intentionally not in order
      @group(0) @binding(2) var tex2d: texture_2d<f32>;
      @group(0) @binding(1) var texMS2d: texture_multisampled_2d<f32>;
      @group(0) @binding(0) var texDepth: texture_depth_2d;
      @group(0) @binding(3) var samp: sampler;
      @group(0) @binding(4) var sampC: sampler_comparison;
      @group(0) @binding(5) var texExt: texture_external;
      @group(1) @binding(0) var<uniform> u: mat4x4f;
      @group(1) @binding(1) var<storage> s: mat4x4f;
      @group(1) @binding(2) var<storage, read> sr: array<vec4f, 10>;
      @group(1) @binding(3) var<storage, read_write> srw: array<vec4f>;
      @group(3) @binding(0) var tsR: texture_storage_2d<rgba8unorm, read>;
      @group(3) @binding(1) var tsW: texture_storage_2d<rgba32float, write>;
      @group(3) @binding(2) var tsRW: texture_storage_2d<rgba16uint, read_write>;
      @vertex fn vs() -> @builtin(position) vec4f {
        _ = tex2d;
        _ = texMS2d;
        _ = texDepth;
        _ = samp;
        _ = sampC;
        _ = texExt;
        _ = u;
        _ = s;
        _ = sr;
        _ = srw;
        _ = tsR;
        _ = tsW;
        _ = tsRW;
      }
      `;
      const d = makeShaderDataDefinitions(code);
      const expected = {
        "externalTextures": {
          "texExt": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_external",
            },
            "group": 0,
            "binding": 5,
            "size": 0,
          },
        },
        "samplers": {
          "samp": {
            "typeDefinition": {
              "size": 0,
              "type": "sampler",
            },
            "group": 0,
            "binding": 3,
            "size": 0,
          },
          "sampC": {
            "typeDefinition": {
              "size": 0,
              "type": "sampler_comparison",
            },
            "group": 0,
            "binding": 4,
            "size": 0,
          },
        },
        "structs": {},
        "storages": {
          "s": {
            "typeDefinition": {
              "size": 64,
              "type": "mat4x4f",
            },
            "group": 1,
            "binding": 1,
            "size": 64,
          },
          "sr": {
            "typeDefinition": {
              "size": 160,
              "numElements": 10,
              "elementType": {
                "size": 16,
                "type": "vec4f",
              },
            },
            "group": 1,
            "binding": 2,
            "size": 160,
          },
          "srw": {
            "typeDefinition": {
              "size": 0,
              "numElements": 0,
              "elementType": {
                "size": 16,
                "type": "vec4f",
              },
            },
            "group": 1,
            "binding": 3,
            "size": 0,
          },
        },
        "storageTextures": {
          "tsR": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_storage_2d<rgba8unorm>",
            },
            "group": 3,
            "binding": 0,
            "size": 0,
          },
          "tsW": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_storage_2d<rgba32float>",
            },
            "group": 3,
            "binding": 1,
            "size": 0,
          },
          "tsRW": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_storage_2d<rgba16uint>",
            },
            "group": 3,
            "binding": 2,
            "size": 0,
          },
        },
        "textures": {
          "tex2d": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_2d",
            },
            "group": 0,
            "binding": 2,
            "size": 0,
          },
          "texMS2d": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_multisampled_2d",
            },
            "group": 0,
            "binding": 1,
            "size": 0,
          },
          "texDepth": {
            "typeDefinition": {
              "size": 0,
              "type": "texture_depth_2d",
            },
            "group": 0,
            "binding": 0,
            "size": 0,
          },
        },
        "uniforms": {
          "u": {
            "typeDefinition": {
              "size": 64,
              "type": "mat4x4f",
            },
            "group": 1,
            "binding": 0,
            "size": 64,
          },
        },
        "entryPoints": {
          "vs": {
            "stage": 1,
            "resources": [
              {
                "name": "tex2d",
                "group": 0,
                "entry": {
                  "binding": 2,
                  "visibility": 1,
                  "texture": {
                    "sampleType": "float",
                    "viewDimension": "2d",
                    "multisampled": false,
                  },
                },
              },
              {
                "name": "texMS2d",
                "group": 0,
                "entry": {
                  "binding": 1,
                  "visibility": 1,
                  "texture": {
                    "sampleType": "float",
                    "viewDimension": "2d",
                    "multisampled": true,
                  },
                },
              },
              {
                "name": "texDepth",
                "group": 0,
                "entry": {
                  "binding": 0,
                  "visibility": 1,
                  "texture": {
                    "sampleType": "depth",
                    "viewDimension": "2d",
                    "multisampled": false,
                  },
                },
              },
              {
                "name": "samp",
                "group": 0,
                "entry": {
                  "binding": 3,
                  "visibility": 1,
                  "sampler": {
                    "type": "filtering",
                  },
                },
              },
              {
                "name": "sampC",
                "group": 0,
                "entry": {
                  "binding": 4,
                  "visibility": 1,
                  "sampler": {
                    "type": "comparison",
                  },
                },
              },
              {
                "name": "texExt",
                "group": 0,
                "entry": {
                  "binding": 5,
                  "visibility": 1,
                  "externalTexture": {},
                },
              },
              {
                "name": "u",
                "group": 1,
                "entry": {
                  "binding": 0,
                  "visibility": 1,
                  "buffer": {
                    "minBindingSize": 64,
                  },
                },
              },
              {
                "name": "s",
                "group": 1,
                "entry": {
                  "binding": 1,
                  "visibility": 1,
                  "buffer": {
                    "type": "read-only-storage",
                    "minBindingSize": 64,
                  },
                },
              },
              {
                "name": "sr",
                "group": 1,
                "entry": {
                  "binding": 2,
                  "visibility": 1,
                  "buffer": {
                    "type": "read-only-storage",
                    "minBindingSize": 160,
                  },
                },
              },
              {
                "name": "srw",
                "group": 1,
                "entry": {
                  "binding": 3,
                  "visibility": 1,
                  "buffer": {
                    "type": "storage",
                  },
                },
              },
              {
                "name": "tsR",
                "group": 3,
                "entry": {
                  "binding": 0,
                  "visibility": 1,
                  "storageTexture": {
                    "access": "read-only",
                    "format": "rgba8unorm",
                    "viewDimension": "2d",
                  },
                },
              },
              {
                "name": "tsW",
                "group": 3,
                "entry": {
                  "binding": 1,
                  "visibility": 1,
                  "storageTexture": {
                    "access": "write-only",
                    "format": "rgba32float",
                    "viewDimension": "2d",
                  },
                },
              },
              {
                "name": "tsRW",
                "group": 3,
                "entry": {
                  "binding": 2,
                  "visibility": 1,
                  "storageTexture": {
                    "access": "read-write",
                    "format": "rgba16uint",
                    "viewDimension": "2d",
                  },
                },
              },
            ],
          },
        },
      };

      assertDeepEqual(d, expected);
    });

    describe('it generates bind group layout descriptors', () => {

      it('handles various resources', () => {
        const code = `
        // TODO: unfiltered-float???
        // These 3 intentionally not in order
        @group(0) @binding(2) var tex2d: texture_2d<f32>;
        @group(0) @binding(1) var texMS2d: texture_multisampled_2d<f32>;
        @group(0) @binding(0) var texDepth: texture_depth_2d;
        @group(0) @binding(3) var samp: sampler;
        @group(0) @binding(4) var sampC: sampler_comparison;
        @group(0) @binding(5) var texExt: texture_external;
        @group(1) @binding(0) var<uniform> u: mat4x4f;
        @group(1) @binding(1) var<storage> s: mat4x4f;
        @group(1) @binding(2) var<storage, read> sr: array<vec4f, 10>;
        @group(1) @binding(3) var<storage, read_write> srw: array<vec4f>;
        @group(3) @binding(0) var tsR: texture_storage_2d<rgba8unorm, read>;
        @group(3) @binding(1) var tsW: texture_storage_2d<rgba32float, write>;
        @group(3) @binding(2) var tsRW: texture_storage_2d<rgba16uint, read_write>;
        @vertex fn vs() -> @builtin(position) vec4f {
          _ = tex2d;
          _ = texMS2d;
          _ = texDepth;
          _ = samp;
          _ = sampC;
          _ = texExt;
          _ = u;
          _ = s;
          _ = sr;
          _ = srw;
          _ = tsR;
          _ = tsW;
          _ = tsRW;
        }
        `;
        const d = makeShaderDataDefinitions(code);
        const layouts = makeBindGroupLayoutDescriptors(d, {
          vertex: {
            entryPoint: 'vs',
          },
        });

        const expected = [
          {
            entries: [
              {
                binding: 0,
                visibility: 1,
                texture: {
                  sampleType: 'depth',
                  viewDimension: '2d',
                  multisampled: false,
                },
              },
              {
                binding: 1,
                visibility: 1,
                texture: {
                  sampleType: 'float',
                  viewDimension: '2d',
                  multisampled: true,
                },
              },
              {
                binding: 2,
                visibility: 1,
                texture: {
                  sampleType: 'float',
                  viewDimension: '2d',
                  multisampled: false,
                },
              },
              {
                binding: 3,
                visibility: 1,
                sampler: {
                  type: 'filtering',
                },
              },
              {
                binding: 4,
                visibility: 1,
                sampler: {
                  type: 'comparison',
                },
              },
              {
                binding: 5,
                visibility: 1,
                externalTexture: {},
              },
            ],
          },
          {
            entries: [
              {
                binding: 0,
                visibility: 1,
                buffer: {
                  minBindingSize: 64,
                },
              },
              {
                binding: 1,
                visibility: 1,
                buffer: {
                  type: 'read-only-storage',
                  minBindingSize: 64,
                },
              },
              {
                binding: 2,
                visibility: 1,
                buffer: {
                  type: 'read-only-storage',
                  minBindingSize: 160,
                },
              },
              {
                binding: 3,
                visibility: 1,
                buffer: {
                  type: 'storage',
                },
              },
            ],
          },
          {
            entries: [],
          },
          {
            entries: [
              {
                binding: 0,
                visibility: 1,
                storageTexture: {
                  access: 'read-only',
                  format: 'rgba8unorm',
                  viewDimension: '2d',
                },
              },
              {
                binding: 1,
                visibility: 1,
                storageTexture: {
                  access: 'write-only',
                  format: 'rgba32float',
                  viewDimension: '2d',
                },
              },
              {
                binding: 2,
                visibility: 1,
                storageTexture: {
                  access: 'read-write',
                  format: 'rgba16uint',
                  viewDimension: '2d',
                },
              },
            ],
          },
        ];
        assertDeepEqual(layouts, expected);
      });

      it('handles multiple stages', () => {
        const code = `
        @group(0) @binding(1) var tex2d: texture_2d<f32>;
        @group(0) @binding(2) var samp: sampler;
        @vertex fn vs() -> @builtin(position) vec4f {
          _ = tex2d;
        }
        @fragment fn fs() -> @location(0) vec4f {
          _ = samp;
          return vec4f(0);
        }
        `;
        const d = makeShaderDataDefinitions(code);
        const layouts = makeBindGroupLayoutDescriptors(d, {
          vertex: {
            entryPoint: 'vs',
          },
          fragment: {
            entryPoint: 'fs',
          },
        });
        const expected = [
          {
            entries: [
              {
                binding: 1,
                visibility: 1,
                texture: {
                  sampleType: 'float',
                  viewDimension: '2d',
                  multisampled: false,
                },
              },
              {
                binding: 2,
                visibility: 2,
                sampler: {
                  type: 'filtering',
                },
              },
            ],
          },
        ];
        assertDeepEqual(layouts, expected);
      });

      it('handles merged stages', () => {
        const code = `
        @group(0) @binding(1) var tex2d: texture_2d<f32>;
        @group(0) @binding(2) var samp: sampler;
        @vertex fn vs() -> @builtin(position) vec4f {
          _ = tex2d;
          _ = samp;
        }
        @fragment fn fs() -> @location(0) vec4f {
          _ = tex2d;
          _ = samp;
          return vec4f(0);
        }
        `;
        const d = makeShaderDataDefinitions(code);
        const layouts = makeBindGroupLayoutDescriptors(d, {
          vertex: {
            entryPoint: 'vs',
          },
          fragment: {
            entryPoint: 'fs',
          },
        });
        const expected = [
          {
            entries: [
              {
                binding: 1,
                visibility: 3,
                texture: {
                  sampleType: 'float',
                  viewDimension: '2d',
                  multisampled: false,
                },
              },
              {
                binding: 2,
                visibility: 3,
                sampler: {
                  type: 'filtering',
                },
              },
            ],
          },
        ];
        assertDeepEqual(layouts, expected);
      });

      it('handles empty groups', () => {
        const code = `
        @group(3) @binding(1) var<uniform> u: vec4f;
        @compute fn cs() {
          _ = u;
        }
        `;
        const d = makeShaderDataDefinitions(code);
        const layouts = makeBindGroupLayoutDescriptors(d, {
          compute: {
            entryPoint: 'cs',
          },
        });
        const expected = [
          {
            entries: [],
          },
          {
            entries: [],
          },
          {
            entries: [],
          },
          {
            entries: [
              {
                binding: 1,
                visibility: 4,
                buffer: {
                  minBindingSize: 16,
                },
              },
            ],
          },
        ];
        assertDeepEqual(layouts, expected);
      });

      it('handles unnamed entrypoints', () => {
        const code = `
        @group(0) @binding(1) var tex2d: texture_2d<f32>;
        @group(0) @binding(2) var samp: sampler;
        @group(0) @binding(3) var<uniform> u1: vec4f;
        @group(0) @binding(4) var<uniform> u2: vec4f;
        @vertex fn vs() -> @builtin(position) vec4f {
          _ = tex2d;
          _ = samp;
          _ = u1;
        }
        @fragment fn fs() -> @location(0) vec4f {
          _ = tex2d;
          _ = samp;
          return vec4f(0);
        }
        @compute fn cs() {
          _ = u1;
          _ = u2;
        }

        `;
        const d = makeShaderDataDefinitions(code);
        {
          const layouts = makeBindGroupLayoutDescriptors(d, {
            compute: { },
          });
          const expected = [
            {
              entries: [
                {
                  binding: 3,
                  visibility: 4,
                  buffer: {
                    minBindingSize: 16,
                  },
                },
                {
                  binding: 4,
                  visibility: 4,
                  buffer: {
                    minBindingSize: 16,
                  },
                },
              ],
            },
          ];
          assertDeepEqual(layouts, expected);
        }
        {
          const layouts = makeBindGroupLayoutDescriptors(d, {
            vertex: { },
            fragment: { },
          });
          const expected = [
            {
              entries: [
                {
                  binding: 1,
                  visibility: 3,
                  texture: {
                    sampleType: 'float',
                    viewDimension: '2d',
                    multisampled: false,
                  },
                },
                {
                  binding: 2,
                  visibility: 3,
                  sampler: {
                    type: 'filtering',
                  },
                },
                {
                  binding: 3,
                  visibility: 1,
                  buffer: {
                    minBindingSize: 16,
                  },
                },
              ],
            },
          ];
          assertDeepEqual(layouts, expected);
        }
      });

    });

});
