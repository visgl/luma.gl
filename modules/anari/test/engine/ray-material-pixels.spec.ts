// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, Texture} from '@luma.gl/core';
import {Geometry} from '@luma.gl/engine';
import {RayTracingSceneRenderer, type RayTracingSceneRenderOptions} from '@luma.gl/anari';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';

it('ray maps preserve UV selection and replacement, and dielectrics cross both sphere interfaces', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const device = await webgpuAdapter.create({
    featureLevel: 'core',
    createCanvasContext: {canvas: new OffscreenCanvas(8, 8)}
  });
  const renderer = new RayTracingSceneRenderer(device);
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {
      POSITION: {size: 3, value: new Float32Array([-4, -4, 0, 4, -4, 0, 0, 4, 0])},
      NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
      TEXCOORD_0: {size: 2, value: new Float32Array([0.25, 0.5, 0.25, 0.5, 0.25, 0.5])},
      TEXCOORD_1: {size: 2, value: new Float32Array([0.75, 0.5, 0.75, 0.5, 0.75, 0.5])}
    }
  });
  const map = device.createTexture({
    id: 'same-label',
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
    sampler: {minFilter: 'nearest', magFilter: 'nearest'}
  });
  const replacement = device.createTexture({
    id: map.id,
    width: 2,
    height: 1,
    format: 'rgba8unorm',
    data: new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]),
    sampler: map.sampler
  });
  const mipMap = device.createTexture({
    width: 32,
    height: 32,
    mipLevels: 6,
    format: 'rgba8unorm',
    sampler: {minFilter: 'nearest', magFilter: 'nearest', mipmapFilter: 'nearest'}
  });
  for (let level = 0; level < 6; level++) {
    const size = 32 >> level;
    const texels = new Uint8Array(size * size * 4);
    for (let offset = 0; offset < texels.length; offset += 4) {
      texels.set(
        level === 0 ? [255, 0, 0, 255] : level === 5 ? [0, 0, 255, 255] : [0, 255, 0, 255],
        offset
      );
    }
    mipMap.writeData(texels, {mipLevel: level, width: size, height: size});
  }
  const color = device.createTexture({
    width: 8,
    height: 8,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 8,
    height: 8,
    colorAttachments: [color],
    depthStencilAttachment: 'depth24plus'
  });
  const surface = {
    id: 'triangle',
    geometry,
    material: {
      id: 'material',
      uniforms: {
        baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
        baseColorUVSet: 0,
        baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
      },
      bindings: {pbr_baseColorSampler: map}
    },
    transforms: [new Matrix4()]
  };
  const options: RayTracingSceneRenderOptions = {
    id: 'pixels',
    surfaces: [surface],
    camera: {
      position: [0, 0, 4],
      viewMatrix: new Matrix4().lookAt({eye: [0, 0, 4], center: [0, 0, 0], up: [0, 1, 0]}),
      projectionMatrix: new Matrix4().perspective({
        fovy: Math.PI / 3,
        aspect: 1,
        near: 0.1,
        far: 20
      })
    },
    width: 8,
    height: 8,
    framebuffer,
    exposure: 1,
    toneMapMode: 0,
    outputColorSpace: 'linear',
    lights: [{type: 'ambient', color: [1, 1, 1], intensity: 1}],
    progressive: true,
    temporalReprojection: false,
    adaptiveResolution: false,
    resolutionScale: 1
  };
  async function readPixel(): Promise<number[]> {
    renderer.render(options);
    device.submit();
    const layout = color.computeMemoryLayout({width: 1, height: 1});
    const buffer = device.createBuffer({
      byteLength: layout.byteLength,
      usage: Buffer.COPY_DST | Buffer.MAP_READ
    });
    try {
      color.readBuffer({x: 4, y: 4, width: 1, height: 1}, buffer);
      const bytes = await buffer.readAsync();
      return Array.from(new Uint8Array(bytes.buffer, bytes.byteOffset, 3));
    } finally {
      buffer.destroy();
    }
  }
  try {
    expect(await readPixel()).toEqual([255, 0, 0]);
    surface.material.uniforms.baseColorUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.uniforms.baseColorUVSet = 0;
    surface.material.uniforms.baseColorUVTransform = [1, 0, 0, 0, 1, 0, 0.5, 0, 1];
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.bindings.pbr_baseColorSampler = replacement;
    expect(await readPixel()).toEqual([0, 255, 0]);
    const specularSurface = {
      ...surface,
      material: {
        id: 'specular-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          metallicRoughnessValues: [0, 0.5] as [number, number],
          specularColorFactor: [1, 0, 0] as [number, number, number],
          specularIntensityFactor: 1,
          specularColorUVSet: 0,
          specularIntensityUVSet: 0
        },
        bindings: {} as Record<string, Texture>
      }
    };
    options.surfaces = [specularSurface];
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 4}];
    options.samplingFrameIndex = 0;
    const redReflection = await readPixel();
    expect(redReflection[0]).toBeGreaterThan(20);
    expect(redReflection.slice(1)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularIntensityFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    specularSurface.material.uniforms.specularIntensityFactor = 1;
    specularSurface.material.uniforms.specularColorFactor = [1, 1, 1];
    specularSurface.material.bindings.pbr_specularColorSampler = map;
    expect(await readPixel()).toEqual(redReflection);
    specularSurface.material.uniforms.specularColorUVSet = 1;
    const blueReflection = await readPixel();
    expect(blueReflection[2]).toBeGreaterThan(20);
    expect(blueReflection.slice(0, 2)).toEqual([0, 0]);
    replacement.writeData(new Uint8Array([255, 255, 255, 0, 0, 0, 0, 255]));
    specularSurface.material.bindings.pbr_specularIntensitySampler = replacement;
    expect(await readPixel()).toEqual([0, 0, 0]);
    specularSurface.material.uniforms.specularIntensityUVSet = 1;
    expect(await readPixel()).toEqual(blueReflection);
    const reflectionEmitter = {
      ...surface,
      id: 'specular-emitter',
      transforms: [new Matrix4().translate([0, 0, 5])],
      material: {
        id: 'specular-emitter-material',
        uniforms: {emissiveFactor: [12, 12, 12]}
      }
    } satisfies RayTracingSceneRenderOptions['surfaces'][number];
    options.surfaces = [specularSurface, reflectionEmitter];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const reflectedBlue = await readPixel();
    expect(reflectedBlue[2]).toBeGreaterThan(8);
    expect(reflectedBlue.slice(0, 2)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularColorUVSet = 0;
    const reflectedRed = await readPixel();
    expect(reflectedRed[0]).toBe(reflectedBlue[2]);
    expect(reflectedRed.slice(1)).toEqual([0, 0]);
    specularSurface.material.uniforms.specularIntensityUVSet = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    const coatedSurface = {
      ...specularSurface,
      material: {
        id: 'clearcoat-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          specularIntensityFactor: 0,
          metallicRoughnessValues: [0, 0.5] as [number, number],
          clearcoatFactor: 1,
          clearcoatRoughnessFactor: 1,
          clearcoatUVSet: 0,
          clearcoatRoughnessUVSet: 0
        },
        bindings: {
          pbr_clearcoatSampler: map,
          pbr_clearcoatRoughnessSampler: replacement
        }
      }
    };
    // Red enables the coat. Green sets its roughness independently of the other channels.
    replacement.writeData(new Uint8Array([255, 128, 255, 0, 255, 255, 255, 0]));
    options.surfaces = [coatedSurface, reflectionEmitter];
    const coatedBounce = await readPixel();
    expect(coatedBounce[0]).toBeGreaterThan(8);
    expect(coatedBounce[1]).toBe(coatedBounce[0]);
    coatedSurface.material.uniforms.clearcoatUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 0]);
    coatedSurface.material.uniforms.clearcoatUVSet = 0;
    options.maxBounces = 0;
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 4}];
    options.surfaces = [coatedSurface];
    const glossyCoat = await readPixel();
    expect(glossyCoat[0]).toBeGreaterThan(20);
    coatedSurface.material.uniforms.clearcoatRoughnessUVSet = 1;
    expect((await readPixel())[0]).toBeLessThan(glossyCoat[0] / 2);
    coatedSurface.material.uniforms.clearcoatFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transportMode = 'diffuse';
    options.maxBounces = 0;
    options.samplesPerPixel = 1;
    options.samplingSeed = undefined;
    replacement.writeData(new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]));
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 1}];
    options.samplingFrameIndex = undefined;
    options.surfaces = [surface];
    const mappedSurface = {
      ...surface,
      id: 'normal-mapped',
      geometry: new Geometry({
        id: 'normal-mapped-geometry',
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])},
          TEXCOORD_1: {size: 2, value: new Float32Array([1, 0, 0, 0, 0.5, 1])}
        }
      }),
      material: {
        id: 'normal-mapped-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          normalScale: 0,
          normalUVSet: 0,
          normalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_normalSampler: replacement}
      }
    };
    replacement.writeData(new Uint8Array([255, 128, 200, 255, 255, 128, 200, 255]));
    const minifiedSurface = {
      ...mappedSurface,
      material: {
        ...mappedSurface.material,
        uniforms: {
          ...mappedSurface.material.uniforms,
          baseColorUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_baseColorSampler: mipMap}
      }
    };
    options.surfaces = [minifiedSurface];
    expect(await readPixel()).toEqual([0, 255, 0]);
    minifiedSurface.material.uniforms.baseColorUVTransform = [64, 0, 0, 0, 64, 0, 0, 0, 1];
    expect(await readPixel()).toEqual([0, 0, 255]);
    minifiedSurface.geometry = geometry;
    expect(await readPixel()).toEqual([255, 0, 0]);
    const mappedCoat = {
      ...coatedSurface,
      id: 'mapped-coat',
      geometry: mappedSurface.geometry,
      material: {
        id: 'mapped-coat-material',
        uniforms: {
          ...coatedSurface.material.uniforms,
          clearcoatFactor: 1,
          clearcoatRoughnessFactor: 0.5,
          clearcoatNormalUVSet: 0,
          clearcoatNormalUVTransform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
        },
        bindings: {pbr_clearcoatNormalSampler: replacement}
      }
    };
    options.surfaces = [mappedCoat];
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -0.4], color: [1, 1, 1], intensity: 4}
    ];
    const tiltedCoat = (await readPixel())[0];
    mappedCoat.material.uniforms.clearcoatNormalUVSet = 1;
    const mirroredCoat = (await readPixel())[0];
    expect(tiltedCoat).toBeGreaterThan(mirroredCoat + 3);
    mappedCoat.material.uniforms.clearcoatNormalUVTransform = [-1, 0, 0, 0, 1, 0, 1, 0, 1];
    expect((await readPixel())[0]).toBe(tiltedCoat);
    options.surfaces = [{...mappedCoat, material: {...mappedCoat.material, bindings: {}}}];
    expect((await readPixel())[0]).toBeLessThan(tiltedCoat);
    options.samplingFrameIndex = undefined;
    options.surfaces = [mappedSurface];
    options.lights = [
      {type: 'directional', direction: [-1, 0, -0.4], color: [1, 1, 1], intensity: 1}
    ];
    const unmapped = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 1;
    expect((await readPixel())[0]).toBeGreaterThan(unmapped + 20);
    const pick = await renderer.pick(options.id, 4, 4);
    expect(pick?.normal).toEqual([0, 0, 1]);
    mappedSurface.material.uniforms.normalUVSet = 1;
    expect((await readPixel())[0]).toBeLessThan(unmapped);
    mappedSurface.material.uniforms.normalUVTransform = [-1, 0, 0, 0, 1, 0, 1, 0, 1];
    expect((await readPixel())[0]).toBeGreaterThan(unmapped + 20);
    const smoothSurface = {
      ...mappedSurface,
      id: 'smooth-normal-mapped',
      geometry: new Geometry({
        id: 'smooth-normal-mapped-geometry',
        topology: 'triangle-list',
        attributes: {
          ...mappedSurface.geometry.attributes,
          NORMAL: {size: 3, value: new Float32Array([-0.8, 0, 0.6, -0.8, 0, 0.6, -0.8, 0, 0.6])}
        }
      })
    };
    options.surfaces = [smoothSurface];
    expect((await readPixel())[0]).toBeGreaterThan(20);
    const sideEmitter = {
      ...surface,
      id: 'side-emitter',
      transforms: [
        new Matrix4()
          .translate([2, 0, 2])
          .rotateY(-Math.PI / 2)
          .scale([0.4, 0.6, 0.6])
      ],
      material: {
        id: 'side-emitter-material',
        uniforms: {baseColorFactor: [0, 0, 0, 1], emissiveFactor: [2, 0, 0]}
      }
    } satisfies RayTracingSceneRenderOptions['surfaces'][number];
    const coatOnlyReceiver = {
      ...mappedCoat,
      material: {
        ...mappedCoat.material,
        uniforms: {...mappedCoat.material.uniforms, normalUVSet: 1},
        bindings: {pbr_clearcoatNormalSampler: replacement, pbr_normalSampler: replacement}
      }
    };
    options.surfaces = [
      coatOnlyReceiver,
      {
        ...sideEmitter,
        material: {
          ...sideEmitter.material,
          uniforms: {...sideEmitter.material.uniforms, emissiveFactor: [20, 0, 0]}
        }
      }
    ];
    options.lights = [];
    options.transportMode = 'pbr';
    options.emitterSampling = true;
    options.samplesPerPixel = 16;
    options.samplingFrameIndex = 0;
    const coatEmitter = (await readPixel())[0];
    expect(coatEmitter).toBeGreaterThan(3);
    coatOnlyReceiver.material.uniforms.clearcoatFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transportMode = 'diffuse';
    options.samplingFrameIndex = undefined;
    options.surfaces = [mappedSurface, sideEmitter];
    options.lights = [];
    options.emitterSampling = true;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const mappedEmitter = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 0;
    expect(mappedEmitter).toBeGreaterThan((await readPixel())[0] + 5);

    options.emitterSampling = false;
    options.maxBounces = 1;
    const unmappedBounce = (await readPixel())[0];
    mappedSurface.material.uniforms.normalScale = 1;
    expect((await readPixel())[0]).toBeGreaterThan(unmappedBounce + 5);

    const mappedGlass = {
      ...mappedSurface,
      material: {
        ...mappedSurface.material,
        uniforms: {...mappedSurface.material.uniforms, transmissionFactor: 1, ior: 1.5}
      }
    };
    options.surfaces = [mappedGlass];
    options.transportMode = 'pbr';
    options.background = [0.8, 0.2, 0.05, 1];
    const mappedRefraction = await readPixel();
    expect(mappedRefraction[0]).toBeGreaterThan(50);
    mappedGlass.material.uniforms.normalScale = 0;
    expect(await readPixel()).toEqual(mappedRefraction);
    options.background = [0, 0, 0, 1];
    options.maxBounces = 0;
    options.samplesPerPixel = 1;
    replacement.writeData(new Uint8Array([0, 255, 0, 255, 0, 255, 0, 255]));
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 1}];
    const glass = {
      id: 'glass',
      geometry,
      material: {
        id: 'glass-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          transmissionFactor: 1,
          ior: 1.5
        }
      },
      transforms: [new Matrix4()]
    };
    const emitter = {
      id: 'emitter',
      geometry,
      material: {
        id: 'emitter-material',
        uniforms: {
          baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
          emissiveFactor: [0.8, 0, 0] as [number, number, number]
        }
      },
      transforms: [new Matrix4().translate([0, 0, -2])]
    };
    options.surfaces = [glass, emitter];
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    options.transportMode = 'pbr';
    options.maxBounces = 0;
    expect(await readPixel()).toEqual([255, 255, 255]);
    options.lights = [];
    options.maxBounces = 2;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const transmitted = await readPixel();
    expect(transmitted[0]).toBeGreaterThan(100);
    expect(transmitted[1]).toBeLessThan(4);
    expect(transmitted[2]).toBeLessThan(4);
    options.surfaces = [glass];
    options.background = [0.8, 0.2, 0.05, 1];
    options.samplingFrameIndex = 0;
    const backdrop = await readPixel();
    expect(backdrop[0]).toBeGreaterThan(100);
    expect(backdrop[1]).toBeGreaterThan(20);
    const absorbingGlass = {
      ...glass,
      material: {
        ...glass.material,
        uniforms: {
          ...glass.material.uniforms,
          attenuationColor: [1, 0.25, 0] as [number, number, number],
          attenuationDistance: 2
        }
      }
    };
    options.surfaces = [absorbingGlass];
    const tintedBackdrop = await readPixel();
    expect(tintedBackdrop[0]).toBe(backdrop[0]);
    expect(tintedBackdrop[1]).toBeLessThan(backdrop[1] / 2);
    expect(tintedBackdrop[2]).toBeLessThan(backdrop[2]);
    absorbingGlass.material.uniforms.attenuationDistance = 1;
    const denserBackdrop = await readPixel();
    expect(denserBackdrop[1]).toBeLessThan(tintedBackdrop[1]);
    absorbingGlass.material.uniforms.attenuationDistance = Number.POSITIVE_INFINITY;
    expect(await readPixel()).toEqual(backdrop);
    // This seed transmits at entry, reflects once inside the sphere, then exits.
    options.samplingSeed = 81;
    options.samplesPerPixel = 1;
    options.maxBounces = 2;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.maxBounces = 3;
    const clearReflectedPath = await readPixel();
    expect(clearReflectedPath[1]).toBeGreaterThan(40);
    absorbingGlass.material.uniforms.attenuationDistance = 2;
    const absorbedReflectedPath = await readPixel();
    expect(absorbedReflectedPath[0]).toBe(clearReflectedPath[0]);
    expect(absorbedReflectedPath[1]).toBeGreaterThan(0);
    expect(absorbedReflectedPath[1]).toBeLessThan(tintedBackdrop[1] / 2);

    // Model a shell split across two mesh primitives with opposite winding.
    const exitSurface = {
      ...absorbingGlass,
      id: 'glass-exit',
      transforms: [new Matrix4().translate([0, 0, -2]).rotateY(Math.PI)]
    };
    options.primitives = {};
    options.surfaces = [absorbingGlass, exitSurface];
    options.samplingSeed = 17;
    options.samplesPerPixel = 16;
    options.maxBounces = 2;
    const splitBackdrop = await readPixel();
    expect(splitBackdrop[0]).toBeGreaterThan(100);
    expect(splitBackdrop[1]).toBeLessThan(backdrop[1] / 2);
    options.primitives = {glass: {type: 'sphere', radius: 1}};
    options.samplingFrameIndex = undefined;
    options.background = [0, 0, 0, 1];
    options.surfaces = [glass, emitter];
    options.surfaces[0].material.bindings = {pbr_transmissionSampler: replacement};
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.surfaces = [emitter];
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [0, 0, 0, 1],
      emissiveFactor: [1, 1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_emissiveSampler: replacement};
    expect(await readPixel()).toEqual([0, 255, 0]);
    options.surfaces = [surface];
    options.primitives = {};
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 1}];
    options.maxBounces = 0;
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    const scalarMaterial = await readPixel();
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [1, 1]
    };
    options.surfaces[0].material.bindings = {pbr_metallicRoughnessSampler: replacement};
    expect(await readPixel()).toEqual(scalarMaterial);
    // A diffuse receiver inside glass must not turn a camera backdrop into a light.
    options.surfaces = [surface, glass];
    options.surfaces[0].material.bindings = {};
    options.surfaces[0].material.uniforms = {
      baseColorFactor: [1, 1, 1, 1],
      metallicRoughnessValues: [0, 1]
    };
    options.surfaces[1].material.bindings = {};
    options.primitives = {glass: {type: 'sphere', radius: 6}};
    options.lights = [];
    options.background = [0.8, 0.2, 0.05, 1];
    options.maxBounces = 3;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    renderer.destroy();
    framebuffer.destroy();
    color.destroy();
    map.destroy();
    mipMap.destroy();
    replacement.destroy();
    device.destroy();
  }
  // Software WebGPU CI compiles several complete traversal/material pipelines here.
}, 540_000);
