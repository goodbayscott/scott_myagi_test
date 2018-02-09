import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import TestUtils from 'utilities/testing';

import { TrainingPlanModal } from '../index';
import { LessonCard } from 'components/common/lesson-card';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('ViewTrainingPlanModal', () => {
  let modal,
    modalContents,
    node,
    modalInner,
    transitionSpy = sinon.spy(),
    user = currentUser,
    editModalSpy = sinon.spy(),
    AddLessonModalSpy = sinon.spy(),
    modules = Im.List([
      Im.Map({
        name: 'Module1',
        is_attemptable: true,
        training_plans: [
          {
            id: 1,
            name: 'TrainingPlan1',
            description: ''
          }
        ],
        url: 'modules/1',
        id: 1,
        thumbnail_url: '/static/img/module/1'
      })
    ]),
    trainingPlan = Im.Map({
      id: 1,
      name: 'TrainingPlan1',
      description: '',
      owner: { url: 'company/1' }
    });

  const moduleTrainingPlans = modules.map(m =>
    Im.Map({
      module: m,
      training_plan: trainingPlan.get('url')
    }));

  const ViewTrainingPlanModalWithContext = TestUtils.stubRouterContext(
    TrainingPlanModal,
    undefined,
    undefined,
    {
      push: transitionSpy
    }
  );

  beforeEach(() => {
    modal = TestUtils.renderIntoDocument(<ViewTrainingPlanModalWithContext
      trainingPlan={trainingPlan}
      moduleTrainingPlans={moduleTrainingPlans}
      currentUser={user}
      editable
      attemptable
    />);
    modal.getInnerComponent().refs.modal.show();
    modalContents = modal.getInnerComponent().refs.modal.content;
    modalInner = modal.getInnerComponent().refs.modal;
  });

  it('displays modules', () => {
    const cards = ReactTestUtils.scryRenderedComponentsWithType(modalContents, LessonCard);
    expect(cards).to.have.length(1);
  });

  it('navigates to `new-module-attempt` when content is clicked', () => {
    const cards = ReactTestUtils.scryRenderedComponentsWithType(modalContents, LessonCard);
    const content = ReactTestUtils.scryRenderedDOMComponentsWithClass(cards[0], 'thumbnail')[0];
    ReactTestUtils.Simulate.click(content);
    expect(transitionSpy.called).to.be.true;
  });

  it("displays the plan's name", () => {
    expect(modalInner.header.props.header).to.contain(trainingPlan.get('name'));
  });
});

describe('LessonCard', () => {
  let card,
    node,
    transitionSpy = sinon.spy(),
    componentProps = Im.Map(),
    module = Im.Map({
      id: 1,
      name: 'Module1',
      description: '',
      thumbnail_url: 'thumb/1'
    }),
    trainingPlan = Im.Map({
      owner: { url: 'company/1' }
    }),
    user = currentUser;

  const ModuleCardWithContext = TestUtils.stubRouterContext(LessonCard, undefined, undefined, {
    push: transitionSpy
  });

  beforeEach(() => {
    card = TestUtils.renderIntoDocument(<ModuleCardWithContext
      currentUser={user}
      module={module}
      trainingPlan={trainingPlan}
      onTransition={_.noop}
      {...componentProps.toJS()}
    />);
    node = ReactDOM.findDOMNode(card);
  });

  it('displays module details', () => {
    expect(node.innerHTML).to.contain(module.get('name'));
    expect(node.innerHTML).to.contain(module.get('description'));
  });

  describe('when card is `attemptable`', () => {
    describe('when module is completed by current user', () => {
      before(() => {
        module = module.set('successfully_completed_by_current_user', true);
      });

      it('displays a "checkmark icon"', () => {
        const tickCircle = ReactTestUtils.scryRenderedDOMComponentsWithClass(
          card,
          'checkmark icon'
        );
        expect(tickCircle).length.to.be(1);
      });
    });
  });
});
