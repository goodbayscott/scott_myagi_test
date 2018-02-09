import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import {
  Page as PageContainer,
  QuestionSetPage,
  QuestionSetPageContent,
  StatusBar
} from '../index';
import { MultichoiceQuestion } from '../question-types/multichoice';
import { ShortAnswerQuestion } from '../question-types/short-answer';
import { QuestionSetPageAttemptSummaryContent, QuestionAttemptSummary } from '../attempt-summary';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('QuestionSetPageContent', () => {
  let component,
    node,
    onCompleteCalled = false,
    page = Im.Map({
      id: 1,
      url: 'page/1',
      question_set: {
        questions: [
          { type: 'multichoicequestion', question: 'A question', answer: 'A' },
          { type: 'shortanswerquestion', question: 'A question', answer: 'A' }
        ]
      }
    }),
    pageAttempt = Im.Map();

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<QuestionSetPageContent
      page={page}
      pageAttempt={pageAttempt}
      onComplete={() => (onCompleteCalled = true)}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('updates counters on question submit and calls `onComplete` when done', () => {
    const statusBar = ReactTestUtils.findRenderedComponentWithType(component, StatusBar);
    expect(statusBar.props.questionNumber).to.equal(1);
    expect(statusBar.props.numCorrect).to.equal(0);
    component.onQuestionSubmit(true);
    expect(statusBar.props.questionNumber).to.equal(2);
    expect(statusBar.props.numCorrect).to.equal(1);
    component.onQuestionSubmit(true);
    expect(onCompleteCalled).to.be.true;
  });

  it('renders correct question components for question types', () => {
    ReactTestUtils.findRenderedComponentWithType(component, MultichoiceQuestion);
    ReactTestUtils.findRenderedComponentWithType(component, ShortAnswerQuestion);
  });
});

describe('QuestionSetPageAttemptSummaryContent', () => {
  let component,
    node,
    onCompleteCalled = false,
    pageAttempt = Im.Map({
      question_attempts: [
        {
          question: { question: 'A question', answer: 'a' },
          answer: 'b'
        }
      ]
    });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<QuestionSetPageAttemptSummaryContent pageAttempt={pageAttempt} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays question attempts', () => {
    const questionAttempts = ReactTestUtils.scryRenderedComponentsWithType(
      component,
      QuestionAttemptSummary
    );
    expect(questionAttempts).to.have.length(pageAttempt.get('question_attempts').length);
  });
});
