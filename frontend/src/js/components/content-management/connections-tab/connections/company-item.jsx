import React from 'react';
import Im from 'immutable';
import Style from 'style';
import Radium from 'radium';

import { ShareRow } from './share-row';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    margin: '10px 0',
    padding: 10,
    backgroundColor: 'white',
    border: '1px solid #e5e5e5',
    boxShadow: 'rgba(0,0,0,0.18) 4px 3px 20px',
    borderRadius: 2,
    width: '100%'
  },
  logo: {
    height: 50,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  titleContainer: {
    display: 'flex',
    margin: '0 10px',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ddd',
    alignItems: 'center',
    paddingBottom: 10
  },
  title: {
    fontSize: '1.4rem'
  },
  channelContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap'
  },
  subText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.8rem',
    margin: '5px 0 10px'
  }
};

@Radium
export class CompanyItem extends React.Component {
  static contextTypes = {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  shareAccepted = shareRequestId => {
    this[`shareRequest${shareRequestId}`].setAccepted(shareRequestId);
  };

  shareRejected = shareRequestId => {
    this[`shareRequest${shareRequestId}`].setRejected(shareRequestId);
  };

  render() {
    const company = this.props.company;
    return (
      <div style={styles.container}>
        <div style={styles.titleContainer}>
          <div style={styles.title}>{company.get('company_name')}</div>
          <img src={company.get('company_logo')} style={styles.logo} />
        </div>
        <div style={styles.channelContainer}>
          {company
            .get('shared_training_unit_requests')
            .map(s => (
              <ShareRow key={s.id} ref={c => (this[`shareRequest${s.id}`] = c)} share={s} />
            ))}
          {company.get('shared_training_units').map(s => <ShareRow key={s.id} share={s} />)}
        </div>
        {/* <div style={styles.subText}>
          Add channel | 0435 234 152 | contact@thiscompany.com
        </div> */}
      </div>
    );
  }
}
