import React from 'react';
import Im from 'immutable';
import Style from 'style';
import { t } from 'i18n';

export class ReportIssue extends React.Component {
  static propTypes = {
    module: React.PropTypes.instanceOf(Im.Map).isRequired
  };

  openIntercom = () => {
    const { module } = this.props;
    const content = `Hi Myagi team. There is an issue with this lesson.
    Lesson Id: ${module.get('id')}
    Lesson Name: ${module.get('name')}

    (* Please explain in detail what the issue is, as this will help us find and resolve it faster *)
    `;
    if (window.Intercom) {
      window.Intercom('showNewMessage', content);
    }
  };

  render() {
    return (
      <div style={this.props.style}>
        <span onClick={this.openIntercom} style={{ cursor: 'pointer' }}>
          <i className="warning circle icon" />
          {t('report_an_issue')}
        </span>
      </div>
    );
  }
}
