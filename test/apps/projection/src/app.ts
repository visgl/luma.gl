import {Deck, OrbitView} from '@deck.gl/core';
import {PathLayer as _PathLayer, ScatterplotLayer, ColumnLayer as _ColumnLayer} from '@deck.gl/layers';
import {makeGPUVectorFromArrow} from '@luma.gl/arrow';
import {type Device} from '@luma.gl/core';
import { Model } from '@luma.gl/engine';
import {
  GPUTableEvaluator,
  add,
  cleanEvaluate,
  equalAll,
  gather,
  sqrt,
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
  LAMBERT_CONUS,
  albers,
  equalEarth,
  equirectangular,
  lambert,
  naturalEarth,
  projectionCPUBackend,
  projectionWebGLBackend,
  projectionWebGPUBackend,
  INVALID_QUANTIZED_COORDINATE,
  QUANTIZED_SEA_LEVEL,
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

type RawProjection = (coordinates: readonly [number, number]) => readonly number[];

type ProjectionMode = {
  projectOp: (input: GPUTableEvaluatorInput) => GPUTableEvaluator;
  projectRaw: RawProjection;
};

const projectionModes = {
  equirectangular: {projectOp: equirectangular, projectRaw: equirectangular.raw},
  webMercator: {projectOp: webMercator, projectRaw: webMercator.raw},
  naturalEarth: {projectOp: naturalEarth, projectRaw: naturalEarth.raw},
  equalEarth: {projectOp: equalEarth, projectRaw: equalEarth.raw},
  stereographic: {
    projectOp: (input: GPUTableEvaluatorInput) => stereographic(input, {longitudeOrigin: 0, latitudeOrigin: 90}), 
    projectRaw: (coordinates: readonly [number, number]) => stereographic.raw(coordinates, {longitudeOrigin: 0, latitudeOrigin: 90})
  },
  albers5070: {
    projectOp: (input: GPUTableEvaluatorInput) => albers(input, ALBERS_USGS_5070),
    projectRaw: (coordinates: readonly [number, number]) => albers.raw(coordinates, ALBERS_USGS_5070)
  },
  lambert: {
    projectOp: (input: GPUTableEvaluatorInput) =>
      lambert(input, LAMBERT_CONUS),
    projectRaw: (coordinates: readonly [number, number]) =>
      lambert.raw(coordinates, LAMBERT_CONUS)
  }
} satisfies Record<string, ProjectionMode>;

type ProjectionModeName = keyof typeof projectionModes;

const DEFAULT_PROJECTION_MODE: ProjectionModeName = 'equirectangular';

main();

async function main() {
  const graticules = generateGraticules(15, 5);
  const places = generatePlaces();

  const deckgl = new Deck({
    views: new OrbitView({ orbitAxis: 'Z', controller: true }),
    initialViewState: {
      target: [256, 256, 0],
      zoom: 0,
      rotationX: 90,
      rotationOrbit: 0
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
      // const projectedPlaceCoordinates = projectOp(placeCoordinates);
      const projectedPlaceCoordinates = projectOp({
        coordinates: placeCoordinates,
        altitude: multiply(placePopulation, GPUTableEvaluator.fromConstant(1, 'float32')),
      });
      const getPosition = splitUint32(projectedPlaceCoordinates);
      const scatterplotData = cleanEvaluate(device, {
        length: placeCoordinates.length,
        source: {projectedPlaceCoordinates},
        attributes: {
          getPosition: swizzle(getPosition, [0, 1, 5, 3, 4, 5]),
          getElevation: add(swizzle(getPosition, [2]), swizzle(getPosition, [5])),
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
          new ColumnLayer({
            data: scatterplotData,
            dataTransform: data => {
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              data.attributes.getPosition._value = new Float64Array();
              // @ts-ignore hack: tell deck.gl attribute that this is a fp64 value
              data.attributes.getPosition.size = 3;
              return data;
            },
            wireframe: false,
            filled: true,
            extruded: true,
            radius: 1,
            getFillColor: [255, 0, 0],
            onHover: info => {
              const {index} = info;
              if (index >= 0) {
                info.object = places.get(index)?.toJSON();
              }
            },
            onClick: info => {
              void compareProjectionToRaw(info.index, projectedPlaceCoordinates, projectRaw, mode);
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

      const item = places.get(index)?.toJSON();
      if (!item) {
        return;
      }
      console.log(item)
      const coordinates = [
        ...Array.from(item.coordinates),
        item.population,
      ];

      const gpuPosition = Array.from(gpuResult);
      const rawPosition = projectRaw(coordinates);
      console.log('projection comparison:', gpuPosition.map((value, valueIndex) => value - rawPosition[valueIndex]), {
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

function reconstructQuantizedPosition(value: ArrayLike<number>): number[] {
  const componentCount = value.length / 2;
  if (isInvalidSplitPosition(value, componentCount)) {
    return new Array(componentCount).fill(INVALID_QUANTIZED_COORDINATE);
  }

  return Array.from({length: componentCount}, (_, componentIndex) => {
    const splitValue =
      (Number(value[componentIndex]) + Number(value[componentIndex + componentCount])) *
      Math.pow(2, 23);
    return Math.round(
      componentIndex === 2 ? splitValue + QUANTIZED_SEA_LEVEL : splitValue
    );
  });
}

function isInvalidSplitPosition(value: ArrayLike<number>, componentCount: number): boolean {
  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    if (
      Number(value[componentIndex]) !== 513 ||
      Number(value[componentIndex + componentCount]) !== -1
    ) {
      return false;
    }
  }
  return true;
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
if (instanceStartPositions.x > 512. && instanceStartPositions.y > 512.) {
  gl_Position = vec4(0.);
  return;
}
if (instanceEndPositions.x > 512. && instanceEndPositions.y > 512.) {
  gl_Position = vec4(0.);
  return;
}
      `
    }
    return shaders;
  }
}

class ColumnLayer extends _ColumnLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#main-start': `
if (instancePositions.x > 512. && instancePositions.y > 512.) {
  gl_Position = vec4(0.);
  return;
}
      `
    };
    return shaders;
  }

  _getModels() {
      const shaders = this.getShaders();
      const bufferLayout = this.getAttributeManager()!.getBufferLayouts();
      const { diskResolution, vertices, extruded, stroked } = this.props;
      const geometry = this.getGeometry(diskResolution, vertices, extruded || stroked);
      const fillModel = new Model(this.context.device, {
          ...shaders,
          id: `${this.props.id}-fill`,
          geometry,
          bufferLayout,
          isInstanced: true
      });
      fillModel.setTopology('triangle-strip');
      fillModel.setIndexBuffer(null);
      const wireframeModel = new Model(this.context.device, {
          ...shaders,
          id: `${this.props.id}-wireframe`,
          topology: 'line-list',
          bufferLayout,
          isInstanced: true
      });
      return {
        fillVertexCount: geometry.attributes.positions.value.length / 3,
          fillModel,
          wireframeModel,
          models: [wireframeModel, fillModel]
      };
  }

  _updateGeometry() {
  }
}

function formatNumber(x: unknown): string {
  if (typeof x === 'number') {
    return Intl.NumberFormat('en-us').format(x);
  }
  return 'n/a';
}
