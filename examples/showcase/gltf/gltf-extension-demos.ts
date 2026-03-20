// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFModelReference} from './gltf-catalog-app';

export type GLTFExtensionDemoModel = GLTFModelReference & {
  label: string;
};

export type GLTFExtensionDemo = {
  extensionName: string;
  models: GLTFExtensionDemoModel[];
};

export const GLTF_EXTENSION_DEMOS: GLTFExtensionDemo[] = [
  {
    extensionName: 'KHR_draco_mesh_compression',
    models: [
      {
        name: 'ABeautifulGame',
        label: 'A Beautiful Game (Draco + KTX2)',
        variant: 'glTF-Binary-KTX-ETC1S-Draco',
        fileName: 'ABeautifulGame.glb'
      },
      {
        name: 'CesiumMan',
        label: 'CesiumMan (Draco)',
        variant: 'glTF-Draco',
        fileName: 'CesiumMan.gltf'
      },
      {
        name: 'SunglassesKhronos',
        label: 'Sunglasses Khronos (Draco)',
        variant: 'glTF-Draco',
        fileName: 'SunglassesKhronos.gltf'
      }
    ]
  },
  {
    extensionName: 'EXT_meshopt_compression',
    models: [
      {
        name: 'DragonAttenuation',
        label: 'Dragon Attenuation (Meshopt)',
        variant: 'glTF-Meshopt-EXT',
        fileName: 'DragonAttenuation.gltf'
      },
      {
        name: 'MeshoptCubeTest',
        label: 'Meshopt Cube Test',
        variant: 'glTF-Meshopt',
        fileName: 'MeshoptCubeTest.gltf'
      }
    ]
  },
  {
    extensionName: 'KHR_mesh_quantization',
    models: [
      {
        name: 'Avocado',
        label: 'Avocado (Quantized)',
        variant: 'glTF-Quantized',
        fileName: 'Avocado.gltf'
      },
      {
        name: 'Duck',
        label: 'Duck (Quantized)',
        variant: 'glTF-Quantized',
        fileName: 'Duck.gltf'
      }
    ]
  },
  {
    extensionName: 'KHR_lights_punctual',
    models: [
      {name: 'LightsPunctualLamp', label: 'Lights Punctual Lamp'},
      {name: 'PlaysetLightTest', label: 'Playset Light Test'},
      {name: 'DirectionalLight', label: 'Directional Light'}
    ]
  },
  {
    extensionName: 'KHR_materials_unlit',
    models: [
      {name: 'UnlitTest', label: 'Unlit Test'},
      {name: 'PointLightIntensityTest', label: 'Point Light Intensity Test'},
      {name: 'TextureTransformMultiTest', label: 'Texture Transform Multi Test'}
    ]
  },
  {
    extensionName: 'KHR_materials_emissive_strength',
    models: [
      {name: 'CompareEmissiveStrength', label: 'Compare Emissive Strength'},
      {name: 'CarConcept', label: 'Car Concept'},
      {name: 'PlaysetLightTest', label: 'Playset Light Test'}
    ]
  },
  {
    extensionName: 'KHR_materials_specular',
    models: [
      {name: 'CompareSpecular', label: 'Compare Specular'},
      {name: 'SpecularTest', label: 'Specular Test'},
      {name: 'SheenWoodLeatherSofa', label: 'Sheen Wood Leather Sofa'}
    ]
  },
  {
    extensionName: 'KHR_materials_ior',
    models: [
      {name: 'CompareIor', label: 'Compare IOR'},
      {name: 'IORTestGrid', label: 'IOR Test Grid'},
      {name: 'SunglassesKhronos', label: 'Sunglasses Khronos'}
    ]
  },
  {
    extensionName: 'KHR_materials_transmission',
    models: [
      {name: 'ABeautifulGame', label: 'A Beautiful Game'},
      {name: 'CompareTransmission', label: 'Compare Transmission'},
      {name: 'CommercialRefrigerator', label: 'Commercial Refrigerator'}
    ]
  },
  {
    extensionName: 'KHR_materials_volume',
    models: [
      {name: 'CompareVolume', label: 'Compare Volume'},
      {name: 'GlassVaseFlowers', label: 'Glass Vase Flowers'},
      {name: 'ABeautifulGame', label: 'A Beautiful Game'}
    ]
  },
  {
    extensionName: 'KHR_materials_clearcoat',
    models: [
      {name: 'CompareClearcoat', label: 'Compare Clearcoat'},
      {name: 'CarConcept', label: 'Car Concept'},
      {name: 'ClearCoatCarPaint', label: 'Clearcoat Car Paint'}
    ]
  },
  {
    extensionName: 'KHR_materials_sheen',
    models: [
      {name: 'GlamVelvetSofa', label: 'Glam Velvet Sofa'},
      {name: 'CompareSheen', label: 'Compare Sheen'},
      {name: 'SheenWoodLeatherSofa', label: 'Sheen Wood Leather Sofa'}
    ]
  },
  {
    extensionName: 'KHR_materials_iridescence',
    models: [
      {name: 'CompareIridescence', label: 'Compare Iridescence'},
      {name: 'IridescenceSuzanne', label: 'Iridescence Suzanne'},
      {name: 'SunglassesKhronos', label: 'Sunglasses Khronos'}
    ]
  },
  {
    extensionName: 'KHR_materials_anisotropy',
    models: [
      {name: 'AnisotropyBarnLamp', label: 'Anisotropy Barn Lamp'},
      {name: 'CompareAnisotropy', label: 'Compare Anisotropy'},
      {name: 'CarbonFibre', label: 'Carbon Fibre'}
    ]
  },
  {
    extensionName: 'KHR_materials_pbrSpecularGlossiness',
    models: [{name: 'SpecGlossVsMetalRough', label: 'SpecGloss Vs Metal Rough'}]
  },
  {
    extensionName: 'KHR_materials_variants',
    models: [
      {name: 'MaterialsVariantsShoe', label: 'Materials Variants Shoe'},
      {name: 'GlamVelvetSofa', label: 'Glam Velvet Sofa'},
      {name: 'CarConcept', label: 'Car Concept'}
    ]
  },
  {
    extensionName: 'KHR_texture_basisu',
    models: [
      {
        name: 'AnisotropyBarnLamp',
        label: 'Anisotropy Barn Lamp (KTX2 BasisU)',
        variant: 'glTF-KTX-BasisU',
        fileName: 'AnisotropyBarnLamp.gltf'
      },
      {
        name: 'StainedGlassLamp',
        label: 'Stained Glass Lamp (KTX2 BasisU)',
        variant: 'glTF-KTX-BasisU',
        fileName: 'StainedGlassLamp.gltf'
      },
      {
        name: 'CarConcept',
        label: 'Car Concept (KTX2 BasisU + Draco)',
        variant: 'glTF-KTX-BasisU-Draco',
        fileName: 'CarConcept.gltf'
      }
    ]
  },
  {
    extensionName: 'EXT_texture_webp',
    models: [
      {
        name: 'CarConcept',
        label: 'Car Concept (WebP)',
        variant: 'glTF-WEBP',
        fileName: 'CarConcept.gltf'
      },
      {
        name: 'ChronographWatch',
        label: 'Chronograph Watch (WebP)',
        variant: 'glTF-WEBP',
        fileName: 'ChronographWatch.gltf'
      }
    ]
  },
  {
    extensionName: 'KHR_texture_transform',
    models: [
      {name: 'TextureTransformMultiTest', label: 'Texture Transform Multi Test'},
      {name: 'TextureTransformTest', label: 'Texture Transform Test'},
      {name: 'CarConcept', label: 'Car Concept'}
    ]
  },
  {
    extensionName: 'KHR_animation_pointer',
    models: [
      {name: 'PotOfCoalsAnimationPointer', label: 'Pot Of Coals Animation Pointer'},
      {name: 'AnimationPointerUVs', label: 'Animation Pointer UVs'}
    ]
  },
  {
    extensionName: 'KHR_xmp_json_ld',
    models: [
      {name: 'ScatteringSkull', label: 'Scattering Skull'},
      {name: 'XmpMetadataRoundedCube', label: 'XMP Metadata Rounded Cube'}
    ]
  },
  {
    extensionName: 'KHR_xmp',
    models: [{name: 'TransmissionTest', label: 'Transmission Test'}]
  },
  {
    extensionName: 'EXT_mesh_gpu_instancing',
    models: [{name: 'SimpleInstancing', label: 'Simple Instancing'}]
  },
  {
    extensionName: 'KHR_materials_diffuse_transmission',
    models: [
      {name: 'DiffuseTransmissionPlant', label: 'Diffuse Transmission Plant'},
      {name: 'DiffuseTransmissionTeacup', label: 'Diffuse Transmission Teacup'},
      {name: 'ScatteringSkull', label: 'Scattering Skull'}
    ]
  },
  {
    extensionName: 'KHR_materials_dispersion',
    models: [
      {name: 'CompareDispersion', label: 'Compare Dispersion'},
      {name: 'DragonDispersion', label: 'Dragon Dispersion'}
    ]
  },
  {
    extensionName: 'KHR_materials_volume_scatter',
    models: [{name: 'ScatteringSkull', label: 'Scattering Skull'}]
  },
  {
    extensionName: 'KHR_node_visibility',
    models: [
      {name: 'LightVisibility', label: 'Light Visibility'},
      {name: 'CubeVisibility', label: 'Cube Visibility'}
    ]
  }
];
