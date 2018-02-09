import _ from 'lodash';

import * as localeData from 'locale';

export const AVAILABLE_LOCALES = {};
_.forEach(localeData, (langData, lang) => {
  AVAILABLE_LOCALES[lang] = langData.name;
});

export const DEFAULT_LANG = 'en';
