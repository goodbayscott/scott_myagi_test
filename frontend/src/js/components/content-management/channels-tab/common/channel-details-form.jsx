import React from 'react';
import Im from 'immutable';
import { t } from 'i18n';

import ChannelsState from 'state/channels';
import {
  Form,
  TextInput,
  TextArea,
  URLInput,
  SearchableSelect,
  SubmitButton,
  ImageCropper,
  ButtonToggle
} from 'components/common/form';
import { Info } from 'components/common/info';
import { TagSearchableMultiSelect } from 'components/common/tag-searchable-multiselect';

const PUBLIC = 'Public';
const PUBLIC_WITH_REQUEST = 'Public with request to access';
const PRIVATE = 'Private';
const YES = 'Yes';
const NO = 'No';

const ACCESSIBILITY_MAPPING = {
  [PUBLIC]: { public: true, request_to_access: false },
  [PUBLIC_WITH_REQUEST]: { public: true, request_to_access: true },
  [PRIVATE]: { public: false, request_to_access: true }
};

const ACCESSIBILITY_OPTS = [
  {
    label: PUBLIC,
    value: PUBLIC
  },
  {
    label: PUBLIC_WITH_REQUEST,
    value: PUBLIC_WITH_REQUEST
  },
  {
    label: PRIVATE,
    value: PRIVATE
  }
];

export class ChannelDetailsForm extends React.Component {
  static data = {
    channel: {
      required: true,
      fields: [
        'name',
        'description',
        'display_name',
        'logo',
        'cover_image',
        'cover_image_thumbnail',
        'company.id',
        'public',
        'request_to_access',
        'shared',
        'owners',
        'auto_add_plans_to_auto_enroll_set',
        'auto_enroll_turned_on_for_current_user_company',
        'tags',
        'video'
      ]
    }
  };

  static propTypes = {
    submitText: React.PropTypes.string,
    onChannelSaved: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired,
    currentDetails: React.PropTypes.instanceOf(Im.Map)
  };

  static defaultProps = {
    submitText: 'Submit',
    currentDetails: Im.Map()
  };

  constructor() {
    super();
    this.state = {
      loading: false
    };
  }

  onSubmitAndValid = data => {
    const accessData = ACCESSIBILITY_MAPPING[data.accessibility];
    // If this is undefined, that means that the user is on a free account,
    // and they can't control who is enrolled in a channel. Always set it to auto
    // enroll in that case.
    if (data.auto_add_plans_to_auto_enroll_set === undefined) {
      data.auto_add_plans_to_auto_enroll_set = true;
    }
    const newChannelData = {
      name: data.name,
      display_name: data.displayName,
      description: data.description,
      logo: data.logo,
      cover_image: data.coverImage,
      public: accessData.public,
      video: data.video,
      request_to_access: accessData.request_to_access,
      auto_add_plans_to_auto_enroll_set: data.auto_add_plans_to_auto_enroll_set
    };
    if (data.tags !== undefined) newChannelData.tags = data.tags;
    this.setState({ loading: true });
    let method;
    if (this.props.currentDetails && this.props.currentDetails.get('id')) {
      newChannelData.id = this.props.currentDetails.get('id');
      method = 'update';
    } else {
      method = 'create';
      newChannelData.company = this.props.currentUser.get('learner').company.url;
      newChannelData.order = 0;
    }
    ChannelsState.ActionCreators[method](newChannelData).then(res => {
      this.props.onChannelSaved(Im.Map(res.body));
    });
  };

  cleanAutoEnrollTurnedOn = val => val === YES;

  render() {
    const channel = this.props.currentDetails;
    const name = channel.get('name');
    const displayName = channel.get('display_name');
    const autoAddPlansToAutoEnrollSet =
      channel.get('auto_add_plans_to_auto_enroll_set') !== false ? YES : NO;
    const description = channel.get('description');
    const logo = channel.get('logo');
    const coverImage = channel.get('cover_image');
    const tags = channel.get('tags');
    const video = channel.get('video');

    let accessibility = PUBLIC;
    if (channel.get('public') !== undefined) {
      if (channel.get('public')) {
        if (channel.get('request_to_access')) {
          accessibility = PUBLIC_WITH_REQUEST;
        } else {
          accessibility = PUBLIC;
        }
      } else {
        accessibility = PRIVATE;
      }
    }

    return (
      <Form onSubmitAndValid={this.onSubmitAndValid}>
        <h3>{t('name')}</h3>
        <TextInput
          name="name"
          required
          initialValue={name}
          initialIsAcceptable={Boolean(name)}
          fadeInitial={false}
        />
        <h3>
          {`${t('display_name')} `} <small>{`(${t('optional')})`}</small>
          <Info content={t('display_name_info')} />
        </h3>
        <TextInput
          name="displayName"
          required={false}
          initialValue={displayName}
          initialIsAcceptable={Boolean(displayName)}
          fadeInitial={false}
        />
        <h3>
          {`${t('description')} `} <small>{`(${t('optional')})`}</small>
        </h3>
        <TextArea
          name="description"
          height="2em"
          initialValue={description}
          initialIsAcceptable={Boolean(description)}
        />
        <h3>
          {`${t('logo')} `} <small>{`(${t('optional')})`}</small>
        </h3>
        <ImageCropper name="logo" initialValue={logo} width={200} height={200} />
        <h3>
          {`${t('cover_image')} `} <small>{`(${t('optional')})`}</small>
        </h3>
        <ImageCropper
          name="coverImage"
          initialValue={coverImage}
          aspectRatio={1200 / 300}
          height={100}
          width={1200 / 300 * 100}
        />
        <h3>
          {`${t('introductory_video')} `} <small>{`(${t('optional')})`}</small>
          <Info content={t('introductory_video_info')} />
        </h3>
        <URLInput name="video" initialValue={video} initialIsAcceptable={Boolean(video)} />
        <h3>
          {`${t('accessibility')} `}
          <Info content={t('accessibility_info')} />
        </h3>
        <SearchableSelect
          name="accessibility"
          initialSelection={accessibility}
          options={ACCESSIBILITY_OPTS}
        />

        {this.props.currentUser.get('learner').company.subscription.groups_and_areas_enabled ? (
          <div style={{ marginTop: 25 }}>
            <h3>
              {`${t('auto_enroll')} `}
              <Info content={t('auto_enroll_info')} />
            </h3>
            <ButtonToggle
              name="auto_add_plans_to_auto_enroll_set"
              leftLabel={YES}
              rightLabel={NO}
              initialValue={autoAddPlansToAutoEnrollSet}
              clean={this.cleanAutoEnrollTurnedOn}
              style={{
                button: { width: '8em' }
              }}
              initialIsAcceptable
              required
            />
          </div>
        ) : null}

        <h3>
          {`${t('tags')} `}
          <Info content={t('tags_channels_info')} />
        </h3>
        <TagSearchableMultiSelect
          name="tags"
          initialSelections={tags}
          currentUser={this.props.currentUser}
          fetchOpts={{
            exclude_type: 'brand'
          }}
        />
        <SubmitButton text={this.props.submitText} loading={this.state.loading} />
      </Form>
    );
  }
}
