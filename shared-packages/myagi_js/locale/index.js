import { addLocaleData } from 'react-intl';

function reformatLangMessages(lang) {
  // Transifex uses the %(var_name)s style for
  // message variables, so need to convert to the style
  // used by react-intl ( {var_name} ).
  const newFormat = {};
  _.each(lang, (val, key) => {
    newFormat[key] = val.replace(/%\(/g, '{').replace(/\)s/g, '}');
  });
  return newFormat;
}

if (!window.Intl) {
  // Polyfill `Intl` object
  require('intl');
}

/* When adding a new language, just copy one of the blocks from
below and replace all instances of the language code with
whatever you are adding. NOTE: getMomentData is a function
so that we can dynamically import the locale data. */

// en
import enStrings from './en.json';
import enData from 'react-intl/locale-data/en';

addLocaleData(enData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/en');
}
export const en = {
  name: 'English',
  strings: reformatLangMessages(enStrings),
  getMomentData: null
};
//

// fr
import frStrings from './fr.json';
import frData from 'react-intl/locale-data/fr';

addLocaleData(frData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/fr');
}
export const fr = {
  name: 'Français',
  strings: reformatLangMessages(frStrings),
  intlData: frData,
  getMomentData: () => require('moment/locale/fr')
};
//

// es
import esStrings from './es.json';
import esData from 'react-intl/locale-data/es';

addLocaleData(esData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/es');
}
export const es = {
  name: 'Español',
  strings: reformatLangMessages(esStrings),
  intlData: esData,
  getMomentData: () => require('moment/locale/es')
};
//

// de
import deStrings from './de.json';
import deData from 'react-intl/locale-data/de';

addLocaleData(deData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/de');
}
export const de = {
  name: 'Deutsch',
  strings: reformatLangMessages(deStrings),
  intlData: deData,
  getMomentData: () => require('moment/locale/de')
};
//

// it
import itStrings from './it.json';
import itData from 'react-intl/locale-data/it';

addLocaleData(itData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/it');
}
export const it = {
  name: 'Italiano',
  strings: reformatLangMessages(itStrings),
  intlData: itData,
  getMomentData: () => require('moment/locale/it')
};
//

// nl
import nlStrings from './nl.json';
import nlData from 'react-intl/locale-data/nl';

addLocaleData(nlData);
if (!window.Intl) {
  require('intl/locale-data/jsonp/nl');
}
export const nl = {
  name: 'Nederlands',
  strings: reformatLangMessages(nlStrings),
  intlData: nlData,
  getMomentData: () => require('moment/locale/nl')
};
//
