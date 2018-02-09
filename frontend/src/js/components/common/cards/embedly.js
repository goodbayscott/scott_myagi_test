import React from 'react';
import url from 'url';

import Config from 'core/config';

export class EmbedlyCard extends React.Component {
  /*
    This component will render link type content. Have tested on
    Wikipedia, Medium and Business Insider. Will probably work
    for other news article providers too, but have not tested yet.
    More info: http://embed.ly/providers
  */

  static propTypes = {
    url: React.PropTypes.string.isRequired
  };

  render() {
    return (
      <a
        href={this.props.url}
        className="embedly-card"
        data-card-key={Config.EMBEDLY_API_TOKEN}
        data-card-controls="0"
        data-card-recommend="0"
      />
    );
  }
}
