import React from 'react'
import WebsiteConfigConsumer from '../components/layout/website-config';
import Home from '../components/home';

export default class IndexPage extends React.Component {
  renderPage({config}) {
    // Note: The Layout "wrapper" component adds header and footer etc
    return (
      <main>
        <Home config={config} />
      </main>
    );
  }

  render() {
    return (
      <WebsiteConfigConsumer>
        {({ config }) => this.renderPage({config})}
      </WebsiteConfigConsumer>
    );
  }
}
