import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';

import Im from 'immutable';
import Style from 'style';

import { DetailsModal as QuestionDetailsModal } from './page-types/question/details-modal';
import { AddModal as VideoAddModal } from './page-types/video/add-modal';
import { DetailsModal as PdfDetailsModal } from './page-types/pdf/details-modal';
import { DetailsModal as SnippetDetailsModal } from './page-types/snippet/details-modal';
import { DetailsModal as HTMLDetailsModal } from './page-types/html/details-modal';
import FlipCardDetailsModal from './page-types/flip-card/details-modal';

const styles = {
  containerOuter: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 600,
    width: '100%'
  },
  container: {
    display: 'flex',
    transform: 'scale(0.8)',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 20,
    ':hover': {
      color: Style.vars.colors.get('primary')
    }
  },
  icon: {
    fontSize: '2.5rem',
    lineHeight: '50px',
    marginLeft: '0.25rem'
  },
  text: {
    fontSize: '1.3rem',
    // fontWeight: 200,
    marginTop: 20
  }
};

@Radium
class AddPdfButton extends React.Component {
  render() {
    const page = Im.Map({
      module: this.props.lesson.get('url')
    });
    return (
      <div>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <i style={styles.icon} className="ui icon file" />
          <div style={styles.text}>{t('pdf')}</div>
        </div>
        <PdfDetailsModal ref="details" page={page} onSave={this.props.onSave} />
      </div>
    );
  }
}

@Radium
export class AddSnippetButton extends React.Component {
  render() {
    const page = Im.Map({
      module: this.props.lesson.get('url')
    });
    return (
      <div>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <i style={styles.icon} className="ui icon world" />
          <div style={styles.text}>{t('web_page')}</div>
        </div>
        <SnippetDetailsModal ref="details" page={page} onSave={this.props.onSave} />
      </div>
    );
  }
}

@Radium
export class AddHTMLButton extends React.Component {
  render() {
    const page = Im.Map({
      module: this.props.lesson.get('url')
    });
    return (
      <div>
        <div style={styles.container} onClick={() => this.details.show()}>
          <i style={styles.icon} className="ui file text outline icon" />
          <div style={styles.text}>{t('document')}</div>
        </div>
        <HTMLDetailsModal
          ref={details => (this.details = details)}
          page={page}
          onSave={this.props.onSave}
        />
      </div>
    );
  }
}

@Radium
export class AddVideoButton extends React.Component {
  render() {
    return (
      <div>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <i style={styles.icon} className="ui icon youtube play" />
          <div style={styles.text}>{t('video')}</div>
        </div>
        <VideoAddModal ref="details" lesson={this.props.lesson} onSave={this.props.onSave} />
      </div>
    );
  }
}

@Radium
export class AddQuestionButton extends React.Component {
  render() {
    const page = Im.Map({
      module: this.props.lesson.get('url'),
      question: Im.Map({})
    });
    return (
      <div>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <i style={styles.icon} className="ui help circle icon" />
          <div style={styles.text}>{t('question')}</div>
        </div>
        <QuestionDetailsModal ref="details" page={page} onSave={this.props.onSave} />
      </div>
    );
  }
}

@Radium
export class AddFlipCardButton extends React.Component {
  render() {
    const page = Im.fromJS({
      module: this.props.lesson.get('url'),
      front_text: '',
      back_text: ''
    });
    return (
      <div>
        <div style={styles.container} onClick={() => this.refs.details.show()}>
          <i style={styles.icon} className="ui icon clone" />
          <div style={styles.text}>{t('flip_card')}</div>
        </div>
        <FlipCardDetailsModal ref="details" page={page} onSave={this.props.onSave} />
      </div>
    );
  }
}

@Radium
export class AddButton extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };
  constructor(props) {
    super(props);
    this.state = {
      resetId: Math.random()
    };
  }

  reset = () => {
    this.setState({ ...this.state, resetId: Math.random() });
  };

  render() {
    const learner = this.context.currentUser.get('learner');
    const props = {
      lesson: this.props.lesson,
      onSave: this.reset
    };
    return (
      <div style={styles.containerOuter} key={this.state.resetId}>
        <AddVideoButton {...props} />
        <AddQuestionButton {...props} />
        <AddPdfButton {...props} />
        <AddSnippetButton {...props} />
        {(learner.is_internal_user ||
          learner.company.companysettings.flip_card_creation_enabled) && (
            <AddFlipCardButton {...props} />
          )}
        <AddHTMLButton {...props} />
      </div>
    );
  }
}
