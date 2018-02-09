import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import Radium from 'radium';
import ReactStyleTransitionGroup from 'react-style-transition-group';

import Style from 'style';

import $y from 'utilities/yaler';

import { AvatarImage } from 'components/common/avatar-images';

const WIDTH = 440;
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
    top: 128,
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
  scoreLabel: {
    position: 'relative',
    color: 'white',
    width: 45,
    lineHeight: '20px',
    marginTop: 5,
    marginLeft: 5,
    textAlign: 'center',
    borderRadius: '4px'
  },
  dropdown: {
    float: 'right',
    height: 0
  },
  dropdownIcon: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    color: 'rgba(0,0,0,0.8)',
    padding: '7px 7px 7px 12px',
    width: 35,
    height: 35,
    margin: 0,
    borderBottomLeftRadius: 27
  },
  name: {
    fontSize: '1.2rem',
    margin: '5px 0px',
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  description: {
    color: 'grey'
  },
  createdBy: {
    textAlign: 'center',
    marginBottom: 5
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
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static data = {
    module: {
      required: true,
      deactivated__isnull: true,
      fields: [
        'name',
        'id',
        'training_plans',
        'thumbnail_url',
        'description',
        'url',
        'deactivated',
        'is_attemptable',
        'successfully_completed_by_current_user',
        'personal_best_score_for_user',
        'created_by.first_name',
        'created_by.last_name',
        'training_plans.id',
        $y.getFields(AvatarImage, 'user', 'created_by')
      ]
    },
    trainingPlan: {
      fields: ['owner']
    }
  };

  static propTypes = $y.propTypesFromData(ModuleCard, {
    onTransition: React.PropTypes.func.isRequired,
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  });

  constructor() {
    super();
    this.state = {
      approved: null
    };
  }

  attemptModule = () => {
    const params = '?goToReviewOnCompletion=true';
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: this.props.module.get('id'),
      trainingPlanId: this.props.module.get('training_plans')[0].id
    }) + params);
  };

  getPercentageColor(percentage) {
    // transition from red -> yellow -> green
    const v = percentage / 100;
    const [R, G, B] = [0, 1, 2];

    let rgb = [
      1.6 * (1 - v) + 0.4, // 2*(1-v) would be normal, but we add 0.4 and reduce multiplier to make it more yellow
      2 * v,
      0.2
    ];

    rgb[R] = rgb[R] > 1 ? 1 : rgb[R];
    rgb[R] = rgb[R] < 0 ? 0 : rgb[R];
    rgb[G] = rgb[G] > 0.8 ? 0.8 : rgb[G]; // limit green to make the max green more lime

    rgb = rgb.map(c => parseInt(c * 255));
    return `rgb(${rgb.join()})`;
  }

  renderApprovalButtons() {
    if (this.state.approved) {
      return (
        <div
          style={{
            textAlign: 'center',
            color: Style.vars.colors.get('oliveGreen'),
            fontSize: 16,
            margin: '10px 0px'
          }}
        >
          This lesson has been approved and will now be viewable by enrolled users
        </div>
      );
    } else if (this.state.approved === false) {
      return (
        <div
          style={{
            textAlign: 'center',
            color: Style.vars.colors.get('errorRed'),
            fontSize: 16,
            margin: '10px 0px'
          }}
        >
          This lesson has been denied and will not be viewable by enrolled users
        </div>
      );
    }
    return (
      <div className="ui two fluid buttons" style={{ marginTop: 10, marginBottom: 10 }}>
        <div
          className="ui button"
          style={{ backgroundColor: Style.vars.colors.get('darkGrey'), color: 'white' }}
          onClick={() => this.setState({ approved: false })}
        >
          Deny
        </div>
        <div
          className="ui button"
          style={{ backgroundColor: Style.vars.colors.get('fadedGreen'), color: 'white' }}
          onClick={() => this.setState({ approved: true })}
        >
          Approve
        </div>
      </div>
    );
  }

  render() {
    const imgHover = Radium.getState(this.state, 'img', ':hover');
    return (
      <div style={styles.container}>
        <div style={styles.createdBy}>
          <AvatarImage
            style={{ marginRight: 10 }}
            user={Im.Map(this.props.module.get('created_by'))}
          />
          Created by {this.props.module.get('created_by').first_name}{' '}
          {this.props.module.get('created_by').last_name}
        </div>
        <div
          ref="img"
          className="thumbnail"
          style={{
            ...styles.img,
            backgroundImage: `url(${this.props.module.get('thumbnail_url')})`
          }}
          onClick={this.attemptModule}
        >
          <div key="play" style={styles.tickContainer}>
            <ReactStyleTransitionGroup>
              {imgHover && (
                <i
                  transitionStyles={transitionStyles}
                  style={styles.tick}
                  className="ui icon play"
                />
              )}
            </ReactStyleTransitionGroup>
          </div>
          {this.state.approved && (
            <div style={styles.tickContainer}>
              <i
                key="checkmark"
                style={{
                  ...styles.tick,
                  backgroundColor: Style.vars.colors.get('green'),
                  zIndex: 2
                }}
                className="ui icon checkmark"
              />
            </div>
          )}
        </div>
        <div onClick={this.attemptModule} style={styles.name}>
          {this.props.module.get('name')}
        </div>

        <div style={styles.description}>{this.props.module.get('description')}</div>

        {this.renderApprovalButtons()}
      </div>
    );
  }
}
