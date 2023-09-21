import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/tutorials/shader-modules/app';

export class ShaderModulesExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id="shader-modules" name="shader-modules" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
