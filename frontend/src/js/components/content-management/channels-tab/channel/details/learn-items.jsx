import React from 'react';
import { t } from 'i18n';
import ChannelsState from 'state/channels';
import { Modal } from 'components/common/modal/index';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { Input } from 'semantic-ui-react';

const styles = {
  learnItem: {
    maxWidth: 500
  },
  modalContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    marginTop: 10
  },
  remove: {
    fontSize: '1.3rem',
    color: 'rgba(255,255,255, 0.6)',
    marginLeft: 10,
    display: 'flex',
    cursor: 'pointer'
  },
  buttonContainer: {
    display: 'flex',
    marginTop: 10
  },
  placeholder: {
    color: '#888'
  }
};

export class LearnItems extends React.Component {
  constructor(props) {
    super(props);
    let learnItems = [...props.channel.get('learn_items')];
    if (learnItems.length === 0) {
      learnItems = [''];
    }
    this.state = {
      learnItems
    };
  }

  addAnswer = () => {
    const learnItems = [...this.state.learnItems, ''];

    this.setState({
      ...this.state,
      learnItems
    });
  };

  show = () => {
    this.editModal.show();
  };

  save = () => {
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), {
      learn_items: this.state.learnItems.filter(l => l)
    });
    this.editModal.hide();
  };

  delete = index => {
    this.state.learnItems.splice(index, 1);
    this.setState({ ...this.state });
  };

  onChange = (e, index) => {
    this.state.learnItems[index] = e.target.value;
    this.setState({ ...this.state });
  };

  render() {
    const unsavedLearnItems = this.state.learnItems;
    const savedLearnItems = this.props.channel.get('learn_items');
    return (
      <div>
        <div>
          {savedLearnItems &&
            savedLearnItems.map((l, i) => (
              <div key={i} style={styles.learnItem}>
                {' '}
                - {l}
              </div>
            ))}
        </div>
        {savedLearnItems &&
          savedLearnItems.length === 0 && <div style={styles.placeholder}>{t('no_content')}</div>}
        <Modal
          ref={c => (this.editModal = c)}
          header={t('what_youll_learn')}
          basic
          message
          noConfirm
        >
          {unsavedLearnItems && (
            <div className="content" style={styles.modalContainer}>
              {unsavedLearnItems.map((l, i) => (
                <div key={i} style={styles.inputRow}>
                  <Input value={l} onChange={e => this.onChange(e, i)} style={styles.input} />
                  <div onClick={() => this.delete(i)}>
                    <i className="ui icon trash outline" style={styles.remove} />
                  </div>
                </div>
              ))}
              <div style={styles.buttonContainer}>
                {unsavedLearnItems.length < 10 && (
                  <SecondaryButton onClick={this.addAnswer}>{t('add')}</SecondaryButton>
                )}
                <PrimaryButton onClick={this.save}>{t('save')}</PrimaryButton>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }
}
