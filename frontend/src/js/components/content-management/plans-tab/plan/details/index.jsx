import React from 'react';
import Radium from 'radium';
import { t } from 'i18n';
import Textarea from 'react-autosize-textarea';

import TrainingPlansState from 'state/training-plans';
import { PlanStats } from './stats';
import { ImageEdit } from '../../../common/image-edit';

import { Info } from 'components/common/info';

const COMPRESS_LAYOUT = '@media screen and (max-width: 1100px)';

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
    marginBottom: 10,
    [COMPRESS_LAYOUT]: {
      marginRight: 0
    }
  },
  planDetailHeaderContainer: {
    display: 'flex',
    [COMPRESS_LAYOUT]: {
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  },
  nameAndDesc: {
    width: '100%',
    minWidth: 200,
    ':hover': {}
  },
  planName: {
    fontSize: '2rem',
    fontWeight: 200,
    lineHeight: '30px'
  },
  planDescription: {
    maxHeight: 112
  },
  editableTextArea: {
    border: '1px solid rgba(0,0,0,0)',
    outline: 'none',
    width: '100%',
    resize: 'none',
    marginBottom: 7,
    transition: 'all 0.3s ease',
    borderRadius: 10,
    padding: '4px 6px'
  },
  textAreaHover: {
    border: '1px solid #ddd'
  },
  editPencil: {
    cursor: 'pointer',
    color: '#888',
    fontSize: '1.3rem',
    marginRight: -14,
    marginTop: -14,
    [COMPRESS_LAYOUT]: {
      display: 'none'
    }
  },
  statsAndCreatedBy: {
    paddingLeft: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    [COMPRESS_LAYOUT]: {
      justifyContent: 'center'
    }
  }
};

@Radium
export class PlanDetails extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  static data = {
    channels: {
      required: true,
      fields: ['id', 'name', 'url']
    },
    plan: {
      required: true,
      fields: ['training_units', 'description', 'thumbnail_url']
    }
  };

  constructor(props) {
    super();
    this.state = {
      tempName: '',
      tempDescription: ''
    };
  }

  togglePlanNameEdit = () => {
    this.setState({
      planNameEdit: !this.state.planNameEdit
    });
  };

  togglePlanDescriptionEdit = () => {
    this.setState({
      planDescriptionEdit: !this.state.planDescriptionEdit
    });
  };

  focusPlanNameInput = () => {
    this.planNameInput.focus();
  };

  updateFields = data => {
    data.owner = this.props.plan.get('owner').url;
    if (!data.name) data.name = this.props.plan.get('name');
    TrainingPlansState.ActionCreators.update(this.props.plan.get('id'), data).then(res => {
      this.context.displayTempPositiveMessage({
        heading: 'changes_saved'
      });
    });
  };

  keyPress = (e, data) => {
    // If user presses enter, save changes
    if (e.charCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      this.updateFields(data);
    }
  };

  onImageSave = thumbnail => {
    const data = {
      custom_thumbnail: thumbnail
    };
    TrainingPlansState.ActionCreators.update(this.props.plan.get('id'), data).then(() => {
      this.context.displayTempPositiveMessage({
        heading: 'Upload complete'
      });
    });
    this.context.displayTempPositiveMessage({
      heading: 'Image uploading...'
    });
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    const userCanEditPlan = this.props.userCanEditPlan;
    const textAreaHover = Radium.getState(this.state, 'nameAndDesc', ':hover') && userCanEditPlan;
    return (
      <div style={styles.planDetailHeaderContainer} ref={c => (this.container = c)}>
        <div style={styles.imgContainer}>
          <ImageEdit
            image={this.props.plan.get('thumbnail_url')}
            onSave={this.onImageSave}
            editable={userCanEditPlan}
            width={390}
          />
        </div>
        <div style={styles.nameAndDesc} key="nameAndDesc">
          <Textarea
            style={{
              ...styles.editableTextArea,
              ...styles.planName,
              ...(textAreaHover ? styles.textAreaHover : {}),
              pointerEvents: userCanEditPlan ? 'auto' : 'none'
            }}
            placeholder="Name"
            type="text"
            key="planName"
            innerRef={t => (this.planNameInput = t)}
            defaultValue={this.props.plan.get('name')}
            onBlur={e => {
              this.updateFields({ name: e.target.value });
            }}
            onKeyPress={e => {
              this.keyPress(e, { name: e.target.value });
            }}
          />
          <Textarea
            style={{
              ...styles.editableTextArea,
              ...styles.planDescription,
              ...(textAreaHover ? styles.textAreaHover : {}),
              pointerEvents: userCanEditPlan ? 'auto' : 'none'
            }}
            key="planDescription"
            placeholder="Description"
            defaultValue={this.props.plan.get('description')}
            onBlur={e => {
              this.updateFields({ description: e.target.value });
            }}
            onKeyPress={e => {
              this.keyPress(e, { description: e.target.value });
            }}
          />
          <div style={styles.statsAndCreatedBy}>
            {this.props.plan.get('owner').url &&
              learner.company.url !== this.props.plan.get('owner').url && (
                <div>
                  <div style={styles.createdBy}>{t('created_by')}</div>
                  <div style={styles.companyNameContainer}>
                    <img
                      style={styles.companyLogo}
                      src={this.props.plan.get('owner').company_logo}
                    />
                    <div style={styles.companyName}>
                      {this.props.plan.get('owner').company_name}
                    </div>
                    <Info
                      style={{ marginLeft: 5 }}
                      // TODO
                      content={`This plan was created by ${
                        this.props.plan.get('owner').company_name
                      }.
                    Only ${this.props.plan.get('owner').company_name}
                    may make changes to plan details and content.`}
                    />
                  </div>
                </div>
              )}
            <PlanStats {...this.props} />
          </div>
        </div>
      </div>
    );
  }
}
