// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Texture} from '../../core/src/index';
import {
  floatColors,
  lighting,
  phongMaterial,
  picking,
  ShaderModule
} from '../../shadertools/src/index';
import type {
  FloatColorsProps,
  LightingProps,
  PhongMaterialProps
} from '../../shadertools/src/index';
import {ShaderInputs} from '../src/shader-inputs';

test('ShaderInputs#picking', t => {
  const shaderInputsUntyped = new ShaderInputs({picking});
  // Add
  shaderInputsUntyped.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputsUntyped, 'untyped');

  // @ts-expect-error
  shaderInputsUntyped.setProps({picking: {invalidKey: 1}});

  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputs, 'typed access');

  t.end();
});

test('ShaderInputs#picking', t => {
  const shaderInputsUntyped = new ShaderInputs({picking});
  shaderInputsUntyped.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  t.ok(shaderInputsUntyped, 'untyped');

  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});

  // @ts-expect-error - if this stops generating an error, we have should trigger a typescript error here
  shaderInputs.setProps({picking: {invalidKey: true}});

  t.ok(shaderInputs, 'typed access');

  // t.comment(JSON.stringify(shaderInputs.getUniformBufferValues(), null, 2));

  t.end();
});

test('ShaderInputs#picking prop merge', t => {
  const shaderInputs = new ShaderInputs<{picking: typeof picking.props}>({picking});
  const expected = {...picking.defaultUniforms} as typeof picking.uniforms;
  t.deepEqual(shaderInputs.moduleUniforms.picking, expected, 'defaults set');

  shaderInputs.setProps({picking: {highlightColor: [255, 0, 255]}});
  expected.highlightColor = [1, 0, 1, 1]; // Color normalized and alpha added
  t.deepEqual(shaderInputs.moduleUniforms.picking, expected, 'Only highlight color updated');

  // Setting the highlighted object also enables highlight
  shaderInputs.setProps({picking: {highlightedObjectColor: [255, 255, 255]}});
  expected.highlightedObjectColor = [255, 255, 255];
  expected.isHighlightActive = true;
  t.deepEqual(
    shaderInputs.moduleUniforms.picking,
    expected,
    'Only highlight object and highlight active updated'
  );

  t.end();
});

test('ShaderInputs#dependencies', t => {
  type CustomProps = {color: number[]};
  const custom: ShaderModule<CustomProps> = {
    name: 'custom',
    dependencies: [picking],
    uniformTypes: {color: 'vec3<f32>'},
    propTypes: {color: {value: [0, 0, 0]}}
  };

  const shaderInputs = new ShaderInputs<{
    custom: CustomProps;
    picking: typeof picking.props;
  }>({custom});
  t.deepEqual(Object.keys(shaderInputs.modules), ['custom', 'picking']);

  shaderInputs.setProps({
    custom: {color: [255, 0, 0]},
    picking: {highlightedObjectColor: [1, 2, 3]}
  });
  t.deepEqual(shaderInputs.moduleUniforms.custom['color'], [255, 0, 0], 'custom color updated');
  t.deepEqual(
    shaderInputs.moduleUniforms.picking['highlightedObjectColor'],
    [1, 2, 3],
    'highlight object color updated'
  );

  t.end();
});

test('ShaderInputs#floatColors dependency props', t => {
  const shaderInputs = new ShaderInputs<{
    phongMaterial: PhongMaterialProps;
    floatColors: FloatColorsProps;
  }>({phongMaterial, floatColors});

  shaderInputs.setProps({
    phongMaterial: {
      specularColor: [2, 1, 0.5]
    },
    floatColors: {useByteColors: false}
  });

  t.deepEqual(
    shaderInputs.moduleUniforms.phongMaterial.specularColor,
    [2, 1, 0.5],
    'phong material uniform updated without CPU normalization'
  );
  t.equal(
    shaderInputs.moduleUniforms.floatColors.useByteColors,
    false,
    'useByteColors configured directly on floatColors dependency'
  );

  t.end();
});

test('ShaderInputs#bindings', t => {
  [true, false].map(callback => {
    t.comment(`custom module created ${callback ? 'with' : 'without'} getUniforms()`);
    type CustomProps = {color: [number, number, number]; colorTexture: Texture};
    const custom: ShaderModule<CustomProps> = {
      name: 'custom',
      uniformTypes: {color: 'vec3<f32>'},
      propTypes: {color: {value: [0, 0, 0]}}
    };
    if (callback) {
      custom.getUniforms = ({color, colorTexture}) => {
        return {color, colorTexture};
      };
    }

    const shaderInputs = new ShaderInputs<{
      custom: CustomProps;
    }>({custom});

    const MOCK_TEXTURE = 'MOCK_TEXTURE' as unknown as Texture;
    shaderInputs.setProps({
      custom: {color: [255, 0, 0], colorTexture: MOCK_TEXTURE}
    });
    t.deepEqual(shaderInputs.moduleUniforms.custom['color'], [255, 0, 0], 'custom color updated');
    t.equal(
      shaderInputs.moduleBindings.custom['colorTexture'],
      MOCK_TEXTURE,
      'colorTexture updated'
    );

    const uniformValues = shaderInputs.getUniformValues();
    const bindings = shaderInputs.getBindingValues();
    t.deepEqual(uniformValues, {custom: {color: [255, 0, 0]}}, 'uniformValues correct');
    t.deepEqual(bindings, {colorTexture: 'MOCK_TEXTURE'}, 'bindings correct');

    t.end();
  });
});

test('ShaderInputs#getModuleBindingValues', t => {
  type FirstModuleProps = {firstTexture: Texture};
  type SecondModuleProps = {secondTexture: Texture};

  const firstModule: ShaderModule<FirstModuleProps> = {
    name: 'firstModule'
  };
  const secondModule: ShaderModule<SecondModuleProps> = {
    name: 'secondModule'
  };

  const shaderInputs = new ShaderInputs<{
    firstModule: FirstModuleProps;
    secondModule: SecondModuleProps;
  }>({firstModule, secondModule});

  const firstTexture = 'FIRST_TEXTURE' as unknown as Texture;
  const secondTexture = 'SECOND_TEXTURE' as unknown as Texture;
  shaderInputs.setProps({
    firstModule: {firstTexture},
    secondModule: {secondTexture}
  });

  t.deepEqual(
    shaderInputs.getModuleBindingValues('firstModule'),
    {firstTexture},
    'returns only bindings for the requested module'
  );
  t.deepEqual(
    shaderInputs.getModuleBindingValues('secondModule'),
    {secondTexture},
    'returns bindings for a different module independently'
  );
  t.deepEqual(
    shaderInputs.getModuleBindingValues('missingModule'),
    {},
    'returns an empty object for unknown modules'
  );
  t.deepEqual(
    shaderInputs.getBindingValues(),
    {firstTexture, secondTexture},
    'flattened binding lookup remains unchanged'
  );

  t.end();
});

test('ShaderInputs#composite uniforms', t => {
  type CompositeUniforms = {
    light: {
      transform: {
        position: [number, number, number];
        range: number;
      };
      intensity: number;
    };
  };

  type CompositeProps = {
    light?: {
      transform?: {
        position?: [number, number, number];
        range?: number;
      };
      intensity?: number;
    };
    lightTexture?: Texture;
  };

  type CompositeBindings = {
    lightTexture: Texture;
  };

  const composite: ShaderModule<CompositeProps, CompositeUniforms, CompositeBindings> = {
    name: 'composite',
    uniformTypes: {
      light: {
        transform: {
          position: 'vec3<f32>',
          range: 'f32'
        },
        intensity: 'f32'
      }
    },
    defaultUniforms: {
      light: {
        transform: {
          position: [0, 0, 0],
          range: 1
        },
        intensity: 0.5
      }
    },
    getUniforms: props => props as Partial<CompositeUniforms & CompositeBindings>
  };

  const shaderInputs = new ShaderInputs<{
    composite: CompositeProps;
  }>({composite});

  shaderInputs.setProps({
    composite: {
      light: {
        transform: {
          position: [1, 2, 3],
          range: 10
        }
      }
    }
  });

  const MOCK_TEXTURE = 'MOCK_TEXTURE' as unknown as Texture;
  shaderInputs.setProps({
    composite: {
      light: {
        intensity: 0.8
      },
      lightTexture: MOCK_TEXTURE
    }
  });

  t.deepEqual(
    shaderInputs.moduleUniforms.composite['light'],
    {
      transform: {
        position: [1, 2, 3],
        range: 10
      },
      intensity: 0.8
    },
    'nested uniforms are merged by schema'
  );
  t.equal(
    shaderInputs.moduleBindings.composite['lightTexture'],
    MOCK_TEXTURE,
    'bindings still split from composite uniforms'
  );
  t.deepEqual(
    shaderInputs.getUniformValues(),
    {
      composite: {
        light: {
          transform: {
            position: [1, 2, 3],
            range: 10
          },
          intensity: 0.8
        }
      }
    },
    'getUniformValues keeps nested shape'
  );

  t.end();
});

test('ShaderInputs#lighting array-of-struct uniforms', t => {
  const shaderInputs = new ShaderInputs<{lighting: LightingProps}>({lighting});

  shaderInputs.setProps({
    lighting: {
      lights: [
        {type: 'ambient', color: [0, 0, 255]},
        {
          type: 'point',
          color: [255, 0, 0],
          position: [1, 2, 3],
          attenuation: [1, 0.25, 0.125]
        },
        {
          type: 'spot',
          color: [255, 255, 0],
          position: [0, 3, 2],
          direction: [0, -1, 0],
          innerConeAngle: 0.25,
          outerConeAngle: 0.75
        },
        {
          type: 'directional',
          color: [0, 255, 0],
          direction: [0, 1, 0]
        }
      ]
    }
  });

  t.equal(
    shaderInputs.moduleUniforms.lighting['pointLightCount'],
    1,
    'point light count preserved'
  );
  t.equal(shaderInputs.moduleUniforms.lighting['spotLightCount'], 1, 'spot light count preserved');
  t.equal(
    shaderInputs.moduleUniforms.lighting['directionalLightCount'],
    1,
    'directional light count preserved'
  );
  t.deepEqual(
    shaderInputs.moduleUniforms.lighting['lights'],
    [
      {
        color: [1, 0, 0],
        position: [1, 2, 3],
        direction: [1, 1, 1],
        attenuation: [1, 0.25, 0.125],
        coneCos: [1, 0]
      },
      {
        color: [1, 1, 0],
        position: [0, 3, 2],
        direction: [0, -1, 0],
        attenuation: [1, 0, 0],
        coneCos: [Math.cos(0.25), Math.cos(0.75)]
      },
      {
        color: [0, 1, 0],
        position: [1, 1, 2],
        direction: [0, 1, 0],
        attenuation: [1, 0, 0],
        coneCos: [1, 0]
      },
      {
        color: [1, 1, 1],
        position: [1, 1, 2],
        direction: [1, 1, 1],
        attenuation: [1, 0, 0],
        coneCos: [1, 0]
      },
      {
        color: [1, 1, 1],
        position: [1, 1, 2],
        direction: [1, 1, 1],
        attenuation: [1, 0, 0],
        coneCos: [1, 0]
      }
    ],
    'lighting module keeps nested light structs'
  );
  t.deepEqual(shaderInputs.moduleBindings.lighting, {}, 'lighting module does not emit bindings');
  t.deepEqual(
    shaderInputs.getUniformValues(),
    {lighting: shaderInputs.moduleUniforms.lighting},
    'uniform values remain nested for composite arrays'
  );

  t.end();
});
