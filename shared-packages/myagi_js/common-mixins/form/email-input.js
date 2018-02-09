import { validateEmail } from 'utilities/validators';
import { t } from 'i18n';

export const EmailInputMixin = {
  /*
    Used for sharing logic between web and native apps
  */

  performAsyncValidation(val) {
    if (this.props.isUnique) {
      const promise = this.props.isUnique(val.trim());
      promise.then(result => {
        if (!result && val === this.state.value) {
          this.setState({
            prevIsValid: false,
            error: t('this_email_already_exists_perhaps_try')
          });
        }
      });
    }
  },

  baseIsValid(val) {
    if (!this.userHasChangedValue()) return true;
    if (!validateEmail(val)) {
      return t('please_enter_a_valid_email_address');
    }
    this.performAsyncValidation(val);
    return true;
  },

  baseClean(val) {
    return val.trim();
  }
};
