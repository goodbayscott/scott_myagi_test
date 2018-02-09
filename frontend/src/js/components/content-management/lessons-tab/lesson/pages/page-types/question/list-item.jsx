import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import Style from 'style';

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
    backgroundColor: '#ccc',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    borderRadius: 2,
    marginRight: 10,
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    flexShrink: 0
  },
  iconContainer: {
    width: 0
  },
  icon: {
    position: 'relative',
    left: 36,
    fontSize: '60px',
    lineHeight: '60px',
    color: '#f8f8f8',
    zIndex: 10,
    margin: '0'
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 1
  },
  questionText: {},
  answerText: {
    fontWeight: 700
  }
};

@Radium
export class QuestionListItem extends React.Component {
  render() {
    const question = this.props.page.get('question');

    const questionImageStyle = question.get('image')
      ? {
        backgroundImage: `url(${question.get('image')})`,
        filter: 'brightness(80%)'
      }
      : {};

    return (
      <div style={styles.containerOuter}>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <div style={styles.iconContainer}>
            <i style={styles.icon} className="ui help circle icon" />
          </div>
          <div style={{ ...styles.image, ...questionImageStyle }} />
          <div style={styles.textSection}>
            <div style={styles.questionText}>{question.get('question')}</div>
            <div style={styles.answerText}>{question.get(`option_${question.get('answer')}`)}</div>
          </div>
        </div>
        <DeleteButton page={this.props.page} />

        <DetailsModal ref="details" page={Im.Map(this.props.page)} />
      </div>
    );
  }
}
