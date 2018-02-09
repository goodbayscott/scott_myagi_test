import React from 'react';

export default class Pdf extends React.Component {
  /*
    Very simple component which displays the supplied
    `url` prop as a PDF using the browser's default
    PDF display method. In future, this could use
    something like https://github.com/mozilla/pdf.js/
    to displays the PDF.
  */

  static propTypes = {
    url: React.PropTypes.string.isRequired,
    height: React.PropTypes.number
  };

  static defaultProps = {
    height: 500
  };

  render() {
    // use embedded google document viewer as pdf source. this provides
    // a better experience for mobile.
    const pdfURL = `https://docs.google.com/viewer?url=${this.props.url}&embedded=true`;
    return (
      <iframe
        width="100%"
        height={this.props.height}
        modestbranding="1"
        frameBorder="0"
        frameBorder="0"
        allowFullScreen
        allowFullScreen
        webkitallowfullscreen
        mozallowfullscreen
        src={pdfURL}
      />
    );
  }
}
