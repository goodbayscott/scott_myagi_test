import { fetch } from 'marty';
import React from 'react';
import ReactDOM from 'react-dom';
import Im from 'immutable';
import _ from 'lodash';
import sinon from 'sinon';

import { VIDEO_PAGE_TYPE, PDF_PAGE_TYPE } from 'core/constants';

import TestUtils from 'utilities/testing';

import ModuleAttemptState from 'state/module-attempts';

import { Page as PageContainer, ModuleAttemptPage, ModuleAttemptPagesContainer } from '../page';
import { Image } from 'components/common/image';
import { Page as VideoPage } from '../module-pages/video-page';
import { Page as PDFPage } from '../module-pages/pdf-page';

const ReactTestUtils = require('react-addons-test-utils');

const currentUser = TestUtils.getMockCurrentUser();

describe('PageContainer', () => {
  let component,
    node,
    moduleAttemptCreateSpy,
    module = Im.Map({
      id: 1,
      url: 'modules/1'
    }),
    trainingPlan = Im.Map({
      id: 1
    });

  beforeEach(function (done) {
    moduleAttemptCreateSpy = this.sandbox.spy(ModuleAttemptState.ActionCreators, 'create');
    const WrappedPageContainer = TestUtils.stubRouterContext(PageContainer, {
      moduleId: module.get('id'),
      trainingPlanId: trainingPlan.get('id')
    });
    component = TestUtils.renderIntoDocument(<WrappedPageContainer currentUser={currentUser} />);
    node = ReactDOM.findDOMNode(component);
    done();
  });

  it('generates a new module attempt on mount and passes it to `innerComponent`', () => {
    const data = moduleAttemptCreateSpy.lastCall.args[0];
    expect(data).to.exist;
    expect(data.module).to.contain(module.get('url'));
  });

  /*
    Skipping these tests as react-router upgrade makes it very difficult
    to hook into an cancel transitions :(
  */
  context.skip('user transition to a page', () => {
    context('user uses address box to go to new web page', () => {
      it('warns them', () => {
        // console.log(window.oldOnBeforeUnload({}));
        // debugger;
        expect(window.onbeforeunload({})).to.contain('If you leave this page');
        window.oldOnBeforeUnload = window.onbeforeunload;
        window.onbeforeunload = _.noop;
      });
    });

    context('user transitions to a new page within the webapp', () => {
      let confirmReturnVal = false,
        confirmCalled,
        aborted,
        confirmStub,
        transitionPath = 'somepath',
        mockTransition;

      beforeEach(function () {
        confirmCalled = false;
        aborted = false;
        confirmStub = this.sandbox.stub(window, 'confirm', () => {
          confirmCalled = true;
          return confirmReturnVal;
        });
        mockTransition = {
          abort: () => (aborted = true),
          path: transitionPath
        };
        PageContainer.willTransitionFrom(mockTransition);
      });

      it('warns them', () => {
        expect(confirmCalled).to.be.true;
      });

      context('user aborts the transition', () => {
        it('does not transition', () => {
          expect(aborted).to.be.true;
        });
      });

      context('user does not abort the transition', () => {
        before(() => {
          confirmReturnVal = true;
        });

        it('does transition', () => {
          expect(aborted).to.be.false;
        });
      });

      context('user transitions to `attempt-summary` page', () => {
        before(() => {
          transitionPath = 'attempts/123/';
        });

        it('does not warn user', () => {
          expect(confirmCalled).to.be.false;
          expect(aborted).to.be.false;
        });
      });
    });
  });
});

describe('ModuleAttemptPage', () => {
  let component,
    node,
    module = Im.Map({
      id: 1,
      url: 'modules/1',
      name: 'Module 1',
      pages: [
        {
          id: 1,
          url: 'page/1',
          type: VIDEO_PAGE_TYPE
        },
        {
          id: 2,
          url: 'page/2',
          type: PDF_PAGE_TYPE
        }
      ],
      training_plans: [
        {
          modules: [
            {
              id: 1,
              name: 'Module 1',
              successfully_completed_by_current_user: false,
              pages: [
                {
                  id: 1,
                  url: 'page/1',
                  type: VIDEO_PAGE_TYPE
                },
                {
                  id: 2,
                  url: 'page/2',
                  type: PDF_PAGE_TYPE
                }
              ]
            },
            {
              id: 2,
              name: 'Module 1',
              successfully_completed_by_current_user: false,
              pages: [
                {
                  id: 1,
                  url: 'page/1',
                  type: VIDEO_PAGE_TYPE
                },
                {
                  id: 2,
                  url: 'page/2',
                  type: PDF_PAGE_TYPE
                }
              ]
            }
          ]
        }
      ]
    }),
    moduleAttempt = Im.Map({
      training_plan: {
        id: 1,
        url: 'training_plans/1'
      },
      training_unit: {
        name: 'Training Unit 1'
      }
    }),
    moduleTrainingPlans = Im.List([
      Im.Map({
        training_plan: 'training_plans/1',
        module: {
          id: 1,
          successfully_completed_by_current_user: false,
          url: 'modules/1',
          pages: [
            {
              id: 1,
              url: 'page/1',
              type: VIDEO_PAGE_TYPE
            },
            {
              id: 2,
              url: 'page/2',
              type: PDF_PAGE_TYPE
            }
          ]
        }
      })
    ]),
    trainingPlan = Im.Map({
      id: 1,
      url: 'training_plans/1',
      owner: {
        company_logo: '/static/company_logo'
      }
    });

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<ModuleAttemptPage
      currentUser={currentUser}
      module={module}
      moduleAttempt={moduleAttempt}
      trainingPlan={trainingPlan}
      moduleTrainingPlans={moduleTrainingPlans}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('transitions to next page when requested by sub-pages', function () {
    const moduleAttemptPagesContainer = ReactTestUtils.findRenderedComponentWithType(
      component,
      ModuleAttemptPagesContainer
    );
    const goForward = this.sandbox.spy(moduleAttemptPagesContainer.refs.viewSequence, 'goForward');
    expect(goForward.called).to.be.false;
    moduleAttemptPagesContainer.goToNextPage();
    expect(goForward.called).to.be.true;
  });
});

describe('ModuleAttemptPagesContainer', () => {
  let component,
    node,
    module = Im.Map({
      id: 1,
      url: 'modules/1',
      name: 'Module 1',
      pages: [
        {
          id: 1,
          url: 'page/1',
          type: VIDEO_PAGE_TYPE
        },
        {
          id: 2,
          url: 'page/2',
          type: PDF_PAGE_TYPE
        }
      ]
    }),
    moduleAttempt = Im.Map({});

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<ModuleAttemptPagesContainer
      currentUser={currentUser}
      module={module}
      moduleAttempt={moduleAttempt}
    />);
    node = ReactDOM.findDOMNode(component);
  });

  it('renders correct components for page types', () => {
    const videoPage = ReactTestUtils.scryRenderedComponentsWithType(component, VideoPage)[0];
    expect(videoPage).to.exist;
    const pdfPage = ReactTestUtils.scryRenderedComponentsWithType(component, PDFPage)[0];
    expect(pdfPage).to.exist;
  });
});
