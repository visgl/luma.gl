import React from 'react';
import {LumaExample} from '../../../react-luma';
import AnimationLoopTemplate from '../../../../../examples/showcase/persistence/app';

export class PersistenceExample extends React.Component {
  render() {
    const { pageContext, panel = true } = this.props;
    const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
    return (
      <LumaExample  name="persistence" AnimationLoopTemplate={AnimationLoopTemplate} exampleConfig={exampleConfig} panel={panel} />
    );
  }
}
