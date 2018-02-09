import React from 'react';
import ReactDOM from 'react-dom';
import { fetch } from 'marty';

import Im from 'immutable';
import _ from 'lodash';
import RSVP from 'rsvp';

const ReactTestUtils = require('react-addons-test-utils');

import TestUtils from 'utilities/testing';

import CompanySettingsState from 'state/companysettings';

import { CompanySettingsTab } from '..';

const currentUser = TestUtils.getMockCurrentUser();

describe('CompanySettingsTabContent', () => {
  let component;
  let company,
    freeCompany,
    unlimitedCompany;
  let fakeCompanySettings;
  let submitButton;

  beforeEach(function (done) {
    fakeCompanySettings = Im.List([
      Im.Map({
        id: 1,
        host_whitelist_enabled: false,
        host_whitelist: '',
        freeform_address: ''
      })
    ]);

    unlimitedCompany = Im.Map({
      company_logo: 'img/1',
      company_url: 'http://google.com',
      id: 1,
      subscription: {
        is_paying_customer: true
      }
    });

    freeCompany = Im.Map({
      company_logo: 'img/1',
      company_url: 'http://google.com',
      id: 1,
      subscription: {
        is_paying_customer: false
      }
    });

    this.sandbox.stub(CompanySettingsState.ActionCreators, 'update').returns(RSVP.all([]));
    done();
  });

  describe('CompanySettingsTab', () => {
    describe('when company plan is not unlimited', () => {
      beforeEach(done => {
        component = TestUtils.renderIntoDocument(<CompanySettingsTab
          company={freeCompany}
          companySettings={fakeCompanySettings}
          currentUser={currentUser}
        />);
        done();
      });
    });
  });
});
