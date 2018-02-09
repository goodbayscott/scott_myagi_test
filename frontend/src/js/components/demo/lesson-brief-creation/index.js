import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import moment from 'moment-timezone';
import { resolve } from 'react-router-named-routes';
import reactMixin from 'react-mixin';
import ReactStyleTransitionGroup from 'react-style-transition-group';
import Radium from 'radium';

import createPaginatedStateContainer from 'state/pagination';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import UsersState from 'state/users';

import { Panel, BoxHeader, BoxContent } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import { Form, FieldHeader, TextArea, SubmitButton } from 'components/common/form';
import { AvatarImage } from 'components/common/avatar-images';
import { Modal } from 'components/common/modal';

const WIDTH = 220;
const IMG_HEIGHT = 9 / 16 * WIDTH; // ratio should be 16:9 with width

const styles = {
  container: {
    maxWidth: 800,
    margin: '0 auto'
  },
  cardContainer: {
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
    top: -68,
    // left: -38,
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
    backgroundColor: Style.vars.colors.get('primaryFontColor'),
    border: `2px solid ${Style.vars.colors.get('primary')}`
  },
  name: {
    fontSize: '1.2rem',
    textAlign: 'center',
    marginTop: 10
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
class Page extends React.Component {
  static data = {
    users: {
      fields: ['id', 'first_name', 'last_name', 'learner.profile_photo']
    }
  };
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };
  constructor() {
    super();
    this.state = {
      selectedUserIds: []
    };
  }
  componentWillReceiveProps(newProps) {
    if (!this.props.users && newProps.users && newProps.users.count()) {
      this.setState({ selectedUserIds: newProps.users.map(u => u.get('id')).toArray() });
    }
  }
  onCardClick = user => {
    if (_.includes(this.state.selectedUserIds, user.get('id'))) {
      this.state.selectedUserIds = _.filter(this.state.selectedUserIds, i => i != user.get('id'));
    } else {
      this.state.selectedUserIds.push(user.get('id'));
    }
    this.setState({ selectedUserIds: this.state.selectedUserIds });
  };
  renderRecipient = user => {
    const selected = _.includes(this.state.selectedUserIds, user.get('id'));
    return (
      <div style={styles.cardContainer}>
        <AvatarImage
          size="10em"
          user={user}
          onClick={() => this.onCardClick(user)}
          style={{
            margin: '0 auto',
            marginBottom: 0,
            marginRight: 'auto',
            cursor: 'pointer'
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
        </AvatarImage>
        <div onClick={this.attemptModule} style={styles.name}>
          {user.get('first_name')} {user.get('last_name')}
        </div>
      </div>
    );
  };

  onSubmit = data => {
    this.state.selectedUserIds.forEach(i =>
      UsersState.ActionCreators.doDetailAction(i, 'demo_send_lesson_brief', {
        message: data.brief
      }));
    this.refs.modal.show();
  };

  goToApproval = () => {
    this.refs.modal.hide();
    this.context.router.push(`${resolve('demo-allocation-management')}?tab=Review`);
  };

  render() {
    return (
      <Panel>
        {/* <BoxHeader heading="Create Brief" /> */}
        <BoxContent style={styles.container}>
          <Form onSubmitAndValid={this.onSubmit}>
            <FieldHeader required>The brief</FieldHeader>
            <TextArea
              required
              name="brief"
              placeholder="Describe the content you want to be created..."
            />
            <FieldHeader required style={{ marginTop: 20 }}>
              Recipients
            </FieldHeader>
            <LoadingContainer
              loadingProps={[this.props.users]}
              createComponent={() => (
                <div className="ui cards" style={{ alignItems: 'center' }}>
                  {this.props.users.map(this.renderRecipient)}
                </div>
              )}
            />
            <SubmitButton />
          </Form>
        </BoxContent>
        <Modal ref="modal" basic message>
          <div className="header">Your brief has been sent</div>
          <div className="content">We will update you as responses to this brief are created.</div>
          <div className="actions">
            <div className="one fluid ui inverted buttons">
              <div
                id="modal-confirm"
                className="ui basic inverted button"
                onClick={this.goToApproval}
              >
                View responses
              </div>
            </div>
          </div>
        </Modal>
      </Panel>
    );
  }
}

export default Marty.createContainer(Page, {
  contextTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },
  listenTo: [UsersState.Store],
  fetch: {
    users() {
      return UsersState.Store.getItems({
        limit: 12,
        exclude_fake_users: true,
        exclude__id: this.context.currentUser.get('id'),
        ordering: '-id',
        fields: $y.getFields(Page, 'users')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, Page);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, Page, errors);
  }
});
