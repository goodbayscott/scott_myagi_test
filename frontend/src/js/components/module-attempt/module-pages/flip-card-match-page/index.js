/*
  The FlipCardMatchPage component contains a series of questions where
  the user is required to match the front of a card with the correct back
  card text (or vice versa). This makes up the assessment portion of
  microdeck modules.
*/
import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';
import Radium from 'radium';

import Style from 'style';
import { t } from 'i18n';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import FlipCardMatchPagesState from 'state/flip-card-match-pages';
import FlipCardMatchPageAttemptsState from 'state/flip-card-match-page-attempts';
import ModuleAttemptPageState from '../../state';

import { LoadingContainer } from 'components/common/loading';
import { SecondaryButton } from 'components/common/buttons';
import { ViewSequence, View } from 'components/common/view-sequence';
import { Hoverable } from 'components/common/hover';
import { ResultDimmer } from 'components/module-attempt/module-pages/question-set-page/question-types/multichoice';
import { FlipCard, styles as flipCardPageStyles } from '../flip-card-page';

const TRANSITION_DELAY = 800;

const styles = {
  pageContainer: Style.funcs.merge(flipCardPageStyles.pageContainer, {
    paddingBottom: 10
  }),
  statusHeader: flipCardPageStyles.statusHeader,
  optContainer: Style.funcs.merge(
    {
      fontSize: 16,
      textAlign: 'center',
      padding: 10,
      margin: 10,
      cursor: 'pointer',
      border: `1px solid ${Style.vars.colors.get('xDarkGrey')}`,
      backgroundColor: 'white'
    },
    Style.funcs.makeTransitionAll()
  ),
  optContainerHover: {
    backgroundColor: Style.vars.colors.get('mediumGrey')
  },
  dimmer: {
    width: '100%',
    height: 'calc(100% + 20px)',
    zIndex: 999
  }
};

@Radium
class CardMatchQuestion extends React.Component {
  static data = {
    card: {
      fields: ['id', 'front_text', 'front_image', 'back_text', 'back_image']
    },
    otherCards: {
      many: true,
      fields: ['id', 'front_text', 'front_image', 'back_text', 'back_image']
    }
  };

  static propTypes = $y.propTypesFromData(CardMatchQuestion, {
    frontQuestion: React.PropTypes.bool.isRequired
  });

  constructor() {
    super();
    this.state = {
      correct: null
    };
  }

  onOptClick = opt => {
    const { card, frontQuestion } = this.props;
    if (this.state.correct !== null) return;
    const answer = frontQuestion ? card.get('back_text') : card.get('front_text');
    const correct = opt === answer;
    this.setState({ correct });
    _.delay(() => this.props.submitAnswer(this.props.card, correct), TRANSITION_DELAY);
  };

  render() {
    const { card, otherCards, frontQuestion } = this.props;
    const flipped = !frontQuestion;
    const opts = otherCards
      .map(c => (frontQuestion ? c.get('back_text') : c.get('front_text')))
      .toJS();
    const answer = frontQuestion ? card.get('back_text') : card.get('card.front_text');
    const showDimmer = this.state.correct !== null;
    return (
      <div>
        <ResultDimmer show={showDimmer} isCorrect={this.state.correct} style={styles.dimmer} />
        <FlipCard key={card.get('id')} flipped={flipped} page={card} />
        {opts.map(opt => (
          <Hoverable
            key={opt}
            style={styles.optContainer}
            hoverStyle={styles.optContainerHover}
            onClick={() => this.onOptClick(opt)}
          >
            {opt}
          </Hoverable>
        ))}
      </div>
    );
  }
}

@Radium
class PageContent extends React.Component {
  static data = {
    page: {
      fields: [
        'url',
        'cards.url',
        $y.getFields(CardMatchQuestion, 'card', 'cards'),
        $y.getFields(CardMatchQuestion, 'otherCards', 'cards')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(PageContent, {
    moduleAttempt: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired
  });

  constructor(props) {
    super(props);
    const questionSettings = [];
    const shuffled = _.shuffle(props.page.get('cards'));
    _.each(shuffled, c => {
      // Second value determines whether we want to assess them on front or
      // back of the card.
      // Third value will be the order of other cards passed in (randomizes
      // card options).
      questionSettings.push([c, Math.random() >= 0.5, _.shuffle(shuffled)]);
    });
    this.state = {
      correctlyMatched: [],
      questionSettings
    };
  }

  submitAnswer = (card, correct) => {
    if (correct) {
      // Update state immediately because it is used
      // to create page attempt
      this.state.correctlyMatched.push(card);
      this.setState({ correctlyMatched: this.state.correctlyMatched });
    }
    ModuleAttemptPageState.ActionCreators.incrementProgress();
    if (this.refs.viewSeq.canGoForward()) {
      this.refs.viewSeq.goForward();
    } else {
      const correctlyMatchedURLs = this.state.correctlyMatched.map(c => c.get('url'));
      const cardURLs = this.props.page.get('cards').map(c => c.url);
      const incorrectlyMatchedURLs = _.filter(
        cardURLs,
        url => !_.includes(correctlyMatchedURLs, url)
      );
      FlipCardMatchPageAttemptsState.ActionCreators.create({
        page: this.props.page.get('url'),
        module_attempt: this.props.moduleAttempt.get('url'),
        correctly_matched: correctlyMatchedURLs,
        incorrectly_matched: incorrectlyMatchedURLs
      }).then(() => {
        this.props.goToNextPage();
      });
    }
  };

  renderMatchQuestion(card, frontQuestion, cards) {
    return (
      <View key={card.id}>
        <CardMatchQuestion
          card={Im.Map(card)}
          otherCards={Im.fromJS(cards)}
          frontQuestion={frontQuestion}
          submitAnswer={this.submitAnswer}
        />
      </View>
    );
  }

  render() {
    const { questionSettings } = this.state;
    return (
      <div>
        <div style={styles.statusHeader}>Try to match this side with the correct option below</div>
        <div className="ui segment" style={styles.pageContainer}>
          <ViewSequence ref="viewSeq" renderWhenActive>
            {_.map(questionSettings, ([card, frontQuestion, otherCards]) =>
              this.renderMatchQuestion(card, frontQuestion, otherCards))}
          </ViewSequence>
        </div>
      </div>
    );
  }
}

@Radium
export class FlipCardMatchPage extends React.Component {
  static data = {
    page: $y.getData(PageContent, 'page', { required: false })
  };

  static propTypes = {
    page: FlipCardMatchPagesState.Types.one,
    moduleAttempt: React.PropTypes.instanceOf(Im.Map).isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    isCurView: React.PropTypes.bool.isRequired
  };

  componentDidMount() {
    // Set a temporary max progress
    ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(this.props.pageId, 1);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.page) {
      if (this.registered) return;
      this.registered = true;
      // Update max pages once page have been fetched
      ModuleAttemptPageState.ActionCreators.registerPageMaxProgress(
        this.props.pageId,
        newProps.page.get('cards').length
      );
    }
  }

  render() {
    // Do not render anything unless this is the current view.
    // This prevents random flip card animation from happening
    // when this view does become active.
    if (!this.props.isCurView) return null;
    return (
      <LoadingContainer
        loadingProps={{ page: this.props.page }}
        createComponent={() => <PageContent {...this.props} />}
      />
    );
  }
}

export const Page = Marty.createContainer(FlipCardMatchPage, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageId: React.PropTypes.number.isRequired,
    goToNextPage: React.PropTypes.func.isRequired,
    isCurView: React.PropTypes.bool.isRequired
  },

  listenTo: [FlipCardMatchPagesState.Store],

  fetch: {
    page() {
      this.pageFetch = FlipCardMatchPagesState.Store.getItem(this.props.pageId, {
        fields: $y.getFields(FlipCardMatchPage, 'page')
      });
      return this.pageFetch;
    }
  },

  pending() {
    return containerUtils.defaultPending(this, FlipCardMatchPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, FlipCardMatchPage, errors);
  }
});
