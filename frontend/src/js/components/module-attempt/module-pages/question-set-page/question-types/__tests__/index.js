import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { MultichoiceQuestion } from '../multichoice';
import { ShortAnswerQuestion } from '../short-answer';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('MultichoiceQuestion', () => {
  let component,
    node,
    onCompleteCalled = false,
    question = Im.Map({
      type: 'multichoicequestion',
      question: 'A question',
      answer: 'a',
      option_a: '1',
      option_b: '2',
      option_c: '3'
    }),
    pAttempt = Im.Map({
      type: 'questionpagetype',
      url: 'page_attempt/1'
    });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<MultichoiceQuestion question={question} pageAttempt={pAttempt} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('allows options to be selected', () => {
    expect(component.state.selectedOption).to.not.exist;
    const optionAEl = ReactTestUtils.findRenderedDOMComponentWithClass(component, 'option-a');
    ReactTestUtils.Simulate.click(optionAEl);
    expect(component.state.selectedOption).to.equal('a');
  });
});
