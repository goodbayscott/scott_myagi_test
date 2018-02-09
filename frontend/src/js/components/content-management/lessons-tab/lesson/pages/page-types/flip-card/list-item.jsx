import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';
import moment from 'moment-timezone';
import { momentToISO } from 'utilities/time';

import VideoPagesState from 'state/video-pages';

import Im from 'immutable';
import Style from 'style';

import { Modal } from 'components/common/modal';
import DetailsModal from './details-modal';

import { IMAGE_WIDTH, IMAGE_HEIGHT, DeleteButton } from '../common';

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    alignItems: 'flex-start',
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
    backgroundColor: '#ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT
  },
  imagesContainer: {
    display: 'flex'
  },
  contentItem: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'column',
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 14,
    width: 200
  },
  iconContainer: {
    width: 0
  },
  icon: {
    fontSize: 60,
    lineHeight: '60px',
    color: '#f8f8f8'
  },
  smallIcon: {
    fontSize: 40,
    lineHeight: '40px',
    color: 'black',
    marginRight: 50,
    marginLeft: 50
  },
  contentItemText: {
    paddingLeft: 5
  },
  secondCard: {
    display: 'flex',
    alignItems: 'center'
  }
};

class FlipCardContentItem extends React.Component {
  render() {
    return (
      <div style={styles.imagesContainer}>
        {this.props.image || this.props.text ? (
          <div style={styles.contentItem}>
            {this.props.image ? (
              <div style={{ ...styles.image, backgroundImage: `url(${this.props.image})` }} />
            ) : (
              <div style={styles.image}>
                <i style={styles.icon} className="ui image icon" />
              </div>
            )}
            <span style={styles.contentItemText}>{this.props.text}</span>
          </div>
        ) : null}
      </div>
    );
  }
}

@Radium
export class FlipCardListItem extends React.Component {
  onPageClick = () => {
    this.details.show();
  };

  render() {
    const page = this.props.page;
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={this.onPageClick}>
          <FlipCardContentItem image={page.get('front_image')} text={page.get('front_text')} />
          {page.get('back_image') || page.get('back_text') ? (
            <div style={styles.secondCard}>
              <i style={{ ...styles.smallIcon }} className="ui exchange icon" />
              <FlipCardContentItem image={page.get('back_image')} text={page.get('back_text')} />
            </div>
          ) : null}
        </div>
        <DeleteButton page={this.props.page} />
        <DetailsModal ref={e => (this.details = e)} page={this.props.page} />
      </div>
    );
  }
}

@Radium
export class FlipCardMatchListItem extends React.Component {
  /*
    We are deprecating the use of this page type, but may still need to display it for users.
  */
  onPageClick = () => {
    this.notImplemented.show();
  };

  render() {
    const page = this.props.page;
    const cards = page.get('cards').toArray();
    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={this.onPageClick}>
          <FlipCardContentItem
            image={cards[0].get('front_image')}
            text={cards[0].get('front_text')}
          />
          <i style={{ ...styles.smallIcon }} className="ui random icon" />
          <FlipCardContentItem
            image={cards[1].get('back_image')}
            text={cards[1].get('back_text')}
          />
        </div>
        <DeleteButton page={this.props.page} />
        <Modal
          header="Hang tight! Editing microdecks from this screen is not yet supported."
          ref={notImplemented => (this.notImplemented = notImplemented)}
          basic
          message
        />
      </div>
    );
  }
}
