/* eslint-disable no-sparse-arrays */
import { describe, it, afterEach } from '../mocha-support.js';
import {
    makeStructuredView,
    setStructuredValues,
    makeShaderDataDefinitions,
    setIntrinsicsToView,
    getSizeAndAlignmentOfUnsizedArrayElement,
} from '../../dist/1.x/webgpu-utils.module.js';
import { assertArrayEqual, assertEqual, assertTruthy } from '../assert.js';

describe('buffer-views-tests', () => {

    afterEach(() => {
        setIntrinsicsToView([]);
    });

    it('handles intrinsics', () => {
        const shader = `
            @group(12) @binding(13) var<uniform> uni1: f32;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.uniforms.uni1);
        const asF32 = new Float32Array(arrayBuffer);
        views[0] = 123;
        assertTruthy(views instanceof Float32Array);
        assertEqual(asF32[0], 123);
    });

    it('generates handles built-in type aliases', () => {
        const shader = `
    struct VertexDesc {
        offset: u32,
        stride: u32,
        size: u32,
        padding: u32,
    };

    struct LineInfo {
        triDiv: u32,
        triMul: u32,
        midMod: u32,
        midDiv: u32,
        oddMod: u32,
        triMod: u32,
        pad0: u32,
        pad1: u32,
    };

    struct VSUniforms {
        worldViewProjection: mat4x4f,
        position: VertexDesc,
        lineInfo: LineInfo,
        color: vec4f,
        lightDirection: vec3f,
    };

    @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
    @group(0) @binding(1) var<storage> vertData: array<f32>;

    fn getVert(desc: VertexDesc, index: u32) -> vec4f {
        var v = vec4<f32>(0, 0, 0, 1);
        let offset = desc.offset + index * desc.stride;
        for (var i: u32 = 0u; i < desc.size; i += 1u) {
            v[i] = vertData[offset + i];
        }
        return v;
    }

    struct MyVSOutput {
        @builtin(position) position: vec4f,
    };

    @vertex
    fn myVSMain(@builtin(vertex_index) vertex_index: u32) -> MyVSOutput {
        var vsOut: MyVSOutput;
        var i = (vertex_index / vsUniforms.lineInfo.triDiv) * vsUniforms.lineInfo.triMul +
                ((vertex_index % vsUniforms.lineInfo.midMod) / vsUniforms.lineInfo.midDiv +
                (vertex_index % vsUniforms.lineInfo.oddMod)) % vsUniforms.lineInfo.triMod;
        let position = getVert(vsUniforms.position, i);
        vsOut.position = vsUniforms.worldViewProjection * position;
        return vsOut;
    }

    @fragment
    fn myFSMain(v: MyVSOutput) -> @location(0) vec4f {
        return vsUniforms.color + vec4(vsUniforms.lightDirection, 0) * 0.0;
    }
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.structs.VSUniforms);
        assertEqual(arrayBuffer.byteLength, (16 + 4 + 8 + 4 + (3 + 1)) * 4);

        assertTruthy(views.worldViewProjection instanceof Float32Array);
        assertEqual(views.worldViewProjection.length, 16);
        assertEqual(views.worldViewProjection.byteOffset, 0);

        assertTruthy(views.lightDirection instanceof Float32Array);
        assertEqual(views.lightDirection.length, 3);
        assertEqual(views.lightDirection.byteOffset, (16 + 4 + 8 + 4) * 4);

    });

    it('generates views from shader source', () => {
        const shader = `
    struct VertexDesc {
        offset: u32,
        stride: u32,
        size: u32,
        padding: u32,
    };

    struct LineInfo {
        triDiv: u32,
        triMul: u32,
        midMod: u32,
        midDiv: u32,
        oddMod: u32,
        triMod: u32,
        pad0: u32,
        pad1: u32,
    };

    struct VSUniforms {
        worldViewProjection: mat4x4<f32>,
        position: VertexDesc,
        lineInfo: LineInfo,
        color: vec4<f32>,
        lightDirection: vec3<f32>,
    };

    @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
    @group(0) @binding(1) var<storage> vertData: array<f32>;

    fn getVert(desc: VertexDesc, index: u32) -> vec4<f32> {
        var v = vec4<f32>(0, 0, 0, 1);
        let offset = desc.offset + index * desc.stride;
        for (var i: u32 = 0u; i < desc.size; i += 1u) {
            v[i] = vertData[offset + i];
        }
        return v;
    }

    struct MyVSOutput {
        @builtin(position) position: vec4<f32>,
    };

    @vertex
    fn myVSMain(@builtin(vertex_index) vertex_index: u32) -> MyVSOutput {
        var vsOut: MyVSOutput;
        var i = (vertex_index / vsUniforms.lineInfo.triDiv) * vsUniforms.lineInfo.triMul +
                ((vertex_index % vsUniforms.lineInfo.midMod) / vsUniforms.lineInfo.midDiv +
                (vertex_index % vsUniforms.lineInfo.oddMod)) % vsUniforms.lineInfo.triMod;
        let position = getVert(vsUniforms.position, i);
        vsOut.position = vsUniforms.worldViewProjection * position;
        return vsOut;
    }

    @fragment
    fn myFSMain(v: MyVSOutput) -> @location(0) vec4<f32> {
        return vsUniforms.color + vec4(vsUniforms.lightDirection, 0) * 0.0;
    }
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.structs.VSUniforms);
        assertEqual(arrayBuffer.byteLength, (16 + 4 + 8 + 4 + (3 + 1)) * 4);

        assertTruthy(views.worldViewProjection instanceof Float32Array);
        assertEqual(views.worldViewProjection.length, 16);
        assertEqual(views.worldViewProjection.byteOffset, 0);

        assertTruthy(views.lightDirection instanceof Float32Array);
        assertEqual(views.lightDirection.length, 3);
        assertEqual(views.lightDirection.byteOffset, (16 + 4 + 8 + 4) * 4);

    });


    it('generates views from structure source', () => {
        const shader = `
    struct VertexDesc {
        offset: u32,
        stride: u32,
        size: u32,
        padding: u32,
    };

    struct LineInfo {
        triDiv: u32,
        triMul: u32,
        midMod: u32,
        midDiv: u32,
        oddMod: u32,
        triMod: u32,
        pad0: u32,
        pad1: u32,
    };

    struct VSUniforms {
        worldViewProjection: mat4x4<f32>,
        position: VertexDesc,
        lineInfo: LineInfo,
        color: vec4<f32>,
        lightDirection: vec3<f32>,
    };
    @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
    @group(0) @binding(1) var<storage> vsStorage: VSUniforms;

        `;
        const defs = makeShaderDataDefinitions(shader);

        const test = (f) => {
            const {views, arrayBuffer} = makeStructuredView(f);
            assertEqual(arrayBuffer.byteLength, (16 + 4 + 8 + 4 + (3 + 1)) * 4);

            assertTruthy(views.worldViewProjection instanceof Float32Array);
            assertEqual(views.worldViewProjection.length, 16);
            assertEqual(views.worldViewProjection.byteOffset, 0);

            assertTruthy(views.lightDirection instanceof Float32Array);
            assertEqual(views.lightDirection.length, 3);
            assertEqual(views.lightDirection.byteOffset, (16 + 4 + 8 + 4) * 4);
        };

        test(defs.structs.VSUniforms);
        test(defs.uniforms.vsUniforms);
        test(defs.storages.vsStorage);
    });

    it('handles atomics', () => {
        const shader = `
    struct AB {
        a: atomic<u32>,
        b: array<atomic<u32>, 4>,
    };

    @group(0) @binding(0) var<storage, read_write> s1: atomic<u32>;
    @group(0) @binding(1) var<storage, read_write> s2: array<atomic<u32>, 4>;
    @group(0) @binding(2) var<storage, read_write> s3: AB;
    @group(0) @binding(0) var<storage, read_write> s4: atomic<i32>;
        `;
        const defs = makeShaderDataDefinitions(shader);
        {
            const {views, arrayBuffer} = makeStructuredView(defs.storages.s1);
            assertEqual(arrayBuffer.byteLength, 4);
            assertEqual(views.length, 1);
            assertTruthy(views instanceof Uint32Array);
        }
        {
            const {views, arrayBuffer} = makeStructuredView(defs.storages.s2);
            assertEqual(arrayBuffer.byteLength, 16);
            assertEqual(views.length, 4);
            assertTruthy(views instanceof Uint32Array);
        }
        {
            const {views, arrayBuffer} = makeStructuredView(defs.storages.s3);
            assertEqual(arrayBuffer.byteLength, 20);
            assertEqual(views.a.length, 1);
            assertEqual(views.a.byteOffset, 0);
            assertEqual(views.b.length, 4);
            assertEqual(views.b.byteOffset, 4);
            assertTruthy(views.a instanceof Uint32Array);
            assertTruthy(views.b instanceof Uint32Array);
        }
        {
            const {views, arrayBuffer} = makeStructuredView(defs.storages.s4);
            assertEqual(arrayBuffer.byteLength, 4);
            assertEqual(views.length, 1);
            assertTruthy(views instanceof Int32Array);
        }
    });

    it('handles arrays of structs', () => {
        const shader = `
    struct VertexDesc {
        offset: u32,
        stride: u32,
        size: u32,
    };

    struct LineInfo {
        triDiv: u32,
        triMul: u32,
        midMod: u32,
        midDiv: u32,
        oddMod: u32,
        triMod: u32,
    };

    struct VSUniforms {
        worldViewProjection: mat4x4<f32>,    //   0-> 63
        position: array<VertexDesc, 4>,      //  64->111   3 * 4 * 4
        lineInfo: array<LineInfo, 5>,        // 112->159   6 * 4 * 5
        color: vec4<f32>,                    // 240
        lightDirection: array<vec3<f32>, 6>, // 256
        kernel: vec4<u32>,                   // 352
        colorMult: vec4f,                    // 368
        colorMultU: vec4u,                   // 384
        colorMultI: vec4i,                   // 400
    };
        `;
        const defs = makeShaderDataDefinitions(shader).structs;
        const {views, set, arrayBuffer} = makeStructuredView(defs.VSUniforms);
        assertEqual(arrayBuffer.byteLength, (16 + 3 * 4 + 6 * 5 + 2 + 4 + (3 + 1) * 6 + 4 + 4 + 4 + 4) * 4);

        assertTruthy(views.worldViewProjection instanceof Float32Array);
        assertEqual(views.worldViewProjection.length, 16);
        assertEqual(views.worldViewProjection.byteOffset, 0);

        assertTruthy(views.lightDirection instanceof Float32Array);
        assertEqual(views.lightDirection.length, 6 * 4);
        assertEqual(views.lightDirection.byteOffset, (16 + 3 * 4 + 6 * 5 + 2 + 4) * 4);

        assertTruthy(views.colorMult instanceof Float32Array);
        assertTruthy(views.colorMultU instanceof Uint32Array);
        assertTruthy(views.colorMultI instanceof Int32Array);

        set({
            worldViewProjection: [1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34],
            position: [
                ,
                ,
                ,
                {offset: 111, stride: 222, size: 333},
            ],
            lineInfo: [
                ,
                ,
                ,
                {midMod: 444, triMod: 666},
            ],
            color: [100, 101, 102, 103],
            lightDirection: new Float32Array([
                901, 902, 903, 0,
                801, 802, 803, 0,
            701, 702, 703, 0,
                601, 602, 603, 0,
                501, 502, 503, 0,
                401, 402, 403, 0,
            ]),
            colorMultI: [51, 52, 53, -54],
        });

        assertArrayEqual(views.worldViewProjection, [1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34]);

        assertEqual(views.position[0].offset[0], 0);
        assertEqual(views.position[0].stride[0], 0);
        assertEqual(views.position[0].size[0], 0);

        assertEqual(views.position[1].offset[0], 0);
        assertEqual(views.position[1].stride[0], 0);
        assertEqual(views.position[1].size[0], 0);

        assertEqual(views.position[2].offset[0], 0);
        assertEqual(views.position[2].stride[0], 0);
        assertEqual(views.position[2].size[0], 0);

        assertEqual(views.position[3].offset[0], 111);
        assertEqual(views.position[3].stride[0], 222);
        assertEqual(views.position[3].size[0], 333);

        assertEqual(views.lineInfo[3].midMod[0], 444);
        assertEqual(views.lineInfo[3].triMod[0], 666);

        assertArrayEqual(views.color, [100, 101, 102, 103]);
        assertArrayEqual(views.lightDirection, [
                901, 902, 903, 0,
                801, 802, 803, 0,
                701, 702, 703, 0,
                601, 602, 603, 0,
                501, 502, 503, 0,
                401, 402, 403, 0,
            ]);
        assertArrayEqual(views.colorMultI, [51, 52, 53, -54]);
    });

    it('lets you set arrays of base types as arrays', () => {
        const shader = `
        struct VSUniforms {
            lightDirection: array<vec3<f32>, 6>,
        };
        `;
        const defs = makeShaderDataDefinitions(shader).structs;
        const {views, set, arrayBuffer} = makeStructuredView(defs.VSUniforms);
        assertEqual(arrayBuffer.byteLength, (4) * 4 * 6);

        assertTruthy(views.lightDirection instanceof Float32Array);
        assertEqual(views.lightDirection.length, 6 * 4);
        assertEqual(views.lightDirection.byteOffset, 0);

        set({
            lightDirection: [
                [901, 902, 903],
                [801, 802, 803],
                [701, 702, 703],
                [601, 602, 603],
                [501, 502, 503],
                [401, 402, 403],
            ],
        });

        const expectedValues = [
            [901, 902, 903],
            [801, 802, 803],
            [701, 702, 703],
            [601, 602, 603],
            [501, 502, 503],
            [401, 402, 403],
        ];
        expectedValues.forEach((expected, i) => {
            const offset = i * 4;
            assertArrayEqual(views.lightDirection.slice(offset, offset + 3), expected);
        });
    });

    it('lets you set arrays of vec2s from array of arrays', () => {
        const structDef = makeShaderDataDefinitions(`struct S { data: array<vec2u, 2> }`);
        const struct = makeStructuredView(structDef.structs.S);
        struct.set({ data: [[0, 1], [2, 3]] });
        assertArrayEqual(struct.views.data, [0, 1, 2, 3]);
    });

    it('lets you set arrays of vec3s from array of arrays', () => {
        const structDef = makeShaderDataDefinitions(`struct S { data: array<vec3u, 2> }`);
        const struct = makeStructuredView(structDef.structs.S);
        struct.set({ data: [[1, 2, 3], [4, 5, 6]] });
        assertArrayEqual(struct.views.data, [1, 2, 3, 0, 4, 5, 6, 0]);
    });

    it('makes arrays of base types the same for uniforms and structures', () => {
        const shader = `
        struct Test {
            foo: array<vec3<f32>, 16>,
        };
        @group(0) @binding(0) var<uniform> myUniformsStruct: Test;
        @group(0) @binding(1) var<uniform> myUniformsArray: array<vec3<f32>, 16>;
        `;
        const defs = makeShaderDataDefinitions(shader).uniforms;
        {
            const {set, arrayBuffer} = makeStructuredView(defs.myUniformsStruct);
            set({foo: [1, 22, 333]});
            const expected = new Float32Array(64);
            expected.set([1, 22, 333]);
            const actual = new Float32Array(arrayBuffer);
            assertArrayEqual(actual, expected);
        }
        {
            const {views, set} = makeStructuredView(defs.myUniformsArray);
            set([1, 22, 333]);
            const expected = new Float32Array(64);
            expected.set([1, 22, 333]);
            assertArrayEqual(views, expected);
        }
    });

    it('handles base types', () => {
        const shader = `
        @group(0) @binding(0) var<uniform> myUniforms: i32;
        `;
        const defs = makeShaderDataDefinitions(shader).uniforms;
        const {views, set} = makeStructuredView(defs.myUniforms);
        set([123]);
        assertArrayEqual(views, [123]);
    });

    it('handles array of base types', () => {
        const shader = `
        @group(0) @binding(0) var<uniform> myUniforms: array<vec3<f32>, 16>;
        `;
        const defs = makeShaderDataDefinitions(shader).uniforms;
        const {views, set} = makeStructuredView(defs.myUniforms);
        set([1, 22, 333]);
        const expected = new Float32Array(64);
        expected.set([1, 22, 333]);
        assertArrayEqual(views, expected);
    });

    it('sets structured values', () => {
        const shader = `
            struct VertexDesc {
                offset: u32,
                stride: u32,
                size: u32,
            };

            struct LineInfo {
                triDiv: u32,
                triMul: u32,
                midMod: u32,
                midDiv: u32,
                oddMod: u32,
                triMod: u32,
            };

            struct VSUniforms {
                worldViewProjection: mat4x4<f32>,    // 0
                position: array<VertexDesc, 4>,      // (16 + (3 * ndx)) * 4 
                lineInfo: array<LineInfo, 5>,        // (16 + (3 * 4  ) + (6 * ndx)) * 4
                color: vec4<f32>,                    // (16 + (3 * 4  ) + (6 * 5  )) * 4
                lightDirection: array<vec3<f32>, 6>, // (16 + (3 * 4  ) + (6 * 5  ) + 4) * 4 
            };
            @group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
        `;
        const defs = makeShaderDataDefinitions(shader).uniforms;
        const def = defs.vsUniforms;
        const arrayBuffer = new ArrayBuffer(def.size);

        setStructuredValues(def, {
            worldViewProjection: [1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34],
            position: [
                ,
                ,
                ,
                {offset: 111, stride: 222, size: 333},
            ],
            lineInfo: [
                ,
                ,
                ,
                {midMod: 444, triMod: 666},
            ],
            color: [100, 101, 102, 103],
            lightDirection: new Float32Array([
                901, 902, 903, 0,
                801, 802, 803, 0,
                701, 702, 703, 0,
                601, 602, 603, 0,
                501, 502, 503, 0,
                401, 402, 403, 0,
            ]),
        }, arrayBuffer);

        const f32 = new Float32Array(arrayBuffer);
        const u32 = new Uint32Array(arrayBuffer);

        assertArrayEqual(f32.subarray(0, 16), [1, 2, 3, 4, 11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34]);

        const makeSub = (base, stride, size) => {
            return ndx => {
                const offset = base + stride * ndx;
                const range = [offset, offset + (size || stride)];
                return range;
            };
        };

        {
            const sub = makeSub(16, 3);
            assertArrayEqual(u32.subarray(...sub(0)), [0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(1)), [0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(2)), [0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(3)), [111, 222, 333]);
        }

        {
            const sub = makeSub(16 + 3 * 4, 6);
            assertArrayEqual(u32.subarray(...sub(0)), [0, 0, 0, 0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(1)), [0, 0, 0, 0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(2)), [0, 0, 0, 0, 0, 0]);
            assertArrayEqual(u32.subarray(...sub(3)), [0, 0, 444, 0, 0, 666]);
            assertArrayEqual(u32.subarray(...sub(4)), [0, 0, 0, 0, 0, 0]);
        }

        {
            const base = 16 + 3 * 4 + 6 * 5 + 2;
            assertArrayEqual(f32.subarray(base, base + 4), [100, 101, 102, 103]);
        }

        {
            const base = 16 + 3 * 4 + 6 * 5 + 2 + 4;
            assertArrayEqual(f32.subarray(base, base + 4 * 6), [
                    901, 902, 903, 0,
                    801, 802, 803, 0,
                    701, 702, 703, 0,
                    601, 602, 603, 0,
                    501, 502, 503, 0,
                    401, 402, 403, 0,
                ]);
        }
    });

    it('generates correct offsets for vec3 arrays vs vec3 fields', () => {
        const shader = `
      struct Ex4a {
        velocity: vec3f,
      };

      struct Ex4 {
        orientation: vec3f,
        size: f32,
        direction: array<vec3f, 1>,
        scale: f32,
        info: Ex4a,
        friction: f32,
      };
    @group(0) @binding(0) var<uniform> vsUniforms: Ex4;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.uniforms.vsUniforms);
        assertEqual(arrayBuffer.byteLength, (
            3 + // vec3f
            1 + // f32
            4 + // array<vec3f, 1>
            1 + // f32
            3 + // pad
            3 + // vec3
            1 + // pad
            1 + // f32
            3 + // pad
            0) * 4);

        assertEqual(views.orientation.length, 3);
        assertEqual(views.orientation.byteOffset, 0);

        assertEqual(views.size.length, 1);
        assertEqual(views.size.byteOffset, 12);

        assertEqual(views.direction.length, 4);
        assertEqual(views.direction.byteOffset, 16);

        assertEqual(views.scale.length, 1);
        assertEqual(views.scale.byteOffset, 32);

        assertEqual(views.info.velocity.length, 3);
        assertEqual(views.info.velocity.byteOffset, 48);

        assertEqual(views.friction.length, 1);
        assertEqual(views.friction.byteOffset, 64);
    });

    it('generates has different sizes for arrays/structs/base', () => {
        const shader = `
    struct VSUniforms {
        f1: vec3f,
    };
    struct VSUniforms2 {
        a1: array<vec3f, 1>,
        f1: vec3f,
    };
    @group(0) @binding(0) var<uniform> s: VSUniforms;
    @group(0) @binding(0) var<uniform> a: array<vec3f, 1>;
    @group(0) @binding(0) var<uniform> b: vec3f;
    @group(0) @binding(0) var<uniform> s2: VSUniforms2;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const views = {};
        for (const [name, uniform] of Object.entries(defs.uniforms)) {
            views[name] = makeStructuredView(uniform);
        }
        assertEqual(views.a.arrayBuffer.byteLength, 16);
        assertEqual(views.b.arrayBuffer.byteLength, 12);
        assertEqual(views.s.arrayBuffer.byteLength, 16);
        assertEqual(views.s2.arrayBuffer.byteLength, 32);
    });

    it('generates handles size and align attributes', () => {
        const shader = `
    struct VSUniforms {
        f1: f32,
        @align(32) f2: f32,
    };
    @group(0) @binding(0) var<uniform> s: VSUniforms;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.uniforms.s);

        // because Max(align(member))
        assertEqual(arrayBuffer.byteLength, 64);

        assertEqual(views.f1.length, 1);
        assertEqual(views.f1.byteOffset, 0);
        assertEqual(views.f2.length, 1);
        assertEqual(views.f2.byteOffset, 32);
    });

    it('generates uniform array of vec2f', () => {
        const shader = `
    struct Vert {
        position: vec2f,
    };
    @group(0) @binding(0) var<uniform> verts: array<Vert, 3>;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.uniforms.verts);

        assertEqual(arrayBuffer.byteLength, 6 * 4);

        assertEqual(views[0].position.length, 2);
        assertEqual(views[0].position.byteOffset, 0);
        assertEqual(views[1].position.length, 2);
        assertEqual(views[1].position.byteOffset, 8);
        assertEqual(views[2].position.length, 2);
        assertEqual(views[2].position.byteOffset, 16);
    });

   it('generates storage array of vec2f', () => {
        const shader = `
    struct Vert {
        position: vec2f,
    };
    @group(0) @binding(0) var<storage, read> verts: array<Vert, 3>;
        `;
        const defs = makeShaderDataDefinitions(shader);
        const {views, arrayBuffer} = makeStructuredView(defs.storages.verts);

        assertEqual(arrayBuffer.byteLength, 6 * 4);

        assertEqual(views[0].position.length, 2);
        assertEqual(views[0].position.byteOffset, 0);
        assertEqual(views[1].position.length, 2);
        assertEqual(views[1].position.byteOffset, 8);
        assertEqual(views[2].position.length, 2);
        assertEqual(views[2].position.byteOffset, 16);
    });

    /*
    it('works with const', () => {
      const code = `
        const MAX_LIGHTS = u32(sin(radians(90) * 3.0));

        struct light {
            color: vec4f,
            direction: vec3f,
        };

        @group(0) @binding(1) var<storage> lights: array<light, MAX_LIGHTS>;
      `;
      const d = makeShaderDataDefinitions(code);
      const defs = d.storages;
      assertTruthy(defs);
      assertTruthy(defs.lights);
      assertEqual(defs.lights.length, 3);
    });
    */

    it('works with nested aliases', () => {
        const code = `
            alias foo3 = u32;
            alias foo2 = foo3;
            alias foo1 = foo2;
            @group(0) @binding(0) var<uniform> f: foo1;
        `;
        const defs = makeShaderDataDefinitions(code).uniforms;
        const {views, /*set,*/ arrayBuffer} = makeStructuredView(defs.f);
        assertEqual(arrayBuffer.byteLength, 4);
        assertTruthy(views instanceof Uint32Array);
        assertEqual(views.length, 1);
    });

    it('works with nested aliases of structs', () => {
        const code = `
            struct Foo4 {
                a: u32,
                b: f32,
            };
            alias foo3 = Foo4;
            alias foo2 = foo3;
            alias foo1 = foo2;
            @group(0) @binding(0) var<uniform> f: foo1;
        `;
        const defs = makeShaderDataDefinitions(code).uniforms;
        const {views/*, set, arrayBuffer*/} = makeStructuredView(defs.f);
        assertEqual(views.a.length, 1);
        assertEqual(views.a.byteOffset, 0);
        assertEqual(views.b.length, 1);
        assertEqual(views.b.byteOffset, 4);
    });

    it('works with nested aliases of structs2', () => {
        const code = `
            struct Foo4 {
                a: u32,
                b: f32,
            };
            alias foo3 = Foo4;
            alias foo2 = foo3;
            alias foo1 = foo2;
            @group(0) @binding(0) var<uniform> f: Foo4;
        `;
        const defs = makeShaderDataDefinitions(code).uniforms;
        const {views/*, set, arrayBuffer*/} = makeStructuredView(defs.f);
        assertEqual(views.a.length, 1);
        assertEqual(views.a.byteOffset, 0);
        assertEqual(views.b.length, 1);
        assertEqual(views.b.byteOffset, 4);
    });

    it('works with complex alias and const expressions', () => {
        const code = `
            alias foo = u32;
            alias bar = foo;

            struct Vehicle {
              num_wheels: bar,
              mass_kg: f32,
            }

            alias Car = Vehicle;

            struct Ship {
                cars: array<Car, 4>,
            };

            const a_bicycle = Car(2, 10.5);
            const bike_num_wheels = a_bicycle.num_wheels;

            struct Ocean {
                things: array<Ship, a_bicycle.num_wheels>,
            };
        `;
        const defs = makeShaderDataDefinitions(code).structs;
        const {views, set, arrayBuffer} = makeStructuredView(defs.Ocean);
        assertEqual(arrayBuffer.byteLength, 64);
        assertEqual(views.things.length, 2);
        set({
            things: [
                {
                    cars: [
                        { num_wheels: 2, mass_kg: 5 },
                    ],
                },
                {
                    cars: [
                        ,
                        ,
                        ,
                        { num_wheels: 22, mass_kg: 55 },
                    ],
                },
            ],
        });
        const f32 = new Float32Array(arrayBuffer);
        const u32 = new Uint32Array(arrayBuffer);
        assertEqual(f32[f32.length - 1], 55);
        assertEqual(u32[u32.length - 2], 22);

    });

    it('sets arrays of arrays', () => {
        const code = `
            struct InnerUniforms {
                bar: u32,
            };

            struct VSUniforms {
                foo: u32,
                moo: InnerUniforms,
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
        const defs = makeShaderDataDefinitions(code).uniforms;
        {
            const {/*views, set,*/ arrayBuffer} = makeStructuredView(defs.foo0);
            assertEqual(arrayBuffer.byteLength, 12);
        }
        {
            const {/*views, set,*/ arrayBuffer} = makeStructuredView(defs.foo1);
            assertEqual(arrayBuffer.byteLength, 16 * 5);
        }
        {
            const {views, set, arrayBuffer} = makeStructuredView(defs.foo7);
            // 2 * 4 * 5 * 6 * 7
            assertEqual(arrayBuffer.byteLength, 2 * 4 * 5 * 6 * 7);  // 1680
            assertTruthy(views[6][5][4].foo instanceof Uint32Array);
            assertTruthy(views[6][5][4].moo.bar instanceof Uint32Array);
            set([
              , // 0
              , // 1
              , // 2
              , // 3
              , // 4
              , // 5
              [
                , // 0
                , // 1
                , // 2
                , // 3
                , // 4
                [
                  , // 0
                  , // 1
                  , // 2
                  , // 3
                  { foo: 123, moo: { bar: 456 }},
                ],
              ],
            ]);
            assertEqual(views[6][5][4].foo[0], 123);
            assertEqual(views[6][5][4].moo.bar[0], 456);
        }
    });

    it('handles unsigned arrays of intrinsics', () => {
        const code = `
            @group(0) @binding(1) var<storage> foo1: array<u32>;
            @group(0) @binding(1) var<storage> foo2: array<vec3f>;
            @group(0) @binding(2) var<storage> foo3: array<array<vec3f, 5> >;
        `;
        const defs = makeShaderDataDefinitions(code).storages;
        {
            const arrayBuffer = new ArrayBuffer(10 * 4);
            const asU32 = new Uint32Array(arrayBuffer);
            setStructuredValues(defs.foo1, [11, 22, 33], arrayBuffer);
            assertEqual(asU32[0], 11);
            assertEqual(asU32[1], 22);
            assertEqual(asU32[2], 33);
        }
        {
            const arrayBuffer = new ArrayBuffer(10 * 4);
            const asU32 = new Uint32Array(arrayBuffer);
            const v = makeStructuredView(defs.foo1, arrayBuffer);
            v.set([11, 22, 33]);
            assertEqual(asU32[0], 11);
            assertEqual(asU32[1], 22);
            assertEqual(asU32[2], 33);
        }
        {
            const arrayBuffer = new ArrayBuffer(4 * 4 * 4);
            const asF32 = new Float32Array(arrayBuffer);
            setStructuredValues(defs.foo2, [12, 13, 14, 0, 21, 22, 23, 0], arrayBuffer);
            assertEqual(asF32.subarray(0, 3), [12, 13, 14]);
            assertEqual(asF32.subarray(4, 7), [21, 22, 23]);
        }
        {
            const arrayBuffer = new ArrayBuffer(4 * 4 * 5 * 6);
            const asF32 = new Float32Array(arrayBuffer);
            setStructuredValues(defs.foo3, [[12, 13, 14], , [21, 22, 23]], arrayBuffer);
            assertEqual(asF32.subarray(0, 3), [12, 13, 14]);
            assertEqual(asF32.subarray(5 * 4 * 2, 5 * 4 * 2 + 3), [21, 22, 23]);
        }
        {
            const arrayBuffer = new ArrayBuffer(4 * 4 * 5 * 6);
            const asF32 = new Float32Array(arrayBuffer);
            const v = makeStructuredView(defs.foo3, arrayBuffer, 0);
            v.set([[12, 13, 14], , [21, 22, 23]]);
            assertEqual(asF32.subarray(0, 3), [12, 13, 14]);
            assertEqual(asF32.subarray(5 * 4 * 2, 5 * 4 * 2 + 3), [21, 22, 23]);
        }
    });

    it('handles unsized arrays of structs', () => {
        const shader = `
            struct Test {
                a: u32,
                b: u32,
            };
            @group(0) @binding(0) var<storage> foo: array<Test>;
        `;
        const defs = makeShaderDataDefinitions(shader).storages;
        const {size: elemSize} = getSizeAndAlignmentOfUnsizedArrayElement(defs.foo);
        const numElements = 4;
        const {views} = makeStructuredView(defs.foo, new ArrayBuffer(numElements * elemSize));
        assertTruthy(Array.isArray(views));
        assertEqual(views.length, 4);
        views.forEach((view, i) => {
            assertEqual(view.a.byteOffset, i * elemSize + 0);
            assertEqual(view.b.byteOffset, i * elemSize + 4);
        });
    });

    it('handles unsized arrays as last member of struct', () => {
        const shader = `
            struct Test {
                a: u32,
                b: u32,
                c: array<vec3f>,
            };
            @group(0) @binding(0) var<storage> foo: Test;
        `;
        const defs = makeShaderDataDefinitions(shader).storages;
        const {size: elemSize, align, unalignedSize} = getSizeAndAlignmentOfUnsizedArrayElement(defs.foo);
        assertEqual(unalignedSize, 12);
        assertEqual(align, 16);
        assertEqual(elemSize, 16);
        const numElements = 4;
        const {views} = makeStructuredView(
            defs.foo, new ArrayBuffer(defs.foo.size + numElements * elemSize));
        assertEqual(defs.foo.size, 2 * 4 + 8);
        assertEqual(views.c.length, 16);
        assertEqual(views.c.byteOffset, 16);
    });

    it('handles unsized arrays as last member of struct with viewed intrinsics', () => {
        const shader = `
            struct Test {
                a: u32,
                b: u32,
                c: array<vec3f>,
            };
            @group(0) @binding(0) var<storage> foo: Test;
        `;

        setIntrinsicsToView(['vec3f']);
        const defs = makeShaderDataDefinitions(shader).storages;
        const {size: elemSize, align, unalignedSize} = getSizeAndAlignmentOfUnsizedArrayElement(defs.foo);
        assertEqual(unalignedSize, 12);
        assertEqual(align, 16);
        assertEqual(elemSize, 16);
        const numElements = 4;
        const {views} = makeStructuredView(
            defs.foo, new ArrayBuffer(defs.foo.size + numElements * elemSize));
        assertEqual(defs.foo.size, 2 * 4 + 8);
        assertEqual(views.c.length, 4);
        views.c.forEach((view, i) => {
            assertEqual(view.length, 3);
            assertEqual(view.byteOffset, 16 + elemSize * i);
        });
    });

    // Note: At least as of WGSL V1 you can not create a bool for uniform or storage.
    // You can only create one in an internal struct. But, this code generates
    // views of structs and it needs to not fail if the struct has a bool
    it('generates handles bool', () => {
        const shader = `
            struct Test {
                a: u32,
                b: bool,
                c: u32,
            };
        `;
        const defs = makeShaderDataDefinitions(shader).structs;
        const {views, arrayBuffer} = makeStructuredView(defs.Test);
        assertEqual(arrayBuffer.byteLength, 8);
        assertEqual(views.a.byteOffset, 0);
        assertEqual(views.c.byteOffset, 4);
    });

    describe('expand arrays of intrinsics', () => {
        it('expands arrays of intrinsics', () => {
            setIntrinsicsToView(['vec3f', 'vec3<f32>']);
            const shader = `
                struct A {
                  a: array<vec3f, 3>,
                  b: f32
                };
            `;
            const defs = makeShaderDataDefinitions(shader).structs;
            const {views, arrayBuffer} = makeStructuredView(defs.A);
            assertEqual(arrayBuffer.byteLength, 4 * 3 * 4 + 4 + 12);
            assertEqual(views.a[0].byteOffset, 0);
            assertEqual(views.a[1].length, 3);
            assertEqual(views.b.byteOffset, 4 * 3 * 4);
        });

        it('by default it does not expand arrays of intrinsics', () => {
            const shader = `
                struct A {
                  a: array<vec3f, 3>,
                  b: f32
                };
            `;
            const defs = makeShaderDataDefinitions(shader).structs;
            const {views, arrayBuffer} = makeStructuredView(defs.A);
            assertEqual(arrayBuffer.byteLength, 4 * 3 * 4 + 4 + 12);
            assertEqual(views.a.byteOffset, 0);
            assertEqual(views.a.length, 12);
            assertEqual(views.b.byteOffset, 4 * 3 * 4);
        });
    });

    /* wgsl_reflect returns bad data for this case. See comment above though.
    it('generates handles bool array', () => {
        const shader = `
            struct Test {
                a: u32,
                b: array<bool, 3>,
                c: u32,
            };
        `;
        const defs = makeShaderDataDefinitions(shader).structs;
        const {views, arrayBuffer} = makeStructuredView(defs.Test);
        assertEqual(arrayBuffer.byteLength, 8);
        assertEqual(views.a.byteOffset, 0);
        assertEqual(views.c.byteOffset, 4);
    });
    */

    describe('gets size of unsized array elements', () => {
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

            struct WithUnsizedArrayMember {
                foo: u32,
                bar: array<VSUniforms>,
            };

            struct WithUnsizedArrayArrayMember {
                foo: u32,
                bar: array<array<VSUniforms, 5>>,
            };

            @group(0) @binding(1) var<storage> foo1: array<vec3f>;
            @group(0) @binding(2) var<storage> foo2: array<array<vec3f, 5> >;

            @group(0) @binding(5) var<storage> foo5: array<VSUniforms>;
            @group(0) @binding(6) var<storage> foo6: array<array<VSUniforms, 5> >;

            @group(0) @binding(7) var<storage> foo7: WithUnsizedArrayMember;
            @group(0) @binding(7) var<storage> foo8: WithUnsizedArrayArrayMember;
        `;

        it('for intrinsic', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align, unalignedSize} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo1);
            assertEqual(size, 16);
            assertEqual(align, 16);
            assertEqual(unalignedSize, 12);
        });

        it('for array of intrinsic', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align, unalignedSize} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo2);
            assertEqual(size, 20 * 4);
            assertEqual(align, 16);
            assertEqual(unalignedSize, 20 * 4);
        });

        it('for struct', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo5);
            assertEqual(size, (4 + 4) * 4);
            assertEqual(align, 4);
        });

        it('for array of struct', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo6);
            assertEqual(size, (4 + 4) * 4 * 5);
            assertEqual(align, 4);
        });

        it('for last field of struct', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo7);
            assertEqual(size, (4 + 4) * 4);
            assertEqual(align, 4);
        });

        it('for last field of struct array', () => {
            const d = makeShaderDataDefinitions(code);
            assertTruthy(d);
            const {size, align} = getSizeAndAlignmentOfUnsizedArrayElement(d.storages.foo8);
            assertEqual(size, (4 + 4) * 4 * 5);
            assertEqual(align, 4);
            const numElements = 3;
            const { views } = makeStructuredView(d.storages.foo8, new ArrayBuffer(d.storages.foo8.size + size * numElements));
            assertEqual(views.bar.length, 3);
            assertEqual(views.bar[2].length, 5);
        });

    });
});