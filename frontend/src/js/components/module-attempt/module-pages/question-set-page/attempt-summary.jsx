import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import { t } from 'i18n';

import QuestionSetPageAttemptsState from 'state/question-set-page-attempts';

import containerUtils from 'utilities/containers';
import { LoadingContainer } from 'components/common/loading';

const qaStyle = {
  container: {
    padding: '20px',
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  number: {
    float: 'left',
    fontSize: '1.5em',
    fontWeight: 'bold',
    marginBottom: 5
  },
  question: {
    float: 'left',
    fontSize: '1.2em',
    marginTop: '0.2em',
    marginLeft: '1em',
    marginBottom: 5
  },
  iconContainer: {
    width: '30px',
    height: '30px',
    borderRadius: '15px',
    float: 'right',
    color: 'white',
    fontSize: '1.4em',
    marginLeft: '1em'
  },
  iconCorrect: {
    backgroundColor: Style.vars.colors.get('green')
  },
  iconIncorrect: {
    backgroundColor: Style.vars.colors.get('red')
  },
  icon: {
    marginLeft: '4px',
    marginTop: '5px'
  }
};

export class QuestionAttemptSummary extends React.Component {
  static propTypes = {
    questionAttempt: React.PropTypes.instanceOf(Im.Map).isRequired,
    number: React.PropTypes.number.isRequired
  };

  isCorrect() {
    return (
      this.props.questionAttempt.get('answer') === this.props.questionAttempt.get('question').answer
    );
  }

  render() {
    const isCorrect = this.isCorrect();
    const iconContainerStyle = isCorrect
      ? Style.funcs.merge(qaStyle.iconContainer, qaStyle.iconCorrect)
      : Style.funcs.merge(qaStyle.iconContainer, qaStyle.iconIncorrect);
    const icon = isCorrect ? 'checkmark' : 'remove';
    return (
      <div style={qaStyle.container}>
        <div style={qaStyle.number}>
          {t('q')}
          {this.props.number}
        </div>
        <div style={qaStyle.question}>{this.props.questionAttempt.get('question').question}</div>
        <div style={iconContainerStyle}>
          <i className={`ui ${icon} icon`} style={qaStyle.icon} />
        </div>
        <div style={Style.common.clearBoth} />
      </div>
    );
  }
}

const qaspStyle = {
  questionsContainer: {
    borderTop: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  loadingContainer: {
    ...Style.common.attemptPageContent,
    paddingBottom: 40
  }
};

export class QuestionSetPageAttemptSummaryContent extends React.Component {
  static propTypes = {
    pageAttempt: QuestionSetPageAttemptsState.Types.one.isRequired
  };

  render() {
    // Sort by question order
    let attempts = this.props.pageAttempt.get('question_attempts');
    attempts = _.sortBy(attempts, attempt => attempt.question.order);

    let i = 0;
    const questionAttempts = attempts.map(questionAttempt => {
      i += 1;
      return (
        <QuestionAttemptSummary
          key={questionAttempt.id}
          questionAttempt={Im.Map(questionAttempt)}
          number={i}
        />
      );
    });

    return (
      <div>
        <h3 style={{ textAlign: 'center' }}>{t('questions_and_answers')}</h3>
        <div style={qaspStyle.questionsContainer}>{questionAttempts}</div>
      </div>
    );
  }
}

export class QuestionSetPageAttemptSummary extends React.Component {
  static propTypes = {
    pageAttempt: QuestionSetPageAttemptsState.Types.one
  };

  render() {
    return (
      <div className="ui segment" style={qaspStyle.loadingContainer}>
        <LoadingContainer
          loadingProps={{ pageAttempt: this.props.pageAttempt }}
          createComponent={() => <QuestionSetPageAttemptSummaryContent {...this.props} />}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(QuestionSetPageAttemptSummary, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageAttemptId: React.PropTypes.number.isRequired
  },

  listenTo: [QuestionSetPageAttemptsState.Store],

  fetch: {
    pageAttempt() {
      return QuestionSetPageAttemptsState.Store.getItem(this.props.pageAttemptId, {
        fields: ['*', 'question_attempts.*', 'question_attempts.question.*']
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, QuestionSetPageAttemptSummary);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, QuestionSetPageAttemptSummary, errors);
  }
});
