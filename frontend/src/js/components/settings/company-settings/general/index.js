import React from 'react';
import Im from 'immutable';

import Style from 'style';
import { t } from 'i18n';

import $y from 'utilities/yaler';

import CompaniesState from 'state/companies';
import CompanySettingsState from 'state/companysettings';

import { Panel, BoxContent } from 'components/common/box';
import { TagSearchableMultiSelect } from 'components/common/tag-searchable-multiselect';
import { RegionDropdownSelect } from 'components/common/form/select';
import { CoverPhotoGuideModal } from 'components/common/cover-photo-guide-modal';
import { DescriptionBox } from '../../common';

import {
  Form,
  TextInput,
  SubmitButton,
  ButtonToggle,
  ImageCropper,
  URLInput
} from 'components/common/form';

const YES = 'Yes';
const NO = 'No';

const styles = {
  actionCol: {
    paddingTop: 50,
    paddingLeft: 50
  },
  tabContainer: {
    marginBottom: 50,
    padding: 0,
    height: 60
  },
  inputStyle: {
    container: {
      maxWidth: 250
    },
    labelStyle: {
      height: 36,
      color: Style.vars.colors.get('white')
    }
  },
  submitButton: {
    width: 120,
    height: 50,
    float: 'left',
    // marginLeft: 50,
    paddingTop: 18
  },
  photoContainer: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  photo: {
    margin: '0 50px 30px 10px'
  },
  guide: {
    fontSize: '0.8rem',
    color: '#888',
    marginLeft: 10,
    cursor: 'pointer'
  }
};

export class GeneralTabsContent extends React.Component {
  static propTypes = {
    companySettings: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  static data = {
    company: {
      required: true,
      fields: [
        'id',
        'company_name',
        'legal_trading_name',
        'company_logo',
        'cover_image',
        'company_url',
        'subdomain',
        'num_external_teams_connected_to_content',
        'subscription.id',
        'tags',
        'region'
      ]
    },
    companySettings: {
      required: true,
      fields: [
        'access_code',
        'host_whitelist_enabled',
        'host_whitelist',
        'freeform_address',
        'users_can_invite_others_to_join',
        'allow_signups_to_create_teams',
        'users_can_make_own_connections',
        'managers_can_view_any_available_content',
        'style_customization_enabled'
      ]
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired,
    displayTempNegativeMessage: React.PropTypes.func.isRequired
  };

  constructor() {
    super();
    this.state = {
      formNotChanged: true
    };
  }

  onCompanyUpdate = () => {
    this.context.displayTempPositiveMessage({
      heading: 'Success',
      body: 'Company details saved'
    });
  };

  onCompanyUpdateFail = () => {
    this.context.displayTempNegativeMessage({
      heading: 'Request failed',
      // Making assumption that this is related to the subdomain...
      body: 'This subdomain is already taken! Choose another one.'
    });
  };

  onSubmit = data => {
    const companySettingsId = this.props.companySettings.get('id');
    let place_id,
      freeform_address;
    if (data.address) {
      [place_id, freeform_address] = data.address.split('|');
    }
    const company = this.props.company;
    const companyId = company.get('id');
    const newSubdomain = data.subdomain.length ? data.subdomain : null;
    const tags = data.tags;

    CompanySettingsState.ActionCreators.update(
      companySettingsId,
      {
        host_whitelist: data.host_whitelist,
        freeform_address,
        google_place_id: place_id,
        access_code: data.access_code
      },
      { fields: $y.getFields(GeneralTabsContent, 'companySettings') }
    ).then(() => {
      if (data.company_url || data.company_name || data.legal_trading_name || data.region) {
        const coData = {
          company_url: data.company_url,
          company_logo: data.companyLogo,
          cover_image: data.coverImage,
          company_name: data.company_name,
          legal_trading_name: data.legal_trading_name,
          region: data.region
        };
        if (tags !== undefined) coData.tags = tags;
        if (newSubdomain !== this.props.company.get('subdomain')) {
          coData.subdomain = newSubdomain;
        }
        CompaniesState.ActionCreators.update(companyId, coData, {
          fields: $y.getFields(GeneralTabsContent, 'company')
        }).catch(err => {
          this.onCompanyUpdateFail();
        });
      }
      this.onCompanyUpdate();
    });
  };

  managersCanViewAnyAvailableContentChange = data => {
    const companySettingsId = this.props.companySettings.get('id');
    CompanySettingsState.ActionCreators.update(
      companySettingsId,
      { managers_can_view_any_available_content: data === YES },
      { fields: $y.getFields(GeneralTabsContent, 'companySettings') }
    ).then(() => {
      this.onCompanyUpdate();
    });
  };

  onCompanyEmailChanged = data => {
    const companySettingsId = this.props.companySettings.get('id');
    CompanySettingsState.ActionCreators.update(
      companySettingsId,
      { host_whitelist_enabled: data === YES },
      { fields: $y.getFields(GeneralTabsContent, 'companySettings') }
    ).then(() => {
      this.onCompanyUpdate();
    });
  };

  onChangeAllowUserConnectExternalContent = data => {
    const companySettingsId = this.props.companySettings.get('id');
    CompanySettingsState.ActionCreators.update(
      companySettingsId,
      { users_can_make_own_connections: data === YES },
      { fields: $y.getFields(GeneralTabsContent, 'companySettings') }
    ).then(() => {
      this.onCompanyUpdate();
    });
  };

  onChangeUsersCanInviteOthers = data => {
    const companySettingsId = this.props.companySettings.get('id');
    data = { users_can_invite_others_to_join: data === YES };
    CompanySettingsState.ActionCreators.update(companySettingsId, data, {
      fields: $y.getFields(GeneralTabsContent, 'company')
    }).then(() => {
      this.onCompanyUpdate();
    });
  };

  onChangeNewUsersCanCreateTeams = data => {
    const companySettingsId = this.props.companySettings.get('id');
    data = { allow_signups_to_create_teams: data === YES };
    CompanySettingsState.ActionCreators.update(companySettingsId, data, {
      fields: $y.getFields(GeneralTabsContent, 'companySettings')
    }).then(() => {
      this.onCompanyUpdate();
    });
  };

  inputChanged = () => {
    this.setState({ formNotChanged: false });
  };

  render() {
    const { company, companySettings } = this.props;
    const managersCanViewAnyAvailableContent = companySettings.get('managers_can_view_any_available_content')
      ? YES
      : NO;
    const hostWhileListEnabled = companySettings.get('host_whitelist_enabled') ? YES : NO;
    const users_can_make_own_connections = companySettings.get('users_can_make_own_connections')
      ? YES
      : NO;
    const users_can_invite_others_to_join = companySettings.get('users_can_invite_others_to_join')
      ? YES
      : NO;
    const allow_signups_to_create_teams = companySettings.get('allow_signups_to_create_teams')
      ? YES
      : NO;
    const host_whitelist = companySettings.get('host_whitelist');
    const address = companySettings.get('freeform_address');
    const company_name = company.get('company_name');
    const legalTradingName = company.get('legal_trading_name');
    const companyURL = company.get('company_url');
    const subdomain = company.get('subdomain');
    const accessCode = companySettings.get('access_code');
    const tags = company.get('tags');
    const custom_branding = companySettings.get('style_customization_enabled');
    const region = company.get('region');

    return (
      <Panel>
        <BoxContent>
          <Form onSubmitAndValid={this.onSubmit} ref="companySettingsForm">
            <div style={styles.photoContainer}>
              <div style={styles.photo}>
                <h3>{t('company_logo')}</h3>
                <ImageCropper
                  name="companyLogo"
                  onChange={this.inputChanged}
                  height={200}
                  width={200}
                  initialValue={company.get('company_logo')}
                />
              </div>
              <div style={styles.photo}>
                <h3>
                  {t('company_cover_image')}
                  <span style={styles.guide} onClick={() => this.coverImageGuide.show()}>
                    Cover photo guide
                  </span>
                </h3>
                <ImageCropper
                  name="coverImage"
                  onChange={this.inputChanged}
                  height={100}
                  width={1200 / 300 * 100}
                  initialValue={company.get('cover_image')}
                />
              </div>
              <CoverPhotoGuideModal ref={c => (this.coverImageGuide = c)} />
            </div>

            {/* <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title="Allow users with your company email address to sign up"
                  info={`Users signing up with a company email address will automatically be added to
                  your company. Without this option you can still invite users individually or they
                  can request to join your company.
                  `}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <ButtonToggle
                  name="company_email"
                  leftLabel={YES}
                  rightLabel={NO}
                  initialValue={hostWhileListEnabled}
                  initialIsAcceptable
                  onChange={this.onCompanyEmailChanged}
                />
              </div>
            </div> */}

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox title={t('your_company_name')} info={t('your_company_name_info')} />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <TextInput
                    initialValue={company_name}
                    name="company_name"
                    onChange={this.inputChanged}
                    initialIsAcceptable
                  />
                </div>
              </div>
            </div>

            {this.props.internalUse ? (
              <div className="ui grid stackable">
                <div className="column nine wide">
                  <DescriptionBox
                    title={t('company_legal_name')}
                    info={t('company_legal_name_info')}
                  />
                </div>

                <div className="column seven wide" style={styles.actionCol}>
                  <div style={{ maxWidth: 400 }}>
                    <TextInput
                      initialValue={legalTradingName}
                      name="legal_trading_name"
                      onChange={this.inputChanged}
                      initialIsAcceptable
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title={"Your company's email domain(s)"}
                  info={`Enter your company's email domain to allow users with this type of email
                  address to sign up to your company. If you have multiple domains
                  separate them with a comma.`}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div className="ui labeled input" style={styles.inputStyle.container}>
                  <div className="ui label" style={styles.inputStyle.labelStyle}>
                    @
                  </div>
                  <TextInput
                    initialValue={host_whitelist}
                    name="host_whitelist"
                    onChange={this.inputChanged}
                  />
                </div>
              </div>
            </div> */}

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title={t('your_company_website_url')}
                  info={t('enter_your_company_website_url')}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <URLInput
                    initialValue={companyURL}
                    name="company_url"
                    ref="company_url"
                    onChange={this.inputChanged}
                    required={false}
                    initialIsAcceptable
                  />
                </div>
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox title={t('region')} info={t('region_info')} />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <RegionDropdownSelect
                    name="region"
                    required
                    style={styles.dropdown}
                    initialSelection={region}
                    onChange={this.inputChanged}
                  />
                </div>
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox title={t('tags')} info={t('tags_settings_info')} />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <TagSearchableMultiSelect
                    name="tags"
                    initialSelections={tags}
                    required={false}
                    onChange={this.inputChanged}
                    initialIsAcceptable
                  />
                </div>
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox title="Myagi URL" info={t('myagi_url_settings_info')} />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <TextInput
                    initialValue={subdomain}
                    name="subdomain"
                    ref="subdomain"
                    onChange={this.inputChanged}
                    required={false}
                    initialIsAcceptable
                  />
                  <div>
                    {subdomain ? (
                      <span>
                        {`${t('your_myagi_url')} `}
                        <a href={`https://${subdomain}.myagi.com`} target="_blank">
                          {subdomain}.myagi.com
                        </a>
                      </span>
                    ) : (
                      <span>{t('no_myagi_url')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox title={t('access_code')} info={t('access_code_info')} />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <div style={{ maxWidth: 400 }}>
                  <TextInput
                    initialValue={accessCode}
                    name="access_code"
                    ref="access_code"
                    onChange={this.inputChanged}
                    required={false}
                    initialIsAcceptable
                  />
                </div>
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title={t('users_can_view_discovery')}
                  info={t('users_can_view_discovery_info')}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <ButtonToggle
                  name="user_content"
                  leftLabel={YES}
                  rightLabel={NO}
                  initialValue={users_can_make_own_connections}
                  initialIsAcceptable
                  onChange={this.onChangeAllowUserConnectExternalContent}
                />
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title={t('allow_signup_invitations')}
                  info={t('allow_signup_invitations_info')}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <ButtonToggle
                  name="users_can_invite_others_to_join"
                  leftLabel={YES}
                  rightLabel={NO}
                  initialValue={users_can_invite_others_to_join}
                  initialIsAcceptable
                  onChange={this.onChangeUsersCanInviteOthers}
                />
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column nine wide">
                <DescriptionBox
                  title={t('allow_new_users_to_create_teams')}
                  info={t('allow_new_users_to_create_teams_info')}
                />
              </div>

              <div className="column seven wide" style={styles.actionCol}>
                <ButtonToggle
                  name="allow_signups_to_create_teams"
                  leftLabel={YES}
                  rightLabel={NO}
                  initialValue={allow_signups_to_create_teams}
                  initialIsAcceptable
                  onChange={this.onChangeNewUsersCanCreateTeams}
                />
              </div>
            </div>

            <div className="ui grid stackable">
              <div className="column six wide">
                <SubmitButton
                  text={t('save')}
                  style={styles.submitButton}
                  disabled={this.state.formNotChanged}
                />
              </div>
            </div>
          </Form>
        </BoxContent>
      </Panel>
    );
  }
}
