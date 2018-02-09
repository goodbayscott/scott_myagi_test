import Marty from 'marty';
import React from 'react';
import { Link } from 'react-router';

import NavbarState from 'components/navbar/component-state';

import { Panel, BoxHeader, BoxContent } from 'components/common/box';

const pageStyle = {
  headingContainer: {
    paddingBottom: 0,
    // Overflow visible and minHeight required for
    // export dropdown to be visible.
    overflow: 'visible',
    minHeight: '4.2em'
  },
  heading: {
    display: 'none'
  }
};

export class Page extends React.Component {
  render() {
    return (
      <Panel>
        <BoxHeader>
          <h1>Myagi Staff Menu</h1>
        </BoxHeader>
        <BoxContent>
          <Link to="company-management">
            <div className="ui raised segment">
              Company Admin Tool -{' '}
              <span style={{ color: 'black' }}>
                Access any company and update their details, subscription status etc...
              </span>
            </div>
          </Link>
          <br />
          <Link to="user-management">
            <div className="ui raised segment">
              User Admin Tool -{' '}
              <span style={{ color: 'black' }}>
                Access any user and update their details from here
              </span>
            </div>
          </Link>
          <br />
          <Link to="channel-management">
            <div className="ui raised segment">
              Channel Admin Tool -{' '}
              <span style={{ color: 'black' }}>Make bulk channel connections and tag channels</span>
            </div>
          </Link>
          <br />
          <Link to="standards-review">
            <div className="ui raised segment">
              Company Review Tool -{' '}
              <span style={{ color: 'black' }}>
                Easily identify shell companies to update/deactivate them
              </span>
            </div>
          </Link>
          <br />
          <Link to="create-microdeck">
            <div className="ui raised segment">Create Microdeck</div>
          </Link>
          <br />
          {/* <Link to="/stats/stats_menu/" target="_blank">
            Myagi Metrics
          </Link> */}
          {/* <br />
          <a href="http://dash.myagi.com/" target="_blank">
            Myagi Geckoboard Dashboard
          </a>
          <br />
          <a href="https://app.chartmogul.com/#charts" target="_blank">
            Sales / MRR Dashboard
          </a> */}
          {/* <br /> */}
        </BoxContent>
      </Panel>
    );
  }
}
