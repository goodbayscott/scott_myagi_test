import React from 'react';
import { t } from 'i18n';
import _ from 'lodash';
import Radium from 'radium';
import Textarea from 'react-autosize-textarea';
import { resolve } from 'react-router-named-routes';
import { Link } from 'react-router';
import Style from 'style';

import ModuleCreationState from 'state/module-creation';

import { ImageEdit } from '../../../common/image-edit';
import { PassPercentage } from './pass-percentage';

const COMPRESS_LAYOUT = '@media screen and (max-width: 1000px)';

const styles = {
  companyNameContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20
  },
  companyLogo: {
    maxWidth: 26,
    maxHeight: 20,
    marginRight: 5
  },
  createdBy: {
    paddingBottom: 4
  },
  companyName: {
    fontSize: '1.3rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#888'
  },
  imgContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginRight: 20,
    [COMPRESS_LAYOUT]: {
      marginRight: 0,
      marginBottom: 10
    }
  },
  lessonDetailHeaderContainer: {
    display: 'flex',
    [COMPRESS_LAYOUT]: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
    minWidth: 300,
    ':hover': {}
  },
  lessonName: {
    fontSize: '2rem',
    fontWeight: 200,
    lineHeight: '30px',
    marginBottom: 7
  },
  lessonDescription: {
    maxHeight: 112
  },
  editableTextArea: {
    border: '1px solid rgba(0,0,0,0)',
    outline: 'none',
    width: '100%',
    resize: 'none',
    transition: 'all 0.3s ease',
    borderRadius: 10,
    padding: '4px 6px'
  },
  containerHover: {
    border: '1px solid #ddd'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 5
  },
  attemptButton: {
    display: 'inline-block',
    backgroundColor: Style.vars.colors.get('primary'),
    borderRadius: 4,
    color: '#fff',
    marginTop: 10,
    padding: '5px 15px',
    display: 'inline-block',
    cursor: 'pointer'
  }
};

@Radium
export class Details extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    location: React.PropTypes.object.isRequired
  };

  togglePlanNameEdit = () => {
    this.setState({
      lessonNameEdit: !this.state.lessonNameEdit
    });
  };

  togglePlanDescriptionEdit = () => {
    this.setState({
      lessonDescriptionEdit: !this.state.lessonDescriptionEdit
    });
  };

  dataChanged = _.debounce(data => {
    if (!data.name) data.name = this.props.lesson.get('name');
    ModuleCreationState.ActionCreators.updateModuleDetails(data);
  }, 1000);

  onImageSave = thumbnail => {
    const data = {
      custom_thumbnail: thumbnail
    };
    ModuleCreationState.ActionCreators.updateModuleDetails(data);
    this.context.displayTempPositiveMessage({
      heading: 'Image uploading...'
    });
  };

  render() {
    const containerHover = Radium.getState(this.state, 'details', ':hover');
    const { lesson } = this.props;
    const lessonId = lesson.get('id');
    const planId =
      lesson.get('training_plans').toJS().length === 0
        ? null
        : lesson
          .get('training_plans')
          .get(0)
          .get('id');
    return (
      <div>
        <div style={styles.lessonDetailHeaderContainer}>
          <div style={styles.imgContainer}>
            <ImageEdit
              image={lesson.get('thumbnail_url')}
              onSave={this.onImageSave}
              width={220}
              editable
            />
          </div>
          <div style={styles.details} key="details">
            <Textarea
              style={{
                ...styles.editableTextArea,
                ...styles.lessonName,
                ...(containerHover ? styles.containerHover : {})
              }}
              placeholder="Name"
              type="text"
              key="lessonName"
              innerRef={t => (this.lessonNameInput = t)}
              defaultValue={lesson.get('name')}
              onChange={e => {
                this.dataChanged({ name: e.target.value });
              }}
            />
            <div style={styles.buttonContainer}>
              <PassPercentage
                lesson={lesson}
                onChange={v => this.dataChanged({ pass_percentage: v })}
                containerHover={containerHover}
              />
              {planId &&
                lesson
                  .get('pages')
                  .filter(p => !p.get('deactivated'))
                  .count() > 0 && (
                  <Link
                    style={styles.attemptButton}
                    to={resolve(`/views/training_plans/${planId}/modules/${lesson.get('id')}/attempts/new/?returnToEdit=true`)}
                  >
                    {t('try_this_lesson')}
                  </Link>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
