import Marty from 'marty';
import React from 'react';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import { t } from 'i18n';

import $y from 'utilities/yaler';
import containerUtils from 'utilities/containers';

import Style from 'style';

import TagsState from 'state/tags';
import PageState from './page-state';
import CompaniesState from 'state/companies';

import {
  Box,
  BoxHeader,
  BoxContent,
  InfoHeader,
  HeaderWithLineThrough
} from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { FinishedSelectingButton } from 'components/common/buttons';
import { HoverMixin } from 'components/common/hover';

const styles = {
  desc: {
    textAlign: 'center'
  },
  tagsContainer: {
    textAlign: 'center'
  },
  optionContainer: {
    position: 'relative',
    padding: 10,
    backgroundColor: Style.vars.colors.get('xDarkGrey'),
    cursor: 'pointer',
    color: 'white',
    display: 'inline-block',
    margin: 3,
    ...Style.funcs.makeTransitionAll()
  },
  optionHover: {
    textDecoration: 'underline'
  },
  selectedOptionContainer: {
    backgroundColor: Style.vars.colors.get('green')
  },
  container: {
    marginBottom: '1em'
  },
  removeIcon: {
    fontSize: 10,
    position: 'absolute',
    top: 2,
    right: -2,
    cursor: 'pointer'
  },
  divHeader: {
    marginTop: 60,
    marginBottom: 20
  }
};

@reactMixin.decorate(HoverMixin)
class TagItem extends React.Component {
  static data = {
    tag: {
      fields: ['name']
    }
  };

  toggle = () => {
    PageState.ActionCreators.toggleTagSelection(this.props.tag);
  };

  render() {
    const isSelected = this.props.tag.get('is_selected');
    let style = Style.funcs.mergeIf(
      isSelected,
      styles.optionContainer,
      styles.selectedOptionContainer
    );
    style = this.getHoverStyle(style, styles.optionHover);
    return (
      <div {...this.getHoverProps()} style={style} onClick={this.toggle}>
        {this.props.tag.get('name')}
      </div>
    );
  }
}

class TagCollection extends React.Component {
  static data = {
    tags: {
      many: true,
      required: true,
      fields: $y.getFields(TagItem, 'tag')
    }
  };

  render() {
    const items = this.props.tags.map(t => <TagItem id={t.get('id')} tag={t} />).toArray();
    return <div style={styles.tagsContainer}>{items}</div>;
  }
}

class TagCompanyPage extends React.Component {
  static data = {
    tags: {
      many: true,
      require: false,
      fields: ['type', $y.getFields(TagCollection, 'tags')]
    }
  };

  static propTypes = $y.propTypesFromData(TagCompanyPage);

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      loading: false
    };
  }

  finishSelecting = () => {
    this.setState({ loading: true });
    let showDiscovery = true;
    const co = this.props.currentUser.get('learner').company;
    // If company signed up via link with join attributes, and that link
    // contained channels, then take them straight to training so they can
    // see that content. They can always revisit the discovery page later.
    if (co.join_attributes) {
      if (co.join_attributes.channels && co.join_attributes.channels.length) {
        showDiscovery = false;
      }
    }
    CompaniesState.ActionCreators.update(this.props.currentUser.get('learner').company.id, {
      tags: PageState.Store.getSelectedTags()
        .map(t => t.get('url'))
        .toArray()
    }).then(() => {
      if (showDiscovery) {
        this.context.router.push(resolve('channel-discovery'));
      } else {
        this.context.router.push(resolve('training'));
      }
    });
  };

  render() {
    let tags = this.props.tags;
    if (tags) {
      tags = this.props.tags.map(t => {
        if (PageState.Store.isTagSelected(t)) {
          t = t.set('is_selected', true);
        } else {
          t = t.set('is_selected', false);
        }
        return t;
      });
      // Only show `general` tags for now...brand and country tags
      // have been deprecated.
      tags = tags.filter(t => t.get('type') === 'general');
    }
    return (
      <Box>
        <BoxHeader heading={t('select_your_interests')}>
          <FinishedSelectingButton onClick={this.finishSelecting} loading={this.state.loading} />
        </BoxHeader>
        <BoxContent>
          <p style={styles.desc}>{t('select_your_interests_info')}</p>
          <LoadingContainer
            loadingProps={[tags]}
            createComponent={() => <TagCollection {...this.props} tags={tags} />}
          />
          {/* <HeaderWithLineThrough style={styles.divHeader}>Brands</HeaderWithLineThrough>
          <LoadingContainer
            loadingProps={[tags]}
            createComponent={()=>{
              return <TagCollection {...this.props} tags={brandTags} />;
            }}
          /> */}
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(TagCompanyPage, {
  listenTo: [TagsState.Store, PageState.Store],

  fetch: {
    tags() {
      return TagsState.Store.getItems({
        limit: 0,
        ordering: 'name',
        fields: $y.getFields(TagCompanyPage, 'tags')
      });
    }
  },

  componentWillMount() {
    PageState.Store.resetState(this.props.currentUser);
  },

  pending() {
    return containerUtils.defaultPending(this, TagCompanyPage);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TagCompanyPage, errors);
  }
});
