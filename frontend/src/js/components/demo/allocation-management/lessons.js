import Marty from 'marty';
import React from 'react';

import containerUtils from 'utilities/containers';
import $y from 'utilities/yaler';

import ModulesState from 'state/modules';

import { Box, BoxContent } from 'components/common/box';
import { LoadingContainer } from 'components/common/loading';
import ModuleCards from './module-cards';

const styles = {
  pageContainer: {
    marginBottom: 40
  },
  pageHeading: {
    textAlign: 'center',
    marginBottom: 10
  },
  cardsContainer: {
    marginTop: 0
  }
};

class Page extends React.Component {
  static data = {
    modules: $y.getData(ModuleCards, 'modules', { required: false })
  };

  render() {
    return (
      <Box>
        <BoxContent style={styles.pageContainer}>
          <LoadingContainer
            loadingProps={[this.props.modules]}
            createComponent={() => (
              <div style={styles.cardsContainer}>
                <ModuleCards {...this.props} />
              </div>
            )}
          />
        </BoxContent>
      </Box>
    );
  }
}

export default Marty.createContainer(Page, {
  listenTo: [ModulesState.Store],

  fetch: {
    modules() {
      return ModulesState.Store.getItems({
        limit: 10,
        fields: $y.getFields(Page, 'modules'),
        viewable_by_user: this.props.currentUser.get('id'),
        ordering: 'name'
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
