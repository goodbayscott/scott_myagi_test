import React from 'react';
import Select from 'react-select';
import Style from 'style';
import Radium from 'radium';
import _ from 'lodash';
import PublicCompaniesState from 'state/public-companies';
import PLACEHOLDER_IMAGE from 'img/placeholder.svg';

const styles = {
  companyContainer: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  selectedItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,60)'
  },
  logo: {
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'white',
    width: 45,
    height: 45,
    margin: -1,
    borderRadius: '50%',
    border: '1px solid #ccc'
  },
  companyItem: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: 260,
    margin: 5,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 50,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: Style.vars.colors.get('primary'),
    borderColor: Style.vars.colors.get('primary'),
    ':hover': {
      borderColor: Style.vars.colors.get('red')
    }
  },
  name: {
    margin: '10px 20px 10px 10px',
    color: Style.vars.colors.get('primaryFontColor')
  },
  selectContainer: {
    width: '100%',
    margin: '10px 0'
  },
  companyOptContainer: {
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  coOptLogo: {
    height: 30,
    width: 60,
    marginRight: 10,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  },
  userCount: {
    color: Style.vars.colors.get('xDarkGrey')
  }
};

@Radium
export class CompanySelect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: {}
    };
    this.debouncedFetch = _.debounce(this.doFetch, 200);
  }

  getCompanies = () => this.state.selected;

  doFetch = (search, callback, resolve) => {
    const pc = PublicCompaniesState.Store.getItems({
      limit: 10,
      search,
      ordering: '-search_rank',
      fields: ['id', 'search_rank', 'company_name', 'company_logo', 'url', 'user_count', 'region']
    });

    pc.toPromise().then(cs => {
      callback(null, {
        options: cs.toJS(),
        complete: true
      });
      resolve();
    });
  };

  loadOptions = (search, callback) => {
    if (!search) {
      return callback(null, {
        options: [],
        complete: true
      });
    }

    return new Promise((resolve, reject) => {
      this.debouncedFetch(search, callback, resolve);
    });
  };

  add = toAdd => {
    this.setState({
      ...this.state,
      selected: {
        ...this.state.selected,
        [toAdd.id]: toAdd
      }
    });
  };

  remove = toRemove => {
    const selected = { ...this.state.selected };
    delete selected[toRemove.id];
    this.setState({ ...this.state, selected });
  };

  renderCompanyOption = c => (
    <div style={styles.companyOptContainer}>
      <div
        style={{
          ...styles.coOptLogo,
          backgroundImage: `url(${c.company_logo || PLACEHOLDER_IMAGE})`
        }}
      />
      <span>
        {c.company_name} - {c.region} <span style={styles.userCount}>({c.user_count} users)</span>
      </span>
    </div>
  );

  render() {
    return (
      <div>
        <div style={styles.companyContainer}>
          {Object.keys(this.state.selected).map(id => {
            const c = this.state.selected[id];
            return (
              <div key={c.id} onClick={() => this.remove(c)} style={styles.companyItem}>
                <div
                  style={{
                    ...styles.logo,
                    backgroundImage: `url(${c.company_logo || PLACEHOLDER_IMAGE})`
                  }}
                />
                <div style={styles.name}>{c.company_name}</div>
              </div>
            );
          })}
        </div>
        <div style={styles.selectContainer}>
          <Select.Async
            name="form-field-name"
            placeholder={
              Object.keys(this.state.selected).length ? 'Add another company...' : 'Add company...'
            }
            filterOption={() => true}
            loadOptions={this.loadOptions}
            onChange={this.add}
            optionRenderer={this.renderCompanyOption}
          />
        </div>
      </div>
    );
  }
}
