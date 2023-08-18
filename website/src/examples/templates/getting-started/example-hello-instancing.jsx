import React from 'react';
import {LumaExample} from '../../react-luma';
import AnimationLoopTemplate from '../../../../examples/getting-started/hello-instancing/app';

export class HelloInstancingExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id="hello-instancing" name="hello-instancing" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
