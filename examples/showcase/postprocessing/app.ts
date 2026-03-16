// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  AnimationLoopTemplate,
  AnimationProps,
  GroupNode,
  DynamicTexture,
  loadImageBitmap,
  ShaderPassRenderer
} from '@luma.gl/engine';
import {Device} from '@luma.gl/core';
import * as shaderModules from '@luma.gl/effects';
import {ShaderPass} from '@luma.gl/shadertools';

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
<div class="contents">Copyright 2011 <a href="http://madebyevan.com">Evan Wallace</a>
  <br><br>This application is powered by <a href="http://evanw.github.com/glfx.js/">glfx.js</a>, 
  an open-source image effect library that uses WebGL.&nbsp; The source code for this application is 
  also <a href="http://github.com/evanw/webgl-filter/">available on GitHub</a>.
</div>
<div style="margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
  <label for="postprocessing-selector" style="display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #57606a;">Effect</label>
  <div style="position: relative;">
    <select id="postprocessing-selector" style="display: block; width: 100%; margin: 0; padding: 10px 42px 10px 14px; border: 1px solid #c9d1d9; border-radius: 12px; background: rgba(255, 255, 255, 0.95); color: #0f172a; font-size: 15px; font-weight: 500; line-height: 1.2; appearance: none; -webkit-appearance: none; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);"></select>
    <span aria-hidden="true" style="position: absolute; right: 14px; top: 50%; width: 9px; height: 9px; border-right: 2px solid #57606a; border-bottom: 2px solid #57606a; transform: translateY(-65%) rotate(45deg); pointer-events: none;"></span>
  </div>
</div>
`;

  device: Device;
  scenes: GroupNode[] = [];
  center = [0, 0, 0];
  vantage = [0, 0, 0];
  time: number = 0;

  shaderPassMap: Record<string, ShaderPass>;
  imageTexture: DynamicTexture;
  selector: HTMLSelectElement | null = null;

  shaderPassRenderer!: ShaderPassRenderer;
  shaderPasses!: ShaderPass[];

  constructor({device}: AnimationProps) {
    super();

    this.device = device;
    this.imageTexture = new DynamicTexture(device, {
      data: loadImageBitmap('./image2.png', {imageOrientation: 'flipY'})
    });

    this.shaderPassMap = getShaderPasses();
    this.setShaderPasses([]);

    const NO_EFFECT = 'No effect';
    const shaderPassNames = [NO_EFFECT, ...Object.keys(this.shaderPassMap)];
    this.selector = initializeSelector('postprocessing-selector', shaderPassNames, passName => {
      const shaderPasses: ShaderPass[] = this.shaderPassMap[passName]
        ? [this.shaderPassMap[passName]]
        : [];
      this.setShaderPasses(shaderPasses);
    });
  }

  onFinalize() {
    this.shaderPassRenderer?.destroy();
  }

  onRender({device}: AnimationProps): void {
    this.shaderPassRenderer?.resize();
    // Run the shader passes and generate an output texture
    /* const outputTexture = */ this.shaderPassRenderer.renderToScreen({
      sourceTexture: this.imageTexture
    });
  }

  setShaderPasses(shaderPasses: ShaderPass[]) {
    // this.shaderPasses = shaderPasses;
    this.shaderPassRenderer?.destroy();
    this.shaderPassRenderer = new ShaderPassRenderer(this.device, {
      shaderPasses
    });
  }
}

// Extract list of postprocessing-capable shader modules from the wildcard import
function getShaderPasses(): Record<string, ShaderPass> {
  const passes: Record<string, ShaderPass> = {};
  Object.entries(shaderModules).forEach(([key, module]) => {
    if (module.passes && !key.startsWith('_')) {
      passes[key] = module as ShaderPass;
    }
  });
  return passes;
}

/** Initialize an existing HTML selector for the shader passes */
function initializeSelector(
  id: string,
  array: string[],
  onChange: (key: string) => void
): HTMLSelectElement | null {
  const selectList = document.getElementById(id) as HTMLSelectElement | null;
  if (!selectList) {
    return null;
  }

  selectList.replaceChildren();

  // Create and append the options
  for (const key of array) {
    const option = document.createElement('option');
    option.value = key;
    option.text = key;
    option.id = key;
    selectList.appendChild(option);
  }

  selectList?.addEventListener('change', e => onChange((e.target as HTMLSelectElement).value));

  return selectList;
}

/*
// Filter object for detailed controls

class Filter {
  constructor(name, module, init, update, reset) {
    this.name = name;
    this._update = update;
    this.reset = reset;

    this.sliders = [];
    this.curves = [];
    this.segmented = [];
    this.nubs = [];

    this.values = {};

    this._initShaderModule(module);

    if (init) {
      init.call(this, this);
    }
  }

  update() {
    this._update(this.values);
  }

  addSlider(name, label, min, max, value, step) {
    this.sliders.push({name: name, label: label, min: min, max: max, value: value, step: step});
    this.values[name] = value;
  }

  addNub(name, value) {
    this.nubs.push({name: name, x: value[0], y: value[1]});
    this.values[name] = value;
  }

  addCurves(name) {
    this.curves.push({name: name});
  }

  addSegmented(name, label, labels, initial) {
    this.segmented.push({name: name, label: label, labels: labels, initial: initial});
  }

  _initShaderModule(module) {
    if (module.uniforms) {
      for (const uniformName in module.uniforms) {
        const uniform = module.uniforms[uniformName];

        if (!uniform.private) {
          switch (uniform.type) {
            case 'number':
              const min = uniform.softMin || uniform.min || 0;
              const max = uniform.softMax || uniform.max || 1;
              const step = (max - min) / 100;
              this.addSlider(uniformName, uniformName, min, max, uniform.value, step);
              break;
            default:
              if (Array.isArray(uniform.value)) {
                // Assume texCoords
                this.addNub(uniformName, uniform.value);
              } else {
                console.log(uniform);
              }
          }
        }
      }
    }

    this._update = values => {
      canvas.filter(module, values);
    };
  }
}

const filters = {
  Adjust: [
    new Filter('Brightness / Contrast', filterModules.brightnessContrast),
    new Filter('Hue / Saturation', filterModules.hueSaturation),
    new Filter('Sepia', filterModules.sepia),
    new Filter('Denoise', filterModules.denoise),
    // this.addSlider('strength', 'Strength', 0, 1, 0.5, 0.01);
    // strength: 3 + 200 * Math.pow(1 - this.strength, 4)
    new Filter('Noise', filterModules.noise),
    new Filter('Unsharp Mask', filterModules.unsharpMask),
    //   this.addSlider('radius', 'Radius', 0, 200, 20, 1);
    //   this.addSlider('strength', 'Strength', 0, 5, 2, 0.01);
    new Filter('Vibrance', filterModules.vibrance),
    new Filter('Vignette', filterModules.vignette),
    new Filter(
      'Curves',
      filterModules.curves,
      filter => {
        filter.addCurves('points');
      },
      values => ({
        map: new Texture2D(gl, {
          width: 256,
          height: 1,
          format: gl.RGBA,
          type: gl.UNSIGNED_BYTE
        })
      })
    )
  ],
  Blur: [
    new Filter('Triangle Blur', filterModules.triangleBlur),
    new Filter('Zoom Blur', filterModules.zoomBlur)
    // new Filter('Lens Blur', filterModules.lensBlur),
    // this.addSlider('radius', 'Radius', 0, 50, 10, 1);
    // this.addSlider('brightness', 'Brightness', -1, 1, 0.75, 0.01);
    // this.addSlider('angle', 'Angle', 0, Math.PI, 0, 0.01);
    // new Filter('Tilt Shift', function() {
    //   this.addNub('start', 0.15, 0.75);
    //   this.addNub('end', 0.75, 0.6);
    //   this.addSlider('blurRadius', 'Radius', 0, 50, 15, 1);
    //   this.addSlider('gradientRadius', 'Thickness', 0, 400, 200, 1);
    // }, function() {
    //   canvas.filter('tiltShift', this.values)
    // })
  ],
  Fun: [
    new Filter('Ink', filterModules.ink),
    new Filter('Edge Work', filterModules.edgeWork),
    new Filter('Hexagonal Pixelate', filterModules.hexagonalPixelate),
    new Filter('Dot Screen', filterModules.dotScreen),
    new Filter('Color Halftone', filterModules.colorHalftone)
  ],
  Warp: [
    new Filter('Swirl', filterModules.swirl),
    new Filter('Bulge / Pinch', filterModules.bulgePinch)
    /*
    new Filter('Perspective', function() {
      this.addSegmented('showAfter', 'Edit point set', ['Before', 'After'], 1);
      this.addNub('a', [0.25, 0.25]);
      this.addNub('b', [0.75, 0.25]);
      this.addNub('c', [0.25, 0.75]);
      this.addNub('d', [0.75, 0.75]);
      var update = this.update;
      this.update = function() {
        update.call(this);

        // Draw a white rectangle connecting the four control points
        var c = canvas2d.getContext('2d');
        c.clearRect(0, 0, canvas2d.width, canvas2d.height);
        for (let i = 0; i < 2; i++) {
          c.beginPath();
          c.lineTo(this.a.x, this.a.y);
          c.lineTo(this.b.x, this.b.y);
          c.lineTo(this.d.x, this.d.y);
          c.lineTo(this.c.x, this.c.y);
          c.closePath();
          c.lineWidth = i ? 2 : 4;
          c.strokeStyle = i ? 'white' : 'black';
          c.stroke();
        }
      };
    }, function() {
      var points = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
      if (this.showAfter) {
        this.after = points;
        canvas.filter('perspective', this.before, this.after).update();
      } else {
        this.before = points;
        canvas.filter('update', );
      }
    }, function() {
      var w = canvas.width, h = canvas.height;
      this.before = [0, 0, w, 0, 0, h, w, h];
      this.after = [this.a.x, this.a.y, this.b.x, this.b.y, this.c.x, this.c.y, this.d.x, this.d.y];
    })
]
 ;
*/
