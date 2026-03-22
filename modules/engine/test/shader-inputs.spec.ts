import {expect, test} from 'vitest';
import { Texture } from '../../core/src/index';
import { lighting, picking, ShaderModule } from '../../shadertools/src/index';
import type { LightingProps } from '../../shadertools/src/index';
import { ShaderInputs } from '../src/shader-inputs';
test('ShaderInputs#picking', () => {
  const shaderInputsUntyped = new ShaderInputs({
    picking
  });
  // Add
  shaderInputsUntyped.setProps({
    picking: {
      highlightedObjectColor: [255, 255, 255]
    }
  });
  expect(shaderInputsUntyped, 'untyped').toBeTruthy();

  // @ts-expect-error
  shaderInputsUntyped.setProps({
    picking: {
      invalidKey: 1
    }
  });
  const shaderInputs = new ShaderInputs<{
    picking: typeof picking.props;
  }>({
    picking
  });
  shaderInputs.setProps({
    picking: {
      highlightedObjectColor: [255, 255, 255]
    }
  });
  expect(shaderInputs, 'typed access').toBeTruthy();
});
test('ShaderInputs#picking', () => {
  const shaderInputsUntyped = new ShaderInputs({
    picking
  });
  shaderInputsUntyped.setProps({
    picking: {
      highlightedObjectColor: [255, 255, 255]
    }
  });
  expect(shaderInputsUntyped, 'untyped').toBeTruthy();
  const shaderInputs = new ShaderInputs<{
    picking: typeof picking.props;
  }>({
    picking
  });
  shaderInputs.setProps({
    picking: {
      highlightedObjectColor: [255, 255, 255]
    }
  });

  // @ts-expect-error - if this stops generating an error, we have should trigger a typescript error here
  shaderInputs.setProps({
    picking: {
      invalidKey: true
    }
  });
  expect(shaderInputs, 'typed access').toBeTruthy();

  // t.comment(JSON.stringify(shaderInputs.getUniformBufferValues(), null, 2));
});
test('ShaderInputs#picking prop merge', () => {
  const shaderInputs = new ShaderInputs<{
    picking: typeof picking.props;
  }>({
    picking
  });
  const expected = {
    ...picking.defaultUniforms
  } as typeof picking.uniforms;
  expect(shaderInputs.moduleUniforms.picking, 'defaults set').toEqual(expected);
  shaderInputs.setProps({
    picking: {
      highlightColor: [255, 0, 255]
    }
  });
  expected.highlightColor = [1, 0, 1, 1]; // Color normalized and alpha added
  expect(shaderInputs.moduleUniforms.picking, 'Only highlight color updated').toEqual(expected);

  // Setting the highlighted object also enables highlight
  shaderInputs.setProps({
    picking: {
      highlightedObjectColor: [255, 255, 255]
    }
  });
  expected.highlightedObjectColor = [255, 255, 255];
  expected.isHighlightActive = true;
  expect(shaderInputs.moduleUniforms.picking, 'Only highlight object and highlight active updated').toEqual(expected);
});
test('ShaderInputs#dependencies', () => {
  type CustomProps = {
    color: number[];
  };
  const custom: ShaderModule<CustomProps> = {
    name: 'custom',
    dependencies: [picking],
    uniformTypes: {
      color: 'vec3<f32>'
    },
    propTypes: {
      color: {
        value: [0, 0, 0]
      }
    }
  };
  const shaderInputs = new ShaderInputs<{
    custom: CustomProps;
    picking: typeof picking.props;
  }>({
    custom
  });
  expect(Object.keys(shaderInputs.modules)).toEqual(['custom', 'picking']);
  shaderInputs.setProps({
    custom: {
      color: [255, 0, 0]
    },
    picking: {
      highlightedObjectColor: [1, 2, 3]
    }
  });
  expect(shaderInputs.moduleUniforms.custom['color'], 'custom color updated').toEqual([255, 0, 0]);
  expect(shaderInputs.moduleUniforms.picking['highlightedObjectColor'], 'highlight object color updated').toEqual([1, 2, 3]);
});
test('ShaderInputs#bindings', () => {
  [true, false].map(callback => {
    type CustomProps = {
      color: [number, number, number];
      colorTexture: Texture;
    };
    const custom: ShaderModule<CustomProps> = {
      name: 'custom',
      uniformTypes: {
        color: 'vec3<f32>'
      },
      propTypes: {
        color: {
          value: [0, 0, 0]
        }
      }
    };
    if (callback) {
      custom.getUniforms = ({
        color,
        colorTexture
      }) => {
        return {
          color,
          colorTexture
        };
      };
    }
    const shaderInputs = new ShaderInputs<{
      custom: CustomProps;
    }>({
      custom
    });
    const MOCK_TEXTURE = 'MOCK_TEXTURE' as unknown as Texture;
    shaderInputs.setProps({
      custom: {
        color: [255, 0, 0],
        colorTexture: MOCK_TEXTURE
      }
    });
    expect(shaderInputs.moduleUniforms.custom['color'], 'custom color updated').toEqual([255, 0, 0]);
    expect(shaderInputs.moduleBindings.custom['colorTexture'], 'colorTexture updated').toBe(MOCK_TEXTURE);
    const uniformValues = shaderInputs.getUniformValues();
    const bindings = shaderInputs.getBindingValues();
    expect(uniformValues, 'uniformValues correct').toEqual({
      custom: {
        color: [255, 0, 0]
      }
    });
    expect(bindings, 'bindings correct').toEqual({
      colorTexture: 'MOCK_TEXTURE'
    });
  });
});
test('ShaderInputs#composite uniforms', () => {
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
  }>({
    composite
  });
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
  expect(shaderInputs.moduleUniforms.composite['light'], 'nested uniforms are merged by schema').toEqual({
    transform: {
      position: [1, 2, 3],
      range: 10
    },
    intensity: 0.8
  });
  expect(shaderInputs.moduleBindings.composite['lightTexture'], 'bindings still split from composite uniforms').toBe(MOCK_TEXTURE);
  expect(shaderInputs.getUniformValues(), 'getUniformValues keeps nested shape').toEqual({
    composite: {
      light: {
        transform: {
          position: [1, 2, 3],
          range: 10
        },
        intensity: 0.8
      }
    }
  });
});
test('ShaderInputs#lighting array-of-struct uniforms', () => {
  const shaderInputs = new ShaderInputs<{
    lighting: LightingProps;
  }>({
    lighting
  });
  shaderInputs.setProps({
    lighting: {
      lights: [{
        type: 'ambient',
        color: [0, 0, 255]
      }, {
        type: 'point',
        color: [255, 0, 0],
        position: [1, 2, 3],
        attenuation: [1, 0.25, 0.125]
      }, {
        type: 'spot',
        color: [255, 255, 0],
        position: [0, 3, 2],
        direction: [0, -1, 0],
        innerConeAngle: 0.25,
        outerConeAngle: 0.75
      }, {
        type: 'directional',
        color: [0, 255, 0],
        direction: [0, 1, 0]
      }]
    }
  });
  expect(shaderInputs.moduleUniforms.lighting['pointLightCount'], 'point light count preserved').toBe(1);
  expect(shaderInputs.moduleUniforms.lighting['spotLightCount'], 'spot light count preserved').toBe(1);
  expect(shaderInputs.moduleUniforms.lighting['directionalLightCount'], 'directional light count preserved').toBe(1);
  expect(shaderInputs.moduleUniforms.lighting['lights'], 'lighting module keeps nested light structs').toEqual([{
    color: [1, 0, 0],
    position: [1, 2, 3],
    direction: [1, 1, 1],
    attenuation: [1, 0.25, 0.125],
    coneCos: [1, 0]
  }, {
    color: [1, 1, 0],
    position: [0, 3, 2],
    direction: [0, -1, 0],
    attenuation: [1, 0, 0],
    coneCos: [Math.cos(0.25), Math.cos(0.75)]
  }, {
    color: [0, 1, 0],
    position: [1, 1, 2],
    direction: [0, 1, 0],
    attenuation: [1, 0, 0],
    coneCos: [1, 0]
  }, {
    color: [1, 1, 1],
    position: [1, 1, 2],
    direction: [1, 1, 1],
    attenuation: [1, 0, 0],
    coneCos: [1, 0]
  }, {
    color: [1, 1, 1],
    position: [1, 1, 2],
    direction: [1, 1, 1],
    attenuation: [1, 0, 0],
    coneCos: [1, 0]
  }]);
  expect(shaderInputs.moduleBindings.lighting, 'lighting module does not emit bindings').toEqual({});
  expect(shaderInputs.getUniformValues(), 'uniform values remain nested for composite arrays').toEqual({
    lighting: shaderInputs.moduleUniforms.lighting
  });
});
