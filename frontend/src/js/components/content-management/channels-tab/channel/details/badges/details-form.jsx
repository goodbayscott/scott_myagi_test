import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import { t } from 'i18n';
import reactMixin from 'react-mixin';

import DetailsFormUtils from 'utilities/details-form';

import Style from 'style';

import {
  Form,
  TextInput,
  TextArea,
  URLInput,
  ImageCropper,
  SubmitButton,
  ButtonToggle
} from 'components/common/form';

import { Info } from 'components/common/info';
import { AddTrainingPlansForm } from '../../add-training-plans-modal';
import { TabsMixin } from 'components/common/tabs';

const DISCOUNT_CODE = 'Single Discount Code';
const UNIQUE_CODES = 'Many Unique Codes';
const INIT_TAB = DISCOUNT_CODE;

const pageStyle = {
  buttonToggle: {
    container: _.merge(
      {
        marginBottom: 20,
        marginTop: 5,
        marginLeft: '50%'
      },
      Style.funcs.makeTransform('translateX(-50%)')
    ),
    button: {
      width: '11em',
      fontSize: '14px'
    }
  },
  requireHeader: {
    marginTop: '1em'
  },
  errorCode: {
    color: Style.vars.colors.get('errorRed')
  }
};

export class BadgeDetailsFormFirstPage extends React.Component {
  static propTypes = {
    onSubmitAndValid: React.PropTypes.func.isRequired,
    badge: React.PropTypes.instanceOf(Im.Map)
  };

  render() {
    const initValues = DetailsFormUtils.getInitialValues(this.props.badge);
    return (
      <Form onSubmitAndValid={this.props.onSubmitAndValid}>
        <h3>{t('badge_name')}</h3>
        <TextInput
          name="name"
          initialValue={initValues.name}
          initialIsAcceptable={initValues.name}
          required
        />
        <h3>
          {`${t('badge_description')}`} <small>{`(${t('optional')})`}</small>
        </h3>
        <TextInput
          name="description"
          initialValue={initValues.description}
          initialIsAcceptable={initValues.description}
          maxLength={200}
        />
        <h3>{t('badge_image')}</h3>
        <ImageCropper
          name="badge_image"
          aspectRatio={1}
          height={200}
          width={200}
          initialValue={initValues.badge_image}
          required
        />

        <SubmitButton text={t('next')} />
      </Form>
    );
  }
}

@reactMixin.decorate(TabsMixin)
export class BadgeDetailsFormSecondPage extends React.Component {
  static propTypes = {
    onSubmitAndValid: React.PropTypes.func.isRequired,
    badge: React.PropTypes.instanceOf(Im.Map)
  };

  constructor() {
    super();
    this.state = {
      duplicateCodes: [],
      showIssuedCodes: false
    };
  }

  cleanCodes = codes => {
    codes = codes.split('\n');
    codes = _.trim(codes, ',');
    codes = codes.split(',');
    codes = codes.map(code => _.trim(code, ' \n'));
    codes = codes.filter(code => code != '');
    return codes;
  };

  isCodesValid = codes => {
    const allCodesValid = true;
    if (this.props.badge) {
      const dups = _.intersection(codes, this.props.badge.get('used_unique_codes'));
      this.setState({ duplicateCodes: dups });
    }
    return allCodesValid;
  };

  onModalContentChangeClick = tab => {
    this.onTabChange(tab);
  };

  showIssuedCodes = () => {
    this.setState({ showIssuedCodes: !this.state.showIssuedCodes });
  };

  getTabContentMap = () => {
    const initValues = DetailsFormUtils.getInitialValues(this.props.badge);
    let issuedCodes;
    if (this.props.badge) {
      // reverse issued codes to display them in order of distribution
      issuedCodes = (
        <ul>
          {this.props.badge
            .get('used_unique_codes')
            .reverse()
            .map(code => <li key={code}>{code}</li>)}
        </ul>
      );
    }
    const discountCodeInput = (
      <div>
        <p>{t('redemption_code_info')}</p>
        <TextInput
          name="discount_code"
          initialValue={initValues.discount_code || t('code')}
          initialIsAcceptable={initValues.discount_code}
        />
      </div>
    );
    let initUniqueCodes;
    if (initValues.unique_codes) {
      initUniqueCodes = initValues.unique_codes.join(', ');
    }
    let usedCodeWarning = null;
    if (this.state.duplicateCodes.length) {
      const dups = this.state.duplicateCodes.map(code => <li key={code}>{code}</li>);
      usedCodeWarning = (
        <div style={pageStyle.errorCode}>
          <p>{`${t('warning_badge_codes')}:`}</p>
          <ul>{this.state.duplicateCodes.map(code => <li key={code}>{code}</li>)}</ul>
        </div>
      );
    }
    const issuedCodeText = `${this.state.showIssuedCodes ? 'Hide' : 'Show'} issued codes`;
    const uniqueCodesInput = (
      <div>
        <p>
          {`${t('enter_unique_discount')}. `}
          <Info content={t('enter_unique_discount_info')} />
        </p>
        <TextArea
          initialValue={initUniqueCodes}
          name="unique_codes"
          required={false}
          isValid={this.isCodesValid}
          clean={this.cleanCodes}
          showError
          style={{
            label: { fontWeight: 'normal' }
          }}
          initialIsAcceptable
        />
        {usedCodeWarning}
        {this.props.badge && this.props.badge.get('used_unique_codes').length ? (
          <div>
            <u style={{ cursor: 'pointer' }} onClick={this.showIssuedCodes}>
              {issuedCodeText}
            </u>&nbsp;
            <Info content={t('codes_already_distributed')} />
          </div>
        ) : null}
        {this.state.showIssuedCodes ? issuedCodes : null}
      </div>
    );
    return {
      [DISCOUNT_CODE]: discountCodeInput,
      [UNIQUE_CODES]: uniqueCodesInput
    };
  };

  render() {
    const initValues = DetailsFormUtils.getInitialValues(this.props.badge);
    return (
      <Form onSubmitAndValid={this.props.onSubmitAndValid}>
        <h3>
          {`${t('reward_details')}`} <small>{`(${t('optional')})`}</small>
        </h3>
        <ButtonToggle
          leftLabel={DISCOUNT_CODE}
          rightLabel={UNIQUE_CODES}
          initialValue={INIT_TAB}
          onChange={this.onModalContentChangeClick}
          style={pageStyle.buttonToggle}
        />
        {this.getTabContent()}

        <p>{t('url_given_to_user')}</p>
        <URLInput
          name="discount_url"
          initialValue={initValues.discount_url || 'URL'}
          initialIsAcceptable={initValues.discount_url}
          required={false}
        />
        <SubmitButton text={t('next')} />
      </Form>
    );
  }
}

export class BadgeDetailsFormThirdPage extends React.Component {
  static propTypes = {
    trainingPlanTrainingUnits: React.PropTypes.instanceOf(Im.List),
    onSubmitAndValid: React.PropTypes.func.isRequired,
    badge: React.PropTypes.instanceOf(Im.Map)
  };

  render() {
    let selectedPlans;
    if (this.props.badge && this.props.badge.get('training_plans')) {
      selectedPlans = Im.fromJS(this.props.badge.get('training_plans'));
    }
    return (
      <div>
        <AddTrainingPlansForm
          trainingPlans={this.props.trainingPlanTrainingUnits.map(tptu =>
            Im.Map(tptu.get('training_plan')))}
          currentUser={this.props.currentUser}
          label={t('these_plans_must_complete_earn_badge')}
          onSubmitAndValid={this.props.onSubmitAndValid}
          loading={this.props.loading}
          selectedTrainingPlans={this.props.badge ? this.props.badge.get('training_plans') : []}
        />
      </div>
    );
  }
}
