import React from 'react';
import Im from 'immutable';
import Style from 'style';
import Radium from 'radium';
import { t } from 'i18n';
import { Dropdown } from 'components/common/dropdown';
import { Link } from 'react-router';
import { resolve } from 'react-router-named-routes';

import PLACEHOLDER_IMAGE from 'img/placeholder.svg';
import { SharelinkModal } from './sharelink-modal';
import LinksState from 'state/links';
import { Modal } from 'components/common/modal/index.jsx';
import MENU from '../common/menu.svg';

const SHARELINK_URL = 'https://myagi.com/s/';

const COMPRESS_LAYOUT = '@media screen and (max-width: 500px)';

const styles = {
  containerOuter: {
    display: 'flex',
    alignItems: 'center',
    padding: 20
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: 300
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 20,
    marginRight: 20,
    [COMPRESS_LAYOUT]: {
      display: 'none'
    }
  },
  logo: {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1px solid black',
    marginBottom: -20
  },
  channelName: {
    color: 'black',
    ':hover': {
      transform: 'translate(5px,0px) scale(1.02)',
      transition: 'all 0.2s'
    }
  },
  url: {
    color: '#33b',
    fontSize: '0.9rem'
  },
  menu: {
    height: 25,
    marginLeft: 10
  }
};

@Radium
export class SharelinkItem extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  delete = () => {
    LinksState.ActionCreators.update(this.props.sharelink.get('id'), {
      active: false
    });
  };

  render() {
    const sharelink = this.props.sharelink;

    return (
      <div style={styles.containerOuter}>
        <div style={styles.logoContainer}>
          {sharelink.get('channels').map((c, i) => (
            <div
              key={i}
              style={{
                ...styles.logo,
                backgroundImage: `url(${c.logo || PLACEHOLDER_IMAGE})`
              }}
            />
          ))}
        </div>

        <div style={styles.textContainer}>
          {sharelink.get('channels').map((c, i) => (
            <Link to={resolve('channel', { channelId: c.id })} key={i}>
              <div style={styles.channelName} key={`sdf${i}`}>
                {c.name}
              </div>
            </Link>
          ))}
          <div style={styles.url}>{`${SHARELINK_URL + sharelink.get('name')}`}</div>
        </div>

        <Dropdown className="ui pointing top right dropdown" style={styles.dropdown}>
          <img src={MENU} style={styles.menu} key="dropdownIcon" />
          <div className="menu">
            <div key="edit" className="item" onClick={() => this.refs.sharelinkModal.show()}>
              Edit
            </div>
            <div key="delete" className="item" onClick={() => this.refs.deleteModal.show()}>
              Delete
            </div>
          </div>
        </Dropdown>

        <SharelinkModal
          ref="sharelinkModal"
          sharelink={sharelink}
          channels={this.props.allChannels}
        />
        <Modal
          ref="deleteModal"
          header="Are you sure you want to delete this sharelink?"
          content="If you have given this link to anyone, it will no longer work."
          onConfirm={this.delete}
          basic
        />
      </div>
    );
  }
}
