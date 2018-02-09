import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import reactMixin from 'react-mixin';
import _ from 'lodash';
import Radium from 'radium';

import Style from 'style/index.js';
import containerUtils from 'utilities/containers';
import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import PageState from './pivot-tables-tab-state.jsx';

import { PivotTableProcessor } from 'utilities/dataframe';

import { SearchableSelect } from 'components/common/form/index.jsx';
import { ScrollableDataTable } from 'components/common/table.jsx';
import { DateRangePicker } from 'components/common/date-range-picker.jsx';
import { loadingSwitch, NoData } from 'components/common/loading';

import {
  INDEX_DESCRIPTORS,
  VALUE_DESCRIPTORS,
  EXTRA_TABLE_ATTRS
} from './pivot-tables-tab-constants.jsx';

import { remoteSearchMixinFactory } from 'components/common/search.jsx';

import { momentToISO } from 'utilities/time.js';
import { getDefaultFilter } from '../common';

const styles = {
  searchContainer: {
    paddingTop: 14,
    float: 'right',
    [Style.vars.media.get('mobile')]: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 14,
      paddingRight: 14,
      float: 'left'
    }
  },
  controlsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  leftControls: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  }
};

const getPtProcessorForCurSelection = function () {
  const indexDescs = INDEX_DESCRIPTORS[PageState.Store.getSelectedIndexDescKey()];
  const ptProcessor = new PivotTableProcessor(indexDescs, VALUE_DESCRIPTORS);
  return ptProcessor;
};

@reactMixin.decorate(remoteSearchMixinFactory(PageState.ActionCreators.setModuleAttemptSearch.bind(PageState.ActionCreators)))
@Radium
class PivotTablesTabInner extends React.Component {
  static propTypes = {
    headers: React.PropTypes.instanceOf(Im.List).isRequired,
    rows: React.PropTypes.instanceOf(Im.List).isRequired,
    currentIndexes: React.PropTypes.array.isRequired,
    isLoading: React.PropTypes.func,
    startDate: React.PropTypes.object.isRequired,
    endDate: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    isLoading: _.noop
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor(props, defaultProps) {
    super(props, defaultProps);
    this.state = {};
  }

  onDropdownChange = val => {
    PageState.ActionCreators.updateSelection(val);
    this.refs.searchInput.reset();
  };

  onDatePickerChange = data => {
    PageState.ActionCreators.updateDateRange(data.startDate, data.endDate);
    this.refs.searchInput.reset();
  };

  render() {
    const selectedIndex = EXTRA_TABLE_ATTRS[PageState.Store.getSelectedIndexDescKey()];
    const innerContent = loadingSwitch(
      this.props.isLoading(),
      this.props.rows,
      <ScrollableDataTable
        headers={this.props.headers}
        rows={this.props.rows}
        bodyHeight={null}
        exportEnabled
        exportButtonText={`Export ${this.props.rows.count()} rows as CSV`}
        onRowClick={r => selectedIndex && selectedIndex.onRowClick(r)}
        hideColumnIndex={selectedIndex && selectedIndex.hideColumnIndex}
      />,
      <NoData>
        There is no data available for this selection. Try using a different date range.
      </NoData>
    );
    const dropDownOpts = _.map(INDEX_DESCRIPTORS, (v, k) => ({
      value: k,
      label: k
    }));
    return (
      <div>
        <div style={styles.controlsContainer}>
          <div style={styles.leftControls}>
            <DateRangePicker
              containerStyle={{
                marginRight: '10px'
              }}
              initStartDate={this.props.startDate}
              initEndDate={this.props.endDate}
              onChange={this.onDatePickerChange}
            />
            <SearchableSelect
              name="groupingDescSelector"
              initialSelection={PageState.Store.getSelectedIndexDescKey()}
              options={dropDownOpts}
              onChange={this.onDropdownChange}
            />
          </div>
          {this.getSearchInput({ style: { container: styles.searchContainer } })}
        </div>
        <div style={{ clear: 'both', width: '100%', height: '1px' }} />
        {innerContent}
      </div>
    );
  }
}

export const PivotTablesTab = Marty.createContainer(PivotTablesTabInner, {
  getDefaultProps() {
    return {
      headers: Im.List(),
      rows: Im.List(),
      currentIndexes: [],
      startDate: PageState.Store.getStartDate(),
      endDate: PageState.Store.getEndDate()
    };
  },
  listenTo: [ModuleAttemptsDataframeState.Store, PageState.Store],
  fetch: {
    dataframe() {
      return ModuleAttemptsDataframeState.Store.getPivotTable(this.getCurrentFetchParams());
    }
  },
  getCurrentFetchParams() {
    // Used by the export data modal
    const ptProcessor = getPtProcessorForCurSelection();

    let params = _.extend(
      {
        indexes: ptProcessor.getIndexes(),
        values: ptProcessor.getValues(),
        agg_funcs: ptProcessor.getAggFuncs(),
        // Without this, when average score for a user is NaN (i.e. they have not answer any questions),
        // then user will see NaN. Thinking is that it is better to just show 0 instead.
        fill_na: 0,
        start_time__gte: momentToISO(PageState.Store.getStartDate()),
        start_time__lt: momentToISO(PageState.Store.getEndDate())
      },
      getDefaultFilter(this.props.currentUser)
    );
    const search = PageState.Store.getModuleAttemptSearch();
    if (search) {
      params = _.extend(params, { search });
    }
    return params;
  },
  getFetchURL() {
    // Used by the export data modal
    return ModuleAttemptsDataframeState.Store.getDataframeURL({
      list_route: 'to_pivot_table'
    });
  },

  done(results) {
    const ptProcessor = getPtProcessorForCurSelection();
    const headers = ptProcessor.getHeaders(results.dataframe);
    const rows = ptProcessor.getRows(results.dataframe);
    return (
      <PivotTablesTabInner
        ref="innerComponent"
        headers={headers}
        rows={rows}
        currentIndexes={ptProcessor.getIndexes()}
        startDate={PageState.Store.getStartDate()}
        endDate={PageState.Store.getEndDate()}
      />
    );
  },
  pending() {
    return containerUtils.defaultPending(this, PivotTablesTabInner);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, PivotTablesTabInner, errors);
  }
});
