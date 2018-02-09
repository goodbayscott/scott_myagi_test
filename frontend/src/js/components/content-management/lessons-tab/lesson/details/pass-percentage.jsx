import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import Style from 'style';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10
  },
  percentageContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: Style.vars.colors.get('blue'),
    color: '#fff',
    borderRadius: 4,
    transition: 'all 0.3s ease',
    padding: '3px 12px 3px 5px',
    ':hover': {
      backgroundColor: Style.vars.colors.get('fadedBlue')
    }
  },
  editPencil: {
    marginRight: 0,
    marginLeft: -3
  },
  input: {
    width: 42,
    fontSize: '1.4rem',
    color: 'white',
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0)',
    outline: 'none',
    textAlign: 'center',
    padding: '0px 0px 0px 2px',
    ':focus': {
      color: Style.vars.colors.get('primary')
    }
  },
  inputHover: {
    border: '1px solid #ddd'
  },
  afterText: {
    marginTop: 2
  },
  correctAnswers: {
    color: '#aaa',
    marginLeft: 10
  }
};

@Radium
export class PassPercentage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.lesson.get('pass_percentage')
    };
  }

  onChange = e => {
    const numsOnly = e.target.value.replace(/\D/g, '');
    const percentageString = numsOnly == '100' ? numsOnly : numsOnly.substring(0, 2);

    this.setState({ ...this.state, value: percentageString });
    this.props.onChange(percentageString || 0);
  };

  getQuestionsCorrectToPass(totalQuestions) {
    const passPercentage = parseInt(this.state.value || 0) / 100;
    const questionsRequired = Math.ceil(passPercentage * totalQuestions);
    return `${questionsRequired}/${totalQuestions}`;
  }

  render() {
    const totalQuestions = this.props.lesson
      .get('pages')
      .filter(p => p.get('type') == 'questionpage' && !p.get('deactivated'))
      .count();

    const hover = Radium.getState(this.state, 'percentageContainer', ':hover');

    return (
      totalQuestions > 0 && (
        <div style={styles.container}>
          <div key="percentageContainer" style={styles.percentageContainer}>
            <input
              style={styles.input}
              type="text"
              key="input"
              ref={i => (this.input = i)}
              value={this.state.value}
              onChange={this.onChange}
            />
            <div style={styles.afterText} onClick={() => this.input.focus()}>
              {hover ? <i style={styles.editPencil} className="ui icon pencil" /> : '%'}
              {` ${t('required')}`}
            </div>
          </div>
          {totalQuestions > 0 && (
            <div style={styles.correctAnswers}>
              {t('num_questions_correct_to_pass', {
                questions: this.getQuestionsCorrectToPass(totalQuestions)
              })}
            </div>
          )}
        </div>
      )
    );
  }
}
