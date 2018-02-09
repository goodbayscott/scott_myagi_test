import { fetch } from 'marty';
import baby from 'babyparse';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import Im from 'immutable';

import TestUtils from 'utilities/testing';

import ModuleAttemptsDataframeState from 'state/module-attempts-dataframe';

import { PivotTablesTab } from '../pivot-tables-tab';
import { ScrollableDataTable as DataTable } from 'components/common/table';

import timeSeries from './timeseries';

const TIMESERIES_CSV_RESPONSE = Im.List(baby.parse(timeSeries).data.map(Im.List));
const currentUser = TestUtils.getMockCurrentUser();

describe('PivotTablesTab', () => {
  beforeEach(function () {
    this.sandbox
      .stub(ModuleAttemptsDataframeState.Store, 'getPivotTable')
      .returns(fetch.done(Im.List()));
  });

  it('displays line chart', done => {
    let tab = TestUtils.renderIntoDocument(<PivotTablesTab currentUser={currentUser} isActive />);

    let tables = ReactTestUtils.scryRenderedComponentsWithType(tab, DataTable);
    expect(tables.length).to.equal(0);

    ModuleAttemptsDataframeState.Store.getPivotTable.returns(fetch.done(Im.fromJS(TIMESERIES_CSV_RESPONSE)));

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(tab).parentNode);

    tab = TestUtils.renderIntoDocument(<PivotTablesTab currentUser={currentUser} isActive />);

    tables = ReactTestUtils.scryRenderedComponentsWithType(tab, DataTable);
    expect(tables.length).to.equal(1);
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(tab).parentNode);
    done();
  });
});
