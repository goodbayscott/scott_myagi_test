import vars from './vars';

import Color from 'color';

import { getDefaultLogo } from 'core/style-configuration';

const PRIMARY_COLOR = 'rgba(250, 115, 70, 1)';
const NAV_BACKGROUND = '#2F333C';
const NAV_FONT_COLOR = 'rgba(204, 204, 204, 1)';
const PRIMARY_FONT_COLOR = 'rgba(255, 255, 255, 1)';

export default {
  setStylingForCompany(co) {
    const cs = co.get('companysettings').style_customization_enabled
      ? co.get('companysettings')
      : {};

    const brandPrimary = cs.primary_color || PRIMARY_COLOR;
    const brandPrimaryColorObj = Color(brandPrimary) || PRIMARY_COLOR;
    const nav = cs.nav_color || NAV_BACKGROUND;
    const navFontColor = cs.nav_font_color || NAV_FONT_COLOR;
    const primaryFontColor = cs.primary_font_color || PRIMARY_FONT_COLOR;

    vars.updateDynamic('primary', brandPrimary);
    vars.updateDynamic('fadedPrimary', brandPrimaryColorObj.fade(0.4).string());
    vars.updateDynamic('darkPrimary', brandPrimaryColorObj.darken(0.2).string());

    vars.updateDynamic('navBackground', nav);
    vars.updateDynamic('accountsBackground', nav);
    vars.updateDynamic('navFontColor', navFontColor);
    vars.updateDynamic('primaryFontColor', primaryFontColor);
  },

  getNavLogoForCompany(co) {
    let logo = getDefaultLogo();
    const cs = co.get('companysettings');
    if (!cs || !cs.style_customization_enabled) return logo;
    const companyLogo = cs.nav_logo || co.get('company_logo');
    if (companyLogo) {
      logo = companyLogo;
    }
    return logo;
  },

  resetStyling() {
    const test = true;
    vars.updateDynamic('primary', vars.colors.get('primaryDefault'));
    vars.updateDynamic('fadedPrimary', vars.colors.get('fadedPrimaryDefault'));
    vars.updateDynamic('darkPrimary', vars.colors.get('darkPrimaryDefault'));
    vars.updateDynamic('navBackground', vars.colors.get('navBackgroundDefault'));
    vars.updateDynamic('accountsBackground', vars.colors.get('accountsBackgroundDefault'));
  }
};
