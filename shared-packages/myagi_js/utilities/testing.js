import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import Im from 'immutable';
import async from 'async';
import _ from 'lodash';
import sinon from 'sinon';
import extend from 'lodash/object/extend';

let server = null;
const renderedComponents = [];
let suppressedErrors;
let suppressedWarnings;
const originalCreateElement = React.createElement;

export default {
  /*
  Useful functions for testing.
*/
  server: {
    /*
    Light wrapper around Sinon to make common
    tasks simpler.
  */
    create() {
      server = sinon.fakeServer.create();
    },

    restore() {
      server.restore();
    },

    get() {
      return server;
    },

    respondWithInFuture(url, response, headers, status) {
      /*
      Basically a wrapper around Sinon server respondWith.
      Added InFuture to make it clear that respond needs to be called.
    */

      if (!server) {
        return console.warn('Server has not been set up!');
      }

      response = [
        status || 200,
        extend({ 'Content-Type': 'application/json' }, headers),
        JSON.stringify(response)
      ];

      server.respondWith(url, response);
    },

    respondWith() {
      /*
      Like respondWithInFuture but triggers respond straight away.
    */
      this.respondWithInFuture.apply(this, arguments);
      // Trigger respond immediately
      server.respond();
    },

    respond() {
      server.respond();
    }
  },

  getMockCurrentUser(learner) {
    // TODO - Add props to this as necessary
    return Im.Map({
      id: 1,
      url: 'users/1',
      first_name: 'User',
      last_name: '1',
      full_name: 'User 1',
      notification_settings: 'notification_settings/123/',
      feature_flags: [],
      badge_awards: [
        {
          badge: {
            name: 'test badge',
            badge_image: 'badges/1'
          },
          unique_codes: ['1', '2', '3', '4']
        }
      ],
      learner: {
        id: 1,
        url: 'learner/1',
        average_percentage_score: 50,
        num_modules_completed: 10,
        num_training_plans_completed: 5,
        company_rank: 123,
        learnergroup_rank: 10,
        progress: 50.0,
        badges: [{ badge_image: 'badges/1' }],
        company: {
          name: 'TestCo',
          id: 123,
          url: 'company/123',
          companysettings: {
            users_can_invite_others_to_join: true
          },
          open_connection_request_count: {
            incoming: 1,
            outgoing: 2
          },
          subscription: {
            shared_content_enabled: true,
            analytics_enabled: true,
            groups_and_areas_enabled: true
          }
        },
        ...(learner || {})
      }
    });
  },

  stubAppContext(Component, props, stubs) {
    /*
    Stubs out context which is provided by standard
    App component.
  */
    const appStubs = {};

    extend(
      appStubs,
      {
        displayTempPositiveMessage() {},
        displayTempNegativeMessage() {},
        displayGenericRequestFailureMessage() {},
        router: {},
        intl: {},
        location: {},
        currentUser: {}
      },
      stubs
    );

    return React.createClass({
      childContextTypes: {
        displayTempPositiveMessage: React.PropTypes.func.isRequired,
        displayTempNegativeMessage: React.PropTypes.func.isRequired,
        displayGenericRequestFailureMessage: React.PropTypes.func.isRequired,
        router: React.PropTypes.object,
        currentUser: React.PropTypes.instanceOf(Im.Map)
      },
      getChildContext() {
        return {
          displayTempPositiveMessage: appStubs.displayTempPositiveMessage,
          displayTempNegativeMessage: appStubs.displayTempNegativeMessage,
          displayGenericRequestFailureMessage: appStubs.displayGenericRequestFailureMessage,
          router: appStubs.router,
          currentUser: appStubs.currentUser
        };
      },
      getInnerComponent() {
        return this.refs.innerComponent;
      },
      render() {
        return <Component ref="innerComponent" {...props} {...this.props} />;
      }
    });
  },

  stubRouterContext(Component, currentParams, props, stubs) {
    /*
    Adapted from https://gist.github.com/rande/cbdd61017f4e2a83b2eb
  */

    return React.createClass({
      childContextTypes: {
        router: React.PropTypes.object,
        routeParams: React.PropTypes.object,
        location: React.PropTypes.object
      },

      getChildContext() {
        return {
          router: extend(
            {},
            {
              push() {}
            },
            stubs
          ),
          routeParams: currentParams,
          location: {
            query: {}
          }
        };
      },

      getInnerComponent() {
        return this.refs.innerComponent;
      },

      render() {
        return <Component ref="innerComponent" {...props} {...this.props} />;
      }
    });
  },

  renderIntoDocument(Component) {
    /*
    Basic wrapper around renderIntoDocument func from react test utils.
    Keeps track of rendered components so that they can easily be unmounted using
    unmountAll.
  */
    const instance = ReactTestUtils.renderIntoDocument(Component);
    renderedComponents.push(instance);
    return instance;
  },

  unmountAll() {
    /*
    Unmounts all rendered components.
  */
    renderedComponents.forEach(instance => {
      if (instance) {
        try {
          ReactDOM.unmountComponentAtNode(instance.findDOMNode().parentNode);
        } catch (err) {
          // Silently fail. Components which failed to render correctly will
          // cause issues when unmountComponentAtNode is called. This breaks all
          // subsequent tests.
        }
      }
    });
    renderedComponents.splice(0, renderedComponents.length);
  },

  mockWaffle() {
    window.waffle = {
      flag_is_active() {
        return true;
      }
    };
  },

  mockAnalytics() {
    window.analytics = {
      track: _.noop,
      identify: _.noop,
      group: _.noop,
      page: _.noop
    };
  },

  suppressConsole() {
    suppressedErrors = [];
    suppressedWarnings = [];
    console.error = err => suppressedErrors.push(err);
    console.warn = warning => suppressedWarnings.push(warning);
  },

  outputConsoleSuppressionStats() {
    console.log(`${suppressedErrors.length} console errors were suppressed`);
    console.log(`${suppressedWarnings.length} console warnings were suppressed`);
  },

  _stubCreateElement(sandbox) {
    // `createElement` is already stubbed
    if (React.createElement.restore) return;
    // Should contain objects with `originalComponent` and `mockComponent`
    // props
    sandbox.__mockedComponents = [];
    sandbox.stub(React, 'createElement').callsFake(function (component, props) {
      const mockedComponent = _.find(sandbox.__mockedComponents, {
        originalComponent: component
      });
      if (!mockedComponent) {
        return originalCreateElement.apply(React, arguments);
      }
      const mockFactory = React.createFactory(mockedComponent.mockComponent);
      const componentFactory = React.createFactory(component);
      const displayName = componentFactory().type.displayName;
      if (displayName) {
        if (props.className) props.className = `${props.className} ${displayName}`;
        else props.className = displayName;
      }
      return mockFactory(props);
    });
  },

  mockComponent(sandbox, mockedComponent, stubs) {
    /*
    Allows multiple components to be mocked during testing.
  */
    this._stubCreateElement(sandbox);
    const mockComponent = React.createClass(extend(
      {
        render() {
          return <div />;
        }
      },
      stubs
    ));
    if (_.includes(sandbox.__mockComponents)) {
      throw new Error('Component has already been mocked');
    }
    sandbox.__mockedComponents.push({
      originalComponent: mockedComponent,
      mockComponent
    });
    return mockComponent;
  },

  untilNoError(func, onPass, maxTime = 1500, pauseTime = 100) {
    /*
    Continuously call `func` until it no longer throws an error. Will
    call until `maxTime` is reached (if no successful calls are made),
    and will call every `pauseTime` milliseconds. Useful for making
    assertions during testing which might require a delay until
    they pass.
  */
    let succeeded = false;
    const start = new Date().getTime();
    async.until(
      () => {
        const now = new Date().getTime();
        if (now - start > maxTime) return true;
        return succeeded;
      },
      cb => {
        try {
          func();
          succeeded = true;
          cb();
        } catch (err) {
          succeeded = false;
          _.delay(cb, pauseTime);
        }
      },
      () => {
        // Re-run func one last time. If it errors out, then that will be displayed to user.
        if (!succeeded) func();
        onPass();
      }
    );
  }
};
