import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import Style from 'style';

import { t } from 'i18n';

import QuestionPageAttemptsState from 'state/question-page-attempts';

import { LoadingContainer } from 'components/common/loading';
import containerUtils from 'utilities/containers';
import {
  getFirstQuestionPageIndex,
  getQuestionNumber
} from 'utilities/component-helpers/module-attempt-page';

import { QuestionAttemptSummary } from 'components/module-attempt/module-pages/question-set-page/attempt-summary';

const qaspStyle = {
  questionsContainer: {},
  loadingContainer: {
    ...Style.common.attemptPageContent,
    paddingBottom: 0,
    paddingTop: 5,
    marginTop: 0
  },
  header: {
    textAlign: 'center',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    marginBottom: 5,
    lineHeight: '60px',
    marginTop: 0
  }
};

export class QuestionPageAttemptSummaryContent extends React.Component {
  static propTypes = {
    pageAttempt: QuestionPageAttemptsState.Types.one.isRequired
  };

  isFirst() {
    return (
      this.props.allPageAttemptTypes[this.props.index - 1] !== this.props.pageAttempt.get('type')
    );
  }

  getFirstQuestionPageIndex() {
    return getFirstQuestionPageIndex(
      this.props.index,
      this.props.pageAttempt.get('type'),
      this.props.allPageAttemptTypes
    );
  }

  qNumber() {
    return getQuestionNumber(
      this.props.index,
      this.props.pageAttempt.get('type'),
      this.props.allPageAttemptTypes
    );
  }

  render() {
    const questionAttempt = this.props.pageAttempt.get('question_attempt');
    const isFirst = this.isFirst();
    return (
      <div>
        {isFirst && <h3 style={qaspStyle.header}>{t('questions_and_answers')}</h3>}
        <div style={qaspStyle.questionsContainer}>
          <QuestionAttemptSummary
            key={questionAttempt.id}
            questionAttempt={Im.Map(questionAttempt)}
            number={this.qNumber()}
          />
        </div>
      </div>
    );
  }
}

export class QuestionPageAttemptSummary extends React.Component {
  static propTypes = {
    pageAttempt: QuestionPageAttemptsState.Types.one
  };

  render() {
    return (
      <div style={qaspStyle.loadingContainer}>
        <LoadingContainer
          loadingProps={{ pageAttempt: this.props.pageAttempt }}
          createComponent={() => <QuestionPageAttemptSummaryContent {...this.props} />}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(QuestionPageAttemptSummary, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageAttemptId: React.PropTypes.number.isRequired
  },

  listenTo: [QuestionPageAttemptsState.Store],

  fetch: {
    pageAttempt() {
      return QuestionPageAttemptsState.Store.getItem(this.props.pageAttemptId, {
        fields: [
          'type',
          'question_attempt.answer',
          'question_attempt.question.question',
          'question_attempt.question.answer'
        ]
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, QuestionPageAttemptSummary);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, QuestionPageAttemptSummary, errors);
  }
});
