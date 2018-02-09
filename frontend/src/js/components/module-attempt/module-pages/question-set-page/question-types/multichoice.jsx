import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import _ from 'lodash';
import reactMixin from 'react-mixin';
import TimerMixin from 'react-timer-mixin';
import pluralize from 'pluralize';

import Style from 'style';

import { t } from 'i18n';

import MultichoiceQuestionAttemptsState from 'state/multichoice-question-attempts';

import {
  mapRandomizedOptions,
  randomiseOptions
} from 'utilities/component-helpers/module-attempt-page';

import { TickCircle } from 'components/common/tick-circle';

const TRANSITION_DELAY = 1000;

const rdStyle = {
  correctDimmer: {
    backgroundColor: Style.vars.colors.get('oliveGreen')
  },
  incorrectDimmer: {
    backgroundColor: Style.vars.colors.get('errorRed')
  }
};

export class ResultDimmer extends React.Component {
  static propTypes = {
    isCorrect: React.PropTypes.bool,
    show: React.PropTypes.bool.isRequired
  };

  render() {
    let dimmerStyle;
    if (this.props.show) {
      // Cannot add background styling unless show props is true, as otherwise
      // animation does not work.
      dimmerStyle = this.props.isCorrect ? rdStyle.correctDimmer : rdStyle.incorrectDimmer;
      dimmerStyle = Style.funcs.merge(dimmerStyle, this.props.style);
    }
    const icon = this.props.isCorrect ? 'checkmark' : 'remove';
    const txt = this.props.isCorrect ? t('correct') : t('incorrect');
    return (
      <div className="ui simple dimmer" style={dimmerStyle}>
        <div className="content">
          <div className="center">
            <h2 className="ui inverted icon header">
              <i className={`${icon} icon`} />
              {txt}
            </h2>
          </div>
        </div>
      </div>
    );
  }
}

const qStyle = {
  container: {
    ...Style.common.attemptPageContent,
    paddingBottom: 20
  },
  question: {
    // fontSize: '1.1em'
  },
  qExplanation: {
    marginBottom: -10,
    color: Style.vars.colors.get('darkGrey')
  },
  answerContent: {
    fontWeight: 'normal',
    lineHeight: '30px',
    float: 'left',
    margin: 0,
    marginBottom: 5
  },
  answerContainer: {
    padding: '20px',
    borderTop: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    cursor: 'pointer'
  },
  answersContainer: {
    borderBottom: `1px solid ${Style.vars.colors.get('mediumGrey')}`,
    margin: '20px 0 20px 0'
  },
  countDownTimer: {
    position: 'relative',
    marginTop: 25,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 24
  },
  questionImage: {
    maxWidth: '100%',
    height: 'auto'
  },
  questionImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
};

@reactMixin.decorate(TimerMixin)
export class MultichoiceQuestion extends React.Component {
  static propTypes = {
    question: React.PropTypes.instanceOf(Im.Map),
    pageAttempt: React.PropTypes.instanceOf(Im.Map),
    questionNumber: React.PropTypes.number.isRequired,
    onSubmit: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      selectedOption: null,
      showDimmer: false,
      submitted: false,
      timeRemaining: props.timeLimit,
      answerWasForced: false,
      randomizedOpts: null
    };
  }

  componentWillMount() {
    this.setRandomizedOpts();
  }

  componentDidMount() {
    if (this.props.isVisible) {
      this.scheduleTimerUpdate();
    }
  }

  componentDidUpdate(oldProps) {
    if (this.props.isVisible && oldProps.isVisible === false && this.state.timeRemaining) {
      this.scheduleTimerUpdate();
    }
  }

  setRandomizedOpts() {
    const options = randomiseOptions(this.getOptions());
    this.setState({ randomizedOpts: options });
  }

  updateTimer() {
    if (this.state.submitted) return;
    let timeRemaining = this.state.timeRemaining - 1;
    if (timeRemaining < 0) {
      timeRemaining = 0;
    }
    if (timeRemaining === 0) {
      // Finish question and answer incorrectly
      this.selectIncorrectAnswer();
    } else {
      this.scheduleTimerUpdate();
    }
    this.setState({ timeRemaining });
  }

  scheduleTimerUpdate() {
    if (!this.state.timeRemaining) return;
    this.setTimeout(this.updateTimer, 1000);
  }

  selectIncorrectAnswer() {
    const options = this.getOptions();
    const correctOption = this.props.question.get('answer');
    const incorrectOption = _.without(_.keys(options), correctOption)[0];
    this.setState({ selectedOption: incorrectOption, answerWasForced: true });
    this.submitAnswer();
  }

  isSelected(option) {
    if (this.state.answerWasForced) return false;
    return option === this.state.selectedOption;
  }

  selectOption = opt => {
    this.setState({ selectedOption: opt });
    _.defer(this.submitAnswer);
  };

  makeOption = (option, key, displayKey) => {
    if (!option) return null;
    const selectFunc = _.partial(this.selectOption, key);
    const isSelected = this.isSelected(key);
    return (
      <div
        key={key}
        style={qStyle.answerContainer}
        onClick={selectFunc}
        className={`option-${key}`}
      >
        <h3 onClick={selectFunc} style={qStyle.answerContent}>
          <small>{displayKey.toUpperCase()}.</small> {option}
        </h3>
        <TickCircle isSelected={isSelected} />
        <div style={Style.common.clearBoth} />
      </div>
    );
  };

  submitAnswer = () => {
    if (this.state.submitted) {
      return;
    }
    this.setState({ showDimmer: true, submitted: true });

    if (this.props.submitAnswer) {
      // TODO - This is a bit ugly...but only way to make it easy to reuse this
      // component for microdecks.
      this.props.submitAnswer(this.answerIsCorrect());
      return;
    }

    const creationData = {
      answer: this.state.selectedOption,
      question: this.props.question.get('url')
    };

    // Allows this component to be used for both QuestionSet pages
    // and Question pages.
    if (this.props.pageAttempt.get('type') === 'questionsetpageattempt') {
      creationData.page_attempt = this.props.pageAttempt.get('url');
    } else {
      creationData.question_page_attempt = this.props.pageAttempt.get('url');
    }

    MultichoiceQuestionAttemptsState.ActionCreators.create(creationData).then(res => {
      _.delay(_.partial(this.props.onSubmit, this.answerIsCorrect()), TRANSITION_DELAY);
    });
  };

  answerIsCorrect() {
    return this.props.question.get('answer') === this.state.selectedOption;
  }

  getOptions() {
    return {
      a: this.props.question.get('option_a'),
      b: this.props.question.get('option_b'),
      c: this.props.question.get('option_c'),
      d: this.props.question.get('option_d'),
      e: this.props.question.get('option_e')
    };
  }

  canSubmit() {
    if (this.state.answerWasForced) return false;
    return Boolean(this.state.selectedOption);
  }

  render() {
    const optionComponents = mapRandomizedOptions(this.state.randomizedOpts, this.makeOption);
    const submitBtnClass = cx('ui', 'basic', 'button', {
      disable: !this.state.selectedOption
    });
    const segmentClass = cx('ui', 'dimmable', { dimmed: this.state.showDimmer }, 'segment');
    return (
      <div className={segmentClass} style={qStyle.container}>
        <QuestionImage question={this.props.question} />
        {this.props.questionExplanation && (
          <p style={qStyle.qExplanation}>{this.props.questionExplanation}</p>
        )}
        <h2 style={qStyle.question}>{this.props.question.get('question')}</h2>
        <div style={qStyle.answersContainer}>{optionComponents}</div>
        <ResultDimmer isCorrect={this.answerIsCorrect()} show={this.state.showDimmer} />
      </div>
    );
  }
}

class QuestionImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false
    };
  }

  render() {
    const imageURL = this.props.question.get('image');
    if (!imageURL) return null;
    return (
      <div
        style={{
          ...qStyle.questionImageContainer,
          visibility: this.state.loaded ? 'visible' : 'hidden'
        }}
      >
        <img
          src={imageURL}
          style={{ ...qStyle.questionImage }}
          onLoad={() => this.setState({ loaded: true })}
        />
      </div>
    );
  }
}
