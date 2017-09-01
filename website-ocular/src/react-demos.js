import {default as Instancing} from '../../examples/core/instancing/app.js';
import {default as Cubemap} from '../../examples/core/cubemap/app.js';
// import {default as CustomPicking} from '../../examples/core/custom-picking/app.js';
// import {default as DeferredRendering} from '../../examples/core/deferred-rendering/app.js';
import {default as Mandelbrot} from '../../examples/core/mandelbrot/app.js';
import {default as Fragment} from '../../examples/core/fragment/app.js';
// import {default as Particles} from '../../examples/core/particles/app.js';
// import {default as Persistence} from '../../examples/core/persistence/app.js';
import {default as Picking} from '../../examples/core/picking/app.js';
import {default as Shadowmap} from '../../examples/core/shadowmap/src/app.js';
import {default as TransformFeedback} from '../../examples/core/transform-feedback/app.js';

import {default as Lesson01} from '../../examples/lessons/01/app.js';
import {default as Lesson02} from '../../examples/lessons/02/app.js';
import {default as Lesson03} from '../../examples/lessons/03/app.js';
import {default as Lesson04} from '../../examples/lessons/04/app.js';
import {default as Lesson05} from '../../examples/lessons/05/app.js';
import {default as Lesson06} from '../../examples/lessons/06/app.js';
import {default as Lesson07} from '../../examples/lessons/07/app.js';
import {default as Lesson08} from '../../examples/lessons/08/app.js';
import {default as Lesson09} from '../../examples/lessons/09/app.js';
import {default as Lesson10} from '../../examples/lessons/10/app.js';
import {default as Lesson11} from '../../examples/lessons/11/app.js';
import {default as Lesson12} from '../../examples/lessons/12/app.js';
import {default as Lesson13} from '../../examples/lessons/13/app.js';
import {default as Lesson16} from '../../examples/lessons/16/app.js';

/* eslint-disable */
import React from 'react';
import Demo from './react-demo-runner';
/* eslint-enable */

const InstancingDemo = props => (<Demo {...props} demo={Instancing}/>);
const CubemapDemo = props => (<Demo {...props} demo={Cubemap}/>);
// const CustomPickingDemo = props => (<Demo {...props} demo={CustomPicking}/>);
// const DeferredRenderingDemo = props => (<Demo {...props} demo={DeferredRendering/>);
const MandelbrotDemo = props => (<Demo {...props} demo={Mandelbrot}/>);
const FragmentDemo = props => (<Demo {...props} demo={Fragment}/>);
// const ParticlesDemo = props => (<Demo {...props} demo={Particles}/>);
// const PersistenceDemo = props => (<Demo {...props} demo={Persistence}/>);
const PickingDemo = props => (<Demo {...props} demo={Picking}/>);
const ShadowmapDemo = props => (<Demo {...props} demo={Shadowmap}/>);
const TransformFeedbackDemo = props => (<Demo {...props} demo={TransformFeedback}/>);

const Lesson01Demo = props => (<Demo {...props} demo={Lesson01}/>);
const Lesson02Demo = props => (<Demo {...props} demo={Lesson02}/>);
const Lesson03Demo = props => (<Demo {...props} demo={Lesson03}/>);
const Lesson04Demo = props => (<Demo {...props} demo={Lesson04}/>);
const Lesson05Demo = props => (<Demo {...props} demo={Lesson05}/>);
const Lesson06Demo = props => (<Demo {...props} demo={Lesson06}/>);
const Lesson07Demo = props => (<Demo {...props} demo={Lesson07}/>);
const Lesson08Demo = props => (<Demo {...props} demo={Lesson08}/>);
const Lesson09Demo = props => (<Demo {...props} demo={Lesson09}/>);
const Lesson10Demo = props => (<Demo {...props} demo={Lesson10}/>);
const Lesson11Demo = props => (<Demo {...props} demo={Lesson11}/>);
const Lesson12Demo = props => (<Demo {...props} demo={Lesson12}/>);
const Lesson13Demo = props => (<Demo {...props} demo={Lesson13}/>);
const Lesson16Demo = props => (<Demo {...props} demo={Lesson16}/>);

export {
  InstancingDemo,
  CubemapDemo,
  // CustomPickingDemo,
  // DeferredRenderingDemo,
  MandelbrotDemo,
  FragmentDemo,
  // ParticlesDemo,
  // PersistenceDemo,
  PickingDemo,
  ShadowmapDemo,
  TransformFeedbackDemo,

  Lesson01Demo,
  Lesson02Demo,
  Lesson03Demo,
  Lesson04Demo,
  Lesson05Demo,
  Lesson06Demo,
  Lesson07Demo,
  Lesson08Demo,
  Lesson09Demo,
  Lesson10Demo,
  Lesson11Demo,
  Lesson12Demo,
  Lesson13Demo,
  Lesson16Demo
};
