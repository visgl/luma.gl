import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoopTemplate from '../../../../examples/getting-started/shader-hooks/app';

export class ShaderHooksExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id="shader-hooks" name="shader-hooks" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
