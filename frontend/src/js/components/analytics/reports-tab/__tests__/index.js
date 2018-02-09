import _ from 'lodash';
import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-addons-test-utils';
import Im from 'immutable';

import TestUtils from 'utilities/testing';

import ReportConfigsState from 'state/report-configs';
import ReportsState from 'state/reports';

import { TabContent as ReportsTab } from '../index';
import { ReportConfig } from '../report-config';

const currentUser = TestUtils.getMockCurrentUser();

describe('ReportsTab', () => {
  let tab,
    node;
  const reportConfig1 = Im.Map({
    name: 'Test Report 1'
  });
  const reportConfig2 = Im.Map({
    name: 'Test Report 2'
  });

  beforeEach(function () {
    this.sandbox
      .stub(ReportConfigsState.Store, 'getItems')
      .returns(fetch.done(Im.List([reportConfig1, reportConfig2])));

    this.sandbox.stub(ReportConfigsState.Store, 'getItem').returns(fetch.done(reportConfig1));

    tab = TestUtils.renderIntoDocument(<ReportsTab currentUser={currentUser} />);

    node = ReactDOM.findDOMNode(tab);
  });

  it('displays available report configs', done => {
    expect(node.innerHTML).to.contain(reportConfig1.get('name'));
    expect(node.innerHTML).to.contain(reportConfig2.get('name'));
    done();
  });
});

describe('ReportConfig', () => {
  let component,
    node;

  const reportConfig1 = Im.Map({
    id: 1,
    name: 'Test Report 1'
  });

  let reports = Im.List();

  beforeEach(function () {
    this.sandbox.stub(ReportConfigsState.Store, 'getItem').returns(fetch.done(reportConfig1));

    this.sandbox.stub(ReportsState.Store, 'getItems').returns(fetch.done(reports));

    component = TestUtils.renderIntoDocument(<ReportConfig currentUser={currentUser} reportConfigId={reportConfig1.get('id')} />);

    node = ReactDOM.findDOMNode(component);
  });

  describe('when no reports are available', () => {
    before(() => {
      reports = Im.List();
    });

    it('displays message when no reports are available', done => {
      expect(node.innerHTML).to.contain('A version of this report is still being generated');
      done();
    });
  });

  describe('when reports are available', () => {
    const report = Im.Map({
      plot_set: [
        {
          data: [{ x: ['test'], y: [1], type: 'scatter' }],
          layout: {}
        }
      ]
    });

    before(() => {
      reports = Im.List([report]);
    });

    it('displays the report plots', done => {
      expect(node.innerHTML).to.contain(report.get('plot_set')[0].plot_url);
      done();
    });
  });
});
