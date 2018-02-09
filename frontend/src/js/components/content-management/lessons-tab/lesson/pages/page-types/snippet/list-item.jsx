import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';
import Im from 'immutable';
import SnippetPagesState from 'state/snippet-pages';
import { isGoogleSlides } from 'utilities/generic';
import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';
import { DetailsModal } from './details-modal';

const GSLIDES_LOGO = require('img/gslides.png');

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  image: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#eee',
    marginRight: 10,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    flexShrink: 0
  },
  questionMark: {
    fontSize: '60px',
    lineHeight: '55px'
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 1
  },
  pdfText: {}
};

@Radium
export class SnippetListItem extends React.Component {
  delete = () => {
    SnippetPagesState.ActionCreators.update(this.props.page.get('id'), {
      deactivated: momentToISO(moment())
    });
  };

  render() {
    const { page } = this.props;
    // Optimistic update needs default data
    const data =
      page.get('data') ||
      Im.Map({
        thumbnail_url: '',
        title: this.props.page.get('snippet_url'),
        provider_url: ''
      });
    const url = page.get('snippet_url');
    const thumbnail = isGoogleSlides(url) ? GSLIDES_LOGO : data.get('thumbnail_url');
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <div style={{ ...styles.image, backgroundImage: `url(${thumbnail})` }} />
          <div style={styles.textSection}>
            <div style={styles.pdfText}>{data.get('title')}</div>
            <div style={styles.pdfText}>{data.get('provider_url')}</div>
          </div>
        </div>
        <DeleteButton delete={this.delete} page={this.props.page} />
        <DetailsModal ref="details" page={Im.Map(this.props.page)} />
      </div>
    );
  }
}
