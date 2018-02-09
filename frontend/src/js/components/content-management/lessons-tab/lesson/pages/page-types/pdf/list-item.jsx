import React from 'react';
import Radium from 'radium';
import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';
import PdfPagesState from 'state/pdf-pages';

import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';

import { DetailsModal } from './details-modal';

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginRight: 10,
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    flexShrink: 0
  },
  icon: {
    fontSize: '50px',
    lineHeight: '50px',
    color: '#fff'
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 1
  },
  pdfText: {}
};

@Radium
export class PdfListItem extends React.Component {
  delete = () => {
    PdfPagesState.ActionCreators.update(this.props.page.get('id'), {
      deactivated: momentToISO(moment())
    });
  };

  render() {
    const page = this.props.page;
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <div style={styles.image}>
            <i style={styles.icon} className="ui icon file" />
          </div>
          <div style={styles.textSection}>
            <div style={styles.pdfText}>{page.get('pdf_name')}</div>
          </div>
        </div>
        <DeleteButton page={page} />

        <DetailsModal ref="details" page={page} />
      </div>
    );
  }
}
