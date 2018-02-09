import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { Form, SubmitButton, TextInput } from '../index';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();
const VAL1 = 'val1';
const VAL2 = 'val2';

describe('<Form>', () => {
  let component,
    onSubmitAndValid,
    data = {
      [VAL1]: '1',
      [VAL2]: '2'
    },
    input1,
    input2,
    submitBtn,
    node;

  beforeEach(() => {
    onSubmitAndValid = sinon.spy();
    component = TestUtils.renderIntoDocument(<Form onSubmitAndValid={onSubmitAndValid}>
      <TextInput name={VAL1} required />
      <div>
        {/* Second input is nested to test traversal of children works correctly */}
        <TextInput name={VAL2} required />
      </div>
      <SubmitButton />
    </Form>);
    const inputs = ReactTestUtils.scryRenderedComponentsWithType(component, TextInput);
    input1 = inputs[0];
    input2 = inputs[1];
    const submitComponent = ReactTestUtils.findRenderedComponentWithType(component, SubmitButton);
    submitBtn = ReactTestUtils.findRenderedDOMComponentWithClass(submitComponent, 'submit-btn');
    node = ReactDOM.findDOMNode(component);
  });

  describe('when form is not valid', () => {
    it('does not submit anything', () => {
      ReactTestUtils.Simulate.click(submitBtn);
      expect(onSubmitAndValid.called).to.be.false;
    });
  });

  describe('when data is entered into the form', () => {
    beforeEach(() => {
      ReactTestUtils.Simulate.change(input1.refs.input, { target: { value: data[VAL1] } });
      ReactTestUtils.Simulate.change(input2.refs.input, { target: { value: data[VAL2] } });
    });

    it('submits all entered data', done => {
      // Need to delay because form updates is valid every 150 ms
      _.delay(() => {
        // Have commented this out and elected to just call `onSubmit directly`.
        // This is to fix issue with tests breaking unnecessarily on latest Chrome.
        // ReactTestUtils.Simulate.click(submitBtn);
        component.onSubmit();
        expect(Boolean(onSubmitAndValid.lastCall)).to.equal(true);
        const submittedData = onSubmitAndValid.lastCall.args[0];
        _.each(submittedData, (val, key) => expect(val).to.equal(data[key]));
        done();
      }, 200);
    });
  });
});
