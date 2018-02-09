import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import Style from 'style';

import { t } from 'i18n';

import QuestionSetPagesState from 'state/question-set-pages';
import QuestionSetPageAttemptsState from 'state/question-set-page-attempts';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';

import { LoadingContainer } from 'components/common/loading';
import { ViewSequence, View } from 'components/common/view-sequence/index';
import { MultichoiceQuestion } from './question-types/multichoice';
import { ShortAnswerQuestion } from './question-types/short-answer';

const QUESTION_TYPES_TO_COMPONENTS = {
  multichoicequestion: MultichoiceQuestion,
  shortanswerquestion: ShortAnswerQuestion
};

const sbStyle = {
  container: {
    height: '3em',
    width: '100%',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    marginTop: 10
  },
  txt: {
    // color: 'white',
    margin: 0,
    fontSize: '16px'
  }
};

export class StatusBar extends React.Component {
  static propTypes = {
    questionNumber: React.PropTypes.number.isRequired,
    numCorrect: React.PropTypes.number.isRequired,
    numQuestions: React.PropTypes.number.isRequired
  };

  render() {
    return (
      <div style={sbStyle.container}>
        <p style={Style.funcs.merge(sbStyle.txt, { float: 'left' })}>
          {t('question_number_of_total', {
            number: this.props.questionNumber.toString(),
            total: this.props.numQuestions.toString()
          })}
        </p>
        <p style={Style.funcs.merge(sbStyle.txt, { float: 'right' })}>
          {t('numbertotal_correct', {
            number: this.props.numCorrect.toString(),
            total: this.props.numQuestions.toString()
          })}
        </p>
      </div>
    );
  }
}

export class QuestionSetPageContent extends React.Component {
  static propTypes = {
    page: QuestionSetPagesState.Types.one.isRequired,
    pageAttempt: QuestionSetPageAttemptsState.Types.one.isRequired,
    onComplete: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      curQuestionNumber: 1,
      numCorrect: 0
    };
  }

  getQuestionComponentForQuestion = (question, i) => {
    let questionComponent = QUESTION_TYPES_TO_COMPONENTS[question.type];
    if (!questionComponent) {
      throw new Error(`Could not find question component for question type ${question.url}`);
    }
    questionComponent = React.createFactory(questionComponent);
    const questionNumber = i + 1;
    const pageProps = {
      question: Im.Map(question),
      currentUser: this.props.currentUser,
      pageAttempt: this.props.pageAttempt,
      questionNumber,
      onSubmit: this.onQuestionSubmit,
      timeLimit: this.props.page.get('per_question_time_limit'),
      isVisible: this.state.curQuestionNumber === questionNumber
    };
    return <View key={question.id}>{questionComponent(pageProps)}</View>;
  };

  onQuestionSubmit = wasCorrect => {
    const newQuestionNumber = this.state.curQuestionNumber + 1;
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    if (newQuestionNumber > this.props.page.get('question_set').questions.length) {
      this.onComplete();
      return;
    }
    let newNumCorrect = this.state.numCorrect;
    if (wasCorrect) newNumCorrect += 1;
    this.setState({
      curQuestionNumber: newQuestionNumber,
      numCorrect: newNumCorrect
    });
    if (this.refs.viewSequence) this.refs.viewSequence.goForward();
  };

  onComplete = () => {
    this.props.onComplete();
  };

  render() {
    const questions = this.props.page
      .get('question_set')
      .questions.map(this.getQuestionComponentForQuestion);
    return (
      <div>
        <StatusBar
          numQuestions={this.props.page.get('question_set').questions.length}
          questionNumber={this.state.curQuestionNumber}
          numCorrect={this.state.numCorrect}
        />
        <ViewSequence ref="viewSequence">{questions}</ViewSequence>
      </div>
    );
  }
}

export class QuestionSetPage extends React.Component {
  static propTypes = {
    page: QuestionSetPagesState.Types.one,
    pageAttempt: QuestionSetPageAttemptsState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired
  };

  componentDidMount() {
    // Set a temporary max progress
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.page) {
      if (this.registered) return;
      this.registered = true;
      // Update max progress once page have been fetched
      ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(
        this.props.pageId,
        newProps.page.get('question_set').questions.length
      );
    }
  }

  render() {
    return (
      <LoadingContainer
        loadingProps={{ page: this.props.page, pageAttempt: this.props.pageAttempt }}
        createComponent={() => (
          <QuestionSetPageContent {...this.props} onComplete={this.props.goToNextPage} />
        )}
      />
    );
  }
}

export const Page = Marty.createContainer(QuestionSetPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    moduleAttempt: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [QuestionSetPagesState.Store],

  componentWillMount() {
    // Generate a new page attempt entity to pass down
    const pageURL = QuestionSetPagesState.Store.getURLForItemWithID(this.props.pageId);
    QuestionSetPageAttemptsState.ActionCreators.create({
      page: pageURL,
      module_attempt: this.props.moduleAttempt.get('url')
    }).then(res => {
      this.setState({ pageAttempt: Im.Map(res.body) });
    });
  },

  fetch: {
    page() {
      return QuestionSetPagesState.Store.getItem(this.props.pageId, {
        fields: ['*', 'question_set.*', 'question_set.questions.*']
      });
    }
  },

  done(results) {
    return (
      <QuestionSetPage
        ref="innerComponent"
        {...this.props}
        {...results}
        pageAttempt={this.state.pageAttempt}
      />
    );
  },

  pending() {
    return containerUtils.defaultPending(this, QuestionSetPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, QuestionSetPage, errors);
  }
});
