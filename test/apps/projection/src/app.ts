import {Deck, OrthographicView} from '@deck.gl/core';
import {PathLayer as _PathLayer, ScatterplotLayer as _ScatterplotLayer} from '@deck.gl/layers';
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {type Device} from '@luma.gl/core';
import {
  GPUTableEvaluator,
  add,
  cleanEvaluate,
  equalAll,
  gather,
  log,
  multiply,
  segmentedMap,
  select,
  subtract,
  swizzle,
  backendRegistry,
  type BackendModule,
  type GPUTableEvaluatorInput
} from '@luma.gl/gpgpu';
import {generateGraticules} from './graticules';
import {generatePlaces} from './places';

import * as cpuBackend from '@luma.gl/gpgpu/cpu';
import * as webglBackend from '@luma.gl/gpgpu/webgl';
import * as webgpuBackend from '@luma.gl/gpgpu/webgpu';
import {
  ALBERS_USGS_5070,
  albers,
  equirectangular,
  naturalEarth,
  projectionCPUBackend,
  projectionWebGLBackend,
  projectionWebGPUBackend,
  splitUint32,
  stereographic,
  webMercator
} from './projections';

backendRegistry.add('cpu', {
  ...cpuBackend,
  ...projectionCPUBackend
} satisfies BackendModule);

backendRegistry.add('webgl', {
  ...webglBackend,
  ...projectionWebGLBackend
} satisfies BackendModule);

backendRegistry.add('webgpu', {
  ...webgpuBackend,
  ...projectionWebGPUBackend
} satisfies BackendModule);

type RawProjection = (coordinates: readonly [number, number]) => [number, number];

type ProjectionMode = {
  projectOp: (input: GPUTableEvaluatorInput) => GPUTableEvaluator;
  projectRaw: RawProjection;
};

const projectionModes = {
  equirectangular: {projectOp: equirectangular, projectRaw: equirectangular.raw},
  webMercator: {projectOp: webMercator, projectRaw: webMercator.raw},
  naturalEarth: {projectOp: naturalEarth, projectRaw: naturalEarth.raw},
  stereographic: {
    projectOp: (input: GPUTableEvaluatorInput) => stereographic(input, {longitudeOrigin: 0, latitudeOrigin: 90}), 
    projectRaw: (coordinates: readonly [number, number]) => stereographic.raw(coordinates, {longitudeOrigin: 0, latitudeOrigin: 90})
  },
  albers5070: {
    projectOp: (input: GPUTableEvaluatorInput) => albers(input, ALBERS_USGS_5070),
    projectRaw: (coordinates: readonly [number, number]) => albers.raw(coordinates, ALBERS_USGS_5070)
  }
} satisfies Record<string, ProjectionMode>;

type ProjectionModeName = keyof typeof projectionModes;

const DEFAULT_PROJECTION_MODE: ProjectionModeName = 'equirectangular';

main();

async function main() {
  const graticules = generateGraticules(15, 5);
  const places = generatePlaces();

  const deckgl = new Deck({
    views: new OrthographicView({ flipY: false, controller: true }),
    initialViewState: {
      target: [2**31, 2**31],
      zoom: -22
    },
    onDeviceInitialized: onLoad,
    layers: [],
    getTooltip: (info) => {
      return info.object ? `${info.object.name}, ${info.object.country}\nPopulation: ${formatNumber(info.object.population)}` : null;
    }
  });

  async function onLoad(
    device: Device,
  ) {
    const placeCoordinates = makeGPUVectorFromArrow(
        device,
        places.getChild('coordinates')!,
        { format: 'uint32x4' }
      );
    const placePopulation = makeGPUVectorFromArrow(
        device,
        places.getChild('population')!,
      );

    const graticulePaths = GPUTableEvaluator.fromGPUVector(
      makeGPUVectorFromArrow(
        device,
        graticules.getChild('paths')!,
        { format: 'vertex-list<uint32x4>', byteOffset: 16 }
      )
    );

    // Funky PathLayer hack - vertexPositions has 1-vertex offset
    graticulePaths.length++;
    const graticulePathStartIndices = graticulePaths.startIndices!;

    const selector = document.getElementById('projection') as HTMLSelectElement;
    const initialProjectionMode = getProjectionModeFromURL();
    for (const key in projectionModes) {
      const option = document.createElement('option');
      option.value = key;
      option.innerText = key;
      option.selected = key === initialProjectionMode;
      selector.append(option);
    }
    selector.onchange = () => {
      const mode = getProjectionMode(selector.value);
      updateProjectionModeURL(mode);
      update(mode);
    };

    replaceProjectionModeURL(initialProjectionMode);
    update(initialProjectionMode);

    window.addEventListener('popstate', () => {
      const mode = getProjectionModeFromURL();
      selector.value = mode;
      update(mode);
    });

    function update(mode: ProjectionModeName) {
      const {projectOp, projectRaw} = projectionModes[mode];
      const projectedPlaceCoordinates = projectOp(placeCoordinates);
      const getPosition = splitUint32(projectedPlaceCoordinates);
      const scatterplotData = cleanEvaluate(device, {
        length: placeCoordinates.length,
        attributes: {
          getPosition,
          getRadius: multiply(log(placePopulation), .5)
        }
      });
      const pathLayerData = cleanEvaluate(device, {
        length: graticulePathStartIndices.length - 1,
        startIndices: graticulePathStartIndices.value,
        source: {graticulePaths},
        attributes: {
          getPath: splitUint32(projectOp(graticulePaths)),
        }
      });

      deckgl.setProps({
        layers: [
          new PathLayer({
            data: pathLayerData,
            dataTransform: data => {
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              data.attributes.getPath._value = new Float64Array();
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              data.attributes.getPath.size = 2;
              return data;
            },
            _pathType: 'open',
            getColor: [0, 0, 0],
            getWidth: 1,
            widthUnits: 'pixels',
          }),
          new ScatterplotLayer({
            data: scatterplotData,
            dataTransform: data => {
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              getPosition._value = new Float64Array();
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              getPosition.size = 2;
              return data;
            },
            stroked: true,
            filled: true,
            getLineWidth: 1,
            radiusUnits: 'pixels',
            lineWidthUnits: 'pixels',
            getLineColor: [255, 0, 0],
            getFillColor: [0, 0, 0, 0],
            onHover: info => {
              const {index} = info;
              if (index >= 0) {
                info.object = places.get(index)?.toJSON();
              }
            },
            onClick: info => {
              // @ts-ignore undo hack
              getPosition._value = null;
              // @ts-ignore undo hack
              getPosition.size = 4;
              void compareProjectionToRaw(info.index, getPosition, projectRaw, mode);
            },
            pickable: true,
            autoHighlight: true
          }),
        ]
      });
    }

    async function compareProjectionToRaw(
      index: number,
      getPositionReadback: GPUTableEvaluator,
      projectRaw: RawProjection,
      mode: string
    ): Promise<void> {
      if (index < 0) {
        return;
      }

      await getPositionReadback.evaluate(device);
      const gpuResult = await getPositionReadback.readValue(index, index + 1);

      const coordinates = Array.from(places.get(index)?.toJSON().coordinates as Iterable<number>) as [number, number];
      if (!coordinates) {
        return;
      }

      const rawPosition = projectRaw(coordinates);
      const gpuPosition = getProjectedPosition(gpuResult);
      console.log('projection comparison:', [
          gpuPosition[0] - rawPosition[0],
          gpuPosition[1] - rawPosition[1]
        ], {
        projection: mode,
        coordinates,
        gpu: gpuPosition,
        raw: rawPosition,
      });
    }
  }

}

function getProjectionModeFromURL(): ProjectionModeName {
  return getProjectionMode(new URLSearchParams(window.location.search).get('projection'));
}

function getProjectionMode(value: string | null): ProjectionModeName {
  return value && value in projectionModes ? (value as ProjectionModeName) : DEFAULT_PROJECTION_MODE;
}

function updateProjectionModeURL(mode: ProjectionModeName): void {
  window.history.pushState(null, '', getProjectionModeURL(mode));
}

function replaceProjectionModeURL(mode: ProjectionModeName): void {
  window.history.replaceState(null, '', getProjectionModeURL(mode));
}

function getProjectionModeURL(mode: ProjectionModeName): URL {
  const url = new URL(window.location.href);
  url.searchParams.set('projection', mode);
  return url;
}

function getProjectedPosition(value: ArrayLike<number>): [number, number] {
  return [Number(value[0]) + Number(value[2]), Number(value[1]) + Number(value[3])];
}

/** This helper creates the segmentTypes buffer on the GPU.
 * Providing it externally does not gain us anything as of deck.gl v9.3, as the CPU-based packing cannot be disabled in PathTesselator.
 * This is more of a proof-of-concept that will eventually be upstreamed into the PathLayer. */
function makePathLayerData(
  getPath: GPUTableEvaluator
) {
  // @ts-ignore Funky PathLayer hack - vertexPositions has 1-vertex offset
  getPath.length++;
  const startIndices = getPath.startIndices!;
  const segmentIndexByVertex = segmentedMap(startIndices, getPath.length);
  const segmentLengths = subtract(new GPUTableEvaluator({
    source: startIndices,
    size: 1,
    type: startIndices.type,
    offset: 4,
  }), startIndices);
  const segmentLengthsByVertex = gather(swizzle(segmentIndexByVertex, [0]), segmentLengths);
  const startCapFlag = select(
    swizzle(segmentIndexByVertex, [1]),
    GPUTableEvaluator.fromConstant(0, 'uint32'),
    GPUTableEvaluator.fromConstant(1, 'uint32')
  );
  const endCapFlag = select(
    equalAll(
      swizzle(segmentIndexByVertex, [1]),
      subtract(segmentLengthsByVertex, 2),
    ),
    GPUTableEvaluator.fromConstant(2, 'uint32'),
    GPUTableEvaluator.fromConstant(0, 'uint32')
  );
  const invalidFlag = select(
    equalAll(
      swizzle(segmentIndexByVertex, [1]),
      subtract(segmentLengthsByVertex, 1),
    ),
    GPUTableEvaluator.fromConstant(4, 'uint32'),
    GPUTableEvaluator.fromConstant(0, 'uint32')
  );

  return {
    length: startIndices.length - 1,
    startIndices: startIndices.value,
    attributes: {
      getPath: splitUint32(webMercator(getPath)),
      instanceTypes: add(startCapFlag, endCapFlag, invalidFlag)
    }
  };
}

/** Local shader injection to drop invalid coordinates */
class PathLayer extends _PathLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#main-start': `
if (instanceStartPositions.x > 4294967296. && instanceStartPositions.y > 4294967296.) {
  gl_Position = vec4(0.);
  return;
}
if (instanceEndPositions.x > 4294967296. && instanceEndPositions.y > 4294967296.) {
  gl_Position = vec4(0.);
  return;
}
      `
    }
    return shaders;
  }
}

class ScatterplotLayer extends _ScatterplotLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#main-start': `
if (instancePositions.x > 4294967296. && instancePositions.y > 4294967296.) {
  gl_Position = vec4(0.);
  return;
}
      `
    };
    return shaders;
  }
}

function formatNumber(x: unknown): string {
  if (typeof x === 'number') {
    return Intl.NumberFormat('en-us').format(x);
  }
  return 'n/a';
}
