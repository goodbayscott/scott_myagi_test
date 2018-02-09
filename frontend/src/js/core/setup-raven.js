const Raven = require('raven-js');
const RSVP = require('rsvp');
const config = require('core/config');
const _ = require('lodash');

const SENTRY_KEY = config.SENTRY_KEY;
const SENTRY_APP_ID = config.SENTRY_APP_ID;

export const setupRaven = function () {
  if (SENTRY_KEY && SENTRY_APP_ID) {
    // Setup raven and point to sentry
    Raven.config(`https://${SENTRY_KEY}@app.getsentry.com/${SENTRY_APP_ID}`, {
      whitelistUrls: [/myagi\.com/, /myagi\.com\.au/, /localhost/],
      ignoreErrors: [
        // Random plugins/extensions
        'top.GLOBALS',
        // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error. html
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'http://tt.epicplay.com',
        "Can't find variable: ZiteReader",
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'http://loading.retry.widdit.com/',
        'atomicFindClose',
        // Facebook borked
        'fb_xd_fragment',
        // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
        // See http://stackoverflow.com/questions/4113268/how-to-stop-javascript-injection-from-vodafone-proxy
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
        'conduitPage',
        // This is a fairly generic React error which gets thrown when other things go wrong.
        // Tends to mask the other issues.
        "Unable to get property '_currentElement' of undefined or null reference",
        "Cannot read property '_currentElement' of null",
        // Should not be a need to register these
        'Network request failed',
        // Appears to be an issue with Android and Intercom. Resolution is
        // dependant on them and the issue has been reported.
        "Cannot call method 'getUUID'",
        // Unhelpful internal React error
        "Unable to get property 'componentWillUnmount' of undefined",
        // Unhelpful react router error
        "TypeError: null is not an object (evaluating 'internalInstance._currentElement')",
        // Mystery pusher error - https://github.com/pusher/pusher-js/issues/125
        "TypeError: undefined is not an object (evaluating 'this._callbacks')",
        // Unhelpful error
        'Unspecified error'
      ],
      ignoreUrls: [
        // Facebook flakiness
        /graph\.facebook\.com/i,
        // Facebook blocked
        /connect\.facebook\.net\/en_US\/all\.js/i,
        // Woopra flakiness
        /eatdifferent\.com\.woopra-ns\.com/i,
        /static\.woopra\.com\/js\/woopra\.js/i,
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
        // Other plugins
        /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
        /webappstoolbarba\.texthelp\.com\//i,
        /metrics\.itunes\.apple\.com\.edgesuite\.net\//i
      ],
      dataCallback(data) {
        let fullstoryURL;
        if (window.FS && window.FS.getCurrentSessionURL) {
          fullstoryURL = window.FS.getCurrentSessionURL();
        }
        if (fullstoryURL) {
          if (!data.extra) data.extra = {};
          _.extend(data.extra, {
            fullstoryURL
          });
        }
        return data;
      }
    }).install();
    RSVP.on('error', err => {
      console.log('Error caught by raven');
      let fullstoryURL;
      if (window.FS && window.FS.getCurrentSessionURL) {
        fullstoryURL = window.FS.getCurrentSessionURL();
      }
      // Ensure errors in promises get passed to raven
      Raven.captureException(err, {
        extra: {
          fullstoryURL,
          // Errors in promises are quite likely to have been logged already.
          details: 'Error thrown in promise. May have already been logged under a different name.'
        }
      });
    });
  }
};
