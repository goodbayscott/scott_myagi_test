import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { Page as PageContainer, PDFPage } from '../index';

import PDF from 'components/common/pdf';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('PDFPage', () => {
  let component,
    node,
    page = Im.Map({
      id: 1,
      url: 'module_attempts/1',
      pdf_file: 'pdf/1'
    });
  module = Im.Map({
    pages: [{ id: 2 }, { id: 1 }]
  });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<PDFPage page={page} module={module} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays PDF via `PDF` component', () => {
    const pdfComponent = ReactTestUtils.findRenderedComponentWithType(component, PDF);
    expect(pdfComponent.props.url).to.equal(page.get('pdf_file'));
  });
});
