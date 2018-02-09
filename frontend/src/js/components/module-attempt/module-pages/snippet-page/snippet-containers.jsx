import React from 'react';
import Im from 'immutable';
import Config from 'core/config';
import { isMobileWidth, isGoogleSlides, isLivestream } from 'utilities/generic';
import { EmbedlyCard } from 'components/common/cards/embedly';

const IFRAME_HEIGHT = 569;
const IFRAME_MOBILE_HEIGHT = 300;

class EmbedlyRich extends React.Component {
  /*
    This component will render video/rich content. Have tested on
    Slideshare, Prezi, Youtube, Vimeo and Livestream. Will probably work
    for other service providers too, but have not tested yet.
    More info: http://embed.ly/providers
  */

  static propTypes = {
    data: React.PropTypes.object.isRequired,
    url: React.PropTypes.string
  };

  constructor(props) {
    super(props);
    this.state = {
      height: IFRAME_HEIGHT
    };
  }

  componentWillMount() {
    if (isMobileWidth()) {
      this.setState({ height: IFRAME_MOBILE_HEIGHT });
    }
  }

  setContent() {
    const { data } = this.props;
    return { __html: data.html };
  }

  renderSnippet = () => {
    const { url } = this.props;
    if (isGoogleSlides(url)) {
      return (
        <iframe
          src={url}
          frameBorder="0"
          width="100%"
          height={this.state.height}
          allowFullScreen="true"
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
        />
      );
    } else if (isLivestream(url)) {
      return (
        <iframe className="embedly-embed" data-card-key={Config.EMBEDLY_API_TOKEN} src={url} />
      );
    }
    return <div dangerouslySetInnerHTML={this.setContent()} />;
  };

  render() {
    return <div>{this.renderSnippet()}</div>;
  }
}

export class EmbedlySnippet extends React.Component {
  static propTypes = {
    page: React.PropTypes.instanceOf(Im.Map)
  };

  getSnippetContainer = () => {
    const { page } = this.props;
    const providerUrl = page.get('snippet_url');
    const type = page.get('snippet_type');
    const data = page.get('data');
    // Some Livestream videos / Google Presentations have a type of 'link'
    if (
      type === 'rich' ||
      type === 'video' ||
      isGoogleSlides(providerUrl) ||
      isLivestream(providerUrl)
    ) {
      return <EmbedlyRich data={data} url={providerUrl} />;
    }
    return <EmbedlyCard url={providerUrl} />;
  };

  render() {
    return <div>{this.getSnippetContainer()}</div>;
  }
}

export class SnippetContainer extends React.Component {
  render() {
    return <EmbedlySnippet {...this.props} />;
  }
}
