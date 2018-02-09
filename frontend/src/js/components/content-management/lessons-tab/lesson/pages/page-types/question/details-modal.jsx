import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import _ from 'lodash';
import Radium from 'radium';

import ModuleCreationState from 'state/module-creation';

import Style from 'style';

import {
  Form,
  TextInput,
  TextArea,
  FieldHeader,
  SubmitButton,
  ImageCropper
} from 'components/common/form';

import { Modal } from 'components/common/modal';

const OPTIONS = ['a', 'b', 'c', 'd', 'e'];

const INIT_NUM_OPTIONS = 2;

const styles = {
  container: {},
  questionTextArea: {
    width: '100%',
    height: 80,
    marginBottom: 20
  },
  questionImageField: {
    minHeight: 180
  },
  questionImageContainer: {
    marginBottom: 20
  },
  answerInput: {},
  answerInputContainer: {
    position: 'relative'
  },
  removeIcon: {
    cursor: 'pointer',
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 14,
    position: 'absolute',
    top: 8,
    right: 0
  }
};

@Radium
class AnswerInputs extends React.Component {
  static defaultProps = {
    question: Im.Map()
  };

  constructor(props) {
    super();
    let initOptions;
    if (props.question.count()) {
      initOptions = OPTIONS.filter(opt => Boolean(props.question.get(`option_${opt}`)));
    } else {
      initOptions = OPTIONS.slice(0, INIT_NUM_OPTIONS);
    }
    this.state = {
      correctAnswer: props.question.get('answer') || 'a',
      inputs: [],
      options: initOptions
    };
  }

  getInputs = () => _.values(this.refs);

  getNameAndValue = () => {
    let data = _.merge(...this.getInputs().map(input => input.getNameAndValue()));
    // Merging with 'blanks' object will ensure that answer will be removed if
    // it was deleted by the user.
    const blanks = {};
    _.each(OPTIONS, opt => (blanks[`option_${opt}`] = ''));
    data = _.merge(blanks, data);
    data.answer = this.state.correctAnswer;
    return data;
  };

  isValid = () => _.all(this.getInputs(), child => child.isValid());

  addInput = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    // Add first option which is not already in `this.state.options`
    const newOpt = _.find(OPTIONS, v => !_.includes(this.state.options, v));
    this.state.options.push(newOpt);
    this.setState({ options: this.state.options });
    this.props.onChange();
  };

  removeInput = letter => {
    this.state.options = this.state.options.filter(opt => opt != letter);
    this.setState({ options: this.state.options });
    this.props.onChange();
  };

  renderAnswerInput(letter, showRemove) {
    return (
      <div style={styles.answerInputContainer} key={letter}>
        <TextInput
          key={letter}
          style={styles.answerInput}
          onChange={this.props.onChange}
          ref={`input_${letter}`}
          name={`option_${letter}`}
          initialValue={this.props.question.get(`option_${letter}`)}
          initialIsAcceptable
          required
        />
        {showRemove && (
          <i
            className="ui remove icon"
            style={styles.removeIcon}
            onClick={() => this.removeInput(letter)}
          />
        )}
      </div>
    );
  }

  renderAlternateAnswers() {
    const otherOpts = this.state.options.filter(opt => opt !== this.state.correctAnswer);
    return _.map(otherOpts, (opt, i) =>
      this.renderAnswerInput(
        opt,
        i === otherOpts.length - 1 && otherOpts.length >= INIT_NUM_OPTIONS
      ));
  }

  renderCorrectAnswer() {
    const correctLetter = this.state.correctAnswer;
    return this.renderAnswerInput(correctLetter);
  }

  render() {
    let addButton;
    if (this.state.options.length < OPTIONS.length) {
      addButton = (
        <button className="ui fluid basic button" onClick={this.addInput}>
          <i className="plus icon" />
          {` ${t('add_another_answer')}`}
        </button>
      );
    }
    return (
      <div>
        <FieldHeader required>{t('correct_answer')}</FieldHeader>
        {this.renderCorrectAnswer()}
        <FieldHeader required>
          {`${t('alternate_answers')} (${t('order_will_be_randomized')})`}
        </FieldHeader>
        {this.renderAlternateAnswers()}
        {addButton}
      </div>
    );
  }
}

@Radium
export class DetailsModal extends React.Component {
  static propTypes = {
    question: React.PropTypes.instanceOf(Im.Map)
  };

  static defaultProps = {
    question: Im.Map()
  };

  constructor() {
    super();
    this.state = {
      showImageSelect: false
    };
  }

  onSubmitAndValid = data => {
    this.refs.modal.hide();

    if (this.image && this.image.getValue()) {
      data.image = this.image.getValue();
    }
    if (this.image && this.image.state.cancelled) {
      data.image = null;
    }

    if (this.props.page.get('id')) {
      ModuleCreationState.ActionCreators.updatePage(this.props.page.get('id'), {
        question: {
          ...data,
          id: this.props.page.get('question').get('id')
        }
      });
    } else {
      ModuleCreationState.ActionCreators.createQuestionPageWithQuestion(data);
    }
    if (this.props.onSave) this.props.onSave();
  };

  show() {
    this.refs.modal.show();
  }

  render() {
    const questionData = this.props.page.get('question');
    const questionImageField = (
      <div style={styles.questionImageContainer}>
        {this.state.showImageSelect || questionData.get('image') ? (
          <div style={styles.questionImageField}>
            <FieldHeader>{t('image')}</FieldHeader>
            <ImageCropper
              ref={i => (this.image = i)}
              name="image"
              ref="image"
              height={180}
              width={180 * 16 / 9}
              initialValue={questionData.get('image')}
            />
          </div>
        ) : (
          <button
            className="ui fluid basic button"
            onClick={() => this.setState({ showImageSelect: true })}
          >
            <i className="photo icon" />
            {` ${t('add_an_image')} (${t('optional')})`}
          </button>
        )}
      </div>
    );
    return (
      <Modal ref="modal" header="Question">
        <div style={styles.container}>
          <Form onSubmitAndValid={this.onSubmitAndValid} ref="form">
            <FieldHeader required>{t('question')}</FieldHeader>
            <TextArea
              name="question"
              style={styles.questionTextArea}
              initialValue={questionData.get('question')}
              initialIsAcceptable
              ref="questionInput"
              required
            />
            {questionImageField}
            <AnswerInputs
              question={Im.Map(this.props.page.get('question'))}
              ref="answerInputs"
              name="_"
            />
            <SubmitButton ref="submitBtn" />
          </Form>
        </div>
      </Modal>
    );
  }
}
