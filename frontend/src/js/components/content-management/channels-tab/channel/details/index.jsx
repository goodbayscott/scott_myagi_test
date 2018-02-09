import React from 'react';
import Style from 'style/index.js';
import Radium from 'radium';
import moment from 'moment-timezone';
import Im from 'immutable';
import ChannelsState from 'state/channels';
import { t } from 'i18n';
import { Modal } from 'components/common/modal/index';
import Textarea from 'react-autosize-textarea';
import { resolve } from 'react-router-named-routes';
import { EmbedlyCard } from 'components/common/cards/embedly';
import { TagSearchableMultiSelect } from 'components/common/tag-searchable-multiselect';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { momentToISO } from 'utilities/time.js';
import { Button } from 'semantic-ui-react';
import { Badges } from './badges';
import { CONTENT_SELLER } from 'core/constants';
import { Form, URLInput, SubmitButton, HiddenTextInput, YesNoToggle } from 'components/common/form';
import { LearnItems } from './learn-items';
import { Price } from './price';

const COLUMN_PANELS = '@media screen and (max-width: 800px)';

const styles = {
  container: {
    margin: '0px 20px',
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%',
    [COLUMN_PANELS]: {
      justifyContent: 'flex-start',
      flexDirection: 'column'
    }
  },
  column: {
    minWidth: 400,
    padding: '0 20px'
  },
  field: {
    margin: '0px 0px 30px'
  },
  textarea: {
    width: '100%',
    color: 'black',
    marginBottom: 20,
    padding: 10,
    borderRadius: 4,
    fontSize: '1.1rem',
    border: 0
  },
  clickableField: {
    display: 'flex',
    flexDirection: 'column',
    margin: '0px 0px 30px',
    cursor: 'pointer',
    transition: '0.3s all',
    ':hover': {
      paddingLeft: 10,
      borderLeft: `6px solid ${Style.vars.colors.get('primary')}`
    }
  },
  placeholder: {
    color: '#888'
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: 5
  },
  description: {
    maxWidth: 500
  },
  archiveButton: {
    fontSize: '1.2rem',
    color: Style.vars.colors.get('red')
  },
  tagsButton: {
    display: 'inline-block'
  },
  requireSequentialContainer: {
    marginBottom: 40
  }
};

@Radium
export class DetailsTab extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    router: React.PropTypes.object.isRequired
  };

  onVideoUpdate = data => {
    if (!data.video) data.video = '';
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data);
    this.context.displayTempPositiveMessage({ heading: 'Channel updated' });
    _.delay(() => {
      if (this.videoModal) this.videoModal.hide();
    }, 500);
  };

  onTagsFormSubmit = data => {
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data);
    this.tagModal.hide();
    this.context.displayTempPositiveMessage({ heading: 'changes_saved' });
  };

  onRequireToggleChange = val => {
    this.updateFields({ require_sequential_completion: val });
  };

  showArchiveChannelModal = () => {
    if (!this.props.channel) return;
    if (this.props.trainingPlanTrainingUnits.count() === 0) {
      this.archiveModal.show();
    } else {
      this.cannotArchiveModal.show();
    }
  };

  archiveChannel = () => {
    const now = momentToISO(moment());
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), { deactivated: now }).then(res => this.context.router.push('/views/content/channels/'));
    this.archiveModal.hide();
  };

  saveDescription = () => {
    this.descriptionModal.hide();
    this.updateFields({ description: this.descriptionInput.value });
  };

  updateFields = data => {
    _.forOwn(data, (value, key) => {
      data[key] = _.trim(value);
    });
    if (!data.name) data.name = this.props.channel.get('name');
    ChannelsState.ActionCreators.update(this.props.channel.get('id'), data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    });
  };

  render() {
    const learner = this.context.currentUser.get('learner');
    return (
      <div style={styles.container}>
        <div style={styles.column}>
          <div
            onClick={() => this.descriptionModal.show()}
            style={styles.clickableField}
            key="description"
          >
            <div style={styles.title}>{t('description')}</div>
            <div style={styles.description}>{this.props.channel.get('description')}</div>
            {!this.props.channel.get('description') && (
              <div style={styles.placeholder}>{t('no_content')}</div>
            )}
          </div>

          <div onClick={() => this.learnItemsComponentModal.show()} style={styles.clickableField}>
            <div style={styles.title}>{t('what_youll_learn')}</div>
            <LearnItems
              channel={this.props.channel}
              ref={c => (this.learnItemsComponentModal = c)}
            />
          </div>

          <div onClick={() => this.videoModal.show()} style={styles.clickableField} key="video">
            <div style={styles.title}>{t('introductory_video')}</div>
            <div>{this.props.channel.get('video')}</div>
            {!this.props.channel.get('video') && (
              <div style={styles.placeholder}>{t('no_content')}</div>
            )}
          </div>

          {learner.company.company_type == CONTENT_SELLER && (
            <div
              onClick={() => this.priceComponentModal.show()}
              style={styles.clickableField}
              key="price"
            >
              <div style={styles.title}>{t('price')}</div>
              <Price channel={this.props.channel} ref={c => (this.priceComponentModal = c)} />
            </div>
          )}

          {learner.is_internal_user && (
            <div style={styles.requireSequentialContainer}>
              <div style={styles.title}>{t('require_sequential_completion')}</div>
              <YesNoToggle
                onChange={this.onRequireToggleChange}
                initialValue={this.props.channel.get('require_sequential_completion')}
              />
            </div>
          )}

          <div style={styles.field}>
            <Button onClick={() => this.tagModal.show()} color="green" inverted>
              <i className="ui icon tag" />
              {t('tags')}
            </Button>
          </div>
          <div style={styles.field}>
            <Button color="red" onClick={this.showArchiveChannelModal} inverted>
              <i className="ui icon archive" />
              {t('archive_channel')}
            </Button>
          </div>
        </div>

        <div style={styles.column}>
          <div style={styles.field}>
            <div style={styles.title}>{t('badges')}</div>
            <Badges
              channel={this.props.channel}
              trainingPlanTrainingUnits={this.props.trainingPlanTrainingUnits}
            />
          </div>
        </div>

        <Modal
          ref={c => (this.descriptionModal = c)}
          header={t('description')}
          basic
          message
          noConfirm
        >
          <div className="content">
            <Textarea
              placeholder={t('description')}
              type="text"
              innerRef={c => (this.descriptionInput = c)}
              defaultValue={this.props.channel.get('description')}
              style={styles.textarea}
              rows={4}
            />
            <PrimaryButton onClick={this.saveDescription}>{t('save')}</PrimaryButton>
          </div>
        </Modal>

        <Modal ref={c => (this.videoModal = c)} header={t('video')} basic message noConfirm>
          <div className="content">
            {t('introductory_video_info')}
            <EmbedlyCard url={this.props.channel.get('video')} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 20
              }}
            >
              <Form style={{ width: 500 }} onSubmitAndValid={this.onVideoUpdate}>
                <HiddenTextInput />
                <URLInput
                  name="video"
                  initialValue={this.props.channel.get('video') || 'Video URL'}
                  initialIsAcceptable={Boolean(this.props.channel.get('video'))}
                  required={false}
                />
                <SubmitButton />
              </Form>
            </div>
          </div>
        </Modal>

        <Modal ref={c => (this.tagModal = c)} header={t('channel_tags')} basic message noConfirm>
          <div className="content">
            {t('channel_tags_info')}
            <Form onSubmitAndValid={this.onTagsFormSubmit}>
              <HiddenTextInput />
              <TagSearchableMultiSelect
                name="tags"
                initialSelections={this.props.channel.get('tags')}
                currentUser={this.context.currentUser}
                fetchOpts={{
                  exclude_type: 'brand'
                }}
              />
              <SubmitButton />
            </Form>
          </div>
        </Modal>

        <Modal
          ref={c => (this.cannotArchiveModal = c)}
          header={t('unable_to_archive_channel')}
          content={t('unable_to_archive_channel_info')}
          message
          basic
        />
        <Modal
          ref={c => (this.archiveModal = c)}
          header={t('are_you_sure_archive_channel')}
          content={t('are_you_sure_archive_channel_info')}
          onConfirm={this.archiveChannel}
          basic
        />
      </div>
    );
  }
}
