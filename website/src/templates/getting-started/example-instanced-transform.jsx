import React from 'react';
// import {LumaExample} from '../../react-luma';
// import AnimationLoopTemplate from '../../../../examples/getting-started/instanced-transform/app';

export class InstancedTransformExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <div>Transform examples temporarily disabled</div>
      // <LumaExample id="instanced-transform" name="instanced-transform" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
