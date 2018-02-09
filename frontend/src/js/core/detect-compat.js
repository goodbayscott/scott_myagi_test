// Browser warning for public facing website an be viewed at public/base.html
const bowser = require('bowser').browser;

import { local } from 'utilities/storage';
import { isUnsupportedBrowser, isCGradeBrowser } from 'utilities/browser';

require('browsernizr/test/css/flexbox');
require('browsernizr/test/css/flexboxlegacy');
const Modernizr = require('browsernizr');

const STORE_KEY = 'displayedBrowserCompatAlert';

const COMPAT_TESTS = [
  isUnsupportedBrowser(),
  isCGradeBrowser(),
  // Check that browser has flexbox support in case above tests pass.
  // Modernizr will claim that IE10+ does not have flexbox, however site displays
  // ok there so let it past.
  !Modernizr.flexbox && !Modernizr.flexboxlegacy && !(bowser.msie && bowser.version >= 10)
];

let alreadyAlerted = false;

export const detectCompat = function () {
  /*
    Checks compatibility of current browser with frontend.
    Displays warning message if browser may be incompatible.
  */
  const storeVal = local.get(STORE_KEY);
  // Have disabled usage of this key for now. Could get annoying for users
  // but will ensure they get notified.
  // if (storeVal) return;
  COMPAT_TESTS.forEach(test => {
    if (test && !alreadyAlerted) {
      console.log('Failed compat test');
      console.log(JSON.stringify(Modernizr));
      console.log(JSON.stringify(bowser));
      alreadyAlerted = true;
      alert('WARNING: You are using an out-dated browser. ' +
          'The majority of this site will not work using this browser. ' +
          'Please consider upgrading to a modern browser such as the latest version of Google Chrome. ' +
          'Visit http://www.whatbrowser.org/ to upgrade.');
      local.set(STORE_KEY, true);
    }
  });
};
