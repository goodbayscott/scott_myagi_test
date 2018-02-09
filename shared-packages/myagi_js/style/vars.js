import Im from 'immutable';
import _ from 'lodash';

const dynamics = {};

function makeDynamic(name, val) {
  updateDynamic(name, val);
  return {
    toString() {
      return dynamics[name];
    }
  };
}

function updateDynamic(name, val) {
  if (val) dynamics[name] = val;
}

export default {
  // TODO - Do not use Immutable JS or use it for common
  // style module
  widths: Im.Map({
    mainContentMaxWidth: 1920,
    innerContentMaxWidth: 1130,
    contentFeedMaxWidth: 800
  }),
  colors: Im.Map({
    overlay: 'rgba(0,0,0,0.5)',
    textBlack: 'rgba(0,0,0,.8)',
    fadedOffBlack: 'rgba(34, 36, 38, 0.15)',
    white: '#FFFFFF',
    fadedWhite: 'rgba(225, 225, 225, 0.9)',
    secondaryBtnBckgGrey: '#E0E1E2',
    secondaryBtnTextBlack: 'rgba(0, 0, 0, 0.6)',
    xLightGrey: '#FAFAFA',
    lightGrey: '#F8F8F8',
    hoverGrey: '#F8F8F8',
    mediumGrey: '#EEEEEE',
    grey: '#CCCCCC',
    darkGrey: '#C4C4C4',
    xDarkGrey: '#BCBCBC',
    xxDarkGrey: 'rgba(0, 0, 0, 0.6)',
    xxxDarkGrey: '#333',
    green: '#21BA45',
    oliveGreen: '#AABE5A',
    fadedOliveGreen: 'rgba(170, 190, 90, 0.6)',
    xFadedOliveGreen: 'rgba(170, 190, 90, 0.2)',
    fadedGreen: 'rgba(136,193,0,0.9)',
    darkFadedGreen: 'rgba(170,209,88,0.8)',
    blue: '#2F333C',
    fadedBlue: '#5c6579',
    red: 'rgba(255, 61, 0, 1)',
    darkRed: '#c63c2e',
    fadedRed: 'rgba(255,61,0,0.9)',
    darkFadedRed: 'rgba(226,92,95,0.8)',
    errorRed: '#D95C5C',

    primary: makeDynamic('primary', 'rgba(250, 115, 70, 1)'),
    primaryDefault: 'rgba(239, 83, 41, 1)',

    fadedPrimary: makeDynamic('fadedPrimary', 'rgba(250, 115, 70,0.2)'),
    fadedPrimaryDefault: 'rgba(240,79,41,0.2)',

    darkPrimary: makeDynamic('darkPrimary', 'rgba(205,85,33,1)'),
    darkPrimaryDefault: 'rgba(220,60,20,1)',

    navBackground: makeDynamic('navBackground', '#2F333C'),
    navBackgroundDefault: '#2F333C',

    accountsBackground: makeDynamic('accountsBackground', '#434b5c'),
    accountsBackgroundDefault: '#434b5c',

    navFontColor: makeDynamic('navFontColor', 'rgba(204, 204, 204, 1)'),
    primaryFontColor: makeDynamic('primaryFontColor', 'rgba(255, 255, 255, 1)'),

    navInactiveGrey: 'rgba(0, 0, 0, 0.5)',

    myagiOrange: '#FA7346',
    mediumOrange: '#E76F47',

    yellow: 'rgba(255,228,51,1)',
    fadedYellow: 'rgba(250,190,40,0.9)',
    darkYellow: '#EF9D2B',

    lightGunMetal: '#414754',

    skyBlue: '#449EC2',
    navy: '#31363F',
    MCOdd: '#42464F',
    MCEven: '#52565E',
    // Taken from slack signup page
    softText: '#555459'
  }),
  fontSizes: Im.Map({
    xxxLarge: '1.4rem',
    xxLarge: '1.3rem',
    xLarge: '1.2rem',
    large: '1.1rem',
    medium: '1rem',
    small: '0.9rem',
    xSmall: '0.8rem',
    xxSmall: '0.7rem',
    xxxSmall: '0.6rem'
  }),
  media: Im.Map({
    // Pulled from http://semantic-ui.com/collections/grid.html
    xSmall: '@media screen and (max-width: 365px)',
    mobile: '@media screen and (max-width: 767px)',
    tablet: '@media screen and (min-width: 768px)',
    xTablet: '@media (min-width: 768px) and (max-width: 1199px)',
    computer: '@media screen and (min-width: 992px)',
    largeScreen: '@media screen and (min-width: 1400px)',
    wideScreen: '@media screen and (min-width: 1920px)',
    landscape: '@media screen and (orientation: landscape)'
  }),
  updateDynamic(name, val) {
    if (!dynamics[name]) {
      console.error(`${name} is not a dynamic`);
      return;
    }
    return updateDynamic(name, val);
  }
};
