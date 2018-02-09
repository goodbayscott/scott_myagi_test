import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import FlipCardMatchPageAttemptsState from 'state/flip-card-match-page-attempts';

import { LoadingContainer } from 'components/common/loading';

const styles = {
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
  cardContent: {
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
  },
  cardMatchesContainer: {
    borderTop: `1px solid ${Style.vars.colors.get('mediumGrey')}`
  },
  loadingContainer: {
    ...Style.common.attemptPageContent,
    paddingBottom: 40
  }
};

export class MatchAttemptSummary extends React.Component {
  static data = {
    card: {
      fields: ['front_text']
    }
  };

  static propTypes = {
    card: React.PropTypes.instanceOf(Im.Map).isRequired,
    number: React.PropTypes.number.isRequired
  };

  render() {
    const isCorrect = this.props.correct;
    const iconContainerStyle = isCorrect
      ? Style.funcs.merge(styles.iconContainer, styles.iconCorrect)
      : Style.funcs.merge(styles.iconContainer, styles.iconIncorrect);
    const icon = isCorrect ? 'checkmark' : 'remove';
    return (
      <div style={styles.container}>
        <div style={styles.cardContent}>{this.props.card.get('front_text')}</div>
        <div style={iconContainerStyle}>
          <i className={`ui ${icon} icon`} style={styles.icon} />
        </div>
        <div style={Style.common.clearBoth} />
      </div>
    );
  }
}

export class FlipCardMatchPageAttemptSummaryContent extends React.Component {
  static data = {
    pageAttempt: {
      fields: [
        'correctly_matched.order',
        'incorrectly_matched.order',
        $y.getFields(MatchAttemptSummary, 'card', 'correctly_matched'),
        $y.getFields(MatchAttemptSummary, 'card', 'incorrectly_matched')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(FlipCardMatchPageAttemptSummaryContent, {
    // Indicates index in set of all attempt summaries for this module attempt
    index: React.PropTypes.number.isRequired
  });

  render() {
    let i = 0;

    const correctMatches = this.props.pageAttempt.get('correctly_matched').map(c => {
      i += 1;
      return <MatchAttemptSummary key={c.order} card={Im.Map(c)} number={i} correct />;
    });

    const incorrectMatches = this.props.pageAttempt.get('incorrectly_matched').map(c => {
      i += 1;
      return <MatchAttemptSummary key={c.order} card={Im.Map(c)} number={i} correct={false} />;
    });

    let allMatches = correctMatches.concat(incorrectMatches);
    allMatches = _.sortBy(allMatches, c => c.key);

    return (
      <div>
        {/* <h3 style={{textAlign: 'center'}}>{'Section ' + (this.props.index + 1) + ' Results'}</h3> */}
        <h3 style={{ textAlign: 'center' }}>Section Match Results</h3>
        <div style={styles.cardMatchesContainer}>{allMatches}</div>
      </div>
    );
  }
}

export class FlipCardMatchPageAttemptSummary extends React.Component {
  static data = {
    pageAttempt: $y.getData(FlipCardMatchPageAttemptSummaryContent, 'pageAttempt', {
      required: false
    })
  };

  render() {
    return (
      <div className="ui segment" style={styles.loadingContainer}>
        <LoadingContainer
          loadingProps={{ pageAttempt: this.props.pageAttempt }}
          createComponent={() => <FlipCardMatchPageAttemptSummaryContent {...this.props} />}
        />
      </div>
    );
  }
}

export const Page = Marty.createContainer(FlipCardMatchPageAttemptSummary, {
  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    pageAttemptId: React.PropTypes.number.isRequired
  },

  listenTo: [FlipCardMatchPageAttemptsState.Store],

  fetch: {
    pageAttempt() {
      return FlipCardMatchPageAttemptsState.Store.getItem(this.props.pageAttemptId, {
        fields: $y.getFields(FlipCardMatchPageAttemptSummary, 'pageAttempt')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, FlipCardMatchPageAttemptSummary);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, FlipCardMatchPageAttemptSummary, errors);
  }
});
