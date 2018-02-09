import React from 'react';
import _ from 'lodash';
import Rating from 'react-rating';
import { t } from 'i18n';
import Style from 'style';
import ModuleFeedbackSurveyResultsState from 'state/module-feedback-survey-results';
import { Box } from 'components/common/box';

const FEEDBACK_QUESTIONS = {
  like_rating: 'how_much_did_you_like_this',
  learn_rating: 'how_much_did_you_learn_from'
};

const styles = {
  container: {
    textAlign: 'center',
    boxShadow: 'none',
    border: 'none',
    marginBottom: 80,
    marginTop: 20
  },
  question: {
    fontSize: 18
  },
  star: {
    fontSize: 20,
    color: Style.vars.colors.get('primary'),
    marginBottom: 25
  },
  button: {
    color: Style.vars.colors.get('primaryFontColor'),
    background: Style.vars.colors.get('primary')
  },
  textArea: {
    height: 100,
    width: 350,
    marginBottom: 10,
    padding: 10,
    maxWidth: '100%',
    borderColor: Style.vars.colors.get('darkGrey')
  }
};

export default class FeedbackModal extends React.Component {
  static data = {
    module: {
      required: true,
      fields: ['id', 'url', 'name']
    },
    moduleAttempt: {
      required: true,
      fields: [
        'is_successful',
        'module.current_user_completion_count',
        'training_plan.name',
        'training_plan.owner.company_name'
      ]
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      // Mapping from question to rating
      ratings: {},
      comment: '',
      validation: '',
      submitted: false
    };
  }

  rateQuestion(rate, modelAttr) {
    this.state.ratings[modelAttr] = rate;
  }

  updateComment = e => {
    this.state.comment = e.target.value;
  };

  submitFeedback = () => {
    let valid = true;
    _.each(FEEDBACK_QUESTIONS, (q, key) => {
      const rating = this.state.ratings[key];
      if (!rating) {
        valid = false;
        this.setState({ validation: 'Please answer all of the questions' });
      }
    });
    if (!valid) return;
    // Submit feedback
    ModuleFeedbackSurveyResultsState.ActionCreators.create(_.merge(
      {
        user: this.props.currentUser.get('url'),
        module: this.props.module.get('url'),
        extra_comments: this.state.comment
      },
      this.state.ratings
    ));
    this.setState({ submitted: true });
  };

  show = () => {
    this.refs.modal.show();
  };

  render() {
    const questionsMap = _.map(FEEDBACK_QUESTIONS, (question, modelAttr) => (
      <div key={modelAttr}>
        <p style={styles.question}>{t(question)}</p>
        <Rating
          onChange={rating => this.rateQuestion(rating, modelAttr)}
          empty={<i style={styles.star} className="icon empty star" />}
          full={<i style={styles.star} className="icon star" />}
        />
      </div>
    ));

    return (
      <Box style={{ borderTop: '1px solid #EEEEEE', paddingTop: 25 }}>
        {!this.state.submitted ? (
          <div>
            {questionsMap}
            <textarea
              onChange={this.updateComment}
              placeholder={t('any_comments_or_feedback_find_an')}
              style={styles.textArea}
            />
            <p style={{ color: Style.vars.colors.get('errorRed') }}>{this.state.validation}</p>
            <button
              className="ui button"
              style={styles.button}
              onClick={this.submitFeedback}
              disabled={this.state.submitted}
            >
              {t('submit')}
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 20 }}>{t('thank_you_for_your_feedback')}</span>
        )}
      </Box>
    );
  }
}
