import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import Style from 'style';

import NPSResponsesState from 'state/nps-responses';

import { PrimaryButton } from 'components/common/buttons';

import { checkStorageSupport } from 'utilities/storage';

const NPS_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const NPS_CO_BLACKLIST = [
  7164 // Life Style Sports
];

const styles = {
  npsContainer: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    left: 0,
    height: 150,
    width: '100%',
    borderTop: `5px solid ${Style.vars.colors.get('grey')}`,
    paddingTop: 30,
    paddingLeft: 100,
    paddingRight: 100,
    background: Style.vars.colors.get('white'),
    textAlign: 'center',
    zIndex: 9999,
    [Style.vars.media.get('mobile')]: {
      height: 280,
      padding: 30
    }
  },
  scoreContainer: {
    textAlign: 'center'
  },
  textLeft: {
    color: Style.vars.colors.get('darkGrey'),
    marginRight: 20,
    [Style.vars.media.get('mobile')]: {
      display: 'block',
      marginRight: 'auto',
      marginBottom: 10
    }
  },
  textRight: {
    color: Style.vars.colors.get('darkGrey'),
    marginLeft: 20,
    [Style.vars.media.get('mobile')]: {
      display: 'block',
      marginLeft: 'auto',
      marginTop: 10
    }
  },
  comments: {
    width: '100%',
    maxWidth: 400
  },
  scoreButton: {
    width: 50,
    height: 50
  },
  button: {
    [Style.vars.media.get('mobile')]: {
      display: 'block',
      marginTop: 20
    }
  },
  removeIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    [Style.vars.media.get('mobile')]: {
      right: 10,
      top: 10
    }
  }
};

@Radium
export class NPSModal extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      score: null,
      hideModal: Boolean(sessionStorage.getItem('hideNPSModal'))
    };
  }

  componentWillMount() {
    const { currentUser } = this.props;
    const learner = currentUser.get('learner');
    const coId = learner.company && learner.company.id;
    const randomNum = Math.random();
    // Only show NPS Modal 10% of the time
    if (
      NPS_CO_BLACKLIST.includes(coId) ||
      sessionStorage.getItem('hideNPSModal') === true ||
      randomNum < 0.9 ||
      learner.is_demo_account
    ) {
      this.hideModal();
    }
  }

  setScore = (score, i) => {
    this.setState({ score });
  };

  hideModal() {
    this.setState({ hideModal: true });
  }

  closeModal = () => {
    if (this.state.score) {
      this.onSubmit();
    } else {
      if (checkStorageSupport()) {
        sessionStorage.setItem('hideNPSModal', true);
      }
      this.hideModal();
    }
  };

  onSubmit = () => {
    const user = this.props.currentUser;
    const score = this.state.score;
    const comment = this.refs.comment.value;

    NPSResponsesState.ActionCreators.create({
      user: user.get('url'),
      score,
      comment: comment || '',
      no_mods_completed: user.get('learner').num_modules_completed
    });
    this.hideModal();
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    const completedNPS = learner.completed_nps;
    const modulesCompleted = learner.num_modules_completed;

    if (this.state.hideModal) {
      return null;
    }

    return (
      <div>
        {!this.state.hideModal &&
          !completedNPS &&
          learner.company &&
          modulesCompleted > 4 && (
            <div style={styles.npsContainer}>
              <h4>
                {!this.state.score ? (
                  <span>{t('nps_recommend_friend')}</span>
                ) : (
                  <span>
                    <strong>{t('nps_thankyou_why')}</strong>
                  </span>
                )}
              </h4>
              <div style={styles.removeIcon} onClick={this.closeModal}>
                <i className="ui icon remove" />
              </div>
              <div style={styles.scoreContainer}>
                {!this.state.score ? (
                  <div>
                    <span style={styles.textLeft}>{t('no_likely_at_all')}</span>
                    {NPS_SCORES.map(score => (
                      <button
                        className="circular ui icon basic button"
                        style={styles.scoreButton}
                        key={score}
                        onClick={this.setScore.bind(this, score)}
                      >
                        {score}
                      </button>
                    ))}
                    <span style={styles.textRight}>{t('extremely_likely')}</span>
                  </div>
                ) : (
                  <div>
                    <textarea
                      ref="comment"
                      style={styles.comments}
                      placeholder={t('help_us_explain_nps')}
                    />
                    <PrimaryButton onClick={this.onSubmit} style={styles.button}>
                      {t('send')}
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    );
  }
}
