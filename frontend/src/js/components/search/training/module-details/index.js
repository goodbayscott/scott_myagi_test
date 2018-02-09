import React from 'react';
import Im from 'immutable';
import { resolve } from 'react-router-named-routes';
import _ from 'lodash';

import { ContentPageViewer } from './content-page-viewer';
import { PrimaryButton } from 'components/common/buttons';

const styles = {
  container: {
    margin: 20
  },
  specData: {
    padding: 10
  },
  specTable: {
    display: 'block',
    maxHeight: 300,
    overflowY: 'scroll',
    marginTop: 10
  },
  videoContainer: {
    marginTop: 20
  }
};

export class ModuleDetails extends React.Component {
  static data = {
    module: {
      fields: ['id', 'training_plans.id', 'description', 'pages.type', 'pages.id']
    }
  };

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  };

  goToMod = () => {
    // use the first training plan in the training plan set.
    const firstTrainingPlan = this.props.module.get('training_plans')[0];
    this.context.router.push(resolve('new-module-attempt', {
      moduleId: this.props.module.get('id'),
      trainingPlanId: firstTrainingPlan.id
    }));
  };

  render() {
    const { module } = this.props;
    const desc = module.get('description') || <i>No description</i>;
    let firstPage = _.first(module.get('pages'));
    if (firstPage) firstPage = Im.Map(firstPage);
    return (
      <div style={styles.container}>
        <b>Description:</b>
        <p>{desc}</p>
        {firstPage && (
          <div>
            <b>Content:</b>
            <br />
            <br />
            <div style={{ marginBottom: 20 }}>
              <ContentPageViewer page={firstPage} />
            </div>
          </div>
        )}
        <PrimaryButton style={{ marginLeft: 0, marginTop: 10 }} onClick={this.goToMod}>
          Attempt this lesson
        </PrimaryButton>
      </div>
    );
  }
}
