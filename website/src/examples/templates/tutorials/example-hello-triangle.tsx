import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/tutorials/hello-triangle/app';

export class HelloTriangleExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample id="hello-triangle" name='hello-triangle' AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
