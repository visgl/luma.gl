import React from 'react';
// import {LumaExample} from '../../../react-luma';
// import AnimationLoopTemplate from '../../../../../examples/tutorials/instanced-transform/app';

export class InstancedTransformExample extends React.Component {
  render() {
    const { pageContext } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <h2><i>Note: Transform examples temporarily disabled</i></h2>
      // <LumaExample id="instanced-transform" name="instanced-transform" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} />
    );
  }
}
