/*
  Instructions:
  If you want to add or update a translation, wrap some text in a t('some string') function, and
  add the translations to locale/en.json. Next, make sure you've
  git merged any updates to that file. Finally, run `fab push_trans` to sync the updates with
  Transifex.
 */

import _ from 'lodash';
import { DEFAULT_LANG } from './constants';
import moment from 'moment';
import IntlMessageFormat from 'intl-messageformat';

import * as localeData from 'locale';

let _curLocaleStrings;
let _curLocale;

function warnMessageNotFound(messageID, reason = '') {
  console.warn(`Translation message "${messageID}" not found because: ${reason}`);
  return messageID;
}

export function configureForLocale(locale) {
  // react-native doesn't like when you require dynamically.
  // see https://github.com/facebook/react-native/issues/1629

  // Already properly configured
  if (_curLocale === locale) return;

  if (!localeData[locale]) {
    console.warn('Attempted to configure for unsupport locale, so falling back to en.');
    locale = DEFAULT_LANG;
  }

  const { strings, getMomentData } = localeData[locale];

  if (getMomentData) {
    moment.updateLocale(locale, getMomentData());
  }

  let updatedStrings = strings;

  // Overwrite with default lang updatedStrings if there are missing keys.
  updatedStrings = Object.assign(localeData[DEFAULT_LANG].strings, strings);

  // Store these as global state. This means that the `t` function can be used anywhere
  // (in or outside a component),  provided `configureForLocale` has been called first.
  _curLocaleStrings = updatedStrings;
  _curLocale = locale;
}

export const getNavigatorLocale = () => {
  let locale = DEFAULT_LANG;
  let navigatorLang;
  if (navigator && navigator.language) {
    navigatorLang = navigator.language.toLowerCase().substring(0, 2);
  }
  // if we support the user's first choice locale, set learner locale.
  if (navigatorLang && _.includes(_.keys(localeData), navigatorLang)) {
    locale = navigatorLang;
  }
  return locale;
};

export function getCurrentLocale() {
  if (!_curLocale) {
    throw new Error('`configureForLocale` has not been called.');
  }
  return _curLocale;
}

export function t(messageID, values) {
  if (!_curLocale || !_curLocaleStrings) {
    throw new Error('You cannot call the `t` function until the `configureForLocale` function has been called.');
  }

  const str = _curLocaleStrings[messageID] || _curLocaleStrings[messageID.toLowerCase()];
  if (!str) {
    return warnMessageNotFound(
      messageID,
      'Translation string does not exist in current language file. ' +
        'Please add the translation key and string to the en.json file, ' +
        'then sync with Transifex to get it translated.'
    );
  }
  const msg = new IntlMessageFormat(str, _curLocale);
  return msg.format(values);
}

export default t;
