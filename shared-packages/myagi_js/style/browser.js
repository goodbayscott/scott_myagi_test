import Im from 'immutable';
import prefixed from 'browsernizr/lib/prefixed';
import _ from 'lodash';

import vars from './vars';
import commonFuncs from './common-funcs';

const _getPrefixedObj = function (rule, attr) {
  const css = {};
  css[prefixed(rule)] = attr;
  return css;
};

const funcs = _.extend({}, commonFuncs, {
  makeTransition(trans) {
    return _getPrefixedObj('transition', trans);
  },
  makeTransitionAll() {
    return funcs.makeTransition('all ease-in 0.2s');
  },
  makeTransform(trans) {
    return _getPrefixedObj('transform', trans);
  },
  makeCenterInContainer() {
    return _.extend(
      {
        position: 'absolute',
        display: 'inline-block',
        top: '50%',
        left: '50%'
      },
      funcs.makeTransform('translate(-50%, -50%)')
    );
  },
  snakeCase(str) {
    if (!str.replace) return;
    return str.replace(/([A-Z])/g, (str, m1) => `-${m1.toLowerCase()}`).replace(/^ms-/, '-ms-');
  },
  makeFlexJustifyContent(justify) {
    return {
      display: funcs.snakeCase(prefixed('flex')),
      WebkitBoxPack: 'justify',
      MozBoxPack: 'justify',
      msFlexPack: 'justify',
      WebkitJustifyContent: justify,
      justifyContent: justify
    };
  },
  updateStyleVar() {},
  makeBrandedBorder() {
    return {
      toString() {
        return `5px solid ${vars.colors.get('primary')}`;
      }
    };
  }
});

const common = {
  cardBorder: {
    // This styling was taken from the Quora feed.
    // Have used longhand styling to prevent complaints from Radium.
    boxShadow: '1px 1px 0 #f7f7f7',
    borderTop: '1px solid #efefef',
    borderRight: '1px solid #efefef',
    borderBottom: '1px solid #efefef',
    borderLeft: '1px solid #efefef'
  },
  ellipsisOverflow: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: vars.colors.get('textBlack')
  },
  clearBoth: {
    clear: 'both'
  },
  h3Info: {
    lineHeight: '1.8em'
  },
  floatLeft: {
    float: 'left'
  },
  attemptPageContent: {
    width: '100%',
    position: 'relative',
    padding: '20px 20px 60px 20px',
    marginTop: 10,
    boxShadow: 'none',
    border: 'none'
  },
  statValue: {
    fontSize: '2.4em',
    display: 'block',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: '1.2em',
    textTransform: 'uppercase',
    display: 'block',
    textAlign: 'center',
    marginTop: 20
  },
  horizontalDiscreteProgressBar: {
    container: {
      padding: '10px 20px',
      // backgroundColor: Style.vars.colors.get('primary'),
      backgroundColor: 'white',
      position: 'relative',
      overflow: 'auto',

      display: funcs.snakeCase(prefixed('flex')),
      WebkitBoxPack: 'justify',
      MozBoxPack: 'justify',
      msFlexPack: 'justify',
      WebkitJustifyContent: 'space-between',
      justifyContent: 'space-between',

      borderTop: `1px solid ${vars.colors.get('lightGrey')}`
    },
    itemOuterContainer: {
      background: 'white',
      padding: '0 20px',
      zIndex: 1
    },
    itemInnerContainer: {
      height: '20px',
      width: '20px',
      borderRadius: '14px',
      backgroundColor: vars.colors.get('darkPrimary'),
      float: 'left',
      position: 'relative',
      cursor: 'pointer'
    },
    itemPopup: {
      width: '20px',
      height: '20px',
      position: 'absolute',
      top: 0,
      left: 0
    },
    icon: _.extend(
      {
        // color: Style.vars.colors.get('primary'),
        color: 'white',
        margin: 0,
        marginTop: 1,
        marginLeft: '50%'
      },
      funcs.makeTransform('translateX(-50%)')
    ),
    blackLine: _.extend(
      {
        position: 'absolute',
        height: '1px',
        backgroundColor: vars.colors.get('mediumGrey'),
        width: 'calc(100% - 40px)',
        top: 35,
        left: '50%'
      },
      funcs.makeTransform('translateX(-50%)')
    )
  },
  verticalDiscreteProgressBar: {
    container: {
      padding: '15px 0',
      backgroundColor: vars.colors.get('mediumGrey'),
      position: 'relative',

      display: 'flex',
      flexDirection: 'column'
    },
    itemOuterContainer: {
      position: 'relative',
      display: 'flex',
      verticalAlign: 'top'
    },
    itemInnerContainer: {
      marginTop: '2px',
      height: '16px',
      width: '16px',
      borderRadius: '12px',
      float: 'left',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1',
      left: '8px',
      backgroundColor: vars.colors.get('mediumGrey'),
      border: `solid 1px ${vars.colors.get('grey')}`
    },
    itemInnerContainerInProgress: {
      marginTop: '2px',
      height: '16px',
      width: '16px',
      borderRadius: '12px',
      backgroundColor: vars.colors.get('primary'),
      float: 'left',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1',
      left: '8px'
    },
    blackLine: _.extend(
      {
        position: 'absolute',
        height: '100%',
        backgroundColor: vars.colors.get('grey'),
        width: '1px',
        top: '10px',
        left: '16px'
      },
      funcs.makeTransform('translateX(-50%)')
    )
  }
};

export default {
  vars,
  common,
  funcs
};
