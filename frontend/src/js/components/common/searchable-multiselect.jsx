import Marty from 'marty';
import React from 'react';
import _ from 'lodash';
import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import Style from 'style';

import TrainingPlansState from 'state/training-plans';
import EnrollmentGroupsState from 'state/enrollment-groups';
import { LoadingContainer } from 'components/common/loading';
import { SearchableMultiSelect } from 'components/common/form/select';
// import {
//   createTrainingPlanSelectContainer
// } from 'components/common/training-plan-searchable-select';
// import {TrainingPlanSearchableSelect, TrainingPlanSearchableSelectInner} from 'components/common/training-plan-searchable-select';

// EntitySearchableMultiSelect is a wrapper around SearchableMultiSelect.
// It's used to retrieve objects that share similar properties (name, url, id).
// To make use of this, just define appropriate marty container opts (see below).

class EntitySearchableMultiSelectInner extends React.Component {
  static data = {
    entities: {
      many: true,
      required: false,
      fields: ['name', 'url', 'id']
    }
  };

  static propTypes = $y.propTypesFromData(EntitySearchableMultiSelectInner);

  componentDidUpdate(prevProps) {
    if (prevProps.entities !== this.props.entities && this.props.onChange) {
      // Call onChange when plans items load
      this.props.onChange();
    }
  }

  onEntitiesChanged = () => {
    _.delay(() => {
      // This will trigger the modal to reposition itself
      // or make the page scrollable if necessary. Prevents issues
      // which occur when too many plan are selected (e.g. not being
      // able to scroll to the submit button).
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (e) {
        // For IE support
        element = document.documentElement;
        const event = document.createEventObject();
        element.fireEvent('onresize', event);
      }
    }, 500);
    if (this.props.onChange) this.props.onChange();
  };

  makeOption = entity => ({
    value: entity.get('url'),
    label: entity.get('name')
  });

  getNameAndValue() {
    if (this.refs.loadingContainer.refs.searchableSelection) {
      return this.refs.loadingContainer.refs.searchableSelection.getNameAndValue();
    }
    // Plans may not have loaded yet
    return undefined;
  }

  isValid() {
    if (this.refs.loadingContainer.refs.searchableSelection) {
      return this.refs.loadingContainer.refs.searchableSelection.isValid();
    }
    // Plans may not have loaded yet
    if (this.props.required) return false;
    return true;
  }

  render() {
    const loading = !this.props.entities;
    let opts;
    if (loading) opts = [];
    else opts = this.props.entities.map(this.makeOption).toArray();
    let entityName = 'entity';
    if (this.props.entityName) entityName = this.props.entityName;
    const noSelectionText = loading ? 'Loading...' : `Search for a ${entityName}...`;
    return (
      <LoadingContainer
        loadingProps={{
          entities: this.props.entities
        }}
        ref="loadingContainer"
        createComponent={props => (
          <SearchableMultiSelect
            noSelectionText={noSelectionText}
            {...this.props}
            options={opts}
            name={this.props.name}
            ref="searchableSelection"
            onChange={this.props.onChange}
            style={Object.assign(
              { container: { marginBottom: 10, marginTop: 5 } },
              this.props.style
            )}
          />
        )}
        noDataText="No data available."
      />
    );
  }
}

const tileStyle = {
  optionContainer: {
    position: 'relative',
    float: 'left',
    padding: 10,
    backgroundColor: Style.vars.colors.get('green'),
    color: 'white',
    margin: 3
  }
};

class EntityTilesInner extends EntitySearchableMultiSelectInner {
  // Render a read-only version of EntitySearchableMultiSelect

  renderSelectedOption(opt) {
    if (!opt) return undefined;
    return (
      <div key={opt.value} style={tileStyle.optionContainer}>
        {opt.label}
      </div>
    );
  }

  render() {
    const loading = !this.props.entities;
    let opts;
    if (loading) opts = [];
    else opts = this.props.entities.map(this.makeOption).toArray();
    return (
      <LoadingContainer
        loadingProps={{
          entities: this.props.entities
        }}
        ref="loadingContainer"
        createComponent={props => <div>{_.map(opts, this.renderSelectedOption.bind(this))}</div>}
        noDataText="No items selected."
      />
    );
  }
}

const defaultTrainingPlanFetchOpts = {
  ordering: 'name',
  deactivated__isnull: true,
  has_modules: true,
  is_published: true
};

export const defaultTrainingPlanContainerOpts = {
  listenTo: [TrainingPlansState.Store],
  fetch: {
    entities() {
      const opts = _.extend(
        {
          limit: 0,
          fields: [$y.getFields(EntitySearchableMultiSelectInner, 'entities')]
        },
        defaultTrainingPlanFetchOpts,
        this.props.fetchOpts
      );
      // `null` value removes `has_modules` filtering, however it is
      // not merged correctly by `extend`
      if (this.props.fetchOpts && this.props.fetchOpts.has_modules === null) {
        opts.has_modules = null;
      }
      if (this.props.fetchOpts && this.props.fetchOpts.is_published === null) {
        opts.is_published = null;
      }
      return TrainingPlansState.Store.getItems(opts);
    }
  },
  getDefaultProps() {
    return {
      entityName: 'plan'
    };
  },
  getNameAndValue() {
    const inner = this.getInnerComponent();
    if (!inner) return {};
    return inner.getNameAndValue();
  },
  isValid() {
    const inner = this.getInnerComponent();
    if (inner) {
      return inner.isValid();
    }
    if (this.props.required) return false;
    return true;
  },
  pending() {
    return containerUtils.defaultPending(this, EntitySearchableMultiSelectInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EntitySearchableMultiSelectInner, errors);
  }
};

const defaultEnrollmentGroupFetchOpts = {
  ordering: 'name',
  deactivated__isnull: true
};

export const defaultEnrollmentGroupContainerOpts = {
  listenTo: [EnrollmentGroupsState.Store],
  fetch: {
    entities() {
      const opts = _.extend(
        {
          limit: 0,
          fields: [$y.getFields(EntitySearchableMultiSelectInner, 'entities')]
        },
        defaultEnrollmentGroupFetchOpts,
        this.props.fetchOpts
      );
      // `null` value removes `has_modules` filtering, however it is
      // not merged correctly by `extend`
      return EnrollmentGroupsState.Store.getItems(opts);
    }
  },
  getDefaultProps() {
    return {
      entityName: 'enrollment group'
    };
  },
  getNameAndValue() {
    const inner = this.getInnerComponent();
    if (!inner) return {};
    return inner.getNameAndValue();
  },
  isValid() {
    const inner = this.getInnerComponent();
    if (inner) {
      return inner.isValid();
    }
    if (this.props.required) return false;
    return true;
  },
  pending() {
    return containerUtils.defaultPending(this, EntitySearchableMultiSelectInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EntitySearchableMultiSelectInner, errors);
  }
};

export function createEntitySelectContainer(innerComponent, opts) {
  const martyContainer = Marty.createContainer(innerComponent, opts);
  return martyContainer;
}

export const TrainingPlanSearchableMultiSelect = createEntitySelectContainer(
  EntitySearchableMultiSelectInner,
  defaultTrainingPlanContainerOpts
);
export const EnrollmentGroupSearchableMultiSelect = createEntitySelectContainer(
  EntitySearchableMultiSelectInner,
  defaultEnrollmentGroupContainerOpts
);
export const TrainingPlanTiles = createEntitySelectContainer(
  EntityTilesInner,
  defaultTrainingPlanContainerOpts
);
