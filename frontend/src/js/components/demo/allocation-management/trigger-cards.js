import React from 'react';
import reactMixin from 'react-mixin';
import { resolve } from 'react-router-named-routes';
import pluralize from 'pluralize';

import Style from 'style';

import $y from 'utilities/yaler';

import { HeaderWithLineThrough } from 'components/common/box';
import { HoverMixin } from 'components/common/hover';
import { PrimaryButton } from 'components/common/buttons';

const styles = {
  cardContainer: {
    padding: 20,
    border: `1px solid ${Style.vars.colors.get('xDarkGrey')}`,
    borderRadius: 5,
    maxWidth: 1200,
    margin: '20px auto',
    cursor: 'pointer'
  },
  cardContainerHover: {
    backgroundColor: Style.vars.colors.get('xLightGrey')
  },
  cardContainerComplete: {
    borderColor: Style.vars.colors.get('fadedOliveGreen'),
    backgroundColor: Style.vars.colors.get('xFadedOliveGreen')
  },
  triggerName: {
    fontSize: 20,
    textAlign: 'center'
  },
  triggerTopInfo: {
    color: Style.vars.colors.get('xxDarkGrey'),
    marginBottom: 10
  },
  detailsContainer: {
    paddingLeft: 60,
    paddingRight: 40,
    paddingTop: 0
  },
  detailsHeading: {
    color: Style.vars.colors.get('darkGrey'),
    marginTop: 40
  },
  triggerDescription: {
    marginTop: 20,
    textAlign: 'center',
    color: Style.vars.colors.get('textBlack'),
    fontSize: 16
  },
  triggerImage: {
    // marginTop: 20,
    height: '10em',
    width: '100%',
    backgroundColor: Style.vars.colors.get('mediumGrey')
  },
  triggerImageSmall: {
    height: '5em'
  },
  triggerButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  triggerButton: {
    margin: 0,
    display: 'block'
  },
  nxtBtn: {
    textAlign: 'center',
    marginTop: 10,
    cursor: 'pointer',
    display: 'block',
    color: Style.vars.colors.get('textBlack')
  },
  nxtBtnHover: {
    textDecoration: 'underline'
  },
  icon: {
    fontSize: 42,
    color: Style.vars.colors.get('darkGrey'),
    marginTop: 21
  },
  triggerIcon: {
    fontSize: 50,
    color: Style.vars.colors.get('mediumGrey'),
    marginTop: 22
  },
  column: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  noLessons: {
    color: Style.vars.colors.get('errorRed')
  },
  noLessonInnerText: {
    fontSize: 16,
    marginTop: 20
  },
  briefButton: {
    display: 'block',
    marginTop: 20,
    marginBottom: 20,
    marginRight: 0,
    marginLeft: 0
  }
};

@reactMixin.decorate(HoverMixin)
class TriggerCard extends React.Component {
  static data = {
    trigger: {
      fields: ['name', 'description']
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  constructor() {
    super();
    this.state = {
      showDetails: false
    };
  }

  toggle = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  goToBriefCreation = () => {
    this.context.router.push(resolve('demo-brief-creation'));
  };

  renderDetails() {
    const { trigger } = this.props;
    return (
      <div>
        <HeaderWithLineThrough style={{ marginTop: 10 }}>Details</HeaderWithLineThrough>
        <div style={styles.detailsContainer}>
          <h4 style={styles.detailsHeading}>Event</h4>
          <div style={styles.triggerDescription}>{trigger.get('description')}</div>

          {trigger.get('teams') && (
            <div>
              <h4 style={styles.detailsHeading}>Affected Teams</h4>
              <div className="ui cards" style={{ padding: '0px 20px' }}>
                {trigger.get('teams').map(t => (
                  <div className="ui centered card">
                    <div className="content">
                      <p className="header" style={{ textAlign: 'center' }}>
                        {t.get('name')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 style={styles.detailsHeading}>Lessons Allocated</h4>
          <div className="ui centered cards" style={{ padding: '0px 20px' }}>
            {trigger.get('lessons').map(l => (
              <div className="ui card">
                <div className="content">
                  <p className="header" style={{ textAlign: 'center' }}>
                    {l.get('name')}
                  </p>
                </div>
              </div>
            ))}
            {trigger.get('lessons').count() === 0 && (
              <div>
                <div styles={Style.funcs.merge(styles.noLessonInnerText, styles.noLessons)}>
                  There are no relevant lessons for this event
                </div>
                <PrimaryButton style={styles.briefButton} onClick={this.goToBriefCreation}>
                  Create Lesson Brief
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { trigger } = this.props;
    const lessonCount = trigger.get('lessons').count();
    const cStyle = this.getHoverStyle(styles.cardContainer, styles.cardContainerHover);
    const imgStyle = styles.triggerImage;
    return (
      <div style={cStyle} onClick={this.toggle} {...this.getHoverProps()}>
        <div className="ui stackable grid">
          <div className="ui two wide column" style={styles.column}>
            <i style={styles.triggerIcon} className={`${trigger.get('icon')} icon`} />
          </div>
          <div className="ui four wide column" style={styles.column}>
            <div style={styles.triggerName}>{trigger.get('name')}</div>
          </div>
          <div className="ui four wide column" style={styles.column}>
            <i style={styles.icon} className="long arrow right icon" />
          </div>
          <div className="ui six wide column" style={styles.column}>
            <div style={Style.funcs.mergeIf(!lessonCount, styles.triggerName, styles.noLessons)}>
              {lessonCount || 'No'} {pluralize('lesson', lessonCount)} allocated
            </div>
          </div>
        </div>
        {this.state.showDetails && this.renderDetails()}
      </div>
    );
  }
}

export default class TriggerCards extends React.Component {
  static data = {
    triggers: {
      many: true,
      fields: ['id', $y.getFields(TriggerCard, 'trigger')]
    }
  };

  render() {
    return (
      <div>{this.props.triggers.map((m, i) => <TriggerCard key={m.get('id')} trigger={m} />)}</div>
    );
  }
}
