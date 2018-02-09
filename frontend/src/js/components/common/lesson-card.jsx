import React from 'react';
import Radium from 'radium';
import ReactStyleTransitionGroup from 'react-style-transition-group';

import { orderingStyles } from 'components/common/ordering';
import Style from 'style';
import { Dropdown } from 'components/common/dropdown';

import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const WIDTH = 220;
const IMG_HEIGHT = 9 / 16 * WIDTH; // ratio should be 16:9 with width
const PADDING = 5;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: PADDING,
    margin: 15,
    width: WIDTH + PADDING * 2,
    transition: '0.2s ease-in all'
  },
  img: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#111',
    height: IMG_HEIGHT,
    width: WIDTH,
    ':hover': {}
  },
  imgHover: {
    cursor: 'pointer'
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
    fontSize: '1.2rem'
  },
  needsContentWarning: {
    color: Style.vars.colors.get('errorRed')
  },
  nameHover: {
    cursor: 'pointer',
    ':hover': {
      textDecoration: 'underline'
    }
  },
  description: {
    color: 'grey'
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
export class LessonCard extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    icon: 'play',
    clickable: true,
    sizeMultiplier: null
  };

  static data = {
    module: {
      required: true,
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
        'personal_best_score_for_user'
      ]
    }
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

  render() {
    const imgHover = Radium.getState(this.state, 'img', ':hover');
    const onClick = this.props.clickable ? this.props.onClick : null;
    const sizeMultiplier = this.props.sizeMultiplier;
    return (
      <div
        className="lesson-card"
        style={[
          styles.container,
          sizeMultiplier && { width: styles.container.width * sizeMultiplier },
          this.props.highlight && orderingStyles.highlight,
          this.props.clickable && styles.imgHover
        ]}
      >
        {!this.props.highlight &&
          this.props.dropdownItems &&
          this.props.dropdownItems.length > 0 && (
            <Dropdown className="ui pointing top right dropdown" style={styles.dropdown}>
              <i
                className="icon ellipsis vertical"
                style={styles.dropdownIcon}
                key="dropdownIcon"
              />
              <div className="menu">
                {this.props.dropdownItems.map(i => (
                  <div key={i.label} className="item" onClick={i.action}>
                    {i.label}
                  </div>
                ))}
              </div>
            </Dropdown>
          )}

        <div
          ref="img"
          className="thumbnail"
          style={[
            styles.img,
            {
              backgroundImage: `url(${this.props.module.get('thumbnail_url') || PLACEHOLDER_IMAGE})`
            },
            sizeMultiplier && {
              width: styles.img.width * sizeMultiplier,
              height: styles.img.height * sizeMultiplier
            },
            this.props.highlight && orderingStyles.moveable
          ]}
          onClick={onClick}
        >
          <div
            key="hoverIcon"
            style={[
              styles.tickContainer,
              sizeMultiplier && { width: styles.tickContainer.width * sizeMultiplier }
            ]}
          >
            <ReactStyleTransitionGroup>
              {imgHover &&
                !this.props.highlight &&
                this.props.clickable && (
                  <i
                    transitionStyles={transitionStyles}
                    style={styles.tick}
                    className={`ui icon ${this.props.icon}`}
                  />
                )}
            </ReactStyleTransitionGroup>
          </div>
          {!this.props.hideCompletionPercentage &&
            this.props.module.get('successfully_completed_by_current_user') && (
              <div
                style={[
                  styles.tickContainer,
                  sizeMultiplier && { width: styles.tickContainer.width * sizeMultiplier }
                ]}
              >
                <i
                  key="checkmark"
                  style={{
                    ...styles.tick,
                    backgroundColor: this.getPercentageColor(100),
                    zIndex: 2
                  }}
                  className="ui icon checkmark"
                />
              </div>
            )}

          {!this.props.hideCompletionPercentage &&
            this.props.module.get('personal_best_score_for_user') > 0 && (
              <div
                style={{
                  ...styles.scoreLabel,
                  backgroundColor: this.getPercentageColor(this.props.module.get('personal_best_score_for_user'))
                }}
              >
                {parseInt(this.props.module.get('personal_best_score_for_user'))}%
              </div>
            )}
        </div>
        <div
          onClick={onClick}
          style={[
            styles.name,
            this.props.highlight && orderingStyles.moveable,
            imgHover && this.props.clickable && styles.nameHover[':hover'],
            this.props.clickable && styles.nameHover
          ]}
        >
          {this.props.module.get('name')}
        </div>
      </div>
    );
  }
}
