import React from 'react';
import ReactDOM from 'react-dom';
import { fetch } from 'marty';

import Im from 'immutable';
import _ from 'lodash';

const ReactTestUtils = require('react-addons-test-utils');

import TestUtils from 'utilities/testing';
import { Tab } from 'components/common/tabs';

import UsersState from 'state/users';
import CompaniesState from 'state/companies';
import CompanySettingsState from 'state/companysettings';

import { Page } from '../page';

const currentUser = TestUtils.getMockCurrentUser();

describe('Settings Page', () => {
  let component;

  describe('when current user is admin', () => {
    beforeEach(function () {
      currentUser.get('learner').is_company_admin = true;

      const fakeCompanySettings = Im.Map({
        host_whitelist_enabled: false,
        host_whitelist: '',
        freeform_address: ''
      });

      this.sandbox.stub(CompaniesState.Store, 'getItem').returns(fetch.done(Im.Map()));
      this.sandbox
        .stub(CompanySettingsState.Store, 'getItems')
        .returns(fetch.done(Im.List([fakeCompanySettings])));

      component = TestUtils.renderIntoDocument(<Page currentUser={currentUser} />);
    });

    it('should render Company tab', () => {
      const tabs = ReactTestUtils.scryRenderedComponentsWithType(component, Tab);
      _.forEach(tabs, tab => {
        const html = ReactDOM.findDOMNode(tab).innerHTML;
        expect(html.includes('Company') || html.includes('Profile') || html.includes('Notifications')).to.be.true;
      });
    });
  });

  describe('when current user is not an admin', () => {
    beforeEach(() => {
      const user = Im.Map({
        learner: {
          is_company_admin: false
        }
      });

      currentUser.get('learner').is_company_admin = false;

      component = TestUtils.renderIntoDocument(<Page currentUser={currentUser} />);
    });

    it('should not render Company tab', () => {
      expect(ReactTestUtils.scryRenderedComponentsWithType(component, Tab).length).to.equal(2);
    });
  });
});
