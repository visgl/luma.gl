import test from 'test/utils/vitest-tape';
import {parse} from '@loaders.gl/core';
import {readFile} from 'node:fs/promises';
import {USDLoader, parseUSD} from '../../../examples/showcase/anari/usd-loader/usd-loader';
import {makeANARIJSONSceneFromUSD} from '../../../examples/showcase/anari/usd-to-anari';

const TEXT_ENCODER = new TextEncoder();

test('OpenUSD loader exposes a loaders.gl-compatible ASCII loader', async testContext => {
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

  testContext.equal(USDLoader.id, 'usd', 'the future loaders.gl module uses the usd identifier');
  testContext.equal(stage.metadata['upAxis'], 'Z', 'stage metadata remains available');
  testContext.equal(stage.metadata['metersPerUnit'], 0.01, 'numeric metadata is parsed');
  testContext.equal(stage.rootPrims[0].children[0].type, 'Mesh', 'nested prim types are preserved');
  testContext.deepEqual(
    stage.rootPrims[0].children[0].attributes['points'].value,
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0]
    ],
    'nested point arrays are decoded'
  );
  testContext.end();
});

test('OpenUSD loader resolves references, variants, and local overrides', async testContext => {
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

  testContext.equal(stage.layers.length, 3, 'root and both referenced layers are tracked');
  testContext.equal(goldBody?.type, 'Mesh', 'the chosen variant resolves its referenced geometry');
  testContext.deepEqual(
    goldBody?.children[0].attributes['material:binding'].value,
    {path: '/Materials/Gold'},
    'local over opinions replace referenced material bindings'
  );
  testContext.end();
});

test('OpenUSD loader rejects unsupported binary USDC layers explicitly', async testContext => {
  try {
    await parseUSD(TEXT_ENCODER.encode('PXR-USDC\0\0').buffer);
    testContext.fail('binary USD crates should not silently parse as ASCII');
  } catch (error) {
    testContext.match(
      String(error),
      /Binary USDC crate layers are not implemented/,
      'unsupported crates report the actual missing format'
    );
  }
  testContext.end();
});

test('OpenUSD loader reads uncompressed ASCII-root USDZ archives', async testContext => {
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

  testContext.equal(stage.format, 'usdz', 'packaged stages retain their USDZ format');
  testContext.equal(stage.rootPrims[0].name, 'PackagedWorld', 'the ASCII root layer is composed');
  testContext.end();
});

test('OpenUSD importer composes the bundled CC0 sedan and preserves material groups', async testContext => {
  const assetRoot = new URL(
    '../../../examples/showcase/anari/public/usd/mini-vehicles/',
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
  testContext.ok(stage.layers.length > 7, 'external geometry, wheel, and material layers resolve');
  testContext.ok(
    Object.keys(scene.geometries).length > 4,
    'material subsets become ANARI surfaces'
  );
  testContext.ok((scene.instances?.length || 0) > 8, 'shared wheel assemblies retain placements');
  testContext.ok(
    Object.values(scene.textures || {}).some(texture => texture.source.endsWith('/red.jpg')),
    'USD material bindings resolve the authored crimson texture relative to its material layer'
  );
  testContext.ok(
    Object.values(scene.materials).some(material => material.baseColorTexture),
    'USD preview-surface connections become retained image samplers'
  );
  testContext.ok(
    Object.values(scene.geometries).some(
      geometry => (geometry['vertex.attribute1']?.length || 0) > 0
    ),
    'USD primvar UVs remain retained geometry attributes'
  );
  testContext.ok(
    Object.entries(scene.materials)
      .filter(([identifier]) => identifier.includes('greylight'))
      .every(([_identifier, material]) => material.emissive === undefined),
    'light-grey materials are not accidentally classified as emissive vehicle lights'
  );
  testContext.ok(
    Math.hypot(...(scene.camera.position || [0, 0, 0])) < 30,
    'large source assets are normalized into a point-light-friendly studio scale'
  );
  testContext.equal(
    (scene.lights || []).filter(light => light.animation?.['@@type'] === 'follow').length,
    2,
    'animated cyan and amber point lights follow their visible HDR emitters'
  );
  testContext.end();
});

test('OpenUSD importer composes detailed Fancy and Utah teapot reference geometry', async testContext => {
  const assetRoot = new URL('../../../examples/showcase/anari/public/usd/', import.meta.url);
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

  testContext.equal(
    stage.layers.length,
    3,
    'Fancy and Utah references share composed stage layers'
  );
  testContext.equal(
    fancyGeometry?.type,
    'Mesh',
    'the detailed Fancy centerpiece resolves as a mesh'
  );
  testContext.ok(
    Array.isArray(fancyGeometry?.attributes['points']?.value),
    'large OpenUSD point arrays survive parsing'
  );
  testContext.ok(
    Object.keys(scene.materials).some(identifier => identifier.includes('midnightporcelain')),
    'the centerpiece preserves its authored material override'
  );
  testContext.ok(
    (scene.instances?.length || 0) > 40,
    'the cinematic stage includes reference geometry and instanced architectural accents'
  );
  const haloInstances = (scene.instances || []).filter(instance =>
    instance['@@id'].includes('goldorb')
  );
  testContext.equal(
    haloInstances.length,
    11,
    'USD point instancers produce every authored halo orb'
  );
  testContext.equal(
    new Set(haloInstances.map(instance => instance.surface)).size,
    1,
    'repeated point-instancer primitives reuse one retained ANARI surface'
  );
  testContext.end();
});

test('OpenUSD importer stages the detailed attributed Open Chess Set knight', async testContext => {
  const assetRoot = new URL('../../../examples/showcase/anari/public/usd/', import.meta.url);
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

  testContext.equal(
    stage.layers.length,
    2,
    'the knight geometry resolves as one shared USD reference'
  );
  testContext.ok(
    detailedTriangleCount > 20000,
    'the knight contains production-quality mesh detail'
  );
  testContext.ok(
    Object.keys(scene.materials).some(identifier => identifier.includes('royalgold')),
    'gold material overrides survive reference composition'
  );
  testContext.ok(
    Object.keys(scene.materials).some(identifier => identifier.includes('frozensilver')),
    'separate material overrides create a contrasting silver knight'
  );
  testContext.end();
});
