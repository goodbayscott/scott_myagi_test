import React from 'react-native';
import Im from 'immutable';
import _ from 'lodash';

const { Dimensions } = React;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

import commonFuncs from './common-funcs';
import commonVars from './vars';

const vars = _.extend({}, commonVars, {
  dimensions: Im.Map({
    windowWidth,
    windowHeight
  }),
  fonts: Im.Map({
    regular: 'Karla-Regular'
  })
});

/* Use this object to share styling across components/pages */
const common = {
  authViews: {
    container: {
      paddingTop: 100,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: vars.colors.get('white')
    },
    extraText: {
      color: 'white',
      paddingLeft: 40,
      paddingRight: 40,
      textAlign: 'center'
    },
    heading: {
      color: 'white',
      fontSize: 30
    },
    inputContainer: {
      backgroundColor: vars.colors.get('white'),
      borderColor: vars.colors.get('grey'),
      borderBottomWidth: 1,
      borderRadius: 0
    },
    input: {
      color: 'black',
      maxWidth: windowWidth - 150,
      // Need this for screens smaller than iphone 6
      paddingRight: windowWidth < 375 ? 50 : 0
    },
    submitButton: {
      paddingTop: 15,
      marginTop: 30,
      marginBottom: 20
    },
    inputErrorMessage: {
      color: vars.colors.get('errorRed')
    },
    errorMessage: {
      color: vars.colors.get('errorRed'),
      marginTop: 15
    },
    icons: {
      color: vars.colors.get('grey')
    }
  },
  contentListItem: {
    itemContainer: {
      flexDirection: 'row'
    },
    title: {},
    desc: {
      fontSize: 10,
      marginTop: 3,
      color: vars.colors.get('darkGrey'),
      height: 25
    },
    infoContainer: {
      marginLeft: 10,
      marginRight: 5,
      flex: 1,
      flexDirection: 'column'
    },
    playIcon: {
      fontSize: 24,
      alignSelf: 'center',
      color: vars.colors.get('mediumGrey')
    }
  }
};

const funcs = _.extend({}, commonFuncs, {});

export default {
  vars,
  common,
  funcs
};
