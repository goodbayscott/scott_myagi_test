import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import ModuleAttemptState from 'state/module-attempts';

import { Page as PageContainer, AttemptSummaryPageContent } from '../page';
import OverallOutcomeBox from '../outcome-box';
import StatsBox from '../stats-box';
import { Page as QuestionSetPageAttemptSummary } from 'components/module-attempt/module-pages/question-set-page/attempt-summary';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('AttemptSummaryPageContent', () => {
  const moduleAttemptInfo = {
    id: 1,
    url: 'module_attempts/1',
    page_attempts: [
      {
        type: 'questionsetpageattempt',
        id: 1
      }
    ],
    module: {
      current_user_completion_count: 1
    }
  };
  let component,
    node,
    transitionSpy = sinon.spy(),
    trainingPlan = {
      id: 1,
      url: 'training_plans/1',
      modules: [
        {
          id: 1,
          successfully_completed_by_current_user: false,
          url: 'modules/1',
          training_plans: ['training_plans/1']
        },
        {
          id: 2,
          successfully_completed_by_current_user: false,
          url: 'modules/2',
          training_plans: ['training_plans/1']
        }
      ]
    },
    module = Im.Map({
      id: 1,
      url: 'modules/1',
      training_plans: ['training_plans/1']
    }),
    moduleAttempt = Im.Map({
      ...moduleAttemptInfo,
      ...trainingPlan,
      next_module_info: { from_current_plan: true, mod_id: 2, plan_id: 2 }
    }),
    moduleAttemptNoNextMod = Im.Map({
      ...moduleAttemptInfo,
      ...trainingPlan,
      next_module_info: null
    });

  const MockComponent = TestUtils.stubRouterContext(
    AttemptSummaryPageContent,
    undefined,
    undefined,
    {
      push: transitionSpy
    }
  );

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<MockComponent
      currentUser={currentUser}
      moduleAttempt={moduleAttempt}
      module={module}
      trainingPlan={trainingPlan}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('renders summary views for `page_attempts`', () => {
    ReactTestUtils.findRenderedComponentWithType(component, QuestionSetPageAttemptSummary);
  });

  describe('render action buttons', () => {
    let homeBtn,
      nextBtn,
      repeatBtn;

    beforeEach(() => {
      homeBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'basic home')[0];
      repeatBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'repeat-btn')[0];
      nextBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'next-btn')[0];
    });

    describe('when module is not last', () => {
      it('shows all buttons', () => {
        expect(homeBtn).to.exist;
        expect(repeatBtn).to.exist;
        expect(nextBtn).to.exist;
      });
    });

    describe('when next module is null', () => {
      beforeEach(() => {
        component = TestUtils.renderIntoDocument(<MockComponent
          currentUser={currentUser}
          moduleAttempt={moduleAttemptNoNextMod}
          module={module}
          trainingPlan={trainingPlan}
        />);
      });

      it.only('next button to not exist if there is not next lesson', () => {
        nextBtn = ReactTestUtils.scryRenderedDOMComponentsWithClass(component, 'next-btn')[0];
        expect(nextBtn).to.not.exist;
      });
    });

    describe('when next module button is clicked', () => {
      beforeEach(() => {
        ReactTestUtils.Simulate.click(nextBtn);
      });

      it('goes to next module', () => {
        expect(transitionSpy.called).to.be.true;
      });
    });
  });
});

describe('OverallOutcomeBox', () => {
  let component,
    node,
    moduleAttempt = Im.Map({
      id: 1,
      url: 'module_attempts/1',
      page_attempts: [],
      is_successful: true,
      training_plan: {
        modules: [{ id: 1 }, { id: 2 }]
      }
    }),
    module = Im.Map({
      id: 1,
      url: 'modules/1'
    });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<OverallOutcomeBox currentUser={currentUser} moduleAttempt={moduleAttempt} module={module} />);
    node = ReactDOM.findDOMNode(component);
  });

  describe('when the attempt is successful', () => {
    it('displays "Passed"', () => {
      expect(node.innerHTML).to.contain('passed');
    });
  });

  describe('when the attempt is not successful', () => {
    before(() => {
      moduleAttempt = moduleAttempt.set('is_successful', false);
    });

    it('displays "Try again"', () => {
      expect(node.innerHTML).to.contain('try_again');
    });

    after(() => {
      moduleAttempt = moduleAttempt.set('is_successful', true);
    });
  });

  describe('when all modules in the plan are completed', () => {
    before(() => {
      moduleAttempt.get('training_plan').modules = [
        { successfully_completed_by_current_user: true }
      ];
    });

    it('displays all complete message', () => {
      const completedEl = ReactTestUtils.scryRenderedDOMComponentsWithClass(
        component,
        'completed-text'
      );
      expect(completedEl.length).to.equal(1);
    });
  });
});

describe('StatsBox', () => {
  let component,
    node,
    moduleAttempt = Im.Map({
      id: 1,
      url: 'module_attempts/1',
      page_attempts: [],
      percentage_score: 50
    }),
    module = Im.Map({
      id: 1,
      url: 'modules/1',
      pass_percentage: 75
    });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<StatsBox currentUser={currentUser} moduleAttempt={moduleAttempt} module={module} />);
    node = ReactDOM.findDOMNode(component);
  });

  it('displays `percentage_score`', () => {
    expect(node.innerHTML).to.contain(moduleAttempt.get('percentage_score'));
  });

  it('displays `pass_percentage`', () => {
    expect(node.innerHTML).to.contain(module.get('pass_percentage'));
  });
});
