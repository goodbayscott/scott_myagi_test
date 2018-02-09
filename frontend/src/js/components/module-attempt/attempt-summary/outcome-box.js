import React from 'react';
import _ from 'lodash';
import { t } from 'i18n';
import Style from 'style';
import $y from 'utilities/yaler';

const styles = {
  successful: {
    backgroundColor: Style.vars.colors.get('green')
  },
  failed: {
    backgroundColor: Style.vars.colors.get('errorRed')
  },
  box: {
    padding: '20px',
    width: '100%'
  },
  mainCenterText: {
    fontSize: '2em',
    color: 'white',
    textAlign: 'center',
    textTransform: 'uppercase',
    display: 'block',
    margin: 0
  },
  allCompleteText: {
    fontSize: '1.2em',
    color: 'white',
    textAlign: 'center',
    fontWeight: 'normal',
    display: 'block',
    margin: '10px'
  }
};

export default class OverallOutcomeBox extends React.Component {
  static data = {
    moduleAttempt: {
      fields: [
        'is_successful',
        'percentage_score',
        'training_plan.name',
        'training_plan.modules.successfully_completed_by_current_user'
      ]
    }
  };

  static propTypes = $y.propTypesFromData(OverallOutcomeBox);

  isSuccessful = () => this.props.moduleAttempt.get('is_successful');

  allModulesComplete = () => {
    const modules = this.props.moduleAttempt.get('training_plan').modules;
    let allComplete = true;
    _.each(modules, mod => {
      if (!mod.successfully_completed_by_current_user) allComplete = false;
    });
    return allComplete;
  };

  render() {
    const successful = this.isSuccessful();
    const boxStyle = successful
      ? Style.funcs.merge(styles.box, styles.successful)
      : Style.funcs.merge(styles.box, styles.failed);
    const centerText = successful ? t('passed') : t('try_again');
    const icon = successful ? 'checkmark' : 'remove';
    let allModsCompleteText;
    if (successful && this.allModulesComplete()) {
      const tpName = this.props.moduleAttempt.get('training_plan').name;
      allModsCompleteText = t('congratulations_you_have_completed_all_lessons', {
        planName: tpName
      });
    }
    return (
      <div style={boxStyle}>
        <h1 className="ui inverted icon header" style={styles.mainCenterText}>
          <i className={`${icon} icon`} />
          {centerText}
        </h1>
        {allModsCompleteText ? (
          <h2 className="completed-text" style={styles.allCompleteText}>
            {allModsCompleteText}
          </h2>
        ) : null}
      </div>
    );
  }
}
