import Marty from 'marty';
import React from 'react';
import Im from 'immutable';
import _ from 'lodash';
import cx from 'classnames';
import moment from 'moment-timezone';
import reactMixin from 'react-mixin';

import Style from 'style';

import ModulesState from 'state/modules';

import { Panel, BoxHeader, BoxContent } from 'components/common/box';

import { Form, NumberInput, URLInput, FieldHeader, SubmitButton } from 'components/common/form';

export default class Page extends React.Component {
  constructor() {
    super();
    this.state = { loading: false };
  }
  onSubmit = data => {
    this.setState({ loading: true });
    ModulesState.ActionCreators.doDetailAction(data.module_id, 'create_microdeck_from_gspread', {
      spreadsheet_url: data.spreadsheet_url
    })
      .then(() => {
        this.setState({ loading: false });
      })
      .catch(res => {
        window.alert(`There was an error while creating this microdeck. Error:\n\n${res}`);
        this.setState({ loading: false });
      });
  };

  render() {
    return (
      <Panel>
        <BoxHeader>Create Microdeck</BoxHeader>
        <BoxContent>
          Instructions:
          <ol>
            <li>
              Create a new spreadsheet based on this{' '}
              <a
                target="_blank"
                href="https://docs.google.com/spreadsheets/d/1RkPpT1NKZppCn4NOS65uDACJV6pZid0O-ETgqLODL8Q/edit"
              >
                template
              </a>
              .
            </li>
            <li>Create your microdeck content using that format.</li>
            <li>
              Share the microdeck spreadsheet with drive-access@myagi-app.iam.gserviceaccount.com
              (this is important...the process won't work otherwise).
            </li>
            <li>Create a new lesson and add it to a plan.</li>
            <li>
              When you are asked to create content for the lesson, just add a "Snippet" page. Use
              www.google.com as the address for the snippet.
            </li>
            <li>
              Add a single question with the text "TEMP". It doesn't matter what value you choose
              for the answer.
            </li>
            <li>Finish the lesson creation process and hit "Start Lesson".</li>
            <li>
              Now, get the lesson ID from the URL. The ID is the last number in the URL. For
              example, if the URL is
              https://myagi.com/views/training_plans/6940/modules/19023/attempts/new/ then the
              lesson ID would be 19023.
            </li>
            <li>
              Enter the lesson ID into the box below and the URL of the Google spreadsheet you used
              to create the microdeck content.
            </li>
            <li>
              Hit submit. The content of the lesson will be overwrriten with the microdeck content
              (make sure you get the correct lesson ID so you don't wipe valuable content).
            </li>
            <li>
              Try attempting the lesson. It should have the microdeck content from the spreadsheet.
            </li>
            <li>
              If you need to update the microdeck, just use the same lesson ID (i.e. don't create a
              new lesson), update the spreadsheet and hit submit again.
            </li>
          </ol>
          <Form onSubmitAndValid={this.onSubmit}>
            <FieldHeader required>Lesson ID</FieldHeader>
            <NumberInput name="module_id" required />
            <FieldHeader required>Google Spreadsheet URL</FieldHeader>
            <URLInput name="spreadsheet_url" required />
            <SubmitButton loading={this.state.loading} />
          </Form>
        </BoxContent>
      </Panel>
    );
  }
}
