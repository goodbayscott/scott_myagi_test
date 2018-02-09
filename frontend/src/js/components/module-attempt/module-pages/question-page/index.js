import Marty from 'marty';
import React from 'react';
import Im from 'immutable';

import Style from 'style';

import { t } from 'i18n';

import QuestionPagesState from 'state/question-pages';
import QuestionPageAttemptsState from 'state/question-page-attempts';
import ModuleAttemptPageState from '../../state';

import containerUtils from 'utilities/containers';
import {
  getFirstQuestionPageIndex,
  getNumQuestions,
  getQuestionNumber
} from 'utilities/component-helpers/module-attempt-page';
import { LoadingContainer } from 'components/common/loading';
import { View } from 'components/common/view-sequence/index';
import { MultichoiceQuestion } from 'components/module-attempt/module-pages/question-set-page/question-types/multichoice';
import { ShortAnswerQuestion } from 'components/module-attempt/module-pages/question-set-page/question-types/short-answer';

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

export class QuestionPageContent extends React.Component {
  static propTypes = {
    page: QuestionPagesState.Types.one.isRequired,
    pageAttempt: QuestionPageAttemptsState.Types.one.isRequired,
    onComplete: React.PropTypes.func.isRequired
  };

  getQuestionComponentForQuestion = question => {
    let questionComponent = QUESTION_TYPES_TO_COMPONENTS[question.type];
    if (!questionComponent) {
      throw new Error(`Could not find question component for question type ${question.url}`);
    }
    questionComponent = React.createFactory(questionComponent);
    const pageProps = {
      question: Im.Map(question),
      currentUser: this.props.currentUser,
      pageAttempt: this.props.pageAttempt,
      onSubmit: this.onQuestionSubmit,
      isVisible: true,
      questionNumber: this.getQuestionNumber()
    };
    return <View key={question.id}>{questionComponent(pageProps)}</View>;
  };

  onQuestionSubmit = wasCorrect => {
    if (wasCorrect) ModuleAttemptPageState.ActionCreators.incrementCurrentScore();
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    this.props.onComplete();
  };

  getFirstQuestionPageIndex() {
    return getFirstQuestionPageIndex(
      this.props.pageIndex,
      this.props.page.get('type'),
      this.props.allPageTypes
    );
  }

  getNumQuestions() {
    return getNumQuestions(
      this.props.pageIndex,
      this.props.page.get('type'),
      this.props.allPageTypes
    );
  }

  getQuestionNumber() {
    return getQuestionNumber(
      this.props.pageIndex,
      this.props.page.get('type'),
      this.props.allPageTypes
    );
  }

  render() {
    return (
      <div>
        <StatusBar
          // TODO - Base these on surrounding pages!
          numQuestions={this.getNumQuestions()}
          questionNumber={this.getQuestionNumber()}
          numCorrect={ModuleAttemptPageState.Store.getCurrentScore()}
        />
        {this.getQuestionComponentForQuestion(this.props.page.get('question'))}
      </div>
    );
  }
}

export class QuestionPage extends React.Component {
  static propTypes = {
    page: QuestionPagesState.Types.one,
    pageAttempt: QuestionPageAttemptsState.Types.one,
    goToNextPage: React.PropTypes.func.isRequired
  };

  componentWillUpdate(newProps) {
    // This is the first question page in a sequence, so reset "current score"
    // value.
    if (
      newProps.isCurView &&
      newProps.allPageTypes[newProps.pageIndex] !== newProps.allPageTypes[newProps.pageIndex - 1]
    ) {
      if (this.hasReset) return;
      this.hasReset = true;
      ModuleAttemptPageState.ActionCreators.resetCurrentScore();
    }
  }

  componentDidMount() {
    // Set max progress
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  }

  render() {
    return (
      <LoadingContainer
        loadingProps={{ page: this.props.page, pageAttempt: this.props.pageAttempt }}
        createComponent={() => (
          <QuestionPageContent {...this.props} onComplete={this.props.goToNextPage} />
        )}
      />
    );
  }
}

export const Page = Marty.createContainer(QuestionPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    moduleAttempt: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  },

  listenTo: [QuestionPagesState.Store],

  componentWillMount() {
    // Generate a new page attempt entity to pass down
    const pageURL = QuestionPagesState.Store.getURLForItemWithID(this.props.pageId);
    QuestionPageAttemptsState.ActionCreators.create({
      page: pageURL,
      module_attempt: this.props.moduleAttempt.get('url')
    }).then(res => {
      this.setState({ pageAttempt: Im.Map(res.body) });
    });
  },

  fetch: {
    page() {
      return QuestionPagesState.Store.getItem(this.props.pageId, {
        fields: ['*', 'question.*']
      });
    }
  },

  done(results) {
    return (
      <QuestionPage
        ref="innerComponent"
        {...this.props}
        {...results}
        pageAttempt={this.state.pageAttempt}
      />
    );
  },

  pending() {
    return containerUtils.defaultPending(this, QuestionPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, QuestionPage, errors);
  }
});
