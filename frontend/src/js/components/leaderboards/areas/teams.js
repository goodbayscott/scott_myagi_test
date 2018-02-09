import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';

import AreasState from 'state/areas';

import { LoadingContainer } from 'components/common/loading';
import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import Style from 'style';

import { Box, BoxHeader, BoxContent } from 'components/common/box';

import { ScrollableDataTable } from 'components/common/table';

const styles = {
  noManagers: {
    color: Style.vars.colors.get('darkGrey'),
    fontStyle: 'italic'
  }
};

class TeamsWithinAreaCollection extends React.Component {
  static data = {
    area: {
      fields: [
        'name',
        'learnergroup_set',
        'learnergroup_set.name',
        'learnergroup_set.manager_names',
        'learnergroup_set.num_users',
        'learnergroup_set.average_training_score'
      ]
    }
  };

  static tableDataMapping = {
    Team: t => <div key={t.name}>{t.name}</div>,
    'Manager(s)': t => {
      const managerNames = t.manager_names.join(', ');
      const txt = managerNames || 'No managers';
      const style = managerNames ? undefined : styles.noManagers;
      return (
        <div key={txt} style={style}>
          {txt}
        </div>
      );
    },
    'Number of Users': t => t.num_users,
    'Average Training Score': (t, cxt) => parseFloat(cxt.getTrainingScore(t)).toFixed(1),
    Rank: t => t.company_rank
  };

  getTrainingScore(e) {
    return e.average_training_score;
  }

  getDataMapping() {
    const mapping = TeamsWithinAreaCollection.tableDataMapping;
    return mapping;
  }

  getHeaders() {
    if (this.props.area) {
      return Im.List(_.keys(this.getDataMapping()));
    }
  }

  getRows() {
    if (this.props.area) {
      const funcs = _.values(this.getDataMapping());
      let teams = this.props.area.get('learnergroup_set');

      teams = _.sortBy(teams, t => -t.average_training_score);
      let idx = 0;
      return teams.map(t => {
        idx += 1;
        // Rank is not returned from the server, instead we calculate it here.
        // All teams are fetched at once, so this works
        t.company_rank = idx;
        return Im.List(funcs.map(f => f(t, this)));
      });
    }
  }

  render() {
    const headers = this.getHeaders();
    const rows = this.getRows();
    const backOpts = {
      text: 'Leaderboards',
      route: 'leaderboards'
    };
    return (
      <Box>
        <BoxHeader
          heading={this.props.area && this.props.area.get('name')}
          style={{ overflow: 'auto' }}
          backOpts={backOpts}
        />
        <BoxContent>
          <LoadingContainer
            loadingProps={[this.props.area]}
            createComponent={() => (
              <ScrollableDataTable
                headers={headers}
                rows={rows}
                bodyHeight={null}
                reformatForMobile={false}
                initialSortHeader="Rank"
                ref="table"
              />
            )}
          />
        </BoxContent>
      </Box>
    );
  }
}

export const Page = Marty.createContainer(TeamsWithinAreaCollection, {
  contextTypes: {
    routeParams: React.PropTypes.object.isRequired
  },

  propTypes: {
    currentUser: React.PropTypes.instanceOf(Im.Map).isRequired
  },

  listenTo: [AreasState.Store],

  fetch: {
    area() {
      if (!this.context.routeParams.areaId) return;
      return AreasState.Store.getItem(this.context.routeParams.areaId, {
        fields: $y.getFields(TeamsWithinAreaCollection, 'area')
      });
    }
  },

  pending() {
    return containerUtils.defaultPending(this, TeamsWithinAreaCollection);
  },

  failed(errors) {
    return containerUtils.defaultFailed(this, TeamsWithinAreaCollection, errors);
  }
});
