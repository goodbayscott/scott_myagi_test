import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import moment from 'moment-timezone';

import { t } from 'i18n';

import AreasState from 'state/areas';
import UsersState from 'state/users';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import Style from 'style';

import containerUtils from 'utilities/containers';
import { momentToISO } from 'utilities/time';
import $y from 'utilities/yaler';
import { getHeaders, getRows } from 'utilities/table';
import { TimeseriesProcessor, PivotTableProcessor } from 'utilities/dataframe';
import { AttemptStatsContainer } from 'components/common/stats';

import parsing from 'components/analytics/parsing';

import { LoadingContainer } from 'components/common/loading';
import { Modal } from 'components/common/modal';
import { Form, SubmitButton } from 'components/common/form/index';
import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { PrimaryButton, SecondaryButton } from 'components/common/buttons';
import { AreaDetailsForm } from '../area-details-form';
import { ScrollableDataTable } from 'components/common/table';
import { Dropdown } from 'components/common/dropdown';
import { TeamSearchableSelect } from 'components/common/team-searchable-select';

const AREA_STATS_PERIOD = 14;
const NUMBER_OF_ATTEMPTS = 'Number of Attempts';
const AVG_SCORE = 'Average Score (%)';
const ACTIVE_USERS = 'Active Users (%)';
const START_TIME = 'Start Time';
const TIMESERIES_INDEX_DESC = {
  attr: 'start_time',
  name: START_TIME
};
const TIMESERIES_FREQ = 'D';
const TIMESERIES_VALUE_DESCRIPTORS = [
  {
    attr: 'percentage_score',
    aggFunc: 'mean',
    name: AVG_SCORE,
    parseFunc: parsing.toOneDecimalPlace
  },
  {
    attr: 'total_count',
    aggFunc: 'sum',
    name: NUMBER_OF_ATTEMPTS,
    parseFunc: parsing.toTruncatedInt
  },
  {
    attr: 'user__id',
    // This is a sum initially, however it is converted to a
    // percentage of area members in the stat component
    aggFunc: 'nunique',
    name: ACTIVE_USERS,
    parseFunc: parsing.toTruncatedInt
  }
];

const PIVOT_TABLE_INDEX_DESCRIPTORS = [
  { attr: 'user__learner__learnergroups__areas__id', name: 'Area' }
];

function getAreaStatsTsProcessor() {
  const tsProcessor = new TimeseriesProcessor(TIMESERIES_INDEX_DESC, TIMESERIES_VALUE_DESCRIPTORS);
  return tsProcessor;
}

function getAreaStatsPtProcessor() {
  const ptProcessor = new PivotTableProcessor(
    PIVOT_TABLE_INDEX_DESCRIPTORS,
    TIMESERIES_VALUE_DESCRIPTORS
  );
  return ptProcessor;
}

const styles = {
  dropdownMenu: {
    width: '125px'
  },
  dropItem: {},
  settingsIcon: {
    color: Style.vars.colors.get('darkGrey'),
    cursor: 'pointer',
    fontSize: 18
  },
  removeAreaIcon: {
    color: Style.vars.colors.get('darkGrey'),
    fontSize: 16,
    float: 'right'
  },
  container: {
    margin: 20,
    marginTop: 40
  }
};

class AddTeamModal extends React.Component {
  static data = {
    area: {
      fields: ['learnergroup_set.url']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  onSubmit = data => {
    const lgSet = this.props.area.get('learnergroup_set').map(lg => lg.url);
    lgSet.push(data.areaURL);
    AreasState.ActionCreators.update(
      this.props.area.get('id'),
      { learnergroup_set: lgSet },
      {
        query: { fields: $y.getFields(AreaPage, 'area') },
        updateOptimistically: false
      }
    );
    this.context.displayTempPositiveMessage({ heading: 'Team added to area' });
    this.hide();
  };

  show() {
    this.refs.modal.show();
  }

  hide() {
    this.refs.modal.hide();
  }

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick={false} header={t('add_team')}>
        <div className="content">
          <Form onSubmitAndValid={this.onSubmit}>
            <TeamSearchableSelect
              name="areaURL"
              company={Im.Map(this.props.currentUser.get('learner').company)}
            />
            <SubmitButton />
          </Form>
        </div>
      </Modal>
    );
  }
}

class EditAreaModal extends React.Component {
  static data = {
    area: {
      required: true,
      fields: $y.getFields(AreaDetailsForm, 'area')
    }
  };

  static propTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  show = () => {
    this.refs.modal.show();
  };

  hide = () => {
    this.refs.modal.hide();
  };

  render() {
    return (
      <Modal ref="modal" closeOnDimmerClick header={t('edit_area')}>
        <div className="content">
          <AreaDetailsForm
            currentUser={this.props.currentUser}
            onSubmit={this.hide}
            area={this.props.area}
          />
        </div>
      </Modal>
    );
  }
}

class TeamsCollection extends React.Component {
  static data = {
    teams: {
      many: true,
      fields: ['name', 'description', 'members']
    },
    area: {
      fields: ['name']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayGenericRequestFailureMessage: React.PropTypes.func.isRequired
  };

  static tableDataMapping = {
    'Team Name': t => t.get('name'),
    Description: t => t.get('description'),
    Users: t => t.get('members').length,
    Actions: (area, cxt) => {
      const removeArea = _.partial(cxt.showRemoveAreaModal, area);
      return (
        <Dropdown className="ui top left pointing dropdown">
          <i className="setting icon" style={styles.settingsIcon} />
          <div className="menu" style={styles.dropdownMenu}>
            <div className="ui item" style={styles.dropItem} onClick={removeArea}>
              {t('remove')}
              <i className="remove icon" style={styles.removeAreaIcon} />
            </div>
          </div>
        </Dropdown>
      );
    }
  };

  showRemoveAreaModal = area => {
    this.setState({ editArea: area });
    _.defer(this.refs.removeAreaModal.show.bind(this.refs.removeAreaModal));
  };

  onRemoveAreaConfirm = () => {
    let lgSet = this.props.area.get('learnergroup_set').map(lg => lg.url);
    lgSet = _.filter(lgSet, url => url !== this.state.editArea.get('url'));
    AreasState.ActionCreators.update(
      this.props.area.get('id'),
      { learnergroup_set: lgSet },
      {
        query: { fields: $y.getFields(AreaPage, 'area') },
        updateOptimistically: false
      }
    );
    this.context.displayTempPositiveMessage({ heading: 'Team removed from area' });
    this.refs.removeAreaModal.hide();
  };

  render() {
    const headers = getHeaders(this.constructor.tableDataMapping);
    const rows = getRows(this.constructor.tableDataMapping, this.props.teams, this);

    return (
      <div>
        <ScrollableDataTable
          rows={rows}
          headers={headers}
          onRowClick={this.onRowClick}
          bodyHeight={null}
        />
        <Modal
          ref="removeAreaModal"
          header={t('are_you_sure_remove_area', { name: this.props.area.get('name') })}
          onConfirm={this.onRemoveAreaConfirm}
          basic
        />
      </div>
    );
  }
}

export class AreaPage extends React.Component {
  static data = {
    area: {
      required: false,
      fields: [
        'id',
        'url',
        $y.getFields(AddTeamModal, 'area'),
        $y.getFields(EditAreaModal, 'area'),
        $y.getFields(TeamsCollection, 'area'),
        $y.getFields(TeamsCollection, 'teams', 'learnergroup_set')
      ]
    }
  };

  static propTypes = $y.propTypesFromData(AreaPage, {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  constructor() {
    super();
    this.state = {
      showStats: false
    };
  }

  showEditAreaModal = () => {
    this.refs.editAreaModal.show();
  };

  showAddTeamModal = () => {
    this.refs.addAreaModal.show();
  };

  toggleShowStats = () => {
    // If area has not loaded, then don't do anything
    if (!this.props.area.get('id')) return;
    this.setState({ showStats: !this.state.showStats });
  };

  render() {
    const learner = this.props.currentUser.get('learner');
    let heading;
    let subHeading;
    if (this.props.area) {
      const managers = this.props.area.get('managers');
      heading = this.props.area.get('name');
      // Check if there area managers & that the data has loaded by
      // checking if there is a first name.
      if (managers.length && managers[0].first_name) {
        const managerNames = [];
        managers.forEach(manager => {
          managerNames.push(`${manager.first_name} ${manager.last_name}`);
        });
        const namesString = managerNames.join(', ');
        subHeading = `Managed by ${namesString}`;
      }
    }
    const backOpts = {
      text: 'Areas',
      route: 'people',
      query: { tab: 'areas' }
    };

    return (
      <Panel>
        <BoxHeader
          heading={heading}
          subHeading={subHeading}
          style={{ overflow: 'visible' }}
          backOpts={backOpts}
        >
          <PrimaryButton style={{ float: 'right' }} onClick={this.showAddTeamModal}>
            {t('add_team')}
          </PrimaryButton>
          <SecondaryButton style={{ float: 'right' }} onClick={this.showEditAreaModal}>
            {t('edit_details')}
          </SecondaryButton>

          <button
            className="ui button right floated show-stats-btn"
            style={{ background: 'none' }}
            onClick={this.toggleShowStats}
          >
            {this.state.showStats ? 'Hide Analytics' : 'View Analytics'}
          </button>

          <div style={{ clear: 'both' }} />
          {this.state.showStats ? (
            <LoadingContainer
              loadingProps={[
                this.props.area,
                this.props.users,
                this.props.areaAttemptTimeseries,
                this.props.areaAttemptStats
              ]}
              createComponent={() => (
                <AttemptStatsContainer
                  attemptStats={this.props.areaAttemptStats}
                  attemptTimeseries={this.props.areaAttemptTimeseries}
                  users={this.props.users}
                  show={this.state.showStats}
                  entityName="Area"
                  query="user__learner__learnergroups__areas__id"
                />
              )}
              shouldRenderNoData={() => false}
            />
          ) : null}
        </BoxHeader>
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.area]}
            createComponent={() => {
              const teams = Im.List(this.props.area.get('learnergroup_set').map(Im.Map));
              return <TeamsCollection area={this.props.area} teams={teams} />;
            }}
            shouldRenderNoData={() => {
              if (this.props.area) {
                if (this.props.area.get('learnergroup_set').length === 0) {
                  return true;
                }
                return false;
              }
              return true;
            }}
            noDataText={t('no_teams_available')}
          />
        </BoxContent>
        <EditAreaModal
          ref="editAreaModal"
          currentUser={this.props.currentUser}
          area={this.props.area}
        />
        <AddTeamModal
          ref="addAreaModal"
          currentUser={this.props.currentUser}
          area={this.props.area}
        />
      </Panel>
    );
  }
}

export const Page = Marty.createContainer(AreaPage, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  listenTo: [AreasState.Store, ModuleAttemptsDataframeState.Store],

  getStatPeriodStart() {
    if (!this._periodStart) {
      this._periodStart = moment().subtract(AREA_STATS_PERIOD, 'days');
    }
    return this._periodStart;
  },

  getStatPeriodEnd() {
    if (!this._periodEnd) {
      this._periodEnd = moment();
    }
    return this._periodEnd;
  },

  getAreaPivotTableFetchParams() {
    const ptProcessor = getAreaStatsPtProcessor();
    return {
      indexes: ptProcessor.getIndexes(),
      values: ptProcessor.getValues(),
      agg_funcs: ptProcessor.getAggFuncs(),
      fill_na: 0,
      start_time__gte: momentToISO(this.getStatPeriodStart()),
      // Because we are restricting to one area and data is indexed by area name,
      // should always get back a table with only one row (at most).
      user__learner__learnergroups__areas: this.context.routeParams.areaId,
      user__is_active: true
    };
  },

  getAreaTimeseriesFetchParams() {
    const tsProcessor = getAreaStatsTsProcessor();
    return {
      index: tsProcessor.getIndex(),
      values: tsProcessor.getValues(),
      freq: TIMESERIES_FREQ,
      agg_funcs: tsProcessor.getAggFuncs(),
      group_by: tsProcessor.getGroupBy(),
      // Without this, graphs will not work in instance where average score for a day
      // is `NaN`
      fill_na: 0,
      start_time__gte: momentToISO(this.getStatPeriodStart()),
      fill_range_start: momentToISO(this.getStatPeriodStart()),
      fill_range_end: momentToISO(this.getStatPeriodEnd()),
      user__learner__learnergroups__areas: this.context.routeParams.areaId,
      user__is_active: true
    };
  },

  fetch: {
    area() {
      return AreasState.Store.getItem(this.context.routeParams.areaId, {
        fields: $y.getFields(AreaPage, 'area')
      });
    },

    users() {
      return UsersState.Store.getItems(
        {
          limit: 0,
          learner__learnergroups__areas: this.context.routeParams.areaId,
          is_active: true
        },
        {
          dependantOn: AreasState.Store
        }
      );
    },

    areaAttemptTimeseries() {
      return ModuleAttemptsDataframeState.Store.getTimeseries(this.getAreaTimeseriesFetchParams());
    },

    areaAttemptStats() {
      return ModuleAttemptsDataframeState.Store.getPivotTable(this.getAreaPivotTableFetchParams());
    }
  },

  pending() {
    return containerUtils.defaultPending(this, AreaPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, AreaPage, errors);
  }
});
