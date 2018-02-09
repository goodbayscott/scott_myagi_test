import { t } from 'i18n';
import React from 'react';
import Radium from 'radium';
import FeedbackComments from './feedback-comments';
import { SummaryStats } from './summary-stats';
import { Modal } from 'components/common/modal';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  feedbackButton: {
    border: '1px solid #999',
    borderRadius: 4,
    display: 'inline-block',
    padding: '4px 10px',
    cursor: 'pointer',
    margin: 20,
    transition: 'all .2s ease',
    ':hover': {
      transform: 'scale(1.03)'
    }
  }
};

@Radium
export class Analytics extends React.Component {
  render() {
    return (
      <div style={styles.container}>
        <SummaryStats lesson={this.props.lesson} />

        <div style={styles.feedbackButton} onClick={() => this.feedbackModal.show()}>
          {t('view_comments')}
        </div>
        <Modal ref={m => (this.feedbackModal = m)} header={t('comments')}>
          <FeedbackComments lesson={this.props.lesson} />
        </Modal>
      </div>
    );
  }
}
