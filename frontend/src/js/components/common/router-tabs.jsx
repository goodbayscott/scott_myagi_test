import React from 'react';
import Radium from 'radium';
import { Link } from 'react-router';
import { t } from 'i18n';
import Style from 'style';

const styles = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  hide: {
    opacity: 0
  },
  item: {
    marginBottom: 10,
    padding: '10px 20px',
    transition: 'all 0.3s ease',
    borderWidth: 3,
    borderBottomStyle: 'solid',
    borderColor: 'rgba(0,0,0,0)',
    ':hover': {
      borderColor: '#eee',
      color: 'black'
    }
  },
  itemActive: {
    borderColor: Style.vars.colors.get('primary'),
    color: 'black'
  },
  link: {
    transition: 'all 0.3s ease',
    color: 'grey',
    display: 'block'
  },
  indicator: {
    marginLeft: '1em'
  }
};

@Radium
export class RouterTabs extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  render() {
    return (
      <div style={{ ...styles.container, ...this.props.style }}>
        {this.props.tabs.map(tab => {
          const active = this.context.router.isActive(tab.to);
          return (
            <Link style={styles.link} to={tab.to} key={tab.to}>
              <div
                style={{
                  ...styles.item,
                  ...(active && styles.itemActive),
                  ...(active && this.props.itemActiveStyle)
                }}
                key={tab.to}
              >
                {tab.name}
                {// If HeaderTabs are passed an object with an `indicator` key that
                // contains an array of tab names, a little dot will appear next
                // to the tab name. See components/content-management/channels-tab/page.jsx for an example.
                  this.props.indicator && this.props.indicator.includes(tab.name) ? (
                    <div className="ui orange empty circular mini label" style={styles.indicator} />
                  ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }
}
