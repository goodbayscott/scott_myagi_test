import Marty from 'marty';
import React from 'react';
import cx from 'classnames';
import Im from 'immutable';
import moment from 'moment-timezone';
import _ from 'lodash';

import { t } from 'i18n';
import Style from 'style';

import containerUtils from 'utilities/containers';
import { truncateText } from 'utilities/generic';
import $y from 'utilities/yaler';

import { SubmitButton } from 'components/common/form';

import { Modal } from 'components/common/modal';
import { TickCircle } from 'components/common/tick-circle';
import PageState from '../page-state';
import TrainingPlansState from 'state/training-plans';
import createPaginatedStateContainer from 'state/pagination';

import { CardImage, Card } from 'components/common/cards';

import { cardStyle } from '../constants';
import { EntitySelect } from 'components/common/card-searchable-select/entity-select';

export class TrainingPlanCard extends React.Component {
  static data = {
    trainingPlan: {
      required: true,
      fields: ['name', 'id', 'thumbnail_url', 'modules', 'description', 'url', 'deactivated']
    }
  };

  onCardClick = () => {
    this.props.onCardClick(this.props.entity);
  };

  render() {
    const imageEl = <CardImage src={this.props.entity.get('thumbnail_url')} />;
    const trainingPlanURL = this.props.entity.get('url');
    let selected = false;
    if (this.props.selectedEntities) {
      selected = _.includes(this.props.selectedEntities, trainingPlanURL);
    }

    let tickCircle = null;
    if (selected) {
      tickCircle = <TickCircle isSelected style={cardStyle.tickCircle} />;
    }
    return (
      <Card onClick={this.onCardClick}>
        {imageEl}
        {tickCircle}
        <div className="content">
          <div className="header">
            {this.props.entity.get('name')}
            <div />
          </div>
          <div className="description" style={{ wordWrap: 'break-word' }}>
            {truncateText(this.props.entity.get('description'))}
            <br />
            <br />
          </div>
        </div>
      </Card>
    );
  }
}

export const TrainingPlanCardSelect = createPaginatedStateContainer(EntitySelect, {
  listenTo: [PageState.Store],

  isValid() {
    const ic = PageState.Store.getEntitySelectComponent();
    if (!ic) return true;
    return ic.isValid();
  },

  getNameAndValue() {
    const ic = PageState.Store.getEntitySelectComponent();
    return ic.getNameAndValue();
  },

  paginate: {
    store: TrainingPlansState.Store,
    propName: 'entities',
    limit: 6,
    getQuery() {
      const query = {
        ordering: 'name',
        deactivated__isnull: true,
        fields: [$y.getFields(TrainingPlanCard, 'trainingPlan')]
      };
      const search = PageState.Store.getEntitySearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      if (this.props.fetchOpts) {
        _.extend(query, this.props.fetchOpts);
      }
      return query;
    }
  },
  done(results) {
    return (
      <EntitySelect
        {...this.props}
        {...results}
        entityName="training_plan"
        cardComponent={TrainingPlanCard}
      />
    );
  },
  pending() {
    return containerUtils.defaultPending(this, EntitySelect);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EntitySelect, errors);
  }
});

export class TrainingPlanCardSelectModal extends React.Component {
  constructor(props) {
    super();
    this.state = {
      innerComponent: null,
      isValid: false
    };
  }

  isValid = () => {
    if (!PageState.Store.getEntitySelectComponent()) {
      if (this.props.initialValue && this.props.initialValue.length) {
        this.setState({ isValid: true });
        return true;
      }
      this.setState({ isValid: false });
      return false;
    }
    const ic = PageState.Store.getEntitySelectComponent();
    const isValid = ic.isValid();
    this.setState({ isValid });
    return isValid;
  };

  getNameAndValue = () => {
    const ic = PageState.Store.getEntitySelectComponent();
    const nameAndValue = {};
    if (!ic) {
      // If the modal has been closed, the page state will be reset, so make sure
      // to set component state so we can still get name and value. Otherwise,
      // use page state for component.
      if (this.state.innerComponent) {
        nameAndValue[this.props.name] = this.state.innerComponent.state.selections;
        return nameAndValue;
      }
      if (this.props.name && this.props.initialValue) {
        nameAndValue[this.props.name] = this.props.initialValue;
        return nameAndValue;
      }
      return null;
    }
    return ic.getNameAndValue();
  };

  onCardClick = () => {};

  onTrainingPlanSelectSubmit = () => {
    this.refs.selectTrainingPlanModal.hide();
  };

  show = () => {
    this.refs.selectTrainingPlanModal.show();
  };

  hide = () => {
    this.refs.selectTrainingPlanModal.hide();
  };

  getPlanObjectFromURL = url => {
    // Provide as much info as we have when selection has changed. We don't
    // necessarily have data for plans that are set as initialValue, so in that
    // case, just return object with a URL attr.
    this.isValid();
    const ic = PageState.Store.getEntitySelectComponent();
    const entities = ic.props.entities;
    let obj;
    if (entities && entities.size) {
      obj = entities.find(item => item.get('url') == url);
    }

    if (obj === undefined) {
      return { url };
    }
    return obj;
  };

  getSelectedEntitiesArray = () => PageState.Store.getSelectedEntities().toArray();

  onChange = innerComponent => {
    const ic = PageState.Store.getEntitySelectComponent();
    // re-validate on change
    this.isValid();
    // set component state innerComponent so we can still get name and value
    // (for form data) when the modal is closed.
    this.setState({ innerComponent });
    _.defer(() => {
      this.props.onChange();
      const selectedPlanObjects = ic.state.selections.map(url => this.getPlanObjectFromURL(url));
      this.props.onTrainingPlansChange(selectedPlanObjects);
    });
  };

  render() {
    let initialPlans;
    if (this.props.initialValue) initialPlans = this.props.initialValue;
    return (
      <Modal ref="selectTrainingPlanModal" header="Select a plan" closeOnDimmerClick>
        <div className="content">
          <TrainingPlanCardSelect
            initialValue={initialPlans}
            name={this.props.name}
            ref="trainingPlanCardSelect"
            currentUser={this.props.currentUser}
            onChange={this.onChange}
            onCardClick={this.onCardClick}
            fetchOpts={this.props.fetchOpts}
            required
            many={this.props.many}
          />
          <SubmitButton text={t('done')} formIsValid={this.state.isValid} onClick={this.hide} />
        </div>
      </Modal>
    );
  }
}
