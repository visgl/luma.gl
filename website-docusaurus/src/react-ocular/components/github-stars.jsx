import React, {Component, Fragment} from 'react';
import StarIcon from 'react-icons/lib/go/star';

// GitHub api has rate-limits. We want to cache the response
// as much as we can. This component gets re-mounted multiple times.
let cachedResponse = null;

export default class GithubStars extends Component {
  constructor(props) {
    super(props);
    this.state = {
      response: cachedResponse
    };
  }

  componentDidMount() {
    if (cachedResponse) {
      return;
    }

    const {project} = this.props;
    fetch(`https://api.github.com/repos/${project}`)
      .then((response) => response.json())
      .then((response) => {
        cachedResponse = response;
        this.setState({response});
      });
  }

  render() {
    const {response} = this.state;
    const count = (response && response.stargazers_count) || '...';
    return (
      <Fragment>
        {count}
        <StarIcon style={{marginLeft: '0.2rem', position: 'relative', top: -1}} />
      </Fragment>
    );
  }
}
