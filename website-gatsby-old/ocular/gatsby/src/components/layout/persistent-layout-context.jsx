// Per recommendations in
// https://www.gatsbyjs.org/packages/gatsby-plugin-layout/


// Context.js
import React from 'react';

const defaultContextValue = {
  data: {
    // set your initial data shape here
    initialized: false,
    config: {},
    tableOfContents: null
  },
  set: () => {},
}

const { Provider, Consumer } = React.createContext(defaultContextValue)

class ContextProviderComponent extends React.Component {
  constructor() {
    super()

    this.setData = this.setData.bind(this)
    this.state = {
      ...defaultContextValue,
      set: this.setData,
    };
  }

  setData(newData) {
    this.setState(state => ({
      data: {
        ...state.data,
        ...newData,
      },
    }));
  }

  render() {
    const {children} = this.props;
    return <Provider value={this.state}>{children}</Provider>;
  }
}

export {
  Consumer as ContextConsumerComponent, // Used by any pages that need to set context
  ContextProviderComponent // Used by layout only
};
