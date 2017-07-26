import React, {PureComponent} from 'react';

import * as Demos from '../../contents/demos.js';

export default class InfoPanel extends PureComponent {

  render() {
    const {demo} = this.props;
    const DemoComponent = Demos[demo];
    const controls = DemoComponent.getInfo && DemoComponent.getInfo() || '';

    return (
      <div className="options-panel top-right" >
        <h3>{demo}</h3>
        <div className="control-panel" dangerouslySetInnerHTML={{__html: controls}} />

        {this.props.children}

      </div>
    );
  }
}
