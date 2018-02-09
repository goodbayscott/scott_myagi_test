import Style from 'style';

export const constants = {
  margin: 20,
  statPanelHideScreenSize: '@media screen and (max-width: 1200px)',
  // Windows below this width will not have sticky sidebars
  stickyWidth: 1480
};

export const styles = {
  sidePanel: {
    display: 'flex',
    flexDirection: 'column',
    flex: 0.5,
    marginLeft: 20,
    marginRight: 20,
    [Style.vars.media.get('mobile')]: {
      marginLeft: 10,
      marginRight: 10
    }
  },
  sidePanelInner: {
    backgroundColor: 'white',
    ...Style.common.cardBorder,
    boxShadow: 'none',
    borderTop: Style.funcs.makeBrandedBorder(),
    [Style.vars.media.get('mobile')]: {
      borderTop: 'none',
      paddingTop: 10
    }
  },
  panelHeading: {
    fontSize: 16,
    color: Style.vars.colors.get('darkGrey'),
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 20,
    [Style.vars.media.get('mobile')]: {
      // We use tabs instead on mobile
      display: 'none'
    }
  },
  topBrandedBorder: {
    borderTop: Style.funcs.makeBrandedBorder()
  }
};
