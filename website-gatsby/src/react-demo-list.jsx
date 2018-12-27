import Instancing from '../../examples/core/instancing/app';
import Cubemap from '../../examples/core/cubemap/app';
// import CustomPicking from '../../examples/core/custom-picking/app';
// import DeferredRendering from '../../examples/core/deferred-rendering/app';
import Mandelbrot from '../../examples/core/mandelbrot/app';
import Fragment from '../../examples/core/fragment/app';
// import Particles from '../../examples/core/particles/app';
// import Persistence from '../../examples/core/persistence/app';
import Picking from '../../examples/core/picking/app';
import Shadowmap from '../../examples/core/shadowmap/app';
import Transform from '../../examples/core/transform/app';
import TransformFeedback from '../../examples/core/transform-feedback/app';

import Lesson01 from '../../examples/lessons/01/app';
import Lesson02 from '../../examples/lessons/02/app';
import Lesson03 from '../../examples/lessons/03/app';
import Lesson04 from '../../examples/lessons/04/app';
import Lesson05 from '../../examples/lessons/05/app';
import Lesson06 from '../../examples/lessons/06/app';
import Lesson07 from '../../examples/lessons/07/app';
import Lesson08 from '../../examples/lessons/08/app';
import Lesson09 from '../../examples/lessons/09/app';
import Lesson10 from '../../examples/lessons/10/app';
import Lesson11 from '../../examples/lessons/11/app';
import Lesson12 from '../../examples/lessons/12/app';
import Lesson13 from '../../examples/lessons/13/app';
import Lesson14 from '../../examples/lessons/14/app';
import Lesson15 from '../../examples/lessons/15/app';
import Lesson16 from '../../examples/lessons/16/app';

/* eslint-disable */
import React from 'react';
import Demo from './react-demo-runner';
/* eslint-enable */

const examplesPath = 'https://github.com/uber/luma.gl/tree/master/examples';

export const InstancingDemo = props => (
  <Demo {...props} demo={Instancing} sourceLink={`${examplesPath}/core/instancing/`} />
);
export const CubemapDemo = props => (
  <Demo {...props} demo={Cubemap} sourceLink={`${examplesPath}/core/cubemap/`} />
);
// const CustomPickingDemo = props => (<Demo {...props} demo={CustomPicking} />);
// const DeferredRenderingDemo = props => (<Demo {...props} demo={DeferredRendering} />);
export const MandelbrotDemo = props => (
  <Demo {...props} demo={Mandelbrot} sourceLink={`${examplesPath}/core/mandelbrot/`} />
);
export const FragmentDemo = props => (
  <Demo {...props} demo={Fragment} sourceLink={`${examplesPath}/core/fragment/`} />
);
// const ParticlesDemo = props => (<Demo {...props} demo={Particles}/>);
// const PersistenceDemo = props => (<Demo {...props} demo={Persistence}/>);
export const PickingDemo = props => (
  <Demo {...props} demo={Picking} sourceLink={`${examplesPath}/core/picking/`} />
);
export const ShadowmapDemo = props => (
  <Demo {...props} demo={Shadowmap} sourceLink={`${examplesPath}/core/shadowmap/`} />
);
export const TransformDemo = props => (
  <Demo {...props} demo={Transform} sourceLink={`${examplesPath}/core/Transform/`} />
);
export const TransformFeedbackDemo = props => (
  <Demo
    {...props}
    demo={TransformFeedback}
    sourceLink={`${examplesPath}/core/transform-feedback/`}
  />
);

export const Lesson01Demo = props => (
  <Demo {...props} demo={Lesson01} sourceLink={`${examplesPath}/lessons/01/`} />
);
export const Lesson02Demo = props => (
  <Demo {...props} demo={Lesson02} sourceLink={`${examplesPath}/lessons/02/`} />
);
export const Lesson03Demo = props => (
  <Demo {...props} demo={Lesson03} sourceLink={`${examplesPath}/lessons/03/`} />
);
export const Lesson04Demo = props => (
  <Demo {...props} demo={Lesson04} sourceLink={`${examplesPath}/lessons/04/`} />
);
export const Lesson05Demo = props => (
  <Demo {...props} demo={Lesson05} sourceLink={`${examplesPath}/lessons/05/`} />
);
export const Lesson06Demo = props => (
  <Demo {...props} demo={Lesson06} sourceLink={`${examplesPath}/lessons/06/`} />
);
export const Lesson07Demo = props => (
  <Demo {...props} demo={Lesson07} sourceLink={`${examplesPath}/lessons/07/`} />
);
export const Lesson08Demo = props => (
  <Demo {...props} demo={Lesson08} sourceLink={`${examplesPath}/lessons/08/`} />
);
export const Lesson09Demo = props => (
  <Demo {...props} demo={Lesson09} sourceLink={`${examplesPath}/lessons/09/`} />
);
export const Lesson10Demo = props => (
  <Demo {...props} demo={Lesson10} sourceLink={`${examplesPath}/lessons/10/`} />
);
export const Lesson11Demo = props => (
  <Demo {...props} demo={Lesson11} sourceLink={`${examplesPath}/lessons/11/`} />
);
export const Lesson12Demo = props => (
  <Demo {...props} demo={Lesson12} sourceLink={`${examplesPath}/lessons/12/`} />
);
export const Lesson13Demo = props => (
  <Demo {...props} demo={Lesson13} sourceLink={`${examplesPath}/lessons/13/`} />
);
export const Lesson14Demo = props => (
  <Demo {...props} demo={Lesson14} sourceLink={`${examplesPath}/lessons/14/`} />
);
export const Lesson15Demo = props => (
  <Demo {...props} demo={Lesson15} sourceLink={`${examplesPath}/lessons/15/`} />
);
export const Lesson16Demo = props => (
  <Demo {...props} demo={Lesson16} sourceLink={`${examplesPath}/lessons/16/`} />
);
