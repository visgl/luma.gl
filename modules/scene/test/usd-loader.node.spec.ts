import {expect, it} from 'vitest';
import {parse} from '@loaders.gl/core';
import {readFile} from 'node:fs/promises';
import {USDLoader, parseUSD} from '../../../examples/showcase/scene/usd-loader/usd-loader';
import {makeANARIJSONSceneFromUSD} from '../../../examples/showcase/scene/usd-to-anari';

const TEXT_ENCODER = new TextEncoder();

it('OpenUSD loader exposes a loaders.gl-compatible ASCII loader', async () => {
  const source = `#usda 1.0
(
    defaultPrim = "World"
    upAxis = "Z"
    metersPerUnit = 0.01
)

def Xform "World"
{
    def Mesh "Triangle"
    {
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        color3f[] primvars:displayColor = [(0.1, 0.4, 0.9)]
    }
}`;
  const stage = await parse(TEXT_ENCODER.encode(source).buffer, USDLoader);

  expect(USDLoader.id, 'the future loaders.gl module uses the usd identifier').toBe('usd');
  expect(stage.metadata['upAxis'], 'stage metadata remains available').toBe('Z');
  expect(stage.metadata['metersPerUnit'], 'numeric metadata is parsed').toBe(0.01);
  expect(stage.rootPrims[0].children[0].type, 'nested prim types are preserved').toBe('Mesh');
  expect(
    stage.rootPrims[0].children[0].attributes['points'].value,
    'nested point arrays are decoded'
  ).toEqual([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0]
  ]);
  void 0;
});

it('OpenUSD loader resolves references, variants, and local overrides', async () => {
  const layers = new Map([
    [
      'https://example.com/assets/geometry.usda',
      `#usda 1.0
(defaultPrim = "Geometry")
def Mesh "Geometry"
{
    point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
    int[] faceVertexCounts = [3]
    int[] faceVertexIndices = [0, 1, 2]
    def GeomSubset "Paint"
    {
        int[] indices = [0]
        rel material:binding = </Materials/Original>
    }
}`
    ],
    [
      'https://example.com/assets/variants.usda',
      `#usda 1.0
(defaultPrim = "Selection")
def Xform "Selection" (
    variants = {string finish = "blue"}
    prepend variantSets = "finish"
)
{
    variantSet "finish" = {
        "blue" {def "Body" (prepend references = @./geometry.usda@) {}}
        "gold" {def "GoldBody" (prepend references = @./geometry.usda@) {}}
    }
}`
    ]
  ]);
  const source = `#usda 1.0
(defaultPrim = "World")
def Xform "World"
{
    def "Vehicle" (
        prepend references = @./assets/variants.usda@
        variants = {string finish = "gold"}
    )
    {
        over "GoldBody"
        {
            over "Paint" {rel material:binding = </Materials/Gold>}
        }
    }
}`;
  const stage = await parseUSD(
    TEXT_ENCODER.encode(source).buffer,
    {core: {baseUrl: 'https://example.com/scene.usda'}},
    {
      fetch: async url => {
        const layer = layers.get(String(url));
        return new Response(layer, {status: layer ? 200 : 404});
      },
      _parse: async () => undefined
    }
  );
  const vehicle = stage.rootPrims[0].children[0];
  const goldBody = vehicle.children.find(child => child.name === 'GoldBody');

  expect(stage.layers.length, 'root and both referenced layers are tracked').toBe(3);
  expect(goldBody?.type, 'the chosen variant resolves its referenced geometry').toBe('Mesh');
  expect(
    goldBody?.children[0].attributes['material:binding'].value,
    'local over opinions replace referenced material bindings'
  ).toEqual({path: '/Materials/Gold'});
  void 0;
});

it('OpenUSD loader rejects unsupported binary USDC layers explicitly', async () => {
  try {
    await parseUSD(TEXT_ENCODER.encode('PXR-USDC\0\0').buffer);
    expect(false, 'binary USD crates should not silently parse as ASCII').toBe(true);
  } catch (error) {
    expect(String(error), 'unsupported crates report the actual missing format').toMatch(
      /Binary USDC crate layers are not implemented/
    );
  }
  void 0;
});

it('OpenUSD loader reads uncompressed ASCII-root USDZ archives', async () => {
  const filename = TEXT_ENCODER.encode('scene.usda');
  const contents = TEXT_ENCODER.encode('#usda 1.0\ndef Xform "PackagedWorld" {}');
  const localHeaderLength = 30 + filename.length;
  const centralDirectoryOffset = localHeaderLength + contents.length;
  const centralDirectoryLength = 46 + filename.length;
  const archive = new ArrayBuffer(centralDirectoryOffset + centralDirectoryLength + 22);
  const bytes = new Uint8Array(archive);
  const view = new DataView(archive);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint32(18, contents.length, true);
  view.setUint32(22, contents.length, true);
  view.setUint16(26, filename.length, true);
  bytes.set(filename, 30);
  bytes.set(contents, localHeaderLength);

  view.setUint32(centralDirectoryOffset, 0x02014b50, true);
  view.setUint16(centralDirectoryOffset + 4, 20, true);
  view.setUint16(centralDirectoryOffset + 6, 20, true);
  view.setUint32(centralDirectoryOffset + 20, contents.length, true);
  view.setUint32(centralDirectoryOffset + 24, contents.length, true);
  view.setUint16(centralDirectoryOffset + 28, filename.length, true);
  bytes.set(filename, centralDirectoryOffset + 46);

  const endOffset = centralDirectoryOffset + centralDirectoryLength;
  view.setUint32(endOffset, 0x06054b50, true);
  view.setUint16(endOffset + 8, 1, true);
  view.setUint16(endOffset + 10, 1, true);
  view.setUint32(endOffset + 12, centralDirectoryLength, true);
  view.setUint32(endOffset + 16, centralDirectoryOffset, true);

  const stage = await parseUSD(archive);

  expect(stage.format, 'packaged stages retain their USDZ format').toBe('usdz');
  expect(stage.rootPrims[0].name, 'the ASCII root layer is composed').toBe('PackagedWorld');
  void 0;
});

it('OpenUSD importer composes the bundled CC0 sedan and preserves material groups', async () => {
  const assetRoot = new URL(
    '../../../examples/showcase/scene/public/usd/mini-vehicles/',
    import.meta.url
  );
  const rootPath = 'assets/vehicles/sedan/asset/sedanFullAsset.usda';
  const rootData = await readFile(new URL(rootPath, assetRoot));
  const stage = await parseUSD(
    rootData.buffer.slice(rootData.byteOffset, rootData.byteOffset + rootData.byteLength),
    {
      core: {baseUrl: `https://assets.example/${rootPath}`},
      usd: {variantSelections: {wheels: 'wheelNormal'}}
    },
    {
      fetch: async url => {
        const relativePath = new URL(String(url)).pathname.slice(1);
        try {
          const data = await readFile(new URL(relativePath, assetRoot));
          return new Response(data);
        } catch {
          return new Response(null, {status: 404});
        }
      },
      _parse: async () => undefined
    }
  );
  const scene = makeANARIJSONSceneFromUSD(stage, 'TEST SEDAN');
  expect(
    Boolean(stage.layers.length > 7),
    'external geometry, wheel, and material layers resolve'
  ).toBe(true);
  expect(
    Boolean(Object.keys(scene.geometries).length > 4),
    'material subsets become ANARI surfaces'
  ).toBe(true);
  expect(
    Boolean((scene.instances?.length || 0) > 8),
    'shared wheel assemblies retain placements'
  ).toBe(true);
  expect(
    Boolean(
      Object.values(scene.textures || {}).some(texture => texture.source.endsWith('/red.jpg'))
    ),
    'USD material bindings resolve the authored crimson texture relative to its material layer'
  ).toBe(true);
  expect(
    Boolean(Object.values(scene.materials).some(material => material.baseColorTexture)),
    'USD preview-surface connections become retained image samplers'
  ).toBe(true);
  expect(
    Boolean(
      Object.values(scene.geometries).some(
        geometry => (geometry['vertex.attribute1']?.length || 0) > 0
      )
    ),
    'USD primvar UVs remain retained geometry attributes'
  ).toBe(true);
  expect(
    Boolean(
      Object.entries(scene.materials)
        .filter(([identifier]) => identifier.includes('greylight'))
        .every(([_identifier, material]) => material.emissive === undefined)
    ),
    'light-grey materials are not accidentally classified as emissive vehicle lights'
  ).toBe(true);
  expect(
    Boolean(Math.hypot(...(scene.camera.position || [0, 0, 0])) < 30),
    'large source assets are normalized into a point-light-friendly studio scale'
  ).toBe(true);
  expect(
    (scene.lights || []).filter(light => light.animation?.['@@type'] === 'follow').length,
    'animated cyan and amber point lights follow their visible HDR emitters'
  ).toBe(2);
  void 0;
});

it('OpenUSD importer composes detailed Fancy and Utah teapot reference geometry', async () => {
  const assetRoot = new URL('../../../examples/showcase/scene/public/usd/', import.meta.url);
  const rootPath = 'porcelain-atelier.usda';
  const rootData = await readFile(new URL(rootPath, assetRoot));
  const stage = await parseUSD(
    rootData.buffer.slice(rootData.byteOffset, rootData.byteOffset + rootData.byteLength),
    {core: {baseUrl: `https://assets.example/${rootPath}`}},
    {
      fetch: async url => {
        const relativePath = new URL(String(url)).pathname.slice(1);
        try {
          return new Response(await readFile(new URL(relativePath, assetRoot)));
        } catch {
          return new Response(null, {status: 404});
        }
      },
      _parse: async () => undefined
    }
  );
  const fancyCenterpiece = stage.rootPrims[0].children.find(
    prim => prim.name === 'FancyCenterpiece'
  );
  const fancyGeometry = fancyCenterpiece?.children.find(prim => prim.name === 'Geometry');
  const scene = makeANARIJSONSceneFromUSD(stage, 'PORCELAIN ATELIER');

  expect(stage.layers.length, 'Fancy and Utah references share composed stage layers').toBe(3);
  expect(fancyGeometry?.type, 'the detailed Fancy centerpiece resolves as a mesh').toBe('Mesh');
  expect(
    Boolean(Array.isArray(fancyGeometry?.attributes['points']?.value)),
    'large OpenUSD point arrays survive parsing'
  ).toBe(true);
  expect(
    Boolean(
      Object.keys(scene.materials).some(identifier => identifier.includes('midnightporcelain'))
    ),
    'the centerpiece preserves its authored material override'
  ).toBe(true);
  expect(
    Boolean((scene.instances?.length || 0) > 40),
    'the cinematic stage includes reference geometry and instanced architectural accents'
  ).toBe(true);
  const haloInstances = (scene.instances || []).filter(instance =>
    instance['@@id'].includes('goldorb')
  );
  expect(haloInstances.length, 'USD point instancers produce every authored halo orb').toBe(11);
  expect(
    new Set(haloInstances.map(instance => instance.surface)).size,
    'repeated point-instancer primitives reuse one retained ANARI surface'
  ).toBe(1);
  void 0;
});

it('OpenUSD importer stages the detailed attributed Open Chess Set knight', async () => {
  const assetRoot = new URL('../../../examples/showcase/scene/public/usd/', import.meta.url);
  const rootPath = 'knights-gambit.usda';
  const rootData = await readFile(new URL(rootPath, assetRoot));
  const stage = await parseUSD(
    rootData.buffer.slice(rootData.byteOffset, rootData.byteOffset + rootData.byteLength),
    {core: {baseUrl: `https://assets.example/${rootPath}`}},
    {
      fetch: async url => {
        const relativePath = new URL(String(url)).pathname.slice(1);
        try {
          return new Response(await readFile(new URL(relativePath, assetRoot)));
        } catch {
          return new Response(null, {status: 404});
        }
      },
      _parse: async () => undefined
    }
  );
  const scene = makeANARIJSONSceneFromUSD(stage, 'KNIGHT’S GAMBIT');
  const detailedTriangleCount = Object.values(scene.geometries).reduce(
    (triangleCount, geometry) => triangleCount + (geometry['vertex.position']?.length || 0) / 9,
    0
  );

  expect(stage.layers.length, 'the knight geometry resolves as one shared USD reference').toBe(2);
  expect(
    Boolean(detailedTriangleCount > 20000),
    'the knight contains production-quality mesh detail'
  ).toBe(true);
  expect(
    Boolean(Object.keys(scene.materials).some(identifier => identifier.includes('royalgold'))),
    'gold material overrides survive reference composition'
  ).toBe(true);
  expect(
    Boolean(Object.keys(scene.materials).some(identifier => identifier.includes('frozensilver'))),
    'separate material overrides create a contrasting silver knight'
  ).toBe(true);
  void 0;
});
