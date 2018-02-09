import Marty from 'marty';
import React from 'react';
import Radium from 'radium';
import Im from 'immutable';
import _ from 'lodash';
import { resolve } from 'react-router-named-routes';
import ReactStyleTransitionGroup from 'react-style-transition-group';

import Style from 'style';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';
import { PrimaryButton } from 'components/common/buttons';
import { EntitySelect } from 'components/common/card-searchable-select/entity-select';

import ModulesState from 'state/modules';
import createPaginatedStateContainer from 'state/pagination';
import PageState from '../page-state';

const WIDTH = 220;
const IMG_HEIGHT = 9 / 16 * WIDTH; // ratio should be 16:9 with width

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: WIDTH,
    margin: 15
  },
  img: {
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#111',
    height: IMG_HEIGHT,
    cursor: 'pointer',
    ':hover': {}
  },
  tickContainer: {
    width: WIDTH,
    height: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tick: {
    top: 64,
    height: '50px',
    width: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    color: Style.vars.colors.get('primaryFontColor'),
    zIndex: '3',
    backgroundColor: Style.vars.colors.get('primary')
  },
  whiteTick: {
    color: Style.vars.colors.get('primary'),
    backgroundColor: 'white',
    border: `2px solid ${Style.vars.colors.get('primary')}`
  },
  name: {
    fontSize: '1.2rem'
  }
};

const transitionStyles = {
  enter: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(0.7)',
    opacity: 0
  },
  enterActive: {
    transform: 'scale(1)',
    opacity: 1
  },
  leave: {
    transition: 'all .2s ease-in-out',
    transform: 'scale(1)',
    opacity: 1
  },
  leaveActive: {
    transform: 'scale(0.7)',
    opacity: 0
  }
};

@Radium
export class ModuleCard extends React.Component {
  static data = {
    module: {
      required: true,
      fields: [
        'name',
        'id',
        'thumbnail_url',
        'training_plans',
        'description',
        'url',
        'deactivated',
        'search_rank'
      ]
    }
  };

  onCardClick = () => {
    this.props.onCardClick(this.props.entity);
  };

  render() {
    let selected = false;
    if (this.props.selectedEntities) {
      selected = _.includes(this.props.selectedEntities, this.props.entity.get('url'));
    }

    return (
      <div style={styles.container}>
        <div
          onClick={this.onCardClick}
          ref="img"
          className="thumbnail"
          style={{
            ...styles.img,
            backgroundImage: `url(${this.props.entity.get('thumbnail_url')})`
          }}
        >
          <div key="play" style={styles.tickContainer}>
            <ReactStyleTransitionGroup>
              {Radium.getState(this.state, 'img', ':hover') && (
                <i
                  transitionStyles={transitionStyles}
                  style={{ ...styles.tick, ...styles.whiteTick }}
                  className="ui icon checkmark"
                />
              )}
            </ReactStyleTransitionGroup>
          </div>

          <div key="select" style={styles.tickContainer}>
            <ReactStyleTransitionGroup>
              {selected && (
                <i
                  transitionStyles={transitionStyles}
                  style={styles.tick}
                  className="ui icon checkmark"
                />
              )}
            </ReactStyleTransitionGroup>
          </div>
        </div>
        <div onClick={this.attemptModule} style={styles.name}>
          {this.props.entity.get('name')}
        </div>
      </div>
    );
  }
}

export const ModuleCardSelect = createPaginatedStateContainer(EntitySelect, {
  listenTo: [ModulesState.Store, PageState.Store],

  contextTypes: {
    router: React.PropTypes.object.isRequired
  },

  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  getInitialState() {
    return {
      innerComponent: null
    };
  },

  isValid() {
    const ic = PageState.Store.getEntitySelectComponent();
    if (!ic) return true;
    return ic.isValid();
  },

  getSelectedEntitiesArray() {
    return PageState.Store.getSelectedEntities().toArray();
  },

  getNameAndValue() {
    const ic = PageState.Store.getEntitySelectComponent();
    return ic.getNameAndValue();
  },

  onPrimaryButtonClick(data) {
    // Hide lesson select modal, otherwise an overlay will be present.
    if (this.props.hide) this.props.hide();
    this.context.router.push(resolve('create-module', {
      currentUser: this.props.currentUser
    }));
  },

  createPrimaryButton() {
    // If showCreateLesson is true, there will be a button to optionally
    // create a new lesson instead of selecting an existing one. This elliminates
    // the need for a select existing / create new dropdown option. Used in
    // content management views.
    if (!this.props.showCreateLesson) return null;
    return (
      <PrimaryButton onClick={this.onPrimaryButtonClick} style={{}}>
        Create new lesson
      </PrimaryButton>
    );
  },

  paginate: {
    store: ModulesState.Store,
    propName: 'entities',
    limit: 12,
    getQuery() {
      let query = {
        ordering: 'name',
        deactivated__isnull: true,
        fields: $y.getFields(ModuleCard, 'module')
      };
      const search = PageState.Store.getEntitySearch();
      if (search) {
        query.search = search;
        query.ordering = '-search_rank';
      }
      if (!this.props.currentUser.get('learner').can_view_all_training_content) {
        // if learner cannot view all training content (setting on comany, or
        // user is admin of any type), then limit module search to modules they
        // can attempt.
        query = _.extend({ viewable_by_user: this.props.currentUser.get('id') }, query);
      }
      if (this.props.fetchOpts) {
        _.extend(query, this.props.fetchOpts);
      }
      return query;
    }
  },
  done(results) {
    return (
      <EntitySelect
        registerComponent={this.registerComponent}
        {...this.props}
        {...results}
        entityName="lesson"
        cardComponent={ModuleCard}
        createPrimaryButton={this.createPrimaryButton}
      />
    );
  },
  pending() {
    return containerUtils.defaultPending(this, EntitySelect);
  },
  failed(errors) {
    return containerUtils.defaultFailed(this, EntitySelect, errors);
  }
});
