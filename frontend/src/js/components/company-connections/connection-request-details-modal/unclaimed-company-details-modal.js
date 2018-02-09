import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';
import reactMixin from 'react-mixin';
import Marty from 'marty';
import _ from 'lodash';

import Style from 'style';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import PublicCompaniesState from 'state/public-companies';
import ContactsState from 'state/contacts';

import { LoadingContainer } from 'components/common/loading';
import {
  Form,
  TextInput,
  URLInput,
  FieldHeader,
  SubmitButton,
  EmailInput
} from 'components/common/form';
import { RegionDropdownSelect } from 'components/common/form/select';
import { Image } from 'components/common/image';
import { Modal } from 'components/common/modal';
import { PrimaryButton, SecondaryButton, PlusButton } from 'components/common/buttons';
import { TagSearchableMultiSelect } from 'components/common/tag-searchable-multiselect';

const styles = {
  desc: {
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center'
  },
  contacts: {
    marginTop: 10,
    marginBottom: 20,
    display: 'flex',
    flexWrap: 'wrap'
  },
  contact: {
    padding: 10,
    display: 'flex',
    backgroundColor: Style.vars.colors.get('oliveGreen'),
    color: 'white',
    marginRight: 5,
    marginBottom: 5
  },
  addButton: {
    display: 'block',
    width: '100%',
    marginLeft: 0
  }
};

const CLEARBIT_LOGO_URL = 'http://logo.clearbit.com/';

class CreateContactModal extends React.Component {
  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  onSubmit = data => {
    ContactsState.ActionCreators.create({
      name: data.contact_name,
      email: data.contact_email,
      role: data.contact_role,
      company_name: data.contact_company,
      personal_website: data.contact_website,
      region: data.region,
      created_by: this.props.currentUser.get('url'),
      company: this.props.company.get('url')
    });
    this.context.displayTempPositiveMessage({
      heading: 'Contact created'
    });
    this.props.showParent();
  };

  show() {
    this.modal.show();
  }

  render() {
    return (
      <Modal ref={el => (this.modal = el)} header="Contact Details">
        <div className="content">
          <p style={styles.desc}>
            Add details for anybody you know who can help us with getting learning material from{' '}
            {this.props.company.get('company_name')} into Myagi. We can then work with them and
            update you along the way.
          </p>
          <Form onSubmitAndValid={this.onSubmit}>
            <FieldHeader required>Contact Name</FieldHeader>
            <TextInput name="contact_name" required placeholder="E.g. John Smith" />
            <FieldHeader required>Email</FieldHeader>
            <EmailInput name="contact_email" placeholder="E.g. john.smith@acme.com" required />
            <FieldHeader>Role</FieldHeader>
            <TextInput name="contact_role" placeholder="E.g. CEO" />
            <FieldHeader>LinkedIn Profile</FieldHeader>
            <URLInput name="contact_website" placeholder="E.g. linkedin.com/in/reidhoffman/" />
            <FieldHeader
              explanation={`Only required if this person works for a distributor of ${this.props.company.get('company_name')}.`}
            >
              Company
            </FieldHeader>
            <TextInput name="contact_company" placeholder="E.g. ACME Distributor" />
            <FieldHeader explanation="Please choose the region which this person operates in.">
              Region
            </FieldHeader>
            <RegionDropdownSelect
              name="region"
              initialSelection={this.props.currentUser.get('learner').company.region}
              required
              style={styles.dropdown}
            />
            <SubmitButton />
          </Form>
        </div>
      </Modal>
    );
  }
}

class UnclaimedCompanyDetailsModal extends React.Component {
  static data = {
    company: {
      required: true,
      fields: ['id', 'name', 'company_url', 'tags']
    },
    contacts: {
      required: false,
      fields: ['id', 'name', 'region']
    }
  };

  static contextTypes = {
    displayTempPositiveMessage: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super();
    this.state = {
      webURL: props.company.get('company_url') || undefined
    };
  }

  show = () => {
    this.modal.show();
  };

  showCreateContact = () => {
    this.createContactModal.show();
  };

  storeURL = (evt, val) => {
    // Store URL so that we can restore the value if the "Add" contact button is
    // pressed.
    this.setState({ webURL: val });
  };

  onSubmitAndValid = data => {
    if (data.website) {
      const logoURL = CLEARBIT_LOGO_URL + data.website;
      PublicCompaniesState.ActionCreators.update(this.props.company.get('id'), {
        company_url: data.website,
        logo_url: logoURL,
        tags: data.tags
      });
      this.context.displayTempPositiveMessage({
        heading: 'Details updated'
      });
    }
    this.modal.hide();
  };

  render() {
    const co = this.props.company;
    return (
      <Modal ref={el => (this.modal = el)} header={co.get('company_name')}>
        <div className="content">
          <p style={styles.desc}>
            This company is not yet part of the Myagi network. Help us by filling in details about
            them.
          </p>
          <Form onSubmitAndValid={this.onSubmitAndValid}>
            <FieldHeader required>Website URL</FieldHeader>
            <URLInput
              name="website"
              onChange={this.storeURL}
              initialValue={this.state.webURL}
              initialIsAcceptable
              required={false}
            />
            <FieldHeader required>Industry Tags</FieldHeader>
            <TagSearchableMultiSelect
              name="tags"
              initialSelections={co.get('tags')}
              required={false}
              initialIsAcceptable
            />
            <FieldHeader
              required
              explanation="Add contact details for anybody you know at this company. If you connect with this company via a distributor or agent, please add their details."
            >
              Contact Details
            </FieldHeader>
            <LoadingContainer
              loadingProps={[this.props.contacts]}
              noDataText="You have not added any contact details"
              createComponent={() => (
                <div style={styles.contacts}>
                  {this.props.contacts
                    .map(con => (
                      <div style={styles.contact} key={con.get('id')}>
                        {con.get('name')}&nbsp;({con.get('region')})
                      </div>
                    ))
                    .toArray()}
                </div>
              )}
            />
            <SecondaryButton style={styles.addButton} onClick={this.showCreateContact}>
              <i className="plus icon" /> Add Contact
            </SecondaryButton>
            <SubmitButton text={t('done')} />
          </Form>
        </div>
        <CreateContactModal
          ref={el => (this.createContactModal = el)}
          showParent={this.show}
          company={co}
          currentUser={this.props.currentUser}
        />
      </Modal>
    );
  }
}

export default Marty.createContainer(UnclaimedCompanyDetailsModal, {
  statics: {
    data: {
      company: $y.getData(UnclaimedCompanyDetailsModal, 'company')
    }
  },
  listenTo: [ContactsState.Store],
  fetch: {
    contacts() {
      return ContactsState.Store.getItems({
        fields: $y.getFields(UnclaimedCompanyDetailsModal, 'contacts'),
        company: this.props.company.get('id')
      });
    }
  },
  show() {
    this.refs.innerComponent.show();
  },
  pending() {
    return containerUtils.defaultPending(this, UnclaimedCompanyDetailsModal);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, UnclaimedCompanyDetailsModal, errors);
  }
});
