import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import CompaniesState from 'state/companies';
import TrainingPlansState from 'state/training-plans';
import TrainingPlanTrainingUnitsState from 'state/training-plan-training-units';

import Style from 'style';

import $y from 'utilities/yaler.js';
import { Info } from 'components/common/info';
import { local } from 'utilities/storage';

import Select from 'react-select';
import { MultiSelect } from 'components/common/form/select';

import {
  Form,
  TextInput,
  TextArea,
  ImageCropper,
  SearchableSelect,
  SubmitButton,
  FieldHeader,
  ButtonToggle
} from 'components/common/form';

const PUBLISH_YES = 'Published';
const PUBLISH_NO = 'Unpublished';
const YES = 'Yes';
const NO = 'No';

export class TrainingPlanDetailsForm extends React.Component {
  static data = {
    trainingPlan: {
      required: false,
      fields: ['name', 'is_published', 'description', 'training_units', 'custom_thumbnail']
    },
    channels: {
      required: true,
      many: true,
      fields: ['name', 'url', 'id', 'auto_add_plans_to_auto_enroll_set']
    }
  };

  static propTypes = $y.propTypesFromData(TrainingPlanDetailsForm, {
    onSubmit: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  constructor(props) {
    super();
    let trainingUnits = props.trainingPlan ? props.trainingPlan.get('training_units') : [];
    let trainingUnit;
    if (trainingUnits && trainingUnits.length) {
      trainingUnit = trainingUnits[0].url;
      trainingUnits = trainingUnits.map(channel => ({
        label: channel.name,
        value: channel.url
      }));
    }
    if (props.initialChannels) trainingUnits = props.initialChannels;
    this.state = {
      loading: false,
      addPlanToAutoEnroll: null,
      auto_enroll_plans: props.currentUser.get('learner').company.auto_enroll_plans,
      selectedChannels: trainingUnits && trainingUnits.length ? trainingUnits : [],
      selectedChannelIsAutoEnroll: false
    };
  }

  cleanIsPublished = val => val === PUBLISH_YES;

  cleanAutoEnrollTurnedOn = val => val === YES;

  addOrRemovePlanFromAutoEnroll = data => {
    if (this.state.addPlanToAutoEnroll === null) return;
    const learner = this.props.currentUser.get('learner');

    let plan = this.props.trainingPlan;
    if (!plan) plan = Im.Map(data);

    const company = this.props.currentUser.get('learner').company;
    const planURL = plan.get('url');
    let autoEnrollPlans = this.state.auto_enroll_plans;
    let addOrRemoveText;
    if (_.includes(autoEnrollPlans, planURL)) {
      if (this.state.addPlanToAutoEnroll === false) {
        // the plan does exist in the auto enroll set, and the user wants it to
        // be removed.
        autoEnrollPlans = _.without(autoEnrollPlans, planURL);
      } else {
        // don't remove anything. the user doesn't want the plan to be in the set.
        return;
      }
    } else {
      // add the plan to the auto_enroll_plans set
      autoEnrollPlans.push(planURL);
    }
    CompaniesState.ActionCreators.update(company.id, {
      auto_enroll_plans: autoEnrollPlans
    });
  };

  addPlanToSelectedChannels = id => {
    const selectedChannels = this.state.selectedChannels;
    if (id && selectedChannels && selectedChannels.length) {
      TrainingPlansState.ActionCreators.update(id, {
        training_units: selectedChannels,
        training_unit: selectedChannels[0]
      });
    }
  };

  onFormSubmit = data => {
    const { currentUser, trainingPlan } = this.props;
    data.owner = currentUser.get('learner').company.url;
    if (data.add_to_auto_enroll !== undefined) {
      this.setState({ addPlanToAutoEnroll: data.add_to_auto_enroll });
    }
    this.setState({ selectedChannels: data.training_units });
    data.custom_thumbnail = this.image.getValue();

    this.setState({ loading: true });

    // Get added and removed training units
    const submittedTrainingUnits = data.training_units;
    delete data.training_units;
    const planTrainingUnits = trainingPlan
      ? trainingPlan.get('training_units').map(tp => tp.url)
      : [];
    const addedTrainingUnits = submittedTrainingUnits.filter(tp => !_.includes(planTrainingUnits, tp));
    const removedTrainingUnits = planTrainingUnits.filter(tp => !_.includes(submittedTrainingUnits, tp));

    function syncTrainingUnits(plan) {
      addedTrainingUnits.forEach(tuURL => {
        TrainingPlanTrainingUnitsState.ActionCreators.create({
          training_plan: plan.get('url'),
          training_unit: tuURL,
          order: 0
        });
      });

      removedTrainingUnits.forEach(tuURL => {
        TrainingPlanTrainingUnitsState.ActionCreators.doListAction(
          'delete_for_plan_and_training_unit',
          {
            training_plan: plan.get('url'),
            training_unit: tuURL
          }
        );
      });
    }

    if (trainingPlan) {
      TrainingPlansState.ActionCreators.update(trainingPlan.get('id'), data, {
        clearMatchesFilters: false
      }).then(res => {
        // must be done after update
        this.addOrRemovePlanFromAutoEnroll(data && this.state.addPlanToAutoEnroll !== null);
        syncTrainingUnits(Im.Map(res.body));
        this.props.onSubmit(res);
      });
    } else {
      TrainingPlansState.ActionCreators.create(data).then(res => {
        // must be done after create
        this.props.onSubmit(res);
        if (this.state.addPlanToAutoEnroll) {
          _.defer(() => {
            if (res && res.body && this.state.addPlanToAutoEnroll !== null) {
              this.addOrRemovePlanFromAutoEnroll(res.body);
            }
            syncTrainingUnits(Im.Map(res.body));
          });
        }
      });
    }
  };

  onChannelChange = channel => {
    const channels = this.props.channels.toJS();
    const selectedChannel = _.find(channels, c => c.url === channel);
    this.setState({
      selectedChannelIsAutoEnroll: selectedChannel.auto_add_plans_to_auto_enroll_set,
      selectedChannel: channel
    });
    _.defer(() => {
      this.props.refresh();
    });
  };

  channelInAutoEnroll = () => {
    const channels = this.props.channels.toJS();
    const selectedChannel = _.find(channels, c => c.url === this.state.selectedChannel);
    if (selectedChannel) {
      return selectedChannel.auto_add_plans_to_auto_enroll_set;
    }
    return false;
  };

  render() {
    let isPublished = PUBLISH_NO;
    let name,
      description,
      channel,
      channels,
      customThumbnail,
      planInAutoEnroll,
      searchSelectable,
      companyAutoEnrollPlans;

    if (this.props.trainingPlan) {
      const plan = this.props.trainingPlan;
      name = plan.get('name');
      description = plan.get('description');
      // TODO: Remove this
      channels = plan.get('training_units');
      if (channels && channels.length) channel = channels[0];
      isPublished = plan.get('is_published') ? PUBLISH_YES : PUBLISH_NO;
      companyAutoEnrollPlans = this.props.currentUser.get('learner').company.auto_enroll_plans;
      planInAutoEnroll = _.includes(companyAutoEnrollPlans, plan.get('url')) ? YES : NO;
      customThumbnail = plan.get('custom_thumbnail');
    }

    if (this.props.channels) {
      const channelOpts = this.props.channels
        .map(c => ({ label: c.get('name'), value: c.get('url') }))
        .toJS();

      searchSelectable = (
        <div>
          <FieldHeader>
            Channels
            <Info content="This plan will be available to all subscribers of the selected channel.
                If you do not select a channel, the plan cannot be shared
                with users from other companies."
            />
          </FieldHeader>
          <MultiSelect
            ref="trainingUnitSelect"
            initialSelection={this.state.selectedChannels}
            name="training_units"
            options={channelOpts}
            placeholder="Select channels..."
            noResultsText="No channels found."
          />
        </div>
      );
    }
    let autoEnrollSetting;
    const learner = this.props.currentUser.get('learner');
    if (!this.channelInAutoEnroll()) {
      autoEnrollSetting = (
        <div>
          <FieldHeader
            explanation="If auto enroll is turned on, all users in your own company will automatically be enrolled in this plan."
            required
            style={{ marginTop: 20 }}
          >
            Auto Enroll
          </FieldHeader>
          <ButtonToggle
            name="add_to_auto_enroll"
            leftLabel={YES}
            rightLabel={NO}
            initialValue={planInAutoEnroll}
            clean={this.cleanAutoEnrollTurnedOn}
            style={{
              button: { width: '8em' }
            }}
          />
        </div>
      );
    }

    return (
      <Form onSubmitAndValid={this.onFormSubmit} ref="form">
        <FieldHeader required>Name your plan</FieldHeader>
        <TextInput name="name" ref="name" initialValue={name} initialIsAcceptable required />
        <FieldHeader>Describe your plan</FieldHeader>
        <TextArea
          name="description"
          ref="description"
          initialValue={description}
          initialIsAcceptable
        />
        {searchSelectable}
        <FieldHeader
          explanation="If the plan is not published then only company admins will be able to view it"
          required
          style={{ marginTop: 20 }}
        >
          Publish
        </FieldHeader>
        <ButtonToggle
          name="is_published"
          leftLabel={PUBLISH_YES}
          rightLabel={PUBLISH_NO}
          initialValue={isPublished}
          clean={this.cleanIsPublished}
          style={{
            button: { width: '8em' }
          }}
          initialIsAcceptable
          required
        />
        {autoEnrollSetting}
        <FieldHeader style={{ marginTop: 20 }}>Custom thumbnail</FieldHeader>
        <ImageCropper
          ref={i => (this.image = i)}
          aspectRatio={16 / 9}
          height={180}
          width={180 * 16 / 9}
          initialValue={customThumbnail}
        />
        <SubmitButton loading={this.state.loading} />
      </Form>
    );
  }
}
