// Using React context to share common query data with all pages.
// Per recommendations in
// https://www.gatsbyjs.org/packages/gatsby-plugin-layout/


// Context.js
import React from 'react';

const defaultContextValue = {
  initialized: false,
  config: {},
  tableOfContents: null,

  // For passing data upwards
  data: {},
  set: () => {},
}

const { Provider, Consumer } = React.createContext(defaultContextValue)

export class WebsiteConfigProvider extends React.Component {
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

export default Consumer;
