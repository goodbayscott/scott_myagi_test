import React from 'react';
import _ from 'lodash';
import Marty from 'marty';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import iFrameResize from 'iframe-resizer';

import { SecondaryButton } from 'components/common/buttons';
import { Explanation } from 'components/leaderboards/common';
import { LoadingSpinner } from 'components/common/loading';

const NO_RESULTS_IMG_SRC = 'app/assets/img/no_results.svg';

const NO_RESULTS_TXT_OVERRIDE = {
  1: 'No results. Invite your team and attempt more lessons to see data here.',
  2: 'No results. Share your content with more companies to see data here.'
};

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  fsLink: {
    marginBottom: 10
  },
  dropdown: {
    container: { float: 'left' }
  },
  buttonContainer: {
    marginBottom: 8,
    marginTop: 10,
    float: 'right'
  },
  iframe: {
    overflow: 'visible',
    height: 0,
    marginBottom: '60px'
  }
};

export default class Report extends React.Component {
  static data = {
    report: {
      fields: ['id', 'name', 'description', 'embed_url_for_current_company']
    }
  };
  constructor() {
    super();
    this.state = {
      loading: true
    };
  }
  componentDidMount() {
    this.registerIFrameOnLoad();
  }

  componentDidUpdate() {
    this.registerIFrameOnLoad();
  }

  componentWillUnmount() {
    if (this.observer) this.observer.disconnect();
  }

  registerIFrameOnLoad() {
    if (!this.iframe) return;
    this.iframe.onload = () => {
      try {
        iFrameResize.iframeResizer({}, this.iframe);
        this.setReportStyle();
        this.setState({ loading: false });
        this.setDynamicReportListener();
      } catch (e) {
        console.error(e);
      }
    };
  }

  getIFrameDocEl() {
    const doc = this.iframe.contentWindow.document || this.iframe.contentDocument;
    return doc;
  }

  setDynamicReportListener = () => {
    /*
    ** The main goal of this function is to override the "No results" text which appears
    ** on dashcards when an account is new. It's a bit complicated because we have to
    ** wait until dash cards have loaded their data, and there is no simple DOM selector
    ** for finding no results or warning text. Because of this, it is prone to breaking
    ** if Metabase templates change. Will need to keep this in mind when upgrading.
    */
    // MutationObserver not supported, so do nothing
    if (!window.MutationObserver || !this.iframe) return;
    const overrideTxt = NO_RESULTS_TXT_OVERRIDE[this.props.report.get('id')];
    if (!overrideTxt) return;
    const doc = this.getIFrameDocEl();
    const target = doc.getElementsByClassName('EmbedFrame')[0];
    // Create an observer instance
    const observer = new MutationObserver(mutations => {
      try {
        // Update no results text for cards
        const cards = doc.getElementsByClassName('DashCard');
        _.forEach(cards, dashCard => {
          // Find warning images
          const warningEl = dashCard.getElementsByClassName('Icon Icon-warning')[0];
          if (warningEl) {
            // Update text next to warning images
            const sibling = warningEl.nextSibling;
            if (sibling.innerHTML !== overrideTxt) sibling.innerHTML = overrideTxt;
            // We want to use the warning image if it exists instead of the no results image.
            // So keep an instance of warning image around if there is one.
            if (!this.warningElCopy) this.warningElCopy = warningEl;
          }
          // Make sure we have query selector support before continuing.
          if (!dashCard.querySelectorAll) return;
          // Find no results image if it exists
          const noResultImgEl = dashCard.querySelectorAll(`[src="${NO_RESULTS_IMG_SRC}"]`)[0];
          if (noResultImgEl) {
            // Update text next to no results image
            const sibling = noResultImgEl.nextSibling;
            if (sibling.innerHTML !== overrideTxt) sibling.innerHTML = overrideTxt;
            // If we previously found a warning image, use that for the sake of consistency.
            // That way all cards with no data look the same.
            if (this.warningElCopy && noResultImgEl) {
              noResultImgEl.replaceWith(this.warningElCopy.cloneNode(true));
            }
          }
        });
      } catch (e) {
        console.error(e);
      }
    });
    // Pass in the target node, as well as the observer options
    observer.observe(target, { childList: true, subtree: true });
    this.observer = observer;
  };

  setReportStyle() {
    /*
    ** When iframe first loads, this function sets some key style / DOM elements to
    ** improve the look of the dashboard.
    */
    if (!this.iframe) return;
    try {
      const doc = this.getIFrameDocEl();
      // Hide Metabase branding
      const footers = doc.getElementsByClassName('EmbedFrame-footer');
      _.each(footers, footer => (footer.style.display = 'none'));
      // Change background colour
      const dashes = doc.getElementsByClassName('Dashboard');
      _.each(dashes, dash => {
        dash.style.backgroundColor = 'transparent';
        dash.style.padding = 0;
      });
      const frames = doc.getElementsByClassName('EmbedFrame');
      _.each(frames, frame => {
        frame.style.backgroundColor = 'transparent';
        frame.style.padding = 0;
      });
      // Allow titles to run across multiple lines when screen width is small
      const body = doc.body;
      body.insertAdjacentHTML(
        'afterbegin',
        '<style>.Scalar-title { white-space: normal; }</style>'
      );
    } catch (e) {
      console.error(e);
    }
  }

  goFullscreen = () => {
    const win = window.open(this.props.report.get('embed_url_for_current_company'), '_blank');
    win.focus();
  };

  render() {
    return (
      <div>
        <Explanation>{this.props.report.get('description')}</Explanation>
        <div style={styles.buttonContainer}>
          <SecondaryButton onClick={this.goFullscreen}>View fullscreen</SecondaryButton>
        </div>
        {this.state.loading && <LoadingSpinner transparent />}
        <iframe
          src={this.props.report.get('embed_url_for_current_company')}
          frameBorder="0"
          width="100%"
          scrolling="no"
          ref={el => (this.iframe = el)}
          style={styles.iframe}
          allowTransparency
        />
      </div>
    );
  }
}
